// FILE: src/components/marketing/PricingSection.tsx
// UPDATED: Design system aligned + Enterprise calculation fix
// ═══════════════════════════════════════════════════════════

'use client'

import Link from 'next/link'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import { useRevealGroup } from '@/hooks/useReveal'

// ✅ FIX: Enterprise ke liye 10000 assume karo
function getPerStudentMonthly(plan: typeof PLANS[PlanId]): string {
  const effectiveStudents = plan.maxStudents === -1
    ? plan.id === 'enterprise' ? 10000 : 3000
    : plan.maxStudents
  const cost = plan.monthlyPrice / effectiveStudents
  return cost < 1 ? `₹${cost.toFixed(2)}` : `₹${cost.toFixed(1)}`
}

function CheckIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 16 16"
      fill="none" className="flex-shrink-0 mt-0.5"
    >
      <circle cx="8" cy="8" r="8" fill="var(--success-light)" />
      <path
        d="M5 8l2 2 4-4"
        stroke="var(--success)"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 16 16"
      fill="none" className="flex-shrink-0 mt-0.5"
    >
      <circle cx="8" cy="8" r="8" fill="var(--surface-100)" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="var(--surface-300)"
        strokeWidth="1.2" strokeLinecap="round"
      />
    </svg>
  )
}

