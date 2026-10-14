'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@prelegal/ui'
import { FileText, Plus, Clock, Eye, Download, Trash2, ExternalLink, MoreHorizontal } from 'lucide-react'
import { formatRelativeTime } from '@prelegal/shared'

const mockDocuments = [
  {
    id: '1',
    title: 'Service Agreement - Acme Corp',
    templateName: 'Service Agreement',
    status: 'completed' as const,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isFavorite: true,
  },
  {
    id: '2',
    title: 'NDA - StartupXYZ',
    templateName: 'Non-Disclosure Agreement',
    status: 'draft' as const,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: '3',
    title: 'Freelance Contract - Design Project',
    templateName: 'Freelance Contract',
    status: 'draft' as const,
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isFavorite: true,
  },
  {
    id: '4',
    title: 'Employment Agreement - John Smith',
    templateName: 'Employment Agreement',
    status: 'archived' as const,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
]

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-text-secondary mt-1">
            Manage your documents and create new ones from templates.
          </p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-text-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-text-tertiary">+2 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts in Progress</CardTitle>
            <Clock className="h-4 w-4 text-text-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-text-tertiary">Auto-saved every 30s</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <Download className="h-4 w-4 text-text-tertiary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-text-tertiary">8 exports total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Recent Documents</h2>
        <Link href="/dashboard/documents" className="text-sm text-primary-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-4">
        {mockDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text-primary truncate">{doc.title}</h3>
                      {doc.isFavorite && (
                        <span className="text-warning-500" title="Favorite">
                          ★
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{doc.templateName}</p>
                    <p className="text-xs text-text-tertiary mt-1">Updated {formatRelativeTime(doc.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={doc.status === 'completed' ? 'success' : doc.status === 'draft' ? 'default' : 'secondary'}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link href="/dashboard/documents">
          <Button variant="outline">View All Documents</Button>
        </Link>
      </div>
    </div>
  )
}