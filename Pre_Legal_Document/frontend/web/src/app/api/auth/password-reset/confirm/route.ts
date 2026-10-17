import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from '@node-rs/argon2'
import { prisma } from '@prelegal/database'
import { passwordResetSchema } from '@prelegal/validation'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = passwordResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid reset request', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
  try {
    const existingToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    })
    if (
      !existingToken ||
      existingToken.expires <= new Date() ||
      !existingToken.identifier.startsWith('password-reset:')
    ) {
      return NextResponse.json(
        { error: 'This password reset link is invalid or expired' },
        { status: 400 }
      )
    }

    const passwordHash = await hash(parsed.data.password)
    const updated = await prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.verificationToken.findUnique({
        where: { token: tokenHash },
      })
      if (
        !resetToken ||
        resetToken.expires <= new Date() ||
        !resetToken.identifier.startsWith('password-reset:')
      ) {
        return false
      }

      const consumed = await transaction.verificationToken.deleteMany({
        where: { token: tokenHash, expires: { gt: new Date() } },
      })
      if (consumed.count !== 1) return false

      const email = resetToken.identifier.slice('password-reset:'.length)
      const result = await transaction.user.updateMany({
        where: { email, passwordHash: { not: null } },
        data: { passwordHash },
      })
      return result.count === 1
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'This password reset link is invalid or expired' },
        { status: 400 }
      )
    }
    return NextResponse.json({ message: 'Password updated. You can now sign in.' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Unable to reset password. Please try again.' },
      { status: 500 }
    )
  }
}
