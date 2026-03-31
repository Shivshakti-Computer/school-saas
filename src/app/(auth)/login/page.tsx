// FILE: src/app/login/page.tsx

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
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

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
      <path d="m21 2-9.6 9.6" />
      <circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  )
}

/* ─── Back to Home Button ─── */
function BackToHome() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
   OTP INPUT COMPONENT
   6-digit input boxes for 2FA verification
   ═══════════════════════════════════════════════════════ */
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return

    const newValue = value.split('')
    newValue[index] = char
    const joined = newValue.join('').slice(0, length)
    onChange(joined)

    // Auto-focus next
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    if (pasted.length === length) {
      inputRefs.current[length - 1]?.focus()
    } else {
      inputRefs.current[pasted.length]?.focus()
    }
  }

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={`
            w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200
            ${value[i]
              ? 'border-blue-500 bg-blue-50/50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-900'
            }
            focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
            hover:border-slate-300
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   2FA VERIFICATION SCREEN
   Shown after successful password login when 2FA is enabled
   ═══════════════════════════════════════════════════════ */
function TwoFactorScreen({
  userData,
  onVerified,
  onCancel,
}: {
  userData: { userId: string; tenantId: string; maskedPhone: string; userName: string; userRole: string }
  onVerified: (deviceId?: string) => void
  onCancel: () => void
}) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [trustDevice, setTrustDevice] = useState(true)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [otpSent, setOtpSent] = useState(false)

  // Send OTP on mount
  useEffect(() => {
    sendOTP()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerify()
    }
  }, [otp])

  const sendOTP = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.userId,
          tenantId: userData.tenantId,
        }),
      })
      const data = await res.json()
      setSending(false)

      if (data.success) {
        setOtpSent(true)
        setCountdown(60)
        setSuccess('OTP sent successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch {
      setSending(false)
      setError('Failed to send OTP. Please try again.')
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.userId,
          tenantId: userData.tenantId,
          otp: useBackupCode ? undefined : otp,
          backupCode: useBackupCode ? backupCode.trim() : undefined,
          trustDevice,
          deviceName: navigator.userAgent.slice(0, 50),
          userName: userData.userName,
          userRole: userData.userRole,
        }),
      })
      const data = await res.json()
      setLoading(false)

      if (data.success && data.verified) {
        // Store trusted device ID
        if (data.deviceId) {
          localStorage.setItem('skolify_device_id', data.deviceId)
        }
        if (data.warning) {
          setSuccess(data.warning)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/[0.05] rounded-full blur-[120px]" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xs">SF</span>
          </div>
          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Skolify</span>
        </Link>
        <BackToHome />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <ShieldIcon />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter the OTP sent to your registered phone
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

            {/* Phone Info */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">OTP sent to</span>
              </div>
              <p className="text-lg font-mono font-bold text-blue-800 tracking-wider">
                {userData.maskedPhone}
              </p>
            </div>

            {!useBackupCode ? (
              <>
                {/* OTP Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                    Enter 6-digit OTP
                  </label>
                  <OTPInput
                    value={otp}
                    onChange={(val) => { setOtp(val); setError('') }}
                    disabled={loading}
                  />
                </div>

                {/* Resend OTP */}
                <div className="text-center mb-5">
                  {countdown > 0 ? (
                    <p className="text-xs text-slate-400">
                      Resend OTP in <span className="font-semibold text-blue-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={sendOTP}
                      disabled={sending}
                      className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Backup Code Input */
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Enter Backup Code
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={e => { setBackupCode(e.target.value.toUpperCase()); setError('') }}
                  className={`${inputClass} text-center font-mono text-lg tracking-widest uppercase`}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  disabled={loading}
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-slate-400 text-center">
                  Use one of your saved backup codes
                </p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Trust Device */}
            <label className="flex items-center gap-3 mb-5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={e => setTrustDevice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all flex items-center justify-center">
                  {trustDevice && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-700 font-medium group-hover:text-slate-900">Trust this device</p>
                <p className="text-xs text-slate-400">Skip 2FA on this device for 30 days</p>
              </div>
            </label>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || (!useBackupCode && otp.length < 6) || (useBackupCode && backupCode.length < 6)}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Spinner /> Verifying...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldIcon />
                  Verify & Login
                </span>
              )}
            </button>

            {/* Toggle: OTP ↔ Backup Code */}
            <div className="mt-4 text-center">
              <button
                onClick={() => { setUseBackupCode(!useBackupCode); setError(''); setOtp(''); setBackupCode('') }}
                className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors flex items-center gap-1.5 mx-auto"
              >
                <KeyIcon />
                {useBackupCode ? 'Use OTP instead' : 'Use backup code instead'}
              </button>
            </div>

            {/* Cancel */}
            <div className="mt-3 text-center">
              <button
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
              >
                Cancel & go back to login
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-slate-400">
              Powered by <span className="font-semibold text-slate-500">Skolify</span>
              {' · '}
              <a href="https://shivshakticomputer.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
                Shivshakti Computer Academy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOGIN INNER — Updated with 2FA Flow
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

  // ── 2FA State ──
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

        // Get trusted device ID from localStorage
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

      // ── Check if 2FA is required ──
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()

      if (session?.user?.twoFactorRequired) {
        // Show 2FA screen
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

      // No 2FA — navigate directly
      await navigateByRole()

    } catch {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  const handle2FAVerified = async (deviceId?: string) => {
    // Re-sign in with 2FA flag
    const deviceStoredId = deviceId || localStorage.getItem('skolify_device_id') || ''

    const res = await signIn('credentials', {
      redirect: false,
      phone: form.phone.trim(),
      password: form.password,
      subdomain: form.schoolCode.trim().toLowerCase(),
      twoFactorVerified: 'true',
      deviceId: deviceStoredId,
    })

    if (res?.ok) {
      await navigateByRole()
    } else {
      setError('Login failed after 2FA. Please try again.')
      setShow2FA(false)
      setTwoFactorData(null)
    }
  }

  const handle2FACancel = () => {
    setShow2FA(false)
    setTwoFactorData(null)
    // Sign out the partial session
    fetch('/api/auth/signout', { method: 'POST' }).catch(() => {})
  }

  // ── Show 2FA screen ──
  if (show2FA && twoFactorData) {
    return (
      <TwoFactorScreen
        userData={twoFactorData}
        onVerified={handle2FAVerified}
        onCancel={handle2FACancel}
      />
    )
  }

  /* ── SUPERADMIN ── */
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
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/[0.05] rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xs">SF</span>
          </div>
          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Skolify</span>
        </Link>
        <BackToHome />
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <span className="text-white font-extrabold text-xl">SF</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to your school portal</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

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
                <label className="block text-sm font-semibold text-slate-700 mb-2">School Code</label>
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
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#94A3B8" strokeWidth="1.5" /><path d="M8 7.5v4M8 5.5h.01" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  Ask your school admin for this code
                </p>
              </div>

              {/* Phone / Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number or Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><Spinner /> Signing in...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In to Portal
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
              How does login work?
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: <>Enter your <strong className="text-slate-800">School Code</strong> provided during registration</>, color: 'bg-blue-100 text-blue-700' },
                { step: '2', text: <>Enter your <strong className="text-slate-800">Phone/Email</strong> and <strong className="text-slate-800">Password</strong></>, color: 'bg-indigo-100 text-indigo-700' },
                { step: '3', text: <>You&apos;ll be <strong className="text-slate-800">auto-redirected</strong> to your role-specific portal</>, color: 'bg-emerald-100 text-emerald-700' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>{item.step}</span>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Register */}
          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              New school?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">Register here →</Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-slate-400">
              Powered by <span className="font-semibold text-slate-500">Skolify</span>
              {' · '}
              <a href="https://shivshakticomputer.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">Shivshakti Computer Academy</a>
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

/* ── Page Export ── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <Spinner />
        </div>
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}