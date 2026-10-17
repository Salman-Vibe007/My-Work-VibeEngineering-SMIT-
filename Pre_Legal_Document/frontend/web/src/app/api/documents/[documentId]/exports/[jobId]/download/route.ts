import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../../lib/auth'
import { prisma } from '@prelegal/database'

interface RouteContext {
  params: { documentId: string; jobId: string }
}

interface ExportOutput {
  fileName: string
  mimeType: string
  data: string
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
    select: { status: true, output: true },
  })
  if (!job) return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
  if (job.status !== 'COMPLETED' || !isExportOutput(job.output)) {
    return NextResponse.json({ error: 'Export is not ready to download' }, { status: 409 })
  }

  const expectedMimeTypes = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])
  if (!expectedMimeTypes.has(job.output.mimeType)) {
    return NextResponse.json({ error: 'Export file type is invalid' }, { status: 500 })
  }

  const bytes = Buffer.from(job.output.data, 'base64')
  const safeFileName = job.output.fileName.replace(/[\r\n"\\/]/g, '_')
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': job.output.mimeType,
      'Content-Disposition': `attachment; filename="${safeFileName}"`,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function isExportOutput(value: unknown): value is ExportOutput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const output = value as Record<string, unknown>
  return (
    typeof output.fileName === 'string' &&
    output.fileName.length > 0 &&
    output.fileName.length <= 255 &&
    typeof output.mimeType === 'string' &&
    typeof output.data === 'string' &&
    /^[A-Za-z0-9+/]*={0,2}$/.test(output.data)
  )
}
