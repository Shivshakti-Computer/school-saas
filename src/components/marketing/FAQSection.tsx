// FILE: src/components/marketing/FAQSection.tsx
// FULLY CONVERTED TO LOCKED DESIGN PATTERN
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

const faqs = [
  {
    q: 'Is this an app or a website?',
    a: 'Skolify is a web platform that also works as an installable app (PWA). Teachers, parents & students can install it on their phones like a native app — no Play Store or App Store needed. It works offline for basic features too.',
  },
  {
    q: 'Can we start with a free trial?',
    a: 'Yes! Every school gets a 60-day free trial with full access. No credit card required. After trial, choose a plan that fits your school size.',
  },
  {
    q: 'Can parents pay fees online?',
    a: 'Yes, on Growth plan and above. Online fee payment is powered by Razorpay — parents can pay via UPI, cards, or netbanking. Auto receipts and reminders included.',
  },
  {
    q: 'Does it work on low-end phones?',
    a: 'Absolutely. Skolify is built mobile-first with lightweight UI. It works smoothly even on basic Android phones with slow internet connections.',
  },
  {
    q: 'Can we export data?',
    a: 'Yes. Student lists, attendance, fee records, and reports can be exported as PDF & Excel. Available on Growth plan and above.',
  },
  {
    q: 'Is our school data secure?',
    a: "Yes. We use HTTPS encryption, role-based access control, tenant isolation (each school's data is completely separate), and bcrypt password hashing. Your data is safe.",
  },
  {
    q: 'What happens after the trial ends?',
    a: 'After trial expires, access is paused but your data remains safe — nothing is deleted. Simply choose a plan to resume. You can pick up right where you left off.',
  },
]

/* ─── Chevron Icon ─── */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
        open ? 'bg-primary-100 rotate-180' : 'bg-muted'
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className={`transition-colors ${open ? 'text-primary-600' : 'text-muted'}`}
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/* ─── Number Badge ─── */
function NumberBadge({ number, isOpen }: { number: number; isOpen: boolean }) {
  return (
    <span
      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-display font-bold flex-shrink-0 transition-all duration-300 ${
        isOpen ? 'bg-primary-600 text-white' : 'bg-muted text-muted'
      }`}
    >
      {number}
    </span>
  )
}

/* ─── Single FAQ Item ─── */
function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string }
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`
        card rounded-2xl border overflow-hidden transition-all duration-300
        ${
          isOpen
            ? 'border-primary-300 shadow-md ring-2 ring-primary-100'
            : 'border-default shadow-card hover:shadow-card-hover hover:border-primary-200'
        }
      `}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 text-left transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 flex-1">
          <NumberBadge number={index + 1} isOpen={isOpen} />
          <span
            className={`text-sm font-display font-semibold transition-colors ${
              isOpen ? 'text-primary-700' : 'text-primary'
            }`}
          >
            {faq.q}
          </span>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

      <div
        className={`
          transition-all duration-300 ease-expo
          ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
        `}
      >
        <div className="px-5 pb-5">
          <div className="h-px bg-border mb-4" />
          <p className="text-sm text-secondary leading-relaxed pl-10">{faq.a}</p>
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
    <section id="faq" className="section-padding relative bg-card overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="blob-bg top-0 right-1/4 w-[400px] h-[300px]"
          style={{ background: 'var(--primary-500)' }}
        />
        <div
          className="blob-bg bottom-0 left-1/4 w-[400px] h-[200px]"
          style={{ background: 'var(--violet-500)' }}
        />
      </div>

      <Container>
        {/* Section Header */}
        <div ref={headerRef} className="reveal">
          <SectionTitle
            eyebrow="❓ FAQ"
            title="Questions schools ask before getting started"
            subtitle="Can't find your answer? Contact us directly — we respond within hours."
          />
        </div>

        {/* FAQ List */}
        <div
          ref={listRef}
          className="mt-10 max-w-3xl mx-auto space-y-3 reveal-stagger"
        >
          {faqs.map((faq, i) => (
            <div key={faq.q} className="reveal">
              <FAQItem
                faq={faq}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 max-w-3xl mx-auto animate-fade-in">
          <div className="card rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-violet-50 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card">
            <div>
              <h3 className="font-display text-base font-bold text-primary mb-1.5 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Still have questions?
              </h3>
              <p className="text-sm text-secondary">
                WhatsApp or email — we typically respond within a few hours.
              </p>
            </div>
            <Link
              href="/contact"
              className="btn-primary text-sm px-6 py-3 flex-shrink-0 flex items-center gap-2"
            >
              Contact Us
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}