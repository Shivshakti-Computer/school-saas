// =============================================================
// FILE: src/app/register/page.tsx
// Public school registration page — koi bhi school signup kar sake
// =============================================================

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Alert } from '@/components/ui'

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)   // 2-step form
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState<{ loginUrl: string; subdomain: string } | null>(null)

    const [form, setForm] = useState({
        schoolName: '',
        subdomain: '',
        address: '',
        adminName: '',
        phone: '',
        email: '',
        password: '',
        confirmPwd: '',
    })

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    // Auto-generate subdomain from school name
    const autoSubdomain = (name: string) =>
        name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '')
            .slice(0, 20)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (step === 1) { setStep(2); return }

        if (form.password !== form.confirmPwd) {
            setError('Passwords do not match')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError('')

        const res = await fetch('/api/schools/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const data = await res.json()
        setLoading(false)

        if (!res.ok) { setError(data.error ?? 'Registration failed'); return }

        setSuccess({ loginUrl: data.loginUrl, subdomain: data.subdomain })
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">
                        School registered successfully!
                    </h2>
                    <p className="text-slate-500 text-sm mb-6">
                        Aapka 15-day free trial shuru ho gaya hai. Ab login karein aur school setup karein.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                        <p className="text-xs text-slate-500 mb-2">Aapka login link:</p>
                        <p className="text-sm font-mono text-indigo-700 break-all">{success.loginUrl}</p>
                        <p className="text-xs text-slate-400 mt-2">
                            School code: <strong>{success.subdomain}</strong>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <a
                            href={success.loginUrl}
                            className="block w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium text-center hover:bg-indigo-700"
                        >
                            Login karein →
                        </a>
                        <p className="text-xs text-slate-400">
                            Email pe bhi login link bheja gaya hai
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
            {/* Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full opacity-60" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-800">Register Your School</h1>
                    <p className="text-sm text-slate-500 mt-1">15 days free trial — no credit card required</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    {[1, 2].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-xs ${step >= s ? 'text-slate-700' : 'text-slate-400'}`}>
                                {s === 1 ? 'School Info' : 'Admin Account'}
                            </span>
                            {s < 2 && <div className="w-8 h-0.5 bg-slate-200" />}
                        </div>
                    ))}
                </div>

                {/* Form card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === 1 ? (
                            <>
                                <Input
                                    label="School Name *"
                                    placeholder="Modern Public School"
                                    value={form.schoolName}
                                    onChange={e => {
                                        set('schoolName', e.target.value)
                                        if (!form.subdomain || form.subdomain === autoSubdomain(form.schoolName)) {
                                            set('subdomain', autoSubdomain(e.target.value))
                                        }
                                    }}
                                    required
                                />

                                <div>
                                    <Input
                                        label="School Code (URL) *"
                                        placeholder="modernpublicschool"
                                        value={form.subdomain}
                                        onChange={e => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        helper={form.subdomain ? `Login URL: ${form.subdomain}.shivshakticloud.in` : ''}
                                        required
                                    />
                                </div>

                                <Input
                                    label="City / Address"
                                    placeholder="Ambikapur, Chhattisgarh"
                                    value={form.address}
                                    onChange={e => set('address', e.target.value)}
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    label="Admin Name *"
                                    placeholder="Principal / Owner ka naam"
                                    value={form.adminName}
                                    onChange={e => set('adminName', e.target.value)}
                                    required
                                />
                                <Input
                                    label="Phone Number *"
                                    placeholder="9999999999"
                                    value={form.phone}
                                    onChange={e => set('phone', e.target.value)}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="school@example.com"
                                    value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    helper="Welcome email aur login link yahan bheja jayega"
                                />
                                <Input
                                    label="Password *"
                                    type="password"
                                    placeholder="Min 6 characters"
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    required
                                />
                                <Input
                                    label="Confirm Password *"
                                    type="password"
                                    placeholder="Password dobara likhein"
                                    value={form.confirmPwd}
                                    onChange={e => set('confirmPwd', e.target.value)}
                                    required
                                />
                            </>
                        )}

                        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

                        <div className="flex gap-3 pt-1">
                            {step === 2 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    className="flex-1"
                                >
                                    ← Back
                                </Button>
                            )}
                            <Button
                                type="submit"
                                loading={loading}
                                className="flex-1"
                                size="lg"
                            >
                                {step === 1 ? 'Next →' : 'Register School'}
                            </Button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Already registered?{' '}
                    <Link href="/login" className="text-indigo-600 hover:underline">
                        Login karein
                    </Link>
                </p>
                <p className="text-center text-xs text-slate-400 mt-1">
                    Powered by Shivshakti Computer Academy
                </p>
            </div>
        </div>
    )
}
