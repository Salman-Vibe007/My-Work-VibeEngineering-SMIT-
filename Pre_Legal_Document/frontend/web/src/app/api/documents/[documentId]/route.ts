import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { prisma } from '@prelegal/database'
import { documentUpdateSchema } from '@prelegal/validation'
import { TemplateEngine } from '@prelegal/template-engine'
import { normalizeTemplateSchema } from '../../../../lib/template-schema'
import { toPrismaJson, toPrismaJsonObject } from '../../../../lib/prisma-json'
import { Prisma } from '@prisma/client'

interface RouteContext {
  params: { documentId: string }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id
  const document = await prisma.document.findFirst({
    where: { id: params.documentId, ownerId: userId, deletedAt: null },
    include: {
      template: { select: { id: true, title: true, slug: true, category: true } },
      templateVersion: { select: { version: true, schema: true, jurisdictionCountry: true, jurisdictionRegion: true } },
      currentVersion: { select: { id: true, version: true, formData: true, content: true } },
    },
  })
  if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const schema = normalizeTemplateSchema(document.templateVersion.schema, {
    slug: document.template.slug,
    title: document.template.title,
    category: document.template.category,
    jurisdictionCountry: document.templateVersion.jurisdictionCountry,
    jurisdictionRegion: document.templateVersion.jurisdictionRegion,
    version: document.templateVersion.version,
  })
  return NextResponse.json({ document, schema })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = documentUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid document input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const document = await prisma.document.findFirst({
    where: { id: params.documentId, ownerId: userId, deletedAt: null },
    include: {
      template: { select: { title: true, slug: true, category: true } },
      templateVersion: { select: { version: true, schema: true, jurisdictionCountry: true, jurisdictionRegion: true } },
      currentVersion: { select: { version: true, formData: true } },
    },
  })
  if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  try {
    const currentFormData =
      document.currentVersion?.formData &&
      typeof document.currentVersion.formData === 'object' &&
      !Array.isArray(document.currentVersion.formData)
        ? document.currentVersion.formData as Record<string, unknown>
        : {}
    const formData = parsed.data.formData ?? currentFormData
    const schema = normalizeTemplateSchema(document.templateVersion.schema, {
      slug: document.template.slug,
      title: document.template.title,
      category: document.template.category,
      jurisdictionCountry: document.templateVersion.jurisdictionCountry,
      jurisdictionRegion: document.templateVersion.jurisdictionRegion,
      version: document.templateVersion.version,
    })
    const engine = new TemplateEngine(schema)
    const validation = engine.validateFormData(formData)
    if (parsed.data.status === 'completed' && !validation.valid) {
      return NextResponse.json(
        { error: 'Complete all required fields before completing this document', fieldErrors: validation.errors },
        { status: 422 }
      )
    }
    const content = parsed.data.content ?? engine.render(formData).sections
    const result = await prisma.$transaction(async (transaction) => {
      const latestVersion = await transaction.documentVersion.findFirst({
        where: { documentId: document.id },
        orderBy: { version: 'desc' },
        select: { version: true },
      })
      const version = await transaction.documentVersion.create({
        data: {
          documentId: document.id,
          version: (latestVersion?.version ?? 0) + 1,
          authorId: userId,
          formData: toPrismaJsonObject(formData),
          content: toPrismaJson(content),
        },
      })
      return transaction.document.update({
        where: { id: document.id },
        data: {
          ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
          ...(parsed.data.status !== undefined ? { status: statusMap[parsed.data.status] } : {}),
          ...(parsed.data.isFavorite !== undefined ? { isFavorite: parsed.data.isFavorite } : {}),
          ...(parsed.data.isPinned !== undefined ? { isPinned: parsed.data.isPinned } : {}),
          ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
          ...(parsed.data.status === 'completed' ? { completedAt: new Date() } : {}),
          currentVersionId: version.id,
        },
        include: {
          template: { select: { title: true } },
          currentVersion: { select: { version: true, formData: true, content: true } },
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    return NextResponse.json({ document: result })
  } catch (error) {
    if (isTransactionConflict(error)) {
      return NextResponse.json(
        { error: 'This document changed in another session. Reload and try again.' },
        { status: 409 }
      )
    }
    console.error('Document update error:', error)
    return NextResponse.json({ error: 'Unable to update document' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id
  const result = await prisma.document.updateMany({
    where: { id: params.documentId, ownerId: userId, deletedAt: null },
    data: { deletedAt: new Date(), status: 'DELETED' },
  })
  if (result.count === 0) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}

const statusMap = {
  draft: 'DRAFT',
  completed: 'COMPLETED',
  archived: 'ARCHIVED',
} as const

function isTransactionConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'P2002' || error.code === 'P2034')
  )
}
