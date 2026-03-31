// FILE: src/app/(public)/pricing/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Affordable School Management Plans',
  description:
    'Simple, transparent pricing for Skolify school management platform. 4 plans starting ₹499/month. 15-day free trial, no credit card required.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}