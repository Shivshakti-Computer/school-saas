// FILE: src/app/(public)/pricing/page.tsx
// FULLY CONVERTED TO LOCKED DESIGN PATTERN
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill={`${color}15`} />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="var(--bg-muted)" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--border-strong)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline-block">
      <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="currentColor" />
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

const comparisonRows = [
  {
    label: 'Students (Base)',
    icon: '👤',
    getValue: (p: any) =>
      p.maxStudents === -1 ? 'Unlimited' : p.maxStudents.toLocaleString('en-IN'),
  },
  {
    label: 'Students (Max w/ Add-on)',
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
    label: 'Teachers (Max w/ Add-on)',
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
          HERO SECTION
      ════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 overflow-hidden section-hero">
        {/* Decorative Elements */}
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
        <div
          className="blob-bg top-0 right-1/4 w-96 h-64"
          style={{ background: 'var(--primary-500)' }}
        />

        <Container>
          <div className="relative text-center max-w-3xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="badge badge-brand inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
              Transparent Pricing — No Hidden Fees
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-primary mb-5">
              School management{' '}
              <span className="gradient-text-warm">jo sach mein affordable hai</span>
            </h1>

            {/* Subtitle */}
            <p className="text-secondary text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              {TRIAL_CONFIG.durationDays}-day free trial. No credit card required.
              Pay only for what you actually use.
            </p>

            {/* Value Proposition Banner */}
            <div className="card inline-flex flex-col sm:flex-row items-center gap-4 px-6 py-4 mb-8 border-success-600/20 bg-gradient-to-r from-success-50 to-success-100/50">
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-display font-extrabold text-success-600">
                  ₹1/student/month se bhi kam
                </p>
                <p className="text-xs mt-1 text-success-700">
                  Industry average ₹3–5/student/month — Skolify mein sirf ₹0.33–₹1
                </p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-success-300 rounded-full" />
              <div className="text-center flex-shrink-0">
                <p className="text-xs text-muted mb-0.5">Starting at</p>
                <p className="text-xl font-display font-extrabold text-primary">₹499/mo</p>
              </div>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '🛡️ No hidden fees',
                '✓ Cancel anytime',
                `🎁 ${TRIAL_CONFIG.durationDays}-day free trial`,
                '💳 Pay-as-you-go',
              ].map((text) => (
                <span
                  key={text}
                  className="badge badge-neutral text-xs font-medium"
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
      <section className="py-10 bg-card border-b border-default">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Section Label */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-border" />
              <p className="text-2xs font-display font-bold uppercase tracking-widest text-muted">
                💡 Per Student Monthly Cost — Sabse Affordable School ERP
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Cost Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {plans.map((plan) => {
                const cost = getPerStudentCost(plan, cycle)
                const monthlyEquiv = cycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)
                const maxTotal = getMaxTotalStudents(plan)

                return (
                  <div
                    key={plan.id}
                    className={`card rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${plan.highlighted ? 'border-2 shadow-card-hover' : 'border'
                      }`}
                    style={
                      plan.highlighted
                        ? {
                          borderColor: `${plan.color}40`,
                          background: `linear-gradient(135deg, ${plan.color}06 0%, var(--bg-card) 100%)`,
                        }
                        : {}
                    }
                  >
                    {/* Plan Header */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: plan.color }}
                      />
                      <span
                        className="text-2xs font-display font-bold uppercase tracking-wide"
                        style={{ color: plan.color }}
                      >
                        {plan.name}
                      </span>
                      {plan.highlighted && (
                        <span
                          className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ml-auto"
                          style={{ background: plan.color }}
                        >
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Cost Display */}
                    <div className="flex items-baseline gap-0.5 mb-0.5">
                      <span
                        className="text-2xl font-display font-extrabold text-success-600"
                      >
                        {cost.perMonth}
                      </span>
                    </div>
                    <p className="text-2xs font-medium text-muted mb-2">
                      per student/month
                    </p>
                    <p className="text-xs font-semibold text-success-700 mb-3">
                      {cost.perDay}/day
                    </p>

                    {/* Footer */}
                    <div className="border-t border-default pt-2">
                      <p className="text-2xs text-muted">
                        ₹{monthlyEquiv.toLocaleString('en-IN')}/mo
                      </p>
                      <p
                        className="text-2xs font-semibold mt-0.5"
                        style={{ color: plan.color }}
                      >
                        Max {maxTotal} students
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Industry Comparison */}
            <div className="card rounded-xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 bg-subtle">
              <p className="text-xs font-semibold text-secondary">
                📊 Industry comparison (per student/month)
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs font-medium text-muted">Traditional ERPs</p>
                  <p className="text-lg font-display font-extrabold text-danger-600">₹3–5</p>
                  <p className="text-2xs text-muted">/student/month</p>
                </div>
                <div className="text-2xl font-bold text-border-strong">vs</div>
                <div className="card text-center px-4 py-2 rounded-xl border-2 border-success-600/30 bg-success-50">
                  <p className="text-xs font-bold text-success-700">Skolify ✓</p>
                  <p className="text-lg font-display font-extrabold text-success-600">₹0.33–₹1</p>
                  <p className="text-2xs text-success-700">/student/month</p>
                </div>
              </div>
              <p className="text-2xs italic text-muted">*Industry average estimate</p>
            </div>

            <p className="text-center text-2xs mt-3 text-muted">
              ↕ Billing toggle se cost automatically update hogi
            </p>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          CREDIT SYSTEM EXPLAINER
      ════════════════════════════════════════ */}
      <section className="py-10 bg-card">
        <Container>
          <button
            onClick={() => setShowCreditGuide(!showCreditGuide)}
            className="w-full max-w-3xl mx-auto block text-left"
          >
            <div className="card-interactive rounded-2xl p-5 transition-all duration-300 border-primary-200 bg-gradient-to-br from-primary-50 to-info-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
                    💳
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-primary">
                      Skolify Credits — Pay-as-you-go Messaging
                    </h3>
                    <p className="text-sm text-secondary mt-1">
                      Jitna use karo utna pay karo · Credits rollover hote hain (plan ke anusar)
                    </p>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-full border border-default flex items-center justify-center text-xs flex-shrink-0 ml-4 transition-transform duration-300 ${showCreditGuide ? 'rotate-180' : ''
                    }`}
                >
                  ▼
                </div>
              </div>

              {showCreditGuide && (
                <div className="mt-6 space-y-4 animate-slide-down">
                  {/* How credits work */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        icon: '📱',
                        title: '1 SMS',
                        cost: '1 Credit',
                        price: '≈ ₹1',
                        desc: 'Attendance alert, fee reminder',
                      },
                      {
                        icon: '💬',
                        title: '1 WhatsApp',
                        cost: '1 Credit',
                        price: '≈ ₹1',
                        desc: 'Notifications to parents',
                      },
                      {
                        icon: '📧',
                        title: '10 Emails',
                        cost: '1 Credit',
                        price: '≈ ₹0.10/email',
                        desc: 'Receipts, reports, newsletters',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="card rounded-xl p-4 text-center border bg-card"
                      >
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <div className="font-display font-bold text-sm text-primary">
                          {item.title}
                        </div>
                        <div
                          className="text-sm font-extrabold mt-1"
                          style={{ color: 'var(--primary-600)' }}
                        >
                          = {item.cost}
                        </div>
                        <div className="text-xs font-semibold text-success-600">
                          {item.price}
                        </div>
                        <div className="text-xs mt-2 leading-snug text-muted">
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Per plan credits + rollover */}
                  <div className="card rounded-xl p-4 border border-primary-200 bg-primary-50/50">
                    <p className="text-xs font-bold mb-3 text-primary-700">
                      🎁 Free credits + Rollover — Plan-wise
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {plans.map((plan) => {
                        const maxCarry =
                          plan.creditRolloverMonths === -1
                            ? null
                            : plan.creditRolloverMonths === 0
                              ? 0
                              : plan.creditRolloverMonths * plan.freeCreditsPerMonth

                        return (
                          <div
                            key={plan.id}
                            className="card rounded-lg p-3 text-center border bg-card"
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full mx-auto mb-1.5"
                              style={{ background: plan.color }}
                            />
                            <div className="font-display font-bold text-xs text-primary">
                              {plan.name}
                            </div>
                            <div
                              className="font-display font-extrabold text-sm mt-1"
                              style={{ color: plan.color }}
                            >
                              {plan.freeCreditsPerMonth.toLocaleString('en-IN')}
                            </div>
                            <div className="text-2xs text-muted">credits/mo</div>

                            {/* Rollover info */}
                            <div className="mt-1.5 pt-1.5 border-t border-default">
                              <div
                                className="text-2xs font-semibold"
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
                                  ? '✨ Never expire'
                                  : plan.creditRolloverMonths === 0
                                    ? '🔄 Monthly reset'
                                    : `♻️ ${plan.creditRolloverMonths}mo rollover`}
                              </div>
                              {maxCarry !== null && maxCarry > 0 && (
                                <div className="text-[9px] mt-0.5 text-muted">
                                  Max carry: {maxCarry.toLocaleString('en-IN')} cr
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-2xs mt-3 text-primary-700">
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
      <section className="pb-8 bg-card">
        <Container>
          <div className="flex flex-col items-center gap-3">
            {/* Toggle Pill */}
            <div className="inline-flex p-1.5 rounded-2xl border border-default bg-muted shadow-inset-sm">
              {(['monthly', 'yearly'] as BillingCycle[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`px-8 py-3 rounded-xl text-sm font-display font-semibold transition-all duration-200 ${cycle === c
                    ? 'bg-card text-primary shadow-sm'
                    : 'bg-transparent text-muted hover:text-secondary'
                    }`}
                >
                  {c === 'monthly' ? (
                    'Monthly'
                  ) : (
                    <span className="flex items-center gap-2">
                      Yearly
                      <span className="badge badge-success text-2xs font-bold">
                        Save 2 months
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {cycle === 'yearly' && (
              <p className="text-xs font-medium text-success-600 animate-fade-in">
                <SparkleIcon /> Yearly billing pe 2 mahine free — cost strip update ho gayi hai
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          PLAN CARDS
      ════════════════════════════════════════ */}
      <section className="pb-20 bg-card">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
              const saved = getSavings(plan.id)
              const cost = getPerStudentCost(plan, cycle)
              const maxStudents = getMaxTotalStudents(plan)
              const maxTeachers = getMaxTotalTeachers(plan)

              return (
                <div
                  key={plan.id}
                  className={`card-interactive relative rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-2 ${plan.highlighted ? 'border-2 shadow-lg' : 'border shadow-card'
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
                  {/* Popular Badge */}
                  {plan.highlighted && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 badge text-white text-xs font-bold px-4 py-1.5 shadow-primary whitespace-nowrap"
                      style={{ background: plan.color }}
                    >
                      🔥 Most Popular
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: plan.color }}
                      />
                      <h3 className="font-display text-base font-bold text-primary">
                        {plan.name}
                      </h3>
                    </div>
                    <p
                      className="text-xs font-semibold mb-4"
                      style={{ color: plan.color }}
                    >
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
                        <p className="text-2xs font-display font-semibold uppercase tracking-wide text-muted mb-0.5">
                          Per Student
                        </p>
                        <p
                          className="text-xl font-display font-extrabold"
                          style={{ color: plan.color }}
                        >
                          {cost.perMonth}
                          <span className="text-2xs font-normal ml-1 text-muted">/mo</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xs font-display font-semibold uppercase tracking-wide text-muted mb-0.5">
                          Per Day
                        </p>
                        <p className="text-sm font-bold text-success-700">
                          {cost.perDay}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-4xl font-display font-extrabold text-primary">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-sm text-muted">
                        /{cycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>

                    {cycle === 'yearly' && saved > 0 && (
                      <p className="text-xs font-semibold mb-1 text-success-600">
                        🎉 ₹{saved.toLocaleString('en-IN')} saved/year
                      </p>
                    )}
                    {cycle === 'monthly' && (
                      <p className="text-xs mb-1 text-muted">
                        Yearly: ₹{plan.yearlyPrice.toLocaleString('en-IN')}{' '}
                        <span className="text-success-600">
                          (save ₹{saved.toLocaleString('en-IN')})
                        </span>
                      </p>
                    )}

                    <p className="text-xs leading-relaxed mb-5 mt-2 text-secondary">
                      {plan.description}
                    </p>

                    {/* Limits box */}
                    <div className="card rounded-xl p-3.5 mb-5 space-y-2 text-xs border bg-subtle">
                      {/* Students */}
                      <div className="flex items-center justify-between">
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
                            <span
                              className="text-2xs ml-1 font-medium"
                              style={{ color: plan.color }}
                            >
                              (max {maxStudents} w/ add-on)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Teachers */}
                      <div className="flex items-center justify-between">
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
                            <span
                              className="text-2xs ml-1 font-medium"
                              style={{ color: plan.color }}
                            >
                              (max {maxTeachers} w/ add-on)
                            </span>
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
                              : `${plan.creditRolloverMonths} months`}
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
                              credits
                            </span>
                          </div>
                        )}

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
                      {plan.features.map((f) => (
                        <div
                          key={f}
                          className="flex items-start gap-2 text-xs text-secondary"
                        >
                          <CheckIcon color={plan.color} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* Not included */}
                    {plan.notIncluded && plan.notIncluded.length > 0 && (
                      <div className="mb-5 space-y-1.5 pt-4 border-t border-default">
                        {plan.notIncluded.map((f) => (
                          <div
                            key={f}
                            className="flex items-start gap-2 text-2xs text-muted"
                          >
                            <CrossIcon />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA Button */}
                    <Link
                      href="/register"
                      className={`w-full py-3.5 rounded-xl text-sm font-display font-bold text-center block transition-all duration-200 mt-auto hover:-translate-y-0.5 ${plan.highlighted ? 'btn-primary shadow-primary' : 'btn-secondary'
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
                            borderColor: `${plan.color}30`,
                          }
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
          CREDIT PACKS & ADD-ONS
      ════════════════════════════════════════ */}
      <section className="py-20 bg-muted">
        <Container>
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-2xs font-display font-bold uppercase tracking-widest text-primary-600 mb-3">
              Add-ons
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
              Extra Credits & Add-ons
            </h2>
            <p className="mt-3 text-sm max-w-md mx-auto text-secondary">
              Plan ke free credits khatam ho jayen to extra kharid sakte ho. One-time purchase — koi subscription nahi.
            </p>
          </div>

          {/* Credit packs */}
          <div className="mb-14">
            <h3 className="font-display text-sm font-bold mb-5 text-center text-secondary">
              💳 Message Credit Packs
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`card-interactive rounded-2xl p-5 text-center transition-all hover:-translate-y-1 ${pack.popular
                    ? 'border-2 border-primary-500 shadow-primary'
                    : 'border shadow-card'
                    }`}
                >
                  {pack.popular && (
                    <div className="badge badge-brand text-2xs font-bold inline-block mb-3">
                      Most Popular
                    </div>
                  )}
                  <div className="text-3xl font-display font-extrabold mb-1 text-primary-600">
                    ₹{pack.price}
                  </div>
                  <div className="text-xl font-display font-bold mb-1 text-primary">
                    {pack.credits.toLocaleString('en-IN')} Credits
                  </div>
                  {pack.savingsPercent > 0 && (
                    <div className="text-xs font-semibold mb-2 text-success-600">
                      {pack.savingsPercent}% cheaper
                    </div>
                  )}
                  <p className="text-xs mb-3 leading-snug text-secondary">
                    {pack.description}
                  </p>
                  <div className="text-2xs border-t border-default pt-2 mt-2 text-muted">
                    ₹{pack.pricePerCredit.toFixed(2)}/credit
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Addon caps table */}
          <div>
            <h3 className="font-display text-sm font-bold mb-2 text-center text-secondary">
              👥 Extra Students & Teachers Add-ons
            </h3>
            <p className="text-xs text-center mb-6 text-muted">
              Plan ke base limit ke upar extra kharid sakte ho — permanently increases your limit
            </p>

            {/* Limits Table */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="card rounded-2xl border overflow-hidden shadow-card">
                <div className="px-5 py-3 border-b border-default bg-subtle">
                  <p className="text-xs font-bold text-secondary">
                    📊 Add-on Limits Per Plan — Maximum total capacity
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="portal-table w-full text-xs">
                    <thead>
                      <tr className="border-b border-default">
                        <th className="text-left p-3 font-display font-semibold text-muted">
                          Plan
                        </th>
                        <th className="p-3 text-center font-display font-semibold text-muted">
                          Base Students
                        </th>
                        <th className="p-3 text-center font-display font-semibold text-primary-600">
                          Max Add-on
                        </th>
                        <th className="p-3 text-center font-display font-semibold text-success-600">
                          Total Max
                        </th>
                        <th className="p-3 text-center font-display font-semibold text-muted">
                          Base Teachers
                        </th>
                        <th className="p-3 text-center font-display font-semibold text-primary-600">
                          Max Add-on
                        </th>
                        <th className="p-3 text-center font-display font-semibold text-success-600">
                          Total Max
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.id} className="border-b border-subtle">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: plan.color }}
                              />
                              <span className="font-display font-bold text-primary">
                                {plan.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-medium text-secondary">
                            {plan.maxStudents === -1
                              ? '∞'
                              : plan.maxStudents.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center font-bold text-primary-600">
                            {plan.maxAddonStudents === -1
                              ? '∞'
                              : `+${plan.maxAddonStudents}`}
                          </td>
                          <td className="p-3 text-center font-extrabold text-success-600">
                            {getMaxTotalStudents(plan)}
                          </td>
                          <td className="p-3 text-center font-medium text-secondary">
                            {plan.maxTeachers === -1
                              ? '∞'
                              : plan.maxTeachers.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center font-bold text-primary-600">
                            {plan.maxAddonTeachers === -1
                              ? '∞'
                              : `+${plan.maxAddonTeachers}`}
                          </td>
                          <td className="p-3 text-center font-extrabold text-success-600">
                            {getMaxTotalTeachers(plan)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-default bg-subtle">
                  <p className="text-2xs text-muted">
                    * Add-on limit exceed hone par plan upgrade karna hoga. Enterprise plan mein unlimited capacity.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing cards */}
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
              ].map((group) => (
                <div
                  key={group.title}
                  className="card rounded-2xl p-5 border shadow-card"
                >
                  <h4 className="font-display font-bold text-sm mb-4 text-primary">
                    {group.title}
                  </h4>
                  <div className="space-y-0">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.label}
                        className="flex items-center justify-between py-2.5 border-b border-default last:border-0"
                      >
                        <span className="text-sm text-secondary">{entry.label}</span>
                        <div className="text-right">
                          <span className="font-bold text-sm text-primary">
                            ₹{entry.price}
                          </span>
                          <span className="text-xs ml-1.5 text-muted">{entry.per}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-2xs mt-3 text-muted">
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
      <section className="py-20 bg-card">
        <Container>
          <div className="text-center mb-10 animate-fade-in">
            <p className="text-2xs font-display font-bold uppercase tracking-widest text-primary-600 mb-2">
              Real Numbers
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
              💡 Per Student Cost — Plan-wise
            </h2>
            <p className="mt-2 text-sm max-w-sm mx-auto text-secondary">
              Billing cycle ke saath automatically update hota hai
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="card overflow-hidden rounded-2xl border shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-subtle border-b border-default">
                    <th className="text-left p-4 font-display font-semibold text-secondary">
                      Plan
                    </th>
                    <th className="p-4 text-center font-display font-semibold text-secondary">
                      Students
                    </th>
                    <th className="p-4 text-center font-display font-semibold text-secondary">
                      {cycle === 'monthly' ? 'Monthly' : 'Monthly Equiv.'}
                    </th>
                    <th className="p-4 text-center font-display font-semibold bg-success-50 text-success-700">
                      /Student/Month
                    </th>
                    <th className="p-4 text-center font-display font-semibold bg-success-50 text-success-700">
                      /Student/Day
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => {
                    const cost = getPerStudentCost(plan, cycle)
                    return (
                      <tr
                        key={plan.id}
                        className="transition-colors hover:bg-subtle border-b border-subtle last:border-0"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: plan.color }}
                            />
                            <span className="font-display font-bold text-primary">
                              {plan.name}
                            </span>
                            {plan.highlighted && (
                              <span
                                className="badge text-[9px] font-bold text-white"
                                style={{ background: plan.color }}
                              >
                                Popular
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center font-medium text-secondary">
                          {plan.maxStudents === -1
                            ? 'Unlimited'
                            : plan.maxStudents.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-primary">
                            ₹
                            {(cycle === 'monthly'
                              ? plan.monthlyPrice
                              : Math.round(plan.yearlyPrice / 12)
                            ).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs ml-0.5 text-muted">/mo</span>
                        </td>
                        <td className="p-4 text-center bg-success-50/50">
                          <span className="text-lg font-display font-extrabold text-success-600">
                            {cost.perMonth}
                          </span>
                          {cost.isUnlimited && (
                            <span className="block text-2xs text-muted">
                              ~{cost.effectiveStudents.toLocaleString('en-IN')} students
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center bg-success-50/50">
                          <span className="font-bold text-success-700">{cost.perDay}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="card mt-5 p-4 rounded-xl border border-warning-300 bg-warning-50 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">📊</span>
              <div>
                <p className="text-xs font-bold mb-1 text-warning-dark">
                  Industry Context
                </p>
                <p className="text-xs leading-relaxed text-warning-dark">
                  Traditional school ERP software industry mein per-student cost generally{' '}
                  <strong>₹3–₹5/month</strong> hoti hai — messaging, add-ons, aur support alag charge hote hain.
                  Skolify mein <strong>₹0.33–₹1/student/month</strong> mein sab kuch included hai.
                </p>
              </div>
            </div>

            {cycle === 'yearly' && (
              <p className="text-center text-2xs mt-3 text-muted">
                * Yearly plan ki monthly equivalent price se calculate kiya gaya hai
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
    COMPARISON TABLE
════════════════════════════════════════ */}
      <section className="py-20 bg-muted">
        <Container>
          <div className="text-center mb-10 animate-fade-in">
            <p className="text-2xs font-display font-bold uppercase tracking-widest text-primary-600 mb-2">
              Feature Matrix
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
              Detailed Plan Comparison
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Sab plans side-by-side — koi hidden info nahi
            </p>
          </div>

          <div className="card rounded-2xl border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default">
                    <th className="text-left p-4 font-display font-semibold min-w-[200px] bg-subtle text-secondary sticky left-0 z-10">
                      Feature
                    </th>
                    {planIds.map((id) => {
                      const plan = PLANS[id]
                      return (
                        <th
                          key={id}
                          className="p-4 text-center min-w-[140px] bg-subtle"
                        >
                          <div className="flex flex-col items-center gap-1.5 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: plan.color }}
                              />
                              <span className="font-display font-bold text-primary">
                                {plan.name}
                              </span>
                            </div>
                            <span className="text-2xs font-normal text-muted">
                              ₹
                              {(cycle === 'monthly'
                                ? plan.monthlyPrice
                                : plan.yearlyPrice
                              ).toLocaleString('en-IN')}
                              /{cycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Plan Limits Section Header */}
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 pt-5 pb-2 text-2xs font-display font-bold uppercase tracking-widest bg-subtle text-muted sticky left-0"
                    >
                      📊 Plan Limits
                    </td>
                  </tr>

                  {/* Comparison Rows */}
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-b border-subtle hover:bg-card/50 transition-colors">
                      <td className="p-4 font-medium text-secondary sticky left-0 bg-card">
                        <span className="flex items-center gap-2">
                          <span className="text-base">{row.icon}</span>
                          <span>{row.label}</span>
                          {(row as any).highlight && (
                            <span className="badge badge-brand text-[9px] font-bold px-1.5 py-0.5">
                              with add-on
                            </span>
                          )}
                        </span>
                      </td>
                      {planIds.map((id) => (
                        <td
                          key={id}
                          className={`p-4 text-center font-semibold transition-colors ${(row as any).highlight
                            ? 'bg-success-50/40 text-success-700'
                            : 'bg-card text-primary'
                            }`}
                        >
                          {row.getValue(PLANS[id])}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Modules Section Header */}
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 pt-6 pb-2 text-2xs font-display font-bold uppercase tracking-widest bg-subtle text-muted sticky left-0"
                    >
                      📦 Modules Included
                    </td>
                  </tr>

                  {/* Module Rows - FIXED ICONS */}
                  {Array.from(
                    new Set(planIds.flatMap((id) => PLANS[id].modules))
                  ).map((mod) => (
                    <tr key={mod} className="border-b border-subtle hover:bg-card/50 transition-colors">
                      <td className="p-4 text-secondary font-medium sticky left-0 bg-card">
                        {getModuleLabel(mod)}
                      </td>
                      {planIds.map((id) => {
                        const isIncluded = PLANS[id].modules.includes(mod)
                        const plan = PLANS[id]

                        return (
                          <td key={id} className="p-4 text-center bg-card">
                            {isIncluded ? (
                              <div className="inline-flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <circle cx="10" cy="10" r="10" fill="#D1FAE5" />
                                  <path
                                    d="M6 10L8.5 12.5L14 7"
                                    stroke="#10B981"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <span className="text-border-strong text-lg font-bold">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* Support & SLA Section - Optional */}
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 pt-6 pb-2 text-2xs font-display font-bold uppercase tracking-widest bg-subtle text-muted sticky left-0"
                    >
                      🛟 Support & Service
                    </td>
                  </tr>

                  {/* Support Rows */}
                  {[
                    {
                      label: 'Email Support',
                      getValue: (p: any) => {
                        const hasSupport = ['starter', 'growth', 'pro', 'enterprise'].includes(p.id)
                        return hasSupport ? (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#D1FAE5" />
                            <path d="M6 10L8.5 12.5L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : '—'
                      }
                    },
                    {
                      label: 'Priority Support',
                      getValue: (p: any) => {
                        const hasSupport = ['pro', 'enterprise'].includes(p.id)
                        return hasSupport ? (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#D1FAE5" />
                            <path d="M6 10L8.5 12.5L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : '—'
                      }
                    },
                    {
                      label: 'Dedicated Manager',
                      getValue: (p: any) => {
                        return p.id === 'enterprise' ? (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#D1FAE5" />
                            <path d="M6 10L8.5 12.5L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : '—'
                      }
                    },
                    {
                      label: 'Onboarding Assistance',
                      getValue: (p: any) => {
                        return ['pro', 'enterprise'].includes(p.id) ? (
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#D1FAE5" />
                            <path d="M6 10L8.5 12.5L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : '—'
                      }
                    },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-subtle hover:bg-card/50 transition-colors">
                      <td className="p-4 font-medium text-secondary sticky left-0 bg-card">
                        {row.label}
                      </td>
                      {planIds.map((id) => (
                        <td key={id} className="p-4 text-center bg-card">
                          <div className="inline-flex items-center justify-center">
                            {row.getValue(PLANS[id])}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#D1FAE5" />
                <path d="M6 10L8.5 12.5L14 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Included</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-border-strong text-base font-bold">—</span>
              <span>Not Available</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section className="py-20 bg-card">
        <Container>
          <div className="text-center mb-10 animate-fade-in">
            <p className="text-2xs font-display font-bold uppercase tracking-widest text-primary-600 mb-2">
              FAQ
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
              Common Questions
            </h2>
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
                className="card rounded-xl p-5 border transition-all hover:shadow-md"
              >
                <h3 className="font-display text-sm font-bold mb-2 flex items-start gap-2 text-primary">
                  <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-2xs font-extrabold flex-shrink-0 mt-0.5">
                    Q
                  </span>
                  {faq.q}
                </h3>
                <p className="text-xs leading-relaxed pl-7 text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}