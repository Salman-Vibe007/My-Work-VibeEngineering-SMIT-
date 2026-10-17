import { Prisma } from '@prisma/client'

export function toPrismaJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, toPrismaJsonValue(entry)])
  ) as Prisma.InputJsonObject
}

export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  const normalized = toPrismaJsonValue(value)
  if (normalized === null) throw new Error('Top-level JSON null cannot be stored as document content')
  return normalized
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) return null
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return value
  }
  if (Array.isArray(value)) return value.map(toPrismaJsonValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toPrismaJsonValue(entry)])
    ) as Prisma.InputJsonObject
  }
  throw new Error('Value is not valid JSON')
}
