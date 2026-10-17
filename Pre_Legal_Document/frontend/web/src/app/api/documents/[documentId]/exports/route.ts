import { JobType, Prisma } from '@prisma/client'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { prisma } from '@prelegal/database'
import { TemplateEngine } from '@prelegal/template-engine'
import { normalizeTemplateSchema } from '../../../../../lib/template-schema'
import { toPrismaJson } from '../../../../../lib/prisma-json'

interface RouteContext {
  params: { documentId: string }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    return NextResponse.json({ error: 'Document export service is not configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const format =
    typeof body === 'object' && body !== null && 'format' in body
      ? body.format
      : undefined
  if (format !== 'pdf' && format !== 'docx') {
    return NextResponse.json({ error: 'Export format must be pdf or docx' }, { status: 400 })
  }

  const document = await prisma.document.findFirst({
    where: { id: params.documentId, ownerId: session.user.id, deletedAt: null },
    include: {
      template: { select: { title: true, slug: true, category: true } },
      templateVersion: { select: { version: true, schema: true, jurisdictionCountry: true, jurisdictionRegion: true } },
      currentVersion: { select: { formData: true } },
    },
  })
  if (!document?.currentVersion) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  let renderResult
  try {
    const formData = asRecord(document.currentVersion.formData)
    const schema = normalizeTemplateSchema(document.templateVersion.schema, {
      slug: document.template.slug,
      title: document.template.title,
      category: document.template.category,
      jurisdictionCountry: document.templateVersion.jurisdictionCountry,
      jurisdictionRegion: document.templateVersion.jurisdictionRegion,
      version: document.templateVersion.version,
    })
    renderResult = new TemplateEngine(schema).render(formData)
  } catch (error) {
    console.error('Document export preparation error:', error)
    return NextResponse.json({ error: 'Unable to prepare document export' }, { status: 500 })
  }
  if (renderResult.missingFields.length > 0 || renderResult.warnings.length > 0) {
    return NextResponse.json(
      {
        error: 'Complete all required fields and fix validation issues before exporting',
        missingFields: renderResult.missingFields,
        warnings: renderResult.warnings,
      },
      { status: 422 }
    )
  }

  const job = await prisma.generationJob.create({
    data: {
      documentId: document.id,
      type: format === 'pdf' ? JobType.PDF_GENERATION : JobType.DOCX_GENERATION,
      input: toPrismaJson({ title: document.title, renderResult }),
    },
    select: { id: true, status: true, createdAt: true },
  })

  let connection: IORedis | undefined
  let queue: Queue<{ generationJobId: string }> | undefined
  try {
    connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })
    queue = new Queue<{ generationJobId: string }>('document-generation', { connection })
    await queue.add('generate-document', { generationJobId: job.id }, { jobId: job.id })
    return NextResponse.json({ job }, { status: 202 })
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unable to enqueue export job',
        completedAt: new Date(),
      },
    })
    console.error('Export queue error:', error)
    return NextResponse.json({ error: 'Unable to queue document export' }, { status: 503 })
  } finally {
    if (queue) {
      try {
        await queue.close()
      } catch (error) {
        console.error('Export queue shutdown error:', error)
      }
    }
    if (connection) {
      try {
        await connection.quit()
      } catch (error) {
        console.error('Export Redis shutdown error:', error)
      }
    }
  }
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error('Stored document form data is invalid')
  }
  return value
}
