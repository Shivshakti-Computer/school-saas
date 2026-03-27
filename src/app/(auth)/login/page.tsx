'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Alert } from '@/components/ui'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // 🔥 NEW: login type
    const [loginType, setLoginType] = useState<'school' | 'superadmin'>('school')

    const [form, setForm] = useState({
        phone: '',
        email: '',
        password: '',
        subdomain: ''
    })

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Auto-detect subdomain (ONLY for school login)
    useEffect(() => {
        if (loginType !== 'school') return

        const hostname = window.location.hostname
        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shivshakticloud.in'
        const sub = hostname.replace(`.${appDomain}`, '').replace('www.', '')

        if (sub !== hostname && sub !== 'www' && sub !== appDomain) {
            setForm(f => ({ ...f, subdomain: sub }))
        }
    }, [loginType])

    // Show expired message agar redirect se aaye hain
    useEffect(() => {
        if (searchParams.get('expired') === '1') {
            setError('Aapka trial/subscription expire ho gaya hai. Neeche login karein to subscription page pe jayein.')
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        let res

        if (loginType === 'superadmin') {
            if (!form.email.trim()) {
                setError('Email zaroori hai')
                setLoading(false)
                return
            }

            res = await signIn('credentials', {
                redirect: false,
                email: form.email.trim(),
                password: form.password,
                type: 'superadmin'
            })
        } else {
            if (!form.subdomain.trim()) {
                setError('School code zaroori hai')
                setLoading(false)
                return
            }

            res = await signIn('credentials', {
                redirect: false,
                phone: form.phone.trim(),
                password: form.password,
                subdomain: form.subdomain.trim().toLowerCase(),
                type: 'school'
            })
        }

        setLoading(false)

        if (res?.error) {
            if (res.error.includes('TRIAL_EXPIRED')) {
                // Subscription page pe redirect karo with expired flag
                router.push('/admin/subscription?expired=1')
                return
            }
            setError('Aapka free trial khatam ho gaya. Admin se contact karein ya subscribe karein.')
            return
        }

        // Redirect
        if (loginType === 'superadmin') {
            router.push('/superadmin')
        } else {
            router.push('/admin')
        }

        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full opacity-60" />
            </div>

            <div className="relative w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-800">School Portal</h1>
                    <p className="text-sm text-slate-500 mt-1">Apne account mein login karein</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100 p-6">

                    {/* 🔥 TOGGLE (Minimal, design-safe) */}
                    <div className="flex mb-4 bg-slate-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setLoginType('school')}
                            className={`flex-1 text-sm py-2 rounded-md transition ${loginType === 'school'
                                ? 'bg-white shadow text-indigo-600'
                                : 'text-slate-500'
                                }`}
                        >
                            School
                        </button>

                        <button
                            type="button"
                            onClick={() => setLoginType('superadmin')}
                            className={`flex-1 text-sm py-2 rounded-md transition ${loginType === 'superadmin'
                                ? 'bg-white shadow text-indigo-600'
                                : 'text-slate-500'
                                }`}
                        >
                            Super Admin
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* School Code */}
                        {loginType === 'school' && (
                            <Input
                                label="School Code"
                                placeholder="stmarys"
                                value={form.subdomain}
                                onChange={e => setForm(f => ({ ...f, subdomain: e.target.value }))}
                                required
                                helper="Apna school code likho (admin ne diya hoga)"
                            />
                        )}

                        {/* Phone / Email */}
                        {loginType === 'school' ? (
                            <Input
                                label="Phone Number / Email"
                                placeholder="9999999999"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                required
                            />
                        ) : (
                            <Input
                                label="Email"
                                placeholder="admin@example.com"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                required
                            />
                        )}

                        {/* Password */}
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                        />

                        {error && (
                            <Alert
                                type="error"
                                message={error}
                                onClose={() => setError('')}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={loading}
                        >
                            Login karein
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Powered by Shivshakti Computer Academy
                </p>
            </div>
        </div>
    )
}