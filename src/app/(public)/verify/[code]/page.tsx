// FILE: src/app/(public)/verify/[code]/page.tsx
// FIXED: Next.js 15 — params is now a Promise
// ═══════════════════════════════════════════════════════════

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { CheckCircle, XCircle, AlertTriangle, Award, Building2, Calendar, User, BookOpen, GraduationCap } from 'lucide-react'
import { connectDB } from '@/lib/db'
import { IssuedCertificate } from '@/models/Certificate'
import { School } from '@/models/School'
import { verifyCertificateSchema } from '@/lib/validators/certificate'

// ── Types ──────────────────────────────────────────────────

interface CertificateData {
  number: string
  type: string
  title: string
  recipientName: string
  recipientType: string
  issuedDate: string
  status: 'issued' | 'revoked'
  revokedAt?: string
  revokedReason?: string
  verificationCode: string
  class?: string
  section?: string
  academicYear?: string
  courseName?: string
}

interface InstitutionData {
  name: string
  subdomain: string
  logo?: string
  institutionType: string
  accreditations: {
    affiliations?: string[]
    registrations?: string[]
    recognitions?: string[]
  }
}

interface VerificationResult {
  certificate: CertificateData
  institution: InstitutionData
  verifiedAt: string
}

// ── Fetch Data ─────────────────────────────────────────────

async function verifyCertificate(code: string): Promise<VerificationResult> {
  await connectDB()

  // Validate
  verifyCertificateSchema.parse({ code })

  const cert = await IssuedCertificate.findOne({
    verificationCode: code,
  }).lean() as any

  if (!cert) {
    throw new Error('NOT_FOUND')
  }

  const school = await School.findById(cert.tenantId)
    .select('name subdomain logo accreditations institutionType')
    .lean() as any

  if (!school) {
    throw new Error('INSTITUTION_NOT_FOUND')
  }

  return {
    certificate: {
      number: cert.certificateNumber,
      type: cert.certificateType,
      title: cert.title,
      recipientName: cert.recipientName,
      recipientType: cert.recipientType,
      issuedDate: cert.issuedDate,
      status: cert.status,
      revokedAt: cert.revokedAt,
      revokedReason: cert.revokedReason,
      verificationCode: cert.verificationCode,
      class: cert.class,
      section: cert.section,
      academicYear: cert.academicYear,
      courseName: cert.courseName,
    },
    institution: {
      name: school.name,
      subdomain: school.subdomain,
      logo: school.logo,
      institutionType: school.institutionType,
      accreditations: school.accreditations || {
        affiliations: [],
        registrations: [],
        recognitions: [],
      },
    },
    verifiedAt: new Date().toISOString(),
  }
}

// ── Metadata ───────────────────────────────────────────────
// ✅ FIX: params is Promise in Next.js 15

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  // ✅ Await params
  const { code } = await params

  try {
    const data = await verifyCertificate(code)
    const cert = data.certificate
    const inst = data.institution

    return {
      title: `Verify Certificate — ${cert.number}`,
      description: `Verify authenticity of certificate ${cert.number} issued to ${cert.recipientName} by ${inst.name}`,
      openGraph: {
        title: `Certificate Verification — ${cert.number}`,
        description: `${cert.title} awarded to ${cert.recipientName}`,
        type: 'website',
      },
      robots: 'noindex, nofollow',
    }
  } catch {
    return {
      title: 'Certificate Verification',
      description: 'Verify certificate authenticity',
      robots: 'noindex, nofollow',
    }
  }
}

