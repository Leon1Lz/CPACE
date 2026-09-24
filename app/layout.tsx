import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SessionProvider } from '@/components/providers/session-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://cpaceph.com'),
  title: {
    default: 'CPACE Philippines | Professional Advancement & Continuing Education',
    template: '%s | CPACE Philippines',
  },
  description: 'CPACE Philippines — Professional development and continuing education learning management system.',
  keywords: ['CPACE', 'Philippines', 'Continuing Professional Development', 'CPD', 'Online Learning', 'Assessments', 'Proctoring'],
  authors: [{ name: 'CPACE Philippines' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: 'https://cpaceph.com',
    siteName: 'CPACE Philippines',
    title: 'CPACE Philippines | Professional Advancement & Continuing Education',
    description: 'CPACE Philippines — Professional development and continuing education learning management system.',
    images: [
      {
        url: '/cpace-logo.png',
        width: 1200,
        height: 630,
        alt: 'CPACE Philippines',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CPACE Philippines | Professional Advancement & Continuing Education',
    description: 'CPACE Philippines — Professional development and continuing education learning management system.',
    images: ['/cpace-logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background scroll-smooth">
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <SessionProvider>
          {children}
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
