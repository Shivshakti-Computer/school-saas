// FILE: src/app/(public)/about/page.tsx

'use client'

import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */

const heroStats = [
  { value: '22+', label: 'Modules', icon: '📦' },
  { value: '4', label: 'User Roles', icon: '👥' },
  { value: '₹499', label: 'Starting/mo', icon: '💰' },
  { value: '2 min', label: 'Setup Time', icon: '⚡' },
]

const values = [
  {
    icon: '🎯',
    title: 'Our Mission',
    desc: 'Make school management effortless for every school — big or small — across India. No complex setup, no expensive hardware.',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
  {
    icon: '⚡',
    title: 'Speed First',
    desc: 'Every screen loads in under 2 seconds. Works on ₹5,000 Android phones. Optimized for 2G/3G connections.',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  {
    icon: '🔒',
    title: 'Data Security',
    desc: 'Each school gets completely isolated data. HTTPS encryption, role-based access, bcrypt password hashing. No shared data ever.',
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  {
    icon: '🇮🇳',
    title: 'Made for India',
    desc: 'Hindi/English SMS, Razorpay payments in ₹, CBSE/ICSE/State board structure, Indian date formats, GST-ready invoicing.',
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100',
  },
  {
    icon: '📱',
    title: 'Mobile First',
    desc: 'Installable PWA app. Teachers mark attendance from phone. Parents check results on the go. No app store needed.',
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-100',
  },
  {
    icon: '💡',
    title: 'Simple by Design',
    desc: 'No training needed. If you can use WhatsApp, you can use Skolify. Clean, intuitive interface for everyone.',
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-100',
  },
]

const milestones = [
  { year: '2024 Q1', text: 'Platform development started — core architecture designed', icon: '🚀', dotColor: 'bg-blue-500' },
  { year: '2024 Q3', text: 'Multi-tenant SaaS architecture with plan-based access control', icon: '🏗️', dotColor: 'bg-purple-500' },
  { year: '2025 Q1', text: 'Beta launch with 4 plans — Starter to Enterprise', icon: '🎉', dotColor: 'bg-emerald-500' },
  { year: '2025 Q2', text: 'PWA support, parent/student portals, website builder module', icon: '📱', dotColor: 'bg-amber-500' },
  { year: '2025 Q3', text: 'Razorpay payment integration, SMS gateway, 22+ modules live', icon: '💳', dotColor: 'bg-rose-500' },
]

const team = [
  { role: 'Full-Stack Development', count: 3, icon: '💻', desc: 'Next.js, MongoDB, TypeScript' },
  { role: 'UI/UX Design', count: 1, icon: '🎨', desc: 'Tailwind CSS, Responsive Design' },
  { role: 'School Operations', count: 2, icon: '🏫', desc: 'Real school workflow expertise' },
  { role: 'Customer Support', count: 2, icon: '🤝', desc: 'WhatsApp, Call, Email support' },
]

const techStack = [
  { name: 'Next.js 16+', category: 'Frontend' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'Tailwind CSS', category: 'Styling' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Razorpay', category: 'Payments' },
  { name: 'PWA', category: 'Mobile' },
  { name: 'Vercel', category: 'Hosting' },
  { name: 'Cloudinary', category: 'Media' },
]

const whyChooseUs = [
  {
    title: 'No Setup Cost',
    desc: 'Zero installation. No hardware. No IT staff needed. Register and start using in 2 minutes.',
    icon: '🆓',
    stat: '₹0 setup',
  },
  {
    title: 'Affordable Plans',
    desc: 'Start at ₹499/month. No hidden charges. Pay monthly or yearly. Cancel anytime.',
    icon: '💰',
    stat: 'From ₹499/mo',
  },
  {
    title: 'All-in-One Platform',
    desc: '22+ modules in one platform. Attendance, fees, exams, website, parent portal — everything connected.',
    icon: '📦',
    stat: '22+ modules',
  },
  {
    title: 'Personal Support',
    desc: 'We personally help you set up your school. WhatsApp, call, or screen-sharing — whatever works for you.',
    icon: '🤝',
    stat: 'Direct support',
  },
]

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function AboutPage() {
  const heroRef = useReveal<HTMLDivElement>()
  const storyRef = useReveal<HTMLDivElement>()
  const valuesRef = useRevealGroup()
  const timelineRef = useReveal<HTMLDivElement>()
  const teamRef = useReveal<HTMLDivElement>()
  const whyRef = useRevealGroup()

  return (
    <>
      {/* ═══════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50/30 to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
          <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-indigo-500/[0.06] blur-[100px] rounded-full" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>

        <Container>
          <div ref={heroRef} className="reveal max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-soft mb-6">
              <span className="text-lg">💡</span>
              <span className="text-sm font-semibold text-slate-700">About Skolify</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Built by educators,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                for educators
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Skolify is a product of{' '}
              <a
                href="https://shivshakticomputer.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                Shivshakti Computer Academy
              </a>
              , Ambikapur. We understand the daily challenges Indian schools face — and we built a complete platform to solve them.
            </p>

            {/* Hero Stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {heroStats.map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-soft">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-2xl font-extrabold text-slate-900">{stat.value}</span>
                  <span className="text-xs text-slate-500">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Quick Info */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { icon: '📍', label: 'Ambikapur, Chhattisgarh' },
                { icon: '📅', label: 'Founded 2024' },
                { icon: '🏫', label: 'Education Technology' },
                { icon: '🇮🇳', label: 'Made in India' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 px-3.5 py-2 bg-white/80 rounded-full border border-slate-200/60 text-sm text-slate-600">
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: OUR STORY
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <Container>
          <div ref={storyRef} className="reveal">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 uppercase tracking-wider mb-4">
                📖 Our Story
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                From a computer academy to an EdTech product
              </h2>
            </div>

            {/* Story Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Main Story — Takes 3 columns */}
              <div className="lg:col-span-3">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8 shadow-soft">
                  <div className="space-y-5 text-[15px] text-slate-600 leading-relaxed">
                    <p>
                      We started as a <strong className="text-slate-900">computer training academy</strong> in
                      Ambikapur, Chhattisgarh. Over the years, we trained thousands of students and worked closely
                      with local schools. We saw firsthand how schools struggled with paper registers, manual fee
                      tracking, and disconnected parent communication.
                    </p>
                    <p>
                      Most existing school software was either{' '}
                      <span className="font-semibold text-red-600">too expensive</span> (₹50,000+ setup),{' '}
                      <span className="font-semibold text-red-600">too complex</span> (requiring dedicated IT staff),
                      or <span className="font-semibold text-red-600">not built for Indian school workflows</span>{' '}
                      (no Hindi, no ₹ billing, no CBSE patterns).
                    </p>
                    <p>
                      So in 2024, we decided to build <strong className="text-blue-600">Skolify</strong> — a modern,
                      lightweight, cloud-based school management platform that any school can start using in minutes.
                      No installation, no hardware, no long contracts. Just register, log in, and start managing your school.
                    </p>
                  </div>

                  {/* Problem → Solution */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-red-200 flex items-center justify-center text-[10px]">✕</span>
                        The Problem
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Expensive legacy software (₹50K+ setup)',
                          'Complex setup requiring IT staff',
                          'Desktop-only, no mobile access',
                          'Not designed for Indian schools',
                          'No parent communication tools',
                        ].map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-red-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-emerald-200 flex items-center justify-center text-[10px]">✓</span>
                        Our Solution
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Start at ₹499/month, no setup cost',
                          'Zero installation, instant start',
                          'Mobile-first PWA — works everywhere',
                          'Built specifically for Indian schools',
                          'SMS + WhatsApp to parents built-in',
                        ].map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Cards — Takes 2 columns */}
              <div className="lg:col-span-2 space-y-4">
                {/* Founder Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-brand">
                      <span className="text-white font-extrabold text-lg">SC</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">Shivshakti Computer Academy</p>
                      <p className="text-xs text-slate-500">Parent Organization</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Years of experience in computer education and training. Deep understanding of how Indian
                    schools operate and what they truly need.
                  </p>
                  <a
                    href="https://shivshakticomputer.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Visit Academy Website
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>

                {/* Self-Funded Card */}
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">🏦</span>
                    <span className="text-sm font-bold text-slate-900">100% Self-Funded</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    No investors. No pressure to monetize aggressively. We build what schools actually need, not what VCs want.
                  </p>
                </div>

                {/* Location Card */}
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">📍</span>
                    <span className="text-sm font-bold text-slate-900">Ambikapur, Chhattisgarh</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Proudly built from a Tier-3 city. Proving great EdTech can come from anywhere in India.
                  </p>
                </div>

                {/* Open Source Mindset */}
                <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">💡</span>
                    <span className="text-sm font-bold text-slate-900">Transparent & Honest</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    No fake testimonials, no inflated numbers. We show real features. Real pricing. Real product.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: WHY CHOOSE US
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <Container>
          <SectionTitle
            eyebrow="🏆 Why Skolify"
            title="What makes us different from others"
            subtitle="We're not just another school ERP. Here's why schools should choose Skolify."
            center
          />

          <div ref={whyRef} className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger">
            {whyChooseUs.map((item) => (
              <div key={item.title} className="reveal group bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 mb-3">
                  {item.stat}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: VALUES
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-blue-500/[0.04] blur-[120px] rounded-full" />
        </div>

        <Container>
          <SectionTitle
            eyebrow="💎 Core Values"
            title="Principles that guide every decision"
            subtitle="From code architecture to pricing — these values shape everything we build."
            center
          />

          <div ref={valuesRef} className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal-stagger">
            {values.map(v => (
              <div
                key={v.title}
                className={`reveal group bg-white rounded-2xl border ${v.borderColor} p-6 flex flex-col shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`w-14 h-14 rounded-xl ${v.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{v.icon}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{v.desc}</p>
                <div className="mt-5 h-[2px] rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${v.gradient} w-0 group-hover:w-full transition-all duration-500`} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5: JOURNEY / TIMELINE
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <Container>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-purple-700 uppercase tracking-wider mb-4">
              📅 Our Journey
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              From idea to a full platform
            </h2>
            <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
              Every milestone in building Skolify — and what&apos;s coming next.
            </p>
          </div>

          <div ref={timelineRef} className="reveal max-w-2xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-amber-300 rounded-full" />

              <div className="space-y-6">
                {milestones.map((m, i) => (
                  <div key={i} className="relative pl-16 group">
                    {/* Dot */}
                    <div className={`absolute left-0 top-2 w-12 h-12 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center shadow-soft group-hover:shadow-medium group-hover:border-blue-300 transition-all`}>
                      <span className="text-xl">{m.icon}</span>
                    </div>

                    {/* Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft hover:shadow-medium transition-all duration-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                          {m.year}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${m.dotColor}`} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}

                {/* Future — Dashed */}
                <div className="relative pl-16 group">
                  <div className="absolute left-0 top-2 w-12 h-12 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-xl">🔮</span>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Coming Next
                    </span>
                    <p className="mt-2 text-sm text-slate-500 font-medium">
                      AI-powered analytics, transport GPS tracking, advanced reporting, more regional language support...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: TEAM
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <Container>
          <div ref={teamRef} className="reveal">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4">
                👥 Our Team
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Small team, big vision
              </h2>
              <p className="mt-3 text-base text-slate-600 max-w-xl mx-auto">
                A focused team of developers and educators building the future of school management in India.
              </p>
            </div>

            {/* Team Roles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {team.map(t => (
                <div key={t.role} className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{t.icon}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{t.role}</h4>
                  <p className="text-xs text-slate-500 mb-3">{t.desc}</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 border border-indigo-100">
                    {t.count} {t.count === 1 ? 'member' : 'members'}
                  </span>
                </div>
              ))}
            </div>

            {/* Tech Stack + Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Tech Stack */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8 shadow-soft">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">🛠️</span>
                  Technology Stack
                </h3>
                <p className="text-sm text-slate-600 mb-5">
                  Modern, battle-tested technologies for reliability and speed.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {techStack.map(tech => (
                    <div key={tech.name} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{tech.name}</p>
                        <p className="text-[10px] text-slate-400">{tech.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights / Fun Facts */}
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    Platform Highlights
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Average page load', value: '< 2 seconds', icon: '⚡' },
                      { label: 'Minimum device', value: '₹5,000 phone works', icon: '📱' },
                      { label: 'Setup time', value: '2 minutes', icon: '⏱️' },
                      { label: 'Data isolation', value: '100% per school', icon: '🔒' },
                      { label: 'Uptime target', value: '99.9%', icon: '🟢' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          <span>{item.icon}</span>
                          {item.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700 leading-relaxed flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">🌱</span>
                    <span>
                      <strong>We&apos;re just getting started.</strong> Skolify is continuously improving based on
                      real feedback from real schools. Every week, we ship new features and improvements.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7: CTA
          ═══════════════════════════════════════════ */}
      <CTA />
    </>
  )
}