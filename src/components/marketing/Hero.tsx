// FILE: src/components/marketing/Hero.tsx

'use client'

import Link from 'next/link'
import { Container } from './Container'
import { useReveal, useRevealGroup } from '@/hooks/useReveal'
import { IconCheck } from '../ui/icons'

/* ─── Trust Points ─── */
const trustPoints = [
  { icon: '📱', text: 'Works on any device' },
  { icon: '⚡', text: 'Fast even on 2G' },
  { icon: '🔒', text: 'Bank-grade security' },
  { icon: '🇮🇳', text: 'Built for Indian schools' },
]

/* ─── Dashboard Stats (Demo/Sample Data) ─── */
const dashboardStats = [
  { label: 'Students', value: '1,248', icon: '👨‍🎓', trend: '+12%', color: 'bg-blue-500' },
  { label: 'Attendance', value: '94.2%', icon: <IconCheck/>, trend: '+3%', color: 'bg-emerald-500' },
  { label: 'Fee Collected', value: '₹4.2L', icon: '💰', trend: '+18%', color: 'bg-amber-500' },
  { label: 'SMS Sent', value: '2,340', icon: '📨', trend: '+8%', color: 'bg-purple-500' },
]

/* ─── Bar Chart Data ─── */
const chartBars = [30, 45, 28, 60, 42, 75, 55, 82, 68, 58, 72, 88]

/* ─── Floating Icons ─── */
const floatingIcons = [
  { emoji: '📚', position: 'top-20 left-[8%]', delay: '0s', size: 'w-12 h-12' },
  { emoji: '🎓', position: 'top-32 right-[5%]', delay: '1s', size: 'w-14 h-14' },
  { emoji: '📝', position: 'bottom-32 left-[3%]', delay: '2s', size: 'w-10 h-10' },
  { emoji: '🏫', position: 'bottom-20 right-[8%]', delay: '0.5s', size: 'w-11 h-11' },
]

export function Hero() {
  const headingRef = useReveal<HTMLDivElement>()
  const dashboardRef = useReveal<HTMLDivElement>({ threshold: 0.1 })
  const trustRef = useRevealGroup()

  return (
    <section className="relative overflow-hidden">
      {/* ─── GRADIENT BACKGROUND ─── */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(139,92,246,0.1),transparent)]" />
        
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />

        <div 
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.03) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1.5px, transparent 1.5px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating decorative icons */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden="true">
        {floatingIcons.map((icon, i) => (
          <div
            key={i}
            className={`absolute ${icon.position} ${icon.size} rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/50 flex items-center justify-center animate-float`}
            style={{ animationDelay: icon.delay }}
          >
            <span className="text-2xl">{icon.emoji}</span>
          </div>
        ))}
      </div>

      <Container>
        <div className="relative pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ─── LEFT: Content ─── */}
          <div ref={headingRef} className="reveal relative z-10">
            
            {/* Launch Badge — HONEST */}
            <div className="inline-flex items-center gap-3 px-2 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-soft mb-8 animate-slide-up">
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide">
                Beta
              </span>
              <span className="text-sm text-slate-600 font-medium pr-2">
                🚀 Early Access Now Open — Be the First!
              </span>
            </div>

            {/* Main Heading — NO FAKE CLAIMS */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] font-extrabold leading-[1.1] tracking-tight">
              <span className="text-slate-900">Run your school</span>
              <br />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  like a pro
                </span>
                <svg className="absolute -top-4 -right-8 w-8 h-8 text-amber-400 animate-bounce-slow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
                </svg>
              </span>
            </h1>

            {/* Subheading — HONEST */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
              All-in-one platform for{' '}
              <span className="font-semibold text-slate-800">admissions, fees, attendance, exams</span>
              {' '}and 20+ modules.{' '}
              <span className="font-semibold text-blue-600">
                Designed specifically for Indian schools.
              </span>
            </p>

            {/* CTA Buttons — EARLY ACCESS FOCUSED */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link 
                href="/register" 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">Get Early Access — Free</span>
                <svg className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              
              <Link 
                href="/#demo" 
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-slate-700 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
                  </svg>
                </span>
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* Trust Points */}
            <div ref={trustRef} className="mt-10 grid grid-cols-2 gap-3 reveal-stagger">
              {trustPoints.map((point, i) => (
                <div 
                  key={i} 
                  className="reveal flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/50"
                >
                  <span className="text-xl">{point.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{point.text}</span>
                </div>
              ))}
            </div>

            {/* Founder Credibility — REAL */}
            <div className="mt-10 flex items-center gap-4 px-4 py-3 rounded-xl bg-white/70 border border-slate-200/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Built by Shivshakti Computer Academy
                </p>
                <p className="text-xs text-slate-500">
                  Years of experience in education technology
                </p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Dashboard Preview ─── */}
          <div ref={dashboardRef} className="reveal relative lg:pl-8">
            
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[32px] blur-3xl opacity-60" aria-hidden="true" />

            {/* SAMPLE DATA DISCLAIMER */}
            <div className="relative mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                📊 Sample Dashboard Preview
              </span>
            </div>

            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden">
              
              {/* Browser Chrome */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/80 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                </div>
                
                <div className="flex-1 mx-2">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200 shadow-sm">
                    <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium text-slate-600">app.skolify.in/dashboard</span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-bold">SF</span>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Good Morning 👋</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">Your School Name</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-blue-700">Pro Plan</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {dashboardStats.map((stat, i) => (
                    <div
                      key={i}
                      className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{stat.icon}</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                      
                      <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${stat.color} transition-all duration-700 group-hover:opacity-100 opacity-80`} 
                          style={{ width: `${60 + i * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Fee Collection</p>
                      <p className="text-xs text-slate-500 mt-0.5">Monthly Overview</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      +24%
                    </span>
                  </div>
                  
                  <div className="h-24 flex items-end gap-1.5">
                    {chartBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-400 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-500 transition-all duration-300 cursor-pointer"
                        style={{ height: `${h}%`, opacity: 0.7 + (h / 300) }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
                    <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live dashboard · Sample data shown
                </div>
              </div>
            </div>

            {/* Floating Notification — Right */}
            <div 
              className="absolute -bottom-4 -right-4 sm:bottom-8 sm:-right-8 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 animate-float min-w-[200px]"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Notification</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">Fee ₹2,500 Paid</p>
                  <p className="text-xs text-slate-500">Auto receipt generated</p>
                </div>
              </div>
            </div>

            {/* Floating Notification — Left */}
            <div 
              className="absolute -top-4 -left-4 sm:top-12 sm:-left-8 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 animate-float min-w-[200px]"
              style={{ animationDelay: '1.5s' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Feature</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">Instant Admission</p>
                  <p className="text-xs text-slate-500">ID card auto-generated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM SECTION — HONEST ─── */}
        <div className="relative pb-16 sm:pb-24">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-12" />
          
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">
              Designed for every type of Indian school
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              {[
                { label: 'CBSE Schools', icon: '🏫' },
                { label: 'ICSE Schools', icon: '📚' },
                { label: 'State Board', icon: '🎓' },
                { label: 'Play Schools', icon: '🧒' },
                { label: 'Coaching Centers', icon: '📝' },
                { label: 'Tuition Classes', icon: '✏️' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-slate-200/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}