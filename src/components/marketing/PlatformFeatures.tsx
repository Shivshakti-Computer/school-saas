// FILE: src/components/marketing/PlatformFeatures.tsx
// UPDATED: SMS credit text fix in Indian School Optimized card

'use client'

import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ─── Website Builder Plans Data ─── */
const websiteFeatures = [
  {
    plan: 'Starter',
    templates: 1,
    pages: 4,
    photos: 10,
    customPages: 0,
    features: ['Hero Banner', 'About Section', 'Stats', 'Facilities', 'Contact', 'CTA'],
    color: '#64748B',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
  {
    plan: 'Growth',
    templates: 3,
    pages: 7,
    photos: 50,
    customPages: 2,
    features: [
      'All Starter +',
      'Faculty Section',
      'Testimonials',
      'Events',
      'Principal Message',
      'Video Tour',
      'Announcements',
      'Login Button',
      'WhatsApp Button',
    ],
    color: '#2563EB',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    popular: true,
  },
  {
    plan: 'Pro',
    templates: 3,
    pages: 15,
    photos: 200,
    customPages: 5,
    features: [
      'All Growth +',
      'Gallery Albums',
      'Achievements',
      'Downloads',
      'Infrastructure',
      'Fee Structure',
      'Live Notice Board',
      'Custom Domain',
      'Scroll Animations',
    ],
    color: '#7C3AED',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    plan: 'Enterprise',
    templates: 3,
    pages: '∞',
    photos: '∞',
    customPages: '∞',
    features: [
      'All Pro +',
      'Academic Calendar',
      'Transport Routes',
      'Alumni Section',
      'Mandatory Disclosure',
      'Remove Branding',
      'Custom Everything',
    ],
    color: '#D97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
]

/* ─── Platform Highlight Cards ─── */
const platformHighlights = [
  {
    title: 'Installable App (PWA)',
    desc: 'Students, parents & teachers install the app directly from browser. Works offline, loads fast even on 2G. No app store needed.',
    features: [
      'Home screen install',
      'Offline capable',
      'Push notifications ready',
      'Works on all devices',
      'Auto updates',
    ],
    visual: 'pwa',
    gradient: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    iconBg: 'bg-sky-100',
  },
  {
    title: 'Multi-Role Portal',
    desc: 'One platform, 4 different experiences. Admin sees everything, teachers manage classes, students check results, parents track progress.',
    features: [
      'Admin dashboard',
      'Teacher panel',
      'Student portal',
      'Parent app',
      'SuperAdmin (you)',
    ],
    visual: 'roles',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
  },
  {
    title: 'Indian School Optimized',
    desc: 'Built specifically for Indian education. Hindi + English, CBSE/ICSE/State board support, Indian payment gateway, SMS & WhatsApp via credit system.',
    features: [
      'Razorpay payments (₹)',
      'SMS via Credits (Hindi/English)',        // ← UPDATED
      'WhatsApp via Credits',                   // ← NEW (added for clarity)
      'Indian date formats',
      'Board-wise structure',
      'GST invoicing ready',
    ],
    visual: 'india',
    gradient: 'from-orange-500 to-amber-600',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
  },
]

/* ─── Visual: Browser Mockup ─── */
function BrowserMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-medium overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-2 bg-white rounded-lg px-3 py-1.5 text-[10px] text-slate-500 border border-slate-200">
          🔒 yourschool.skolify
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
      <rect width="320" height="70" fill="#EFF6FF" />
      <rect x="20" y="15" width="140" height="8" rx="4" fill="#3B82F6" />
      <rect x="20" y="28" width="200" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="20" y="38" width="160" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="20" y="52" width="60" height="12" rx="6" fill="#2563EB" />
      <rect x="240" y="10" width="60" height="50" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />

      {/* Stats */}
      <g transform="translate(0,75)">
        {['500+', '25+', '10+', '20+'].map((v, i) => (
          <g key={i} transform={`translate(${20 + i * 75}, 0)`}>
            <rect width="65" height="30" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1" />
            <text x="32" y="14" textAnchor="middle" fill="#2563EB" fontSize="9" fontWeight="bold">{v}</text>
            <text x="32" y="24" textAnchor="middle" fill="#64748B" fontSize="5">
              {['Students', 'Teachers', 'Years', 'Activities'][i]}
            </text>
          </g>
        ))}
      </g>

      {/* Facilities */}
      <g transform="translate(0,115)">
        <rect x="20" y="0" width="80" height="5" rx="2.5" fill="#CBD5E1" />
        <g transform="translate(20,12)">
          {[0, 1, 2].map(i => (
            <rect key={i} x={i * 95} y="0" width="85" height="50" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1" />
          ))}
        </g>
      </g>

      {/* Footer */}
      <rect x="0" y="185" width="320" height="15" fill="#F8FAFC" />
      <rect x="20" y="190" width="100" height="3" rx="1.5" fill="#CBD5E1" />
    </svg>
  )
}

