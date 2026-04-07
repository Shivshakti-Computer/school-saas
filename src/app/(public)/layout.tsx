import { Navbar }              from '@/components/marketing/Navbar'
import { Footer }              from '@/components/marketing/Footer'
import { AnnouncementBanner }  from '@/components/marketing/AnnouncementBanner'
import { ChatWidget }          from '@/components/marketing/ChatWidget'
import type { Metadata }       from 'next'

/* ─────────────────────────────────────────────────────────────
   METADATA
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default:  'Skolify — AI-Powered School Management Platform',
    template: '%s | Skolify',
  },

  description:
    'School management software with intelligent AI assistant. Automate fee reminders, generate personalized messages, manage student promotions, and get contextual help across all portals. Built by Shivshakti Computer Academy.',

  keywords: [
    'AI school management software',
    'school automation AI assistant',
    'automated fee reminder system',
    'AI message template generator',
    'smart student promotion tool',
    'contextual AI help for schools',
    'school management software India',
    'student information system',
    'fee management automation',
    'attendance tracking system',
    'exam management software',
    'parent communication platform',
    'Skolify',
    'Shivshakti Computer Academy',
    'automated school operations',
    'AI-powered school analytics',
  ],

  authors:   [{ name: 'Shivshakti Computer Academy', url: 'https://shivshakticomputer.in' }],
  creator:   'Shivshakti Computer Academy',
  publisher: 'Shivshakti Computer Academy',

  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         'https://skolify.in',
    siteName:    'Skolify',
    title:       'Skolify — AI Assistant Built Into School Management',
    description:
      'Never work alone. AI automates fee reminders, creates message templates, manages promotions & provides contextual guidance across all school portals. Available 24/7 for every user.',
    images: [
      {
        url:    'https://skolify.in/og-image.png',
        width:  1200,
        height: 630,
        alt:    'Skolify AI-Powered School Management Platform',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Skolify — AI-Powered School Management',
    description:
      'Built-in AI automates fee reminders, generates messages, manages promotions & provides instant help. 20+ modules for complete school automation.',
    images:  ['https://skolify.in/og-image.png'],
    creator: '@Skolify',
  },

  robots: {
    index:    true,
    follow:   true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://skolify.in'
  ),

  alternates: { canonical: '/' },
  category:   'Education Technology',
}

/* ─────────────────────────────────────────────────────────────
   JSON-LD STRUCTURED DATA
   ───────────────────────────────────────────────────────────── */

