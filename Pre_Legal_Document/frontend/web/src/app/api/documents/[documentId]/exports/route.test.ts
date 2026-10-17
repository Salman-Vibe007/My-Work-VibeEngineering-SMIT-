import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { prisma } from '@prelegal/database'
import { POST } from './route'

const mocks = vi.hoisted(() => {
  const queueAdd = vi.fn()
  const queueClose = vi.fn()
  const redisQuit = vi.fn()
  return {
    auth: vi.fn(),
    documentFindFirst: vi.fn(),
    jobCreate: vi.fn(),
    jobUpdate: vi.fn(),
    queueAdd,
    queueClose,
    redisQuit,
    Queue: vi.fn().mockImplementation(() => ({ add: queueAdd, close: queueClose })),
    Redis: vi.fn().mockImplementation(() => ({ quit: redisQuit })),
  }
})

vi.mock('../../../../../lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@prelegal/database', () => ({
  prisma: {
    document: { findFirst: mocks.documentFindFirst },
    generationJob: { create: mocks.jobCreate, update: mocks.jobUpdate },
  },
}))
vi.mock('bullmq', () => ({ Queue: mocks.Queue }))
vi.mock('ioredis', () => ({ default: mocks.Redis }))

const schema = {
  id: 'service-agreement',
  version: 1,
  title: 'Service Agreement',
  category: 'business',
  jurisdiction: { country: 'US' },
  fields: [{ name: 'client', label: 'Client', type: 'text', required: true }],
  sections: [{ id: 'parties', title: 'Parties', content: '{{client}}', order: 0 }],
}

function request(body: unknown) {
  return new NextRequest('http://localhost/api/documents/doc-1/exports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/documents/[documentId]/exports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('REDIS_URL', 'redis://localhost:6379')
    mocks.auth.mockResolvedValue({ user: { id: 'owner-1' } })
    mocks.documentFindFirst.mockResolvedValue({
      id: 'doc-1',
      title: 'Acme terms',
      template: { slug: 'service-agreement', title: 'Service Agreement', category: 'BUSINESS' },
      templateVersion: {
        version: 1,
        schema,
        jurisdictionCountry: 'US',
        jurisdictionRegion: null,
      },
      currentVersion: { formData: { client: 'Acme' } },
    })
    mocks.jobCreate.mockResolvedValue({ id: 'job-1', status: 'PENDING', createdAt: new Date() })
    mocks.queueAdd.mockResolvedValue({})
    mocks.queueClose.mockResolvedValue(undefined)
    mocks.redisQuit.mockResolvedValue('OK')
  })

  it('requires authentication before reading the document', async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await POST(request({ format: 'pdf' }), { params: { documentId: 'doc-1' } })

    expect(response.status).toBe(401)
    expect(mocks.documentFindFirst).not.toHaveBeenCalled()
  })

  it('rejects unsupported formats without creating a job', async () => {
    const response = await POST(request({ format: 'txt' }), { params: { documentId: 'doc-1' } })

    expect(response.status).toBe(400)
    expect(mocks.jobCreate).not.toHaveBeenCalled()
  })

  it('requires Redis before creating an export job', async () => {
    vi.stubEnv('REDIS_URL', '')

    const response = await POST(request({ format: 'pdf' }), { params: { documentId: 'doc-1' } })

    expect(response.status).toBe(503)
    expect(mocks.documentFindFirst).not.toHaveBeenCalled()
  })

  it('blocks exports until all required fields are filled', async () => {
    mocks.documentFindFirst.mockResolvedValue({
      id: 'doc-1',
      title: 'Acme terms',
      template: { slug: 'service-agreement', title: 'Service Agreement', category: 'BUSINESS' },
      templateVersion: { version: 1, schema, jurisdictionCountry: 'US', jurisdictionRegion: null },
      currentVersion: { formData: {} },
    })

    const response = await POST(request({ format: 'pdf' }), { params: { documentId: 'doc-1' } })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ missingFields: ['client'] })
    expect(mocks.jobCreate).not.toHaveBeenCalled()
  })

  it('creates an export job and enqueues it for the worker', async () => {
    const response = await POST(request({ format: 'pdf' }), { params: { documentId: 'doc-1' } })

    expect(response.status).toBe(202)
    expect(mocks.documentFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'doc-1', ownerId: 'owner-1', deletedAt: null },
    }))
    expect(mocks.jobCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ documentId: 'doc-1', type: 'PDF_GENERATION' }),
    }))
    expect(mocks.Queue).toHaveBeenCalledWith('document-generation', expect.any(Object))
    expect(mocks.queueAdd).toHaveBeenCalledWith(
      'generate-document',
      { generationJobId: 'job-1' },
      { jobId: 'job-1' }
    )
    expect(mocks.queueClose).toHaveBeenCalledOnce()
    expect(mocks.redisQuit).toHaveBeenCalledOnce()
  })

  it('marks the job failed if Redis cannot enqueue it', async () => {
    mocks.queueAdd.mockRejectedValue(new Error('Redis unavailable'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await POST(request({ format: 'docx' }), { params: { documentId: 'doc-1' } })

    expect(response.status).toBe(503)
    expect(mocks.jobUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'job-1' },
      data: expect.objectContaining({ status: 'FAILED', error: 'Redis unavailable' }),
    }))
    expect(errorSpy).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })
})
