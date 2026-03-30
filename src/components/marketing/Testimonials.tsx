// FILE: src/components/marketing/Testimonials.tsx

import { Container } from './Container'
import { SectionTitle } from './MiniUI'

/* 
  PRE-LAUNCH: Instead of fake testimonials, 
  show REAL value propositions as "What to Expect" cards
*/

const valueProps = [
  {
    persona: 'For Principals & Admins',
    icon: '👨‍💼',
    benefits: [
      'Complete school overview in one dashboard',
      'Fee collection tracking with auto reminders',
      'Staff & student management made paperless',
      'Generate reports in PDF & Excel instantly',
    ],
    gradient: 'from-blue-500 to-indigo-600',
    tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
  },
  {
    persona: 'For Teachers',
    icon: '👩‍🏫',
    benefits: [
      'Mark attendance in 30 seconds flat',
      'Enter exam marks — grade cards auto-generated',
      'Assign homework from your phone',
      'Zero training needed — simple UI',
    ],
    gradient: 'from-emerald-500 to-teal-600',
    tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-50',
  },
  {
    persona: 'For Parents',
    icon: '👨‍👩‍👧',
    benefits: [
      'Check attendance & results anytime',
      'Pay fees online via UPI/Card',
      'Get instant SMS & WhatsApp updates',
      'No school visits needed for basic info',
    ],
    gradient: 'from-amber-500 to-orange-600',
    tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-50',
  },
]

/* ─── What Makes Us Different ─── */
const differentiators = [
  { icon: '🇮🇳', title: 'Built for India', desc: 'Hindi/English SMS, Razorpay, Indian school structure' },
  { icon: '📱', title: 'Mobile First', desc: 'Works perfectly on ₹5,000 Android phones' },
  { icon: '⚡', title: 'Blazing Fast', desc: 'Loads in under 2 seconds, even on 2G' },
  { icon: '💰', title: 'Affordable', desc: 'Plans starting at just ₹499/month' },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding relative bg-gradient-to-b from-blue-50/80 via-white to-white">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-blue-500/[0.05] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-purple-500/[0.04] blur-[100px] rounded-full" />
      </div>

      <Container>
        <SectionTitle
          eyebrow="🎯 Why VidyaFlow"
          title="Built for every person in your school"
          subtitle="One platform, three different experiences — each designed for real daily workflows."
        />

        {/* Value Proposition Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {valueProps.map((vp) => (
            <div
              key={vp.persona}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300"
            >
              {/* Top gradient line */}
              <div className={`h-1.5 bg-gradient-to-r ${vp.gradient}`} />

              <div className="p-6">
                {/* Icon + Persona */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-xl ${vp.bgColor} flex items-center justify-center`}>
                    <span className="text-2xl">{vp.icon}</span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${vp.tagBg}`}>
                      {vp.persona}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  {vp.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2.5">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
                        <circle cx="9" cy="9" r="9" className="fill-emerald-100" />
                        <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#10B981" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm text-slate-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What Makes Us Different */}
        <div className="mt-16">
          <h3 className="text-center text-lg font-bold text-slate-900 mb-8">
            What makes VidyaFlow different?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {differentiators.map((d) => (
              <div key={d.title} className="text-center p-5 rounded-2xl bg-white border border-slate-200 shadow-soft hover:shadow-medium transition-all duration-300">
                <div className="text-3xl mb-3">{d.icon}</div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{d.title}</h4>
                <p className="text-xs text-slate-500">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Honest Bottom Message */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <span className="text-xl">🚀</span>
            <p className="text-sm text-slate-700">
              <span className="font-bold">We&apos;re launching soon!</span>{' '}
              Join our early access program and get special founding school benefits.
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}