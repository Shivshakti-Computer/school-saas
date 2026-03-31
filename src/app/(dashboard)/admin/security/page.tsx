// FILE: src/app/(dashboard)/admin/security/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, PageHeader, Button, Alert, Badge, Modal } from '@/components/ui'
import {
    Shield, ShieldCheck, ShieldOff, Smartphone,
    Key, Copy, Check, RefreshCw, Trash2,
    AlertTriangle, Clock, Eye, EyeOff,
} from 'lucide-react'

interface TwoFAStatus {
    enabled: boolean
    method: string
    backupCodesRemaining: number
    trustedDevicesCount: number
    lastVerifiedAt: string | null
}

export default function SecurityPage() {
    const { data: session } = useSession()
    const [status, setStatus] = useState<TwoFAStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; msg: string } | null>(null)

    // Backup codes modal
    const [showBackupCodes, setShowBackupCodes] = useState(false)
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [copiedAll, setCopiedAll] = useState(false)

    // Confirm disable modal
    const [showDisableConfirm, setShowDisableConfirm] = useState(false)

    // Regenerate codes modal
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

    // Fetch 2FA status
    useEffect(() => {
        fetchStatus()
    }, [])

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/auth/2fa/setup')
            const data = await res.json()
            setStatus(data)
        } catch {
            setAlert({ type: 'error', msg: 'Failed to load security settings' })
        } finally {
            setLoading(false)
        }
    }

    // Enable 2FA
    const handleEnable = async () => {
        setActionLoading(true)
        setAlert(null)
        try {
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'otp_phone' }),
            })
            const data = await res.json()

            if (data.success) {
                setBackupCodes(data.backupCodes)
                setShowBackupCodes(true)
                await fetchStatus()
                setAlert({ type: 'success', msg: '2FA enabled successfully! Save your backup codes.' })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to enable 2FA' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Failed to enable 2FA' })
        } finally {
            setActionLoading(false)
        }
    }

    // Disable 2FA
    const handleDisable = async () => {
        setActionLoading(true)
        setAlert(null)
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                setShowDisableConfirm(false)
                await fetchStatus()
                setAlert({ type: 'warning', msg: '2FA has been disabled. Your account is now less secure.' })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to disable 2FA' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Failed to disable 2FA' })
        } finally {
            setActionLoading(false)
        }
    }

    // Regenerate backup codes
    const handleRegenerateCodes = async () => {
        setActionLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/backup-codes', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setBackupCodes(data.backupCodes)
                setShowRegenerateConfirm(false)
                setShowBackupCodes(true)
                await fetchStatus()
                setAlert({ type: 'success', msg: 'New backup codes generated. Old codes are now invalid.' })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to regenerate codes' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Failed to regenerate codes' })
        } finally {
            setActionLoading(false)
        }
    }

    // Copy backup codes
    const copyAllCodes = () => {
        const text = backupCodes.join('\n')
        navigator.clipboard.writeText(text)
        setCopiedAll(true)
        setTimeout(() => setCopiedAll(false), 2000)
    }

    if (loading) {
        return (
            <div>
                <PageHeader title="Security" subtitle="Manage your account security settings" />
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">Loading security settings...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                title="Security"
                subtitle="Manage two-factor authentication and account security"
            />

            {alert && (
                <div className="mb-5">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            <div className="max-w-2xl space-y-5">

                {/* ═══ 2FA Status Card ═══ */}
                <Card>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${status?.enabled ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                            {status?.enabled ? (
                                <ShieldCheck size={24} className="text-emerald-600" />
                            ) : (
                                <Shield size={24} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-slate-800">
                                    Two-Factor Authentication
                                </h3>
                                <Badge variant={status?.enabled ? 'success' : 'warning'}>
                                    {status?.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {status?.enabled
                                    ? 'Your account is protected with an additional layer of security. An OTP will be sent to your phone during login.'
                                    : 'Add an extra layer of security to your admin account. When enabled, you\'ll need to enter an OTP from your phone during login.'
                                }
                            </p>

                            {/* Action Button */}
                            <div className="mt-4">
                                {status?.enabled ? (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setShowDisableConfirm(true)}
                                        loading={actionLoading}
                                    >
                                        <ShieldOff size={14} />
                                        Disable 2FA
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={handleEnable}
                                        loading={actionLoading}
                                    >
                                        <ShieldCheck size={14} />
                                        Enable 2FA
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* ═══ 2FA Details (when enabled) ═══ */}
                {status?.enabled && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Method */}
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-50">
                                        <Smartphone size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Method</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {status.method === 'otp_phone' ? 'Phone OTP' : status.method === 'otp_email' ? 'Email OTP' : 'Authenticator'}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Backup Codes */}
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${status.backupCodesRemaining <= 2 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                        <Key size={16} className={status.backupCodesRemaining <= 2 ? 'text-red-600' : 'text-emerald-600'} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Backup Codes</p>
                                        <p className={`text-sm font-semibold ${status.backupCodesRemaining <= 2 ? 'text-red-600' : 'text-slate-700'}`}>
                                            {status.backupCodesRemaining} remaining
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Trusted Devices */}
                            <Card>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-50">
                                        <Smartphone size={16} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Trusted Devices</p>
                                        <p className="text-sm font-semibold text-slate-700">{status.trustedDevicesCount} active</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Low backup codes warning */}
                        {status.backupCodesRemaining <= 2 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-800">
                                        Low Backup Codes
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        You only have {status.backupCodesRemaining} backup codes left. Generate new ones to avoid being locked out.
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowRegenerateConfirm(true)}
                                >
                                    <RefreshCw size={12} />
                                    Regenerate
                                </Button>
                            </div>
                        )}

                        {/* Actions */}
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Security Actions</h3>
                            <div className="space-y-3">
                                {/* Regenerate Backup Codes */}
                                <button
                                    onClick={() => setShowRegenerateConfirm(true)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group text-left"
                                >
                                    <div className="p-2 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                                        <RefreshCw size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700">Regenerate Backup Codes</p>
                                        <p className="text-xs text-slate-400">Generate new backup codes (old ones become invalid)</p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                </button>

                                {/* Last verified */}
                                {status.lastVerifiedAt && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                                        <Clock size={14} className="text-slate-400" />
                                        <p className="text-xs text-slate-500">
                                            Last 2FA verification: <span className="font-medium text-slate-700">
                                                {new Date(status.lastVerifiedAt).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </>
                )}

                {/* ═══ Security Tips ═══ */}
                <Card>
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Security Tips</h3>
                    <div className="space-y-2.5">
                        {[
                            { icon: '🔐', text: 'Enable 2FA for maximum account protection' },
                            { icon: '📱', text: 'Keep your phone number up-to-date for OTP delivery' },
                            { icon: '🔑', text: 'Store backup codes in a safe place (password manager recommended)' },
                            { icon: '🚫', text: 'Never share your OTP or backup codes with anyone' },
                            { icon: '🔄', text: 'Change your password regularly and use a strong one' },
                        ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <span className="text-sm flex-shrink-0 mt-0.5">{tip.icon}</span>
                                <p className="text-xs text-slate-500 leading-relaxed">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ═══ Backup Codes Modal ═══ */}
            <Modal
                open={showBackupCodes}
                onClose={() => setShowBackupCodes(false)}
                title="Your Backup Codes"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            <strong>Save these codes now!</strong> They won&apos;t be shown again. Each code can only be used once.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-center">
                                    <span className="font-mono text-sm font-bold text-slate-700 tracking-wider">{code}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={copyAllCodes}
                        >
                            {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                            {copiedAll ? 'Copied!' : 'Copy All'}
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowBackupCodes(false)}
                        >
                            I&apos;ve Saved These
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ Disable Confirm Modal ═══ */}
            <Modal
                open={showDisableConfirm}
                onClose={() => setShowDisableConfirm(false)}
                title="Disable Two-Factor Authentication?"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 leading-relaxed">
                            Disabling 2FA will make your account less secure. Anyone with your password can access your admin panel.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowDisableConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            className="flex-1"
                            onClick={handleDisable}
                            loading={actionLoading}
                        >
                            Yes, Disable 2FA
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ═══ Regenerate Confirm Modal ═══ */}
            <Modal
                open={showRegenerateConfirm}
                onClose={() => setShowRegenerateConfirm(false)}
                title="Regenerate Backup Codes?"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            All existing backup codes will become <strong>invalid</strong>. New codes will be generated.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowRegenerateConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={handleRegenerateCodes}
                            loading={actionLoading}
                        >
                            <RefreshCw size={12} />
                            Regenerate
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}