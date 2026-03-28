// FILE: src/components/marketing/ModulesShowcase.tsx
// All 22+ modules from MODULE_REGISTRY grouped by plan tier

'use client'

import { useState } from 'react'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'

/* ─── Plan Tiers ─── */
type Tier = 'all' | 'starter' | 'growth' | 'pro' | 'enterprise'

const tiers: { id: Tier; label: string; color: string }[] = [
  { id: 'all', label: 'All Modules', color: '#94A3B8' },
  { id: 'starter', label: 'Starter', color: '#64748B' },
  { id: 'growth', label: 'Growth', color: '#4F46E5' },
  { id: 'pro', label: 'Pro', color: '#7C3AED' },
  { id: 'enterprise', label: 'Enterprise', color: '#B45309' },
]

/* ─── Module Data (reflecting MODULE_REGISTRY) ─── */
interface ModuleItem {
  key: string
  label: string
  desc: string
  color: string
  minPlan: Tier
  icon: React.ReactNode
}

const modules: ModuleItem[] = [
  // ─── STARTER (All Plans) ───
  {
    key: 'students', label: 'Student Management', desc: 'Admission, profiles, ID cards, bulk import & parent linking.',
    color: '#534AB7', minPlan: 'starter',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: 'teachers', label: 'Teachers & Staff', desc: 'Staff records, subject & class assignment, role management.',
    color: '#2563EB', minPlan: 'starter',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  },
  {
    key: 'attendance', label: 'Attendance', desc: 'Daily attendance, auto SMS, reports & parent notifications.',
    color: '#1D9E75', minPlan: 'starter',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    key: 'notices', label: 'Notice Board', desc: 'Circulars, announcements, SMS blast to parents & staff.',
    color: '#185FA5', minPlan: 'starter',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  },
  {
    key: 'website', label: 'School Website', desc: 'Professional website with templates, gallery, SEO & contact forms.',
    color: '#3B6D11', minPlan: 'starter',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    key: 'gallery', label: 'Gallery & Events', desc: 'Photo gallery, albums, event management & media uploads.',
    color: '#E11D48', minPlan: 'starter',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  },

  // ─── GROWTH+ ───
  {
    key: 'fees', label: 'Fee Management', desc: 'Online Razorpay payments, receipts, reminders, late fines & reports.',
    color: '#EF9F27', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  },
  {
    key: 'exams', label: 'Exam & Results', desc: 'Scheduling, marks entry, grade cards, report cards & result SMS.',
    color: '#D85A30', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
  {
    key: 'timetable', label: 'Timetable', desc: 'Class schedules, period management, teacher allocation & view.',
    color: '#0891B2', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    key: 'homework', label: 'Homework & Assignments', desc: 'Assign, submit & grade homework. Teacher & student workflows.',
    color: '#6366F1', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>,
  },
  {
    key: 'documents', label: 'Documents', desc: 'TC, CC, Bonafide, character certificates & custom documents.',
    color: '#475569', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>,
  },
  {
    key: 'reports', label: 'Reports & Analytics', desc: 'Class-wise, subject-wise reports. Attendance & fee analytics.',
    color: '#34D399', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>,
  },
  {
    key: 'communication', label: 'Communication Hub', desc: 'Bulk SMS, WhatsApp messages & email campaigns to parents.',
    color: '#10B981', minPlan: 'growth',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },

  // ─── PRO+ ───
  {
    key: 'library', label: 'Library', desc: 'Book catalogue, issue/return tracking, fine calculation & reports.',
    color: '#FB923C', minPlan: 'pro',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  },
  {
    key: 'certificates', label: 'Certificates', desc: 'Custom certificates, merit awards, achievement templates.',
    color: '#F59E0B', minPlan: 'pro',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  },
  {
    key: 'lms', label: 'Online Learning (LMS)', desc: 'Video lessons, assignments, quizzes & student progress tracking.',
    color: '#993556', minPlan: 'pro',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  },

  // ─── ENTERPRISE ONLY ───
  {
    key: 'hr', label: 'HR & Payroll', desc: 'Staff salary, leave management, payslips & tax calculations.',
    color: '#F87171', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  },
  {
    key: 'transport', label: 'Transport & GPS', desc: 'Bus routes, driver management, GPS tracking & parent alerts.',
    color: '#185FA5', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>,
  },
  {
    key: 'hostel', label: 'Hostel Management', desc: 'Room allotment, mess menu, warden portal & fee integration.',
    color: '#5F5E5A', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  },
  {
    key: 'inventory', label: 'Inventory Tracking', desc: 'School assets, supplies, purchase orders & stock management.',
    color: '#78716C', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  },
  {
    key: 'visitor', label: 'Visitor Management', desc: 'Gate pass, visitor logs, approval workflows & safety records.',
    color: '#0EA5E9', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
  },
  {
    key: 'health', label: 'Health Records', desc: 'Student medical history, health checkups & emergency contacts.',
    color: '#EF4444', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  },
  {
    key: 'alumni', label: 'Alumni Network', desc: 'Alumni directory, events, donations & alumni communication.',
    color: '#8B5CF6', minPlan: 'enterprise',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></svg>,
  },
]

/* ─── Plan badge helper ─── */
const planBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
  starter: { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
  growth: { bg: 'rgba(79,70,229,0.1)', text: '#818CF8', border: 'rgba(79,70,229,0.2)' },
  pro: { bg: 'rgba(124,58,237,0.1)', text: '#A78BFA', border: 'rgba(124,58,237,0.2)' },
  enterprise: { bg: 'rgba(180,83,9,0.1)', text: '#FBBF24', border: 'rgba(180,83,9,0.2)' },
}

function PlanBadge({ plan }: { plan: string }) {
  const style = planBadgeStyles[plan] || planBadgeStyles.starter
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {plan === 'starter' ? 'All Plans' : `${plan}+`}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════
   MODULES SHOWCASE COMPONENT
   ═══════════════════════════════════════════════════════ */
export function ModulesShowcase() {
  const [activeTier, setActiveTier] = useState<Tier>('all')
  const gridRef = useRevealGroup()

  const filteredModules = activeTier === 'all'
    ? modules
    : modules.filter(m => {
        const tierOrder: Tier[] = ['starter', 'growth', 'pro', 'enterprise']
        const moduleIdx = tierOrder.indexOf(m.minPlan)
        const filterIdx = tierOrder.indexOf(activeTier)
        return moduleIdx <= filterIdx
      })

  return (
    <section id="modules" className="section-padding relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-purple-500/[0.03] blur-[120px] rounded-full" />
      </div>

      <Container>
        <SectionTitle
          eyebrow="✦ 22+ Modules"
          title="One platform, every tool your school needs"
          subtitle="From basic attendance to HR & payroll — choose the plan that fits. Every module works together seamlessly."
          center
        />

        {/* Tier Filter Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {tiers.map(tier => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`
                  px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                  ${activeTier === tier.id
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                  }
                `}
              >
                {tier.label}
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({tier.id === 'all'
                    ? modules.length
                    : modules.filter(m => {
                        const tierOrder: Tier[] = ['starter', 'growth', 'pro', 'enterprise']
                        return tierOrder.indexOf(m.minPlan) <= tierOrder.indexOf(tier.id)
                      }).length
                  })
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div
          ref={gridRef}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 reveal-stagger"
        >
          {filteredModules.map(mod => (
            <div
              key={mod.key}
              className="reveal group card-dark p-4 flex flex-col gap-3"
            >
              {/* Top row: Icon + Badge */}
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                  style={{ background: `${mod.color}15`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <PlanBadge plan={mod.minPlan} />
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-white">
                {mod.label}
              </h3>

              {/* Description */}
              <p className="text-[12px] text-slate-500 leading-relaxed flex-1">
                {mod.desc}
              </p>

              {/* Bottom hover indicator */}
              <div className="h-[2px] rounded-full bg-white/[0.03] overflow-hidden mt-auto">
                <div
                  className="h-full rounded-full w-0 group-hover:w-full transition-all duration-500"
                  style={{ background: mod.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '22+', label: 'Modules', icon: '📦' },
            { value: '4', label: 'User Roles', icon: '👥' },
            { value: '₹499', label: 'Starting Price/mo', icon: '💰' },
            { value: '24/7', label: 'System Uptime', icon: '⚡' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="text-lg mb-1">{stat.icon}</div>
              <div className="text-xl font-extrabold text-white">{stat.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}