// FILE: src/components/marketing/FAQSection.tsx
// Home page FAQ accordion — dark theme, smooth open/close

'use client'

import { useState } from 'react'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

const faqs = [
  {
    q: 'Is this an app or a website?',
    a: 'VidyaFlow is a web platform that also works as an installable app (PWA). Teachers, parents & students can install it on their phones like a native app — no Play Store or App Store needed. It works offline for basic features too.',
  },
  {
    q: 'Can we start with a free trial?',
    a: 'Yes! Every school gets a 14-day free trial with full access. No credit card required. After trial, choose a plan that fits your school size.',
  },
  {
    q: 'Can parents pay fees online?',
    a: 'Yes, on Growth plan and above. Online fee payment is powered by Razorpay — parents can pay via UPI, cards, or netbanking. Auto receipts and reminders included.',
  },
  {
    q: 'Does it work on low-end phones?',
    a: 'Absolutely. VidyaFlow is built mobile-first with lightweight UI. It works smoothly even on basic Android phones with slow internet connections.',
  },
  {
    q: 'Can we export data?',
    a: 'Yes. Student lists, attendance, fee records, and reports can be exported as PDF & Excel. Available on Growth plan and above.',
  },
  {
    q: 'Is our school data secure?',
    a: 'Yes. We use HTTPS encryption, role-based access control, tenant isolation (each school\'s data is completely separate), and bcrypt password hashing. Your data is safe.',
  },
  {
    q: 'What happens after the trial ends?',
    a: 'After trial expires, access is paused but your data remains safe — nothing is deleted. Simply choose a plan to resume. You can pick up right where you left off.',
  },
]

/* ─── Chevron Icon ─── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={`
        text-slate-500 transition-transform duration-300 flex-shrink-0
        ${open ? 'rotate-180' : ''}
      `}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── Single FAQ Item ─── */
function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string }
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`
        card-dark overflow-hidden transition-colors duration-300
        ${isOpen ? 'ring-1 ring-brand/20' : ''}
      `}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-white pr-4">
          {faq.q}
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {/* 
        FIX: Use max-height transition instead of grid-rows
        - Element always stays in DOM flow
        - max-height: 0 → collapses without removing from flow
        - max-height: 300px → enough for any answer length
      */}
      <div
        className={`
          transition-all duration-300 ease-out
          ${isOpen
            ? 'max-h-[500px] opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
          }
        `}
      >
        <div className="px-5 pb-5">
          <div className="h-px bg-white/[0.06] mb-4" />
          <p className="text-[13px] text-slate-400 leading-relaxed">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const headerRef = useReveal<HTMLDivElement>()
  const listRef = useRevealGroup()

  return (
    <section id="faq" className="section-padding relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-brand/[0.03] blur-[120px] rounded-full" />
      </div>

      <Container>
        <div ref={headerRef} className="reveal">
          <SectionTitle
            eyebrow="✦ FAQ"
            title="Questions schools ask before getting started"
            subtitle="Can't find your answer? Contact us directly — we respond within hours."
          />
        </div>

        <div ref={listRef} className="mt-10 max-w-3xl mx-auto space-y-3 reveal-stagger">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="reveal">
              <FAQItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="card-dark p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                Still have questions?
              </h3>
              <p className="text-[13px] text-slate-500">
                WhatsApp or email — we typically respond within a few hours.
              </p>
            </div>
            <a
              href="/contact"
              className="btn-primary !text-[13px] !px-5 !py-2.5 flex-shrink-0"
            >
              Contact Us
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}