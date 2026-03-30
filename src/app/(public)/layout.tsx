// FILE: src/app/(public)/layout.tsx

import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Skolify — Modern School Management Software | Shivshakti Computer Academy',
    template: '%s | Skolify',
  },
  description:
    'Complete school management platform by Shivshakti Computer Academy. Admissions, attendance, fees, exams, website builder, parent portals & 20+ modules. Built for Indian schools.',
  keywords: [
    'school management software',
    'school management software India',
    'school ERP India',
    'Skolify',
    'Shivshakti Computer Academy',
    'school management system',
    'school website builder',
    'student management system',
    'fee management software',
    'attendance tracking app',
    'exam results software',
    'parent portal school',
    'teacher portal',
    'school app India',
    'SaaS school software',
    'best school software India',
    'school admin software',
    'online school management',
    'school ERP free trial',
    'affordable school software',
    'school management platform',
  ],
  authors: [
    { name: 'Shivshakti Computer Academy', url: 'https://shivshakticomputer.in' },
  ],
  creator: 'Shivshakti Computer Academy',
  publisher: 'Shivshakti Computer Academy',

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://skolify.in',
    siteName: 'Skolify',
    title: 'Skolify — Modern School Management Software for Indian Schools',
    description:
      'Admissions, attendance, fees, exams, notices, website builder, parent & student portals. Affordable plans starting ₹499/month. Trusted by 150+ schools.',
    images: [
      {
        url: 'https://skolify.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Skolify — School Management Platform by Shivshakti Computer Academy',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Skolify — Modern School Management Software',
    description:
      'Complete school management platform built for Indian schools by Shivshakti Computer Academy. Start free trial today.',
    images: ['https://skolify.in/og-image.png'],
    creator: '@Skolify',
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

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://skolify.in'
  ),

  alternates: {
    canonical: '/',
  },

  category: 'Education Technology',
}

/* ─── JSON-LD Structured Data (Enhanced SEO) ─── */
function JsonLd() {
  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Skolify',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'School Management Software',
    operatingSystem: 'Web, Android, iOS',
    description:
      'Complete school management platform with admissions, attendance, fees, exams, website builder and parent portals. Built for Indian schools.',
    url: 'https://skolify.in',
    screenshot: 'https://skolify.in/og-image.png',
    featureList:
      'Student Management, Fee Collection, Attendance Tracking, Exam Management, Website Builder, Parent Portal, Teacher Portal, SMS & WhatsApp Notifications, Report Cards, Timetable Management',
    author: {
      '@type': 'Organization',
      name: 'Shivshakti Computer Academy',
      url: 'https://shivshakticomputer.in',
      logo: 'https://skolify.in/icons/icon-192x192.png',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '499',
      highPrice: '3999',
      priceCurrency: 'INR',
      offerCount: '4',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      reviewCount: '150',
    },
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Skolify',
    url: 'https://skolify.in',
    logo: 'https://skolify.in/icons/icon-192x192.png',
    description: 'Modern school management software for Indian schools.',
    founder: {
      '@type': 'Organization',
      name: 'Shivshakti Computer Academy',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [],
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://skolify.in',
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
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
      <div className="min-h-screen bg-white text-slate-700 font-sans selection:bg-blue-100 selection:text-blue-800">
        {/* Skip to content — Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        <Navbar />

        <main id="main-content" className="overflow-x-hidden">
          {children}
        </main>

        <Footer />
      </div>
    </>
  )
}