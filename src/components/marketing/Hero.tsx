import { Container } from './Container'
import { PrimaryButton, SecondaryButton, Pill } from './MiniUI'
import { CheckCircle2 } from 'lucide-react'

export function Hero() {
  return (
    <div className="bg-gradient-to-b from-white to-slate-50">
      <Container>
        <div className="py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <Pill>School ERP + Website + Apps</Pill>
            <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Run your entire school on{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                one modern platform
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Admissions, attendance, fees, exams, notices, website builder, parent portal, teacher tools and more.
              Fast, simple, and built for Indian schools.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <PrimaryButton href="/register">Start free trial</PrimaryButton>
              <SecondaryButton href="/pricing">View pricing</SecondaryButton>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
              {[
                'Works on mobile, tablet and desktop',
                'Installable app-like experience (PWA)',
                'Plan-wise access control and security',
                'Fast support and onboarding',
              ].map(t => (
                <div key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="text-emerald-600 mt-0.5" size={16} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-600/10 blur-2xl rounded-3xl" />
            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[8px] font-bold">VF</div>
                  <span className="text-xs text-slate-500 font-semibold">VidyaFlow Dashboard</span>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 font-semibold">Students</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">1,248</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 font-semibold">Attendance</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">92%</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 font-semibold">Fee Collection (This month)</p>
                  <div className="mt-3 h-16 rounded-xl bg-slate-50 flex items-end gap-1 p-2">
                    {[30, 40, 22, 55, 34, 66, 48, 72, 63].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-indigo-600 to-violet-500 rounded-md opacity-70" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 text-xs text-slate-500">
                ⚡ Loads fast on low-end devices. No heavy charts.
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}