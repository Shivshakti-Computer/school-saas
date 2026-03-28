// FILE: src/app/(public)/faq/page.tsx

'use client'

import { useState } from 'react'
import { Container } from '@/components/marketing/Container'
import { CTA } from '@/components/marketing/CTA'
import { useRevealGroup } from '@/hooks/useReveal'

const faqCategories = [
  {
    category: 'Getting Started',
    icon: '🚀',
    faqs: [
      {
        q: 'How do I register my school?',
        a: 'Click "Start free trial" on the homepage. Fill in your school name, phone number, and create a school code. You will get instant access to the admin panel.',
      },
      {
        q: 'What happens after the trial ends?',
        a: 'After trial expires, all features are blocked. You can only access the subscription page to choose a plan. Your data remains safe — nothing is deleted.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'The platform is a Progressive Web App (PWA). It can be installed on any phone like a native app — no Play Store or App Store needed. Works offline for basic features too.',
      },
      {
        q: 'Do you provide training?',
        a: 'Yes. We provide onboarding support via WhatsApp/call. We can also do screen-sharing sessions to help you set up your school.',
      },
    ],
  },
  {
    category: 'Plans & Billing',
    icon: '💰',
    faqs: [
      {
        q: 'Can I change my plan later?',
        a: 'Yes. You can upgrade your plan anytime from the Subscription page inside the admin panel. Remaining days credit is automatically adjusted. For downgrade, contact support.',
      },
      {
        q: 'How many users can I add?',
        a: 'Each plan has student and teacher limits. Admin accounts are included. Parents and students get their own login portals automatically.',
      },
      {
        q: 'What payment methods are supported?',
        a: 'Platform subscription is paid via Razorpay (UPI, cards, netbanking). Schools can also enable Razorpay for parent fee collection.',
      },
      {
        q: 'What if I need a custom feature?',
        a: 'Contact us. For Enterprise plan customers, we offer custom module development and priority support.',
      },
    ],
  },
  {
    category: 'Features & Data',
    icon: '📦',
    faqs: [
      {
        q: 'Can parents see attendance and fees?',
        a: 'Yes. Parents get their own login portal where they can view attendance, fee status, exam results, and notices.',
      },
      {
        q: 'Can we export data?',
        a: 'Yes. Reports, student lists, fee records, and attendance data can be exported as PDF & Excel from the admin panel (Growth plan and above).',
      },
      {
        q: 'Can multiple schools use the same platform?',
        a: 'Yes. This is a multi-tenant SaaS platform. Each school gets its own isolated database, subdomain, and admin panel. Schools cannot see each other\'s data.',
      },
      {
        q: 'Does it work on low-end phones?',
        a: 'Yes. The UI is lightweight and optimized for speed. Works smoothly even on basic Android phones with 2G/3G connections.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    icon: '🔒',
    faqs: [
      {
        q: 'Is my data secure?',
        a: 'Yes. We use encrypted connections (HTTPS), role-based access control, tenant isolation, and JWT-based authentication. Passwords are hashed with bcrypt.',
      },
      {
        q: 'Who can access my school data?',
        a: 'Only your school\'s admin, teachers, students and parents can access data — each with role-based permissions. No other school can see your data.',
      },
      {
        q: 'What happens to data if I cancel?',
        a: 'Your data remains safe for 30 days after cancellation. You can resubscribe anytime to regain access. After 30 days, data may be permanently deleted.',
      },
    ],
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
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* FIX: max-height transition — element stays in DOM flow */}
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

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    '0-0': true,
  })
  const groupRef = useRevealGroup()

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-brand/[0.05] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <Container>
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="badge-brand mx-auto mb-5">✦ Help Center</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Frequently Asked{' '}
              <span className="gradient-text">Questions</span>
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              Everything you need to know before getting started.
              Can&apos;t find your answer? Contact us directly.
            </p>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm">
              <span className="text-slate-500">
                <span className="text-white font-bold">{faqCategories.reduce((a, c) => a + c.faqs.length, 0)}</span> Questions
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">
                <span className="text-white font-bold">{faqCategories.length}</span> Categories
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FAQ Categories ─── */}
      <section className="pb-16">
        <Container>
          <div ref={groupRef} className="max-w-3xl mx-auto space-y-8 reveal-stagger">
            {faqCategories.map((category, catIdx) => (
              <div key={category.category} className="reveal">
                {/* Category Header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-xl">{category.icon}</span>
                  <h2 className="text-base font-bold text-white">
                    {category.category}
                  </h2>
                  <span className="text-[11px] text-slate-600 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full">
                    {category.faqs.length}
                  </span>
                </div>

                {/* FAQ Items */}
                <div className="space-y-2.5">
                  {category.faqs.map((faq, faqIdx) => {
                    const key = `${catIdx}-${faqIdx}`
                    return (
                      <FAQItem
                        key={faq.q}
                        faq={faq}
                        isOpen={!!openItems[key]}
                        onToggle={() => toggleItem(key)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Contact CTA ─── */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="card-dark p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">
                    Still have questions?
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Reach out on WhatsApp or email.
                    We typically respond within a few hours during business days.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <a
                    href="/contact"
                    className="btn-primary !text-[13px] !px-5 !py-2.5"
                  >
                    Contact Us
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                  <a
                    href="https://wa.me/91XXXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary !text-[13px] !px-5 !py-2.5"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}