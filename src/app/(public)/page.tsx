// FILE: src/app/(public)/page.tsx

import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTA } from '@/components/marketing/CTA'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VidyaFlow — Modern School Management Software | #1 School ERP India',
  description:
    'Run your entire school on one modern platform. Admissions, attendance, fees, exams, notices, website builder, parent portals & 20+ modules. Plans starting ₹499/month. Trusted by 150+ schools.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'VidyaFlow — Modern School Management Software for Indian Schools',
    description:
      'Complete school management with 20+ modules. Admissions, fees, attendance, exams & more. Start free trial today!',
    url: 'https://vidyaflow.in',
  },
}

export default function HomePage() {
  return (
    <>
      {/* 
        Sections alternate between white & light-gray backgrounds
        for visual separation — clean SaaS pattern
      */}
      
      {/* Hero — White bg with blue accent blobs */}
      <Hero />

      {/* Features — Light gray bg */}
      <section className="section-light">
        <FeatureGrid />
      </section>

      {/* Pricing — White bg */}
      <section className="section-white">
        <PricingSection />
      </section>

      {/* Testimonials — Light blue tint bg */}
      <section className="section-brand-light">
        <Testimonials />
      </section>

      {/* FAQ — White bg */}
      <section className="section-white">
        <FAQSection />
      </section>

      {/* CTA — Gradient bg */}
      <CTA />
    </>
  )
}