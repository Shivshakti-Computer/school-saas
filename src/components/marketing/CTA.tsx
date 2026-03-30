// FILE: src/components/marketing/CTA.tsx

import Link from 'next/link'
import { Container } from './Container'

export function CTA() {
  return (
    <section className="py-20 bg-white">
      <Container>
        {/* ─── Main CTA Card ─── */}
        <div className="relative">
          
          {/* Background decorative blobs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 bg-indigo-100 rounded-full blur-3xl opacity-60" />
          
          <div className="relative bg-white rounded-3xl border-2 border-slate-200 shadow-elevated overflow-hidden">
            
            {/* Top gradient strip */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            <div className="px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
              <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">
                
                {/* ─── Left Content ─── */}
                <div className="flex-1 max-w-xl">
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-semibold text-blue-700">
                      Early Access Open
                    </span>
                  </div>

                  {/* Heading */}
                  <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                    Ready to simplify your{' '}
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      school operations?
                    </span>
                  </h2>

                  {/* Description */}
                  <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                    Set up your school in minutes — no installation, no credit card.
                    We&apos;ll personally help you get started.
                  </p>

                  {/* CTA Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/register"
                      className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative">Get Early Access — Free</span>
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="relative group-hover:translate-x-1 transition-transform">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>

                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-base border border-slate-200 hover:bg-slate-200 hover:border-slate-300 transition-all duration-300"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Talk to Us
                    </Link>
                  </div>

                  {/* Trust Points */}
                  <div className="mt-8 flex flex-wrap gap-4">
                    {[
                      'Free to start',
                      'No credit card',
                      'Cancel anytime',
                      'Personal onboarding',
                    ].map(item => (
                      <span key={item} className="flex items-center gap-2 text-sm text-slate-500">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                          <circle cx="8" cy="8" r="8" fill="#D1FAE5" />
                          <path d="M5 8l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-medium">{item}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* ─── Right: Feature Cards ─── */}
                <div className="lg:w-[340px] flex-shrink-0">
                  <div className="space-y-4">
                    
                    {/* Main info card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                      {/* Logo */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                          <span className="text-white font-extrabold text-sm">VF</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Skolify</p>
                          <p className="text-[10px] text-slate-500">by Shivshakti Computer Academy</p>
                        </div>
                      </div>
                      
                      {/* Quick stats */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: '22+', label: 'Modules', icon: '📦' },
                          { value: '₹499', label: 'Starting/mo', icon: '💰' },
                          { value: '4', label: 'User Roles', icon: '👥' },
                          { value: '2 min', label: 'Setup Time', icon: '⚡' },
                        ].map(stat => (
                          <div key={stat.label} className="bg-white rounded-xl p-3 border border-blue-100 text-center">
                            <span className="text-lg">{stat.icon}</span>
                            <p className="text-lg font-extrabold text-slate-900 mt-1">{stat.value}</p>
                            <p className="text-[10px] text-slate-500">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feature mini cards */}
                    {[
                      { icon: '📱', title: 'Works on any device', desc: 'Phone, tablet & desktop — even on ₹5K phones', color: 'bg-emerald-50 border-emerald-200' },
                      { icon: '🔒', title: 'Bank-grade security', desc: 'Encrypted data, role-based access, isolated per school', color: 'bg-amber-50 border-amber-200' },
                    ].map((card) => (
                      <div key={card.title} className={`flex items-start gap-3.5 p-4 rounded-2xl border ${card.color}`}>
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-xl">{card.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{card.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{card.desc}</p>
                        </div>
                      </div>
                    ))}

                    {/* Founding school banner */}
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-50 border border-purple-200">
                      <span className="text-2xl">🎁</span>
                      <div>
                        <p className="text-sm font-bold text-purple-900">Founding School Perks</p>
                        <p className="text-xs text-purple-700 mt-0.5">Extended free access + priority support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}