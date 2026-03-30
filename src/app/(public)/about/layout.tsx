// FILE: src/app/(public)/about/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Skolify — Modern School Management Platform',
  description:
    'Learn about Skolify — built by Shivshakti Computer Academy for Indian schools. Multi-tenant SaaS, PWA, lightweight, and designed for real school workflows.',
  alternates: { canonical: '/about' },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}