// ── Page Component ─────────────────────────────────────────
// ✅ FIX: params is Promise in Next.js 15

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  // ✅ Await params
  const { code } = await params

  let data: VerificationResult | null = null
  let error: string | null = null

  try {
    data = await verifyCertificate(code)
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      error = 'Certificate not found. Please check the verification code and try again.'
    } else if (err.message === 'INSTITUTION_NOT_FOUND') {
      error = 'Institution not found. This certificate may have been removed.'
    } else {
      error = 'Verification failed. Please try again later.'
    }
  }

  // ── Error State ───────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div
          className="max-w-md w-full p-8 rounded-[var(--radius-2xl)] text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h1
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Verification Failed
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <p
            className="text-sm mt-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Code: {code}
          </p>
        </div>
      </div>
    )
  }

  if (!data) return notFound()

  const { certificate, institution } = data
  const isValid = certificate.status === 'issued'

  // ── Format Date ───────────────────────────────────────────
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  // ── Institution Type Label ─────────────────────────────────
  const instTypeLabel =
    institution.institutionType === 'school'
      ? 'School'
      : institution.institutionType === 'academy'
      ? 'Computer Academy'
      : 'Coaching Institute'

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ── Verification Status Banner ─────────────────────── */}
        <div
          className="rounded-[var(--radius-xl)] p-6 mb-8"
          style={{
            background: isValid ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1px solid ${isValid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: isValid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                color: isValid ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {isValid ? <CheckCircle size={24} /> : <XCircle size={24} />}
            </div>
            <div className="flex-1">
              <h1
                className="text-lg font-bold mb-1"
                style={{ color: isValid ? 'var(--success-dark)' : 'var(--danger-dark)' }}
              >
                {isValid ? 'Certificate Verified ✓' : 'Certificate Revoked'}
              </h1>
              <p
                className="text-sm"
                style={{ color: isValid ? 'var(--success-dark)' : 'var(--danger-dark)' }}
              >
                {isValid
                  ? 'This is a valid certificate issued by the institution.'
                  : `This certificate has been revoked. Reason: ${certificate.revokedReason || 'Not specified'}`}
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: isValid ? 'var(--success-dark)' : 'var(--danger-dark)', opacity: 0.7 }}
              >
                Verified on {formatDate(data.verifiedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Certificate Details Card ───────────────────────── */}
        <div
          className="rounded-[var(--radius-2xl)] overflow-hidden mb-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header with accent */}
          <div
            className="h-1.5"
            style={{
              background: isValid
                ? 'linear-gradient(90deg, var(--success) 0%, var(--success-600) 100%)'
                : 'linear-gradient(90deg, var(--danger) 0%, var(--danger-600) 100%)',
            }}
          />

          <div className="p-6">
            {/* Institution */}
            <div className="flex items-start gap-4 mb-6">
              {institution.logo ? (
                <img
                  src={institution.logo}
                  alt={institution.name}
                  className="w-14 h-14 rounded-[var(--radius-lg)] object-cover flex-shrink-0"
                  style={{ border: '1px solid var(--border)' }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--bg-muted)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Building2 size={24} />
                </div>
              )}
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Issued By
                </p>
                <p
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {institution.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {instTypeLabel}
                </p>
              </div>
            </div>

            {/* Certificate Info */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Certificate Title
                </p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {certificate.title}
                </p>
              </div>

              {/* Recipient */}
              <div className="flex items-center gap-2">
                <User size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Awarded to{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {certificate.recipientName}
                  </strong>
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2">
                <Award size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Type:{' '}
                  <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
                    {certificate.type.replace(/_/g, ' ')}
                  </span>
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Issued on{' '}
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatDate(certificate.issuedDate)}
                  </span>
                </span>
              </div>

              {/* Context Fields */}
              {(certificate.class || certificate.courseName) && (
                <div className="flex items-center gap-2">
                  {certificate.courseName ? (
                    <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <GraduationCap size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {certificate.courseName ? (
                      <>
                        Course:{' '}
                        <span style={{ color: 'var(--text-primary)' }}>
                          {certificate.courseName}
                        </span>
                      </>
                    ) : (
                      <>
                        {certificate.class && (
                          <>
                            Class:{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                              {certificate.class}
                              {certificate.section && `-${certificate.section}`}
                            </span>
                          </>
                        )}
                        {certificate.academicYear && (
                          <>
                            {' '}
                            • Academic Year:{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                              {certificate.academicYear}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div
              className="my-6"
              style={{ borderTop: '1px solid var(--border)' }}
            />

            {/* Certificate Number & Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Certificate Number
                </p>
                <p
                  className="text-sm font-mono font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {certificate.number}
                </p>
              </div>
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Verification Code
                </p>
                <p
                  className="text-sm font-mono font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {certificate.verificationCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Accreditations ─────────────────────────────────── */}
        {(institution.accreditations.affiliations?.length ||
          institution.accreditations.registrations?.length ||
          institution.accreditations.recognitions?.length) && (
          <div
            className="rounded-[var(--radius-xl)] p-5"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-xs font-semibold mb-3 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Institution Accreditations
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ...(institution.accreditations.affiliations || []),
                ...(institution.accreditations.registrations || []),
                ...(institution.accreditations.recognitions || []),
              ].map((acc, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {acc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer Note ────────────────────────────────────── */}
        <p
          className="text-center text-xs mt-8"
          style={{ color: 'var(--text-muted)' }}
        >
          This certificate was digitally verified through Skolify Certificate Verification System.
          For any discrepancies, please contact the issuing institution directly.
        </p>
      </div>
    </div>
  )
}