export function PricingSection() {
  const plans = Object.values(PLANS)
  const cardsRef = useRevealGroup()

  return (
    <section id="pricing" className="section-padding relative section-white">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none dot-pattern opacity-40" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px]
          rounded-full pointer-events-none blur-[120px] opacity-10"
        style={{ background: 'var(--brand)' }}
      />

      <Container>
        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <SectionTitle
            eyebrow="💰 Pricing"
            title="Simple plans that grow with your school"
            subtitle="Start small. Upgrade when you grow. No hidden fees, no surprises."
            center={false}
          />
          <Link
            href="/pricing"
            className="text-sm font-semibold flex items-center gap-1.5
              flex-shrink-0 group transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            Full pricing details
            <svg
              width="14" height="14" viewBox="0 0 16 16" fill="none"
              className="group-hover:translate-x-0.5 transition-transform"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* ── Credit System Mini Banner ── */}
        <div
          className="mb-10 rounded-2xl p-4 border flex flex-col sm:flex-row
            sm:items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, var(--brand-light) 0%, #F0F9FF 100%)',
            borderColor: 'rgba(37,99,235,0.15)',
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center
                text-xl flex-shrink-0"
              style={{ background: 'rgba(37,99,235,0.1)' }}
            >
              💳
            </div>
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Pay-as-you-go Messaging Credits
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                1 Credit = ₹1 · 1 SMS = 1cr · 1 WhatsApp = 1cr · 10 Emails = 1cr
              </p>
            </div>
          </div>

          {/* Per plan credit count */}
          <div className="flex gap-4 text-xs flex-shrink-0">
            {plans.map(plan => (
              <div key={plan.id} className="text-center">
                <div className="font-bold" style={{ color: plan.color }}>
                  {plan.name}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/mo
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="text-xs font-semibold hover:underline flex-shrink-0 transition-colors"
            style={{ color: 'var(--brand)' }}
          >
            Learn more →
          </Link>
        </div>

        {/* ── Plan Cards ── */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 reveal-stagger"
        >
          {plans.map(plan => {
            const perStudentCost = getPerStudentMonthly(plan)
            const effectiveStudents = plan.maxStudents === -1
              ? plan.id === 'enterprise' ? 10000 : 3000
              : plan.maxStudents

            return (
              <div
                key={plan.id}
                className="reveal relative rounded-2xl flex flex-col
                  transition-all duration-300 hover:-translate-y-1"
                style={plan.highlighted
                  ? {
                    background: 'var(--surface-0)',
                    border: `2px solid ${plan.color}`,
                    boxShadow: `0 0 0 4px ${plan.color}10,
                      0 8px 24px ${plan.color}15`,
                  }
                  : {
                    background: 'var(--surface-0)',
                    border: '1px solid var(--surface-200)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }
                }
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2
                      text-xs font-bold text-white px-4 py-1.5 rounded-full
                      whitespace-nowrap shadow-brand"
                    style={{ background: plan.color }}
                  >
                    🔥 Most Popular
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">

                  {/* Plan name + dot */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: plan.color }}
                    />
                    <h3
                      className="text-base font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {plan.name}
                    </h3>
                  </div>

                  <p
                    className="text-xs font-semibold mb-4"
                    style={{ color: plan.color }}
                  >
                    {plan.tagline}
                  </p>

                  {/* ✅ Per Student Pill — prominent above price */}
                  <div
                    className="rounded-xl p-3 mb-4 flex items-center justify-between"
                    style={{
                      background: `${plan.color}08`,
                      border: `1px solid ${plan.color}20`,
                    }}
                  >
                    <div>
                      <p
                        className="text-[9px] font-bold uppercase tracking-wide mb-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Per Student/Month
                      </p>
                      <p
                        className="text-lg font-extrabold"
                        style={{ color: plan.color }}
                      >
                        {perStudentCost}
                      </p>
                    </div>
                    {/* Context */}
                    <div className="text-right">
                      <p
                        className="text-[9px] font-medium uppercase tracking-wide mb-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {plan.maxStudents === -1 ? 'For' : 'Upto'}
                      </p>
                      <p
                        className="text-xs font-bold"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {plan.maxStudents === -1
                          ? `${(effectiveStudents / 1000).toFixed(0)}k+ students`
                          : `${effectiveStudents.toLocaleString('en-IN')} students`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                      className="text-3xl font-extrabold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      /mo
                    </span>
                  </div>

                  <p
                    className="text-[11px] mb-5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Yearly: ₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr —{' '}
                    <span style={{ color: 'var(--success)' }}>
                      save ₹{((plan.monthlyPrice * 12) - plan.yearlyPrice).toLocaleString('en-IN')}
                    </span>
                  </p>

                  {/* Limits box */}
                  <div
                    className="rounded-xl p-3.5 mb-5 space-y-2 text-[12px]"
                    style={{
                      background: 'var(--surface-50)',
                      border: '1px solid var(--surface-100)',
                    }}
                  >
                    {[
                      {
                        icon: '👤', label: 'Students',
                        val: plan.maxStudents === -1
                          ? 'Unlimited'
                          : plan.maxStudents.toLocaleString('en-IN'),
                      },
                      {
                        icon: '👨‍🏫', label: 'Teachers',
                        val: plan.maxTeachers === -1
                          ? 'Unlimited'
                          : plan.maxTeachers.toLocaleString('en-IN'),
                      },
                      {
                        icon: '💳', label: 'Free Credits',
                        val: `${plan.freeCreditsPerMonth.toLocaleString('en-IN')}/mo`,
                        highlight: true,
                      },
                      {
                        icon: '♻️', label: 'Rollover',
                        val: plan.creditRolloverMonths === -1
                          ? 'Never expire'
                          : plan.creditRolloverMonths === 0
                            ? 'No'
                            : `${plan.creditRolloverMonths}mo`,
                      },
                      {
                        icon: '📦', label: 'Modules',
                        val: `${plan.modules.length}`,
                      },
                      {
                        icon: '💾', label: 'Storage',
                        val: plan.storageGB === -1
                          ? 'Unlimited'
                          : `${plan.storageGB} GB`,
                      },
                    ].map(row => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between"
                      >
                        <span
                          className="flex items-center gap-1.5"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {row.icon} {row.label}
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            color: row.highlight
                              ? 'var(--brand)'
                              : 'var(--text-primary)',
                          }}
                        >
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5 flex-1">
                    {plan.features.slice(0, 6).map(f => (
                      <div
                        key={f}
                        className="flex items-start gap-2 text-[12px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <CheckIcon />
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.features.length > 6 && (
                      <p
                        className="text-[11px] pl-5 font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        +{plan.features.length - 6} more features
                      </p>
                    )}
                  </div>

                  {/* Not included */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="mb-5 space-y-1.5">
                      {plan.notIncluded.slice(0, 3).map(f => (
                        <div
                          key={f}
                          className="flex items-start gap-2 text-[11px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <CrossIcon />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href="/register"
                    className="w-full py-3 rounded-xl text-sm font-bold
                      text-center block transition-all duration-200 mt-auto
                      hover:-translate-y-0.5"
                    style={plan.highlighted
                      ? {
                        background: plan.color,
                        color: 'white',
                        boxShadow: `0 4px 14px ${plan.color}40`,
                      }
                      : {
                        background: `${plan.color}10`,
                        color: plan.color,
                        border: `1.5px solid ${plan.color}25`,
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

        {/* ── Trust Strip ── */}
        <div
          className="mt-12 flex flex-wrap justify-center gap-5 text-[13px]"
          style={{ color: 'var(--text-muted)' }}
        >
          {[
            {
              icon: (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1.5l5 2v4c0 3.5-2.5 5.5-5 6.5-2.5-1-5-3-5-6.5v-4l5-2z"
                    stroke="var(--success)" strokeWidth="1.2"
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
              {item.icon && (
                typeof item.icon === 'string'
                  ? <span>{item.icon}</span>
                  : item.icon
              )}
              {item.text}
            </span>
          ))}
        </div>
      </Container>
    </section>
  )
}