function JsonLd() {
  const softwareData = {
    '@context':            'https://schema.org',
    '@type':               'SoftwareApplication',
    name:                  'Skolify',
    applicationCategory:   'BusinessApplication',
    applicationSubCategory:'School Management Software',
    operatingSystem:       'Web Browser, Android, iOS, Progressive Web App',
    description:
      'AI-powered school management platform with intelligent automation. Built-in AI assistant helps with fee reminders, message template generation, student promotions, contextual guidance, and administrative tasks across all portals.',
    url:        'https://skolify.in',
    screenshot: 'https://skolify.in/og-image.png',

    featureList: [
      'AI-Powered Fee Reminder Automation',
      'AI Message Template Generator',
      'Automated Student Promotion System',
      'Contextual AI Assistance (Portal-Specific)',
      'AI-Driven Statistical Overviews',
      'Intelligent Conversation Interface',
      'Smart Task Automation',
      'Student Admission Management',
      'Automated Fee Collection & Receipts',
      'Attendance Tracking & Reports',
      'Exam & Result Management',
      'Automated Report Card Generation',
      'Parent Portal with Smart Notifications',
      'Teacher Portal with AI Guidance',
      'Student Portal with Contextual Help',
      'Admin Dashboard with AI Analytics',
      'SuperAdmin Control Panel',
      'SMS & WhatsApp Integration',
      'Email Notifications',
      'Real-time Alerts',
      'Timetable Management',
      'Staff Management',
      'ID Card Generation',
      'Certificate Generation',
      'Library Management',
      'Transport Management',
      'Hostel Management',
    ].join(', '),

    author: {
      '@type':       'Organization',
      name:          'Shivshakti Computer Academy',
      url:           'https://shivshakticomputer.in',
      logo:          'https://skolify.in/icons/icon-192x192.png',
      description:   'Education technology company with expertise in school management software and AI integration.',
    },

    offers: {
      '@type':            'AggregateOffer',
      lowPrice:           '499',
      highPrice:          '3999',
      priceCurrency:      'INR',
      offerCount:         '4',
      availability:       'https://schema.org/InStock',
      priceValidUntil:    '2025-12-31',
      description:        'Flexible pricing for schools of all sizes. All plans include AI assistant.',
      url:                'https://skolify.in#pricing',
    },

    softwareVersion: '1.0',
    datePublished:   '2024-01-01',
    dateModified:     new Date().toISOString().split('T')[0],

    aggregateRating: {
      '@type':       'AggregateRating',
      ratingValue:   '4.8',
      ratingCount:   '42',
      bestRating:    '5',
      worstRating:   '1',
      reviewCount:   '38',
    },

    potentialAction: {
      '@type': 'UseAction',
      target: {
        '@type':       'EntryPoint',
        urlTemplate:   'https://skolify.in/demo',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
          'http://schema.org/IOSPlatform',
          'http://schema.org/AndroidPlatform',
        ],
      },
    },
  }

  const organizationData = {
    '@context':   'https://schema.org',
    '@type':      'Organization',
    name:         'Skolify',
    alternateName:'Skolify School Management',
    url:          'https://skolify.in',
    logo: {
      '@type':  'ImageObject',
      url:      'https://skolify.in/icons/icon-512x512.png',
      width:    512,
      height:   512,
    },
    description:
      'AI-powered school management platform developed by Shivshakti Computer Academy.',
    foundingDate: '2024',
    founder: {
      '@type': 'Organization',
      name:    'Shivshakti Computer Academy',
      url:     'https://shivshakticomputer.in',
    },
    address: {
      '@type':          'PostalAddress',
      addressCountry:   'IN',
      addressLocality:  'India',
    },
    contactPoint: [
      {
        '@type':             'ContactPoint',
        contactType:         'customer support',
        availableLanguage:   ['English', 'Hindi'],
        email:               'support@skolify.in',
        areaServed:          'IN',
      },
      {
        '@type':             'ContactPoint',
        contactType:         'sales',
        availableLanguage:   ['English', 'Hindi'],
        email:               'sales@skolify.in',
        areaServed:          'IN',
      },
    ],
    knowsAbout: [
      'School Management',
      'Education Technology',
      'Artificial Intelligence in Education',
      'School Automation',
      'Student Information Systems',
    ],
  }

  const faqData = {
    '@context':   'https://schema.org',
    '@type':      'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name:    'What AI features does Skolify offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'Skolify includes a built-in AI assistant for: automated fee reminder generation, message template creation, automated student promotion, statistical overviews, and contextual portal-specific guidance available 24/7 for all users.',
        },
      },
      {
        '@type': 'Question',
        name:    'How does the AI fee reminder system work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'The AI analyzes pending fee records and generates personalized reminder messages sent via SMS, WhatsApp, or email. It considers payment history, due dates, and parent preferences to create effective reminders.',
        },
      },
      {
        '@type': 'Question',
        name:    'Can the AI generate custom message templates?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'Yes, the AI generates templates for fee reminders, event notifications, exam schedules, performance updates, absence notices, and general announcements. Templates are fully customizable.',
        },
      },
      {
        '@type': 'Question',
        name:    'Is the AI assistant available in all portals?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'Yes, the AI is integrated into SuperAdmin, Admin, Teacher, Student, and Parent portals, providing role-specific help and automation. Public visitors also have access to a general AI assistant.',
        },
      },
      {
        '@type': 'Question',
        name:    'How does automated student promotion work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'The AI analyzes student performance, attendance, and eligibility to suggest and automate promotions. Administrators review AI suggestions before finalizing, ensuring accuracy and control.',
        },
      },
      {
        '@type': 'Question',
        name:    'Is Skolify suitable for small schools?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'Yes, pricing starts at ₹499/month for up to 100 students. All plans include full AI assistant access and core features.',
        },
      },
      {
        '@type': 'Question',
        name:    'How secure is student data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:    'All data is encrypted with industry-standard security. AI processing happens in secure environments with full data isolation between schools. We comply with Indian data protection regulations.',
        },
      },
    ],
  }

  const webPageData = {
    '@context':  'https://schema.org',
    '@type':     'WebPage',
    name:        'Skolify — AI-Powered School Management',
    description: 'School management platform with intelligent AI assistant for automation and guidance',
    url:         'https://skolify.in',
    inLanguage:  'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      name:    'Skolify',
      url:     'https://skolify.in',
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageData) }}
      />
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
   PUBLIC LAYOUT
   ───────────────────────────────────────────────────────────── */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd />

      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Skip to content — Accessibility */}
        <a
          href="#main-content"
          className="
            sr-only focus:not-sr-only
            focus:fixed focus:top-4 focus:left-4 focus:z-[100]
            focus:px-4 focus:py-2
            focus:bg-[var(--primary-600)] focus:text-white
            focus:rounded-[var(--radius-md)]
            focus:shadow-lg focus:outline-none
            font-display font-semibold text-sm
            transition-all duration-200
          "
          tabIndex={0}
        >
          Skip to main content
        </a>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 overflow-x-hidden"
          role="main"
        >
          {children}

          {/* AI Chat Widget */}
          <ChatWidget />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}