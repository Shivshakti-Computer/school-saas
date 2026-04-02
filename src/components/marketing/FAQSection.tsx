// FILE: src/components/marketing/FAQSection.tsx

'use client'

import { useState } from 'react'
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
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${open ? 'bg-blue-100 rotate-180' : 'bg-slate-100'}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className={`transition-colors ${open ? 'text-blue-600' : 'text-slate-500'}`}
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
    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
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
        bg-white rounded-2xl border overflow-hidden transition-all duration-300
        ${isOpen
          ? 'border-blue-200 shadow-medium ring-1 ring-blue-100'
          : 'border-slate-200 shadow-soft hover:shadow-medium hover:border-slate-300'
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
          <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-900'}`}>
            {faq.q}
          </span>
        </div>
        <ChevronIcon open={isOpen} />
      </button>

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
          <div className="h-px bg-slate-100 mb-4" />
          <p className="text-[13px] text-slate-600 leading-relaxed pl-10">
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
    <section id="faq" className="section-padding relative bg-white">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-blue-500/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-purple-500/[0.03] blur-[100px] rounded-full" />
      </div>

      <Container>
        <div ref={headerRef} className="reveal">
          <SectionTitle
            eyebrow="❓ FAQ"
            title="Questions schools ask before getting started"
            subtitle="Can't find your answer? Contact us directly — we respond within hours."
          />
        </div>

        <div ref={listRef} className="mt-10 max-w-3xl mx-auto space-y-3 reveal-stagger">
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
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Still have questions?
              </h3>
              <p className="text-sm text-slate-600">
                WhatsApp or email — we typically respond within a few hours.
              </p>
            </div>
            <a
              href="/contact"
              className="btn-primary !text-[13px] !px-6 !py-3 flex-shrink-0"
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