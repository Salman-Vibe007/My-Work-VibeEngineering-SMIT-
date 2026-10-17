import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { hash } from '@node-rs/argon2'
import { prisma } from '@prelegal/database'
import { POST } from './route'

vi.mock('@prelegal/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn(),
}))

const validRegistration = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'a-strong-password',
}

function makeRequest(body: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hash).mockResolvedValue('argon-hash')
  })

  it('rejects malformed JSON without returning a server error', async () => {
    const response = await POST(makeRequest('{invalid'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects invalid registration fields before accessing the database', async () => {
    const response = await POST(makeRequest(JSON.stringify({ ...validRegistration, password: 'short' })))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'Invalid input' })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(hash).not.toHaveBeenCalled()
  })

  it('returns a conflict for an existing account without hashing the password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-user' } as never)

    const response = await POST(makeRequest(JSON.stringify(validRegistration)))

    expect(response.status).toBe(409)
    expect(hash).not.toHaveBeenCalled()
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('normalizes the email, hashes the password, and returns only public user fields', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-user',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as never)

    const response = await POST(makeRequest(JSON.stringify({
      ...validRegistration,
      email: ' Ada@Example.com ',
    })))

    expect(response.status).toBe(201)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
    })
    expect(hash).toHaveBeenCalledWith(validRegistration.password)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        passwordHash: 'argon-hash',
        emailVerified: null,
        locale: 'en',
        preferredJurisdiction: undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    const payload = await response.json()
    expect(payload.user).toMatchObject({ id: 'new-user', email: 'ada@example.com' })
    expect(payload.user).not.toHaveProperty('passwordHash')
  })

  it('maps a duplicate-account race to a conflict response', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockRejectedValue({ code: 'P2002' })

    const response = await POST(makeRequest(JSON.stringify(validRegistration)))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: 'An account with this email already exists',
    })
  })

  it('reports unexpected storage or hashing failures as server errors', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('database unavailable'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await POST(makeRequest(JSON.stringify(validRegistration)))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Internal server error' })
    expect(errorSpy).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })
})
