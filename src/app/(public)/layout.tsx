// FILE: src/app/(public)/layout.tsx

import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'VidyaFlow — Modern School Management Software | Shivshakti Computer Academy',
    template: '%s | VidyaFlow',
  },
  description:
    'Complete school management platform by Shivshakti Computer Academy. Admissions, attendance, fees, exams, website builder, parent portals & 20+ modules. Built for Indian schools.',
  keywords: [
    'school management software',
    'school ERP India',
    'VidyaFlow',
    'Shivshakti Computer Academy',
    'school management system',
    'school website builder',
    'student management system',
    'fee management software',
    'attendance tracking app',
    'exam results software',
    'parent portal',
    'teacher portal',
    'school app India',
    'SaaS school software',
    'best school software India',
    'school admin software',
    'online school management',
  ],
  authors: [
    { name: 'Shivshakti Computer Academy', url: 'https://shivshakticomputer.in' },
  ],
  creator: 'Shivshakti Computer Academy',
  publisher: 'Shivshakti Computer Academy',

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://vidyaflow.in',
    siteName: 'VidyaFlow',
    title: 'VidyaFlow — Modern School Management Software',
    description:
      'Admissions, attendance, fees, exams, notices, website builder, parent & student portals. Affordable plans starting ₹499/month.',
    images: [
      {
        url: 'https://vidyaflow.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VidyaFlow — School Management Platform by Shivshakti Computer Academy',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'VidyaFlow — Modern School Management Software',
    description:
      'Complete school management platform built for Indian schools by Shivshakti Computer Academy.',
    images: ['https://vidyaflow.in/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // → FIXED: VidyaFlow ka own domain
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://vidyaflow.in'
  ),

  alternates: {
    canonical: '/',
  },
}

// → JSON-LD Structured Data for SEO
function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'VidyaFlow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Complete school management platform with admissions, attendance, fees, exams, website builder and parent portals.',
    // → VidyaFlow ka URL
    url: 'https://vidyaflow.in',
    author: {
      '@type': 'Organization',
      name: 'Shivshakti Computer Academy',
      // → Parent company ka URL alag hai
      url: 'https://shivshakticomputer.in',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '499',
      highPrice: '3999',
      priceCurrency: 'INR',
      offerCount: '4',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd />
      <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-secondary)] font-sans">
        <Navbar />
        <main className="overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    </>
  )
}