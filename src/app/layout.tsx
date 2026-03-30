// FILE: src/app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/providers/SessionProvider'
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
}

export const metadata: Metadata = {
  title: {
    default: 'VidyaFlow — Modern School Management Software',
    template: '%s | VidyaFlow',
  },
  description:
    'Complete school management platform by Shivshakti Computer Academy. Admissions, attendance, fees, exams & 20+ modules for Indian schools.',
  applicationName: 'VidyaFlow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VidyaFlow',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/api/manifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased font-sans">
        <Providers>
          {children}
          <ServiceWorkerRegistrar />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  )
}