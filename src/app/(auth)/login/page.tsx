'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Secret superadmin access: /login?sa=1
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

  // Show messages from redirects
  useEffect(() => {
    const expired = searchParams.get('expired')
    const blocked = searchParams.get('blocked')
    if (expired === '1') {
      setError('Your school subscription has expired. Please contact your school admin.')
    }
    if (blocked) {
      setError(`Module "${blocked}" is not available in your current plan.`)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let res

      if (isSuperAdmin) {
        // ── Superadmin Login ──
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
        // ── School Login (admin/teacher/student/parent) ──
        if (!form.schoolCode.trim()) {
          setError('Please enter your School Code')
          setLoading(false)
          return
        }
        if (!form.phone.trim()) {
          setError('Please enter your Phone Number or Email')
          setLoading(false)
          return
        }
        if (!form.password) {
          setError('Please enter your Password')
          setLoading(false)
          return
        }

        res = await signIn('credentials', {
          redirect: false,
          phone: form.phone.trim(),
          password: form.password,
          subdomain: form.schoolCode.trim().toLowerCase(),
          // NOTE: type is NOT sent for school login
          // auth.ts treats non-superadmin as school login automatically
        })
      }

      setLoading(false)

      if (res?.error) {
        if (isSuperAdmin) {
          setError('Invalid email or password')
        } else {
          setError('Login failed. Please check your School Code, Phone/Email, and Password.')
        }
        return
      }

      if (!res?.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      // ── SUCCESS: Let middleware handle role-based redirect ──
      // Fetch session to get role, then redirect accordingly
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()
      const role = session?.user?.role

      if (isSuperAdmin || role === 'superadmin') {
        router.push('/superadmin')
      } else if (role === 'teacher') {
        router.push('/teacher')
      } else if (role === 'student') {
        router.push('/student')
      } else if (role === 'parent') {
        router.push('/parent')
      } else {
        // Default: admin
        router.push('/admin')
      }

      router.refresh()

    } catch (err) {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  // ════════════════════════════════════════
  // SUPERADMIN LOGIN (Hidden, dark theme)
  // ════════════════════════════════════════
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-200">System Access</h1>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="admin@system.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800/50 rounded-xl px-3 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Access'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════
  // SCHOOL LOGIN (All roles: Admin, Teacher, Student, Parent)
  // ════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full opacity-60" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-extrabold text-lg">VF</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Welcome to VidyaFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Login to your school portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/50 p-6">

          {/* Role indicator */}
          <div className="mb-5 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span className="text-xs font-semibold text-indigo-700">All Roles Login Here</span>
            </div>
            <p className="text-[11px] text-indigo-600/80 leading-relaxed">
              Admin, Teacher, Student, and Parent — everyone logs in from this page. 
              You will be automatically redirected to your portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* School Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                School Code
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.schoolCode}
                  onChange={e => setForm(f => ({ ...f, schoolCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="e.g. dps_delhi"
                  required
                  autoComplete="off"
                  autoCapitalize="off"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Ask your school admin for this code
              </p>
            </div>

            {/* Phone / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number or Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="9876543210 or email@example.com"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-indigo-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        {/* How it works */}
        <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            How does login work?
          </h3>

          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p className="text-xs text-slate-600">Enter your <strong>School Code</strong> (given by your school admin during registration)</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p className="text-xs text-slate-600">Enter your <strong>Phone or Email</strong> and <strong>Password</strong> (created by school admin)</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p className="text-xs text-slate-600">You will be <strong>automatically redirected</strong> to your portal based on your role</p>
            </div>
          </div>

          {/* Role chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { role: 'Admin', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
              { role: 'Teacher', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { role: 'Student', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { role: 'Parent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map(r => (
              <span key={r.role} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${r.color}`}>
                {r.role}
              </span>
            ))}
          </div>
        </div>

        {/* Register link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-500">
            New school?{' '}
            <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
              Register here →
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          Powered by <span className="font-semibold">VidyaFlow</span> — A unit of Shivshakti Computer Academy
        </p>
      </div>
    </div>
  )
}