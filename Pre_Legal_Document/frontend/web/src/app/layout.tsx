import { Providers } from '../components/providers'
import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Prelegal | A clearer first draft',
  description: 'Prepare document drafts with guided templates, clear review steps, and your words in control.',
  keywords: ['legal documents', 'templates', 'contracts', 'agreements', 'SaaS'],
  authors: [{ name: 'Pre Legal Document Generator' }],
  creator: 'Prelegal',
  publisher: 'Prelegal',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Prelegal | A clearer first draft',
    description: 'Prepare document drafts with guided templates, clear review steps, and your words in control.',
    siteName: 'Prelegal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prelegal | A clearer first draft',
    description: 'Prepare document drafts with guided templates, clear review steps, and your words in control.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#172033' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}