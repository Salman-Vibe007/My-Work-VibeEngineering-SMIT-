import type { ConditionalLogic } from '@prelegal/shared'

export function evaluateTemplateCondition(
  conditional: ConditionalLogic | undefined,
  values: Record<string, unknown>
): boolean {
  if (!conditional) return true

  const fieldValue = values[conditional.field]
  switch (conditional.operator) {
    case 'equals':
      return fieldValue === conditional.value
    case 'notEquals':
      return fieldValue !== conditional.value
    case 'contains':
      return String(fieldValue ?? '').includes(String(conditional.value ?? ''))
    case 'notContains':
      return !String(fieldValue ?? '').includes(String(conditional.value ?? ''))
    case 'isEmpty':
      return fieldValue === undefined || fieldValue === null || fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
    case 'isNotEmpty':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '' &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
  }
}
