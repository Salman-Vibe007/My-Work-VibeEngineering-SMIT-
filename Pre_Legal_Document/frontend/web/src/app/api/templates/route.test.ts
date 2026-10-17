import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const findMany = vi.hoisted(() => vi.fn())

vi.mock('@prelegal/database', () => ({
  prisma: { template: { findMany } },
}))

describe('GET /api/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findMany.mockResolvedValue([
      {
        id: 'template-1',
        slug: 'service-agreement',
        title: 'Service Agreement',
        description: 'Service terms',
        category: 'BUSINESS',
        jurisdictionCountry: 'US',
        jurisdictionRegion: null,
        isPremium: false,
        version: 1,
        versions: [{
          id: 'template-version-1',
          version: 1,
          schema: {
            fields: [{ name: 'client', label: 'Client', type: 'text', required: true }],
            sections: [{ id: 'terms', title: 'Terms', content: '{{client}}' }],
          },
          jurisdictionRegion: null,
        }],
      },
    ] as never)
  })

  it('returns published templates with normalized schemas and only reviewed versions', async () => {
    const response = await GET(new NextRequest('http://localhost/api/templates'))

    expect(response.status).toBe(200)
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED' },
      include: { versions: expect.objectContaining({ where: { reviewStatus: 'approved' } }) },
    }))
    expect((await response.json()).templates[0].schema).toMatchObject({
      id: 'service-agreement',
      title: 'Service Agreement',
      category: 'business',
      sections: [{ order: 0 }],
    })
  })

  it('rejects invalid template categories', async () => {
    const response = await GET(new NextRequest('http://localhost/api/templates?category=unknown'))

    expect(response.status).toBe(400)
    expect(findMany).not.toHaveBeenCalled()
  })

  it('applies validated search and category filters', async () => {
    await GET(new NextRequest('http://localhost/api/templates?q=service&category=business&premium=true'))

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'PUBLISHED',
        category: 'BUSINESS',
        isPremium: true,
        OR: [
          { title: { contains: 'service', mode: 'insensitive' } },
          { description: { contains: 'service', mode: 'insensitive' } },
        ],
      }),
    }))
  })
})
