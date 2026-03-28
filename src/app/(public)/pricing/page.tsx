// FILE: src/app/(public)/pricing/page.tsx
// Full pricing page with monthly/yearly toggle & detailed comparison

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
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="8" cy="8" r="8" fill={`${color}20`} />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 opacity-30">
      <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.04)" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
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
      <section className="relative pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-brand/[0.05] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <Container>
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="badge-brand mx-auto mb-5">✦ Transparent Pricing</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Simple plans,{' '}
              <span className="gradient-text">honest pricing</span>
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              Start with a 14-day free trial. No credit card required.
              Pick the plan that fits, upgrade anytime.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Billing Toggle ─── */}
      <section className="pb-6">
        <Container>
          <div className="flex justify-center">
            <div className="inline-flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`
                    px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                    ${cycle === c
                      ? 'bg-white/[0.08] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                    }
                  `}
                >
                  {c === 'monthly' ? 'Monthly' : (
                    <span>
                      Yearly{' '}
                      <span className="text-[11px] text-emerald-400 font-bold">2 months free</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Plan Cards ─── */}
      <section className="pb-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map(plan => {
              const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
              const saved = getSavings(plan.id)
              const websiteLimits = WEBSITE_PLAN_LIMITS[plan.id]

              return (
                <div
                  key={plan.id}
                  className={`
                    card-dark p-5 flex flex-col relative
                    ${plan.highlighted ? 'ring-1 ring-brand/30' : ''}
                  `}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-brand px-3 py-0.5 rounded-full whitespace-nowrap">
                      🔥 Most Popular
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <span className="w-3 h-3 rounded-full" style={{ background: plan.color }} />
                  </div>
                  <p className="text-xs font-medium mb-4" style={{ color: plan.color }}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-extrabold text-white">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-slate-500">
                      /{cycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>

                  {cycle === 'yearly' && saved > 0 && (
                    <p className="text-[11px] text-emerald-400 mb-3">
                      Save ₹{saved.toLocaleString('en-IN')}/year
                    </p>
                  )}
                  {cycle === 'monthly' && (
                    <p className="text-[11px] text-slate-600 mb-3">
                      or ₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr (save ₹{saved.toLocaleString('en-IN')})
                    </p>
                  )}

                  <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                    {plan.description}
                  </p>

                  {/* Limits */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 mb-4 space-y-2 text-[12px]">
                    <div className="flex justify-between text-slate-500">
                      <span>👤 Students</span>
                      <span className="text-white font-semibold">
                        {plan.maxStudents === -1 ? 'Unlimited' : plan.maxStudents}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>👨‍🏫 Teachers</span>
                      <span className="text-white font-semibold">
                        {plan.maxTeachers === -1 ? 'Unlimited' : plan.maxTeachers}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>💬 SMS/month</span>
                      <span className="text-white font-semibold">
                        {plan.maxSmsPerMonth === -1 ? 'Unlimited' : plan.maxSmsPerMonth.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>📦 Modules</span>
                      <span className="text-white font-semibold">{plan.modules.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>🎨 Templates</span>
                      <span className="text-white font-semibold">{websiteLimits.allowedTemplates.length}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>📸 Gallery Photos</span>
                      <span className="text-white font-semibold">
                        {websiteLimits.maxGalleryPhotos >= 9999 ? '∞' : websiteLimits.maxGalleryPhotos}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2 text-[12px] text-slate-400">
                        <CheckIcon color={plan.color} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Not included */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="mb-5 space-y-1.5 border-t border-white/[0.04] pt-3">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">
                        Not included
                      </p>
                      {plan.notIncluded.map(f => (
                        <div key={f} className="flex items-start gap-2 text-[11px] text-slate-600">
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
                      w-full py-3 rounded-xl text-sm font-semibold text-center transition-all block
                      ${plan.highlighted
                        ? 'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20'
                        : 'bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08]'
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
      <section className="pb-16">
        <Container>
          <h2 className="text-xl font-bold text-white text-center mb-8">
            Detailed Plan Comparison
          </h2>

          <div className="card-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                {/* Header */}
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 text-slate-500 font-semibold min-w-[180px]">Feature</th>
                    {planIds.map(id => (
                      <th key={id} className="p-4 text-center min-w-[120px]">
                        <span className="text-white font-bold text-sm">{PLANS[id].name}</span>
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
                  <tr className="border-b border-white/[0.04]">
                    <td colSpan={5} className="px-4 pt-5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Plan Limits
                    </td>
                  </tr>
                  {comparisonRows.map(row => (
                    <tr key={row.label} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="p-3.5 text-slate-400">{row.label}</td>
                      {planIds.map(id => {
                        const plan = PLANS[id]
                        const val = row.key === 'modules' ? plan.modules : (plan as any)[row.key]
                        return (
                          <td key={id} className="p-3.5 text-center text-white font-semibold">
                            {(row.format as any)(val)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* ── Website Features ── */}
                  <tr className="border-b border-white/[0.04]">
                    <td colSpan={5} className="px-4 pt-5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Website Features
                    </td>
                  </tr>
                  {websiteComparisonRows.map(row => (
                    <tr key={row.label} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="p-3.5 text-slate-400">{row.label}</td>
                      {planIds.map(id => {
                        const limits = WEBSITE_PLAN_LIMITS[id]
                        const val = (limits as any)[row.key]
                        const formatted = (row.format as any)(val)
                        return (
                          <td key={id} className="p-3.5 text-center">
                            {formatted === '✓' ? (
                              <span className="text-emerald-400 font-bold">✓</span>
                            ) : formatted === '—' ? (
                              <span className="text-slate-600">—</span>
                            ) : (
                              <span className="text-white font-semibold">{formatted}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  {/* ── Modules ── */}
                  <tr className="border-b border-white/[0.04]">
                    <td colSpan={5} className="px-4 pt-5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Modules Included
                    </td>
                  </tr>
                  {/* Get all unique modules */}
                  {Array.from(new Set(planIds.flatMap(id => PLANS[id].modules))).map(mod => (
                    <tr key={mod} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="p-3.5 text-slate-400">{getModuleLabel(mod)}</td>
                      {planIds.map(id => (
                        <td key={id} className="p-3.5 text-center">
                          {PLANS[id].modules.includes(mod) ? (
                            <span className="text-emerald-400 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-700">—</span>
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

      {/* ─── FAQ Quick ─── */}
      <section className="pb-16">
        <Container>
          <h2 className="text-xl font-bold text-white text-center mb-8">
            Pricing FAQ
          </h2>
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
              <div key={faq.q} className="card-dark p-5">
                <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}