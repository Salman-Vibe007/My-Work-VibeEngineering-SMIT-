import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@prelegal/database'
import { hash } from '@node-rs/argon2'
import { z } from 'zod'
import { userRegisterSchema } from '@prelegal/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = userRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, locale, preferredJurisdiction } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        locale: locale || 'en',
        preferredJurisdiction,
        emailVerified: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}