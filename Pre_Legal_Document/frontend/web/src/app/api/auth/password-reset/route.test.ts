import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@prelegal/database'
import { POST } from './route'

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  tokenDeleteMany: vi.fn(),
  tokenCreate: vi.fn(),
}))

vi.mock('@prelegal/database', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    verificationToken: {
      deleteMany: mocks.tokenDeleteMany,
      create: mocks.tokenCreate,
    },
  },
}))

function request(body: string) {
  return new NextRequest('http://localhost/api/auth/password-reset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

describe('POST /api/auth/password-reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('EMAIL_API_KEY', 'test-api-key')
    vi.stubEnv('EMAIL_FROM', 'PreLegal <no-reply@example.com>')
    vi.stubEnv('EMAIL_PROVIDER', 'resend')
    vi.stubEnv('APP_URL', 'https://prelegal.example')
    mocks.userFindUnique.mockResolvedValue({
      email: 'ada@example.com',
      passwordHash: 'existing-hash',
    })
    mocks.tokenDeleteMany.mockResolvedValue({ count: 0 })
    mocks.tokenCreate.mockResolvedValue({})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
  })

  it('rejects malformed JSON and invalid email input', async () => {
    expect((await POST(request('{'))).status).toBe(400)
    expect((await POST(request(JSON.stringify({ email: 'invalid' })))).status).toBe(400)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it('does not disclose whether an account exists', async () => {
    mocks.userFindUnique.mockResolvedValue(null)

    const response = await POST(request(JSON.stringify({ email: 'missing@example.com' })))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ message: expect.stringContaining('If an account') })
    expect(mocks.tokenCreate).not.toHaveBeenCalled()
  })

  it('requires the mail service to be configured', async () => {
    vi.stubEnv('EMAIL_API_KEY', '')

    const response = await POST(request(JSON.stringify({ email: 'ada@example.com' })))

    expect(response.status).toBe(503)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
  })

  it('stores only a token hash and sends the one-hour reset URL', async () => {
    const response = await POST(request(JSON.stringify({ email: ' ADA@Example.com ' })))

    expect(response.status).toBe(200)
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      select: { email: true, passwordHash: true },
    })
    const savedToken = vi.mocked(prisma.verificationToken.create).mock.calls[0][0].data
    expect(savedToken.token).toMatch(/^[a-f0-9]{64}$/)
    expect(savedToken.identifier).toBe('password-reset:ada@example.com')
    expect(new Date(savedToken.expires).getTime()).toBeGreaterThan(Date.now() + 59 * 60 * 1000)
    const fetchCall = vi.mocked(fetch).mock.calls[0]
    const email = JSON.parse(String(fetchCall[1]?.body))
    expect(email.to).toBe('ada@example.com')
    expect(email.text).toContain('https://prelegal.example/reset-password?token=')
  })

  it('removes the reset token and reports email delivery failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await POST(request(JSON.stringify({ email: 'ada@example.com' })))

    expect(response.status).toBe(502)
    expect(mocks.tokenDeleteMany).toHaveBeenLastCalledWith({
      where: { token: expect.stringMatching(/^[a-f0-9]{64}$/) },
    })
    expect(errorSpy).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })
})
