// FILE: src/components/security/ChangePasswordCard.tsx
// Universal change password card — used in ALL role portals

'use client'

import { useState } from 'react'
import { Card, Button, Alert } from '@/components/ui'
import { Lock, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react'

interface PasswordStrength {
    score: number

    
    label: string
    color: string
    bgColor: string
}

function getPasswordStrength(password: string): PasswordStrength {
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++

    if (score <= 1) return { score, label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Fair', color: 'text-amber-600', bgColor: 'bg-amber-500' }
    if (score <= 3) return { score, label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-500' }
    if (score <= 4) return { score, label: 'Strong', color: 'text-emerald-600', bgColor: 'bg-emerald-500' }
    return { score, label: 'Very Strong', color: 'text-emerald-700', bgColor: 'bg-emerald-600' }
}

export function ChangePasswordCard() {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [success, setSuccess] = useState(false)

    const strength = form.newPassword ? getPasswordStrength(form.newPassword) : null
    const passwordsMatch = form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword
    const passwordsMismatch = form.confirmPassword && form.newPassword !== form.confirmPassword

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAlert(null)
        setSuccess(false)

        if (!form.currentPassword) {
            setAlert({ type: 'error', msg: 'Please enter your current password' })
            return
        }
        if (!form.newPassword || form.newPassword.length < 6) {
            setAlert({ type: 'error', msg: 'New password must be at least 6 characters' })
            return
        }
        if (form.newPassword !== form.confirmPassword) {
            setAlert({ type: 'error', msg: 'New passwords do not match' })
            return
        }
        if (form.currentPassword === form.newPassword) {
            setAlert({ type: 'error', msg: 'New password must be different from current password' })
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            setLoading(false)

            if (data.success) {
                setSuccess(true)
                setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setAlert({ type: 'success', msg: 'Password changed successfully! Use your new password on next login.' })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to change password' })
            }
        } catch {
            setLoading(false)
            setAlert({ type: 'error', msg: 'Something went wrong. Please try again.' })
        }
    }

    // Success State
    if (success) {
        return (
            <Card>
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-50">
                        <ShieldCheck size={24} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-800 mb-1">Change Password</h3>

                        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                                <Check size={28} className="text-emerald-600" />
                            </div>
                            <h4 className="text-base font-semibold text-emerald-800 mb-1">Password Changed!</h4>
                            <p className="text-sm text-emerald-600 mb-4">
                                Your password has been updated. Use it on your next login.
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSuccess(false)}
                            >
                                Change Again
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card>
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-100">
                    <Lock size={24} className="text-slate-600" />
                </div>
                <div className="flex-1">
                    <div className="mb-1">
                        <h3 className="text-base font-semibold text-slate-800">Change Password</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Update your account password. Choose a strong password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">

                        {/* Current Password */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={form.currentPassword}
                                    onChange={e => { setForm(f => ({ ...f, currentPassword: e.target.value })); setAlert(null) }}
                                    className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors placeholder:text-slate-400"
                                    placeholder="Enter current password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-slate-400 font-medium">New Password</span>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={form.newPassword}
                                    onChange={e => { setForm(f => ({ ...f, newPassword: e.target.value })); setAlert(null) }}
                                    className="w-full h-10 px-3 pr-10 text-sm rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors placeholder:text-slate-400"
                                    placeholder="Minimum 6 characters"
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>

                            {/* Password Strength Meter */}
                            {form.newPassword && strength && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.score ? strength.bgColor : 'bg-slate-100'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${strength.color}`}>
                                        {strength.label}
                                    </p>
                                </div>
                            )}

                            {/* Password Requirements */}
                            {form.newPassword && (
                                <div className="mt-2 space-y-1">
                                    {[
                                        { check: form.newPassword.length >= 6, text: 'At least 6 characters' },
                                        { check: form.newPassword.length >= 8, text: '8+ characters (recommended)' },
                                        { check: /[A-Z]/.test(form.newPassword), text: 'Uppercase letter' },
                                        { check: /[0-9]/.test(form.newPassword), text: 'Number' },
                                        { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.newPassword), text: 'Special character' },
                                    ].map((rule, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            {rule.check ? (
                                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <Check size={8} className="text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full bg-slate-100" />
                                            )}
                                            <span className={`text-xs ${rule.check ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {rule.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setAlert(null) }}
                                    className={`w-full h-10 px-3 pr-10 text-sm rounded-lg border bg-white transition-colors placeholder:text-slate-400 ${passwordsMismatch
                                            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50'
                                            : passwordsMatch
                                                ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50'
                                                : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                                        }`}
                                    placeholder="Re-enter new password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>

                            {/* Match indicator */}
                            {form.confirmPassword && (
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    {passwordsMatch ? (
                                        <>
                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Check size={8} className="text-emerald-600" />
                                            </div>
                                            <span className="text-xs text-emerald-600">Passwords match</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-3.5 h-3.5 rounded-full bg-red-100 flex items-center justify-center">
                                                <span className="text-red-600 text-[8px] font-bold">✕</span>
                                            </div>
                                            <span className="text-xs text-red-500">Passwords do not match</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Alert */}
                        {alert && (
                            <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                        )}

                        {/* Submit */}
                        <div className="pt-1">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                disabled={
                                    !form.currentPassword ||
                                    !form.newPassword ||
                                    form.newPassword.length < 6 ||
                                    form.newPassword !== form.confirmPassword
                                }
                                className="w-full sm:w-auto"
                            >
                                <Lock size={14} />
                                Update Password
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Card>
    )
}