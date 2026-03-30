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
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
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
    color: 'bg-amber-50 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700',
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
    color: 'bg-emerald-50 border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-700',
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
    color: 'bg-purple-50 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-700',
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
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${open ? 'bg-blue-100 rotate-180' : 'bg-slate-100'}`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className={`transition-colors ${open ? 'text-blue-600' : 'text-slate-500'}`}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
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
        <span className={`text-sm font-semibold transition-colors pr-4 ${isOpen ? 'text-blue-700' : 'text-slate-900'}`}>
          {faq.q}
        </span>
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
          <p className="text-[13px] text-slate-600 leading-relaxed">
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
      <section className="relative pt-24 pb-12 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-10 right-1/4 w-[300px] h-[200px] bg-purple-500/[0.05] blur-[100px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <Container>
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="text-lg">❓</span>
              <span className="text-sm font-semibold text-slate-700">Help Center</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              Everything you need to know before getting started.
              Can&apos;t find your answer? Contact us directly.
            </p>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-900">
                  {faqCategories.reduce((a, c) => a + c.faqs.length, 0)}
                </span>
                <span className="text-slate-500">Questions</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-900">{faqCategories.length}</span>
                <span className="text-slate-500">Categories</span>
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FAQ Categories ─── */}
      <section className="pb-20 bg-white">
        <Container>
          <div ref={groupRef} className="max-w-3xl mx-auto space-y-10 reveal-stagger">
            {faqCategories.map((category, catIdx) => (
              <div key={category.category} className="reveal">
                {/* Category Header */}
                <div className={`flex items-center gap-3 mb-5 p-3 rounded-xl ${category.color} border`}>
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-base font-bold text-slate-900 flex-1">
                    {category.category}
                  </h2>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${category.badgeColor}`}>
                    {category.faqs.length} questions
                  </span>
                </div>

                {/* FAQ Items */}
                <div className="space-y-3">
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
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-200 p-8 sm:p-10 relative overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.05] rounded-full blur-[60px]" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    Still have questions?
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                    Reach out on WhatsApp or email.
                    We typically respond within a few hours during business days.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <a
                    href="/contact"
                    className="btn-primary !text-sm !px-6 !py-3"
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
                    className="btn-secondary !text-sm !px-6 !py-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
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