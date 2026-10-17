import type { Metadata, Viewport } from 'next'
// Replaced next/font/google to prevent connection errors
const inter = {
  variable: '--font-inter',
  className: 'font-sans',
};

export const metadata: Metadata = {
  title: 'Pre Legal Document Generator',
  description: 'Create professional pre-legal documents with guided templates',
  keywords: ['legal documents', 'templates', 'contracts', 'agreements', 'SaaS'],
  authors: [{ name: 'Pre Legal Document Generator' }],
  creator: 'Pre Legal Document Generator',
  publisher: 'Pre Legal Document Generator',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://prelegal.app',
    title: 'Pre Legal Document Generator',
    description: 'Create professional pre-legal documents with guided templates',
    siteName: 'Pre Legal Document Generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pre Legal Document Generator',
    description: 'Create professional pre-legal documents with guided templates',
  },
  verification: {
    google: 'google-site-verification-code',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}