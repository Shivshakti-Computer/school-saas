import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTA } from '@/components/marketing/CTA'
import type { Metadata } from 'next'
import { AIAssistantBanner } from '@/components/marketing/AIAssitantBanner'

export const metadata: Metadata = {
  title: 'Skolify — AI-Powered School Management Software | Early Access',
  description:
    'Modern school management platform with built-in AI assistant in all Indian languages. Admissions, fees, attendance, exams, parent portals & 20+ modules. Early access starting ₹499/month.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Skolify — AI-Powered School Management for Indian Schools',
    description:
      'Get early access to India\'s first AI-powered school ERP. Smart fee reminders, automated reports, multilingual AI help & 20+ modules. Built by educators for educators.',
    url: 'https://skolify.in',
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero — White bg with blue accent */}
      <Hero />

      {/* ✨ NEW: AI Assistant Highlight Banner */}
      <section className="section-white">
        <AIAssistantBanner />
      </section>

      {/* Features — Light gray bg */}
      <section className="section-light">
        <FeatureGrid />
      </section>

      {/* Pricing — White bg */}
      <section className="section-white">
        <PricingSection />
      </section>

      {/* Testimonials — Light blue tint */}
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