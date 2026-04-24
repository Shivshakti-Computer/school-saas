// FILE: src/components/certificates/IssuedList.tsx
// List of issued certificates with download + revoke actions
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import {
    Download,
    ExternalLink,
    RotateCcw,
    CheckCircle,
    XCircle,
    Save,
} from 'lucide-react'
import { Badge, Button, Modal, Alert, Spinner } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'

// ── Types ──────────────────────────────────────────────────

interface IssuedCertificate {
    _id: string
    recipientName: string
    recipientIdentifier: string
    recipientType: string
    certificateType: string
    certificateNumber: string
    title: string
    issuedByName: string
    issuedDate: string
    verificationCode: string
    pdfUrl?: string
    savedToStorage: boolean
    status: 'issued' | 'revoked'
    revokedAt?: string
    revokedReason?: string
    class?: string
    section?: string
    createdAt: string
}

interface IssuedListProps {
    certificates: IssuedCertificate[]
    loading: boolean
    onRevoked: (id: string) => void
    onPdfSaved: (id: string, pdfUrl: string) => void
}

// ── Component ──────────────────────────────────────────────

export function IssuedList({
    certificates,
    loading,
    onRevoked,
    onPdfSaved,
}: IssuedListProps) {
    const [revokeModal, setRevokeModal] = useState<{
        open: boolean
        certId: string
        certNumber: string
    }>({ open: false, certId: '', certNumber: '' })

    const [revokeReason, setRevokeReason] = useState('')
    const [revoking, setRevoking] = useState(false)
    const [revokeError, setRevokeError] = useState<string | null>(null)

    const [savingPdf, setSavingPdf] = useState<string | null>(null)
    const [toast, setToast] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)

    // ── Auto-clear toast ───────────────────────────────────────
    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3500)
    }

    // ── Download PDF (on-demand) ───────────────────────────────
    const handleDownload = (cert: IssuedCertificate) => {
        if (cert.pdfUrl) {
            window.open(cert.pdfUrl, '_blank')
            return
        }
        window.open(`/api/pdf/certificate/${cert._id}`, '_blank')
    }

    // ── Save PDF to Storage ────────────────────────────────────
    const handleSavePdf = async (cert: IssuedCertificate) => {
        setSavingPdf(cert._id)

        try {
            const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_pdf',
                    issuedCertId: cert._id,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 413) {
                    showToast('error', 'Storage limit exceeded. Please upgrade your plan.')
                } else {
                    throw new Error(data.error || 'Failed to save PDF')
                }
                return
            }

            onPdfSaved(cert._id, data.pdfUrl)
            showToast('success', 'PDF saved to storage successfully')
        } catch (err: any) {
            showToast('error', err.message)
        } finally {
            setSavingPdf(null)
        }
    }

    // ── Revoke ─────────────────────────────────────────────────
    const handleRevoke = async () => {
        setRevokeError(null)

        if (!revokeReason.trim() || revokeReason.trim().length < 3) {
            setRevokeError('Please provide a reason (min 3 characters)')
            return
        }

        setRevoking(true)

        try {
            const res = await fetch(
                `/api/certificates?id=${revokeModal.certId}&type=issued`,
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: revokeReason }),
                }
            )

            const data = await res.json()
            if (!res.ok)
                throw new Error(data.error || 'Failed to revoke certificate')

            setRevokeModal({ open: false, certId: '', certNumber: '' })
            setRevokeReason('')
            onRevoked(revokeModal.certId)
            showToast('success', 'Certificate revoked successfully')
        } catch (err: any) {
            setRevokeError(err.message)
        } finally {
            setRevoking(false)
        }
    }

    // ── Status Badge ───────────────────────────────────────────
    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'issued') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5
                         text-xs font-semibold rounded-full"
                    style={{
                        background: 'var(--success-light)',
                        color: 'var(--success-dark)',
                    }}>
                    <CheckCircle size={11} />
                    Active
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5
                       text-xs font-semibold rounded-full"
                style={{
                    background: 'var(--danger-light)',
                    color: 'var(--danger-dark)',
                }}>
                <XCircle size={11} />
                Revoked
            </span>
        )
    }

    // ── Empty ──────────────────────────────────────────────────
    if (!loading && certificates.length === 0) {
        return (
            <div className="py-16 text-center">
                <div
                    className="w-14 h-14 rounded-[var(--radius-xl)] mx-auto mb-4
                     flex items-center justify-center"
                    style={{
                        background: 'var(--bg-muted)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <CheckCircle size={22} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    No certificates issued yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Issue certificates from templates to see them here
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size="lg" />
            </div>
        )
    }

    // ── Render ─────────────────────────────────────────────────
    return (
        <>
            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-5 right-5 z-50 px-4 py-3
                     rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]
                     flex items-center gap-2 text-sm font-medium"
                    style={{
                        background: toast.type === 'success'
                            ? 'var(--success-light)'
                            : 'var(--danger-light)',
                        color: toast.type === 'success'
                            ? 'var(--success-dark)'
                            : 'var(--danger-dark)',
                        border: `1px solid ${toast.type === 'success'
                            ? 'rgba(16,185,129,0.3)'
                            : 'rgba(239,68,68,0.3)'}`,
                    }}
                >
                    {toast.type === 'success'
                        ? <CheckCircle size={15} />
                        : <XCircle size={15} />}
                    {toast.msg}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="portal-table">
                    <thead>
                        <tr>
                            <th>Certificate No.</th>
                            <th>Recipient</th>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Issued By</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map(cert => (
                            <tr key={cert._id}>
                                {/* Certificate Number */}
                                <td>
                                    <div>
                                        <p className="text-xs font-mono font-medium"
                                            style={{ color: 'var(--text-primary)' }}>
                                            {cert.certificateNumber}
                                        </p>
                                        <p className="text-[10px] mt-0.5"
                                            style={{ color: 'var(--text-muted)' }}>
                                            Code: {cert.verificationCode}
                                        </p>
                                    </div>
                                </td>

                                {/* Recipient */}
                                <td>
                                    <div>
                                        <p className="text-sm font-medium"
                                            style={{ color: 'var(--text-primary)' }}>
                                            {cert.recipientName}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {cert.recipientIdentifier}
                                            {cert.class && ` • Class ${cert.class}`}
                                            {cert.section && `-${cert.section}`}
                                        </p>
                                    </div>
                                </td>

                                {/* Type */}
                                <td>
                                    <Badge variant="primary">
                                        {cert.certificateType.replace(/_/g, ' ')}
                                    </Badge>
                                </td>

                                {/* Title */}
                                <td>
                                    <p className="text-sm max-w-[180px] truncate-2"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        {cert.title}
                                    </p>
                                </td>

                                {/* Issued By */}
                                <td>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {cert.issuedByName}
                                    </p>
                                </td>

                                {/* Date */}
                                <td>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {new Date(cert.issuedDate || cert.createdAt).toLocaleDateString(
                                            'en-IN',
                                            { day: '2-digit', month: 'short', year: 'numeric' }
                                        )}
                                    </p>
                                </td>

                                {/* Status */}
                                <td>
                                    <StatusBadge status={cert.status} />
                                </td>

                                {/* Actions */}
                                <td>
                                    {cert.status === 'issued' && (
                                        <div className="flex items-center gap-1">
                                            {/* Download */}
                                            <button
                                                onClick={() => handleDownload(cert)}
                                                title="Download Certificate PDF"
                                                className="btn-icon btn-icon-sm"
                                            >
                                                <Download size={13} />
                                            </button>

                                            {/* Save to Storage */}
                                            {!cert.savedToStorage && (
                                                <button
                                                    onClick={() => handleSavePdf(cert)}
                                                    disabled={savingPdf === cert._id}
                                                    title="Save PDF to storage for permanent link"
                                                    className="btn-icon btn-icon-sm"
                                                >
                                                    {savingPdf === cert._id
                                                        ? <Spinner size="sm" />
                                                        : <Save size={13} />}
                                                </button>
                                            )}

                                            {/* Verification Link */}
                                            <button
                                                onClick={() =>
                                                    window.open(
                                                        `/verify/${cert.verificationCode}`,
                                                        '_blank'
                                                    )
                                                }
                                                title="Open verification URL"
                                                className="btn-icon btn-icon-sm"
                                            >
                                                <ExternalLink size={13} />
                                            </button>

                                            {/* Revoke */}
                                            <button
                                                onClick={() =>
                                                    setRevokeModal({
                                                        open: true,
                                                        certId: cert._id,
                                                        certNumber: cert.certificateNumber,
                                                    })
                                                }
                                                title="Revoke certificate"
                                                className="btn-icon btn-icon-sm"
                                                style={{ color: 'var(--danger)' }}
                                            >
                                                <RotateCcw size={13} />
                                            </button>
                                        </div>
                                    )}

                                    {cert.status === 'revoked' && (
                                        <p className="text-xs italic"
                                            style={{ color: 'var(--text-muted)' }}>
                                            {cert.revokedReason
                                                ? cert.revokedReason.slice(0, 30) + '...'
                                                : 'Revoked'}
                                        </p>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Revoke Modal */}
            <Portal>
                <Modal
                    open={revokeModal.open}
                    onClose={() => {
                        setRevokeModal({ open: false, certId: '', certNumber: '' })
                        setRevokeReason('')
                        setRevokeError(null)
                    }}
                    title="Revoke Certificate"
                    size="sm"
                >
                    <div className="space-y-4">
                        {revokeError && (
                            <Alert
                                type="error"
                                message={revokeError}
                                onClose={() => setRevokeError(null)}
                            />
                        )}

                        <div
                            className="p-3 rounded-[var(--radius-md)]"
                            style={{
                                background: 'var(--warning-light)',
                                border: '1px solid rgba(245,158,11,0.3)',
                            }}
                        >
                            <p className="text-sm font-medium"
                                style={{ color: 'var(--warning-dark)' }}>
                                Revoking: {revokeModal.certNumber}
                            </p>
                            <p className="text-xs mt-1"
                                style={{ color: 'var(--warning-dark)' }}>
                                This action cannot be undone. The verification URL will show
                                this certificate as revoked.
                            </p>
                        </div>

                        <div>
                            <label className="input-label">
                                Reason for Revocation *
                            </label>
                            <textarea
                                value={revokeReason}
                                onChange={e => setRevokeReason(e.target.value)}
                                rows={3}
                                placeholder="e.g. Issued by mistake, Duplicate certificate, etc."
                                className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)]
                           border border-[var(--border)] resize-none
                           focus:border-[var(--danger)] focus:outline-none
                           focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]
                           transition-all"
                                style={{
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setRevokeModal({ open: false, certId: '', certNumber: '' })
                                    setRevokeReason('')
                                    setRevokeError(null)
                                }}
                                disabled={revoking}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleRevoke}
                                loading={revoking}
                            >
                                Revoke Certificate
                            </Button>
                        </div>
                    </div>
                </Modal>
            </Portal>
        </>
    )
}