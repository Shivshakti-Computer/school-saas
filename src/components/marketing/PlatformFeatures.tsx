// FILE: src/components/marketing/PlatformFeatures.tsx
// Website Builder, PWA, Multi-Role, Security features

'use client'

import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ─── Website Builder Plans Data (from websitePlans.ts) ─── */
const websiteFeatures = [
  {
    plan: 'Starter',
    templates: 1,
    pages: 4,
    photos: 10,
    customPages: 0,
    features: ['Hero Banner', 'About Section', 'Stats', 'Facilities', 'Contact', 'CTA'],
    color: '#64748B',
  },
  {
    plan: 'Growth',
    templates: 3,
    pages: 7,
    photos: 50,
    customPages: 2,
    features: ['All Starter +', 'Faculty Section', 'Testimonials', 'Events', 'Principal Message', 'Video Tour', 'Announcements', 'Login Button', 'WhatsApp Button'],
    color: '#4F46E5',
    popular: true,
  },
  {
    plan: 'Pro',
    templates: 3,
    pages: 15,
    photos: 200,
    customPages: 5,
    features: ['All Growth +', 'Gallery Albums', 'Achievements', 'Downloads', 'Infrastructure', 'Fee Structure', 'Live Notice Board', 'Custom Domain', 'Scroll Animations'],
    color: '#7C3AED',
  },
  {
    plan: 'Enterprise',
    templates: 3,
    pages: '∞',
    photos: '∞',
    customPages: '∞',
    features: ['All Pro +', 'Academic Calendar', 'Transport Routes', 'Alumni Section', 'Mandatory Disclosure', 'Remove Branding', 'Custom Everything'],
    color: '#B45309',
  },
]

/* ─── Platform Highlight Cards ─── */
const platformHighlights = [
  {
    title: 'Installable App (PWA)',
    desc: 'Students, parents & teachers install the app directly from browser. Works offline, loads fast even on 2G. No app store needed.',
    features: ['Home screen install', 'Offline capable', 'Push notifications ready', 'Works on all devices', 'Auto updates'],
    visual: 'pwa',
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    title: 'Multi-Role Portal',
    desc: 'One platform, 4 different experiences. Admin sees everything, teachers manage classes, students check results, parents track progress.',
    features: ['Admin dashboard', 'Teacher panel', 'Student portal', 'Parent app', 'SuperAdmin (you)'],
    visual: 'roles',
    gradient: 'from-brand to-purple-500',
  },
  {
    title: 'Indian School Optimized',
    desc: 'Built specifically for Indian education. Hindi + English, CBSE/ICSE/State board support, Indian payment gateway, SMS in regional languages.',
    features: ['Razorpay payments (₹)', 'SMS in Hindi/English', 'Indian date formats', 'Board-wise structure', 'GST invoicing ready'],
    visual: 'india',
    gradient: 'from-orange-400 to-amber-500',
  },
]

/* ─── Visual: Browser Mockup ─── */
function BrowserMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-dark overflow-hidden">
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-1.5">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400/50" />
          <div className="w-2 h-2 rounded-full bg-amber-400/50" />
          <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
        </div>
        <div className="flex-1 mx-2 bg-white/[0.03] rounded px-2 py-0.5 text-[9px] text-slate-600">
          yourschool.vidyaflow.in
        </div>
      </div>
      {children}
    </div>
  )
}

