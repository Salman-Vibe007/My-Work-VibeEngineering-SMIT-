import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  documentFindMany: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  templateFindFirst: vi.fn(),
  transaction: vi.fn(),
  documentCreate: vi.fn(),
  versionCreate: vi.fn(),
  documentUpdate: vi.fn(),
}))

vi.mock('../../../lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@prelegal/database', () => ({
  prisma: {
    template: { findFirst: mocks.templateFindFirst },
    document: { findMany: mocks.documentFindMany },
    subscription: { findFirst: mocks.subscriptionFindFirst },
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
const templateId = '8f5eb7d6-fd9a-4ec5-88bb-6585394c9807'

function request(body: unknown) {
  return new NextRequest('http://localhost/api/documents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'owner-1' } })
    mocks.documentFindMany.mockResolvedValue([])
    mocks.subscriptionFindFirst.mockResolvedValue(null)
    mocks.templateFindFirst.mockResolvedValue({
      id: templateId,
      slug: 'service-agreement',
      title: 'Service Agreement',
      category: 'BUSINESS',
      jurisdictionCountry: 'US',
      jurisdictionRegion: null,
      isPremium: false,
      versions: [{ id: 'template-version-1', version: 1, schema }],
    })
    mocks.documentCreate.mockResolvedValue({ id: 'document-1' })
    mocks.versionCreate.mockResolvedValue({ id: 'document-version-1' })
    mocks.documentUpdate.mockResolvedValue({
      id: 'document-1',
      currentVersion: { version: 1, formData: { client: '' }, content: [] },
    })
    mocks.transaction.mockImplementation((callback) =>
      callback({
        document: { create: mocks.documentCreate, update: mocks.documentUpdate },
        documentVersion: { create: mocks.versionCreate },
      })
    )
  })

  it('requires an authenticated owner', async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await POST(request({}))

    expect(response.status).toBe(401)
    expect(mocks.templateFindFirst).not.toHaveBeenCalled()
  })

  it('lists only the authenticated user’s non-deleted documents', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(mocks.documentFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: 'owner-1', deletedAt: null },
    }))
  })

  it('rejects invalid input before touching the database', async () => {
    const response = await POST(request({ title: '', templateId: 'bad' }))

    expect(response.status).toBe(400)
    expect(mocks.templateFindFirst).not.toHaveBeenCalled()
  })

  it('creates an incomplete draft and its initial version atomically', async () => {
    const response = await POST(request({
      title: 'Acme service terms',
      templateId,
      templateVersion: 1,
      formData: {},
      jurisdictionCountry: 'US',
    }))

    expect(response.status).toBe(201)
    expect(mocks.documentCreate).toHaveBeenCalledWith({
      data: {
        title: 'Acme service terms',
        ownerId: 'owner-1',
        templateId,
        templateVersionId: 'template-version-1',
        jurisdictionCountry: 'US',
        jurisdictionRegion: undefined,
      },
    })
    expect(mocks.versionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        documentId: 'document-1',
        version: 1,
        authorId: 'owner-1',
        formData: {},
      }),
    }))
    expect(mocks.documentUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'document-1' },
      data: { currentVersionId: 'document-version-1' },
    }))
  })

  it('does not allow premium templates without a premium entitlement', async () => {
    mocks.templateFindFirst.mockResolvedValue({
      id: 'template-1',
      isPremium: true,
      versions: [{ id: 'version-1', version: 1, schema }],
    })

    const response = await POST(request({
      title: 'Premium draft',
      templateId,
      templateVersion: 1,
      formData: {},
      jurisdictionCountry: 'US',
    }))

    expect(response.status).toBe(403)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('allows premium templates with an active premium entitlement', async () => {
    mocks.templateFindFirst.mockResolvedValue({
      id: templateId,
      slug: 'service-agreement',
      title: 'Service Agreement',
      category: 'BUSINESS',
      jurisdictionCountry: 'US',
      jurisdictionRegion: null,
      isPremium: true,
      versions: [{ id: 'template-version-1', version: 1, schema }],
    })
    mocks.subscriptionFindFirst.mockResolvedValue({
      plan: { features: { premiumTemplates: true } },
    })

    const response = await POST(request({
      title: 'Premium draft',
      templateId,
      templateVersion: 1,
      formData: {},
      jurisdictionCountry: 'US',
    }))

    expect(response.status).toBe(201)
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'owner-1', status: { in: ['ACTIVE', 'TRIALING'] } }),
    }))
  })
})
