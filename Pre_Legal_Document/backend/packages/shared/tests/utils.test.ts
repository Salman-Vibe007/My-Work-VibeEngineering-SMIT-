import { describe, expect, it } from 'vitest'
import { formatCurrency, generateSlug, getInitials, omit, pick, truncate } from '../src/utils'

describe('shared utilities', () => {
  it('formats minor currency units without unnecessary decimal places', () => {
    expect(formatCurrency(1250)).toBe('$12.5')
  })

  it('normalizes display text into a URL slug', () => {
    expect(generateSlug('  Service & Support Agreement!  ')).toBe('service-support-agreement')
  })

  it('truncates long text and leaves short text unchanged', () => {
    expect(truncate('A long title', 6)).toBe('A long...')
    expect(truncate('Short', 6)).toBe('Short')
  })

  it('creates initials from the first two name parts', () => {
    expect(getInitials('Ada Byron Lovelace')).toBe('AB')
  })

  it('selects and omits object keys without mutating the original', () => {
    const source = { id: 'doc-1', title: 'Notice', status: 'draft' }

    expect(pick(source, ['id', 'title'])).toEqual({ id: 'doc-1', title: 'Notice' })
    expect(omit(source, ['status'])).toEqual({ id: 'doc-1', title: 'Notice' })
    expect(source).toEqual({ id: 'doc-1', title: 'Notice', status: 'draft' })
  })
})