/* ─── Visual: School Website Preview ─── */
function WebsitePreviewSVG() {
  return (
    <svg viewBox="0 0 320 200" fill="none" className="w-full h-auto">
      {/* Hero */}
      <rect width="320" height="70" fill="rgba(79,70,229,0.08)" />
      <rect x="20" y="15" width="140" height="8" rx="4" fill="rgba(79,70,229,0.25)" />
      <rect x="20" y="28" width="200" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />
      <rect x="20" y="38" width="160" height="5" rx="2.5" fill="rgba(255,255,255,0.04)" />
      <rect x="20" y="52" width="60" height="12" rx="6" fill="rgba(79,70,229,0.2)" />
      {/* School image placeholder */}
      <rect x="240" y="10" width="60" height="50" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Stats */}
      <g transform="translate(0,75)">
        {['500+', '25+', '10+', '20+'].map((v, i) => (
          <g key={i} transform={`translate(${20 + i * 75}, 0)`}>
            <rect width="65" height="30" rx="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <text x="32" y="14" textAnchor="middle" fill="rgba(79,70,229,0.5)" fontSize="9" fontWeight="bold">{v}</text>
            <text x="32" y="24" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="5">
              {['Students', 'Teachers', 'Years', 'Activities'][i]}
            </text>
          </g>
        ))}
      </g>

      {/* Facilities */}
      <g transform="translate(0,115)">
        <rect x="20" y="0" width="80" height="5" rx="2.5" fill="rgba(255,255,255,0.08)" />
        <g transform="translate(20,12)">
          {[0, 1, 2].map(i => (
            <rect key={i} x={i * 95} y="0" width="85" height="50" rx="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          ))}
        </g>
      </g>

      {/* Footer line */}
      <rect x="0" y="185" width="320" height="15" fill="rgba(255,255,255,0.02)" />
      <rect x="20" y="190" width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
    </svg>
  )
}

/* ─── Visual: PWA Devices ─── */
function PWADevicesSVG() {
  return (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-auto">
      {/* Phone */}
      <g transform="translate(90,10)">
        <rect width="60" height="110" rx="10" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
        <rect x="5" y="15" width="50" height="80" rx="4" fill="rgba(255,255,255,0.02)" />
        {/* Phone screen content */}
        <rect x="10" y="20" width="40" height="6" rx="3" fill="rgba(56,189,248,0.15)" />
        <rect x="10" y="30" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
        <rect x="10" y="40" width="40" height="20" rx="3" fill="rgba(56,189,248,0.04)" />
        <rect x="10" y="65" width="18" height="10" rx="3" fill="rgba(56,189,248,0.04)" />
        <rect x="32" y="65" width="18" height="10" rx="3" fill="rgba(16,185,129,0.04)" />
        {/* Home indicator */}
        <rect x="18" y="100" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        {/* Notch */}
        <rect x="20" y="5" width="20" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      </g>

      {/* Desktop behind */}
      <g transform="translate(10,25)" opacity="0.5">
        <rect width="80" height="55" rx="6" fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.1)" strokeWidth="0.5" />
        <rect x="25" y="55" width="30" height="8" rx="1" fill="rgba(139,92,246,0.06)" />
        <rect x="5" y="5" width="70" height="4" rx="2" fill="rgba(139,92,246,0.1)" />
        <rect x="5" y="14" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
      </g>

      {/* Tablet behind */}
      <g transform="translate(170,20)" opacity="0.5">
        <rect width="70" height="90" rx="8" fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.1)" strokeWidth="0.5" />
        <rect x="5" y="8" width="60" height="4" rx="2" fill="rgba(16,185,129,0.1)" />
        <rect x="5" y="16" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
        <rect x="5" y="24" width="60" height="30" rx="4" fill="rgba(16,185,129,0.04)" />
      </g>

      {/* Install arrow */}
      <g transform="translate(125,130)">
        <rect x="-20" y="-5" width="40" height="16" rx="8" fill="rgba(56,189,248,0.1)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />
        <text x="0" y="6" textAnchor="middle" fill="rgba(56,189,248,0.6)" fontSize="6" fontWeight="600">Install ↓</text>
      </g>
    </svg>
  )
}

