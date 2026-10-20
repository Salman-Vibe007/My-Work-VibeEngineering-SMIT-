import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { prisma } from '@prelegal/database'
import { documentCreateSchema } from '@prelegal/validation'
import { TemplateEngine } from '@prelegal/template-engine'
import { normalizeTemplateSchema } from '../../../lib/template-schema'
import { toPrismaJson, toPrismaJsonObject } from '../../../lib/prisma-json'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const userId = session.user.id

  const documents = await prisma.document.findMany({
    where: { ownerId: userId, deletedAt: null },
    include: {
      template: { select: { title: true } },
      currentVersion: { select: { formData: true, content: true, version: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ documents })
}

async function hasPremiumTemplates(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'TRIALING'] },
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }],
    },
    select: { plan: { select: { features: true } } },
  })
  const features = subscription?.plan.features
  return (
    typeof features === 'object' &&
    features !== null &&
    !Array.isArray(features) &&
    features.premiumTemplates === true
  )
}

export async function POST(request: NextRequest) {
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

  const parsed = documentCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid document input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { title, templateId, templateVersion, formData, jurisdictionCountry, jurisdictionRegion } = parsed.data

  try {
    const template = await prisma.template.findFirst({
      where: { id: templateId, status: 'PUBLISHED' },
      include: {
        versions: { where: { version: templateVersion, reviewStatus: 'approved' }, take: 1 },
      },
    })
    const version = template?.versions[0]
    if (!template || !version) {
      return NextResponse.json({ error: 'Published template version not found' }, { status: 404 })
    }
    if (template.isPremium && !(await hasPremiumTemplates(userId))) {
      return NextResponse.json({ error: 'This template requires a premium plan' }, { status: 403 })
    }



    const schema = normalizeTemplateSchema(version.schema, {
      slug: template.slug,
      title: template.title,
      category: template.category,
      jurisdictionCountry: version.jurisdictionCountry,
      jurisdictionRegion: version.jurisdictionRegion,
      version: version.version,
    })
    const renderResult = new TemplateEngine(schema).render(formData)

    const document = await prisma.$transaction(async (transaction) => {
      const created = await transaction.document.create({
        data: {
          title,
          ownerId: userId,
          templateId: template.id,
          templateVersionId: version.id,
          jurisdictionCountry,
          jurisdictionRegion,
        },
      })
      const documentVersion = await transaction.documentVersion.create({
        data: {
          documentId: created.id,
          version: 1,
          authorId: userId,
          formData: toPrismaJsonObject(formData),
          content: toPrismaJson(renderResult.sections),
        },
      })
      return transaction.document.update({
        where: { id: created.id },
        data: { currentVersionId: documentVersion.id },
        include: {
          template: { select: { title: true } },
          currentVersion: { select: { formData: true, content: true, version: true } },
        },
      })
    })

    return NextResponse.json({ document, schema }, { status: 201 })
  } catch (error) {
    console.error('Document creation error:', error)
    return NextResponse.json({ error: 'Unable to create document' }, { status: 500 })
  }
}
