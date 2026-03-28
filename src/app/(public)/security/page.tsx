// FILE: src/app/(public)/security/page.tsx

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

const securityFeatures = [
  {
    title: 'Encrypted Connections',
    desc: 'All data transmitted between your browser and our servers is encrypted using TLS/HTTPS. No data travels in plain text.',
    gradient: 'from-emerald-400 to-teal-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Secure Authentication',
    desc: 'Passwords hashed with bcrypt. JWT sessions with auto-refresh every 30 seconds to detect plan/subscription changes in real-time.',
    gradient: 'from-brand to-purple-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Access',
    desc: 'Four roles: Admin, Teacher, Student, Parent. Each can only access its own routes and data. Cross-role access blocked at middleware level.',
    gradient: 'from-sky-400 to-blue-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  },
  {
    title: 'Tenant Data Isolation',
    desc: 'Each school\'s data is isolated using tenant IDs. School A cannot access School B\'s data — enforced at database query level.',
    gradient: 'from-amber-400 to-orange-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" />
      </svg>
    ),
  },
  {
    title: 'Plan-Based Module Lock',
    desc: 'Modules locked based on plan. Even if URL is manually typed, middleware blocks access to modules not in current plan.',
    gradient: 'from-rose-400 to-pink-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Subscription Enforcement',
    desc: 'Expired subscription = immediate block. Both UI pages and API endpoints return 403. Only subscription page remains accessible.',
    gradient: 'from-violet-400 to-purple-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: 'Cloud Infrastructure',
    desc: 'Hosted on modern cloud with auto backups, monitoring, and uptime guarantees. MongoDB Atlas with encryption at rest.',
    gradient: 'from-cyan-400 to-teal-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" />
      </svg>
    ),
  },
  {
    title: 'Trial Restrictions',
    desc: 'Trial accounts get Starter-level access only. Advanced features like Fees, Exams, Library, HR are locked until paid plan is activated.',
    gradient: 'from-slate-400 to-slate-500',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
    ),
  },
]

const architectureLayers = [
  {
    label: 'Frontend',
    desc: 'Next.js with SSR. No sensitive data exposed to client. JWT stored in HTTP-only cookies.',
    color: 'from-brand to-purple-500',
  },
  {
    label: 'Middleware',
    desc: 'Edge middleware validates every request — checks auth, role, plan, subscription status & module access.',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    label: 'Database',
    desc: 'MongoDB Atlas with tenant-level isolation. Every query scoped to logged-in school. Encryption at rest.',
    color: 'from-amber-400 to-orange-500',
  },
]

const dataHandling = [
  'We do not sell, share, or trade school data with any third party.',
  'School data is only accessible by the school\'s own admin and authorized staff.',
  'Superadmin access is limited to platform management — not individual school data.',
  'Payment information is handled by Razorpay — we do not store card/UPI details.',
  'You can request data export or deletion by contacting support.',
  'We retain data for the duration of your subscription + 90 days grace period.',
]

export default function SecurityPage() {
  const headerRef = useReveal<HTMLDivElement>()
  const cardsRef = useRevealGroup()
  const archRef = useReveal<HTMLDivElement>()
  const dataRef = useReveal<HTMLDivElement>()

  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.04] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-20" />
        </div>

        <Container>
          <div ref={headerRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="badge-brand mx-auto mb-5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Security & Data Protection
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Your school data is{' '}
              <span className="gradient-text">safe with us</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
              We take data security seriously. Here&apos;s how we protect your information at every level —
              from browser to database.
            </p>
          </div>
        </Container>
      </section>

      {/* Security Features Grid */}
      <section className="pb-16">
        <Container>
          <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 reveal-stagger">
            {securityFeatures.map(f => (
              <div key={f.title} className="reveal group card-dark p-5 flex flex-col">
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center mb-4
                    bg-gradient-to-br ${f.gradient} bg-opacity-15
                    text-white/80 group-hover:text-white transition-colors
                  `}
                  style={{ background: undefined }}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${f.gradient}`} style={{ opacity: 0.15, position: 'absolute' }} />
                  <div className="relative">{f.icon}</div>
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed flex-1">{f.desc}</p>

                <div className="mt-4 h-[2px] rounded-full bg-white/[0.03] overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${f.gradient} w-0 group-hover:w-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Architecture */}
      <section className="pb-16">
        <Container>
          <div ref={archRef} className="reveal">
            <SectionTitle
              eyebrow="✦ Architecture"
              title="Security at every layer"
              subtitle="Three layers of protection ensure your data never leaks."
              center
            />

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {architectureLayers.map((layer, i) => (
                <div key={layer.label} className="card-dark p-5 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${layer.color}`} />
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <span className="text-xs font-mono text-brand-400 bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
                      Layer {i + 1}
                    </span>
                    <span className="text-sm font-bold text-white">{layer.label}</span>
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{layer.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Data Handling */}
      <section className="pb-16">
        <Container>
          <div ref={dataRef} className="reveal">
            <div className="card-dark p-6 sm:p-8">
              <h2 className="text-lg font-bold text-white mb-6">Data Handling Practices</h2>
              <div className="space-y-3">
                {dataHandling.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-sm text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <CTA />
    </>
  )
}