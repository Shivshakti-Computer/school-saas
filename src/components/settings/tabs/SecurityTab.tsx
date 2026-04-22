// FILE: src/components/settings/tabs/SecurityTab.tsx
// NEW FILE — Security settings as Settings tab
// Reuses existing ChangePasswordCard component
// API routes unchanged — 100% backward compatible
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, Button, Alert, Badge, Modal } from '@/components/ui'
import { ChangePasswordCard } from '@/components/security/ChangePasswordCard'
import {
  Shield, ShieldCheck, ShieldOff, Smartphone,
  Key, Copy, Check, RefreshCw,
  AlertTriangle, Clock,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface TwoFAStatus {
  enabled: boolean
  method: string
  backupCodesRemaining: number
  trustedDevicesCount: number
  lastVerifiedAt: string | null
}

export function SecurityTab() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<TwoFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; msg: string } | null>(null)

  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedAll, setCopiedAll] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  useEffect(() => { fetchStatus() }, [])

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

  const handleDisable = async () => {
    setActionLoading(true)
    setAlert(null)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setShowDisableConfirm(false)
        await fetchStatus()
        setAlert({ type: 'warning', msg: '2FA has been disabled.' })
      } else {
        setAlert({ type: 'error', msg: data.error || 'Failed to disable 2FA' })
      }
    } catch {
      setAlert({ type: 'error', msg: 'Failed to disable 2FA' })
    } finally {
      setActionLoading(false)
    }
  }

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
        setAlert({ type: 'success', msg: 'New backup codes generated.' })
      } else {
        setAlert({ type: 'error', msg: data.error || 'Failed to regenerate codes' })
      }
    } catch {
      setAlert({ type: 'error', msg: 'Failed to regenerate codes' })
    } finally {
      setActionLoading(false)
    }
  }

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading security settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      {alert && (
        <div className="mb-5">
          <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
        </div>
      )}

      <ChangePasswordCard />

      <Card>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${status?.enabled ? 'bg-success-50' : 'bg-[var(--bg-muted)]'}`}>
            {status?.enabled ? (
              <ShieldCheck size={24} className="text-success-600" />
            ) : (
              <Shield size={24} className="text-[var(--text-muted)]" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Two-Factor Authentication</h3>
              <Badge variant={status?.enabled ? 'success' : 'warning'}>
                {status?.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {status?.enabled
                ? 'Your account is protected with OTP verification during login.'
                : 'Add extra security. An OTP will be sent to your phone during login.'}
            </p>

            <div className="mt-4">
              {status?.enabled ? (
                <Button variant="danger" size="sm" onClick={() => setShowDisableConfirm(true)} loading={actionLoading}>
                  <ShieldOff size={14} /> Disable 2FA
                </Button>
              ) : (
                <Button variant="primary" onClick={handleEnable} loading={actionLoading}>
                  <ShieldCheck size={14} /> Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {status?.enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info-50">
                  <Smartphone size={16} className="text-info-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Method</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {status.method === 'otp_phone' ? 'Phone OTP' : 'Email OTP'}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${status.backupCodesRemaining <= 2 ? 'bg-danger-50' : 'bg-success-50'}`}>
                  <Key size={16} className={status.backupCodesRemaining <= 2 ? 'text-danger-600' : 'text-success-600'} />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Backup Codes</p>
                  <p className={`text-sm font-semibold ${status.backupCodesRemaining <= 2 ? 'text-danger-600' : 'text-[var(--text-primary)]'}`}>
                    {status.backupCodesRemaining} remaining
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Smartphone size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Trusted Devices</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{status.trustedDevicesCount} active</p>
                </div>
              </div>
            </Card>
          </div>

          {status.backupCodesRemaining <= 2 && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-warning-800">Low Backup Codes</p>
                <p className="text-xs text-warning-600 mt-0.5">
                  Only {status.backupCodesRemaining} left. Generate new ones.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowRegenerateConfirm(true)}>
                <RefreshCw size={12} /> Regenerate
              </Button>
            </div>
          )}

          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Security Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-muted)] transition-colors group text-left"
              >
                <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                  <RefreshCw size={16} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Regenerate Backup Codes</p>
                  <p className="text-xs text-[var(--text-muted)]">Old codes become invalid</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>

              {status.lastVerifiedAt && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-subtle)]">
                  <Clock size={14} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">
                    Last verified: <span className="font-medium text-[var(--text-primary)]">
                      {new Date(status.lastVerifiedAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Security Tips</h3>
        <div className="space-y-2.5">
          {[
            { icon: '🔐', text: 'Enable 2FA for maximum account protection' },
            { icon: '🔑', text: 'Use a strong, unique password for your account' },
            { icon: '📱', text: 'Keep your phone number updated for OTP delivery' },
            { icon: '💾', text: 'Store backup codes in a safe place' },
            { icon: '🚫', text: 'Never share your password or OTP with anyone' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-sm flex-shrink-0 mt-0.5">{tip.icon}</span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <Portal>
        <Modal open={showBackupCodes} onClose={() => setShowBackupCodes(false)} title="Your Backup Codes" size="sm">
          <div className="space-y-4">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-700"><strong>Save these now!</strong> They won&apos;t be shown again.</p>
            </div>
            <div className="bg-[var(--bg-subtle)] rounded-xl p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-center">
                    <span className="font-mono text-sm font-bold text-[var(--text-primary)] tracking-wider">{code}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={copyAllCodes}>
                {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                {copiedAll ? 'Copied!' : 'Copy All'}
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => setShowBackupCodes(false)}>
                I&apos;ve Saved These
              </Button>
            </div>
          </div>
        </Modal>

        <Modal open={showDisableConfirm} onClose={() => setShowDisableConfirm(false)} title="Disable 2FA?" size="sm">
          <div className="space-y-4">
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger-700">Your account will be less secure without 2FA.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowDisableConfirm(false)}>Cancel</Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={handleDisable} loading={actionLoading}>Yes, Disable</Button>
            </div>
          </div>
        </Modal>

        <Modal open={showRegenerateConfirm} onClose={() => setShowRegenerateConfirm(false)} title="Regenerate Codes?" size="sm">
          <div className="space-y-4">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-700">Old backup codes will become <strong>invalid</strong>.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowRegenerateConfirm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleRegenerateCodes} loading={actionLoading}>
                <RefreshCw size={12} /> Regenerate
              </Button>
            </div>
          </div>
        </Modal>
      </Portal>
    </div>
  )
}