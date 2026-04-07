'use client'

import Link from 'next/link'
import { Container } from './Container'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'
import { IconCheck, IconSparkles, IconLanguage } from '../ui/icons'

/* ─── Trust Points ─── */
const trustPoints = [
  { icon: '🤖', text: 'AI Assistant Included' },
  { icon: '🌐', text: 'All Indian Languages' },
  { icon: '⚡', text: 'Fast & Simple' },
  { icon: '🔒', text: 'Secure' },
]

/* ─── Dashboard Stats ─── */
const dashboardStats = [
  { label: 'Students', value: '1,248', icon: '👨‍🎓', trend: '+12%' },
  { label: 'Attendance', value: '94.2%', icon: '✓', trend: '+3%' },
  { label: 'Fee Collected', value: '₹4.2L', icon: '💰', trend: '+18%' },
  { label: 'AI Tasks', value: '340', icon: '🤖', trend: 'Today' },
]

/* ─── Bar Chart Data ─── */
const chartBars = [30, 45, 28, 60, 42, 75, 55, 82, 68, 58, 72, 88]

export function Hero() {
  const headingRef = useReveal<HTMLDivElement>()
  const dashboardRef = useReveal<HTMLDivElement>({ threshold: 0.1 })
  const trustRef = useRevealGroup()

  return (
    <section className="relative overflow-hidden bg-white">
      {/* ✨ Minimal Background — No heavy gradients */}
      <div className="absolute inset-0 bg-slate-50/30" aria-hidden="true" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <Container>
        <div className="relative pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ─── LEFT: Content ─── */}
          <div ref={headingRef} className="reveal relative z-10">
            
            {/* AI Badge — Minimal */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-medium text-purple-700 mb-4">
              <IconSparkles className="w-3.5 h-3.5" />
              <span>AI-Powered · Multilingual</span>
            </div>

            {/* Launch Badge — Minimal */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Early Access Open — Limited Spots</span>
            </div>

            {/* Main Heading — Clean */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-slate-900 mb-6">
              India's First
              <br />
              <span className="text-blue-600">AI-Powered School ERP</span>
            </h1>

            {/* Subheading — Simple */}
            <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-xl">
              Built-in AI assistant helps with fee reminders, student promotion, report generation — all in{' '}
              <span className="font-medium text-slate-900">Hindi, English & 10+ Indian languages</span>.
            </p>

            {/* AI Capabilities — Minimal Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                'Smart Fee Reminders',
                'Auto Reports', 
                'Student Promotion',
                'Multilingual Chat',
              ].map((item, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* CTA Buttons — Clean */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <IconSparkles className="w-4 h-4" />
                <span>Get Early Access — Free</span>
              </Link>
              
              <Link 
                href="/#demo" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                </svg>
                <span>See AI in Action</span>
              </Link>
            </div>

            {/* Trust Points — Minimal */}
            <div ref={trustRef} className="grid grid-cols-2 gap-2 reveal-stagger">
              {trustPoints.map((point, i) => (
                <div 
                  key={i} 
                  className="reveal flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 text-xs font-medium text-slate-700"
                >
                  <span className="text-base">{point.icon}</span>
                  <span>{point.text}</span>
                </div>
              ))}
            </div>

            {/* Founder Badge — Minimal */}
            <div className="mt-8 flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                SC
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Built by Shivshakti Computer Academy</p>
                <p className="text-xs text-slate-500">Trusted education technology partner</p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Dashboard Preview ─── */}
          <div ref={dashboardRef} className="reveal relative lg:pl-8">
            
            {/* Sample Data Badge */}
            <div className="relative mb-2 text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-medium text-amber-700">
                📊 Sample Dashboard
              </span>
            </div>

            {/* Dashboard Card — Clean */}
            <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden">
              
              {/* Browser Chrome — Minimal */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                
                <div className="flex-1 mx-2">
                  <div className="flex items-center gap-2 bg-white rounded-md px-3 py-1.5 border border-slate-200">
                    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-medium text-slate-600">app.skolify.in</span>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-semibold">
                  SF
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      Good Morning 👋
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[9px] font-medium">
                        <IconSparkles className="w-2.5 h-2.5" />
                        AI
                      </span>
                    </p>
                    <p className="text-base font-semibold text-slate-900 mt-0.5">Your School Name</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-medium text-blue-700">Pro</span>
                  </div>
                </div>

                {/* Stats Grid — Minimal */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {dashboardStats.map((stat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-lg">{stat.icon}</span>
                        <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Chart — Minimal */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Fee Collection</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Monthly overview</p>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-600">+24%</span>
                  </div>
                  
                  <div className="h-20 flex items-end gap-1">
                    {chartBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-blue-500 hover:bg-blue-600 transition-colors"
                        style={{ height: `${h}%`, opacity: 0.7 + (h / 300) }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5 text-[9px] text-slate-400 font-medium">
                    <span>Jan</span><span>Jun</span><span>Dec</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
                  </span>
                  AI-powered dashboard
                </div>
              </div>
            </div>

            {/* Floating Notifications — Minimal */}
            <div 
              className="absolute -bottom-3 -right-3 sm:bottom-6 sm:-right-6 bg-white rounded-xl p-3 border border-slate-200 animate-float min-w-[180px]"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <IconSparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[9px] font-medium text-purple-600 uppercase tracking-wide">AI Assistant</p>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">10 Reminders Sent</p>
                  <p className="text-[10px] text-slate-500">Auto-scheduled</p>
                </div>
              </div>
            </div>

            <div 
              className="absolute -top-3 -left-3 sm:top-10 sm:-left-6 bg-white rounded-xl p-3 border border-slate-200 animate-float min-w-[180px]"
              style={{ animationDelay: '1.5s' }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <IconLanguage className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-medium text-blue-600 uppercase tracking-wide">Multilingual</p>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">हिंदी में मदद करें</p>
                  <p className="text-[10px] text-slate-500">10+ languages</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION — Minimal */}
        <div className="relative pb-16 sm:pb-20">
          <div className="w-full h-px bg-slate-200 mb-10" />
          
          <div className="text-center">
            <p className="text-xs font-medium text-slate-500 mb-5 uppercase tracking-wide">
              Perfect for Indian Schools
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-3">
              {[
                { label: 'CBSE', icon: '🏫' },
                { label: 'ICSE', icon: '📚' },
                { label: 'State Board', icon: '🎓' },
                { label: 'Play School', icon: '🧒' },
                { label: 'Coaching', icon: '📝' },
                { label: 'Tuition', icon: '✏️' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}