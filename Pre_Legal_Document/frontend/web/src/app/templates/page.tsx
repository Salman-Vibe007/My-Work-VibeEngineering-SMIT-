'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Badge, Card, CardContent, CardFooter, CardHeader, CardTitle, Input } from '@prelegal/ui'
import { FileText, Search, Star } from 'lucide-react'

interface Template {
  id: string
  title: string
  description: string | null
  category: string
  jurisdictionCountry: string
  isPremium: boolean
  schema: { fields: unknown[] } | null
}

const categories = ['All', 'Business', 'Employment', 'Freelancing', 'Personal', 'Property', 'Finance', 'Disputes', 'General']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load the template library.')
        const result = await response.json()
        setTemplates(result.templates)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load templates.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const matchesSearch = `${template.title} ${template.description ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory.toUpperCase()
    const matchesPremium = !showPremiumOnly || template.isPremium
    return matchesSearch && matchesCategory && matchesPremium
  }), [templates, searchQuery, selectedCategory, showPremiumOnly])

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-border-light bg-background-secondary">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-bold text-text-primary">Template Library</h1><p className="text-text-secondary">Select a template to start a reviewable draft.</p></div>
          <Button variant="outline" asChild><Link href="/dashboard/documents/new">Create document</Link></Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="space-y-5 rounded-xl border border-border-light bg-background-secondary p-5">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input aria-label="Search templates" placeholder="Search templates..." className="pl-10" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
            </div>
            <div><h2 className="mb-2 text-sm font-medium text-text-primary">Categories</h2>
              <div className="space-y-1">{categories.map((category) => <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${selectedCategory === category ? 'bg-primary-50 font-medium text-primary-700' : 'text-text-secondary hover:bg-neutral-100'}`}>{category}</button>)}</div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={showPremiumOnly} onChange={(event) => setShowPremiumOnly(event.target.checked)} />
              Premium templates only
            </label>
          </aside>
          <section>
            <p className="mb-5 text-sm text-text-secondary" aria-live="polite">
              {loading ? 'Loading templates…' : `${filteredTemplates.length} ${filteredTemplates.length === 1 ? 'template' : 'templates'} found`}
            </p>
            {error && <p role="alert" className="mb-5 rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
            {!loading && filteredTemplates.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="flex flex-col">
                    <CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle className="text-lg">{template.title}</CardTitle><Badge variant="outline" className="mt-2">{template.category.toLowerCase()}</Badge></div>
                      {template.isPremium && <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3 fill-current" />Premium</Badge>}
                    </div></CardHeader>
                    <CardContent className="flex-1"><p className="text-sm text-text-secondary">{template.description || 'A guided document template.'}</p><p className="mt-4 flex items-center gap-2 text-xs text-text-tertiary"><FileText className="h-3 w-3" />{template.schema?.fields.length ?? 0} fields <span>·</span>{template.jurisdictionCountry}</p></CardContent>
                    <CardFooter><Button className="w-full" asChild><Link href={`/dashboard/documents/new?template=${template.id}`}>Use template</Link></Button></CardFooter>
                  </Card>
                ))}
              </div>
            )}
            {!loading && filteredTemplates.length === 0 && !error && <div className="py-14 text-center"><FileText className="mx-auto mb-4 h-12 w-12 text-text-tertiary" /><h2 className="font-medium text-text-primary">No templates found</h2><p className="mt-1 text-sm text-text-secondary">Try changing your search or category.</p></div>}
          </section>
        </div>
      </main>
    </div>
  )
}
