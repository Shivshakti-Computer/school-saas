// FILE: src/app/(public)/verify/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Shield, ArrowRight, Lock } from 'lucide-react'

export default function VerifyCertificatePage() {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = code.trim()
        if (!trimmed) return
        setLoading(true)
        router.push(`/verify/${encodeURIComponent(trimmed)}`)
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'var(--bg-base)' }}>
            <div className="w-full max-w-sm">

                {/* Hero Icon */}
                <div className="text-center mb-8">
                    <div className="relative inline-flex items-center justify-center mb-5">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                            }}>
                            <Shield size={28} color="white" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{
                                background: 'var(--success)',
                                borderColor: 'var(--bg-base)',
                            }}>
                            <Lock size={7} color="white" strokeWidth={3} />
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        Certificate Verification
                    </h1>
                    <p className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-muted)' }}>
                        Instantly verify the authenticity of any certificate issued through our platform
                    </p>
                </div>

                {/* Main Card */}
                <div className="rounded-2xl border overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                    }}>

                    {/* Card Top Accent */}
                    <div className="h-1 w-full"
                        style={{
                            background: 'linear-gradient(90deg, var(--primary-500), var(--primary-400), var(--accent-400))',
                        }} />

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="code"
                                    className="block text-xs font-semibold mb-1.5 tracking-wide"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        color: 'var(--text-primary)',
                                        letterSpacing: '0.04em',
                                    }}>
                                    VERIFICATION CODE
                                </label>

                                {/* Input wrapper */}
                                <div className="relative flex items-center">
                                    <span className="absolute left-3 pointer-events-none"
                                        style={{ color: 'var(--text-muted)' }}>
                                        <Search size={15} />
                                    </span>
                                    <input
                                        id="code"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="SCHOOL-CERT-AB12CD34"
                                        autoFocus
                                        autoComplete="off"
                                        spellCheck={false}
                                        disabled={loading}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-mono
                               tracking-wider border transition-all duration-200 outline-none"
                                        style={{
                                            background: 'var(--bg-subtle)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--text-primary)',
                                            fontFamily: 'var(--font-mono)',
                                        }}
                                        onFocus={e => {
                                            e.target.style.borderColor = 'var(--primary-500)'
                                            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'
                                            e.target.style.background = 'var(--bg-card)'
                                        }}
                                        onBlur={e => {
                                            e.target.style.borderColor = 'var(--border)'
                                            e.target.style.boxShadow = 'none'
                                            e.target.style.background = 'var(--bg-subtle)'
                                        }}
                                    />
                                </div>
                                <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Found at the bottom of your certificate
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!code.trim() || loading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                           rounded-xl text-sm font-semibold text-white
                           transition-all duration-200 relative overflow-hidden"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    background: !code.trim() || loading
                                        ? 'var(--border-strong)'
                                        : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                    cursor: !code.trim() || loading ? 'not-allowed' : 'pointer',
                                    boxShadow: !code.trim() || loading
                                        ? 'none'
                                        : '0 4px 14px rgba(99,102,241,0.35)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                                        Verifying…
                                    </>
                                ) : (
                                    <>
                                        Verify Certificate
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-3 flex items-center gap-2 border-t"
                        style={{
                            background: 'var(--bg-subtle)',
                            borderColor: 'var(--border)',
                        }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Example:</span>
                        <code className="text-xs px-2 py-0.5 rounded-md"
                            style={{
                                fontFamily: 'var(--font-mono)',
                                background: 'var(--bg-muted)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                            }}>
                            INST-CERT-ABC123
                        </code>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                        { icon: '🔒', label: 'Encrypted' },
                        { icon: '⚡', label: 'Instant' },
                        { icon: '✓', label: 'Tamper-proof' },
                    ].map(({ icon, label }) => (
                        <div key={label}
                            className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border"
                            style={{
                                background: 'var(--bg-card)',
                                borderColor: 'var(--border)',
                            }}>
                            <span className="text-base">{icon}</span>
                            <span className="text-xs font-medium"
                                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}