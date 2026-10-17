import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { hash } from '@node-rs/argon2'
import { prisma } from '@prelegal/database'
import { POST } from './route'

const mocks = vi.hoisted(() => ({
  tokenFindUnique: vi.fn(),
  tokenDeleteMany: vi.fn(),
  userUpdateMany: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@prelegal/database', () => ({
  prisma: {
    verificationToken: { findUnique: mocks.tokenFindUnique },
    $transaction: mocks.transaction,
  },
}))
vi.mock('@node-rs/argon2', () => ({ hash: vi.fn() }))

function request(body: unknown) {
  return new NextRequest('http://localhost/api/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/password-reset/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hash).mockResolvedValue('new-argon-hash')
    mocks.tokenFindUnique.mockResolvedValue({
      identifier: 'password-reset:ada@example.com',
      expires: new Date(Date.now() + 60_000),
    })
    mocks.tokenDeleteMany.mockResolvedValue({ count: 1 })
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })
    mocks.transaction.mockImplementation((callback) => callback({
      verificationToken: {
        findUnique: mocks.tokenFindUnique,
        deleteMany: mocks.tokenDeleteMany,
      },
      user: { updateMany: mocks.userUpdateMany },
    }))
  })

  it('rejects invalid passwords before accessing tokens', async () => {
    const response = await POST(request({
      token: 'short',
      password: 'short',
      confirmPassword: 'different',
    }))

    expect(response.status).toBe(400)
    expect(mocks.tokenFindUnique).not.toHaveBeenCalled()
    expect(hash).not.toHaveBeenCalled()
  })

  it('rejects expired or unrelated one-time tokens', async () => {
    mocks.tokenFindUnique.mockResolvedValue({
      identifier: 'magic-link:ada@example.com',
      expires: new Date(Date.now() - 60_000),
    })

    const response = await POST(request({
      token: 'a'.repeat(43),
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    }))

    expect(response.status).toBe(400)
    expect(hash).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('hashes the new password and atomically consumes the reset token', async () => {
    const response = await POST(request({
      token: 'a'.repeat(43),
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    }))

    expect(response.status).toBe(200)
    expect(hash).toHaveBeenCalledWith('a-secure-password')
    expect(mocks.tokenDeleteMany).toHaveBeenCalledWith({
      where: { token: expect.stringMatching(/^[a-f0-9]{64}$/), expires: { gt: expect.any(Date) } },
    })
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: { email: 'ada@example.com', passwordHash: { not: null } },
      data: { passwordHash: 'new-argon-hash' },
    })
  })

  it('rejects replay if the one-time token was already consumed', async () => {
    mocks.tokenDeleteMany.mockResolvedValue({ count: 0 })

    const response = await POST(request({
      token: 'a'.repeat(43),
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    }))

    expect(response.status).toBe(400)
    expect(mocks.userUpdateMany).not.toHaveBeenCalled()
  })

  it('reports a missing token in the database as invalid', async () => {
    mocks.tokenFindUnique.mockResolvedValue(null)

    const response = await POST(request({
      token: 'a'.repeat(43),
      password: 'a-secure-password',
      confirmPassword: 'a-secure-password',
    }))

    expect(response.status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