/* ─── Visual: PWA Devices ─── */
function PWADevicesSVG() {
  return (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-auto">
      {/* Phone */}
      <g transform="translate(90,10)">
        <rect width="60" height="110" rx="10" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
        <rect x="5" y="15" width="50" height="80" rx="4" fill="white" />
        <rect x="10" y="20" width="40" height="6" rx="3" fill="#0EA5E9" />
        <rect x="10" y="30" width="30" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="10" y="40" width="40" height="20" rx="3" fill="#E0F2FE" />
        <rect x="10" y="65" width="18" height="10" rx="3" fill="#E0F2FE" />
        <rect x="32" y="65" width="18" height="10" rx="3" fill="#D1FAE5" />
        <rect x="18" y="100" width="24" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="20" y="5" width="20" height="6" rx="3" fill="#E2E8F0" />
      </g>

      {/* Desktop behind */}
      <g transform="translate(10,25)" opacity="0.6">
        <rect width="80" height="55" rx="6" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1" />
        <rect x="25" y="55" width="30" height="8" rx="1" fill="#EDE9FE" />
        <rect x="5" y="5" width="70" height="4" rx="2" fill="#8B5CF6" />
        <rect x="5" y="14" width="50" height="3" rx="1.5" fill="#CBD5E1" />
      </g>

      {/* Tablet behind */}
      <g transform="translate(170,20)" opacity="0.6">
        <rect width="70" height="90" rx="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
        <rect x="5" y="8" width="60" height="4" rx="2" fill="#10B981" />
        <rect x="5" y="16" width="40" height="3" rx="1.5" fill="#CBD5E1" />
        <rect x="5" y="24" width="60" height="30" rx="4" fill="#D1FAE5" />
      </g>

      {/* Install button */}
      <g transform="translate(125,130)">
        <rect x="-25" y="-8" width="50" height="20" rx="10" fill="#0EA5E9" />
        <text x="0" y="4" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Install ↓</text>
      </g>
    </svg>
  )
}

/* ─── Visual: Roles ─── */
function RolesSVG() {
  const roles = [
    { label: 'Admin', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Teacher', color: '#10B981', bg: '#ECFDF5' },
    { label: 'Student', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Parent', color: '#EC4899', bg: '#FDF2F8' },
  ]
  return (
    <svg viewBox="0 0 280 120" fill="none" className="w-full h-auto">
      {roles.map((role, i) => (
        <g key={role.label} transform={`translate(${15 + i * 67}, 20)`}>
          <rect width="58" height="80" rx="12" fill={role.bg} stroke={role.color} strokeWidth="1" strokeOpacity="0.3" />
          <circle cx="29" cy="30" r="12" fill="white" />
          <circle cx="29" cy="27" r="5" fill={role.color} />
          <path d={`M21 38a8 8 0 0 1 16 0`} fill={role.color} opacity="0.3" />
          <text x="29" y="60" textAnchor="middle" fill={role.color} fontSize="7" fontWeight="700">{role.label}</text>
          <rect x="10" y="68" width="38" height="3" rx="1.5" fill={role.color} opacity="0.2" />
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
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <span className="text-7xl">🇮🇳</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-100 rounded-full text-[10px] font-bold text-amber-700 whitespace-nowrap">
            Made for India
          </div>
        </div>
      </div>
    ),
  }

  return (
    <section className="section-padding relative bg-slate-50">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/[0.03] blur-[100px] rounded-full" />
      </div>

      <Container>
        {/* ═══ WEBSITE BUILDER SECTION ═══ */}
        <SectionTitle
          eyebrow="🌐 Website Builder"
          title="Professional school website — zero coding needed"
          subtitle="Choose a template, add your content, publish. Your school gets a beautiful, fast, mobile-responsive website with gallery, events, contact forms & more."
          center
        />

        {/* Website Preview */}
        <div ref={websiteRef} className="reveal mt-10 max-w-3xl mx-auto">
          <BrowserMockup>
            <div className="p-2 bg-slate-50">
              <WebsitePreviewSVG />
            </div>
          </BrowserMockup>
        </div>

        {/* Website Plan Comparison */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {websiteFeatures.map(plan => (
            <div
              key={plan.plan}
              className={`bg-white rounded-2xl border p-5 relative transition-all duration-300 hover:shadow-medium ${plan.borderColor} ${plan.popular ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-blue-500 px-3 py-1 rounded-full shadow-soft">
                  🔥 Popular
                </span>
              )}
              <h4 className="text-base font-bold mb-4" style={{ color: plan.color }}>
                {plan.plan}
              </h4>

              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Templates</span>
                  <span className="text-slate-900 font-semibold">{plan.templates}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Pages</span>
                  <span className="text-slate-900 font-semibold">{plan.pages}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Gallery Photos</span>
                  <span className="text-slate-900 font-semibold">{plan.photos}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Custom Pages</span>
                  <span className="text-slate-900 font-semibold">{plan.customPages}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">
                  Sections Included
                </p>
                <div className="space-y-1.5">
                  {plan.features.slice(0, 5).map(f => (
                    <p key={f} className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: plan.color }}
                      />
                      {f}
                    </p>
                  ))}
                  {plan.features.length > 5 && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      +{plan.features.length - 5} more sections
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
            eyebrow="⚡ Platform"
            title="Built different — designed for real schools"
            subtitle="Not just another ERP. Skolify is built ground-up for Indian schools with mobile-first design, offline support & credit-based messaging system."
            center
          />
        </div>

        <div ref={highlightsRef} className="mt-12 space-y-6 reveal-stagger">
          {platformHighlights.map((item, idx) => (
            <div
              key={item.title}
              className={`
                reveal bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300
                flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}
              `}
            >
              {/* Visual */}
              <div className={`lg:w-[45%] p-8 flex items-center justify-center ${item.bgColor}`}>
                <div className="w-full max-w-[280px]">
                  {visuals[item.visual]}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
                <div className={`w-14 h-1.5 rounded-full bg-gradient-to-r ${item.gradient} mb-5`} />
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed mb-6">
                  {item.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.features.map(f => (
                    <span
                      key={f}
                      className="text-xs font-medium text-slate-600 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200"
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