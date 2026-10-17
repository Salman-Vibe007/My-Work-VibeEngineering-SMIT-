import { describe, expect, it } from 'vitest'
import {
  conditionalLogicSchema,
  documentCreateSchema,
  userLoginSchema,
  userRegisterSchema,
} from '../src/schemas'

describe('validation schemas', () => {
  it('trims registration email and supplies the default locale', () => {
    const parsed = userRegisterSchema.parse({
      name: 'Ada Lovelace',
      email: ' ada@example.com ',
      password: 'secure-password',
    })

    expect(parsed.email).toBe('ada@example.com')
    expect(parsed.locale).toBe('en')
  })

  it('rejects weak passwords and malformed registration emails', () => {
    expect(userRegisterSchema.safeParse({
      name: 'Ada',
      email: 'not-an-email',
      password: 'short',
    }).success).toBe(false)
  })

  it('trims login email while retaining password validation', () => {
    expect(userLoginSchema.parse({ email: ' ada@example.com ', password: 'x' }).email)
      .toBe('ada@example.com')
    expect(userLoginSchema.safeParse({ email: 'ada@example.com', password: '' }).success)
      .toBe(false)
  })

  it('allows valueless conditions for empty checks', () => {
    expect(conditionalLogicSchema.parse({
      field: 'amount',
      operator: 'isEmpty',
    })).toEqual({ field: 'amount', operator: 'isEmpty' })
  })

  it('validates document identifiers, title, jurisdiction, and version', () => {
    const validDocument = {
      title: 'Service agreement',
      templateId: '8f5eb7d6-fd9a-4ec5-88bb-6585394c9807',
      templateVersion: 1,
      formData: { clientName: 'Acme' },
      jurisdictionCountry: 'US',
    }

    expect(documentCreateSchema.safeParse(validDocument).success).toBe(true)
    expect(documentCreateSchema.safeParse({ ...validDocument, templateVersion: 0 }).success)
      .toBe(false)
  })
})
