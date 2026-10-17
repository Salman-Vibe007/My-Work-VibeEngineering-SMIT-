'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@prelegal/ui'
import { Clock, FileText, Plus } from 'lucide-react'

interface DashboardDocument {
  id: string
  title: string
  status: string
  updatedAt: string
  template: { title: string }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<DashboardDocument[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load your documents.')
        const result = await response.json()
        setDocuments(result.documents)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load documents.'))
      .finally(() => setLoading(false))
  }, [])

  const drafts = documents.filter((document) => document.status === 'DRAFT').length
  const completed = documents.filter((document) => document.status === 'COMPLETED').length
  const recentDocuments = documents.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="mt-1 text-text-secondary">Manage your documents and create new ones from templates.</p>
        </div>
        <Button size="lg" className="gap-2" asChild>
          <Link href="/dashboard/documents/new"><Plus className="h-4 w-4" />New Document</Link>
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Total Documents" value={loading ? '—' : documents.length} icon={<FileText className="h-4 w-4 text-text-tertiary" />} />
        <StatCard title="Drafts in Progress" value={loading ? '—' : drafts} icon={<Clock className="h-4 w-4 text-text-tertiary" />} />
        <StatCard title="Completed Documents" value={loading ? '—' : completed} icon={<FileText className="h-4 w-4 text-text-tertiary" />} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Documents</h2>
        <Link href="/dashboard/documents" className="text-sm text-primary-600 hover:underline">View all</Link>
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary" aria-live="polite">Loading documents…</p>
      ) : recentDocuments.length === 0 ? (
        <Card><CardContent className="py-10 text-center">
          <p className="font-medium text-text-primary">No documents yet</p>
          <p className="mt-1 text-sm text-text-secondary">Choose a template to create your first draft.</p>
          <Button className="mt-4" asChild><Link href="/templates">Browse templates</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {recentDocuments.map((document) => (
            <Card key={document.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/dashboard/documents/${document.id}`} className="font-medium text-text-primary hover:text-primary-600">
                    {document.title}
                  </Link>
                  <p className="text-sm text-text-secondary">{document.template.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={document.status === 'COMPLETED' ? 'success' : document.status === 'ARCHIVED' ? 'secondary' : 'default'}>
                    {document.status.toLowerCase()}
                  </Badge>
                  <span className="text-xs text-text-tertiary">{new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  )
}
