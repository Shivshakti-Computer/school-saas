import { Hero } from '@/components/marketing/Hero'
import { AIFeatureShowcase } from '@/components/marketing/AIFeatureShowcase'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTA } from '@/components/marketing/CTA'
import type { Metadata } from 'next'
import { AIAssistantBanner } from '@/components/marketing/AIAssitantBanner'

/* ─────────────────────────────────────────────────────────────
   PAGE METADATA
   ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'Skolify — AI-Powered School Management Software',
  description:
    'School management platform with built-in AI assistant. Automate fee reminders, generate message templates, manage student promotions & get contextual help. 20+ modules with intelligent automation.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Skolify — AI Assistant Built Into School Management',
    description: 'Never work alone. AI helps automate fee reminders, create messages, manage promotions & provides instant guidance across all portals.',
    url: 'https://skolify.in',
    images: [{
      url: 'https://skolify.in/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Skolify AI-Powered School Management',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skolify — AI-Powered School Management',
    description: 'Built-in AI automates tasks, generates templates & provides instant help. Available 24/7.',
    images: ['https://skolify.in/og-image.png'],
  },
}

/* ─────────────────────────────────────────────────────────────
   HOME PAGE
   Section order: Hero → AI Showcase → Features → 
                  Pricing → Testimonials → FAQ → CTA
   ───────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <Hero />

      {/* ── AI Feature Showcase ── */}
      <section
        aria-labelledby="ai-features-heading">
        <AIFeatureShowcase />
      </section>

      <AIAssistantBanner/>

      {/* ── Core Features Grid ── */}
      <section
        aria-labelledby="features-heading"
        style={{ background: 'var(--bg-card)' }}
      >
        <FeatureGrid />
      </section>

      {/* ── Pricing ── */}
      <section
        aria-labelledby="pricing-heading"
        style={{ background: 'var(--bg-muted)' }}
      >
        <PricingSection />
      </section>

      {/* ── Testimonials ── */}
      <section
        aria-labelledby="testimonials-heading"
        style={{ background: 'var(--bg-card)' }}
      >
        <Testimonials />
      </section>

      {/* ── FAQ ── */}
      <section
        aria-labelledby="faq-heading"
        style={{ background: 'var(--bg-muted)' }}
      >
        <FAQSection />
      </section>

      {/* ── CTA ── */}
      <CTA />
    </>
  )
}