// FILE: src/app/(public)/contact/page.tsx

'use client'

import { Container } from '@/components/marketing/Container'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

const contactMethods = [
  {
    icon: '💬',
    title: 'WhatsApp',
    value: '+91-9009087883',
    desc: 'Fastest response. Send us a message anytime.',
    action: 'https://wa.me/919009087883',
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    icon: '📞',
    title: 'Phone Call',
    value: '+91-7477036832',
    desc: 'Call us during business hours (10 AM - 6 PM IST).',
    action: 'tel:+917477036832',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    icon: '📧',
    title: 'Email',
    value: 'support@skolify.in',
    desc: 'For detailed queries, send us an email.',
    action: 'mailto:support@skolify.in',
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
  },
]

const officeInfo = {
  address: 'Shivshakti Computer Academy, Main Road, Ambikapur, Chhattisgarh - 497001',
  hours: 'Monday - Saturday: 10:00 AM - 6:00 PM IST',
  response: 'We typically respond within 2-4 hours during business days.',
}

const quickFaqs = [
  { q: 'How fast do you respond?', a: 'WhatsApp messages are answered within 1-2 hours during business days.' },
  { q: 'Can you do a live demo?', a: 'Yes! We can do a screen-sharing demo via Google Meet or WhatsApp video call.' },
  { q: 'Do you help with setup?', a: 'Absolutely. We personally help every school with initial setup and data entry.' },
]

export default function ContactPage() {
  const headerRef = useReveal<HTMLDivElement>()
  const cardsRef = useRevealGroup()
  const officeRef = useReveal<HTMLDivElement>()

  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-14 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[200px] bg-purple-500/[0.05] blur-[100px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <Container>
          <div ref={headerRef} className="reveal max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="text-lg">👋</span>
              <span className="text-sm font-semibold text-slate-700">Get in Touch</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Talk to us for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                demo & onboarding
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              We help you onboard quickly with personal training and setup.
              Reach out via WhatsApp, call, or email — we respond fast.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Contact Methods ─── */}
      <section className="pb-12 bg-white">
        <Container>
          <div ref={cardsRef} className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal-stagger">
              {contactMethods.map(method => (
                <a
                  key={method.title}
                  href={method.action}
                  target={method.action.startsWith('http') ? '_blank' : undefined}
                  rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`
                    reveal bg-white rounded-2xl border ${method.borderColor} p-6 flex flex-col items-center text-center
                    shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300 group
                  `}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${method.bgColor} border ${method.borderColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{method.icon}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{method.title}</h3>

                  {/* Value */}
                  <p className={`text-sm font-semibold ${method.textColor} mb-2`}>{method.value}</p>

                  {/* Description */}
                  <p className="text-xs text-slate-500 leading-relaxed">{method.desc}</p>

                  {/* Hover arrow */}
                  <div className="mt-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-blue-600">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Bottom gradient on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl">
                    <div className={`h-full bg-gradient-to-r ${method.gradient} w-0 group-hover:w-full transition-all duration-500`} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Office & Info ─── */}
      <section className="pb-16 bg-white">
        <Container>
          <div ref={officeRef} className="reveal max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Office Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-soft">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Office Address</h3>
                    <p className="text-xs text-slate-500">Visit or send mail</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="text-slate-700 leading-relaxed">{officeInfo.address}</p>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg flex-shrink-0">🕐</span>
                    <div>
                      <p className="text-slate-700 font-medium">{officeInfo.hours}</p>
                      <p className="text-xs text-slate-500 mt-1">{officeInfo.response}</p>
                    </div>
                  </div>

                  {/* Map placeholder */}
                  <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl">🗺️</span>
                      <p className="text-xs text-slate-400 mt-1">Ambikapur, Chhattisgarh</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">

                {/* Quick Start Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center">
                      <span className="text-xl">🚀</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Ready to start?</h3>
                      <p className="text-xs text-slate-500">Begin your free trial</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-5">
                    No credit card required. Get full access to all features for 60 days. We&apos;ll personally help you set up.
                  </p>

                  <a
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get Early Access — Free
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                {/* Quick FAQs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">❓</span>
                    Quick Questions
                  </h3>
                  <div className="space-y-4">
                    {quickFaqs.map(faq => (
                      <div key={faq.q} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-slate-900 mb-1">{faq.q}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Prefer WhatsApp Banner ─── */}
      <section className="pb-16 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Prefer WhatsApp?</p>
                  <p className="text-sm text-slate-600">Most schools reach us on WhatsApp. It&apos;s the fastest way!</p>
                </div>
              </div>
              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}