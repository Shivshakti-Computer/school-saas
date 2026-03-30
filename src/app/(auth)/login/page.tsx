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

/* ─── Back to Home Button ─── */
function BackToHome() {
  return (
    <Link
      href="/"
      className={[
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
        'bg-white/80 hover:bg-white',
        'border border-slate-200 hover:border-slate-300',
        'text-slate-600 hover:text-slate-900',
        'text-sm font-medium',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'backdrop-blur-sm',
      ].join(' ')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Back to Home
    </Link>
  )
}

/* ─── Input Style ─── */
const inputClass = `
  w-full py-3 px-4 rounded-xl text-sm transition-all duration-200
  bg-white border border-slate-200
  text-slate-900 placeholder-slate-400
  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
  hover:border-slate-300
`

/* ═══════════════════════════════════════════════════════
   LOGIN INNER
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
        setError(isSuperAdmin
          ? 'Invalid email or password'
          : 'Login failed. Check your School Code, Phone/Email and Password.')
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

  /* ── SUPERADMIN (Hidden, kept dark) ── */
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-slate-400">System Access</h1>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-all"
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
                  className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-all"
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
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 border border-slate-700"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 flex flex-col relative overflow-hidden">

      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/[0.05] rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ─── Top Bar ─── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        {/* Skolify Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xs">VF</span>
          </div>
          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            Skolify
          </span>
        </Link>

        {/* Back to Home */}
        <BackToHome />
      </div>

      {/* ─── Main Content ─── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <span className="text-white font-extrabold text-xl">VF</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to your school portal</p>
          </div>

          {/* ─── Main Card ─── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-elevated p-8">

            {/* Role info banner */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-xs font-bold text-blue-700">All Roles Login Here</span>
              </div>
              <p className="text-[12px] text-blue-600/80 leading-relaxed">
                Admin, Teacher, Student & Parent — all login from this single page.
                You&apos;ll be auto-redirected to your portal.
              </p>

              {/* Role badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { role: 'Admin', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { role: 'Teacher', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                  { role: 'Student', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
                  { role: 'Parent', bg: 'bg-rose-100 text-rose-700 border-rose-200' },
                ].map(r => (
                  <span key={r.role} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${r.bg}`}>
                    {r.role}
                  </span>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* School Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  School Code
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={form.schoolCode}
                    onChange={e => setForm(f => ({ ...f, schoolCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                    className={`${inputClass} pl-10`}
                    placeholder="e.g. dps_delhi"
                    required
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#94A3B8" strokeWidth="1.5" />
                    <path d="M8 7.5v4M8 5.5h.01" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Ask your school admin for this code
                </p>
              </div>

              {/* Phone / Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={`${inputClass} pl-10`}
                    placeholder="9876543210 or email@example.com"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className={`${inputClass} pl-10 pr-12`}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  text-white shadow-lg shadow-blue-500/25
                  hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5
                  active:translate-y-0
                  disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In to Portal
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>

            </form>
          </div>

          {/* ─── How it works card ─── */}
          <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 shadow-soft">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
              How does login work?
            </h3>

            <div className="space-y-3">
              {[
                {
                  step: '1',
                  text: <>Enter your <strong className="text-slate-800">School Code</strong> provided during registration</>,
                  color: 'bg-blue-100 text-blue-700',
                },
                {
                  step: '2',
                  text: <>Enter your <strong className="text-slate-800">Phone/Email</strong> and <strong className="text-slate-800">Password</strong></>,
                  color: 'bg-indigo-100 text-indigo-700',
                },
                {
                  step: '3',
                  text: <>You&apos;ll be <strong className="text-slate-800">auto-redirected</strong> to your role-specific portal</>,
                  color: 'bg-emerald-100 text-emerald-700',
                },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>
                    {item.step}
                  </span>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Register Link ─── */}
          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              New school?{' '}
              <Link
                href="/register"
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
              >
                Register here →
              </Link>
            </p>
          </div>

          {/* ─── Footer ─── */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-slate-400">
              Powered by{' '}
              <span className="font-semibold text-slate-500">Skolify</span>
              {' '}·{' '}
              <a
                href="https://shivshakticomputer.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-600 transition-colors"
              >
                Shivshakti Computer Academy
              </a>
            </p>
            <div className="mt-2 flex justify-center gap-3 text-[11px] text-slate-400">
              <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms</Link>
              <span>·</span>
              <Link href="/contact" className="hover:text-slate-600 transition-colors">Support</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Page Export with Suspense ── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-sm">VF</span>
          </div>
          <Spinner />
        </div>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}