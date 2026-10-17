'use client'

import type { TemplateField } from '@prelegal/shared'
import { Input, Textarea } from '@prelegal/ui'
import { evaluateTemplateCondition } from '@/lib/template-conditions'

interface DocumentFieldsProps {
  fields: TemplateField[]
  values: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
}

export function DocumentFields({ fields, values, onChange }: DocumentFieldsProps) {
  return (
    <div className="space-y-5">
      {fields.map((field) => {
        if (!evaluateTemplateCondition(field.conditional, values)) return null
        const value = values[field.name]
        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.name}
              label={field.label}
              aria-required={field.required}
              placeholder={field.placeholder}
              hint={field.helpText}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          )
        }
        if (field.type === 'checkbox') {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={value === true}
                aria-required={field.required}
                onChange={(event) => onChange(field.name, event.target.checked)}
              />
              {field.label}{field.required ? ' *' : ''}
            </label>
          )
        }
        if (field.type === 'select' || field.type === 'radio') {
          return (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-text-primary">
                {field.label}{field.required ? ' *' : ''}
              </label>
              <select
                id={field.name}
                aria-required={field.required}
                className="h-10 w-full rounded-lg border border-border-medium bg-background-secondary px-3 text-sm text-text-primary"
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => onChange(field.name, event.target.value)}
              >
                <option value="">Choose an option</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              {field.helpText && <p className="mt-1.5 text-sm text-text-tertiary">{field.helpText}</p>}
            </div>
          )
        }
        if (field.type === 'multiselect') {
          const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
          return (
            <div key={field.name}>
              <label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-text-primary">
                {field.label}{field.required ? ' *' : ''}
              </label>
              <select
                id={field.name}
                multiple
                aria-required={field.required}
                className="min-h-24 w-full rounded-lg border border-border-medium bg-background-secondary px-3 py-2 text-sm text-text-primary"
                value={selected}
                onChange={(event) =>
                  onChange(field.name, Array.from(event.target.selectedOptions, (option) => option.value))
                }
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              {field.helpText && <p className="mt-1.5 text-sm text-text-tertiary">{field.helpText}</p>}
            </div>
          )
        }
        const inputType =
          field.type === 'currency' ? 'number' :
          field.type === 'phone' ? 'tel' :
          field.type === 'url' ? 'url' :
          field.type
        return (
          <Input
            key={field.name}
            label={field.label}
            type={inputType}
            aria-required={field.required}
            placeholder={field.placeholder}
            hint={field.helpText}
            min={field.validation?.min}
            max={field.validation?.max}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            onChange={(event) =>
              onChange(
                field.name,
                inputType === 'number' && event.target.value !== ''
                  ? Number(event.target.value)
                  : event.target.value
              )
            }
          />
        )
      })}
    </div>
  )
}
