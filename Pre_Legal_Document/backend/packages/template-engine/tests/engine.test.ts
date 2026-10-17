import { describe, expect, it } from 'vitest'
import type { TemplateSchema } from '@prelegal/shared'
import { TemplateEngine } from '../src/engine'

const schema: TemplateSchema = {
  id: 'service-agreement',
  version: 1,
  title: 'Service Agreement',
  category: 'business',
  jurisdiction: { country: 'US' },
  fields: [
    { name: 'clientName', label: 'Client name', type: 'text', required: true },
    { name: 'includeFee', label: 'Include fee', type: 'checkbox', required: false },
    {
      name: 'fee',
      label: 'Fee',
      type: 'number',
      required: true,
      validation: { min: 0 },
      conditional: { field: 'includeFee', operator: 'equals', value: true },
    },
  ],
  sections: [
    {
      id: 'terms',
      title: 'Terms',
      content: 'Fee: {{fee}}',
      order: 2,
      conditional: { field: 'includeFee', operator: 'equals', value: true },
    },
    {
      id: 'parties',
      title: 'Parties',
      content: '<p>{{clientName}}</p>',
      order: 1,
    },
  ],
}

describe('TemplateEngine', () => {
  it('renders sections in order without mutating the source schema', () => {
    const engine = new TemplateEngine(schema)

    const result = engine.render({ clientName: 'Acme Inc.', includeFee: true, fee: 0 })

    expect(result.sections.map(({ id }) => id)).toEqual(['parties', 'terms'])
    expect(result.fullContent).toBe('<p>Acme Inc.</p>\n\nFee: 0')
    expect(schema.sections.map(({ id }) => id)).toEqual(['terms', 'parties'])
  })

  it('preserves substituted text for document exporters to encode at the output boundary', () => {
    const result = new TemplateEngine(schema).render({
      clientName: '<script>alert(1)</script>',
      includeFee: false,
    })

    expect(result.sections[0].content).toBe('<p><script>alert(1)</script></p>')
  })

  it('renders incomplete drafts with empty placeholders and reports required fields', () => {
    const result = new TemplateEngine(schema).render({ includeFee: false })

    expect(result.sections[0].content).toBe('<p></p>')
    expect(result.missingFields).toEqual(['clientName'])
    expect(result.warnings).toEqual(['Client name is required'])
  })

  it('does not require conditionally hidden fields', () => {
    const engine = new TemplateEngine(schema)

    expect(engine.validateFormData({ clientName: 'Acme Inc.', includeFee: false })).toEqual({
      valid: true,
      errors: {},
    })
    expect(engine.render({ clientName: 'Acme Inc.', includeFee: false }).missingFields).toEqual([])
  })

  it('requires conditionally visible fields and applies their validation', () => {
    const engine = new TemplateEngine(schema)

    expect(engine.validateFormData({ clientName: 'Acme Inc.', includeFee: true })).toEqual({
      valid: false,
      errors: { fee: 'Fee is required' },
    })
    expect(engine.validateFormData({ clientName: 'Acme Inc.', includeFee: true, fee: -1 })).toEqual({
      valid: false,
      errors: { fee: 'Fee must be at least 0' },
    })
  })

  it('treats zero and false as non-empty condition values', () => {
    const conditionSchema: TemplateSchema = {
      ...schema,
      fields: [
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        {
          name: 'details',
          label: 'Details',
          type: 'text',
          required: true,
          conditional: { field: 'amount', operator: 'isNotEmpty', value: null },
        },
      ],
    }

    expect(new TemplateEngine(conditionSchema).validateFormData({ amount: 0 })).toEqual({
      valid: false,
      errors: { details: 'Details is required' },
    })
  })

  it('matches zero and false in contains conditions', () => {
    const conditionSchema: TemplateSchema = {
      ...schema,
      fields: [
        { name: 'amount', label: 'Amount', type: 'number', required: false },
        {
          name: 'amountDetails',
          label: 'Amount details',
          type: 'text',
          required: true,
          conditional: { field: 'amount', operator: 'contains', value: '0' },
        },
        { name: 'enabled', label: 'Enabled', type: 'checkbox', required: false },
        {
          name: 'enabledDetails',
          label: 'Enabled details',
          type: 'text',
          required: true,
          conditional: { field: 'enabled', operator: 'contains', value: 'false' },
        },
      ],
    }

    expect(new TemplateEngine(conditionSchema).validateFormData({ amount: 0, enabled: false })).toEqual({
      valid: false,
      errors: {
        amountDetails: 'Amount details is required',
        enabledDetails: 'Enabled details is required',
      },
    })
  })

  it('exposes missing template fields and applies defaults', () => {
    const engine = new TemplateEngine(schema)

    expect(engine.getFields()).toHaveLength(3)
    expect(engine.getDefaultFormData()).toEqual({})
  })

  it('rejects malformed template schemas', () => {
    expect(() => new TemplateEngine({ ...schema, id: '' })).toThrow('Invalid template schema')
  })

  it('surfaces invalid template syntax instead of returning an error-shaped document', () => {
    const invalidTemplate: TemplateSchema = {
      ...schema,
      sections: [{ id: 'bad', title: 'Bad', content: '{{#if', order: 0 }],
    }

    expect(() => new TemplateEngine(invalidTemplate).render({})).toThrow()
  })
})
