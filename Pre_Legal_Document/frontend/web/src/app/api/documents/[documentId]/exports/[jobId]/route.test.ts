import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  jobFindFirst: vi.fn(),
}))

vi.mock('../../../../../../lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@prelegal/database', () => ({
  prisma: { generationJob: { findFirst: mocks.jobFindFirst } },
}))

const context = { params: { documentId: 'doc-1', jobId: 'job-1' } }

describe('GET /api/documents/[documentId]/exports/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'owner-1' } })
    mocks.jobFindFirst.mockResolvedValue({
      id: 'job-1',
      status: 'PROCESSING',
      error: null,
      createdAt: new Date(),
      completedAt: null,
    })
  })

  it('scopes export status to the authenticated document owner', async () => {
    const response = await GET(new NextRequest('http://localhost/api/documents/doc-1/exports/job-1'), context)

    expect(response.status).toBe(200)
    expect(mocks.jobFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'job-1',
        documentId: 'doc-1',
        document: { ownerId: 'owner-1', deletedAt: null },
      },
    }))
  })

  it('does not expose a job that belongs to another user', async () => {
    mocks.jobFindFirst.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/documents/doc-1/exports/job-1'), context)

    expect(response.status).toBe(404)
  })
})
