import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingSection } from '@/components/marketing/PricingSection'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTA } from '@/components/marketing/CTA'

export const metadata = {
  title: 'VidyaFlow — School Operations, Streamlined',
  description: 'Run your entire school on one modern platform. Admissions, attendance, fees, exams, notices, website builder, parent portals, and 20+ modules.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <PricingSection />
      <Testimonials />
      <FAQSection />
      <CTA />
    </>
  )
}