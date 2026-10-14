import { z } from 'zod'
import type { TemplateField, TemplateSchema, TemplateCategory, Jurisdiction, SelectOption } from '@prelegal/shared'

export const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  disabled: z.boolean().optional(),
}) satisfies z.ZodType<SelectOption>

export const fieldValidationSchema = z.object({
  minLength: z.number().int().positive().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  custom: z.string().optional(),
})

export const conditionalLogicSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty']),
  value: z.unknown(),
})

export const templateFieldSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum([
    'text',
    'textarea',
    'number',
    'currency',
    'date',
    'select',
    'multiselect',
    'checkbox',
    'radio',
    'email',
    'phone',
    'url',
  ]),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  options: z.array(selectOptionSchema).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: fieldValidationSchema.optional(),
  conditional: conditionalLogicSchema.optional(),
}) satisfies z.ZodType<TemplateField>

export const templateSectionSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string(),
  order: z.number().int().nonnegative(),
  conditional: conditionalLogicSchema.optional(),
})

export const jurisdictionSchema = z.object({
  country: z.string().length(2),
  region: z.string().optional(),
  displayName: z.string(),
}) satisfies z.ZodType<Jurisdiction>

export const templateSchemaSchema = z.object({
  id: z.string().min(1).max(100),
  version: z.number().int().positive(),
  title: z.string().min(1).max(200),
  category: z.enum([
    'business',
    'employment',
    'freelancing',
    'personal',
    'property',
    'finance',
    'disputes',
    'general',
  ]) satisfies z.ZodType<TemplateCategory>,
  jurisdiction: z.object({
    country: z.string().length(2),
    region: z.string().optional(),
  }),
  fields: z.array(templateFieldSchema),
  sections: z.array(templateSectionSchema),
}) satisfies z.ZodType<TemplateSchema>

export const templateCreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    'business',
    'employment',
    'freelancing',
    'personal',
    'property',
    'finance',
    'disputes',
    'general',
  ]),
  jurisdictionCountry: z.string().length(2),
  jurisdictionRegion: z.string().optional(),
  isPremium: z.boolean().default(false),
  schema: templateSchemaSchema,
})

export const templateUpdateSchema = templateCreateSchema.partial()

export const documentFormDataSchema = z.record(z.unknown())

export const documentCreateSchema = z.object({
  title: z.string().min(1).max(200),
  templateId: z.string().uuid(),
  templateVersion: z.number().int().positive(),
  formData: documentFormDataSchema,
  jurisdictionCountry: z.string().length(2),
  jurisdictionRegion: z.string().optional(),
  organizationId: z.string().uuid().optional(),
})

export const documentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  formData: documentFormDataSchema.optional(),
  content: z.array(templateSectionSchema).optional(),
  status: z.enum(['draft', 'completed', 'archived']).optional(),
  isFavorite: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
  locale: z.string().length(2).default('en'),
  preferredJurisdiction: z.string().length(2).optional(),
})

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
  locale: z.string().length(2).optional(),
  preferredJurisdiction: z.string().length(2).optional(),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
})

export const passwordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

export const organizationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
})

export const organizationMemberInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['workspace_member', 'workspace_owner']).default('workspace_member'),
})

export const organizationMemberUpdateSchema = z.object({
  role: z.enum(['workspace_member', 'workspace_owner']),
})

export const planCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  priceMonthly: z.number().int().nonnegative(),
  priceYearly: z.number().int().nonnegative(),
  interval: z.enum(['month', 'year']).default('month'),
  features: z.record(z.unknown()),
  limits: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
})

export const planUpdateSchema = planCreateSchema.partial()

export const subscriptionCreateSchema = z.object({
  planId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
})

export const subscriptionUpdateSchema = z.object({
  planId: z.string().uuid().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

export const documentShareCreateSchema = z.object({
  documentId: z.string().uuid(),
  expiresAt: z.date().optional(),
  maxViews: z.number().int().positive().optional(),
})

export const documentShareUpdateSchema = z.object({
  expiresAt: z.date().optional(),
  maxViews: z.number().int().positive().optional(),
  isRevoked: z.boolean().optional(),
})

export const aiSuggestionRequestSchema = z.object({
  documentId: z.string().uuid(),
  type: z.enum(['improve', 'explain', 'summarize', 'compare', 'suggest_template', 'flag_issue']),
  text: z.string().optional(),
  context: z.record(z.unknown()).optional(),
})

export const generationJobCreateSchema = z.object({
  documentId: z.string().uuid(),
  type: z.enum(['pdf_generation', 'docx_generation', 'ai_suggestion', 'email_send', 'export']),
  input: z.record(z.unknown()),
})

export const webhookEventSchema = z.object({
  provider: z.string(),
  eventType: z.string(),
  eventId: z.string(),
  payload: z.record(z.unknown()),
})

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  jurisdiction: z.string().optional(),
  isPremium: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
})

export type TemplateFieldInput = z.infer<typeof templateFieldSchema>
export type TemplateSchemaInput = z.infer<typeof templateSchemaSchema>
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>
export type DocumentFormDataInput = z.infer<typeof documentFormDataSchema>
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>
export type UserRegisterInput = z.infer<typeof userRegisterSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>
export type OrganizationMemberInviteInput = z.infer<typeof organizationMemberInviteSchema>
export type OrganizationMemberUpdateInput = z.infer<typeof organizationMemberUpdateSchema>
export type PlanCreateInput = z.infer<typeof planCreateSchema>
export type PlanUpdateInput = z.infer<typeof planUpdateSchema>
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>
export type DocumentShareCreateInput = z.infer<typeof documentShareCreateSchema>
export type DocumentShareUpdateInput = z.infer<typeof documentShareUpdateSchema>
export type AISuggestionRequestInput = z.infer<typeof aiSuggestionRequestSchema>
export type GenerationJobCreateInput = z.infer<typeof generationJobCreateSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type FilterInput = z.infer<typeof filterSchema>