import Link from 'next/link'
import { Container } from './Container'
import { SectionTitle, Pill } from './MiniUI'
import { PLANS, type PlanId } from '@/lib/plans'
import { Check } from 'lucide-react'

export function PricingSection() {
  const plans = Object.values(PLANS)

  return (
    <div className="py-14 bg-slate-50 border-y border-slate-100">
      <Container>
        <div className="flex items-end justify-between gap-6 flex-col md:flex-row">
          <SectionTitle
            eyebrow="Pricing"
            title="Affordable pricing with clear plan limits"
            subtitle="Start small. Upgrade when you grow. Plan-based module access keeps things simple and secure."
          />
          <Link href="/pricing" className="text-sm font-semibold text-indigo-600 hover:underline">
            Full pricing details →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-shadow ${p.highlighted ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
              {p.highlighted && <Pill>Most popular</Pill>}
              <div className="mt-2 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">{p.name}</h3>
                <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
              </div>
              <p className="text-sm text-slate-600 mt-1">{p.tagline}</p>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">₹{p.monthlyPrice.toLocaleString('en-IN')}</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Up to {p.maxStudents === -1 ? 'Unlimited' : p.maxStudents} students ·
                {` `}Up to {p.maxTeachers === -1 ? 'Unlimited' : p.maxTeachers} teachers
              </p>

              <div className="mt-4 space-y-2">
                {p.features.slice(0, 6).map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check size={16} className="text-emerald-600 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className={`mt-5 inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  p.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}