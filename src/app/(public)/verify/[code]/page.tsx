// FILE: src/app/(public)/verify/[code]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle, XCircle, AlertTriangle, Share2, Building2,
  Award, Calendar, User, MapPin, Phone, Mail, Shield,
  ArrowLeft, Check, BadgeCheck, Fingerprint,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────

interface Accreditation {
  name: string
  logoUrl: string
  registrationNo?: string
  source?: 'parent' | 'franchise'
}

interface VerificationResult {
  verified: boolean
  certificate: {
    number: string
    type: string
    title: string
    recipientName: string
    recipientType: string
    issuedDate: string
    status: string
    verificationCode: string
    class?: string
    section?: string
    academicYear?: string
    courseName?: string
  }
  institution: {
    name: string
    subdomain: string
    logo?: string
    institutionType: string
    address?: string
    phone?: string
    email?: string
    accreditations: {
      affiliations: Accreditation[]
      recognitions: Accreditation[]
      registrations: Accreditation[]
      partnerships: Accreditation[]
      awards?: Accreditation[]
    }
  }
  franchise?: {
    name: string
    logo?: string
    address: string
    city: string
    state: string
  }
  verifiedAt: string
}

// ── Loading ────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 animate-spin"
               style={{
                 borderColor: 'var(--primary-100)',
                 borderTopColor: 'var(--primary-500)',
               }} />
          <div className="absolute inset-2 rounded-full flex items-center justify-center"
               style={{ background: 'var(--primary-50)' }}>
            <Shield size={16} style={{ color: 'var(--primary-500)' }} />
          </div>
        </div>
        <p className="text-sm font-semibold mb-1"
           style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Verifying Certificate…
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Checking authenticity against our records
        </p>
      </div>
    </div>
  )
}

// ── Error ──────────────────────────────────────────────────────

function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
             style={{
               background: 'var(--danger-50)',
               border: '1px solid var(--danger-200)',
             }}>
          <XCircle size={24} style={{ color: 'var(--danger)' }} />
        </div>
        <h1 className="text-xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Verification Failed
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          {error}
        </p>
        <a href="/verify"
           className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                      text-sm font-semibold text-white transition-all duration-200"
           style={{
             fontFamily: 'var(--font-display)',
             background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
             boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
           }}>
          <ArrowLeft size={15} />
          Try Another Code
        </a>
      </div>
    </div>
  )
}

// ── Detail Row ─────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
           style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
        <Icon size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
           style={{ color: 'var(--text-muted)', letterSpacing: '0.08em', fontSize: '0.6rem' }}>
          {label}
        </p>
        <p className="text-sm font-semibold break-words leading-snug"
           style={{
             color: mono ? 'var(--primary-600)' : 'var(--text-primary)',
             fontFamily: mono ? 'var(--font-mono)' : 'inherit',
             letterSpacing: mono ? '0.05em' : 'normal',
           }}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────

