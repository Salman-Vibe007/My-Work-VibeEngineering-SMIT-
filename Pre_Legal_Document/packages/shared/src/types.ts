export type UUID = string & { readonly __brand: unique symbol }

export type ISODateString = string & { readonly __brand: unique symbol }

export type Currency = number

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface Jurisdiction {
  country: string
  region?: string
  displayName: string
}

export const JURISDICTIONS: Jurisdiction[] = [
  { country: 'US', displayName: 'United States' },
  { country: 'US', region: 'CA', displayName: 'California, US' },
  { country: 'US', region: 'NY', displayName: 'New York, US' },
  { country: 'US', region: 'TX', displayName: 'Texas, US' },
  { country: 'CA', displayName: 'Canada' },
  { country: 'GB', displayName: 'United Kingdom' },
  { country: 'AU', displayName: 'Australia' },
  { country: 'EU', displayName: 'European Union' },
]

export interface TemplateField {
  name: string
  label: string
  type: FieldType
  required: boolean
  default?: unknown
  options?: SelectOption[]
  placeholder?: string
  helpText?: string
  validation?: FieldValidation
  conditional?: ConditionalLogic
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'email'
  | 'phone'
  | 'url'

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  custom?: string
}

export interface ConditionalLogic {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty'
  value: unknown
}

export interface TemplateSection {
  id: string
  title: string
  content: string
  order: number
  conditional?: ConditionalLogic
}

export interface TemplateSchema {
  id: string
  version: number
  title: string
  category: TemplateCategory
  jurisdiction: {
    country: string
    region?: string
  }
  fields: TemplateField[]
  sections: TemplateSection[]
}

export type TemplateCategory =
  | 'business'
  | 'employment'
  | 'freelancing'
  | 'personal'
  | 'property'
  | 'finance'
  | 'disputes'
  | 'general'

export interface DocumentData {
  id: string
  title: string
  templateId: string
  templateVersion: number
  formData: Record<string, unknown>
  content: TemplateSection[]
  status: DocumentStatus
  ownerId: string
  organizationId?: string
  jurisdictionCountry: string
  jurisdictionRegion?: string
  createdAt: Date
  updatedAt: Date
}

export type DocumentStatus = 'draft' | 'completed' | 'archived' | 'deleted'

export interface UserProfile {
  id: string
  email: string
  name?: string
  image?: string
  locale: string
  preferredJurisdiction?: string
  role: UserRole
}

export type UserRole =
  | 'guest'
  | 'user'
  | 'professional'
  | 'workspace_member'
  | 'workspace_owner'
  | 'administrator'

export interface PlanFeatures {
  templates: 'basic' | 'all'
  generationsPerMonth: number
  exportsPerMonth: number
  versionHistory: boolean
  premiumTemplates: boolean
  aiAssistance: boolean
  workspaces: boolean
  memberRoles?: boolean
  centralizedBilling?: boolean
}

export interface PlanLimits {
  generationsPerMonth: number
  exportsPerMonth: number
  documents: number
  storageMB: number
  members?: number
}

export interface SubscriptionData {
  id: string
  userId?: string
  organizationId?: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
}

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete'

export interface GenerationJobData {
  id: string
  documentId: string
  type: JobType
  status: JobStatus
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
}

export type JobType = 'pdf_generation' | 'docx_generation' | 'ai_suggestion' | 'email_send' | 'export'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface AISuggestion {
  type: 'improve' | 'explain' | 'summarize' | 'compare' | 'suggest_template' | 'flag_issue'
  originalText?: string
  suggestedText?: string
  explanation?: string
  confidence: number
  metadata?: Record<string, unknown>
}

export interface DocumentShareData {
  id: string
  documentId: string
  accessCode: string
  expiresAt?: Date
  maxViews?: number
  viewCount: number
  isRevoked: boolean
}