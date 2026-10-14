'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Input } from '@prelegal/ui'
import { Search, Filter, ChevronDown, FileText, Star, ExternalLink } from 'lucide-react'
import { cn } from '@prelegal/shared'

const categories = ['All', 'Business', 'Employment', 'Freelancing', 'Personal', 'Property', 'Finance', 'Disputes', 'General']

const mockTemplates = [
  {
    id: '1',
    title: 'Service Agreement',
    category: 'Business',
    description: 'A general service agreement between a client and service provider.',
    isPremium: false,
    jurisdiction: 'US',
    fieldsCount: 7,
  },
  {
    id: '2',
    title: 'Non-Disclosure Agreement (NDA)',
    category: 'Business',
    description: 'A mutual non-disclosure agreement for protecting confidential information.',
    isPremium: false,
    jurisdiction: 'US',
    fieldsCount: 5,
  },
  {
    id: '3',
    title: 'Employment Agreement',
    category: 'Employment',
    description: 'Standard employment agreement for full-time employees.',
    isPremium: true,
    jurisdiction: 'US',
    fieldsCount: 7,
  },
  {
    id: '4',
    title: 'Freelance Contract',
    category: 'Freelancing',
    description: 'Contract for freelance/project-based work.',
    isPremium: false,
    jurisdiction: 'US',
    fieldsCount: 7,
  },
  {
    id: '5',
    title: 'Residential Rental Agreement',
    category: 'Property',
    description: 'Standard residential lease agreement.',
    isPremium: true,
    jurisdiction: 'US',
    fieldsCount: 8,
  },
  {
    id: '6',
    title: 'Demand Letter',
    category: 'Disputes',
    description: 'Formal demand letter for payment or performance.',
    isPremium: false,
    jurisdiction: 'US',
    fieldsCount: 7,
  },
  {
    id: '7',
    title: 'Consulting Agreement',
    category: 'Business',
    description: 'Agreement for consulting services with deliverables and milestones.',
    isPremium: true,
    jurisdiction: 'US',
    fieldsCount: 9,
  },
  {
    id: '8',
    title: 'Offer Letter',
    category: 'Employment',
    description: 'Formal job offer letter with terms and conditions.',
    isPremium: false,
    jurisdiction: 'US',
    fieldsCount: 8,
  },
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesPremium = !showPremiumOnly || template.isPremium
    return matchesSearch && matchesCategory && matchesPremium
  })

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-border-light bg-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Template Library</h1>
              <p className="text-text-secondary">Browse 48+ professionally structured templates</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/documents/new">
                <ExternalLink className="mr-2 h-4 w-4" />
                Create Document
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label htmlFor="search" className="sr-only">Search templates</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <Input
                      id="search"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-3">Categories</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                          selectedCategory === category
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-text-secondary hover:bg-neutral-100 hover:text-text-primary'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPremiumOnly}
                      onChange={(e) => setShowPremiumOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-border-medium text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-text-secondary">Premium templates only</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-text-secondary">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
              </p>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          {template.isPremium && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-text-secondary text-sm mb-4">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {template.fieldsCount} fields
                      </span>
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {template.jurisdiction}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link href={`/dashboard/documents/new?template=${template.id}`}>
                        Use Template
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No templates found</h3>
                <p className="text-text-secondary">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}