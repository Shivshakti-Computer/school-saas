// FILE: src/app/(public)/page.tsx

import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTA } from '@/components/marketing/CTA'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VidyaFlow — Modern School Management Software | Shivshakti Computer Academy',
  description:
    'Run your entire school on one modern platform. Admissions, attendance, fees, exams, notices, website builder, parent portals & 20+ modules. Plans starting ₹499/month.',
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      {/* ModulesShowcase & PlatformFeatures → /features page pe detail mein hai */}
      <PricingSection />
      <Testimonials />
      <FAQSection />
      <CTA />
    </>
  )
}