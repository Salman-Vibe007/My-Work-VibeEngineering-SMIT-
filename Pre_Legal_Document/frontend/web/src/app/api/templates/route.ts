import { NextRequest, NextResponse } from 'next/server'
import { TemplateCategory } from '@prisma/client'
import { prisma } from '@prelegal/database'
import { normalizeTemplateSchema } from '../../../lib/template-schema'
import { z } from 'zod'

const categorySchema = z.nativeEnum(TemplateCategory)

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()
  const categoryParam = request.nextUrl.searchParams.get('category')?.toUpperCase()
  const parsedCategory = categorySchema.safeParse(categoryParam)
  if (categoryParam && categoryParam !== 'ALL' && !parsedCategory.success) {
    return NextResponse.json({ error: 'Invalid template category' }, { status: 400 })
  }
  const premium = request.nextUrl.searchParams.get('premium')

  const templates = await prisma.template.findMany({
    where: {
      status: 'PUBLISHED',
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(parsedCategory.success
        ? { category: parsedCategory.data }
        : {}),
      ...(premium === 'true' ? { isPremium: true } : {}),
    },
    include: {
      versions: {
        where: { reviewStatus: 'approved' },
        orderBy: { version: 'desc' },
        take: 1,
        select: { id: true, version: true, schema: true, jurisdictionRegion: true },
      },
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })

  return NextResponse.json({
    templates: templates.map((template) => {
      const version = template.versions[0]
      const metadata = {
        slug: template.slug,
        title: template.title,
        category: template.category,
        jurisdictionCountry: template.jurisdictionCountry,
        jurisdictionRegion: version?.jurisdictionRegion ?? template.jurisdictionRegion,
        version: version?.version ?? template.version,
      }
      return {
        id: template.id,
        slug: template.slug,
        title: template.title,
        description: template.description,
        category: template.category,
        jurisdictionCountry: template.jurisdictionCountry,
        jurisdictionRegion: metadata.jurisdictionRegion,
        isPremium: template.isPremium,
        version: metadata.version,
        templateVersionId: version?.id ?? null,
        schema: version ? normalizeTemplateSchema(version.schema, metadata) : null,
      }
    }),
  })
}
