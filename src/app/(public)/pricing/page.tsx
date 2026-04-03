// FILE: src/app/(public)/pricing/page.tsx
// UPDATED v4: Addon caps visible + Rollover properly explained
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/marketing/Container'
import {
  PLANS, getSavings,
  CREDIT_PACKS, ADDON_PRICING, TRIAL_CONFIG,
  type PlanId, type BillingCycle,
} from '@/config/pricing'
import { MODULE_REGISTRY, type ModuleKey } from '@/lib/moduleRegistry'
import { CTA } from '@/components/marketing/CTA'

// ─── Icons ───────────────────────────────────────────────────
function CheckIcon({ color = '#10B981' }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill={`${color}18`} />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="#F1F5F9" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#CBD5E1" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────
function getModuleLabel(key: string): string {
  return MODULE_REGISTRY[key as ModuleKey]?.label ?? key
}

function getPerStudentCost(plan: typeof PLANS[PlanId], cycle: BillingCycle) {
  const price = cycle === 'monthly'
    ? plan.monthlyPrice
    : Math.round(plan.yearlyPrice / 12)

  const effectiveStudents = plan.maxStudents === -1
    ? plan.id === 'enterprise' ? 10000 : 3000
    : plan.maxStudents

  const perMonth = price / effectiveStudents
  const perDay = perMonth / 30

  return {
    perMonth: perMonth < 1 ? `₹${perMonth.toFixed(2)}` : `₹${perMonth.toFixed(1)}`,
    perDay: perDay < 1 ? `₹${perDay.toFixed(3)}` : `₹${perDay.toFixed(2)}`,
    isUnlimited: plan.maxStudents === -1,
    effectiveStudents,
  }
}

// Max total students possible (plan + max addon)
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

// ─── Constants ───────────────────────────────────────────────
const planIds: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']

// REPLACE comparisonRows with:
const comparisonRows = [
  {
    label: 'Students (Base)',
    icon: '👤',
    getValue: (p: any) =>
      p.maxStudents === -1 ? 'Unlimited' : p.maxStudents.toLocaleString('en-IN'),
  },
  {
    label: 'Students (Max w/ Add-on)',  // ← UNIQUE label
    icon: '👤',
    getValue: (p: any) => getMaxTotalStudents(p),
    highlight: true,
  },
  {
    label: 'Teachers (Base)',
    icon: '👨‍🏫',
    getValue: (p: any) =>
      p.maxTeachers === -1 ? 'Unlimited' : p.maxTeachers.toLocaleString('en-IN'),
  },
  {
    label: 'Teachers (Max w/ Add-on)',  // ← UNIQUE label
    icon: '👨‍🏫',
    getValue: (p: any) => getMaxTotalTeachers(p),
    highlight: true,
  },
  {
    label: 'Free Credits/Month',
    icon: '💳',
    getValue: (p: any) =>
      p.freeCreditsPerMonth === -1
        ? 'Unlimited'
        : p.freeCreditsPerMonth.toLocaleString('en-IN'),
  },
  {
    label: 'Credit Rollover',
    icon: '♻️',
    getValue: (p: any) =>
      p.creditRolloverMonths === -1
        ? 'Never expire'
        : p.creditRolloverMonths === 0
          ? 'No rollover'
          : `${p.creditRolloverMonths} months`,
  },
  {
    label: 'Max Carry Forward',
    icon: '💰',
    getValue: (p: any) => {
      if (p.creditRolloverMonths === -1) return 'Unlimited'
      if (p.creditRolloverMonths === 0) return '—'
      return `${(p.creditRolloverMonths * p.freeCreditsPerMonth).toLocaleString('en-IN')} credits`
    },
  },
  {
    label: 'Storage',
    icon: '💾',
    getValue: (p: any) =>
      p.storageGB === -1 ? 'Unlimited' : `${p.storageGB} GB`,
  },
  {
    label: 'Modules Included',
    icon: '📦',
    getValue: (p: any) => `${p.modules.length} modules`,
  },
]

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [showCreditGuide, setShowCreditGuide] = useState(false)
  const plans = Object.values(PLANS)

  return (
    <>
      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 overflow-hidden section-brand-light">
        <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />
        <div
          className="absolute top-0 right-1/4 w-96 h-64 rounded-full pointer-events-none blur-[100px] opacity-20"
          style={{ background: 'var(--brand)' }}
        />
        <Container>
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="badge-brand inline-flex mb-6">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
              Transparent Pricing — No Hidden Fees
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5"
              style={{ color: 'var(--text-primary)' }}
            >
              School management{' '}
              <span className="gradient-text">jo sach mein affordable hai</span>
            </h1>

            <p
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              {TRIAL_CONFIG.durationDays}-day free trial. No credit card required.
              Pay only for what you actually use.
            </p>

            <div
              className="inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 rounded-2xl mb-8 border"
              style={{ background: 'var(--success-light)', borderColor: 'rgba(16,185,129,0.2)' }}
            >
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--success)' }}>
                  ₹1/student/month se bhi kam
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#059669' }}>
                  Industry average ₹3–5/student/month — Skolify mein sirf ₹0.33–₹1
                </p>
              </div>
              <div className="hidden sm:block w-px h-10 rounded-full" style={{ background: 'rgba(16,185,129,0.25)' }} />
              <div className="text-center flex-shrink-0">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Starting at</p>
                <p className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>₹499/mo</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {['🛡️ No hidden fees', '✅ Cancel anytime', `🎁 ${TRIAL_CONFIG.durationDays}-day free trial`, '💳 Pay-as-you-go'].map(text => (
                <span
                  key={text}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-200)', color: 'var(--text-secondary)' }}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          VALUE STRIP — Per Student Cost
      ════════════════════════════════════════ */}
      <section className="py-10 section-white border-b" style={{ borderColor: 'var(--surface-200)' }}>
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1" style={{ background: 'var(--surface-200)' }} />
              <p className="text-[11px] font-bold uppercase tracking-widest px-2" style={{ color: 'var(--text-muted)' }}>
                💡 Per Student Monthly Cost — Sabse Affordable School ERP
              </p>
              <div className="h-px flex-1" style={{ background: 'var(--surface-200)' }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {plans.map(plan => {
                const cost = getPerStudentCost(plan, cycle)
                const monthlyEquiv = cycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)
                const maxTotal = getMaxTotalStudents(plan)

                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl p-4 border transition-all duration-200 hover:shadow-soft"
                    style={plan.highlighted
                      ? { background: `${plan.color}06`, borderColor: `${plan.color}30`, boxShadow: `0 0 0 2px ${plan.color}20` }
                      : { background: 'var(--surface-50)', borderColor: 'var(--surface-200)' }
                    }
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: plan.color }} />
                      <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: plan.color }}>
                        {plan.name}
                      </span>
                      {plan.highlighted && (
                        <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ml-auto" style={{ background: plan.color }}>
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span className="text-2xl font-extrabold" style={{ color: 'var(--success)' }}>
                        {cost.perMonth}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      per student/month
                    </p>
                    <p className="text-xs font-semibold mb-3" style={{ color: '#059669' }}>
                      {cost.perDay}/day
                    </p>

                    <div className="border-t pt-2" style={{ borderColor: 'var(--surface-200)' }}>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        ₹{monthlyEquiv.toLocaleString('en-IN')}/mo
                      </p>
                      {/* Max total with addon */}
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--brand)' }}>
                        Max {maxTotal} students
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className="rounded-xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{ background: 'var(--surface-50)', borderColor: 'var(--surface-200)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                📊 Industry comparison (per student/month)
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Traditional ERPs</p>
                  <p className="text-lg font-extrabold" style={{ color: 'var(--danger)' }}>₹3–5</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/student/month</p>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--surface-300)' }}>vs</div>
                <div className="text-center px-4 py-2 rounded-xl border-2" style={{ background: 'var(--success-light)', borderColor: 'rgba(16,185,129,0.3)' }}>
                  <p className="text-xs font-bold" style={{ color: '#059669' }}>Skolify ✅</p>
                  <p className="text-lg font-extrabold" style={{ color: 'var(--success)' }}>₹0.33–₹1</p>
                  <p className="text-[10px]" style={{ color: '#059669' }}>/student/month</p>
                </div>
              </div>
              <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>*Industry average estimate</p>
            </div>
            <p className="text-center text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              ↕ Billing toggle se cost automatically update hogi
            </p>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          CREDIT SYSTEM EXPLAINER
      ════════════════════════════════════════ */}
      <section className="py-10 section-white">
        <Container>
          <button onClick={() => setShowCreditGuide(!showCreditGuide)} className="w-full max-w-3xl mx-auto block text-left">
            <div
              className="rounded-2xl p-5 border transition-all duration-200 hover:shadow-soft"
              style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)', borderColor: 'rgba(37,99,235,0.15)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--brand-light)' }}>
                    💳
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                      Skolify Credits — Pay-as-you-go Messaging
                    </h3>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Jitna use karo utna pay karo · Credits rollover hote hain (plan ke anusar)
                    </p>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ml-4 transition-transform duration-200 ${showCreditGuide ? 'rotate-180' : ''}`}
                  style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-200)', color: 'var(--text-muted)' }}
                >▼</div>
              </div>

              {showCreditGuide && (
                <div className="mt-6 space-y-4">
                  {/* How credits work */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: '📱', title: '1 SMS', cost: '1 Credit', price: '≈ ₹1', desc: 'Attendance alert, fee reminder' },
                      { icon: '💬', title: '1 WhatsApp', cost: '1 Credit', price: '≈ ₹1', desc: 'Notifications to parents' },
                      { icon: '📧', title: '10 Emails', cost: '1 Credit', price: '≈ ₹0.10/email', desc: 'Receipts, reports, newsletters' },
                    ].map(item => (
                      <div key={item.title} className="rounded-xl p-4 text-center border" style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-100)' }}>
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                        <div className="text-sm font-extrabold mt-1" style={{ color: 'var(--brand)' }}>= {item.cost}</div>
                        <div className="text-xs font-semibold" style={{ color: 'var(--success)' }}>{item.price}</div>
                        <div className="text-xs mt-2 leading-snug" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per plan credits + rollover */}
                  <div className="rounded-xl p-4 border" style={{ background: 'var(--brand-light)', borderColor: 'rgba(37,99,235,0.1)' }}>
                    <p className="text-xs font-bold mb-3" style={{ color: 'var(--brand-dark)' }}>
                      🎁 Free credits + Rollover — Plan-wise
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {plans.map(plan => {
                        const maxCarry = plan.creditRolloverMonths === -1
                          ? null
                          : plan.creditRolloverMonths === 0
                            ? 0
                            : plan.creditRolloverMonths * plan.freeCreditsPerMonth

                        return (
                          <div key={plan.id} className="rounded-lg p-3 text-center border" style={{ background: 'var(--surface-0)', borderColor: 'rgba(37,99,235,0.08)' }}>
                            <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5" style={{ background: plan.color }} />
                            <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{plan.name}</div>
                            <div className="font-extrabold text-sm mt-1" style={{ color: 'var(--brand)' }}>
                              {plan.freeCreditsPerMonth.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>credits/mo</div>

                            {/* Rollover info */}
                            <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: 'var(--surface-100)' }}>
                              <div className="text-[10px] font-semibold" style={{
                                color: plan.creditRolloverMonths === -1
                                  ? 'var(--success)'
                                  : plan.creditRolloverMonths === 0
                                    ? 'var(--text-muted)'
                                    : 'var(--brand)',
                              }}>
                                {plan.creditRolloverMonths === -1
                                  ? '✨ Never expire'
                                  : plan.creditRolloverMonths === 0
                                    ? '🔄 Monthly reset'
                                    : `♻️ ${plan.creditRolloverMonths}mo rollover`}
                              </div>
                              {maxCarry !== null && maxCarry > 0 && (
                                <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  Max carry: {maxCarry.toLocaleString('en-IN')} cr
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[10px] mt-3" style={{ color: 'var(--brand-dark)' }}>
                      💡 Rollover = unused credits next month carry forward hote hain (plan limit tak)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </button>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          BILLING TOGGLE
      ════════════════════════════════════════ */}
      <section className="pb-8 section-white">
        <Container>
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex p-1.5 rounded-2xl border shadow-inner-soft" style={{ background: 'var(--surface-100)', borderColor: 'var(--surface-200)' }}>
              {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className="px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={cycle === c
                    ? { background: 'var(--surface-0)', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                    : { background: 'transparent', color: 'var(--text-muted)' }
                  }
                >
                  {c === 'monthly' ? 'Monthly' : (
                    <span className="flex items-center gap-2">
                      Yearly
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--success-light)', color: '#059669' }}>
                        Save 2 months
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            {cycle === 'yearly' && (
              <p className="text-xs font-medium animate-fade-in" style={{ color: 'var(--success)' }}>
                ✨ Yearly billing pe 2 mahine free — cost strip update ho gayi hai
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          PLAN CARDS — Updated with addon info
      ════════════════════════════════════════ */}
      <section className="pb-20 section-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map(plan => {
              const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
              const saved = getSavings(plan.id)
              const cost = getPerStudentCost(plan, cycle)
              const maxStudents = getMaxTotalStudents(plan)
              const maxTeachers = getMaxTotalTeachers(plan)

              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-1"
                  style={plan.highlighted
                    ? { background: 'var(--surface-0)', border: `2px solid ${plan.color}`, boxShadow: `0 0 0 4px ${plan.color}12, 0 16px 40px ${plan.color}15` }
                    : { background: 'var(--surface-0)', border: '1px solid var(--surface-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                  }
                >
                  {plan.highlighted && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-4 py-1.5 rounded-full whitespace-nowrap shadow-brand"
                      style={{ background: plan.color }}
                    >
                      🔥 Most Popular
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full" style={{ background: plan.color }} />
                      <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                    </div>
                    <p className="text-xs font-semibold mb-4" style={{ color: plan.color }}>{plan.tagline}</p>

                    {/* Per Student Pill */}
                    <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ background: `${plan.color}08`, border: `1px solid ${plan.color}20` }}>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Per Student</p>
                        <p className="text-xl font-extrabold" style={{ color: plan.color }}>
                          {cost.perMonth}
                          <span className="text-[11px] font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mo</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Per Day</p>
                        <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>{cost.perDay}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>

                    {cycle === 'yearly' && saved > 0 && (
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--success)' }}>
                        🎉 ₹{saved.toLocaleString('en-IN')} saved/year
                      </p>
                    )}
                    {cycle === 'monthly' && (
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        Yearly: ₹{plan.yearlyPrice.toLocaleString('en-IN')}{' '}
                        <span style={{ color: 'var(--success)' }}>(save ₹{saved.toLocaleString('en-IN')})</span>
                      </p>
                    )}

                    <p className="text-[12px] leading-relaxed mb-5 mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {plan.description}
                    </p>

                    {/* Limits box — UPDATED with addon info */}
                    <div className="rounded-xl p-3.5 mb-5 space-y-2 text-xs" style={{ background: 'var(--surface-50)', border: '1px solid var(--surface-100)' }}>
                      {/* Students row with addon */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          👤 Students
                        </span>
                        <div className="text-right">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents.toLocaleString('en-IN')}
                          </span>
                          {plan.maxStudents !== -1 && plan.maxAddonStudents > 0 && (
                            <span className="text-[10px] ml-1 font-medium" style={{ color: 'var(--brand)' }}>
                              (max {maxStudents} w/ add-on)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Teachers row with addon */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                          👨‍🏫 Teachers
                        </span>
                        <div className="text-right">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers.toLocaleString('en-IN')}
                          </span>
                          {plan.maxTeachers !== -1 && plan.maxAddonTeachers > 0 && (
                            <span className="text-[10px] ml-1 font-medium" style={{ color: 'var(--brand)' }}>
                              (max {maxTeachers} w/ add-on)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>💳 Free Credits</span>
                        <span className="font-semibold" style={{ color: 'var(--brand)' }}>
                          {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/mo
                        </span>
                      </div>

                      {/* Rollover */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>♻️ Rollover</span>
                        <span className="font-semibold" style={{
                          color: plan.creditRolloverMonths === -1
                            ? 'var(--success)'
                            : plan.creditRolloverMonths === 0
                              ? 'var(--text-muted)'
                              : 'var(--brand)',
                        }}>
                          {plan.creditRolloverMonths === -1
                            ? 'Never expire'
                            : plan.creditRolloverMonths === 0
                              ? 'Monthly reset'
                              : `${plan.creditRolloverMonths} months`}
                        </span>
                      </div>

                      {/* Max carry forward — only for Growth/Pro */}
                      {plan.creditRolloverMonths > 0 && plan.creditRolloverMonths !== -1 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>💰 Max Carry</span>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {(plan.creditRolloverMonths * plan.freeCreditsPerMonth).toLocaleString('en-IN')} credits
                          </span>
                        </div>
                      )}

                      {/* Storage */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>💾 Storage</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {plan.storageGB === -1 ? 'Unlimited' : `${plan.storageGB} GB`}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-5 flex-1">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                          <CheckIcon color={plan.color} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {plan.notIncluded && plan.notIncluded.length > 0 && (
                      <div className="mb-5 space-y-1.5 pt-4 border-t" style={{ borderColor: 'var(--surface-100)' }}>
                        {plan.notIncluded.map(f => (
                          <div key={f} className="flex items-start gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            <CrossIcon />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href="/register"
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-center block transition-all duration-200 mt-auto hover:-translate-y-0.5"
                      style={plan.highlighted
                        ? { background: plan.color, color: 'white', boxShadow: `0 4px 14px ${plan.color}40` }
                        : { background: `${plan.color}10`, color: plan.color, border: `1.5px solid ${plan.color}30` }
                      }
                    >
                      Start {TRIAL_CONFIG.durationDays}-Day Free Trial →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          CREDIT PACKS & ADD-ONS — Updated with caps
      ════════════════════════════════════════ */}
      <section className="py-20 section-light">
        <Container>
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand)' }}>Add-ons</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Extra Credits & Add-ons
            </h2>
            <p className="mt-3 text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Plan ke free credits khatam ho jayen to extra kharid sakte ho. One-time purchase — koi subscription nahi.
            </p>
          </div>

          {/* Credit packs */}
          <div className="mb-14">
            <h3 className="text-sm font-bold mb-5 text-center" style={{ color: 'var(--text-secondary)' }}>
              💳 Message Credit Packs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {CREDIT_PACKS.map(pack => (
                <div
                  key={pack.id}
                  className="rounded-2xl p-5 text-center transition-all hover:-translate-y-1 hover:shadow-medium"
                  style={pack.popular
                    ? { background: 'var(--surface-0)', border: `2px solid var(--brand)`, boxShadow: '0 0 0 4px rgba(37,99,235,0.08)' }
                    : { background: 'var(--surface-0)', border: '1px solid var(--surface-200)' }
                  }
                >
                  {pack.popular && (
                    <div className="text-[10px] font-bold text-white px-3 py-0.5 rounded-full inline-block mb-3" style={{ background: 'var(--brand)' }}>
                      Most Popular
                    </div>
                  )}
                  <div className="text-3xl font-extrabold mb-1" style={{ color: 'var(--brand)' }}>₹{pack.price}</div>
                  <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {pack.credits.toLocaleString('en-IN')} Credits
                  </div>
                  {pack.savingsPercent > 0 && (
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--success)' }}>
                      {pack.savingsPercent}% cheaper
                    </div>
                  )}
                  <p className="text-xs mb-3 leading-snug" style={{ color: 'var(--text-secondary)' }}>{pack.description}</p>
                  <div className="text-[11px] border-t pt-2 mt-2" style={{ borderColor: 'var(--surface-100)', color: 'var(--text-muted)' }}>
                    ₹{pack.pricePerCredit.toFixed(2)}/credit
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students + Teachers add-ons with plan-wise caps */}
          <div>
            <h3 className="text-sm font-bold mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>
              👥 Extra Students & Teachers Add-ons
            </h3>
            <p className="text-xs text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Plan ke base limit ke upar extra kharid sakte ho — permanently increases your limit
            </p>

            {/* Addon caps per plan — NEW INFO TABLE */}
            <div className="max-w-3xl mx-auto mb-8">
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-200)' }}
              >
                <div className="px-5 py-3 border-b" style={{ background: 'var(--surface-50)', borderColor: 'var(--surface-200)' }}>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    📊 Add-on Limits Per Plan — Maximum total capacity
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-100)' }}>
                        <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Plan</th>
                        <th className="p-3 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>Base Students</th>
                        <th className="p-3 text-center font-semibold" style={{ color: 'var(--brand)' }}>Max Add-on</th>
                        <th className="p-3 text-center font-semibold" style={{ color: 'var(--success)' }}>Total Max</th>
                        <th className="p-3 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>Base Teachers</th>
                        <th className="p-3 text-center font-semibold" style={{ color: 'var(--brand)' }}>Max Add-on</th>
                        <th className="p-3 text-center font-semibold" style={{ color: 'var(--success)' }}>Total Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map(plan => (
                        <tr
                          key={plan.id}
                          style={{ borderBottom: '1px solid var(--surface-50)' }}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
                              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {plan.maxStudents === -1 ? '∞' : plan.maxStudents.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center font-bold" style={{ color: 'var(--brand)' }}>
                            {plan.maxAddonStudents === -1 ? '∞' : `+${plan.maxAddonStudents}`}
                          </td>
                          <td className="p-3 text-center font-extrabold" style={{ color: 'var(--success)' }}>
                            {getMaxTotalStudents(plan)}
                          </td>
                          <td className="p-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {plan.maxTeachers === -1 ? '∞' : plan.maxTeachers.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center font-bold" style={{ color: 'var(--brand)' }}>
                            {plan.maxAddonTeachers === -1 ? '∞' : `+${plan.maxAddonTeachers}`}
                          </td>
                          <td className="p-3 text-center font-extrabold" style={{ color: 'var(--success)' }}>
                            {getMaxTotalTeachers(plan)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--surface-100)', background: 'var(--surface-50)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    * Add-on limit exceed hone par plan upgrade karna hoga. Enterprise plan mein unlimited capacity.
                  </p>
                </div>
              </div>
            </div>

            {/* Pack pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {[
                {
                  title: '👤 Extra Students',
                  entries: Object.entries(ADDON_PRICING.extraStudents).map(([, pack]) => ({
                    label: `+${pack.students} students`,
                    price: pack.price,
                    per: `₹${pack.pricePerStudent}/student`,
                  })),
                },
                {
                  title: '👨‍🏫 Extra Teachers/Staff',
                  entries: Object.entries(ADDON_PRICING.extraTeachers).map(([, pack]) => ({
                    label: `+${pack.teachers} staff`,
                    price: pack.price,
                    per: `₹${pack.pricePerTeacher}/staff`,
                  })),
                },
              ].map(group => (
                <div key={group.title} className="rounded-2xl p-5 border" style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-200)' }}>
                  <h4 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{group.title}</h4>
                  <div className="space-y-0">
                    {group.entries.map(entry => (
                      <div
                        key={entry.label}
                        className="flex items-center justify-between py-2.5 border-b last:border-0"
                        style={{ borderColor: 'var(--surface-100)' }}
                      >
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entry.label}</span>
                        <div className="text-right">
                          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>₹{entry.price}</span>
                          <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>{entry.per}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                    * One-time purchase. Permanently increases your limit (plan cap tak).
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          VALUE CALCULATOR TABLE
      ════════════════════════════════════════ */}
      <section className="py-20 section-white">
        <Container>
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand)' }}>Real Numbers</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              💡 Per Student Cost — Plan-wise
            </h2>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Billing cycle ke saath automatically update hota hai
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden rounded-2xl border shadow-soft" style={{ borderColor: 'var(--surface-200)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-50)', borderBottom: '1px solid var(--surface-200)' }}>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-secondary)' }}>Plan</th>
                    <th className="p-4 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Students</th>
                    <th className="p-4 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {cycle === 'monthly' ? 'Monthly' : 'Monthly Equiv.'}
                    </th>
                    <th className="p-4 text-center font-semibold" style={{ background: 'var(--success-light)', color: '#059669' }}>/Student/Month</th>
                    <th className="p-4 text-center font-semibold" style={{ background: 'var(--success-light)', color: '#059669' }}>/Student/Day</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => {
                    const cost = getPerStudentCost(plan, cycle)
                    return (
                      <tr key={plan.id} className="transition-colors" style={{ borderBottom: '1px solid var(--surface-50)' }}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: plan.color }} />
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                            {plan.highlighted && (
                              <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: plan.color }}>Popular</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            ₹{(cycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>/mo</span>
                        </td>
                        <td className="p-4 text-center" style={{ background: 'rgba(236,253,245,0.5)' }}>
                          <span className="text-lg font-extrabold" style={{ color: 'var(--success)' }}>{cost.perMonth}</span>
                          {cost.isUnlimited && (
                            <span className="block text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              ~{cost.effectiveStudents.toLocaleString('en-IN')} students
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center" style={{ background: 'rgba(236,253,245,0.5)' }}>
                          <span className="font-bold" style={{ color: '#059669' }}>{cost.perDay}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-4 rounded-xl border flex items-start gap-3" style={{ background: 'var(--warning-light)', borderColor: 'rgba(245,158,11,0.15)' }}>
              <span className="text-lg flex-shrink-0">📊</span>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: '#92400E' }}>Industry Context</p>
                <p className="text-xs leading-relaxed" style={{ color: '#78350F' }}>
                  Traditional school ERP software industry mein per-student cost generally{' '}
                  <strong>₹3–₹5/month</strong> hoti hai — messaging, add-ons, aur support alag charge hote hain.
                  Skolify mein <strong>₹0.33–₹1/student/month</strong> mein sab kuch included hai.
                </p>
              </div>
            </div>

            {cycle === 'yearly' && (
              <p className="text-center text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
                * Yearly plan ki monthly equivalent price se calculate kiya gaya hai
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          COMPARISON TABLE — Updated with addon rows
      ════════════════════════════════════════ */}
      <section className="py-20 section-light">
        <Container>
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand)' }}>Feature Matrix</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Detailed Plan Comparison
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sab plans side-by-side — koi hidden info nahi
            </p>
          </div>

          <div className="rounded-2xl border shadow-soft overflow-hidden" style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-200)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-200)' }}>
                    <th className="text-left p-4 font-semibold min-w-[180px]" style={{ background: 'var(--surface-50)', color: 'var(--text-secondary)' }}>
                      Feature
                    </th>
                    {planIds.map(id => {
                      const plan = PLANS[id]
                      return (
                        <th key={id} className="p-4 text-center min-w-[130px]" style={{ background: 'var(--surface-50)' }}>
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                          </div>
                          <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                            ₹{(cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice).toLocaleString('en-IN')}/
                            {cycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'var(--surface-50)', color: 'var(--text-muted)' }}>
                      Plan Limits
                    </td>
                  </tr>
                  {comparisonRows.map(row => (
                    <tr key={row.label} style={{ borderBottom: '1px solid var(--surface-50)' }}>
                      <td className="p-4 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-2">
                          {row.icon} {row.label}
                          {(row as any).highlight && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                              with add-on
                            </span>
                          )}
                        </span>
                      </td>
                      {planIds.map(id => (
                        <td
                          key={id}
                          className="p-4 text-center font-semibold"
                          style={{
                            color: (row as any).highlight ? 'var(--success)' : 'var(--text-primary)',
                            background: (row as any).highlight ? 'rgba(236,253,245,0.4)' : 'transparent',
                          }}
                        >
                          {row.getValue(PLANS[id])}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Modules */}
                  <tr>
                    <td colSpan={5} className="px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: 'var(--surface-50)', color: 'var(--text-muted)' }}>
                      📦 Modules Included
                    </td>
                  </tr>
                  {Array.from(new Set(planIds.flatMap(id => PLANS[id].modules))).map(mod => (
                    <tr key={mod} style={{ borderBottom: '1px solid var(--surface-50)' }}>
                      <td className="p-4" style={{ color: 'var(--text-secondary)' }}>{getModuleLabel(mod)}</td>
                      {planIds.map(id => (
                        <td key={id} className="p-4 text-center">
                          {PLANS[id].modules.includes(mod) ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'var(--success-light)' }}>
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M4 8l3 3 5-5" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="font-bold text-lg" style={{ color: 'var(--surface-300)' }}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          FAQ — Updated with addon + rollover info
      ════════════════════════════════════════ */}
      <section className="py-20 section-white">
        <Container>
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand)' }}>FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Common Questions</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              {
                q: 'Credit system kya hai?',
                a: '1 Credit = ₹1. 1 SMS = 1 Credit, 1 WhatsApp = 1 Credit, 10 Emails = 1 Credit. Har plan mein free credits milte hain. Extra chahiye to credit pack kharid sakte ho — koi subscription nahi.',
              },
              {
                q: 'Free credits rollover kaise hote hain?',
                a: 'Starter plan mein credits monthly reset hote hain (no rollover). Growth mein 3 months tak carry forward — max 4,500 credits carry ho sakte hain. Pro mein 6 months — max 18,000 credits. Enterprise mein kabhi expire nahi hote. Purchased credit packs ka rollover plan ke anusar hota hai.',
              },
              {
                q: 'Student/Teacher add-on limit kya hai?',
                a: 'Starter: max +250 extra students (total 750), +10 extra teachers (total 30). Growth: max +750 students (total 2,250), +25 teachers (total 75). Pro: max +2,000 students (total 7,000), +50 teachers (total 200). Enterprise: unlimited. Add-on limit puri hone par plan upgrade karna hoga.',
              },
              {
                q: 'Student limit puri ho jaaye to kya karein?',
                a: 'Pehle extra student add-on kharid sakte ho (plan cap tak). Cap full hone par plan upgrade karo. Growth plan mein 1,500 base + 750 addon = 2,250 students possible hain.',
              },
              {
                q: 'Kya free trial mein credit card lagta hai?',
                a: `Bilkul nahi! ${TRIAL_CONFIG.durationDays}-day free trial bina kisi payment ke. ${TRIAL_CONFIG.freeCredits} free credits bhi milte hain trial ke dauran.`,
              },
              {
                q: 'Monthly se yearly switch kar sakte hain?',
                a: 'Haan! Remaining days ka credit automatically adjust hota hai. Double charge bilkul nahi hota.',
              },
              {
                q: 'Cancel karne pe kya hota hai?',
                a: 'Cancel karte hi scheduled cancel ho jata hai — period end tak poora access milta rehta hai. Koi abrupt cutoff nahi.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-xl p-5 border transition-colors"
                style={{ background: 'var(--surface-0)', borderColor: 'var(--surface-200)' }}
              >
                <h3 className="text-sm font-bold mb-2 flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}
                  >Q</span>
                  {faq.q}
                </h3>
                <p className="text-[13px] leading-relaxed pl-7" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}