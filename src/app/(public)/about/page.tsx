// FILE: src/app/(public)/about/page.tsx

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'
import { Target, Lightbulb, Users, MapPin, Award, Zap, Globe, Shield } from 'lucide-react'

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'Make school management effortless for every school — big or small — across India.',
    gradient: 'from-brand to-purple-500',
  },
  {
    icon: Zap,
    title: 'Built for Speed',
    desc: 'Lightweight UI that works on low-end devices. No heavy frameworks, no bloat. Loads in seconds.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Users,
    title: 'Multi-Tenant SaaS',
    desc: 'Each school gets isolated data, its own subdomain, and plan-based module access. No shared data.',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Globe,
    title: 'Made in India',
    desc: 'Designed for Indian school workflows — Hindi/English support, ₹ billing, CBSE/State board compatible.',
    gradient: 'from-sky-400 to-blue-500',
  },
]

const milestones = [
  { year: '2024 Q1', text: 'Platform development started — core modules built' },
  { year: '2024 Q3', text: 'Multi-tenant architecture with plan-based access control' },
  { year: '2025 Q1', text: 'Public launch with 4 plans (Starter to Enterprise)' },
  { year: '2025 Q2', text: 'PWA support, parent/student portals, website builder' },
  { year: '2025 Q3', text: 'Razorpay integration, SMS gateway, 22+ modules' },
]

const team = [
  { role: 'Full-Stack Development', count: 3 },
  { role: 'UI/UX Design', count: 1 },
  { role: 'School Operations', count: 2 },
  { role: 'Customer Support', count: 2 },
]

export default function AboutPage() {
  const storyRef = useReveal<HTMLDivElement>()
  const valuesRef = useRevealGroup()
  const timelineRef = useReveal<HTMLDivElement>()
  const teamRef = useReveal<HTMLDivElement>()

  return (
    <>
      {/* ─── Page Hero ─── */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-brand/[0.05] blur-[120px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-20" />
        </div>

        <Container>
          <div ref={storyRef} className="reveal max-w-3xl mx-auto text-center">
            <div className="badge-brand mx-auto mb-5">✦ About VidyaFlow</div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Built by educators,{' '}
              <span className="gradient-text">for educators</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
              VidyaFlow is a product of{' '}
              <a
                href="https://shivshakticomputer.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline font-semibold"
              >
                Shivshakti Computer Academy
              </a>
              , Ambikapur. We understand the daily challenges schools face — and we built a platform to solve them.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Story Section ─── */}
      <section className="pb-16">
        <Container>
          <div ref={storyRef} className="reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left: Story */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Our Story</h2>
                <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                  <p>
                    We started as a computer training academy in Ambikapur, Chhattisgarh in 2010. Over 15 years,
                    we trained thousands of students and worked closely with local schools. We saw firsthand how
                    schools struggled with paper registers, manual fee tracking, and disconnected parent communication.
                  </p>
                  <p>
                    Most existing school software was either too expensive (₹50,000+ setup), too complex
                    (requiring dedicated IT staff), or not built for Indian school workflows (no Hindi,
                    no ₹ billing, no CBSE patterns).
                  </p>
                  <p>
                    So in 2024, we built <strong className="text-white">VidyaFlow</strong> — a modern,
                    lightweight, cloud-based school management platform that any school can start using
                    in minutes. No installation, no hardware, no long contracts. Just register, log in,
                    and start managing your school.
                  </p>
                  <p>
                    Today, our platform supports complete school operations: student management, attendance,
                    fee collection, exam results, website builder, parent portals, and 20+ modules — all
                    accessible based on your chosen plan.
                  </p>
                </div>
              </div>

              {/* Right: Timeline */}
              <div ref={timelineRef} className="reveal">
                <h3 className="text-lg font-bold text-white mb-6">Journey So Far</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10" />

                  <div className="space-y-6">
                    {milestones.map((m, i) => (
                      <div key={i} className="relative pl-10">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-brand/20 border-2 border-brand/40 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-brand" />
                        </div>

                        {/* Content */}
                        <div>
                          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                            {m.year}
                          </span>
                          <p className="mt-1 text-sm text-slate-300">{m.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Values Section ─── */}
      <section className="pb-16 relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-emerald-500/[0.03] blur-[120px] rounded-full" />
        </div>

        <Container>
          <div ref={valuesRef} className="reveal">
            <SectionTitle
              eyebrow="✦ What Drives Us"
              title="Values that shape our product"
              subtitle="We believe in building software that is fast, simple, and genuinely useful for schools."
              center
            />

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 reveal-stagger">
              {values.map(v => (
                <div
                  key={v.title}
                  className="card-dark p-5 flex flex-col group hover:border-white/10 transition-colors"
                >
                  {/* Icon with gradient */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${v.gradient} bg-opacity-15 group-hover:bg-opacity-25 transition-all`}
                  >
                    <v.icon size={20} className="text-white/80" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-white">{v.title}</h3>
                  <p className="mt-2 text-[13px] text-slate-400 leading-relaxed flex-1">
                    {v.desc}
                  </p>

                  {/* Bottom gradient line on hover */}
                  <div className="mt-4 h-[2px] rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${v.gradient} w-0 group-hover:w-full transition-all duration-500`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Team Section ─── */}
      <section className="pb-16">
        <Container>
          <div ref={teamRef} className="reveal">
            <div className="card-dark p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Text */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-4">The Team</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    We are a small, focused team of developers and educators based in Chhattisgarh, India.
                    We believe in building products that are fast, reliable, and genuinely useful — not bloated
                    with features nobody uses.
                  </p>
                  <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                    Every feature we build is tested in real schools before release. We listen to feedback
                    from our school partners and continuously improve the platform.
                  </p>
                </div>

                {/* Right: Skills */}
                <div className="lg:w-1/3">
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                    Team Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {team.map(t => (
                      <div
                        key={t.role}
                        className="
                          inline-flex items-center gap-2 px-3 py-2 rounded-lg
                          bg-white/5 border border-white/10 text-sm
                        "
                      >
                        <span className="w-2 h-2 rounded-full bg-brand" />
                        <span className="text-slate-300">{t.role}</span>
                        <span className="text-xs text-slate-500">({t.count})</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-brand/10 border border-brand/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={16} className="text-brand-400" />
                      <span className="text-sm font-semibold text-white">Self-Funded</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      We are bootstrapped and profitable. No investors, no pressure to monetize aggressively.
                      We build what schools need.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── CTA ─── */}
      <CTA />
    </>
  )
}