export default function VerifyCertificateResultPage() {
  const params  = useParams()
  const rawCode = params?.code
  const code    = Array.isArray(rawCode) ? rawCode[0] : rawCode

  const [result, setResult]   = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (code === undefined || code === null) return
    if (code.trim() === '') {
      setError('Invalid verification link. Please check the URL.')
      setLoading(false)
      return
    }

    let cancelled = false

    async function verify() {
      try {
        const res  = await fetch(`/api/certificates/verify/${encodeURIComponent(code as string)}`)
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) { setError(data.error || 'Verification failed'); return }
        setResult(data)
      } catch {
        if (!cancelled) setError('Network error. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verify()
    return () => { cancelled = true }
  }, [code])

  const handleShare = async () => {
    if (!result) return

    const shareText = `Certificate Verified: ${result.certificate.number}\n${result.certificate.recipientName}\n${result.certificate.title}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Certificate Verification',
          text: shareText,
          url: window.location.href,
        })
      } catch { 
        // User cancelled share, fallback to copy
        await handleCopy()
      }
    } else {
      await handleCopy()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { 
      // Silent fail
    }
  }

  if (loading) return <LoadingState />
  if (error)   return <ErrorState error={error} />
  if (!result) return null

  const isRevoked = result.certificate.status === 'revoked'
  const isSuccess = result.verified && !isRevoked

  const allAccreditations = [
    ...result.institution.accreditations.affiliations,
    ...result.institution.accreditations.recognitions,
    ...result.institution.accreditations.registrations,
    ...result.institution.accreditations.partnerships,
    ...(result.institution.accreditations.awards || []),
  ]

  const verifiedAt = new Date(result.verifiedAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const issuedDate = new Date(result.certificate.issuedDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <a href="/verify"
           className="inline-flex items-center gap-1.5 text-xs mb-5 transition-colors duration-150"
           style={{ color: 'var(--text-muted)' }}
           onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-600)')}
           onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          <ArrowLeft size={13} />
          Verify another certificate
        </a>

        {/* Status Hero */}
        <div className="rounded-2xl p-5 mb-4 relative overflow-hidden"
             style={{
               background: isSuccess
                 ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                 : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
               boxShadow: isSuccess
                 ? '0 8px 32px rgba(16,185,129,0.3)'
                 : '0 8px 32px rgba(239,68,68,0.3)',
             }}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
               style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full"
               style={{ background: 'rgba(255,255,255,0.06)' }} />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(255,255,255,0.2)' }}>
              {isSuccess
                ? <CheckCircle size={26} color="white" />
                : <AlertTriangle size={26} color="white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white leading-snug">
                {isSuccess ? 'Certificate Verified' : 'Certificate Invalid'}
              </p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {isSuccess
                  ? 'Authentic & issued by the institution'
                  : isRevoked ? 'Revoked by the issuing institution' : 'Not found in our records'}
              </p>
            </div>
            <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                 style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              {isSuccess ? <BadgeCheck size={13} /> : <XCircle size={13} />}
              {isSuccess ? 'Valid' : 'Invalid'}
            </div>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="rounded-2xl border overflow-hidden mb-4"
             style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3 px-5 py-3.5 border-b"
               style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'var(--primary-100)' }}>
              <Award size={14} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Certificate Details
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Verified on {verifiedAt}</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border"
                 style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: 'var(--primary-100)' }}>
                <Fingerprint size={15} style={{ color: 'var(--primary-600)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                   style={{ color: 'var(--primary-400)', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                  Certificate Number
                </p>
                <p className="text-sm font-bold tracking-wide"
                   style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-700)' }}>
                  {result.certificate.number}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <DetailRow icon={Award} label="Certificate Type"
                         value={result.certificate.type.replace(/_/g, ' ').toUpperCase()} />
              <DetailRow icon={User} label="Recipient Name" value={result.certificate.recipientName} />
              <DetailRow icon={Calendar} label="Issued Date" value={issuedDate} />
              <DetailRow icon={Shield} label="Recipient Type" value={result.certificate.recipientType} />
            </div>

            <div className="p-3 rounded-xl border" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                 style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                Certificate Title
              </p>
              <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {result.certificate.title}
              </p>
            </div>

            {(result.certificate.class || result.certificate.courseName || result.certificate.academicYear) && (
              <div className="flex flex-wrap gap-2">
                {result.certificate.class && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--info-50)', color: 'var(--info-dark)', border: '1px solid var(--info-200)' }}>
                    Class {result.certificate.class}{result.certificate.section && `‑${result.certificate.section}`}
                  </span>
                )}
                {result.certificate.courseName && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)' }}>
                    {result.certificate.courseName}
                  </span>
                )}
                {result.certificate.academicYear && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--success-light)', color: 'var(--success-dark)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    {result.certificate.academicYear}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Institution Card */}
        <div className="rounded-2xl border overflow-hidden mb-4"
             style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3 px-5 py-3.5 border-b"
               style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: 'var(--info-100)' }}>
              <Building2 size={14} style={{ color: 'var(--info-600)' }} />
            </div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Issuing Institution
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              {result.institution.logo ? (
                <img src={result.institution.logo} alt={result.institution.name}
                     className="w-14 h-14 object-contain rounded-xl p-1.5 flex-shrink-0"
                     style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                  <Building2 size={22} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold leading-snug mb-0.5"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {result.institution.name}
                </h3>
                <p className="text-xs capitalize mb-2.5" style={{ color: 'var(--text-muted)' }}>
                  {result.institution.institutionType}
                </p>
                <div className="space-y-1.5">
                  {result.institution.address && (
                    <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                      <span className="leading-relaxed">{result.institution.address}</span>
                    </div>
                  )}
                  {result.institution.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                      {result.institution.phone}
                    </div>
                  )}
                  {result.institution.email && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                      {result.institution.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {result.franchise && (
              <div className="p-3.5 rounded-xl border mb-4"
                   style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
                <div className="flex items-start gap-3">
                  {result.franchise.logo && (
                    <img src={result.franchise.logo} alt={result.franchise.name}
                         className="w-10 h-10 object-contain rounded-lg p-1 flex-shrink-0"
                         style={{ border: '1px solid var(--primary-200)', background: 'var(--bg-card)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                       style={{ color: 'var(--primary-500)', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                      Franchise Branch
                    </p>
                    <p className="text-sm font-bold mb-1"
                       style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {result.franchise.name}
                    </p>
                    <div className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary-400)' }} />
                      {result.franchise.address}, {result.franchise.city}, {result.franchise.state}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {allAccreditations.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                  Accreditations & Affiliations
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allAccreditations.slice(0, 8).map((accred, i) => (
                    <div key={i} title={accred.registrationNo || accred.name}
                         className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-default transition-all duration-150"
                         style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
                         onMouseEnter={e => {
                           (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary-300)';
                           (e.currentTarget as HTMLDivElement).style.background = 'var(--primary-50)'
                         }}
                         onMouseLeave={e => {
                           (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                           (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'
                         }}>
                      {accred.logoUrl ? (
                        <img src={accred.logoUrl} alt={accred.name} className="w-9 h-9 object-contain" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                             style={{ background: 'var(--bg-muted)' }}>
                          <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      )}
                      <span className="text-center leading-tight line-clamp-2"
                            style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {accred.name}
                      </span>
                      {accred.source === 'franchise' && (
                        <span className="px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ fontSize: '0.5rem', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                          Branch
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {allAccreditations.length > 8 && (
                  <p className="text-center mt-2" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    +{allAccreditations.length - 8} more
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Verification Code + Share */}
        <div className="rounded-2xl border overflow-hidden mb-4"
             style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                   style={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  Verification Code
                </p>
                <code className="text-sm font-bold tracking-wider"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {code}
                </code>
              </div>
              <button onClick={handleShare}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150"
                      style={{
                        fontFamily: 'var(--font-display)',
                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                      }}>
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
             style={{ background: 'var(--info-50)', borderColor: 'var(--info-200)' }}>
          <Shield size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--info-600)' }} />
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--info-800)' }}>
              Secure Verification
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--info-700)' }}>
              Verified via our tamper-proof system. QR code & verification code are unique and cannot be forged.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}