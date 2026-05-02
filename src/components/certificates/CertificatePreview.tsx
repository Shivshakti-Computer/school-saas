// FILE: src/components/certificates/CertificatePreview.tsx
// Real-time certificate preview with settings sync
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { Download, Eye, RefreshCw, Loader2 } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface CertificatePreviewProps {
    settings: {
        enableDigitalSignature: boolean
        digitalSignatureUrl?: string
        signatureName?: string
        signatureDesignation?: string
        enableQRCode: boolean
        qrCodePosition: 'bottom-left' | 'bottom-right' | 'bottom-center'
        showVerificationURL: boolean
        defaultLayout: 'classic' | 'modern' | 'elegant'
        showAccreditationsOnCertificate: boolean
        watermarkText?: string
        enableWatermark: boolean
    }
    accreditations?: {
        affiliations: any[]
        recognitions: any[]
        registrations: any[]
        partnerships: any[]
    }
    branding?: {
        schoolName: string
        schoolLogo?: string
        address?: string
        phone?: string
        email?: string
    }
    institutionType: 'school' | 'academy' | 'coaching'
    autoRefresh?: boolean
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function CertificatePreview({
    settings,
    accreditations,
    branding,
    institutionType,
    autoRefresh = true,
}: CertificatePreviewProps) {
    const [loading, setLoading] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // ── Generate Preview ─────────────────────────────────────

    const generatePreview = async () => {
        setLoading(true)
        setError(null)

        try {
            // Mock certificate data for preview
            const mockData = {
                branding: {
                    schoolName: branding?.schoolName || 'Demo Institution',
                    schoolLogo: branding?.schoolLogo,
                    schoolAddress: branding?.address,
                    schoolPhone: branding?.phone,
                    schoolEmail: branding?.email,
                    showParentBranding: true,
                    showFranchiseBranding: false,
                },
                accreditations: {
                    parentAffiliations: settings.showAccreditationsOnCertificate
                        ? accreditations?.affiliations || []
                        : [],
                    parentRecognitions: settings.showAccreditationsOnCertificate
                        ? accreditations?.recognitions || []
                        : [],
                    parentRegistrations: settings.showAccreditationsOnCertificate
                        ? accreditations?.registrations || []
                        : [],
                    parentPartnerships: settings.showAccreditationsOnCertificate
                        ? accreditations?.partnerships || []
                        : [],
                    inheritParentAccreditations: settings.showAccreditationsOnCertificate,
                    showFranchiseAccreditations: false,
                },
                content: {
                    certificateType:
                        institutionType === 'school'
                            ? 'Merit Certificate'
                            : institutionType === 'academy'
                                ? 'Course Completion Certificate'
                                : 'Achievement Certificate',
                    certificateNumber: 'PREVIEW-2024-001',
                    title:
                        institutionType === 'school'
                            ? 'For Outstanding Academic Performance in Class 10th'
                            : institutionType === 'academy'
                                ? 'For Successfully Completing Full Stack Web Development Course'
                                : 'For Excellence in Test Performance',
                    recipientName: 'John Doe',
                    content:
                        'This certificate acknowledges the exceptional dedication, hard work, and outstanding achievements demonstrated throughout the academic year.',
                    issuedDate: new Date().toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                    }),
                },
                verification: {
                    verificationCode: 'PREVIEW123',
                    enableQRCode: settings.enableQRCode,
                    qrCodePosition: settings.qrCodePosition,
                    showVerificationURL: settings.showVerificationURL,
                },
                customization: {
                    layout: settings.defaultLayout,
                    enableDigitalSignature: settings.enableDigitalSignature,
                    signatureImage: settings.digitalSignatureUrl,
                    signatureName: settings.signatureName,
                    signatureDesignation:
                        settings.signatureDesignation ||
                        (institutionType === 'school'
                            ? 'Principal'
                            : institutionType === 'academy'
                                ? 'Director'
                                : 'Head of Institute'),
                    enableWatermark: settings.enableWatermark,
                    watermarkText: settings.watermarkText || 'PREVIEW',
                    borderStyle: 'decorative',
                },
            }

            const res = await fetch('/api/certificates/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockData),
            })

            if (!res.ok) {
                throw new Error('Failed to generate preview')
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)

            // Revoke old URL to prevent memory leak
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
            }

            setPdfUrl(url)
        } catch (err: any) {
            setError(err.message)
            console.error('[Certificate Preview]', err)
        } finally {
            setLoading(false)
        }
    }

    // ── Auto-refresh on settings change ──────────────────────

    useEffect(() => {
        if (autoRefresh) {
            const debounce = setTimeout(() => {
                generatePreview()
            }, 800)

            return () => clearTimeout(debounce)
        }
    }, [
        settings.defaultLayout,
        settings.enableQRCode,
        settings.qrCodePosition,
        settings.showVerificationURL,
        settings.enableDigitalSignature,
        settings.digitalSignatureUrl,
        settings.enableWatermark,
        settings.watermarkText,
        settings.showAccreditationsOnCertificate,
        autoRefresh,
    ])

    // ── Manual Refresh ───────────────────────────────────────

    const handleRefresh = () => {
        generatePreview()
    }

    // ── Download Preview ─────────────────────────────────────

    const handleDownload = () => {
        if (!pdfUrl) return

        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = `certificate-preview-${Date.now()}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // ── Cleanup ──────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl)
            }
        }
    }, [pdfUrl])

    // ── Render ───────────────────────────────────────────────

    return (
        <div
            className="rounded-[var(--radius-lg)] border overflow-hidden"
            style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-card)',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-subtle)',
                }}
            >
                <div className="flex items-center gap-2">
                    <Eye size={16} style={{ color: 'var(--primary-600)' }} />
                    <h3
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Live Preview
                    </h3>
                    {autoRefresh && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                                background: 'var(--success-light)',
                                color: 'var(--success-dark)',
                            }}
                        >
                            Auto-refresh
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDownload}
                        disabled={!pdfUrl || loading}
                    >
                        <Download size={13} />
                        Download
                    </Button>
                </div>
            </div>

            {/* Preview Area */}
            <div
                className="relative"
                style={{
                    minHeight: '500px',
                    background: 'var(--bg-subtle)',
                }}
            >
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2
                            size={32}
                            className="animate-spin"
                            style={{ color: 'var(--primary-600)' }}
                        />
                        <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Generating preview...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div
                            className="text-center p-6 rounded-[var(--radius-md)] border max-w-md"
                            style={{
                                background: 'var(--danger-light)',
                                borderColor: 'var(--danger)',
                            }}
                        >
                            <p
                                className="text-sm font-medium mb-2"
                                style={{ color: 'var(--danger-dark)' }}
                            >
                                Preview Generation Failed
                            </p>
                            <p
                                className="text-xs mb-4"
                                style={{ color: 'var(--danger-dark)' }}
                            >
                                {error}
                            </p>
                            <Button size="sm" onClick={handleRefresh}>
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}

                {pdfUrl && !loading && (
                    <iframe
                        src={pdfUrl}
                        className="w-full border-0"
                        style={{ height: '600px' }}
                        title="Certificate Preview"
                    />
                )}

                {!pdfUrl && !loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8">
                            <Eye
                                size={48}
                                className="mx-auto mb-4"
                                style={{ color: 'var(--text-muted)' }}
                            />
                            <p
                                className="text-sm font-medium mb-2"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                No Preview Available
                            </p>
                            <p
                                className="text-xs mb-4"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Configure settings above to see live preview
                            </p>
                            <Button size="sm" onClick={generatePreview}>
                                Generate Preview
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div
                className="px-4 py-2.5 border-t text-xs"
                style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                }}
            >
                <p>
                    ℹ️ This is a sample preview with dummy data. Actual certificates will
                    use real student/staff information and dynamic content from
                    templates.
                </p>
            </div>
        </div>
    )
}