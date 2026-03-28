import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'VidyaFlow — School Operations, Streamlined',
    template: '%s — VidyaFlow',
  },
  description: 'Complete school management platform: admissions, attendance, fees, exams, notices, website builder, parent portals, and more. Built for Indian schools.',
  keywords: [
    'school management software',
    'school ERP India',
    'VidyaFlow',
    'school management system',
    'school website builder',
    'student management',
    'fee management',
    'attendance tracking',
    'exam results software',
    'parent portal',
    'teacher portal',
    'school app India',
    'SaaS school software',
  ],
  authors: [{ name: 'Shivshakti Computer Academy' }],
  creator: 'VidyaFlow — A unit of Shivshakti Computer Academy',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'VidyaFlow',
    title: 'VidyaFlow — School Operations, Streamlined',
    description: 'Admissions, attendance, fees, exams, notices, website builder, parent & student portals. Affordable plans for every school.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VidyaFlow — School Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidyaFlow — School Operations, Streamlined',
    description: 'Complete school management platform built for Indian schools.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}