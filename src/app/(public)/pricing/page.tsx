// FILE: src/app/(public)/pricing/page.tsx
// UPDATED: Credit system, new prices, add-on info
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

function CheckIcon({ color = '#10B981' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill={`${color}18`} />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill="#F1F5F9" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function getModuleLabel(key: string): string {
  return MODULE_REGISTRY[key as ModuleKey]?.label ?? key
}

const planIds: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']

// ── Comparison rows (updated — no old SMS limits) ──
const comparisonRows = [
  {
    label: 'Students',
    getValue: (plan: any) =>
      plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents.toLocaleString('en-IN'),
  },
  {
    label: 'Teachers',
    getValue: (plan: any) =>
      plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers.toLocaleString('en-IN'),
  },
  {
    label: 'Free Credits/Month',
    getValue: (plan: any) =>
      plan.freeCreditsPerMonth === -1
        ? 'Unlimited'
        : plan.freeCreditsPerMonth.toLocaleString('en-IN'),
  },
  {
    label: 'Credit Rollover',
    getValue: (plan: any) =>
      plan.creditRolloverMonths === -1
        ? 'Never expire'
        : plan.creditRolloverMonths === 0
          ? 'No rollover'
          : `${plan.creditRolloverMonths} months`,
  },
  {
    label: 'Storage',
    getValue: (plan: any) =>
      plan.storageGB === -1 ? 'Unlimited' : `${plan.storageGB} GB`,
  },
  {
    label: 'Modules',
    getValue: (plan: any) => plan.modules.length.toString(),
  },
]

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [showCreditGuide, setShowCreditGuide] = useState(false)

  const plans = Object.values(PLANS)

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative pt-24 pb-10 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>
        <Container>
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-700">Transparent Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Simple plans,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                honest pricing
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              {TRIAL_CONFIG.durationDays}-day free trial. No credit card required.
              Pay only for what you use.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <span>🛡️ No hidden fees</span>
              <span>✅ Cancel anytime</span>
              <span>🎁 {TRIAL_CONFIG.durationDays}-day free trial</span>
              <span>💳 Pay-as-you-go messaging</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Credit System Explainer ─── */}
      <section className="pb-8 bg-white">
        <Container>
          <div
            className="max-w-3xl mx-auto rounded-2xl p-6 border cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF, #F0F9FF)',
              border: '1px solid #C7D2FE',
            }}
            onClick={() => setShowCreditGuide(!showCreditGuide)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">💳</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Skolify Credits — Unique Pay-as-you-go Messaging
                  </h3>
                  <p className="text-sm text-slate-600">
                    Jitna use karo utna pay karo. Credits kabhi waste nahi hote.
                  </p>
                </div>
              </div>
              <span className="text-slate-400 text-sm">{showCreditGuide ? '▲' : '▼'}</span>
            </div>

            {showCreditGuide && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: '📱', title: '1 SMS', subtitle: '= 1 Credit = ₹1', desc: 'Attendance alert, fee reminder, result SMS' },
                  { icon: '💬', title: '1 WhatsApp', subtitle: '= 1 Credit = ₹1', desc: 'WhatsApp notifications to parents' },
                  { icon: '📧', title: '10 Emails', subtitle: '= 1 Credit = ₹0.10', desc: 'Fee receipts, reports, newsletters' },
                ].map(item => (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl p-4 text-center shadow-sm"
                  >
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-sm font-semibold text-indigo-600">{item.subtitle}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                  </div>
                ))}

                <div className="sm:col-span-3 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">
                    🎁 Free Credits har plan mein included hain
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {plans.map(plan => (
                      <div key={plan.id} className="text-center">
                        <div className="font-bold" style={{ color: plan.color }}>
                          {plan.name}
                        </div>
                        <div className="text-slate-600">
                          {plan.freeCreditsPerMonth.toLocaleString('en-IN')} credits/mo
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          {plan.creditRolloverMonths === -1
                            ? 'Never expire'
                            : plan.creditRolloverMonths === 0
                              ? 'No rollover'
                              : `${plan.creditRolloverMonths}mo rollover`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* ─── Billing Toggle ─── */}
      <section className="pb-8 bg-white">
        <Container>
          <div className="flex justify-center">
            <div className="inline-flex gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
              {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`
                    px-6 py-3 rounded-xl text-sm font-semibold transition-all
                    ${cycle === c ? 'bg-white text-slate-900 shadow-soft' : 'text-slate-500 hover:text-slate-700'}
                  `}
                >
                  {c === 'monthly' ? 'Monthly' : (
                    <span className="flex items-center gap-2">
                      Yearly
                      <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        2 months free
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Plan Cards ─── */}
      <section className="pb-20 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map(plan => {
              const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
              const saved = getSavings(plan.id)

              return (
                <div
                  key={plan.id}
                  className={`
                    bg-white rounded-2xl border p-6 flex flex-col relative
                    transition-all duration-300 hover:shadow-medium hover:-translate-y-1
                    ${plan.highlighted
                      ? 'border-blue-300 ring-2 ring-blue-500 ring-offset-2 shadow-brand'
                      : 'border-slate-200 shadow-soft'}
                  `}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 rounded-full whitespace-nowrap shadow-brand">
                      🔥 Most Popular
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ background: plan.color }} />
                  </div>
                  <p className="text-xs font-semibold mb-5" style={{ color: plan.color }}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-slate-400">
                      /{cycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  {cycle === 'yearly' && saved > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold mb-3">
                      🎉 Save ₹{saved.toLocaleString('en-IN')}/year
                    </p>
                  )}
                  {cycle === 'monthly' && (
                    <p className="text-xs text-slate-400 mb-3">
                      or ₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr (save ₹{saved.toLocaleString('en-IN')})
                    </p>
                  )}

                  <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                    {plan.description}
                  </p>

                  {/* Limits box */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 space-y-2.5 text-[13px]">
                    <div className="flex justify-between text-slate-500">
                      <span>👤 Students</span>
                      <span className="font-semibold text-slate-900">
                        {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>👨‍🏫 Teachers</span>
                      <span className="font-semibold text-slate-900">
                        {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers}
                      </span>
                    </div>
                    {/* ← NEW: Credits instead of SMS */}
                    <div className="flex justify-between text-slate-500">
                      <span>💳 Free Credits</span>
                      <span className="font-semibold text-indigo-600">
                        {plan.freeCreditsPerMonth.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>♻️ Rollover</span>
                      <span className="font-semibold text-slate-900 text-xs">
                        {plan.creditRolloverMonths === -1
                          ? 'Never expire'
                          : plan.creditRolloverMonths === 0
                            ? 'No'
                            : `${plan.creditRolloverMonths} months`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>📦 Modules</span>
                      <span className="font-semibold text-slate-900">{plan.modules.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>💾 Storage</span>
                      <span className="font-semibold text-slate-900">
                        {plan.storageGB === -1 ? 'Unlimited' : `${plan.storageGB} GB`}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mb-5 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                        <CheckIcon color={plan.color} /><span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Not included */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="mb-5 space-y-2 border-t border-slate-100 pt-4">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">
                        Not included
                      </p>
                      {plan.notIncluded.map(f => (
                        <div key={f} className="flex items-start gap-2 text-[12px] text-slate-400">
                          <CrossIcon /><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    href="/register"
                    className={`
                      w-full py-3.5 rounded-xl text-sm font-semibold text-center block transition-all
                      ${plan.highlighted
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-brand-lg hover:-translate-y-0.5'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'}
                    `}
                  >
                    Start {TRIAL_CONFIG.durationDays}-Day Free Trial →
                  </Link>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* ─── Credit Packs Section ─── */}
      <section className="pt-20 pb-20 bg-slate-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">
              💳 Credit Packs — Extra Messages Kharido
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Plan ke free credits khatam ho jayen to extra kharid sakte ho
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {CREDIT_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`
                  bg-white rounded-2xl p-5 border text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-medium
                  ${pack.popular ? 'border-indigo-300 ring-2 ring-indigo-500 ring-offset-1' : 'border-slate-200'}
                `}
              >
                {pack.popular && (
                  <div className="text-[10px] font-bold text-white bg-indigo-600 px-3 py-0.5 rounded-full inline-block mb-3">
                    Most Popular
                  </div>
                )}
                <div className="text-3xl font-extrabold text-indigo-600 mb-1">
                  ₹{pack.price}
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  {pack.credits.toLocaleString('en-IN')} Credits
                </div>
                {pack.savingsPercent > 0 && (
                  <div className="text-xs font-semibold text-emerald-600 mb-2">
                    {pack.savingsPercent}% off
                  </div>
                )}
                <p className="text-xs text-slate-500 mb-3">{pack.description}</p>
                <div className="text-[11px] text-slate-400">
                  ₹{pack.pricePerCredit.toFixed(2)}/credit
                </div>
              </div>
            ))}
          </div>

          {/* Add-on: Extra Students/Teachers */}
          <div className="mt-12 text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">
              Add-on: Extra Students & Teachers
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Plan limit puri ho jaaye to extra add karo — upgrade ki zaroorat nahi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Extra Students */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft">
              <h4 className="font-bold text-slate-900 mb-3">👤 Extra Students</h4>
              <div className="space-y-2">
                {Object.entries(ADDON_PRICING.extraStudents).map(([id, pack]) => (
                  <div key={id} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">+{pack.students} students</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">₹{pack.price}</span>
                      <span className="text-xs text-slate-400 ml-1">
                        (₹{pack.pricePerStudent}/student)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Teachers */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft">
              <h4 className="font-bold text-slate-900 mb-3">👨‍🏫 Extra Teachers/Staff</h4>
              <div className="space-y-2">
                {Object.entries(ADDON_PRICING.extraTeachers).map(([id, pack]) => (
                  <div key={id} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">+{pack.teachers} staff</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">₹{pack.price}</span>
                      <span className="text-xs text-slate-400 ml-1">
                        (₹{pack.pricePerTeacher}/staff)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Comparison Table ─── */}
      <section className="pt-20 pb-20 bg-white">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Detailed Comparison</h2>
            <p className="mt-2 text-sm text-slate-500">Sab plans side-by-side</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-4 text-slate-600 font-semibold min-w-[180px]">Feature</th>
                    {planIds.map(id => (
                      <th key={id} className="p-4 text-center min-w-[130px]">
                        <span className="text-slate-900 font-bold">{PLANS[id].name}</span>
                        <br />
                        <span className="text-slate-500 text-[11px]">
                          ₹{(cycle === 'monthly'
                            ? PLANS[id].monthlyPrice
                            : PLANS[id].yearlyPrice
                          ).toLocaleString('en-IN')}/{cycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Plan Limits */}
                  <tr className="border-b border-slate-100">
                    <td colSpan={5} className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      📊 Plan Limits
                    </td>
                  </tr>
                  {comparisonRows.map(row => (
                    <tr key={row.label} className="border-b border-slate-100 hover:bg-blue-50/30">
                      <td className="p-4 text-slate-600 font-medium">{row.label}</td>
                      {planIds.map(id => (
                        <td key={id} className="p-4 text-center text-slate-900 font-semibold">
                          {row.getValue(PLANS[id])}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Modules */}
                  <tr className="border-b border-slate-100">
                    <td colSpan={5} className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      📦 Modules
                    </td>
                  </tr>
                  {Array.from(
                    new Set(planIds.flatMap(id => PLANS[id].modules))
                  ).map(mod => (
                    <tr key={mod} className="border-b border-slate-100 hover:bg-blue-50/30">
                      <td className="p-4 text-slate-600 font-medium">{getModuleLabel(mod)}</td>
                      {planIds.map(id => (
                        <td key={id} className="p-4 text-center">
                          {PLANS[id].modules.includes(mod) ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M4 8l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-lg">—</span>
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

      {/* ─── FAQ ─── */}
      <section className="pt-20 pb-20 bg-slate-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Pricing FAQ</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              {
                q: 'Credit system kya hai?',
                a: '1 Credit = ₹1. 1 SMS = 1 Credit, 1 WhatsApp = 1 Credit, 10 Emails = 1 Credit. Har plan mein free credits milte hain. Extra chahiye to credit pack kharid sakte ho.',
              },
              {
                q: 'Free credits rollover hote hain?',
                a: 'Growth plan mein 3 months, Pro mein 6 months, Enterprise mein kabhi expire nahi. Starter mein monthly reset hota hai.',
              },
              {
                q: 'Student limit puri ho jaaye to kya karein?',
                a: 'Plan upgrade karo ya extra student add-on kharid sakte ho. ₹99 mein 50 extra students, ₹179 mein 100 extra students.',
              },
              {
                q: 'Kya free trial mein credit card lagta hai?',
                a: `Nahi! ${TRIAL_CONFIG.durationDays}-day free trial bina kisi payment ke. ${TRIAL_CONFIG.freeCredits} free credits bhi milte hain trial mein.`,
              },
              {
                q: 'Monthly se yearly switch kar sakte hain?',
                a: 'Haan! Remaining days ka credit automatically adjust hota hai. Double charge nahi hota.',
              },
              {
                q: 'Cancel karne pe kya hota hai?',
                a: 'Cancel karte hi scheduled cancel ho jata hai — period end tak access milta hai. Yearly plan mein 30 days mein cancel karein to prorated refund milta hai.',
              },
            ].map(faq => (
              <div key={faq.q} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">Q.</span>{faq.q}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}