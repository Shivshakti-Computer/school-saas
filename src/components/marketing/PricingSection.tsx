// FILE: src/components/marketing/PricingSection.tsx
// Home page pricing preview — shows key info, links to full /pricing page

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
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="rgba(16,185,129,0.15)" />
      <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Cross Icon ─── */
function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 opacity-30">
      <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.05)" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function PricingSection() {
  const plans = Object.values(PLANS)
  const cardsRef = useRevealGroup()

  return (
    <section id="pricing" className="section-padding relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand/[0.03] blur-[120px] rounded-full" />
      </div>

      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <SectionTitle
            eyebrow="✦ Pricing"
            title="Simple plans that grow with your school"
            subtitle="Start small. Upgrade when you grow. No hidden fees, no surprises."
            center={false}
          />
          <Link
            href="/pricing"
            className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Full pricing details
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Plan Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 reveal-stagger">
          {plans.map(plan => {
            const websiteLimits = WEBSITE_PLAN_LIMITS[plan.id]

            return (
              <div
                key={plan.id}
                className={`
                  reveal card-dark p-5 flex flex-col relative
                  ${plan.highlighted ? 'ring-1 ring-brand/30' : ''}
                `}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-brand px-3 py-0.5 rounded-full whitespace-nowrap">
                    🔥 Most Popular
                  </span>
                )}

                {/* Plan header */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: plan.color }}
                  />
                </div>

                <p className="text-xs font-medium mb-4" style={{ color: plan.color }}>
                  {plan.tagline}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-extrabold text-white">
                    ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>

                <p className="text-[11px] text-slate-600 mb-4">
                  Yearly: ₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr — save ₹{((plan.monthlyPrice * 12) - plan.yearlyPrice).toLocaleString('en-IN')}
                </p>

                {/* Quick limits */}
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 mb-4 space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Students</span>
                    <span className="text-white font-semibold">
                      {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teachers</span>
                    <span className="text-white font-semibold">
                      {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMS/month</span>
                    <span className="text-white font-semibold">
                      {plan.maxSmsPerMonth === -1 ? 'Unlimited' : plan.maxSmsPerMonth.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modules</span>
                    <span className="text-white font-semibold">{plan.modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Website Templates</span>
                    <span className="text-white font-semibold">{websiteLimits.allowedTemplates.length}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5 flex-1">
                  {plan.features.slice(0, 6).map(f => (
                    <div key={f} className="flex items-start gap-2 text-[12px] text-slate-400">
                      <CheckIcon />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.features.length > 6 && (
                    <p className="text-[11px] text-slate-600 pl-5">
                      +{plan.features.length - 6} more features
                    </p>
                  )}
                </div>

                {/* Not included */}
                {plan.notIncluded && plan.notIncluded.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {plan.notIncluded.slice(0, 3).map(f => (
                      <div key={f} className="flex items-start gap-2 text-[11px] text-slate-600">
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
                    w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all
                    ${plan.highlighted
                      ? 'btn-primary !w-full !justify-center'
                      : 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.12]'
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
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-[12px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5l5 2v4c0 3.5-2.5 5.5-5 6.5-2.5-1-5-3-5-6.5v-4l5-2z" stroke="#10B981" strokeWidth="1.2" fill="rgba(16,185,129,0.1)" />
            </svg>
            Secure payments via Razorpay
          </span>
          <span>·</span>
          <span>Cancel anytime</span>
          <span>·</span>
          <span>No setup fees</span>
          <span>·</span>
          <span>14-day free trial</span>
        </div>
      </Container>
    </section>
  )
}