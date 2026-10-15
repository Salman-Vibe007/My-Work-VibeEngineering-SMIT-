import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import type { RenderResult, TemplateEngine } from '@prelegal/template-engine'
import type { TemplateSchema } from '@prelegal/shared'
import { createTemplateEngine } from '@prelegal/template-engine'

export interface DocumentExportOptions {
  title: string
  renderResult: RenderResult
  metadata?: {
    author?: string
    createdAt?: Date
    templateId?: string
    templateVersion?: number
  }
}

export interface PDFExportOptions {
  html: string
  format?: 'A4' | 'Letter'
  margin?: {
    top: string
    bottom: string
    left: string
    right: string
  }
}

export class DocumentEngine {
  generateDOCX(options: DocumentExportOptions): Promise<Uint8Array> {
    const { title, renderResult, metadata } = options

    const children = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ]

    if (metadata?.author || metadata?.createdAt) {
      const metaParts: string[] = []
      if (metadata.author) metaParts.push(`Author: ${metadata.author}`)
      if (metadata.createdAt) metaParts.push(`Created: ${metadata.createdAt.toLocaleDateString()}`)
      if (metadata.templateId) metaParts.push(`Template: ${metadata.templateId} v${metadata.templateVersion}`)

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: metaParts.join(' | '),
              size: 20,
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        })
      )
    }

    children.push(new Paragraph({ text: '', spacing: { after: 200 } }))

    for (const section of renderResult.sections) {
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      )

      const contentParagraphs = section.content
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) =>
          new Paragraph({
            text: line,
            spacing: { after: 120 },
          })
        )

      children.push(...contentParagraphs)
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children,
        },
      ],
    })

    return Packer.toBuffer(doc)
  }

  generateHTML(renderResult: RenderResult, title: string): string {
    const sectionsHtml = renderResult.sections
      .map(
        (section) => `
        <section class="document-section" data-section-id="${this.escapeHtml(section.id)}">
          <h1 class="section-title">${this.escapeHtml(section.title)}</h1>
          <div class="section-content">${this.formatContent(section.content)}</div>
        </section>
      `
      )
      .join('\n')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    ${this.getPrintStyles()}
  </style>
</head>
<body>
  <div class="document">
    <header class="document-header">
      <h1 class="document-title">${this.escapeHtml(title)}</h1>
    </header>
    <main class="document-body">
      ${sectionsHtml}
    </main>
  </div>
</body>
</html>`
  }

  private escapeHtml(text: string): string {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return text.replace(/[&<>"']/g, (character) => replacements[character])
  }

  private formatContent(content: string): string {
    return content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => `<p>${this.escapeHtml(line)}</p>`)
      .join('\n')
  }

  private getPrintStyles(): string {
    return `
      * {
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #172033;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20mm;
        background: white;
      }
      .document-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #4F46E5;
      }
      .document-title {
        font-size: 2rem;
        font-weight: 700;
        color: #172033;
        margin: 0;
      }
      .document-section {
        margin-bottom: 2rem;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #172033;
        margin: 0 0 0.75rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #E2E8F0;
      }
      .section-content p {
        margin: 0.5rem 0;
        text-align: justify;
      }
      @media print {
        body {
          padding: 0;
          max-width: none;
        }
        .document {
          padding: 20mm;
        }
        .document-section {
          page-break-inside: avoid;
        }
      }
    `
  }
}

export function createDocumentEngine(): DocumentEngine {
  return new DocumentEngine()
}

export class DocumentService {
  private templateEngine: TemplateEngine | undefined

  setTemplateSchema(schema: TemplateSchema): void {
    this.templateEngine = createTemplateEngine(schema)
  }

  renderDocument(formData: Record<string, unknown>): RenderResult {
    return this.getTemplateEngine().render(formData)
  }

  validateFormData(formData: Record<string, unknown>) {
    return this.getTemplateEngine().validateFormData(formData)
  }

  getDefaultFormData() {
    return this.getTemplateEngine().getDefaultFormData()
  }

  async exportToDOCX(options: DocumentExportOptions): Promise<Uint8Array> {
    const engine = createDocumentEngine()
    return engine.generateDOCX(options)
  }

  exportToHTML(renderResult: RenderResult, title: string): string {
    const engine = createDocumentEngine()
    return engine.generateHTML(renderResult, title)
  }

  private getTemplateEngine(): TemplateEngine {
    if (!this.templateEngine) {
      throw new Error('Template schema must be configured before rendering documents')
    }
    return this.templateEngine
  }
}

export function createDocumentService(): DocumentService {
  return new DocumentService()
}