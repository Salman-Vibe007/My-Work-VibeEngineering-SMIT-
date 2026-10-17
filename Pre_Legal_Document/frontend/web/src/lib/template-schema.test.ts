import { describe, expect, it } from 'vitest'
import { normalizeTemplateSchema } from './template-schema'

describe('normalizeTemplateSchema', () => {
  const metadata = {
    slug: 'service-agreement',
    title: 'Service Agreement',
    category: 'BUSINESS',
    jurisdictionCountry: 'US',
    jurisdictionRegion: null,
    version: 1,
  }

  it('normalizes legacy field options and missing section order', () => {
    const schema = normalizeTemplateSchema({
      fields: [
        {
          name: 'payment_schedule',
          label: 'Payment schedule',
          type: 'select',
          required: true,
          options: ['Monthly', 'On completion'],
        },
      ],
      sections: [{ id: 'terms', title: 'Terms', content: '{{payment_schedule}}' }],
    }, metadata)

    expect(schema).toMatchObject({
      id: 'service-agreement',
      category: 'business',
      jurisdiction: { country: 'US' },
      fields: [{
        options: [
          { value: 'Monthly', label: 'Monthly' },
          { value: 'On completion', label: 'On completion' },
        ],
      }],
      sections: [{ order: 0 }],
    })
  })

  it('rejects invalid stored template schemas rather than using malformed data', () => {
    expect(() => normalizeTemplateSchema({ fields: 'bad', sections: [] }, metadata)).toThrow()
  })
})
