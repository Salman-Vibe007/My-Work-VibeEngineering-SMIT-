import { z } from 'zod'
import type { TemplateSchema } from '@prelegal/shared'
import { templateSchemaSchema } from '@prelegal/validation'

interface TemplateMetadata {
  slug: string
  title: string
  category: string
  jurisdictionCountry: string
  jurisdictionRegion: string | null
  version: number
}

export function normalizeTemplateSchema(
  rawSchema: unknown,
  metadata: TemplateMetadata
): TemplateSchema {
  const parsed = templateSchemaSchema.safeParse(rawSchema)
  if (parsed.success) return parsed.data

  const legacySchema = z
    .object({
      fields: z.array(z.record(z.unknown())),
      sections: z.array(z.record(z.unknown())),
    })
    .parse(rawSchema)

  return templateSchemaSchema.parse({
    id: metadata.slug,
    version: metadata.version,
    title: metadata.title,
    category: metadata.category.toLowerCase(),
    jurisdiction: {
      country: metadata.jurisdictionCountry,
      ...(metadata.jurisdictionRegion
        ? { region: metadata.jurisdictionRegion }
        : {}),
    },
    fields: legacySchema.fields.map((field) => ({
      ...field,
      ...(Array.isArray(field.options)
        ? {
            options: field.options.map((option) =>
              typeof option === 'string'
                ? { value: option, label: option }
                : option
            ),
          }
        : {}),
    })),
    sections: legacySchema.sections.map((section, index) => ({
      ...section,
      order: typeof section.order === 'number' ? section.order : index,
    })),
  })
}
