import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '@prelegal/database'
import { z } from 'zod'

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  locale: z.string().length(2).optional(),
  preferredJurisdiction: z.string().length(2).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one profile field to update',
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      locale: true,
      preferredJurisdiction: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      locale: true,
      preferredJurisdiction: true,
    },
  })
  return NextResponse.json({ user })
}
