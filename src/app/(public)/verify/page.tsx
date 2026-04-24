// FILE: src/app/(public)/verify/page.tsx
// Public certificate verification search page
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Search, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'

export default function VerifySearchPage() {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const cleanCode = code.trim().toUpperCase()

        // ✅ Updated validation
        const isValid = /^[A-Z0-9]{1,6}-CERT-[A-Z0-9]{8}$/.test(cleanCode)

        if (!isValid) {
            setError('Invalid format. Code should be like SHIV-CERT-AB12CD34')
            return
        }

        setLoading(true)
        router.push(`/verify/${cleanCode}`)
    }

    return (
        <div className="py-16 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-[var(--radius-xl)] mx-auto mb-4
                       flex items-center justify-center"
                        style={{
                            background: 'var(--primary-50)',
                            border: '1px solid var(--primary-200)',
                            color: 'var(--primary-600)',
                        }}
                    >
                        <ShieldCheck size={28} />
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Verify Certificate
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Enter the verification code from your certificate to check its authenticity.
                    </p>
                </div>

                {/* Search Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-[var(--radius-xl)] p-6"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    <div className="mb-4">
                        <label
                            className="input-label"
                            htmlFor="verify-code"
                        >
                            Verification Code
                        </label>
                        <div className="relative">
                            <input
                                id="verify-code"
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value)
                                    setError(null)
                                }}
                                placeholder="e.g., SHIV-CERT-AB12CD34"
                                className="input-clean pr-10 font-mono uppercase"
                                autoComplete="off"
                            />
                            <Search
                                size={16}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--text-muted)' }}
                            />
                        </div>
                        <p className="input-hint">
                            Code is printed on the certificate footer or embedded in QR code.
                        </p>
                    </div>

                    {error && (
                        <div
                            className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-md)]"
                            style={{
                                background: 'var(--danger-light)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: 'var(--danger-dark)',
                            }}
                        >
                            <AlertCircle size={14} className="flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        loading={loading}
                        disabled={!code.trim()}
                    >
                        Verify Certificate
                    </Button>
                </form>

                {/* Help Text */}
                <p
                    className="text-center text-xs mt-6"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Need help? Contact the issuing institution for assistance.
                </p>
            </div>
        </div>
    )
}