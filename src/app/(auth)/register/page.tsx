// FILE: src/app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function Eye({ off = false }) {
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

function Check({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function ArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function ChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function RefreshIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function Field({
  label, required, optional, hint, children,
}: {
  label: string; required?: boolean; optional?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[13px] font-medium text-slate-700">{label}</label>
        {required && <span className="text-[11px] text-red-400">*</span>}
        {optional && <span className="text-[11px] text-slate-400 font-normal">— optional</span>}
      </div>
      {children}
      {hint && <p className="text-[11px] text-slate-400 leading-relaxed">{hint}</p>}
    </div>
  )
}

const baseInput = [
  'w-full h-10 px-3 rounded-lg text-[13px] text-slate-800',
  'bg-white border border-slate-200',
  'placeholder:text-slate-400',
  'transition-all duration-150',
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10',
  'hover:border-slate-300',
].join(' ')

function StepPills({ current }: { current: number }) {
  const steps = ['School', 'Admin', 'Verify']
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const done = current > n
        const active = current === n
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`
              flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-300
              ${done ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : active ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-slate-100 text-slate-400 border border-slate-200'}
            `}>
              {done
                ? <span className="text-emerald-500"><Check size={11} /></span>
                : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? 'bg-white/20' : ''}`}>{n}</span>
              }
              <span>{label}</span>
            </div>
            {i < 2 && (
              <div className={`w-6 h-px transition-colors duration-300 ${current > n ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// OTP CHANNEL CONFIG
// ══════════════════════════════════════════════════════════

type OtpChannel = 'sms' | 'email'

const SMS_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 18a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 7.35h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 15a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const EMAIL_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const channelMeta: Record<OtpChannel, {
  label: string
  sublabel: string
  icon: React.ReactNode
  iconBg: string
  btnBg: string
  btnHover: string
  btnShadow: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
}> = {
  sms: {
    label: 'SMS (Text Message)',
    sublabel: 'Faster · Instant delivery',
    icon: SMS_ICON,
    iconBg: 'bg-green-100',
    btnBg: 'bg-green-600',
    btnHover: 'hover:bg-green-700',
    btnShadow: 'shadow-green-200',
    badgeBg: 'bg-green-50',
    badgeText: 'text-green-700',
    badgeBorder: 'border-green-200',
  },
  email: {
    label: 'Email',
    sublabel: 'Check your inbox / spam folder',
    icon: EMAIL_ICON,
    iconBg: 'bg-blue-100',
    btnBg: 'bg-blue-600',
    btnHover: 'hover:bg-blue-700',
    btnShadow: 'shadow-blue-200',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
}

// ══════════════════════════════════════════════════════════
// OTP CHANNEL SELECTOR COMPONENT
// ══════════════════════════════════════════════════════════

function OtpChannelSelector({
  selected,
  hasEmail,
  sendingChannel,
  onChannelChange,   // sirf channel change — no OTP send
  onSend,            // "Send OTP" button click
}: {
  selected: OtpChannel
  hasEmail: boolean
  sendingChannel: OtpChannel | null
  onChannelChange: (ch: OtpChannel) => void  // ← KEY FIX
  onSend: (ch: OtpChannel) => void
}) {
  const [open, setOpen] = useState(false)
  const meta = channelMeta[selected]
  const other: OtpChannel = selected === 'sms' ? 'email' : 'sms'
  const otherMeta = channelMeta[other]
  const isSending = sendingChannel !== null

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium text-slate-600 text-center">
        Send OTP verification code via:
      </p>

      {/* ── Dropdown trigger ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (hasEmail && !isSending) setOpen(o => !o)
          }}
          disabled={isSending}
          className={[
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white text-left',
            'transition-all duration-150',
            isSending
              ? 'opacity-60 cursor-not-allowed border-slate-200'
              : hasEmail
              ? 'cursor-pointer border-slate-200 hover:border-slate-300 hover:shadow-sm'
              : 'cursor-default border-slate-200',
          ].join(' ')}
        >
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg ${meta.iconBg} flex items-center justify-center flex-shrink-0`}>
            {meta.icon}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800">{meta.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{meta.sublabel}</p>
          </div>

          {/* Right — chevron or "only" badge */}
          {hasEmail ? (
            <div className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
              only option
            </span>
          )}
        </button>

        {/* ── Dropdown menu ── */}
        {open && hasEmail && (
          <>
            {/* Invisible backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />

            {/* Menu */}
            <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Choose method
                </p>
              </div>

              {/* SMS option */}
              <button
                type="button"
                onClick={() => {
                  // ✅ FIX: channel change karo aur dropdown band karo
                  onChannelChange('sms')
                  setOpen(false)
                }}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  selected === 'sms'
                    ? 'bg-green-50 border-l-2 border-green-500'
                    : 'hover:bg-slate-50 border-l-2 border-transparent',
                ].join(' ')}
              >
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  {SMS_ICON}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-700">SMS (Text Message)</p>
                  <p className="text-[11px] text-slate-400">Faster · Instant delivery</p>
                </div>
                {selected === 'sms' && (
                  <span className="text-green-600 flex-shrink-0"><Check size={13} /></span>
                )}
              </button>

              {/* Email option */}
              <button
                type="button"
                onClick={() => {
                  // ✅ FIX: channel change karo aur dropdown band karo
                  onChannelChange('email')
                  setOpen(false)
                }}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-t border-slate-100',
                  selected === 'email'
                    ? 'bg-blue-50 border-l-2 border-blue-500'
                    : 'hover:bg-slate-50 border-l-2 border-transparent',
                ].join(' ')}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {EMAIL_ICON}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-700">Email</p>
                  <p className="text-[11px] text-slate-400">Check your inbox / spam folder</p>
                </div>
                {selected === 'email' && (
                  <span className="text-blue-600 flex-shrink-0"><Check size={13} /></span>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Send OTP Button ── */}
      <button
        type="button"
        onClick={() => onSend(selected)}
        disabled={isSending}
        className={[
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl',
          'text-[13px] font-semibold text-white transition-all duration-150',
          'shadow-sm',
          meta.btnBg,
          meta.btnHover,
          `shadow-${selected === 'sms' ? 'green' : 'blue'}-200`,
          isSending ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {isSending ? (
          <><Spinner /> Sending OTP...</>
        ) : (
          <>Send OTP via {selected === 'sms' ? 'SMS' : 'Email'} <ArrowRight size={13} /></>
        )}
      </button>

      {/* ── Hint ── */}
      {hasEmail && (
        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          Didn't get SMS? Try Email from Dropdown Instead
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('sms')
  const [sendingChannel, setSendingChannel] = useState<OtpChannel | null>(null)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [verified, setVerified] = useState(false)
  const [vToken, setVToken] = useState('')

  const [success, setSuccess] = useState<{
    schoolCode: string; schoolName: string; adminName: string; phone: string; trialDays: number
  } | null>(null)

  const [form, setForm] = useState({
    schoolName: '', schoolCode: '', address: '',
    adminName: '', phone: '', email: '',
    password: '', confirmPwd: '',
  })

  const set = (k: string, v: string) => { setError(''); setForm(f => ({ ...f, [k]: v })) }

  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 30)

  // ── OTP handlers ──
  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return
    const n = [...otpValues]; n[i] = v.slice(-1); setOtpValues(n); setError('')
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[i] && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (p.length === 6) { setOtpValues(p.split('')); setError('') }
  }

  const startCooldown = (s = 60) => {
    setCooldown(s)
    const t = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 })
    }, 1000)
  }

  const sendOTP = async (ch: OtpChannel) => {
    setSendingChannel(ch); setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, email: form.email, channel: ch }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send OTP'); return }
      setOtpChannel(ch)
      setOtpSent(true)
      setOtpValues(['', '', '', '', '', ''])
      startCooldown(60)
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100)
    } catch { setError('Failed to send OTP.') }
    finally { setSendingChannel(null) }
  }

  const verifyOTP = async () => {
    const otp = otpValues.join('')
    if (otp.length !== 6) { setError('Enter complete 6-digit OTP'); return }
    setOtpVerifying(true); setError('')
    try {
      const id = otpChannel === 'sms'
        ? form.phone.replace(/\D/g, '')
        : form.email.toLowerCase().trim()
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, otp, purpose: 'registration' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid OTP'); return }
      setVToken(data.verificationToken)
      setVerified(true)
      setOtpSent(false)
    } catch { setError('Verification failed.') }
    finally { setOtpVerifying(false) }
  }

  const v1 = () => {
    if (!form.schoolName.trim()) { setError('School name required'); return false }
    if (!form.schoolCode.trim() || form.schoolCode.length < 3) { setError('School code min 3 chars'); return false }
    if (!/^[a-z0-9_-]+$/.test(form.schoolCode)) { setError('Code: lowercase, numbers, _ or - only'); return false }
    return true
  }

  const v2 = () => {
    if (!form.adminName.trim()) { setError('Admin name required'); return false }
    if (form.phone.replace(/\D/g, '').length !== 10) { setError('Valid 10-digit phone required'); return false }
    if (form.password.length < 6) { setError('Password min 6 characters'); return false }
    if (form.password !== form.confirmPwd) { setError('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (step === 1) { if (v1()) setStep(2); return }
    if (step === 2) { if (v2()) setStep(3); return }
    if (!verified || !vToken) { setError('Please verify phone first'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/schools/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: form.schoolName.trim(), subdomain: form.schoolCode.trim(),
          address: form.address.trim(), adminName: form.adminName.trim(),
          phone: form.phone.trim(), email: form.email.trim(),
          password: form.password, verificationToken: vToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setSuccess({
        schoolCode: data.schoolCode, schoolName: form.schoolName,
        adminName: form.adminName, phone: form.phone, trialDays: data.trialDays,
      })
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  // ══════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════════════════
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-black text-xs">SF</span>
              </div>
              <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Skolify</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center">Registration Successful!</h2>
              <p className="text-sm text-slate-500 text-center mt-1.5">
                Your {success.trialDays}-day free trial has started
              </p>
              <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Login Credentials</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { label: 'School Code', value: <code className="text-[13px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{success.schoolCode}</code> },
                    { label: 'Phone (Login ID)', value: <span className="text-[13px] font-semibold text-slate-700">+91 {success.phone}</span> },
                    { label: 'Role', value: <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Admin</span> },
                    { label: 'Name', value: <span className="text-[13px] text-slate-700">{success.adminName}</span> },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[12px] text-slate-500">{r.label}</span>
                      {r.value}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  <strong>Save your School Code.</strong> Teachers, students & parents will need it to login.
                </p>
              </div>
              <Link href="/login" className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                Go to Login <ArrowRight />
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Powered by Skolify ·{' '}
            <a href="https://shivshakticomputer.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
              Shivshakti Computer Academy
            </a>
          </p>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // MAIN FORM
  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/80">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-[11px]">SF</span>
            </div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Skolify</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-slate-500 hidden sm:block">Already have an account?</span>
            <Link href="/login" className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Login →</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register your school</h1>
            <p className="text-[13px] text-slate-500 mt-2">60-day free trial · No credit card required</p>
          </div>

          <StepPills current={step} />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
            <div className={`h-[3px] transition-all duration-500 ${
              step === 1 ? 'bg-blue-500' : step === 2 ? 'bg-violet-500' : verified ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />

            <div className="px-7 py-7">

              {/* Step label */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
                  step === 1 ? 'bg-blue-500' : step === 2 ? 'bg-violet-500' : 'bg-amber-500'
                }`}>{step}</div>
                <p className="text-[13px] font-semibold text-slate-600">
                  {step === 1 ? 'School Information' : step === 2 ? 'Admin Account Setup' : 'Verify Your Phone'}
                </p>
                <div className="ml-auto text-[11px] text-slate-400">Step {step} of 3</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ═══ STEP 1 ═══ */}
                {step === 1 && (
                  <>
                    <Field label="School Name" required hint="Official name of your school or institute">
                      <input
                        type="text" value={form.schoolName}
                        onChange={e => {
                          set('schoolName', e.target.value)
                          if (!form.schoolCode || form.schoolCode === slug(form.schoolName))
                            set('schoolCode', slug(e.target.value))
                        }}
                        className={baseInput} placeholder="e.g. Saraswati Vidya Mandir"
                        required autoFocus
                      />
                    </Field>

                    <Field label="School Code" required hint="Unique ID — teachers & parents use this to login. Cannot be changed later.">
                      <div className="relative">
                        <input
                          type="text" value={form.schoolCode}
                          onChange={e => set('schoolCode', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                          className={`${baseInput} font-mono pr-28`} placeholder="e.g. svm_ambikapur"
                          required autoCapitalize="off" autoCorrect="off" spellCheck={false}
                        />
                        {form.schoolCode && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded max-w-[90px] truncate block">
                              {form.schoolCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </Field>

                    <Field label="City / Address" optional>
                      <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                        className={baseInput} placeholder="e.g. Ambikapur, Chhattisgarh" />
                    </Field>
                  </>
                )}

                {/* ═══ STEP 2 ═══ */}
                {step === 2 && (
                  <>
                    <Field label="Your Name" required hint="Principal or school owner name">
                      <input type="text" value={form.adminName} onChange={e => set('adminName', e.target.value)}
                        className={baseInput} placeholder="e.g. Ramesh Kumar" required autoComplete="name" autoFocus />
                    </Field>

                    <Field label="Phone Number" required hint="This will be your Login ID · OTP verification required">
                      <div className="relative flex">
                        <div className="flex items-center px-3 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-[12px] font-semibold text-slate-500 select-none">+91</div>
                        <input
                          type="tel" value={form.phone}
                          onChange={e => {
                            set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                            setVerified(false); setVToken(''); setOtpSent(false)
                          }}
                          className={`${baseInput} rounded-l-none font-mono tracking-widest`}
                          placeholder="9876543210" required maxLength={10} autoComplete="tel"
                        />
                        {form.phone.length === 10 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    </Field>

                    <Field label="Email" optional hint="For welcome email & trial reminders">
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        className={baseInput} placeholder="school@example.com" autoComplete="email" />
                    </Field>

                    <Field label="Password" required>
                      <div className="relative">
                        <input
                          type={showPwd ? 'text' : 'password'} value={form.password}
                          onChange={e => set('password', e.target.value)}
                          className={`${baseInput} pr-10`} placeholder="Min. 6 characters"
                          required minLength={6} autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowPwd(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                          <Eye off={showPwd} />
                        </button>
                      </div>
                      {form.password && (
                        <div className="flex gap-1 mt-1.5">
                          {[6, 9, 12, 15].map((len, i) => (
                            <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                              form.password.length >= len
                                ? i < 2 ? 'bg-amber-400' : i === 2 ? 'bg-blue-400' : 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`} />
                          ))}
                        </div>
                      )}
                    </Field>

                    <Field label="Confirm Password" required>
                      <div className="relative">
                        <input
                          type={showPwd ? 'text' : 'password'} value={form.confirmPwd}
                          onChange={e => set('confirmPwd', e.target.value)}
                          className={`${baseInput} pr-10`} placeholder="Re-enter password"
                          required autoComplete="new-password"
                        />
                        {form.confirmPwd && (
                          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${form.password === form.confirmPwd ? 'text-emerald-500' : 'text-red-400'}`}>
                            {form.password === form.confirmPwd
                              ? <Check size={14} />
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            }
                          </div>
                        )}
                      </div>
                      {form.confirmPwd && form.password !== form.confirmPwd && (
                        <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </Field>
                  </>
                )}

                {/* ═══ STEP 3 — OTP ═══ */}
                {step === 3 && (
                  <div className="space-y-5">

                    {/* Phone + status row */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-[11px] text-slate-400 mb-0.5">Verifying</p>
                        <p className="text-[14px] font-bold text-slate-800 font-mono">+91 {form.phone}</p>
                        {form.email && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{form.email}</p>
                        )}
                      </div>
                      {verified
                        ? <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 flex items-center gap-1 flex-shrink-0"><Check size={10} /> Verified</span>
                        : <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 flex-shrink-0">Pending</span>
                      }
                    </div>

                    {/* ── Verified ── */}
                    {verified && (
                      <div className="text-center py-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-500">
                          <Check size={22} />
                        </div>
                        <p className="text-[15px] font-bold text-slate-800">Phone verified!</p>
                        <p className="text-[12px] text-slate-500 mt-1">Click below to complete registration</p>
                      </div>
                    )}

                    {/* ── Channel selector (not sent yet) ── */}
                    {!verified && !otpSent && (
                      <OtpChannelSelector
                        selected={otpChannel}
                        hasEmail={!!form.email}
                        sendingChannel={sendingChannel}
                        onChannelChange={(ch) => {
                          // ✅ Sirf channel update karo — OTP mat bhejo
                          setOtpChannel(ch)
                          setError('')
                        }}
                        onSend={(ch) => sendOTP(ch)}
                      />
                    )}

                    {/* ── OTP Entry (after send) ── */}
                    {!verified && otpSent && (
                      <div className="space-y-4">

                        {/* Sent via badge */}
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${channelMeta[otpChannel].iconBg}`}>
                            {channelMeta[otpChannel].icon}
                          </div>
                          <p className="text-[12px] font-medium text-slate-600">
                            Code sent via <strong>{otpChannel === 'sms' ? 'SMS' : 'Email'}</strong>
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${channelMeta[otpChannel].badgeBg} ${channelMeta[otpChannel].badgeText} ${channelMeta[otpChannel].badgeBorder}`}>
                            {otpChannel === 'sms'
                              ? `+91 ${form.phone}`
                              : form.email.length > 22 ? form.email.slice(0, 19) + '…' : form.email
                            }
                          </span>
                        </div>

                        {/* OTP Boxes */}
                        <div className="flex justify-center gap-2" onPaste={handlePaste}>
                          {otpValues.map((val, i) => (
                            <input
                              key={i} id={`otp-${i}`}
                              type="text" inputMode="numeric" maxLength={1} value={val}
                              onChange={e => handleOtpChange(i, e.target.value)}
                              onKeyDown={e => handleOtpKey(i, e)}
                              className={[
                                'w-10 h-12 text-center text-base font-bold rounded-xl border-2',
                                'outline-none transition-all duration-150 caret-transparent',
                                val
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-white text-slate-900',
                                'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10',
                              ].join(' ')}
                            />
                          ))}
                        </div>

                        {/* Verify button */}
                        <button
                          type="button" onClick={verifyOTP}
                          disabled={otpVerifying || otpValues.join('').length !== 6}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          {otpVerifying ? <><Spinner /> Verifying...</> : 'Verify OTP'}
                        </button>

                        {/* ── Resend / Switch box ── */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2 border-b border-slate-200 bg-slate-100">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              Didn't receive the code?
                            </p>
                          </div>

                          {/* Resend same channel */}
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${channelMeta[otpChannel].iconBg}`}>
                                {channelMeta[otpChannel].icon}
                              </div>
                              <span className="text-[12px] text-slate-600">
                                Resend via <strong>{otpChannel === 'sms' ? 'SMS' : 'Email'}</strong>
                              </span>
                            </div>
                            {cooldown > 0 ? (
                              <span className="text-[12px] font-mono text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">{cooldown}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => sendOTP(otpChannel)}
                                disabled={sendingChannel !== null}
                                className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:underline disabled:opacity-50"
                              >
                                {sendingChannel === otpChannel ? <Spinner /> : <RefreshIcon size={12} />}
                                Resend
                              </button>
                            )}
                          </div>

                          {/* Switch to other channel — only if email exists */}
                          {form.email && (
                            <>
                              <div className="h-px bg-slate-200 mx-4" />
                              <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${channelMeta[otpChannel === 'sms' ? 'email' : 'sms'].iconBg}`}>
                                    {channelMeta[otpChannel === 'sms' ? 'email' : 'sms'].icon}
                                  </div>
                                  <span className="text-[12px] text-slate-600">
                                    Try via <strong>{otpChannel === 'sms' ? 'Email' : 'SMS'}</strong> instead
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next: OtpChannel = otpChannel === 'sms' ? 'email' : 'sms'
                                    setOtpValues(['', '', '', '', '', ''])
                                    setError('')
                                    sendOTP(next)
                                  }}
                                  disabled={sendingChannel !== null}
                                  className="flex items-center gap-1 text-[12px] font-semibold text-slate-600 hover:text-blue-600 hover:underline disabled:opacity-50"
                                >
                                  {sendingChannel !== null && sendingChannel !== otpChannel
                                    ? <Spinner />
                                    : <ArrowRight size={12} />
                                  }
                                  Switch
                                </button>
                              </div>
                            </>
                          )}

                          {/* Go back to selector */}
                          <div className="h-px bg-slate-200" />
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false)
                              setOtpValues(['', '', '', '', '', ''])
                              setError('')
                            }}
                            className="w-full text-center text-[12px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 py-2.5 transition-colors"
                          >
                            ← Change verification method
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* ── Error ── */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                      <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <p className="text-[12px] text-red-700">{error}</p>
                  </div>
                )}

                {/* ── Nav Buttons ── */}
                <div className="flex gap-2.5 pt-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep(s => s - 1); setError('')
                        setOtpSent(false); setOtpValues(['', '', '', '', '', ''])
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <ArrowLeft /> Back
                    </button>
                  )}

                  {(step === 1 || step === 2 || (step === 3 && verified)) && (
                    <button
                      type="submit" disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      {loading
                        ? <><Spinner /> Creating account...</>
                        : step < 3 ? <>Continue <ArrowRight /></>
                        : <>Create Account <Check /></>
                      }
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-center gap-5">
              {[{ icon: '🔒', text: 'Secure' }, { icon: '🆓', text: '60-day trial' }, { icon: '🇮🇳', text: 'Made in India' }].map(b => (
                <div key={b.text} className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>{b.icon}</span><span>{b.text}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-slate-400">
              By registering, you agree to our{' '}
              <Link href="/terms" className="hover:text-blue-600 underline underline-offset-2 transition-colors">Terms</Link>
              {' & '}
              <Link href="/privacy" className="hover:text-blue-600 underline underline-offset-2 transition-colors">Privacy Policy</Link>
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