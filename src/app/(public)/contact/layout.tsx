// FILE: src/app/(public)/contact/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Skolify — Get Demo & Onboarding Support',
  description:
    'Get in touch with Skolify team for demo, onboarding, and support. WhatsApp, call, or email — we respond within hours.',
  alternates: { canonical: '/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}