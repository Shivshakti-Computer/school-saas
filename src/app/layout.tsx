import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/SessionProvider'
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { Metadata, Viewport } from 'next'

/* ─────────────────────────────────────────────────────────────
   FONTS — Design System Locked
   Display: Plus Jakarta Sans  |  Body: Inter  |  Mono: JetBrains
   ───────────────────────────────────────────────────────────── */

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
  preload: true,
  adjustFontFallback: true,
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  preload: true,
  adjustFontFallback: true,
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  preload: false,
})

/* ─────────────────────────────────────────────────────────────
   VIEWPORT
   ───────────────────────────────────────────────────────────── */

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)',  color: '#4338ca' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
  interactiveWidget: 'resizes-content',
}

/* ─────────────────────────────────────────────────────────────
   METADATA
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://skolify.in'
  ),

  title: {
    default:  'Skolify — AI-Powered School Management Software',
    template: '%s | Skolify',
  },

  description:
    'School management platform with built-in AI assistant. Automate fee reminders, generate message templates, manage student promotions & get contextual help. 20+ modules for complete school automation.',

  applicationName: 'Skolify',

  keywords: [
    'AI school management software',
    'school automation AI',
    'AI fee reminder system',
    'school management with AI assistant',
    'automated school administration',
    'AI-powered student management',
    'school ERP with AI',
    'Skolify AI',
    'smart school management India',
    'AI message templates school',
    'automated student promotion',
    'contextual AI school help',
    'Shivshakti Computer Academy',
  ],

  authors: [
    {
      name: 'Shivshakti Computer Academy',
      url:  'https://shivshakticomputer.in',
    },
  ],

  creator:   'Shivshakti Computer Academy',
  publisher: 'Shivshakti Computer Academy',

  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'Skolify',
    startupImage: [
      {
        url:   '/icons/icon-192x192.png',
        media: '(device-width: 375px) and (device-height: 812px)',
      },
    ],
  },

  formatDetection: {
    telephone: true,
    email:     true,
    address:   true,
    date:      true,
    url:       true,
  },

  icons: {
    icon: [
      { url: '/icons/icon-32x32.png',   sizes: '32x32',   type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: [{ url: '/icons/icon-32x32.png', sizes: '32x32' }],
  },

  manifest: '/api/manifest',

  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         'https://skolify.in',
    siteName:    'Skolify',
    title:       'Skolify — AI-Powered School Management Platform',
    description:
      'Built-in AI assistant helps automate school tasks. Smart fee reminders, instant message templates, automated student promotions & contextual guidance for all portals.',
    images: [
      {
        url:    'https://skolify.in/og-image.png',
        width:  1200,
        height: 630,
        alt:    'Skolify AI-Powered School Management',
        type:   'image/png',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    site:        '@Skolify',
    creator:     '@Skolify',
    title:       'Skolify — AI Assistant for School Management',
    description:
      'Smart automation with built-in AI. Fee reminders, message generation, student promotions & more.',
    images: ['https://skolify.in/og-image.png'],
  },

  robots: {
    index:    true,
    follow:   true,
    nocache:  false,
    googleBot: {
      index:             true,
      follow:            true,
      noimageindex:      false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  alternates: { canonical: '/' },
  category:   'Education Technology',
}

/* ─────────────────────────────────────────────────────────────
   ROOT LAYOUT
   ───────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`
        ${plusJakartaSans.variable}
        ${inter.variable}
        ${jetbrainsMono.variable}
        h-full scroll-smooth
      `}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Performance: DNS prefetch */}
        <link rel="dns-prefetch"  href="https://fonts.googleapis.com" />
        <link rel="preconnect"    href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* AI service preconnect */}
        {process.env.NEXT_PUBLIC_AI_API_URL && (
          <link
            rel="preconnect"
            href={process.env.NEXT_PUBLIC_AI_API_URL}
          />
        )}
      </head>

      <body
        className="
          min-h-full flex flex-col
          antialiased
          font-body
          bg-[var(--bg-base)]
          text-[var(--text-primary)]
        "
      >
        <Providers>
          {children}
          <ServiceWorkerRegistrar />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}