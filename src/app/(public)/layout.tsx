import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import type { Metadata } from 'next'
import { AnnouncementBanner } from '@/components/marketing/AnnouncementBanner'
import { ChatWidget } from '@/components/marketing/ChatWidget'

export const metadata: Metadata = {
  title: {
    default: 'Skolify — AI-Powered School Management | Early Access Open',
    template: '%s | Skolify',
  },
  description:
    'India\'s first school management platform with built-in AI assistant supporting all Indian languages. Smart automation for admissions, fees, attendance, exams & parent communication. By Shivshakti Computer Academy.',
  keywords: [
    'school management software India',
    'AI school management',
    'school ERP with AI',
    'multilingual school software',
    'Hindi school management',
    'school software India',
    'Skolify',
    'Shivshakti Computer Academy',
    'student management system',
    'fee management software',
    'attendance tracking',
    'parent portal',
    'teacher portal',
    'school automation',
    'AI fee reminder',
    'automated report cards',
    'school management early access',
    'affordable school ERP',
    'Indian school software',
    'CBSE school management',
    'smart school platform',
    'AI assistant for schools',
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
    title: 'Skolify — AI-Powered School Management for Indian Schools',
    description:
      'Early access now open! AI assistant in Hindi, English & regional languages. Smart fee reminders, automated tasks, parent communication & 20+ modules. Starting ₹499/month.',
    images: [
      {
        url: 'https://skolify.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Skolify — AI-Powered School Management by Shivshakti Computer Academy',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Skolify — AI-Powered School Management',
    description:
      'India\'s first school ERP with built-in AI assistant. Get early access to smart automation, multilingual support & 20+ modules.',
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

/* ─── JSON-LD Structured Data (Honest) ─── */
function JsonLd() {
  const softwareData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Skolify',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'School Management Software',
    operatingSystem: 'Web, Android, iOS',
    description:
      'AI-powered school management platform with built-in multilingual assistant. Manages admissions, fees, attendance, exams, and parent communication for Indian schools.',
    url: 'https://skolify.in',
    screenshot: 'https://skolify.in/og-image.png',
    featureList:
      'AI Assistant (All Indian Languages), Student Management, Fee Collection with Smart Reminders, Attendance Tracking, Exam Management, Automated Report Generation, Parent Portal, Teacher Portal, SMS & WhatsApp Notifications, Report Cards, Timetable Management, Student Promotion, Message Templates',
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
      availability: 'https://schema.org/PreOrder', // Honest: Early Access
      priceValidUntil: '2025-12-31',
    },
    softwareVersion: '1.0-beta',
    releaseNotes: 'Early access version with AI assistant integration',
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Skolify',
    url: 'https://skolify.in',
    logo: 'https://skolify.in/icons/icon-192x192.png',
    description: 'AI-powered school management software for Indian schools. Built by educators with years of experience in education technology.',
    founder: {
      '@type': 'Organization',
      name: 'Shivshakti Computer Academy',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Bengali'],
      email: 'support@skolify.in',
    },
    sameAs: [],
  }

  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Skolify\'s AI Assistant?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Skolify includes a built-in AI assistant that helps admins, teachers, parents and students in all Indian languages. It can send fee reminders, generate reports, answer queries, and automate routine tasks.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which languages does the AI support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The AI assistant supports Hindi, English, Marathi, Tamil, Telugu, Gujarati, Bengali, Kannada, Malayalam, Punjabi, and other major Indian languages.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Skolify currently available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Skolify is currently in early access beta. Schools can register now to get priority access and special launch pricing starting at ₹499/month.',
        },
      },
    ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
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
        {/* Skip to content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>

        <AnnouncementBanner />
        <Navbar />

        <main id="main-content" className="overflow-x-hidden">
          {children}
          <ChatWidget />
        </main>

        <Footer />
      </div>
    </>
  )
}