import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../../lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@prelegal/database', () => ({
  prisma: { user: { findUnique: mocks.findUnique, update: mocks.update } },
}))

function request(body: string) {
  return new NextRequest('http://localhost/api/account', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

describe('/api/account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
    mocks.findUnique.mockResolvedValue({ id: 'user-1', email: 'ada@example.com', name: 'Ada' })
    mocks.update.mockResolvedValue({ id: 'user-1', name: 'Ada Lovelace' })
  })

  it('returns only the signed-in user’s profile fields', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      select: expect.objectContaining({ email: true, name: true }),
    }))
  })

  it('requires authentication for profile access', async () => {
    mocks.auth.mockResolvedValue(null)

    expect((await GET()).status).toBe(401)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it('validates and updates the account profile', async () => {
    const response = await PATCH(request(JSON.stringify({
      name: ' Ada Lovelace ',
      locale: 'en',
      preferredJurisdiction: 'US',
    })))

    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { name: 'Ada Lovelace', locale: 'en', preferredJurisdiction: 'US' },
    }))
  })

  it('allows a user to clear their preferred jurisdiction', async () => {
    const response = await PATCH(request(JSON.stringify({ preferredJurisdiction: null })))

    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { preferredJurisdiction: null },
    }))
  })

  it('rejects invalid fields and empty updates', async () => {
    expect((await PATCH(request(JSON.stringify({ name: ' ' })))).status).toBe(400)
    expect((await PATCH(request(JSON.stringify({})))).status).toBe(400)
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
