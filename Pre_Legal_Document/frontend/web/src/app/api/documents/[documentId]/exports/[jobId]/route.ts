import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../lib/auth'
import { prisma } from '@prelegal/database'

interface RouteContext {
  params: { documentId: string; jobId: string }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const job = await prisma.generationJob.findFirst({
    where: {
      id: params.jobId,
      documentId: params.documentId,
      document: { ownerId: session.user.id, deletedAt: null },
    },
    select: { id: true, status: true, error: true, createdAt: true, completedAt: true },
  })
  if (!job) return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
  return NextResponse.json({ job })
}
