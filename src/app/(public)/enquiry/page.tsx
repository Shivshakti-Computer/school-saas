// FILE: src/app/(public)/enquiry/page.tsx
'use client'

import { useState } from 'react'
import { Container } from '@/components/marketing/Container'
import { CTA } from '@/components/marketing/CTA'
import { PLANS } from '@/config/pricing'
import { IconCheck } from '@/components/ui/icons'

export default function EnquiryPage() {
    const [form, setForm] = useState({
        name: '', phone: '', email: '',
        schoolName: '', schoolLocation: '',
        subject: '', message: '',
        interestedPlan: 'not_sure',
        schoolSize: '',
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/enquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, source: 'contact_form' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <section className="min-h-screen section-brand-light flex items-center">
                <Container>
                    <div className="max-w-md mx-auto text-center py-20">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center
                text-4xl mx-auto mb-6"
                            style={{ background: 'var(--success-light)' }}
                        >
                            <IconCheck/>
                        </div>
                        <h2
                            className="text-2xl font-extrabold mb-3"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Enquiry Submitted!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Humari team 24 hours mein aapko contact karegi.
                            WhatsApp ya call ke through personally help milegi.
                        </p>
                        <a
                            href="/"
                            className="btn-primary inline-flex mt-8"
                        >
                            Back to Home
                        </a>
                    </div>
                </Container>
            </section>
        )
    }

    return (
        <>
            {/* Hero */}
            <section className="relative pt-24 pb-16 section-brand-light overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
                <Container>
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="badge-brand inline-flex mb-6">
                            📬 Contact Us
                        </div>
                        <h1
                            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Baat karein —{' '}
                            <span className="gradient-text">hum yahan hain</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Plan lena ho, demo chahiye ho, ya koi bhi sawaal ho —
                            seedha hamare team se baat karein. No bots, no tickets.
                        </p>
                    </div>
                </Container>
            </section>

            {/* Form + Info */}
            <section className="py-16 section-white">
                <Container>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">

                        {/* Contact Info — Left */}
                        <div className="space-y-5">
                            <h2
                                className="text-lg font-bold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Seedha sampark karein
                            </h2>

                            {[
                                {
                                    icon: '💬',
                                    title: 'WhatsApp',
                                    desc: 'Sabse fast response',
                                    value: 'WhatsApp pe message karein',
                                    color: 'var(--success)',
                                    lightBg: 'var(--success-light)',
                                },
                                {
                                    icon: '📧',
                                    title: 'Email',
                                    desc: 'support@skolify.in',
                                    value: 'Usually same day reply',
                                    color: 'var(--brand)',
                                    lightBg: 'var(--brand-light)',
                                },
                                {
                                    icon: '📞',
                                    title: 'Call',
                                    desc: 'Personal setup call',
                                    value: 'Screen sharing available',
                                    color: '#7C3AED',
                                    lightBg: '#F5F3FF',
                                },
                            ].map(item => (
                                <div
                                    key={item.title}
                                    className="p-4 rounded-2xl border flex items-start gap-3"
                                    style={{ background: item.lightBg, borderColor: `${item.color}20` }}
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    <div>
                                        <p
                                            className="text-sm font-bold"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            {item.title}
                                        </p>
                                        <p
                                            className="text-xs font-medium"
                                            style={{ color: item.color }}
                                        >
                                            {item.desc}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Quick links */}
                            <div
                                className="p-4 rounded-2xl border"
                                style={{
                                    background: 'var(--surface-50)',
                                    borderColor: 'var(--surface-200)',
                                }}
                            >
                                <p
                                    className="text-xs font-bold uppercase tracking-wide mb-3"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Quick Links
                                </p>
                                {[
                                    { label: '60-day Free Trial', href: '/register' },
                                    { label: 'Pricing Plans', href: '/pricing' },
                                    { label: 'All Features', href: '/features' },
                                    { label: 'Reviews', href: '/reviews' },
                                ].map(link => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        className="flex items-center justify-between py-1.5 text-sm
                      hover:underline"
                                        style={{ color: 'var(--brand)' }}
                                    >
                                        {link.label}
                                        <span>→</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Form — Right (2 col) */}
                        <div className="lg:col-span-2">
                            <div
                                className="rounded-2xl border p-8 shadow-soft"
                                style={{
                                    background: 'var(--surface-0)',
                                    borderColor: 'var(--surface-200)',
                                }}
                            >
                                <h2
                                    className="text-lg font-bold mb-6"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    Enquiry Form
                                </h2>

                                {error && (
                                    <div
                                        className="p-4 rounded-xl mb-5 text-sm"
                                        style={{
                                            background: 'var(--danger-light)',
                                            color: 'var(--danger)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                Your Name *
                                            </label>
                                            <input
                                                className="input-clean"
                                                placeholder="Principal / Admin ka naam"
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                Phone Number *
                                            </label>
                                            <input
                                                className="input-clean"
                                                placeholder="WhatsApp number"
                                                type="tel"
                                                value={form.phone}
                                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                School Name
                                            </label>
                                            <input
                                                className="input-clean"
                                                placeholder="Aapke school ka naam"
                                                value={form.schoolName}
                                                onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                Location
                                            </label>
                                            <input
                                                className="input-clean"
                                                placeholder="City, State"
                                                value={form.schoolLocation}
                                                onChange={e => setForm(f => ({ ...f, schoolLocation: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                Interested Plan
                                            </label>
                                            <select
                                                className="input-clean"
                                                value={form.interestedPlan}
                                                onChange={e => setForm(f => ({ ...f, interestedPlan: e.target.value }))}
                                            >
                                                <option value="not_sure">Not sure yet</option>
                                                {Object.values(PLANS).map(plan => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name} — ₹{plan.monthlyPrice}/mo
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label
                                                className="block text-xs font-semibold mb-1.5"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                School Size (approx)
                                            </label>
                                            <select
                                                className="input-clean"
                                                value={form.schoolSize}
                                                onChange={e => setForm(f => ({ ...f, schoolSize: e.target.value }))}
                                            >
                                                <option value="">Select range</option>
                                                <option value="under_100">Under 100 students</option>
                                                <option value="100_500">100 – 500 students</option>
                                                <option value="500_1500">500 – 1,500 students</option>
                                                <option value="1500_5000">1,500 – 5,000 students</option>
                                                <option value="above_5000">Above 5,000 students</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-1.5"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            Subject *
                                        </label>
                                        <input
                                            className="input-clean"
                                            placeholder="e.g. Demo request, pricing inquiry, technical question"
                                            value={form.subject}
                                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs font-semibold mb-1.5"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            Message *
                                        </label>
                                        <textarea
                                            className="input-clean resize-none"
                                            rows={5}
                                            placeholder="Apna sawaal ya requirement detail mein likhein..."
                                            value={form.message}
                                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full"
                                        style={{ opacity: loading ? 0.7 : 1 }}
                                    >
                                        {loading ? 'Sending...' : 'Send Enquiry →'}
                                    </button>

                                    <p
                                        className="text-center text-xs"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        We respond within 24 hours · No spam ever
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            <CTA />
        </>
    )
}