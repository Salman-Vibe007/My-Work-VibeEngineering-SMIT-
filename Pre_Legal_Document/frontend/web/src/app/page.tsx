import Link from 'next/link'
import { Button } from '@prelegal/ui'
import { FileText, Shield, Zap, Users, CheckCircle, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Smart Templates',
    description: 'Versioned, jurisdiction-aware templates with guided forms and conditional logic.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'End-to-end encryption, granular permissions, and full data ownership.',
  },
  {
    icon: Zap,
    title: 'AI-Assisted Drafting',
    description: 'Optional AI suggestions for clarity, tone, and completeness with full user control.',
  },
  {
    icon: Users,
    title: 'Team Workspaces',
    description: 'Collaborate with role-based access, shared templates, and centralized billing.',
  },
]

const templates = [
  { category: 'Business', count: 12, examples: ['Service Agreements', 'NDAs', 'Consulting Agreements'] },
  { category: 'Employment', count: 8, examples: ['Offer Letters', 'Employment Agreements', 'Warning Letters'] },
  { category: 'Freelancing', count: 6, examples: ['Freelance Contracts', 'Project Agreements', 'Payment Terms'] },
  { category: 'Personal', count: 10, examples: ['Authorization Letters', 'Declarations', 'Consent Letters'] },
  { category: 'Property', count: 7, examples: ['Rental Agreements', 'Notices', 'Property Letters'] },
  { category: 'Disputes', count: 5, examples: ['Demand Letters', 'Breach Notices', 'Settlement Proposals'] },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 to-white py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Now in Public Beta
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6">
              Create Professional{' '}
              <span className="text-primary-600">Legal Documents</span>{' '}
              in Minutes
            </h1>
            <p className="text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              Guided templates, smart forms, and secure document management for individuals,
              startups, and legal professionals. No legal expertise required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Start Free — No Credit Card
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Templates
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-text-tertiary">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>5 free documents/month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Everything you need for professional documents
            </h2>
            <p className="text-lg text-text-secondary">
              From template selection to final export — a complete document preparation workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border-light bg-background-secondary hover:border-primary-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Categories */}
      <section className="py-20 lg:py-28 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              Templates for every situation
            </h2>
            <p className="text-lg text-text-secondary">
              48+ professionally structured templates across 6 categories, with more added weekly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-border-light bg-background-secondary hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{template.category}</h3>
                    <p className="text-sm text-text-tertiary">{template.count} templates</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    {template.count}
                  </span>
                </div>
                <ul className="space-y-2">
                  {template.examples.map((example, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/templates">
              <Button variant="outline" size="lg">
                View All Templates
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
              From template to final document in 4 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Choose Template', description: 'Browse 48+ templates by category or search by keyword' },
              { step: '02', title: 'Answer Questions', description: 'Guided form with validation and conditional fields' },
              { step: '03', title: 'Review & Edit', description: 'Rich-text editor with AI suggestions and version history' },
              { step: '04', title: 'Export & Share', description: 'PDF/DOCX export with secure sharing links' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-bold text-lg">
                    {item.step}
                  </span>
                </div>
                <div className="pt-6 text-center">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-text-secondary">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-primary-200 to-transparent hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to create your first document?
          </h2>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
            Join thousands of professionals who trust Pre Legal Document Generator for their document needs.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-neutral-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Pre Legal Document Generator</h3>
              <p className="text-neutral-400 text-sm">
                Professional document preparation made simple. Create, customize, and manage legal documents with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/templates" className="hover:text-white">Templates</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/disclaimer" className="hover:text-white">Legal Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
            <p>© 2024 Pre Legal Document Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}