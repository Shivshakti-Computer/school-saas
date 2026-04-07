// FILE: src/app/(public)/pricing/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Affordable School Management Plans | Skolify',
  description:
    'Simple, transparent pricing for Skolify school management platform. 4 plans starting ₹499/month. 60-day free trial, no credit card required. Pay-as-you-go messaging credits.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing — Affordable School Management Plans',
    description: '₹0.33–₹1 per student/month. 60-day free trial. No hidden fees.',
    type: 'website',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}