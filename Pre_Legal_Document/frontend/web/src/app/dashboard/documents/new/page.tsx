'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import type { TemplateSchema } from '@prelegal/shared'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@prelegal/ui'
import { DocumentFields } from '@/components/document-fields'

interface Template {
  id: string
  title: string
  description: string | null
  isPremium: boolean
  version: number
  jurisdictionCountry: string
  jurisdictionRegion: string | null
  schema: TemplateSchema | null
}

export default function NewDocumentPage() {
  return <Suspense fallback={<p aria-busy="true">Loading templates…</p>}><NewDocumentForm /></Suspense>
}

function NewDocumentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTemplateId = searchParams.get('template')
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState(selectedTemplateId || '')
  const [title, setTitle] = useState('')
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/templates')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load templates.')
        const result = await response.json()
        setTemplates(result.templates)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load templates.'))
      .finally(() => setLoading(false))
  }, [])

  const template = templates.find((item) => item.id === templateId)
  const schema = template?.schema
  const defaultData = useMemo(
    () => Object.fromEntries((schema?.fields ?? []).filter((field) => field.default !== undefined).map((field) => [field.name, field.default])),
    [schema]
  )

  useEffect(() => {
    setFormData(defaultData)
    if (template) setTitle((current) => current || template.title)
  }, [defaultData, template])

  async function createDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!template || !schema || template.isPremium) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          templateId: template.id,
          templateVersion: template.version,
          formData,
          jurisdictionCountry: template.jurisdictionCountry,
          jurisdictionRegion: template.jurisdictionRegion || undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to create document.')
      router.push(`/dashboard/documents/${result.document.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create document.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p aria-live="polite" className="text-text-secondary">Loading templates…</p>
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><Link href="/templates" className="text-sm text-primary-600 hover:underline">← Template library</Link><h1 className="mt-2 text-3xl font-bold text-text-primary">Create a document</h1></div>
      {error && <p role="alert" className="rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
      <Card>
        <CardHeader><CardTitle>Start with a template</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setTemplateId(item.id); setTitle(item.title) }}
                className={`rounded-lg border p-4 text-left ${item.id === templateId ? 'border-primary-500 bg-primary-50' : 'border-border-light'}`}
              >
                <span className="font-medium text-text-primary">{item.title}</span>
                {item.isPremium && <span className="ml-2 text-xs text-warning-600">Premium</span>}
                <span className="mt-1 block text-sm text-text-secondary">{item.description}</span>
              </button>
            ))}
            {templates.length === 0 && <p className="text-sm text-text-secondary">No published templates are available yet.</p>}
          </div>
        </CardContent>
      </Card>
      {template && schema && !template.isPremium && (
        <Card><CardHeader><CardTitle>Document details</CardTitle></CardHeader><CardContent>
          <form onSubmit={createDocument} className="space-y-6">
            <Input label="Document title" required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} />
            <DocumentFields fields={schema.fields} values={formData} onChange={(name, value) => setFormData((previous) => ({ ...previous, [name]: value }))} />
            <p className="text-xs text-text-tertiary">Drafts can be saved with incomplete information and finished later. This document is a draft for review, not legal advice.</p>
            <Button type="submit" loading={saving}>Create draft</Button>
          </form>
        </CardContent></Card>
      )}
      {template?.isPremium && <p role="status" className="rounded-lg bg-warning-50 p-4 text-sm text-warning-700">This template is available on a premium plan. Choose a free template to continue.</p>}
    </div>
  )
}
