import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  jobFindFirst: vi.fn(),
}))

vi.mock('../../../../../../../lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@prelegal/database', () => ({
  prisma: { generationJob: { findFirst: mocks.jobFindFirst } },
}))

const context = { params: { documentId: 'doc-1', jobId: 'job-1' } }

describe('GET /api/documents/[documentId]/exports/[jobId]/download', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'owner-1' } })
    mocks.jobFindFirst.mockResolvedValue({
      status: 'COMPLETED',
      output: {
        fileName: 'service-agreement.pdf',
        mimeType: 'application/pdf',
        data: Buffer.from('example pdf').toString('base64'),
      },
    })
  })

  it('downloads a completed export as a private binary response', async () => {
    const response = await GET(new NextRequest('http://localhost/download'), context)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="service-agreement.pdf"')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('example pdf')
  })

  it('does not return output before the worker finishes', async () => {
    mocks.jobFindFirst.mockResolvedValue({ status: 'PROCESSING', output: null })

    const response = await GET(new NextRequest('http://localhost/download'), context)

    expect(response.status).toBe(409)
  })

  it('does not return output to users who do not own its document', async () => {
    mocks.jobFindFirst.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/download'), context)

    expect(response.status).toBe(404)
  })
})
