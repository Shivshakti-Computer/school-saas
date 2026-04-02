// FILE: src/components/marketing/PricingSection.tsx

'use client'

import Link from 'next/link'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { PLANS } from '@/lib/plans'
import { WEBSITE_PLAN_LIMITS } from '@/lib/websitePlans'
import { useRevealGroup } from '@/hooks/useReveal'

/* ─── Check Icon ─── */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="#D1FAE5" />
      <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Cross Icon ─── */
function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="#F1F5F9" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function PricingSection() {
  const plans = Object.values(PLANS)
  const cardsRef = useRevealGroup()

  return (
    <section id="pricing" className="section-padding relative bg-white">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.06),transparent)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-500/[0.03] blur-[120px] rounded-full" />
      </div>

      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <SectionTitle
            eyebrow="💰 Pricing"
            title="Simple plans that grow with your school"
            subtitle="Start small. Upgrade when you grow. No hidden fees, no surprises."
            center={false}
          />
          <Link
            href="/pricing"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5 flex-shrink-0 group"
          >
            Full pricing details
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Plan Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 reveal-stagger">
          {plans.map(plan => {
            const websiteLimits = WEBSITE_PLAN_LIMITS[plan.id]

            return (
              <div
                key={plan.id}
                className={`
                  reveal bg-white rounded-2xl border p-6 flex flex-col relative transition-all duration-300
                  hover:shadow-medium hover:-translate-y-1
                  ${plan.highlighted
                    ? 'border-blue-300 ring-2 ring-blue-500 ring-offset-2 shadow-brand'
                    : 'border-slate-200 shadow-soft'
                  }
                `}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 rounded-full whitespace-nowrap shadow-brand">
                    🔥 Most Popular
                  </span>
                )}

                {/* Plan header */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <span
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ background: plan.color }}
                  />
                </div>

                <p className="text-xs font-semibold mb-5" style={{ color: plan.color }}>
                  {plan.tagline}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-slate-400">/mo</span>
                </div>

                <p className="text-[11px] text-slate-400 mb-5">
                  Yearly: ₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr — save ₹{((plan.monthlyPrice * 12) - plan.yearlyPrice).toLocaleString('en-IN')}
                </p>

                {/* Quick limits */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-5 space-y-2 text-[12px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Students</span>
                    <span className="text-slate-900 font-semibold">
                      {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Teachers</span>
                    <span className="text-slate-900 font-semibold">
                      {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SMS/month</span>
                    <span className="text-slate-900 font-semibold">
                      {plan.maxSmsPerMonth === -1 ? 'Unlimited' : plan.maxSmsPerMonth.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Modules</span>
                    <span className="text-slate-900 font-semibold">{plan.modules.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Templates</span>
                    <span className="text-slate-900 font-semibold">{websiteLimits.allowedTemplates.length}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5 flex-1">
                  {plan.features.slice(0, 6).map(f => (
                    <div key={f} className="flex items-start gap-2 text-[12px] text-slate-600">
                      <CheckIcon />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.features.length > 6 && (
                    <p className="text-[11px] text-slate-400 pl-6 font-medium">
                      +{plan.features.length - 6} more features
                    </p>
                  )}
                </div>

                {/* Not included */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div className="mb-5 space-y-1.5">
                    {plan.notIncluded.slice(0, 3).map(f => (
                      <div key={f} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <CrossIcon />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <Link
                  href="/register"
                  className={`
                    w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200 block
                    ${plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-brand-lg hover:-translate-y-0.5'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  Start Free Trial
                </Link>
              </div>
            )
          })}
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-[13px] text-slate-500">
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5l5 2v4c0 3.5-2.5 5.5-5 6.5-2.5-1-5-3-5-6.5v-4l5-2z" stroke="#10B981" strokeWidth="1.2" fill="#D1FAE5" />
            </svg>
            Secure via Razorpay
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Cancel anytime</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>No setup fees</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>60-day free trial</span>
        </div>
      </Container>
    </section>
  )
}