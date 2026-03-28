// FILE: src/app/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ─── Spinner ─── */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

/* ─── Shared Input ─── */
const inputClass = `
  w-full px-3 py-2.5 rounded-xl text-sm transition-all
  bg-[#0B1120] border border-[#1E293B]
  text-slate-200 placeholder-slate-600
  focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25
`

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState<{
    schoolCode: string
    schoolName: string
    adminName: string
    phone: string
    trialDays: number
  } | null>(null)

  const [form, setForm] = useState({
    schoolName: '',
    schoolCode: '',
    address: '',
    adminName: '',
    phone: '',
    email: '',
    password: '',
    confirmPwd: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const autoCode = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 30)

  const validateStep1 = () => {
    if (!form.schoolName.trim()) { setError('School name is required'); return false }
    if (!form.schoolCode.trim()) { setError('School code is required'); return false }
    if (form.schoolCode.length < 3) { setError('School code must be at least 3 characters'); return false }
    if (!/^[a-z0-9_-]+$/.test(form.schoolCode)) {
      setError('School code: only lowercase letters, numbers, underscore, hyphen allowed')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      if (validateStep1()) setStep(2)
      return
    }

    if (!form.adminName.trim()) { setError('Admin name is required'); return }
    if (!form.phone.trim() || form.phone.trim().length < 10) { setError('Enter a valid 10-digit phone number'); return }
    if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (form.password !== form.confirmPwd) { setError('Passwords do not match'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/schools/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: form.schoolName.trim(),
          subdomain: form.schoolCode.trim(),
          address: form.address.trim(),
          adminName: form.adminName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) { setError(data.error || 'Registration failed.'); return }

      setSuccess({
        schoolCode: data.schoolCode,
        schoolName: form.schoolName,
        adminName: form.adminName,
        phone: form.phone,
        trialDays: 15,
      })
    } catch {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  /* ════════════════════════════════════════
     SUCCESS SCREEN
     ════════════════════════════════════════ */
  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-600/[0.06] blur-[120px]" />
        </div>

        <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl shadow-black/20 p-8 w-full max-w-md">
          {/* Success icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">School Registered!</h2>
            <p className="text-sm text-slate-500 mt-1">
              Your {success.trialDays}-day free trial has started
            </p>
          </div>

          {/* Credentials */}
          <div className="bg-[#0B1120] border border-[#1E293B] rounded-xl p-4 space-y-3">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Your Login Details
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">School Code</span>
                <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-mono">
                  {success.schoolCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Phone</span>
                <span className="text-sm font-medium text-slate-300">{success.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Role</span>
                <span className="text-sm font-medium text-slate-300">Admin</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" x2="12" y1="9" y2="13" />
                  <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                Save your School Code — teachers, students & parents need it to login.
              </p>
            </div>
          </div>

          {/* Next steps */}
          <div className="mt-5 space-y-2.5">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              What to do next
            </h3>
            {[
              'Login with School Code + Phone + Password',
              'Add teachers and students from admin panel',
              'Share School Code with teachers & parents',
              'Explore features — upgrade plan when ready',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-500">{item}</p>
              </div>
            ))}
          </div>

          {/* Login button */}
          <Link
            href="/login"
            className="
              mt-6 flex w-full justify-center items-center gap-2
              bg-gradient-to-r from-indigo-600 to-purple-600
              text-white py-3 rounded-xl text-sm font-semibold
              transition-all shadow-lg shadow-indigo-500/20
              hover:shadow-indigo-500/30 hover:-translate-y-0.5
            "
          >
            Go to Login →
          </Link>

          <p className="text-center text-[11px] text-slate-600 mt-4">
            Login URL:{' '}
            <span className="font-medium text-slate-500">
              {typeof window !== 'undefined' ? window.location.origin : ''}/login
            </span>
          </p>
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════
     REGISTRATION FORM
     ════════════════════════════════════════ */
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

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-extrabold text-lg">VF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your School</h1>
          <p className="text-sm text-slate-500 mt-1">14-day free trial — no credit card required</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= 1 ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-slate-500'
            }`}>
              {step > 1 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : '1'}
            </div>
            <span className={`text-xs font-medium ${step >= 1 ? 'text-slate-300' : 'text-slate-600'}`}>
              School Info
            </span>
          </div>

          <div className={`w-10 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-[#1E293B]'}`} />

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= 2 ? 'bg-indigo-600 text-white' : 'bg-[#1E293B] text-slate-500'
            }`}>
              2
            </div>
            <span className={`text-xs font-medium ${step >= 2 ? 'text-slate-300' : 'text-slate-600'}`}>
              Admin Account
            </span>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl shadow-black/20 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                {/* School Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    School Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.schoolName}
                    onChange={e => {
                      set('schoolName', e.target.value)
                      if (!form.schoolCode || form.schoolCode === autoCode(form.schoolName)) {
                        set('schoolCode', autoCode(e.target.value))
                      }
                    }}
                    className={inputClass}
                    placeholder="e.g. Delhi Public School"
                    required
                  />
                </div>

                {/* School Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    School Code <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={form.schoolCode}
                      onChange={e => set('schoolCode', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className={`${inputClass} pl-10 font-mono`}
                      placeholder="e.g. dps_delhi"
                      required
                      autoCapitalize="off"
                      autoComplete="off"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    Used by all users to login. Choose something easy to remember.
                  </p>
                  {form.schoolCode && (
                    <div className="mt-1.5 bg-indigo-500/10 border border-indigo-500/15 rounded-lg px-2.5 py-1.5">
                      <p className="text-[11px] text-indigo-400">
                        School Code: <strong className="font-mono">{form.schoolCode}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">City / Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Ambikapur, Chhattisgarh"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Admin Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Admin Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.adminName}
                    onChange={e => set('adminName', e.target.value)}
                    className={inputClass}
                    placeholder="Principal or school owner name"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    className={inputClass}
                    placeholder="9876543210"
                    required
                    maxLength={10}
                  />
                  <p className="mt-1 text-[11px] text-slate-600">This will be your login ID</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Email <span className="text-slate-600 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={inputClass}
                    placeholder="school@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className={inputClass}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPwd}
                    onChange={e => set('confirmPwd', e.target.value)}
                    className={inputClass}
                    placeholder="Re-enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="mt-1.5 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? '🙈 Hide passwords' : '👁 Show passwords'}
                  </button>
                </div>
              </>
            )}

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

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex-1 py-2.5 border border-[#1E293B] bg-[#0B1120] text-slate-400 text-sm font-semibold rounded-xl hover:bg-[#1E293B] transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="
                  flex-1 py-3 rounded-xl text-sm font-semibold transition-all
                  bg-gradient-to-r from-indigo-600 to-purple-600
                  text-white shadow-lg shadow-indigo-500/20
                  hover:shadow-indigo-500/30 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:hover:translate-y-0
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Registering...
                  </span>
                ) : step === 1 ? 'Next →' : 'Register School'}
              </button>
            </div>
          </form>
        </div>

        {/* Login link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
              Login here →
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          Powered by <span className="font-semibold text-slate-500">VidyaFlow</span> — A unit of Shivshakti Computer Academy
        </p>
      </div>
    </div>
  )
}