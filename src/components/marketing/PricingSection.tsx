// FILE: src/components/marketing/PricingSection.tsx
// HOME PAGE PRICING COMPONENT — FULLY CONVERTED
// ═══════════════════════════════════════════════════════════

'use client'

import Link from 'next/link'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import { useRevealGroup } from '@/hooks/useReveal'

// ── Helpers ──────────────────────────────────────────────────
function getPerStudentMonthly(plan: typeof PLANS[PlanId]): string {
  const effectiveStudents =
    plan.maxStudents === -1
      ? plan.id === 'enterprise'
        ? 10000
        : 3000
      : plan.maxStudents
  const cost = plan.monthlyPrice / effectiveStudents
  return cost < 1 ? `₹${cost.toFixed(2)}` : `₹${cost.toFixed(1)}`
}

function getMaxTotalStudents(plan: typeof PLANS[PlanId]): string {
  if (plan.maxStudents === -1) return 'Unlimited'
  if (plan.maxAddonStudents === -1) return `${plan.maxStudents.toLocaleString('en-IN')}+`
  return (plan.maxStudents + plan.maxAddonStudents).toLocaleString('en-IN')
}

function getMaxTotalTeachers(plan: typeof PLANS[PlanId]): string {
  if (plan.maxTeachers === -1) return 'Unlimited'
  if (plan.maxAddonTeachers === -1) return `${plan.maxTeachers.toLocaleString('en-IN')}+`
  return (plan.maxTeachers + plan.maxAddonTeachers).toLocaleString('en-IN')
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="var(--success-light)" />
      <path
        d="M5 8l2 2 4-4"
        stroke="var(--success-600)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="var(--bg-muted)" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="var(--border-strong)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PricingSection() {
  const plans = Object.values(PLANS)
  const cardsRef = useRevealGroup()

  return (
    <section id="pricing" className="section-padding relative bg-base overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none dot-pattern opacity-30" />
      <div
        className="blob-bg top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px]"
        style={{ background: 'var(--primary-500)' }}
      />

      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <SectionTitle
            eyebrow="💰 Pricing"
            title="Simple plans that grow with your school"
            subtitle="Start small. Upgrade when you grow. No hidden fees, no surprises."
            center={false}
          />
          <Link
            href="/pricing"
            className="text-sm font-display font-semibold flex items-center gap-1.5 flex-shrink-0 group transition-colors text-primary-600 hover:text-primary-700"
          >
            Full pricing details
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="group-hover:translate-x-0.5 transition-transform duration-200"
            >
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

        {/* Credit System Banner */}
        <div className="card mb-10 rounded-2xl p-4 border border-primary-200 bg-gradient-to-r from-primary-50 to-info-50 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
              💳
            </div>
            <div>
              <p className="font-display text-sm font-bold text-primary">
                Pay-as-you-go Messaging Credits
              </p>
              <p className="text-xs mt-0.5 text-secondary">
                1 Credit = ₹1 · 1 SMS = 1cr · 1 WhatsApp = 1cr · 10 Emails = 1cr
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-xs flex-shrink-0">
            {plans.map((plan) => (
              <div key={plan.id} className="text-center">
                <div className="font-display font-bold" style={{ color: plan.color }}>
                  {plan.name}
                </div>
                <div className="text-secondary">
                  {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/mo
                </div>
                <div
                  className="text-[9px] mt-0.5"
                  style={{
                    color:
                      plan.creditRolloverMonths === -1
                        ? 'var(--success-600)'
                        : plan.creditRolloverMonths === 0
                          ? 'var(--text-muted)'
                          : plan.color,
                  }}
                >
                  {plan.creditRolloverMonths === -1
                    ? '✨ never expire'
                    : plan.creditRolloverMonths === 0
                      ? 'monthly reset'
                      : `♻️ ${plan.creditRolloverMonths}mo rollover`}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="text-xs font-display font-semibold hover:underline flex-shrink-0 transition-colors text-primary-600"
          >
            Learn more →
          </Link>
        </div>

        {/* Plan Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 reveal-stagger">
          {plans.map((plan) => {
            const perStudentCost = getPerStudentMonthly(plan)
            const effectiveStudents =
              plan.maxStudents === -1
                ? plan.id === 'enterprise'
                  ? 10000
                  : 3000
                : plan.maxStudents
            const maxStudents = getMaxTotalStudents(plan)
            const maxTeachers = getMaxTotalTeachers(plan)

            return (
              <div
                key={plan.id}
                className={`reveal card-interactive relative rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlighted ? 'border-2 shadow-lg' : 'border shadow-card'
                }`}
                style={
                  plan.highlighted
                    ? {
                        borderColor: plan.color,
                        boxShadow: `0 0 0 4px ${plan.color}10, 0 8px 24px ${plan.color}18`,
                      }
                    : {}
                }
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 badge text-white text-xs font-bold px-4 py-1.5 shadow-brand whitespace-nowrap"
                    style={{ background: plan.color }}
                  >
                    🔥 Most Popular
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: plan.color }}
                    />
                    <h3 className="font-display text-base font-bold text-primary">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-xs font-semibold mb-4" style={{ color: plan.color }}>
                    {plan.tagline}
                  </p>

                  {/* Per Student Pill */}
                  <div
                    className="rounded-xl p-3 mb-4 flex items-center justify-between border"
                    style={{
                      background: `${plan.color}08`,
                      borderColor: `${plan.color}20`,
                    }}
                  >
                    <div>
                      <p className="text-[9px] font-display font-bold uppercase tracking-wide text-muted mb-0.5">
                        Per Student/Month
                      </p>
                      <p
                        className="text-lg font-display font-extrabold"
                        style={{ color: plan.color }}
                      >
                        {perStudentCost}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-display font-medium uppercase tracking-wide text-muted mb-0.5">
                        {plan.maxStudents === -1 ? 'For' : 'Upto'}
                      </p>
                      <p className="text-xs font-bold text-secondary">
                        {plan.maxStudents === -1
                          ? `${(effectiveStudents / 1000).toFixed(0)}k+ students`
                          : `${effectiveStudents.toLocaleString('en-IN')} students`}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-display font-extrabold text-primary">
                      ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-muted">/mo</span>
                  </div>
                  <p className="text-2xs mb-5 text-muted">
                    Yearly: ₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr —{' '}
                    <span className="text-success-600">
                      save ₹
                      {(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString('en-IN')}
                    </span>
                  </p>

                  {/* Limits box */}
                  <div className="card rounded-xl p-3.5 mb-5 space-y-2 text-xs border bg-subtle">
                    {/* Students */}
                    <div className="flex items-start justify-between">
                      <span className="flex items-center gap-1.5 text-secondary">
                        👤 Students
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-primary">
                          {plan.maxStudents === -1
                            ? 'Unlimited'
                            : plan.maxStudents.toLocaleString('en-IN')}
                        </span>
                        {plan.maxStudents !== -1 && plan.maxAddonStudents > 0 && (
                          <div
                            className="text-[9px] font-medium"
                            style={{ color: plan.color }}
                          >
                            max {maxStudents} w/ add-on
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Teachers */}
                    <div className="flex items-start justify-between">
                      <span className="flex items-center gap-1.5 text-secondary">
                        👨‍🏫 Teachers
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-primary">
                          {plan.maxTeachers === -1
                            ? 'Unlimited'
                            : plan.maxTeachers.toLocaleString('en-IN')}
                        </span>
                        {plan.maxTeachers !== -1 && plan.maxAddonTeachers > 0 && (
                          <div
                            className="text-[9px] font-medium"
                            style={{ color: plan.color }}
                          >
                            max {maxTeachers} w/ add-on
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Credits */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-secondary">
                        💳 Free Credits
                      </span>
                      <span className="font-semibold" style={{ color: plan.color }}>
                        {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/mo
                      </span>
                    </div>

                    {/* Rollover */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-secondary">
                        ♻️ Rollover
                      </span>
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            plan.creditRolloverMonths === -1
                              ? 'var(--success-600)'
                              : plan.creditRolloverMonths === 0
                                ? 'var(--text-muted)'
                                : plan.color,
                        }}
                      >
                        {plan.creditRolloverMonths === -1
                          ? 'Never expire'
                          : plan.creditRolloverMonths === 0
                            ? 'Monthly reset'
                            : `${plan.creditRolloverMonths}mo`}
                      </span>
                    </div>

                    {/* Max carry */}
                    {plan.creditRolloverMonths > 0 &&
                      plan.creditRolloverMonths !== -1 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-secondary">
                            💰 Max Carry
                          </span>
                          <span className="font-semibold text-primary">
                            {(
                              plan.creditRolloverMonths * plan.freeCreditsPerMonth
                            ).toLocaleString('en-IN')}{' '}
                            cr
                          </span>
                        </div>
                      )}

                    {/* Modules */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-secondary">
                        📦 Modules
                      </span>
                      <span className="font-semibold text-primary">
                        {plan.modules.length}
                      </span>
                    </div>

                    {/* Storage */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-secondary">
                        💾 Storage
                      </span>
                      <span className="font-semibold text-primary">
                        {plan.storageGB === -1 ? 'Unlimited' : `${plan.storageGB} GB`}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5 flex-1">
                    {plan.features.slice(0, 6).map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs text-secondary">
                        <CheckIcon />
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <p className="text-2xs pl-5 font-medium text-muted">
                        +{plan.features.length - 6} more features
                      </p>
                    )}
                  </div>

                  {/* Not included */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="mb-5 space-y-1.5">
                      {plan.notIncluded.slice(0, 3).map((f) => (
                        <div key={f} className="flex items-start gap-2 text-2xs text-muted">
                          <CrossIcon />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href="/register"
                    className={`w-full py-3 rounded-xl text-sm font-display font-bold text-center block transition-all duration-200 mt-auto hover:-translate-y-0.5 ${
                      plan.highlighted ? 'btn-primary shadow-primary' : 'btn-secondary'
                    }`}
                    style={
                      plan.highlighted
                        ? {
                            background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                            color: 'white',
                          }
                        : {
                            background: `${plan.color}10`,
                            color: plan.color,
                            borderColor: `${plan.color}25`,
                          }
                    }
                  >
                    Start Free Trial →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust Strip */}
        <div className="mt-12 flex flex-wrap justify-center gap-5 text-xs text-muted">
          {[
            {
              icon: (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1.5l5 2v4c0 3.5-2.5 5.5-5 6.5-2.5-1-5-3-5-6.5v-4l5-2z"
                    stroke="var(--success-600)"
                    strokeWidth="1.2"
                    fill="var(--success-light)"
                  />
                </svg>
              ),
              text: 'Secure via Razorpay',
            },
            { icon: null, text: 'Cancel anytime' },
            { icon: null, text: 'No setup fees' },
            { icon: null, text: '60-day free trial' },
            { icon: '💳', text: 'Pay-as-you-go credits' },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {item.icon &&
                (typeof item.icon === 'string' ? (
                  <span>{item.icon}</span>
                ) : (
                  item.icon
                ))}
              {item.text}
            </span>
          ))}
        </div>
      </Container>
    </section>
  )
}