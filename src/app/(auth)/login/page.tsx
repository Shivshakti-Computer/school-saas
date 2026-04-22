// FILE: src/app/(auth)/login/page.tsx
'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ══════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function Eye({ off = false }: { off?: boolean }) {
  return off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function Check({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// INPUT STYLE
// ══════════════════════════════════════════════════════════

const baseInput = [
  'w-full h-10 px-3 rounded-lg text-[13px] text-slate-800',
  'bg-white border border-slate-200',
  'placeholder:text-slate-400',
  'transition-all duration-150',
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10',
  'hover:border-slate-300',
].join(' ')

// ══════════════════════════════════════════════════════════
// FIELD WRAPPER
// ══════════════════════════════════════════════════════════

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// OTP INPUT — 6 boxes
// ══════════════════════════════════════════════════════════

function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: {
  value: string
  onChange: (val: string) => void
  length?: number
  disabled?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, char: string) => {
    if (!/^\d*$/.test(char)) return
    const arr = value.split('')
    arr[i] = char
    const joined = arr.join('').slice(0, length)
    onChange(joined)
    if (char && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(p)
    const focusIdx = Math.min(p.length, length - 1)
    refs.current[focusIdx]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          autoComplete="one-time-code"
          className={[
            'w-10 h-12 text-center text-base font-bold rounded-xl border-2',
            'outline-none transition-all duration-150 caret-transparent',
            value[i]
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-900',
            'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
          suppressHydrationWarning  // ← FIX
        />
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// 2FA SCREEN — Logic same, Notion design
// ══════════════════════════════════════════════════════════

function TwoFactorScreen({
  userData,
  onVerified,
  onCancel,
}: {
  userData: {
    userId: string
    tenantId: string
    maskedPhone: string
    userName: string
    userRole: string
  }
  onVerified: (deviceId?: string) => void
  onCancel: () => void
}) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [trustDevice, setTrustDevice] = useState(true)
  const [useBackup, setUseBackup] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Send OTP on mount
  useEffect(() => { sendOTP() }, [])

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  // Auto-submit when 6 digits
  useEffect(() => {
    if (otp.length === 6 && !loading) handleVerify()
  }, [otp])

  const sendOTP = async () => {
    setSending(true); setError('')
    try {
      const res = await fetch('/api/auth/2fa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.userId, tenantId: userData.tenantId }),
      })
      const data = await res.json()
      setSending(false)
      if (data.success) {
        setCountdown(60)
        setSuccessMsg('OTP sent!')
        setTimeout(() => setSuccessMsg(''), 3000)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch {
      setSending(false)
      setError('Failed to send OTP. Please try again.')
    }
  }

  const handleVerify = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.userId,
          tenantId: userData.tenantId,
          otp: useBackup ? undefined : otp,
          backupCode: useBackup ? backupCode.trim() : undefined,
          trustDevice,
          deviceName: navigator.userAgent.slice(0, 50),
          userName: userData.userName,
          userRole: userData.userRole,
        }),
      })
      const data = await res.json()
      setLoading(false)
      if (data.success && data.verified) {
        if (data.deviceId) localStorage.setItem('skolify_device_id', data.deviceId)
        if (data.warning) {
          setSuccessMsg(data.warning)
          setTimeout(() => onVerified(data.deviceId), 2000)
        } else {
          onVerified(data.deviceId)
        }
      } else {
        setError(data.message || 'Verification failed')
        setOtp('')
      }
    } catch {
      setLoading(false)
      setError('Verification failed. Please try again.')
      setOtp('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/80">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[11px]">SF</span>
            </div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Skolify</span>
          </Link>
          <button
            onClick={onCancel}
            className="text-[13px] text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Login
          </button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h1>
            <p className="text-[13px] text-slate-500 mt-1.5">
              OTP sent to <span className="font-mono font-semibold text-slate-700">{userData.maskedPhone}</span>
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="h-[3px] bg-blue-500" />
            <div className="p-6 space-y-5">

              {!useBackup ? (
                <>
                  {/* OTP boxes */}
                  <div className="space-y-3">
                    <p className="text-[12px] text-slate-500 text-center">Enter 6-digit OTP</p>
                    <OTPInput value={otp} onChange={v => { setOtp(v); setError('') }} disabled={loading} />
                  </div>

                  {/* Resend */}
                  <div className="text-center">
                    {countdown > 0
                      ? <p className="text-[12px] text-slate-400">Resend in <strong className="text-slate-600">{countdown}s</strong></p>
                      : <button onClick={sendOTP} disabled={sending} className="text-[12px] text-blue-600 font-semibold hover:underline disabled:opacity-50">
                        {sending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    }
                  </div>
                </>
              ) : (
                /* Backup code */
                <Field label="Backup Code" hint="Use one of your saved 8-character backup codes">
                  <input
                    type="text"
                    value={backupCode}
                    onChange={e => { setBackupCode(e.target.value.toUpperCase()); setError('') }}
                    className={`${baseInput} text-center font-mono tracking-widest uppercase`}
                    placeholder="XXXXXXXX"
                    maxLength={8}
                    disabled={loading}
                    autoComplete="off"
                  />
                </Field>
              )}

              {/* Success */}
              {successMsg && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                  <Check size={12} />
                  <p className="text-[12px] text-emerald-700">{successMsg}</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <p className="text-[12px] text-red-700">{error}</p>
                </div>
              )}

              {/* Trust device */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" checked={trustDevice} onChange={e => setTrustDevice(e.target.checked)} className="sr-only peer" />
                  <div className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all flex items-center justify-center">
                    {trustDevice && <Check size={10} />}
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-700">Trust this device</p>
                  <p className="text-[11px] text-slate-400">Skip 2FA for 30 days on this device</p>
                </div>
              </label>

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={loading || (!useBackup && otp.length < 6) || (useBackup && backupCode.length < 6)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading ? <><Spinner /> Verifying...</> : 'Verify & Login'}
              </button>

              {/* Toggle backup */}
              <button
                onClick={() => { setUseBackup(b => !b); setError(''); setOtp(''); setBackupCode('') }}
                className="w-full text-[12px] text-slate-500 hover:text-blue-600 transition-colors text-center"
              >
                {useBackup ? '← Use OTP instead' : 'Use backup code instead'}
              </button>

            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Powered by <span className="font-medium text-slate-500">Skolify</span>
          </p>
        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SUPERADMIN LOGIN — Minimal dark (same logic)
// ══════════════════════════════════════════════════════════

function SuperAdminLogin({
  form,
  setForm,
  error,
  loading,
  onSubmit,
}: {
  form: { email: string; password: string }
  setForm: (f: { email: string; password: string }) => void
  error: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="h-[2px] bg-slate-700" />
          <div className="p-6">
            <p className="text-[12px] font-medium text-slate-500 text-center mb-5 uppercase tracking-wider">
              System Access
            </p>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[12px] text-slate-500">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg text-[13px] bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-slate-600 transition-colors"
                  placeholder="admin@system.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] text-slate-500">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg text-[13px] bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-slate-600 transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Authenticating...' : 'Access System'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// LOGIN INNER — Main logic (unchanged)
// ══════════════════════════════════════════════════════════

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
  const [saForm, setSaForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  // 2FA
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<{
    userId: string
    tenantId: string
    maskedPhone: string
    userName: string
    userRole: string
  } | null>(null)

  useEffect(() => {
    const expired = searchParams.get('expired')
    const blocked = searchParams.get('blocked')
    if (expired === '1') setError('Your school subscription has expired. Please contact your school admin.')
    if (blocked) setError(`Module "${blocked}" is not available in your current plan.`)
  }, [searchParams])

  const navigateByRole = async () => {
    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const role = session?.user?.role
    if (isSuperAdmin || role === 'superadmin') router.push('/superadmin')
    else if (role === 'teacher') router.push('/teacher')
    else if (role === 'student') router.push('/student')
    else if (role === 'parent') router.push('/parent')
    else router.push('/admin')
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      let res

      if (isSuperAdmin) {
        if (!saForm.email.trim() || !saForm.password) {
          setError('Email and password are required')
          setLoading(false); return
        }
        res = await signIn('credentials', {
          redirect: false,
          email: saForm.email.trim(),
          password: saForm.password,
          type: 'superadmin',
        })
      } else {
        if (!form.schoolCode.trim()) { setError('Please enter your School Code'); setLoading(false); return }
        if (!form.phone.trim()) { setError('Please enter your Phone Number or Email'); setLoading(false); return }
        if (!form.password) { setError('Please enter your Password'); setLoading(false); return }

        const deviceId = localStorage.getItem('skolify_device_id') || ''
        res = await signIn('credentials', {
          redirect: false,
          phone: form.phone.trim(),
          password: form.password,
          subdomain: form.schoolCode.trim().toLowerCase(),
          deviceId,
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

      // Check 2FA
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()

      if (session?.user?.twoFactorRequired) {
        setTwoFactorData({
          userId: session.user.id,
          tenantId: session.user.tenantId,
          maskedPhone: form.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
          userName: session.user.name || '',
          userRole: session.user.role || '',
        })
        setShow2FA(true)
        return
      }

      await navigateByRole()
    } catch {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  const handle2FAVerified = async (deviceId?: string) => {
    const storedId = deviceId || localStorage.getItem('skolify_device_id') || ''
    const res = await signIn('credentials', {
      redirect: false,
      phone: form.phone.trim(),
      password: form.password,
      subdomain: form.schoolCode.trim().toLowerCase(),
      twoFactorVerified: 'true',
      deviceId: storedId,
    })
    if (res?.ok) await navigateByRole()
    else {
      setError('Login failed after 2FA. Please try again.')
      setShow2FA(false); setTwoFactorData(null)
    }
  }

  const handle2FACancel = () => {
    setShow2FA(false); setTwoFactorData(null)
    fetch('/api/auth/signout', { method: 'POST' }).catch(() => { })
  }

  // 2FA screen
  if (show2FA && twoFactorData) {
    return (
      <TwoFactorScreen
        userData={twoFactorData}
        onVerified={handle2FAVerified}
        onCancel={handle2FACancel}
      />
    )
  }

  // Superadmin
  if (isSuperAdmin) {
    return (
      <SuperAdminLogin
        form={saForm}
        setForm={setSaForm}
        error={error}
        loading={loading}
        onSubmit={handleSubmit}
      />
    )
  }

  // ══════════════════════════════════════════════════════════
  // SCHOOL LOGIN — Notion style
  // ══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/80">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[11px]">SF</span>
            </div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Skolify
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-slate-500 hidden sm:block">New school?</span>
            <Link href="/register" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Register →
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to your school
            </h1>
            <p className="text-[13px] text-slate-500 mt-2">
              Admin, Teacher, Student & Parent — all login here
            </p>
          </div>

          {/* Role pills */}
          <div className="flex items-center justify-center gap-2 mb-7 flex-wrap">
            {[
              { label: 'Admin', color: 'bg-blue-50 text-blue-600 border-blue-200' },
              { label: 'Teacher', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              { label: 'Student', color: 'bg-amber-50 text-amber-600 border-amber-200' },
              { label: 'Parent', color: 'bg-rose-50 text-rose-600 border-rose-200' },
            ].map(r => (
              <span
                key={r.label}
                className={`text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${r.color}`}
              >
                {r.label}
              </span>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">

            {/* Top strip */}
            <div className="h-[3px] bg-blue-500" />

            <div className="px-6 py-6 space-y-4">

              {/* School Code */}
              <Field
                label="School Code"
                hint="Ask your school admin for this code"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={form.schoolCode}
                    onChange={e => setForm(f => ({ ...f, schoolCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                    className={`${baseInput} font-mono pr-20`}
                    placeholder="e.g. dps_delhi"
                    required
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    autoFocus
                    suppressHydrationWarning  // ← FIX
                  />
                  {form.schoolCode && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </Field>

              {/* Phone / Email */}
              <Field label="Phone or Email">
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={baseInput}
                  placeholder="9876543210 or email@example.com"
                  required
                  autoComplete="username"
                />
              </Field>

              {/* Password */}
              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className={`${baseInput} pr-10`}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                    suppressHydrationWarning  // ← FIX
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    <Eye off={showPwd} />
                  </button>
                </div>
              </Field>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <p className="text-[12px] text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors"
              >
                {loading
                  ? <><Spinner /> Signing in...</>
                  : <>Sign in to Portal <ArrowRight /></>
                }
              </button>

            </div>
          </div>

          {/* How it works — simple, no heavy card */}
          <div className="mt-5 px-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              How login works
            </p>
            <div className="space-y-2">
              {[
                { n: '1', text: 'Enter School Code given by your admin' },
                { n: '2', text: 'Enter your Phone/Email and Password' },
                { n: '3', text: "You'll be redirected to your role's portal" },
              ].map(item => (
                <div key={item.n} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {item.n}
                  </span>
                  <p className="text-[12px] text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-6 space-y-3">
            <p className="text-center text-[12px] text-slate-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Register your school →
              </Link>
            </p>

            <div className="flex items-center justify-center gap-4">
              {[
                { icon: '🔒', text: 'Secure login' },
                { icon: '🏫', text: 'All roles' },
                { icon: '⚡', text: 'Instant access' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-slate-400">
              <Link href="/privacy" className="hover:text-blue-600 underline underline-offset-2 transition-colors">Privacy</Link>
              {' · '}
              <Link href="/terms" className="hover:text-blue-600 underline underline-offset-2 transition-colors">Terms</Link>
              {' · '}
              <Link href="/contact" className="hover:text-blue-600 underline underline-offset-2 transition-colors">Support</Link>
            </p>

            <p className="text-center text-[11px] text-slate-400">
              Powered by <span className="font-medium text-slate-500">Skolify</span>
              {' · '}
              <a href="https://shivshakticomputer.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
                Shivshakti Computer Academy
              </a>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PAGE EXPORT — Suspense same as before
// ══════════════════════════════════════════════════════════

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">SF</span>
          </div>
          <Spinner />
        </div>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}