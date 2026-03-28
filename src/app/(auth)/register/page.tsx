'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState<{
        schoolCode: string
        schoolName: string
        adminName: string
        phone: string
        trialDays: number
    } | null>(null)

    const [form, setForm] = useState({
        schoolName: '',
        schoolCode: '',
        address: '',
        adminName: '',
        phone: '',
        email: '',
        password: '',
        confirmPwd: '',
    })

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    // Auto-generate school code from school name
    const autoCode = (name: string) =>
        name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .slice(0, 30)

    // Validate step 1
    const validateStep1 = () => {
        if (!form.schoolName.trim()) {
            setError('School name is required')
            return false
        }
        if (!form.schoolCode.trim()) {
            setError('School code is required')
            return false
        }
        if (form.schoolCode.length < 3) {
            setError('School code must be at least 3 characters')
            return false
        }
        if (!/^[a-z0-9_-]+$/.test(form.schoolCode)) {
            setError('School code can only contain lowercase letters, numbers, underscore, and hyphen')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (step === 1) {
            if (validateStep1()) setStep(2)
            return
        }

        // Step 2 validation
        if (!form.adminName.trim()) {
            setError('Admin name is required')
            return
        }
        if (!form.phone.trim()) {
            setError('Phone number is required')
            return
        }
        if (form.phone.trim().length < 10) {
            setError('Enter a valid phone number')
            return
        }
        if (!form.password) {
            setError('Password is required')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        if (form.password !== form.confirmPwd) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/schools/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolName: form.schoolName.trim(),
                    subdomain: form.schoolCode.trim(),
                    address: form.address.trim(),
                    adminName: form.adminName.trim(),
                    phone: form.phone.trim(),
                    email: form.email.trim(),
                    password: form.password,
                }),
            })

            const data = await res.json()
            setLoading(false)

            if (!res.ok) {
                setError(data.error || 'Registration failed. Please try again.')
                return
            }

            setSuccess({
                schoolCode: data.schoolCode,
                schoolName: form.schoolName,
                adminName: form.adminName,
                phone: form.phone,
                trialDays: 15,
            })
        } catch (err) {
            setLoading(false)
            setError('Something went wrong. Please try again.')
        }
    }

    // ════════════════════════════════════════
    // SUCCESS SCREEN
    // ════════════════════════════════════════
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 w-full max-w-md">

                    {/* Success icon */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            School Registered Successfully!
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Your {success.trialDays}-day free trial has started
                        </p>
                    </div>

                    {/* Login credentials */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Your Login Details
                        </h3>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">School Code</span>
                                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-mono">
                                    {success.schoolCode}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Phone</span>
                                <span className="text-sm font-medium text-slate-900">{success.phone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Role</span>
                                <span className="text-sm font-medium text-slate-900">Admin</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
                                <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                Save your School Code — your teachers, students, and parents will need it to login.
                            </p>
                        </div>
                    </div>

                    {/* Steps after registration */}
                    <div className="mt-5 space-y-2.5">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            What to do next
                        </h3>
                        {[
                            'Login with your School Code + Phone + Password',
                            'Add teachers and students from the admin panel',
                            'Share the School Code with teachers and parents',
                            'Explore features — upgrade plan when ready',
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-xs text-slate-600">{item}</p>
                            </div>
                        ))}
                    </div>

                    {/* Login button */}
                    <Link
                        href="/login"
                        className="mt-6 flex w-full justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-indigo-200"
                    >
                        Go to Login
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>

                    <p className="text-center text-[11px] text-slate-400 mt-4">
                        Login URL: <span className="font-medium text-slate-600">{typeof window !== 'undefined' ? window.location.origin : ''}/login</span>
                    </p>
                </div>
            </div>
        )
    }

    // ════════════════════════════════════════
    // REGISTRATION FORM
    // ════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100 rounded-full opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full opacity-60" />
            </div>

            <div className="relative w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                        <span className="text-white font-extrabold text-lg">VF</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Register Your School</h1>
                    <p className="text-sm text-slate-500 mt-1">15-day free trial — no credit card required</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {step > 1 ? (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            ) : '1'}
                        </div>
                        <span className={`text-xs font-medium ${step >= 1 ? 'text-slate-700' : 'text-slate-400'}`}>
                            School Info
                        </span>
                    </div>

                    <div className={`w-10 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                            2
                        </div>
                        <span className={`text-xs font-medium ${step >= 2 ? 'text-slate-700' : 'text-slate-400'}`}>
                            Admin Account
                        </span>
                    </div>
                </div>

                {/* Form card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/50 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {step === 1 ? (
                            <>
                                {/* School Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        School Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.schoolName}
                                        onChange={e => {
                                            set('schoolName', e.target.value)
                                            // Auto-generate code only if user hasn't manually edited it
                                            if (!form.schoolCode || form.schoolCode === autoCode(form.schoolName)) {
                                                set('schoolCode', autoCode(e.target.value))
                                            }
                                        }}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="e.g. Delhi Public School"
                                        required
                                    />
                                </div>

                                {/* School Code */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        School Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={form.schoolCode}
                                            onChange={e => set('schoolCode', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                                            placeholder="e.g. dps_delhi"
                                            required
                                            autoCapitalize="off"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] text-slate-400">
                                        This code will be used by all users (teachers, students, parents) to login. Choose something easy to remember.
                                    </p>
                                    {form.schoolCode && (
                                        <div className="mt-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5">
                                            <p className="text-[11px] text-indigo-700">
                                                Your School Code: <strong className="font-mono">{form.schoolCode}</strong>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        City / Address
                                    </label>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={e => set('address', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="e.g. Ambikapur, Chhattisgarh"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Admin Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Admin Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.adminName}
                                        onChange={e => set('adminName', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="Principal or school owner name"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="9876543210"
                                        required
                                        maxLength={10}
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400">This will be your login ID</p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Email <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => set('email', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="school@example.com"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400">Welcome email will be sent here</p>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={e => set('password', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="Minimum 6 characters"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={form.confirmPwd}
                                        onChange={e => set('confirmPwd', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="Re-enter password"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-1">
                            {step === 2 && (
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setError('') }}
                                    className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    ← Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-indigo-200"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Registering...
                                    </span>
                                ) : step === 1 ? 'Next →' : 'Register School'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Login link */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        Already registered?{' '}
                        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                            Login here →
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-[11px] text-slate-400 mt-4">
                    Powered by <span className="font-semibold">VidyaFlow</span> — A unit of Shivshakti Computer Academy
                </p>
            </div>
        </div>
    )
}