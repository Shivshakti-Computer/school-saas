// FILE: src/app/register/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   BACK TO HOME BUTTON
══════════════════════════════════════════════════════════ */
function BackToHome() {
  return (
    <Link
      href="/"
      className="
        inline-flex items-center gap-2 px-4 py-2 rounded-xl
        bg-white/80 hover:bg-white
        border border-slate-200 hover:border-slate-300
        text-slate-600 hover:text-slate-900
        text-sm font-medium
        shadow-sm hover:shadow-md
        transition-all duration-200
        backdrop-blur-sm
      "
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Back to Home
    </Link>
  )
}

/* ══════════════════════════════════════════════════════════
   INPUT CLASS
══════════════════════════════════════════════════════════ */
const inputClass = `
  w-full py-3 px-4 rounded-xl text-sm transition-all duration-200
  bg-white border border-slate-200
  text-slate-900 placeholder-slate-400
  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
  hover:border-slate-300
`

/* ══════════════════════════════════════════════════════════
   GLOBAL STYLES — ::before / ::after patterns
   Injected via <style> tag (Tailwind can't do pseudo-elements natively)
══════════════════════════════════════════════════════════ */
const pseudoStyles = `

  /* ── Page background dot grid ── */
  .reg-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(59, 130, 246, 0.045) 1px, transparent 1px);
    background-size: 24px 24px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Floating top-right glow blob ── */
  .reg-bg::after {
    content: '';
    position: absolute;
    top: -15%;
    right: -10%;
    width: 550px;
    height: 550px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Step connector line (between circles) ── */
  .step-connector {
    position: relative;
    width: 48px;
    height: 2px;
    background: #E2E8F0;
    border-radius: 9999px;
    overflow: visible;
    transition: background 0.4s ease;
  }
  .step-connector.active {
    background: linear-gradient(90deg, #2563EB, #4F46E5);
  }
  /* Animated fill shimmer on connector */
  .step-connector.active::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: connectorShimmer 1.5s infinite;
    border-radius: 9999px;
  }
  @keyframes connectorShimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* ── Main card — decorative top accent bar ── */
  .reg-card {
    position: relative;
    overflow: hidden;
  }
  .reg-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #2563EB, #6366F1, #8B5CF6);
    border-radius: 24px 24px 0 0;
    z-index: 1;
  }
  /* Card inner glow on top-left corner */
  .reg-card::after {
    content: '';
    position: absolute;
    top: -60px;
    left: -60px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Info banner — left accent border ── */
  .info-banner {
    position: relative;
    overflow: hidden;
  }
  .info-banner::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    background: linear-gradient(180deg, #2563EB, #6366F1);
    border-radius: 0 9999px 9999px 0;
  }

  /* ── School code preview badge — shine ── */
  .code-preview {
    position: relative;
    overflow: hidden;
  }
  .code-preview::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
    animation: badgeShine 3s ease-in-out infinite;
    border-radius: inherit;
  }
  @keyframes badgeShine {
    0%   { left: -100%; }
    50%  { left: 130%; }
    100% { left: 130%; }
  }

  /* ── Submit button — animated gradient bg ── */
  .reg-submit-btn {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%);
    background-size: 200% 200%;
    animation: gradientShift 4s ease infinite;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .reg-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px -6px rgba(37, 99, 235, 0.4);
  }
  .reg-submit-btn:active {
    transform: translateY(0);
  }
  .reg-submit-btn:disabled {
    opacity: 0.55;
    transform: none;
    animation: none;
    background: #94A3B8;
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  /* Ripple shimmer on button */
  .reg-submit-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -75%;
    width: 50%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    animation: btnShimmer 2.5s ease-in-out infinite;
  }
  .reg-submit-btn:disabled::before {
    display: none;
  }
  @keyframes btnShimmer {
    0%   { left: -75%; }
    100% { left: 130%; }
  }

  /* ── Step circle — active pulse ring ── */
  .step-circle-active {
    position: relative;
  }
  .step-circle-active::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: transparent;
    border: 2px solid rgba(37, 99, 235, 0.3);
    animation: stepPulse 2s ease-in-out infinite;
  }
  @keyframes stepPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(1.25); }
  }

  /* ── Success screen — hero icon glow ── */
  .success-icon-wrap {
    position: relative;
  }
  .success-icon-wrap::before {
    content: '';
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%);
    animation: successPulse 2.5s ease-in-out infinite;
  }
  .success-icon-wrap::after {
    content: '';
    position: absolute;
    inset: -24px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
    animation: successPulse 2.5s ease-in-out infinite 0.5s;
  }
  @keyframes successPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.12); opacity: 0.6; }
  }

  /* ── Feature badges row — hover lift ── */
  .feature-badge {
    position: relative;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .feature-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px -4px rgba(0,0,0,0.08);
  }
  .feature-badge::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.5), transparent);
    pointer-events: none;
  }

  /* ── Section divider with label ── */
  .divider-label {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .divider-label::before,
  .divider-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #E2E8F0);
  }
  .divider-label::after {
    background: linear-gradient(90deg, #E2E8F0, transparent);
  }

  /* ── Left-side blob (bottom-left) ── */
  .reg-blob-bl {
    position: absolute;
    bottom: -15%;
    left: -10%;
    width: 450px;
    height: 450px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Input focused glow helper ── */
  .input-wrap {
    position: relative;
  }
  .input-wrap::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 13px;
    background: transparent;
    box-shadow: 0 0 0 0px rgba(37, 99, 235, 0);
    pointer-events: none;
    transition: box-shadow 0.2s ease;
  }
  .input-wrap:focus-within::after {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
  }

  /* ── Success credential row ── */
  .cred-row {
    position: relative;
  }
  .cred-row + .cred-row::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #E2E8F0 20%, #E2E8F0 80%, transparent);
  }
`

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
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

  const set = (k: string, v: string) => {
    setError('')
    setForm(f => ({ ...f, [k]: v }))
  }

  const autoCode = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 30)

  const validateStep1 = () => {
    if (!form.schoolName.trim()) { setError('School name is required'); return false }
    if (!form.schoolCode.trim()) { setError('School code is required'); return false }
    if (form.schoolCode.length < 3) { setError('School code must be at least 3 characters'); return false }
    if (!/^[a-z0-9_-]+$/.test(form.schoolCode)) {
      setError('School code: only lowercase letters, numbers, _ or - allowed')
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
      <>
        <style>{pseudoStyles}</style>

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/30 flex items-center justify-center p-4 relative overflow-hidden">

          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/[0.05] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/[0.05] rounded-full blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: 'radial-gradient(rgba(16,185,129,0.04) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <div className="relative w-full max-w-md">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-extrabold text-xs">SF</span>
                </div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  Skolify
                </span>
              </Link>
              <BackToHome />
            </div>

            {/* Success Card */}
            <div className="reg-card bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

              {/* Success icon */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="success-icon-wrap w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">You're all set! 🎉</h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  <span className="font-semibold text-emerald-600">{success.schoolName}</span> has been registered.
                  {/* Your {success.trialDays}-day free trial has started. */}
                  Your free trial has started.
                </p>
              </div>

              {/* Divider */}
              <div className="divider-label mb-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Your Login Credentials
                </span>
              </div>

              {/* Credentials Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
                <div className="space-y-0">
                  {[
                    {
                      label: 'School Code',
                      value: (
                        <span className="code-preview inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-sm px-3 py-1 rounded-lg">
                          {success.schoolCode}
                        </span>
                      ),
                    },
                    {
                      label: 'Phone (Login ID)',
                      value: <span className="text-sm font-semibold text-slate-700">{success.phone}</span>,
                    },
                    {
                      label: 'Role',
                      value: (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5">
                          Admin
                        </span>
                      ),
                    },
                    {
                      label: 'Admin Name',
                      value: <span className="text-sm font-semibold text-slate-700">{success.adminName}</span>,
                    },
                  ].map((row, i) => (
                    <div key={i} className={`cred-row flex items-center justify-between py-3 ${i > 0 ? 'pt-3' : ''}`}>
                      <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                      {row.value}
                    </div>
                  ))}
                </div>

                {/* Warning */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="info-banner bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 pl-5">
                    <p className="text-[12px] text-amber-700 leading-relaxed flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" x2="12" y1="9" y2="13" />
                        <line x1="12" x2="12.01" y1="17" y2="17" />
                      </svg>
                      <span>
                        <strong>Save your School Code!</strong> Teachers, students &amp; parents need it to login.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* What to do next */}
              <div className="mb-6">
                <div className="divider-label mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    What to do next
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Login with School Code + Phone + Password', color: 'bg-blue-100 text-blue-700' },
                    { step: '2', text: 'Add teachers and students from admin panel', color: 'bg-indigo-100 text-indigo-700' },
                    { step: '3', text: 'Share School Code with teachers & parents', color: 'bg-emerald-100 text-emerald-700' },
                    { step: '4', text: 'Explore features — upgrade plan when ready', color: 'bg-amber-100 text-amber-700' },
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

              {/* CTA Button */}
              <Link
                href="/login"
                className="
                  reg-submit-btn
                  flex w-full justify-center items-center gap-2
                  text-white py-3.5 rounded-2xl text-sm font-bold
                "
              >
                Go to Login Portal
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Login URL */}
              <p className="text-center text-[11px] text-slate-400 mt-4">
                Login URL:{' '}
                <span className="font-mono font-medium text-slate-500">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/login
                </span>
              </p>
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
      </>
    )
  }

  /* ════════════════════════════════════════
     REGISTRATION FORM
  ════════════════════════════════════════ */
  return (
    <>
      <style>{pseudoStyles}</style>

      <div className="reg-bg min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 flex flex-col relative overflow-hidden">

        {/* Blob bottom-left */}
        <div className="reg-blob-bl" aria-hidden="true" />

        {/* ─── Top Bar ─── */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-xs">SF</span>
            </div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Skolify
            </span>
          </Link>
          <BackToHome />
        </div>

        {/* ─── Main Content ─── */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <span className="text-white font-extrabold text-xl">SF</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Register Your School</h1>
              <p className="text-sm text-slate-500 mt-1.5">
                60-day free trial · No credit card required
              </p>

              {/* Feature badges */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  { icon: '✓', label: 'Free 60-day trial', colors: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { icon: '✓', label: 'All roles included', colors: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { icon: '✓', label: 'Setup in 2 minutes', colors: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                ].map(b => (
                  <span
                    key={b.label}
                    className={`feature-badge inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-[11px] font-semibold ${b.colors}`}
                  >
                    <span className="text-[10px] font-bold">{b.icon}</span>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Step Indicator ── */}
            <div className="flex items-center justify-center gap-3 mb-7">
              {/* Step 1 */}
              <div className="flex items-center gap-2.5">
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= 1
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 step-circle-active'
                    : 'bg-slate-100 border border-slate-200 text-slate-400'
                }`}>
                  {step > 1 ? <CheckIcon /> : '1'}
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight transition-colors ${step >= 1 ? 'text-slate-700' : 'text-slate-400'}`}>
                    Step 1
                  </p>
                  <p className={`text-[10px] leading-tight transition-colors ${step >= 1 ? 'text-slate-500' : 'text-slate-400'}`}>
                    School Info
                  </p>
                </div>
              </div>

              {/* Connector */}
              <div className={`step-connector ${step >= 2 ? 'active' : ''}`} />

              {/* Step 2 */}
              <div className="flex items-center gap-2.5">
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= 2
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 step-circle-active'
                    : 'bg-slate-100 border border-slate-200 text-slate-400'
                }`}>
                  2
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight transition-colors ${step >= 2 ? 'text-slate-700' : 'text-slate-400'}`}>
                    Step 2
                  </p>
                  <p className={`text-[10px] leading-tight transition-colors ${step >= 2 ? 'text-slate-500' : 'text-slate-400'}`}>
                    Admin Account
                  </p>
                </div>
              </div>
            </div>

            {/* ── Form Card ── */}
            <div className="reg-card bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

              {/* Card header */}
              <div className="mb-6">
                <div className="info-banner bg-blue-50 border border-blue-200 rounded-2xl p-4 pl-5">
                  <div className="flex items-center gap-2 mb-1">
                    {step === 1 ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="text-xs font-bold text-blue-700">School Information</span>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="text-xs font-bold text-blue-700">Admin Account Setup</span>
                      </>
                    )}
                  </div>
                  <p className="text-[12px] text-blue-600/80 leading-relaxed">
                    {step === 1
                      ? "Enter your school's basic details. The School Code will be used by all users to login."
                      : 'Set up the admin login credentials. This will be the primary account for your school.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── STEP 1 ── */}
                {step === 1 && (
                  <>
                    {/* School Name */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        School Name <span className="text-red-400">*</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={form.schoolName}
                            onChange={e => {
                              set('schoolName', e.target.value)
                              if (!form.schoolCode || form.schoolCode === autoCode(form.schoolName)) {
                                set('schoolCode', autoCode(e.target.value))
                              }
                            }}
                            className={`${inputClass} pl-10`}
                            placeholder="e.g. Delhi Public School"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* School Code */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        School Code <span className="text-red-400">*</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={form.schoolCode}
                            onChange={e => set('schoolCode', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            className={`${inputClass} pl-10 font-mono tracking-wide`}
                            placeholder="e.g. dps_delhi"
                            required
                            autoCapitalize="off"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#94A3B8" strokeWidth="1.5" />
                          <path d="M8 7.5v4M8 5.5h.01" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Lowercase letters, numbers, _ or - only. Cannot be changed later.
                      </p>

                      {/* Live preview */}
                      {form.schoolCode && (
                        <div className="mt-2 code-preview bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-blue-600 font-medium">School Code Preview</p>
                            <span className="font-mono font-bold text-sm text-blue-700">{form.schoolCode}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        City / Address
                        <span className="ml-2 text-[11px] font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={form.address}
                            onChange={e => set('address', e.target.value)}
                            className={`${inputClass} pl-10`}
                            placeholder="e.g. Ambikapur, Chhattisgarh"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                  <>
                    {/* Admin Name */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Admin Name <span className="text-red-400">*</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={form.adminName}
                            onChange={e => set('adminName', e.target.value)}
                            className={`${inputClass} pl-10`}
                            placeholder="Principal or school owner name"
                            required
                            autoComplete="name"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                            className={`${inputClass} pl-10`}
                            placeholder="9876543210"
                            required
                            maxLength={10}
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" stroke="#94A3B8" strokeWidth="1.5" />
                          <path d="M8 7.5v4M8 5.5h.01" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        This will be your Login ID
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email
                        <span className="ml-2 text-[11px] font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                          </div>
                          <input
                            type="email"
                            value={form.email}
                            onChange={e => set('email', e.target.value)}
                            className={`${inputClass} pl-10`}
                            placeholder="school@example.com"
                            autoComplete="email"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Password <span className="text-red-400">*</span>
                      </label>
                      <div className="input-wrap">
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
                            onChange={e => set('password', e.target.value)}
                            className={`${inputClass} pl-10 pr-12`}
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                            autoComplete="new-password"
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
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Confirm Password <span className="text-red-400">*</span>
                      </label>
                      <div className="input-wrap">
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.confirmPwd}
                            onChange={e => set('confirmPwd', e.target.value)}
                            className={`${inputClass} pl-10 pr-12`}
                            placeholder="Re-enter your password"
                            required
                            autoComplete="new-password"
                          />
                          {/* Match indicator */}
                          {form.confirmPwd && (
                            <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${
                              form.password === form.confirmPwd
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-red-100 text-red-500'
                            }`}>
                              {form.password === form.confirmPwd ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {form.confirmPwd && form.password !== form.confirmPwd && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" />
                            <path d="M8 5v4M8 11h.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Passwords do not match
                        </p>
                      )}
                      {form.confirmPwd && form.password === form.confirmPwd && (
                        <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="#10B981" strokeWidth="1.5" />
                            <path d="m5 8 2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Passwords match
                        </p>
                      )}
                    </div>
                  </>
                )}

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

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError('') }}
                      className="
                        flex-1 py-3 border border-slate-200 bg-white
                        text-slate-600 text-sm font-semibold rounded-2xl
                        hover:bg-slate-50 hover:border-slate-300
                        transition-all duration-200
                        flex items-center justify-center gap-2
                      "
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                      </svg>
                      Back
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="reg-submit-btn flex-1 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Registering...
                      </>
                    ) : step === 1 ? (
                      <>
                        Continue
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Register School
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Login link */}
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">
                Already registered?{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
                  Login here →
                </Link>
              </p>
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
    </>
  )
}