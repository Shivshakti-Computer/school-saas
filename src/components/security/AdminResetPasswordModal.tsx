// FILE: src/components/security/AdminResetPasswordModal.tsx
// Admin can reset password for any teacher/student/parent

'use client'

import { useState } from 'react'
import { Modal, Button, Alert } from '@/components/ui'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

interface Props {
    open: boolean
    onClose: () => void
    user: {
        id: string
        name: string
        role: string
        phone: string
    } | null
}

function generateRandomPassword(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)]
    }
    return password
}

export function AdminResetPasswordModal({ open, onClose, user }: Props) {
    const [newPassword, setNewPassword] = useState('')
    const [showPassword, setShowPassword] = useState(true)
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [done, setDone] = useState(false)

    const handleGenerate = () => {
        const pwd = generateRandomPassword(8)
        setNewPassword(pwd)
        setShowPassword(true)
    }

    const handleReset = async () => {
        if (!user || !newPassword) return
        if (newPassword.length < 6) {
            setAlert({ type: 'error', msg: 'Password must be at least 6 characters' })
            return
        }

        setLoading(true)
        setAlert(null)

        try {
            const res = await fetch('/api/auth/admin-reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    newPassword,
                }),
            })
            const data = await res.json()
            setLoading(false)

            if (data.success) {
                setDone(true)
                setAlert({ type: 'success', msg: data.message })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to reset password' })
            }
        } catch {
            setLoading(false)
            setAlert({ type: 'error', msg: 'Something went wrong' })
        }
    }

    const handleClose = () => {
        setNewPassword('')
        setShowPassword(true)
        setLoading(false)
        setAlert(null)
        setDone(false)
        onClose()
    }

    if (!user) return null

    return (
        <Modal open={open} onClose={handleClose} title="Reset User Password" size="sm">
            <div className="space-y-4">

                {/* User Info */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.role} · {user.phone}</p>
                    </div>
                </div>

                {!done ? (
                    <>
                        {/* New Password Input */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                New Password
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => { setNewPassword(e.target.value); setAlert(null) }}
                                        className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors placeholder:text-slate-400 font-mono"
                                        placeholder="Min 6 characters"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    onClick={handleGenerate}
                                    title="Generate random password"
                                >
                                    <RefreshCw size={14} />
                                </Button>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-400">
                                Share this password with the user securely
                            </p>
                        </div>

                        {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <Button variant="secondary" size="sm" className="flex-1" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-1"
                                onClick={handleReset}
                                loading={loading}
                                disabled={!newPassword || newPassword.length < 6}
                            >
                                Reset Password
                            </Button>
                        </div>
                    </>
                ) : (
                    /* Success State */
                    <>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-emerald-800">Password Reset!</p>
                            <p className="text-xs text-emerald-600 mt-1">
                                New password for {user.name}:
                            </p>
                            <div className="mt-2 bg-white border border-emerald-200 rounded-lg px-4 py-2">
                                <span className="font-mono text-base font-bold text-emerald-700 tracking-wider select-all">
                                    {newPassword}
                                </span>
                            </div>
                            <p className="text-xs text-emerald-500 mt-2">
                                📋 Share this password with the user securely
                            </p>
                        </div>

                        {alert && <Alert type={alert.type} message={alert.msg} />}

                        <Button variant="primary" size="sm" className="w-full" onClick={handleClose}>
                            Done
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    )
}