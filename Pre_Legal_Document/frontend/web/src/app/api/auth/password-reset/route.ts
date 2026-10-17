import { randomBytes, createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@prelegal/database'
import { passwordResetRequestSchema } from '@prelegal/validation'

const resetTokenLifetimeMs = 60 * 60 * 1000

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = passwordResetRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid email address' },
      { status: 400 }
    )
  }

  const apiKey = process.env.EMAIL_API_KEY
  const from = process.env.EMAIL_FROM
  const appUrl = process.env.APP_URL
  if (process.env.EMAIL_PROVIDER !== 'resend' || !apiKey || !from || !appUrl) {
    return NextResponse.json(
      { error: 'Password recovery email is not configured on this server' },
      { status: 503 }
    )
  }

  let resetUrl: URL
  try {
    resetUrl = new URL('/reset-password', appUrl)
    if (resetUrl.protocol !== 'https:' && resetUrl.hostname !== 'localhost') {
      throw new Error('APP_URL must use HTTPS outside localhost')
    }
  } catch (error) {
    console.error('Password recovery URL configuration error:', error)
    return NextResponse.json(
      { error: 'Password recovery is temporarily unavailable' },
      { status: 503 }
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, passwordHash: true },
  })

  if (!user?.passwordHash) {
    return NextResponse.json({
      message: 'If an account can be recovered, instructions will be sent to that email.',
    })
  }

  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const identifier = `password-reset:${user.email}`
  const expires = new Date(Date.now() + resetTokenLifetimeMs)

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  })
  resetUrl.searchParams.set('token', token)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: user.email,
        subject: 'Reset your PreLegal password',
        text: `Use this one-time link to reset your password: ${resetUrl.toString()}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.`,
      }),
    })
    if (!response.ok) {
      throw new Error(`Email provider returned HTTP ${response.status}`)
    }
  } catch (error) {
    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } })
    console.error('Password recovery email delivery failed:', error)
    return NextResponse.json(
      { error: 'Unable to send password recovery email. Please try again later.' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    message: 'If an account can be recovered, instructions will be sent to that email.',
  })
}
