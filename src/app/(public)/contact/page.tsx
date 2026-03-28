// FILE: src/app/(public)/contact/page.tsx

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

const contactMethods = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: '+91-XXXXXXXXXX',
    desc: 'Fastest response. Send us a message anytime.',
    action: 'https://wa.me/91XXXXXXXXXX',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Phone,
    title: 'Phone Call',
    value: '+91-XXXXXXXXXX',
    desc: 'Call us during business hours (10 AM - 6 PM IST).',
    action: 'tel:+91XXXXXXXXXX',
    color: 'from-brand to-purple-600',
    bg: 'bg-brand/10',
    border: 'border-brand/20',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'support@vidyaflow.in',
    desc: 'For detailed queries, send us an email.',
    action: 'mailto:support@vidyaflow.in',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
]

const officeInfo = {
  address: 'Shivshakti Computer Academy, Main Road, Ambikapur, Chhattisgarh - 497001',
  hours: 'Monday - Saturday: 10:00 AM - 6:00 PM IST',
  response: 'We typically respond within 2-4 hours during business days.',
}

export default function ContactPage() {
  const headerRef = useReveal<HTMLDivElement>()
  const cardsRef = useRevealGroup()
  const officeRef = useReveal<HTMLDivElement>()

  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-brand/[0.05] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-20" />
        </div>

        <Container>
          <div ref={headerRef} className="reveal max-w-2xl mx-auto text-center">
            <div className="badge-brand mx-auto mb-5">✦ Get in Touch</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Talk to us for demo &{' '}
              <span className="gradient-text">onboarding</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
              We help you onboard quickly with training and setup. Reach out via WhatsApp, call, or email.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Contact Methods ─── */}
      <section className="pb-12">
        <Container>
          <div ref={cardsRef} className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 reveal-stagger">
              {contactMethods.map(method => (
                <a
                  key={method.title}
                  href={method.action}
                  target={method.action.startsWith('http') ? '_blank' : undefined}
                  rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="
                    reveal card-dark p-5 flex flex-col items-center text-center
                    hover:border-white/10 transition-all duration-300 group
                  "
                >
                  {/* Icon */}
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center mb-4
                      bg-gradient-to-br ${method.color} bg-opacity-15 group-hover:bg-opacity-25
                      border ${method.border}
                    `}
                  >
                    <method.icon size={22} className="text-white/80" />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1">{method.title}</h3>

                  {/* Value */}
                  <p className="text-sm font-semibold text-brand-400 mb-2">{method.value}</p>

                  {/* Description */}
                  <p className="text-xs text-slate-500 leading-relaxed">{method.desc}</p>

                  {/* Hover arrow */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-brand-400">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Office & Info ─── */}
      <section className="pb-16">
        <Container>
          <div ref={officeRef} className="reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Office Card */}
              <div className="card-dark p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <MapPin size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Office Address</h3>
                    <p className="text-xs text-slate-500">Visit or send mail</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="text-slate-300 leading-relaxed">{officeInfo.address}</p>

                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-300">{officeInfo.hours}</p>
                      <p className="text-xs text-slate-500 mt-1">{officeInfo.response}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick CTA Card */}
              <div className="card-dark p-6 relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-purple-500/10" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Ready to start?</h3>
                      <p className="text-xs text-slate-400">Begin your 14-day free trial</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-6">
                    No credit card required. Get full access to all features for 14 days.
                  </p>

                  <a
                    href="/register"
                    className="
                      inline-flex items-center justify-center gap-2
                      w-full py-3 rounded-xl
                      bg-brand text-white font-semibold
                      hover:bg-brand-dark transition-all
                      shadow-lg shadow-brand/20 hover:shadow-brand/30
                    "
                  >
                    Start Free Trial
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}