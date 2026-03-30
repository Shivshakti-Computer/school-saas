// FILE: src/app/(public)/security/page.tsx

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ─── Security Features Data ─── */
const securityFeatures = [
  {
    icon: '🔐',
    title: 'Encrypted Connections',
    desc: 'All data transmitted between your browser and our servers is encrypted using TLS/HTTPS. No data ever travels in plain text.',
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    icon: '🛡️',
    title: 'Secure Authentication',
    desc: 'Passwords hashed with bcrypt — never stored as plain text. JWT sessions auto-refresh every 30 seconds to detect subscription changes in real-time.',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    icon: '👥',
    title: 'Role-Based Access',
    desc: 'Four roles: Admin, Teacher, Student, Parent. Each role accesses only its permitted routes and data. Cross-role access is blocked at the middleware level.',
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
  },
  {
    icon: '🏗️',
    title: 'Tenant Data Isolation',
    desc: "Each school's data is isolated using tenant IDs at the database query level. School A cannot access School B's data — ever.",
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    icon: '📦',
    title: 'Plan-Based Module Lock',
    desc: 'Modules are locked based on subscription plan. Even direct URL access is blocked by middleware — no workarounds possible.',
    gradient: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
  },
  {
    icon: '⏱️',
    title: 'Subscription Enforcement',
    desc: 'Expired subscription = immediate block on all features. Both UI and API return 403. Only the subscription renewal page remains accessible.',
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  {
    icon: '☁️',
    title: 'Cloud Infrastructure',
    desc: 'Hosted on modern cloud with MongoDB Atlas. Data encrypted at rest, automatic backups, uptime monitoring and geographic redundancy.',
    gradient: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
  {
    icon: '🧪',
    title: 'Trial Restrictions',
    desc: 'Trial accounts get Starter-level access only. Advanced modules like Fees, Exams, Library, HR remain locked until a paid plan is activated.',
    gradient: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-700',
  },
]

/* ─── Architecture Layers ─── */
const architectureLayers = [
  {
    number: '01',
    label: 'Browser / Client',
    desc: 'Next.js SSR — no sensitive data exposed to client. JWT tokens stored in HTTP-only cookies. All pages server-rendered for security.',
    icon: '🌐',
    color: 'bg-blue-50 border-blue-200',
    numberColor: 'text-blue-700 bg-blue-100 border-blue-200',
  },
  {
    number: '02',
    label: 'Edge Middleware',
    desc: 'Every request validated — checks authentication, user role, subscription status, plan tier, and module access before any page loads.',
    icon: '⚙️',
    color: 'bg-emerald-50 border-emerald-200',
    numberColor: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  },
  {
    number: '03',
    label: 'API Layer',
    desc: 'All API endpoints double-check authorization. Even if middleware is bypassed, API returns 403. Double protection at every level.',
    icon: '🔌',
    color: 'bg-amber-50 border-amber-200',
    numberColor: 'text-amber-700 bg-amber-100 border-amber-200',
  },
  {
    number: '04',
    label: 'Database',
    desc: 'MongoDB Atlas with full tenant isolation. Every query is scoped to the authenticated school\'s tenant ID. Encryption at rest enabled.',
    icon: '🗄️',
    color: 'bg-purple-50 border-purple-200',
    numberColor: 'text-purple-700 bg-purple-100 border-purple-200',
  },
]

/* ─── Data Practices ─── */
const dataHandling = [
  { icon: '🚫', text: 'We do not sell, share, or trade school data with any third party' },
  { icon: '👁️', text: "School data is only accessible by the school's own admin and authorized staff" },
  { icon: '🔑', text: 'Superadmin access is limited to platform management — never to individual school data' },
  { icon: '💳', text: 'Payment information is handled by Razorpay — we never store card/UPI details' },
  { icon: '📤', text: 'You can request data export or deletion by contacting our support team' },
  { icon: '🗓️', text: 'We retain data for the duration of your subscription + 90 days grace period' },
  { icon: '📧', text: 'We send transactional emails only — no marketing spam without your consent' },
]

export default function SecurityPage() {
  const headerRef = useReveal<HTMLDivElement>()
  const cardsRef = useRevealGroup()
  const archRef = useReveal<HTMLDivElement>()
  const dataRef = useReveal<HTMLDivElement>()

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative pt-24 pb-14 overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-blue-500/[0.05] blur-[100px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <Container>
          <div ref={headerRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="text-lg">🔒</span>
              <span className="text-sm font-semibold text-slate-700">Security & Data Protection</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your school data is{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                safe with us
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              We take data security seriously. Here&apos;s how we protect your information at every level —
              from browser to database.
            </p>

            {/* Security quick stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                { icon: '🔐', label: 'HTTPS Encrypted' },
                { icon: '🏗️', label: 'Multi-Tenant Isolated' },
                { icon: '👥', label: '4 Role Levels' },
                { icon: '☁️', label: 'Cloud Hosted' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-soft">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Security Features Grid ─── */}
      <section className="py-16 bg-white">
        <Container>
          <SectionTitle
            eyebrow="🛡️ Protection Layers"
            title="8 layers of security protecting your data"
            subtitle="Every aspect of the platform is built with security as the foundation — not as an afterthought."
            center
          />

          <div ref={cardsRef} className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger">
            {securityFeatures.map(feature => (
              <div
                key={feature.title}
                className={`reveal group bg-white rounded-2xl border ${feature.borderColor} p-6 flex flex-col shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed flex-1">{feature.desc}</p>

                {/* Bottom gradient */}
                <div className="mt-5 h-[2px] rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${feature.gradient} w-0 group-hover:w-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Architecture ─── */}
      <section className="py-16 bg-slate-50">
        <Container>
          <div ref={archRef} className="reveal">
            <SectionTitle
              eyebrow="⚙️ Architecture"
              title="Security at every layer"
              subtitle="Four independent layers of protection ensure your school data never leaks, even if one layer fails."
              center
            />

            <div className="mt-12 max-w-4xl mx-auto">
              {/* Architecture Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {architectureLayers.map((layer, i) => (
                  <div key={layer.label} className="relative">
                    {/* Arrow connector */}
                    {i < architectureLayers.length - 1 && (
                      <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-300">
                          <path d="M5 12h14M15 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    <div className={`bg-white rounded-2xl border ${layer.color} p-5 h-full shadow-soft`}>
                      {/* Number + Icon */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${layer.numberColor}`}>
                          {layer.number}
                        </span>
                        <span className="text-xl">{layer.icon}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">{layer.label}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{layer.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Architecture visual note */}
              <div className="mt-8 p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <p className="text-sm text-blue-800">
                  <strong>Defense in Depth:</strong> Each layer independently validates the request.
                  Bypassing one layer does not grant access — all layers must pass.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Data Practices ─── */}
      <section className="py-16 bg-white">
        <Container>
          <div ref={dataRef} className="reveal">
            <div className="max-w-3xl mx-auto">
              <SectionTitle
                eyebrow="📋 Data Practices"
                title="How we handle your school data"
                subtitle="Clear, honest commitments about what we do and don't do with your data."
                center
              />

              <div className="mt-10 bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
                {dataHandling.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-5 ${i < dataHandling.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Quick Compliance Note ─── */}
      <section className="py-10 bg-slate-50">
        <Container>
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: '🇮🇳',
                title: 'India Compliant',
                desc: 'Data stored within compliant cloud infrastructure. Governed by Indian law.',
              },
              {
                icon: '💳',
                title: 'PCI Compliant Payments',
                desc: 'Payments via Razorpay — fully PCI DSS compliant. We never touch card data.',
              },
              {
                icon: '🔄',
                title: 'Regular Audits',
                desc: 'Security practices reviewed regularly. Updates deployed as new threats emerge.',
              },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-soft">
                <span className="text-3xl">{item.icon}</span>
                <h4 className="text-sm font-bold text-slate-900 mt-3 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}