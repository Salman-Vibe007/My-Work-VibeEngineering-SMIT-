import { describe, expect, it } from 'vitest'
import { cn } from '../src/lib/utils'

describe('class name utility', () => {
  it('joins conditional classes and resolves conflicting Tailwind classes', () => {
    expect(cn('px-2 text-sm', false && 'hidden', 'px-4')).toBe('text-sm px-4')
  })

  it('preserves unrelated classes and handles conditional objects', () => {
    expect(cn('rounded-md', { 'bg-primary-500': true, hidden: false }, ['font-medium']))
      .toBe('rounded-md bg-primary-500 font-medium')
  })
})
