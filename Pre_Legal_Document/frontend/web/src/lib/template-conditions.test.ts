import { describe, expect, it } from 'vitest'
import { evaluateTemplateCondition } from './template-conditions'

describe('evaluateTemplateCondition', () => {
  it('preserves false and zero when evaluating contains conditions', () => {
    expect(evaluateTemplateCondition(
      { field: 'amount', operator: 'contains', value: '0' },
      { amount: 0 }
    )).toBe(true)
    expect(evaluateTemplateCondition(
      { field: 'enabled', operator: 'contains', value: 'false' },
      { enabled: false }
    )).toBe(true)
  })

  it('handles missing values and empty arrays without throwing', () => {
    expect(evaluateTemplateCondition(
      { field: 'choice', operator: 'isEmpty' },
      {}
    )).toBe(true)
    expect(evaluateTemplateCondition(
      { field: 'choice', operator: 'isNotEmpty' },
      { choice: [] }
    )).toBe(false)
  })
})
