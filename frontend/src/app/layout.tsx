import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'AegisShield – Income Protection for Delivery Workers',
  description:
    'AI-powered parametric insurance that automatically protects India's delivery workers from income loss due to weather, outages, and disruptions.',
  keywords: 'parametric insurance, delivery workers, income protection, gig economy, India',
  openGraph: {
    title: 'AegisShield',
    description: 'Zero-touch income insurance for delivery partners',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
