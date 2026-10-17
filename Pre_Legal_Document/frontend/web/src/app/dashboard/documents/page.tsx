'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Badge, Card, CardContent } from '@prelegal/ui'
import { Plus } from 'lucide-react'

interface DocumentListItem {
  id: string
  title: string
  status: string
  updatedAt: string
  template: { title: string }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load documents.')
        const result = await response.json()
        setDocuments(result.documents)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load documents.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold text-text-primary">Documents</h1><p className="mt-1 text-text-secondary">Your saved drafts and completed documents.</p></div>
        <Button asChild><Link href="/dashboard/documents/new"><Plus className="mr-2 h-4 w-4" />New document</Link></Button>
      </header>
      {error && <p role="alert" className="rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
      {loading ? <p aria-live="polite" className="text-sm text-text-secondary">Loading documents…</p> :
        documents.length === 0 ? <Card><CardContent className="py-10 text-center text-text-secondary">No documents yet.</CardContent></Card> :
          <div className="space-y-3">{documents.map((document) => (
            <Card key={document.id}><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><Link href={`/dashboard/documents/${document.id}`} className="font-medium text-text-primary hover:text-primary-600">{document.title}</Link><p className="text-sm text-text-secondary">{document.template.title}</p></div>
              <div className="flex items-center gap-3"><Badge variant={document.status === 'COMPLETED' ? 'success' : document.status === 'ARCHIVED' ? 'secondary' : 'default'}>{document.status.toLowerCase()}</Badge><span className="text-xs text-text-tertiary">{new Date(document.updatedAt).toLocaleString()}</span></div>
            </CardContent></Card>
          ))}</div>}
    </section>
  )
}
