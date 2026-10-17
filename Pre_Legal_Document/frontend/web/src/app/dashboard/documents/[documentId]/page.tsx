'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { TemplateSchema } from '@prelegal/shared'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@prelegal/ui'
import { DocumentFields } from '@/components/document-fields'

interface Section {
  id: string
  title: string
  content: string
  order: number
}

interface DocumentRecord {
  id: string
  title: string
  status: 'DRAFT' | 'COMPLETED' | 'ARCHIVED' | 'DELETED'
  template: { title: string }
  currentVersion: { formData: Record<string, unknown>; content: Section[]; version: number } | null
}

interface ExportJob {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  error?: string | null
}

export default function DocumentEditorPage() {
  const params = useParams<{ documentId: string }>()
  const router = useRouter()
  const [document, setDocument] = useState<DocumentRecord | null>(null)
  const [schema, setSchema] = useState<TemplateSchema | null>(null)
  const [title, setTitle] = useState('')
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [sections, setSections] = useState<Section[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [autoSaveFailed, setAutoSaveFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const savingRef = useRef(false)

  useEffect(() => {
    fetch(`/api/documents/${params.documentId}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load document.')
        const current = result.document as DocumentRecord
        setDocument(current)
        setSchema(result.schema)
        setTitle(current.title)
        setFormData(current.currentVersion?.formData ?? {})
        setSections(current.currentVersion?.content ?? [])
        setLoaded(true)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load document.'))
  }, [params.documentId])

  const save = useCallback(async (manual = false): Promise<boolean> => {
    if (!loaded || savingRef.current) return false
    if (manual) setAutoSaveFailed(false)
    savingRef.current = true
    setSaving(true)
    setDirty(false)
    setError('')
    try {
      const response = await fetch(`/api/documents/${params.documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, formData }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save document.')
      setDocument(result.document)
      setSections(result.document.currentVersion?.content ?? [])
      return true
    } catch (cause) {
      setDirty(true)
      setAutoSaveFailed(true)
      setError(cause instanceof Error ? cause.message : 'Unable to save document.')
      return false
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [loaded, params.documentId, title, formData])

  useEffect(() => {
    if (!loaded || !dirty || autoSaveFailed) return
    const timer = window.setTimeout(() => {
      if (!savingRef.current) void save()
    }, 800)
    return () => window.clearTimeout(timer)
  }, [autoSaveFailed, dirty, loaded, save, saving])

  async function updateStatus(status: 'completed' | 'archived') {
    const response = await fetch(`/api/documents/${params.documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await response.json()
    if (!response.ok) {
      setError(result.error || 'Unable to update document status.')
      return
    }
    setDocument(result.document)
  }

  async function removeDocument() {
    if (!window.confirm('Move this document to the trash?')) return
    const response = await fetch(`/api/documents/${params.documentId}`, { method: 'DELETE' })
    if (!response.ok) {
      const result = await response.json()
      setError(result.error || 'Unable to delete document.')
      return
    }
    router.push('/dashboard/documents')
  }

  async function exportDocument(format: 'pdf' | 'docx') {
    setExporting(true)
    setExportMessage(`Preparing ${format.toUpperCase()}…`)
    setError('')
    try {
      if (dirty && !(await save(true))) throw new Error('Save your changes before exporting.')
      const response = await fetch(`/api/documents/${params.documentId}/exports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to start export.')
      const job = result.job as ExportJob
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
        const statusResponse = await fetch(`/api/documents/${params.documentId}/exports/${job.id}`)
        const statusResult = await statusResponse.json()
        if (!statusResponse.ok) throw new Error(statusResult.error || 'Unable to check export status.')
        if (statusResult.job.status === 'FAILED') throw new Error(statusResult.job.error || 'Export failed.')
        if (statusResult.job.status === 'COMPLETED') {
          const fileResponse = await fetch(`/api/documents/${params.documentId}/exports/${job.id}/download`)
          if (!fileResponse.ok) throw new Error('Unable to download completed export.')
          const url = URL.createObjectURL(await fileResponse.blob())
          const link = window.document.createElement('a')
          link.href = url
          link.download = `${title}.${format}`
          window.document.body.appendChild(link)
          link.click()
          link.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
          setExportMessage('Export downloaded.')
          return
        }
      }
      throw new Error('Export is taking longer than expected. Check back in a moment.')
    } catch (cause) {
      setExportMessage('')
      setError(cause instanceof Error ? cause.message : 'Unable to export document.')
    } finally {
      setExporting(false)
    }
  }

  if (error && !loaded) {
    return <p role="alert" className="rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>
  }
  if (!loaded || !document || !schema) return <p aria-live="polite" className="text-text-secondary">Loading document…</p>

  const missingRequired = schema.fields.some((field) => {
    if (!field.required) return false
    const value = formData[field.name]
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Link href="/dashboard/documents" className="text-sm text-primary-600 hover:underline">← All documents</Link><p className="mt-2 text-sm text-text-secondary">{document.template.title} · {document.status.toLowerCase()}</p><h1 className="text-3xl font-bold text-text-primary">Edit document</h1></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void exportDocument('pdf')} disabled={saving || exporting}>Download PDF</Button>
          <Button variant="outline" onClick={() => void exportDocument('docx')} disabled={saving || exporting}>Download DOCX</Button>
          {document.status === 'DRAFT' && <Button onClick={() => void updateStatus('completed')} disabled={missingRequired || dirty || saving}>Mark complete</Button>}
          <Button variant="ghost" onClick={() => void removeDocument()}>Move to trash</Button>
        </div>
      </header>
      {error && <p role="alert" className="rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
      {exportMessage && <p role="status" className="rounded-lg bg-primary-50 p-3 text-sm text-primary-700">{exportMessage}</p>}
      <p className="text-sm text-text-tertiary" aria-live="polite">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : `Saved${document.currentVersion ? ` · version ${document.currentVersion.version}` : ''}`}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Document details</CardTitle></CardHeader><CardContent className="space-y-6">
          <Input label="Document title" maxLength={200} value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true); setAutoSaveFailed(false) }} />
          <DocumentFields fields={schema.fields} values={formData} onChange={(name, value) => { setFormData((current) => ({ ...current, [name]: value })); setDirty(true); setAutoSaveFailed(false) }} />
          {missingRequired && <p className="text-sm text-warning-700">Complete the required fields before marking this document complete or exporting it.</p>}
          <Button variant="outline" onClick={() => void save(true)} disabled={!dirty || saving}>Save now</Button>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Draft preview</CardTitle></CardHeader><CardContent className="space-y-5">
          {sections.map((section) => <section key={section.id}><h2 className="mb-2 font-semibold text-text-primary">{section.title}</h2><p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{section.content}</p></section>)}
          {sections.length === 0 && <p className="text-sm text-text-secondary">Your draft preview will appear here as you fill in the form.</p>}
          <p className="border-t border-border-light pt-4 text-xs text-text-tertiary">This is a draft for your review and is not legal advice. Confirm the details and seek qualified legal counsel where appropriate.</p>
        </CardContent></Card>
      </div>
    </div>
  )
}
