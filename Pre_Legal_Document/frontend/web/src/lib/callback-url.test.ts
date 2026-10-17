import { describe, expect, it } from 'vitest'
import { getSafeCallbackUrl } from './callback-url'

describe('getSafeCallbackUrl', () => {
  it('uses the dashboard when no callback is supplied', () => {
    expect(getSafeCallbackUrl(null)).toBe('/dashboard')
  })

  it('preserves safe application-relative callbacks', () => {
    expect(getSafeCallbackUrl('/dashboard/documents?sort=recent#list'))
      .toBe('/dashboard/documents?sort=recent#list')
  })

  it.each([
    'https://attacker.example',
    '//attacker.example/path',
    '/\\attacker.example/path',
    'javascript:alert(1)',
  ])('rejects external callback URL %s', (candidate) => {
    expect(getSafeCallbackUrl(candidate)).toBe('/dashboard')
  })
})
