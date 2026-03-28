// FILE: src/app/login/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

/* ─── Icons ─── */
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

/* ─── Shared Input Style ─── */
const inputClass = `
  w-full py-2.5 rounded-xl text-sm transition-all
  bg-[#0B1120] border border-[#1E293B]
  text-slate-200 placeholder-slate-600
  focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25
`

/* ═══════════════════════════════════════════════════════
   LOGIN INNER (needs useSearchParams → Suspense)
   ═══════════════════════════════════════════════════════ */
function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuperAdmin = searchParams.get('sa') === '1'

  const [form, setForm] = useState({
    schoolCode: '',
    phone: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const expired = searchParams.get('expired')
    const blocked = searchParams.get('blocked')
    if (expired === '1') setError('Your school subscription has expired. Please contact your school admin.')
    if (blocked) setError(`Module "${blocked}" is not available in your current plan.`)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let res

      if (isSuperAdmin) {
        if (!form.email.trim() || !form.password) {
          setError('Email and password are required')
          setLoading(false)
          return
        }
        res = await signIn('credentials', {
          redirect: false,
          email: form.email.trim(),
          password: form.password,
          type: 'superadmin',
        })
      } else {
        if (!form.schoolCode.trim()) { setError('Please enter your School Code'); setLoading(false); return }
        if (!form.phone.trim()) { setError('Please enter your Phone Number or Email'); setLoading(false); return }
        if (!form.password) { setError('Please enter your Password'); setLoading(false); return }

        res = await signIn('credentials', {
          redirect: false,
          phone: form.phone.trim(),
          password: form.password,
          subdomain: form.schoolCode.trim().toLowerCase(),
        })
      }

      setLoading(false)

      if (res?.error) {
        setError(isSuperAdmin ? 'Invalid email or password' : 'Login failed. Check your School Code, Phone/Email and Password.')
        return
      }
      if (!res?.ok) { setError('Something went wrong. Please try again.'); return }

      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const role = session?.user?.role

      if (isSuperAdmin || role === 'superadmin') router.push('/superadmin')
      else if (role === 'teacher') router.push('/teacher')
      else if (role === 'student') router.push('/student')
      else if (role === 'parent') router.push('/parent')
      else router.push('/admin')

      router.refresh()
    } catch {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  /* ── SUPERADMIN (Hidden) ── */
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-300">System Access</h1>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`${inputClass} px-3`}
                  placeholder="admin@system.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`${inputClass} px-3`}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#1E293B] hover:bg-[#334155] text-slate-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 border border-[#334155]"
              >
                {loading ? 'Authenticating...' : 'Access'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  /* ── SCHOOL LOGIN ── */
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/[0.06] blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-extrabold text-lg">VF</span>
          </div>
          <h1 className="text-xl font-bold text-white">Welcome to VidyaFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Login to your school portal</p>
        </div>

        {/* Card */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 shadow-2xl shadow-black/20">
          {/* Role info */}
          <div className="mb-5 bg-indigo-500/[0.08] border border-indigo-500/[0.15] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-xs font-semibold text-indigo-400">All Roles Login Here</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Admin, Teacher, Student & Parent — everyone logs in from this page.
              You&apos;ll be auto-redirected to your portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">School Code</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.schoolCode}
                  onChange={e => setForm(f => ({ ...f, schoolCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                  className={`${inputClass} pl-10 pr-3`}
                  placeholder="e.g. dps_delhi"
                  required
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-600">Ask your school admin for this code</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number or Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={`${inputClass} pl-10 pr-3`}
                  placeholder="9876543210 or email@example.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`${inputClass} pl-10 pr-10`}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-3 rounded-xl text-sm font-semibold transition-all
                bg-gradient-to-r from-indigo-600 to-purple-600
                text-white shadow-lg shadow-indigo-500/20
                hover:shadow-indigo-500/30 hover:-translate-y-0.5
                disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none
              "
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Logging in...
                </span>
              ) : 'Login →'}
            </button>
          </form>
        </div>

        {/* How it works */}
        <div className="mt-4 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" x2="12.01" y1="17" y2="17" />
            </svg>
            How does login work?
          </h3>

          <div className="space-y-2.5">
            {[
              { step: '1', text: <>Enter your <strong className="text-slate-300">School Code</strong> (given during registration)</> },
              { step: '2', text: <>Enter your <strong className="text-slate-300">Phone/Email</strong> and <strong className="text-slate-300">Password</strong></> },
              { step: '3', text: <>You&apos;ll be <strong className="text-slate-300">auto-redirected</strong> to your portal</> },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.step}
                </span>
                <p className="text-[12px] text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { role: 'Admin', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { role: 'Teacher', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { role: 'Student', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
              { role: 'Parent', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
            ].map(r => (
              <span key={r.role} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${r.color}`}>
                {r.role}
              </span>
            ))}
          </div>
        </div>

        {/* Register link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">
            New school?{' '}
            <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
              Register here →
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Powered by <span className="font-semibold text-slate-500">VidyaFlow</span> — A unit of Shivshakti Computer Academy
        </p>
      </div>
    </div>
  )
}

/* ── Page Export with Suspense ── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}