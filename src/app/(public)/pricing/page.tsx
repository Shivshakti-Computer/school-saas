import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { PLANS } from '@/lib/plans'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata = {
  title: 'Pricing',
  description: 'Simple, affordable pricing plans for VidyaFlow school management platform.',
}

export default function PricingPage() {
    const plans = Object.values(PLANS)

    return (
        <div className="py-12">
            <Container>
                <SectionTitle
                    eyebrow="Pricing"
                    title="Simple plans that scale with your school"
                    subtitle="Pick the plan that matches your student count and modules. Upgrade anytime."
                />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {plans.map(p => (
                        <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                            <h3 className="text-lg font-extrabold text-slate-900">{p.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">{p.description}</p>

                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold">₹{p.monthlyPrice.toLocaleString('en-IN')}</span>
                                <span className="text-sm text-slate-500">/month</span>
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                                Yearly: ₹{p.yearlyPrice.toLocaleString('en-IN')} / year
                            </div>

                            <div className="mt-4 text-xs text-slate-500">
                                Students: {p.maxStudents === -1 ? 'Unlimited' : p.maxStudents} · Teachers: {p.maxTeachers === -1 ? 'Unlimited' : p.maxTeachers}
                            </div>

                            <div className="mt-5 space-y-2">
                                {p.features.map(f => (
                                    <div key={f} className="flex items-start gap-2 text-sm text-slate-700">
                                        <Check size={16} className="text-emerald-600 mt-0.5" />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>

                            {p.notIncluded?.length ? (
                                <div className="mt-4 text-xs text-slate-500">
                                    Not included: {p.notIncluded.join(', ')}
                                </div>
                            ) : null}

                            <Link
                                href="/register"
                                className="mt-6 inline-flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                            >
                                Start trial
                            </Link>
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}