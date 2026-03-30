// FILE: src/app/(public)/pricing/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/marketing/Container'
import { PLANS, getSavings, type PlanId, type BillingCycle } from '@/lib/plans'
import { WEBSITE_PLAN_LIMITS } from '@/lib/websitePlans'
import { MODULE_REGISTRY, type ModuleKey } from '@/lib/moduleRegistry'
import { CTA } from '@/components/marketing/CTA'

/* ─── Icons ─── */
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

/* ─── Module Label Helper ─── */
function getModuleLabel(key: string): string {
  return MODULE_REGISTRY[key as ModuleKey]?.label ?? key
}

/* ─── Comparison Table Data ─── */
const comparisonRows = [
  { label: 'Students', key: 'maxStudents', format: (v: number) => v === -1 ? 'Unlimited' : v.toLocaleString('en-IN') },
  { label: 'Teachers', key: 'maxTeachers', format: (v: number) => v === -1 ? 'Unlimited' : v.toLocaleString('en-IN') },
  { label: 'SMS / Month', key: 'maxSmsPerMonth', format: (v: number) => v === -1 ? 'Unlimited' : v.toLocaleString('en-IN') },
  { label: 'Modules', key: 'modules', format: (v: string[]) => v.length.toString() },
] as const

const websiteComparisonRows = [
  { label: 'Templates', key: 'allowedTemplates', format: (v: string[]) => v.length.toString() },
  { label: 'System Pages', key: 'maxSystemPages', format: (v: number) => v >= 999 ? 'Unlimited' : v.toString() },
  { label: 'Custom Pages', key: 'maxCustomPages', format: (v: number) => v >= 999 ? 'Unlimited' : v.toString() },
  { label: 'Gallery Photos', key: 'maxGalleryPhotos', format: (v: number) => v >= 9999 ? 'Unlimited' : v.toString() },
  { label: 'Gallery Albums', key: 'galleryAlbums', format: (v: boolean) => v ? '✓' : '—' },
  { label: 'Custom Domain', key: 'customDomain', format: (v: boolean) => v ? '✓' : '—' },
  { label: 'Remove Branding', key: 'removeBranding', format: (v: boolean) => v ? '✓' : '—' },
  { label: 'SEO Settings', key: 'seoSettings', format: (v: boolean) => v ? '✓' : '—' },
  { label: 'WhatsApp Button', key: 'whatsappButton', format: (v: boolean) => v ? '✓' : '—' },
] as const

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const plans = Object.values(PLANS)
  const planIds: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']

  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-10 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-10 right-1/4 w-[400px] h-[200px] bg-purple-500/[0.05] blur-[100px] rounded-full" />
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
              Start with a 14-day free trial. No credit card required.
              Pick the plan that fits, upgrade anytime.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5l5 2v4c0 3.5-2.5 5.5-5 6.5-2.5-1-5-3-5-6.5v-4l5-2z" stroke="#10B981" strokeWidth="1.2" fill="#D1FAE5" />
                </svg>
                No hidden fees
              </span>
              <span className="flex items-center gap-1.5">✅ Cancel anytime</span>
              <span className="flex items-center gap-1.5">🎁 14-day free trial</span>
            </div>
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
                    px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${cycle === c
                      ? 'bg-white text-slate-900 shadow-soft'
                      : 'text-slate-500 hover:text-slate-700'
                    }
                  `}
                >
                  {c === 'monthly' ? 'Monthly' : (
                    <span className="flex items-center gap-2">
                      Yearly
                      <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Save 2 months
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
              const websiteLimits = WEBSITE_PLAN_LIMITS[plan.id]

              return (
                <div
                  key={plan.id}
                  className={`
                    bg-white rounded-2xl border p-6 flex flex-col relative transition-all duration-300
                    hover:shadow-medium hover:-translate-y-1
                    ${plan.highlighted
                      ? 'border-blue-300 ring-2 ring-blue-500 ring-offset-2 shadow-brand'
                      : 'border-slate-200 shadow-soft'
                    }
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
                    <span
                      className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                      style={{ background: plan.color }}
                    />
                  </div>
                  <p className="text-xs font-semibold mb-5" style={{ color: plan.color }}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
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

                  {/* Limits */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 space-y-2.5 text-[13px]">
                    <div className="flex justify-between text-slate-500">
                      <span>👤 Students</span>
                      <span className="text-slate-900 font-semibold">
                        {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>👨‍🏫 Teachers</span>
                      <span className="text-slate-900 font-semibold">
                        {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>💬 SMS/month</span>
                      <span className="text-slate-900 font-semibold">
                        {plan.maxSmsPerMonth === -1 ? 'Unlimited' : plan.maxSmsPerMonth.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>📦 Modules</span>
                      <span className="text-slate-900 font-semibold">{plan.modules.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>🎨 Templates</span>
                      <span className="text-slate-900 font-semibold">{websiteLimits.allowedTemplates.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>📸 Gallery</span>
                      <span className="text-slate-900 font-semibold">
                        {websiteLimits.maxGalleryPhotos >= 9999 ? '∞' : websiteLimits.maxGalleryPhotos}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mb-5 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                        <CheckIcon color={plan.color} />
                        <span>{f}</span>
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
                          <CrossIcon />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href="/register"
                    className={`
                      w-full py-3.5 rounded-xl text-sm font-semibold text-center transition-all duration-200 block
                      ${plan.highlighted
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-brand-lg hover:-translate-y-0.5'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    Start Free Trial →
                  </Link>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* ─── Feature Comparison Table ─── */}
      <section className="pb-20 bg-slate-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">
              Detailed Plan Comparison
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Compare all features side by side
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                {/* Header */}
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left p-4 text-slate-600 font-semibold min-w-[180px]">Feature</th>
                    {planIds.map(id => (
                      <th key={id} className="p-4 text-center min-w-[130px]">
                        <span className="text-slate-900 font-bold text-sm">{PLANS[id].name}</span>
                        <br />
                        <span className="text-slate-500 text-[11px]">
                          ₹{(cycle === 'monthly' ? PLANS[id].monthlyPrice : PLANS[id].yearlyPrice).toLocaleString('en-IN')}/{cycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* ── Plan Limits ── */}
                  <tr className="border-b border-slate-100">
                    <td colSpan={5} className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      📊 Plan Limits
                    </td>
                  </tr>
                  {comparisonRows.map(row => (
                    <tr key={row.label} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-slate-600 font-medium">{row.label}</td>
                      {planIds.map(id => {
                        const plan = PLANS[id]
                        const val = row.key === 'modules' ? plan.modules : (plan as any)[row.key]
                        return (
                          <td key={id} className="p-4 text-center text-slate-900 font-semibold">
                            {(row.format as any)(val)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* ── Website Features ── */}
                  <tr className="border-b border-slate-100">
                    <td colSpan={5} className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      🌐 Website Features
                    </td>
                  </tr>
                  {websiteComparisonRows.map(row => (
                    <tr key={row.label} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-slate-600 font-medium">{row.label}</td>
                      {planIds.map(id => {
                        const limits = WEBSITE_PLAN_LIMITS[id]
                        const val = (limits as any)[row.key]
                        const formatted = (row.format as any)(val)
                        return (
                          <td key={id} className="p-4 text-center">
                            {formatted === '✓' ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                  <path d="M4 8l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            ) : formatted === '—' ? (
                              <span className="text-slate-300 text-lg">—</span>
                            ) : (
                              <span className="text-slate-900 font-semibold">{formatted}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* ── Modules ── */}
                  <tr className="border-b border-slate-100">
                    <td colSpan={5} className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      📦 Modules Included
                    </td>
                  </tr>
                  {Array.from(new Set(planIds.flatMap(id => PLANS[id].modules))).map(mod => (
                    <tr key={mod} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-slate-600 font-medium">{getModuleLabel(mod)}</td>
                      {planIds.map(id => (
                        <td key={id} className="p-4 text-center">
                          {PLANS[id].modules.includes(mod) ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                <path d="M4 8l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* ─── Pricing FAQ ─── */}
      <section className="pb-20 bg-white">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">
              Pricing FAQ
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Common questions about our pricing
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {[
              {
                q: 'Kya free trial mein credit card lagta hai?',
                a: 'Nahi! 14-day free trial bina kisi payment ke. Trial khatam hone pe plan choose karo.',
              },
              {
                q: 'Kya monthly se yearly switch kar sakte hain?',
                a: 'Haan! Kisi bhi time yearly pe switch kar sakte ho. Remaining days ka credit automatically adjust hota hai.',
              },
              {
                q: 'Cancel karne pe kya hota hai?',
                a: 'Cancel karte hi Starter plan pe aa jaoge. Aapka data safe rehta hai. Kabhi bhi wapas upgrade kar sakte ho.',
              },
              {
                q: 'Kya payment secure hai?',
                a: 'Haan! Razorpay ke through sab payments hote hain — India ka most trusted payment gateway. PCI DSS compliant.',
              },
              {
                q: 'GST lagta hai?',
                a: 'Abhi ke liye nahi. Jab GST registration ho jayega tab invoice pe automatically dikhega.',
              },
            ].map(faq => (
              <div key={faq.q} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft hover:shadow-medium transition-all duration-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">Q.</span>
                  {faq.q}
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