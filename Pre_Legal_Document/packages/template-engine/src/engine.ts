import Handlebars from 'handlebars'
import type { TemplateSchema, TemplateField, TemplateSection } from '@prelegal/shared'
import { templateSchemaSchema } from '@prelegal/validation'

Handlebars.registerHelper('if', function (this: Record<string, unknown>, conditional, options) {
  if (typeof conditional === 'function') {
    conditional = conditional(this)
  }
  if (conditional) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('unless', function (this: Record<string, unknown>, conditional, options) {
  if (typeof conditional === 'function') {
    conditional = conditional(this)
  }
  if (!conditional) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('eq', function (this: Record<string, unknown>, a, b, options) {
  if (a === b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('neq', function (this: Record<string, unknown>, a, b, options) {
  if (a !== b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('gt', function (this: Record<string, unknown>, a, b, options) {
  if (a > b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('lt', function (this: Record<string, unknown>, a, b, options) {
  if (a < b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('and', function (this: Record<string, unknown>, a, b, options) {
  if (a && b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

Handlebars.registerHelper('or', function (this: Record<string, unknown>, a, b, options) {
  if (a || b) {
    return options.fn(this)
  }
  return options.inverse(this)
})

export interface RenderedSection {
  id: string
  title: string
  content: string
  order: number
}

export interface RenderResult {
  sections: RenderedSection[]
  fullContent: string
  missingFields: string[]
  warnings: string[]
}

export class TemplateEngine {
  private schema: TemplateSchema
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map()

  constructor(schema: TemplateSchema) {
    const result = templateSchemaSchema.safeParse(schema)
    if (!result.success) {
      throw new Error(`Invalid template schema: ${result.error.message}`)
    }
    this.schema = result.data
  }

  private getCompiledTemplate(content: string): HandlebarsTemplateDelegate {
    if (!this.compiledTemplates.has(content)) {
      const template = Handlebars.compile(content, {
        noEscape: true,
        strict: false,
      })
      this.compiledTemplates.set(content, template)
    }
    return this.compiledTemplates.get(content)!
  }

  private evaluateCondition(conditional: TemplateField['conditional'], formData: Record<string, unknown>): boolean {
    if (!conditional) return true

    const fieldValue = formData[conditional.field]
    const { operator, value } = conditional

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'notEquals':
        return fieldValue !== value
      case 'contains':
        return String(fieldValue || '').includes(String(value))
      case 'notContains':
        return !String(fieldValue || '').includes(String(value))
      case 'isEmpty':
        return fieldValue === undefined || fieldValue === null || fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'isNotEmpty':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '' &&
          !(Array.isArray(fieldValue) && fieldValue.length === 0)
      default:
        return true
    }
  }

  private validateField(field: TemplateField, value: unknown): { valid: boolean; error?: string } {
    if (field.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${field.label} is required` }
    }

    if (value === undefined || value === null || value === '') {
      return { valid: true }
    }

    if (field.validation) {
      const { minLength, maxLength, pattern, min, max } = field.validation

      if (typeof value === 'string') {
        if (minLength && value.length < minLength) {
          return { valid: false, error: `${field.label} must be at least ${minLength} characters` }
        }
        if (maxLength && value.length > maxLength) {
          return { valid: false, error: `${field.label} must be at most ${maxLength} characters` }
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return { valid: false, error: `${field.label} format is invalid` }
        }
      }

      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return { valid: false, error: `${field.label} must be at least ${min}` }
        }
        if (max !== undefined && value > max) {
          return { valid: false, error: `${field.label} must be at most ${max}` }
        }
      }
    }

    return { valid: true }
  }

  render(formData: Record<string, unknown>): RenderResult {
    const missingFields: string[] = []
    const warnings: string[] = []
    const renderedSections: RenderedSection[] = []

    for (const field of this.schema.fields) {
      if (!this.evaluateCondition(field.conditional, formData)) {
        continue
      }

      const value = formData[field.name]
      if (field.required && (value === undefined || value === null || value === '')) {
        missingFields.push(field.name)
      }

      const validation = this.validateField(field, value)
      if (!validation.valid) {
        warnings.push(validation.error!)
      }
    }

    for (const section of [...this.schema.sections].sort((a, b) => a.order - b.order)) {
      if (!this.evaluateCondition(section.conditional, formData)) {
        continue
      }

      const template = this.getCompiledTemplate(section.content)
      const content = template(formData)

      renderedSections.push({
        id: section.id,
        title: section.title,
        content,
        order: section.order,
      })
    }

    const fullContent = renderedSections.map((s) => s.content).join('\n\n')

    return {
      sections: renderedSections,
      fullContent,
      missingFields,
      warnings,
    }
  }

  getSchema(): TemplateSchema {
    return this.schema
  }

  getFields(): TemplateField[] {
    return this.schema.fields
  }

  getSections(): TemplateSection[] {
    return this.schema.sections
  }

  validateFormData(formData: Record<string, unknown>): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    for (const field of this.schema.fields) {
      if (!this.evaluateCondition(field.conditional, formData)) {
        continue
      }

      const value = formData[field.name]
      const validation = this.validateField(field, value)
      if (!validation.valid) {
        errors[field.name] = validation.error!
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  getDefaultFormData(): Record<string, unknown> {
    const defaults: Record<string, unknown> = {}

    for (const field of this.schema.fields) {
      if (field.default !== undefined) {
        defaults[field.name] = field.default
      }
    }

    return defaults
  }
}

export function createTemplateEngine(schema: TemplateSchema): TemplateEngine {
  return new TemplateEngine(schema)
}