/* ─── Visual: Roles ─── */
function RolesSVG() {
  const roles = [
    { label: 'Admin', color: 'rgba(79,70,229,0.5)', bg: 'rgba(79,70,229,0.08)' },
    { label: 'Teacher', color: 'rgba(16,185,129,0.5)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Student', color: 'rgba(245,158,11,0.5)', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Parent', color: 'rgba(244,63,94,0.5)', bg: 'rgba(244,63,94,0.08)' },
  ]
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full h-auto">
      {roles.map((role, i) => (
        <g key={role.label} transform={`translate(${15 + i * 67}, 20)`}>
          <rect width="58" height="80" rx="10" fill={role.bg} stroke={role.color} strokeWidth="0.5" opacity="0.8" />
          <circle cx="29" cy="30" r="12" fill={role.bg} />
          <circle cx="29" cy="26" r="5" fill={role.color} opacity="0.6" />
          <path d={`M20 38a9 9 0 0 1 18 0`} fill={role.color} opacity="0.4" />
          <text x="29" y="60" textAnchor="middle" fill={role.color} fontSize="7" fontWeight="700">{role.label}</text>
          {/* Mini features */}
          <rect x="8" y="68" width="42" height="3" rx="1.5" fill={role.color} opacity="0.2" />
          <rect x="12" y="74" width="34" height="2" rx="1" fill={role.color} opacity="0.1" />
        </g>
      ))}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   PLATFORM FEATURES COMPONENT
   ═══════════════════════════════════════════════════════ */
export function PlatformFeatures() {
  const websiteRef = useReveal<HTMLDivElement>()
  const highlightsRef = useRevealGroup()

  const visuals: Record<string, React.ReactNode> = {
    pwa: <PWADevicesSVG />,
    roles: <RolesSVG />,
    india: (
      <div className="flex items-center justify-center py-6">
        <span className="text-6xl">🇮🇳</span>
      </div>
    ),
  }

  return (
    <section className="section-padding relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/[0.02] blur-[120px] rounded-full" />
      </div>

      <Container>
        {/* ═══ WEBSITE BUILDER SECTION ═══ */}
        <SectionTitle
          eyebrow="✦ Website Builder"
          title="Professional school website — zero coding needed"
          subtitle="Choose a template, add your content, publish. Your school gets a beautiful, fast, mobile-responsive website with gallery, events, contact forms & more."
          center
        />

        {/* Website Preview */}
        <div ref={websiteRef} className="reveal mt-10 max-w-3xl mx-auto">
          <BrowserMockup>
            <div className="p-1">
              <WebsitePreviewSVG />
            </div>
          </BrowserMockup>
        </div>

        {/* Website Plan Comparison */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {websiteFeatures.map(plan => (
            <div
              key={plan.plan}
              className={`card-dark p-4 relative ${plan.popular ? 'ring-1 ring-brand/30' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-brand px-3 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <h4 className="text-sm font-bold text-white mb-3" style={{ color: plan.color }}>
                {plan.plan}
              </h4>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Templates</span>
                  <span className="text-white font-semibold">{plan.templates}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Pages</span>
                  <span className="text-white font-semibold">{plan.pages}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Gallery Photos</span>
                  <span className="text-white font-semibold">{plan.photos}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-slate-500">Custom Pages</span>
                  <span className="text-white font-semibold">{plan.customPages}</span>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">
                  Sections Included
                </p>
                <div className="space-y-1">
                  {plan.features.slice(0, 5).map(f => (
                    <p key={f} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: plan.color }} />
                      {f}
                    </p>
                  ))}
                  {plan.features.length > 5 && (
                    <p className="text-[11px] text-slate-600">
                      +{plan.features.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ PLATFORM HIGHLIGHTS ═══ */}
        <div className="mt-24">
          <SectionTitle
            eyebrow="✦ Platform"
            title="Built different — designed for real schools"
            subtitle="Not just another ERP. VidyaFlow is built ground-up for Indian schools with mobile-first design, offline support & regional language SMS."
            center
          />
        </div>

        <div ref={highlightsRef} className="mt-12 space-y-6 reveal-stagger">
          {platformHighlights.map((item, idx) => (
            <div
              key={item.title}
              className={`
                reveal card-dark overflow-hidden
                flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}
              `}
            >
              {/* Visual */}
              <div className="lg:w-[45%] p-6 flex items-center justify-center bg-white/[0.01]">
                <div className="w-full max-w-[280px]">
                  {visuals[item.visual]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
                <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${item.gradient} mb-4`} />
                <h3 className="text-xl font-bold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-5">
                  {item.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.features.map(f => (
                    <span
                      key={f}
                      className="text-[11px] font-medium text-slate-400 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}