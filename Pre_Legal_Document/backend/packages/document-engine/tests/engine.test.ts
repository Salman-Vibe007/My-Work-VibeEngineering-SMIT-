import { describe, expect, it } from 'vitest'
import type { RenderResult } from '@prelegal/template-engine'
import { TemplateEngine } from '@prelegal/template-engine'
import type { TemplateSchema } from '@prelegal/shared'
import { DocumentEngine, DocumentService } from '../src/engine'

const schema: TemplateSchema = {
  id: 'basic-letter',
  version: 1,
  title: 'Basic Letter',
  category: 'general',
  jurisdiction: { country: 'US' },
  fields: [{ name: 'recipient', label: 'Recipient', type: 'text', required: true }],
  sections: [
    {
      id: 'letter-body',
      title: 'Letter body',
      content: 'Dear {{recipient}},\nThis is a draft.',
      order: 0,
    },
  ],
}

const renderResult: RenderResult = {
  sections: [
    {
      id: 'section" onmouseover="alert(1)',
      title: 'Terms & conditions',
      content: '<script>alert(1)</script>\nSecond line',
      order: 0,
    },
  ],
  fullContent: '<script>alert(1)</script>\nSecond line',
  missingFields: [],
  warnings: [],
}

describe('DocumentEngine', () => {
  it('generates HTML safely in a Node runtime', () => {
    const html = new DocumentEngine().generateHTML(renderResult, '<Notice>')

    expect(html).toContain('&lt;Notice&gt;')
    expect(html).toContain('data-section-id="section&quot; onmouseover=&quot;alert(1)"')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('escapes user text after template rendering at the HTML output boundary', () => {
    const rendered = new TemplateEngine(schema).render({
      recipient: '<script>alert(1)</script>',
    })
    const html = new DocumentEngine().generateHTML(rendered, 'Draft')

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('generates a DOCX archive', async () => {
    const bytes = await new DocumentEngine().generateDOCX({
      title: 'Notice',
      renderResult,
      metadata: { author: 'Ada Lovelace', templateId: 'basic-letter', templateVersion: 1 },
    })

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b])
  })
})

describe('DocumentService', () => {
  it('does not create an invalid empty template engine', () => {
    const service = new DocumentService()

    expect(() => service.renderDocument({})).toThrow(
      'Template schema must be configured before rendering documents'
    )
  })

  it('renders and validates after a schema is configured', () => {
    const service = new DocumentService()
    service.setTemplateSchema(schema)

    expect(service.validateFormData({ recipient: 'Ada Lovelace' })).toEqual({
      valid: true,
      errors: {},
    })
    expect(service.renderDocument({ recipient: 'Ada Lovelace' }).fullContent).toBe(
      'Dear Ada Lovelace,\nThis is a draft.'
    )
    expect(service.getDefaultFormData()).toEqual({})
  })
})
