import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, GET, PATCH } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  versionCreate: vi.fn(),
  documentUpdate: vi.fn(),
}))

vi.mock('../../../../lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@prelegal/database', () => ({
  prisma: {
    document: { findFirst: mocks.findFirst, updateMany: mocks.updateMany },
    $transaction: mocks.transaction,
  },
}))

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
  return new NextRequest('http://localhost/api/documents/doc-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const context = { params: { documentId: 'doc-1' } }

describe('/api/documents/[documentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'owner-1' } })
    mocks.findFirst.mockResolvedValue({
      id: 'doc-1',
      title: 'Service terms',
      template: { title: 'Service Agreement', slug: 'service-agreement', category: 'BUSINESS' },
      templateVersion: {
        version: 1,
        schema,
        jurisdictionCountry: 'US',
        jurisdictionRegion: null,
      },
      currentVersion: { version: 2, formData: { client: 'Acme' } },
    })
    mocks.versionCreate.mockResolvedValue({ id: 'version-3' })
    mocks.documentUpdate.mockResolvedValue({
      id: 'doc-1',
      currentVersion: { version: 3, formData: { client: 'New client' }, content: [] },
    })
    mocks.transaction.mockImplementation((callback) => callback({
      documentVersion: {
        findFirst: vi.fn().mockResolvedValue({ version: 2 }),
        create: mocks.versionCreate,
      },
      document: { update: mocks.documentUpdate },
    }))
    mocks.updateMany.mockResolvedValue({ count: 1 })
  })

  it('loads a document only for its owner', async () => {
    const response = await GET(new NextRequest('http://localhost/api/documents/doc-1'), context)

    expect(response.status).toBe(200)
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'doc-1', ownerId: 'owner-1', deletedAt: null },
    }))
    expect((await response.json()).schema).toMatchObject({ title: 'Service Agreement' })
  })

  it('returns not found when the document does not belong to the caller', async () => {
    mocks.findFirst.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/documents/doc-1'), context)

    expect(response.status).toBe(404)
  })

  it('saves an immutable version and points the document to it', async () => {
    const response = await PATCH(request({ title: 'Updated terms', formData: { client: 'New client' } }), context)

    expect(response.status).toBe(200)
    expect(mocks.versionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        documentId: 'doc-1',
        version: 3,
        authorId: 'owner-1',
        formData: { client: 'New client' },
      }),
    }))
    expect(mocks.documentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ title: 'Updated terms', currentVersionId: 'version-3' }),
    }))
  })

  it('rejects completing a draft with missing required fields', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'doc-1',
      title: 'Service terms',
      template: { title: 'Service Agreement', slug: 'service-agreement', category: 'BUSINESS' },
      templateVersion: {
        version: 1,
        schema,
        jurisdictionCountry: 'US',
        jurisdictionRegion: null,
      },
      currentVersion: { version: 2, formData: { client: '' } },
    })

    const response = await PATCH(request({ status: 'completed' }), context)

    expect(response.status).toBe(422)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('soft-deletes only a document owned by the caller', async () => {
    const response = await DELETE(new NextRequest('http://localhost/api/documents/doc-1'), context)

    expect(response.status).toBe(204)
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'doc-1', ownerId: 'owner-1', deletedAt: null },
      data: expect.objectContaining({ status: 'DELETED', deletedAt: expect.any(Date) }),
    }))
  })

  it('does not reveal documents owned by other users during delete', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 })

    const response = await DELETE(new NextRequest('http://localhost/api/documents/doc-1'), context)

    expect(response.status).toBe(404)
  })
})
