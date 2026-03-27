// -------------------------------------------------------------
// FILE: src/app/(dashboard)/admin/website/page.tsx
// Admin website builder — template select + content edit
// -------------------------------------------------------------

'use client'
import { useState, useEffect } from 'react'
import { Button, Card, Input, Alert, PageHeader, Spinner } from '@/components/ui'

const TEMPLATES = [
    {
        id: 'modern',
        name: 'Modern',
        description: 'Clean, bold design with large hero section',
        preview: '🎨',
        colors: { primary: '#4F46E5', secondary: '#10B981' },
    },
    {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional school look, trusted feel',
        preview: '🏫',
        colors: { primary: '#1E40AF', secondary: '#D97706' },
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple and elegant, content-focused',
        preview: '✨',
        colors: { primary: '#0F172A', secondary: '#6366F1' },
    },
]

const DEFAULT_CONTENT = {
    template: 'modern',
    tagline: 'Excellence in Education',
    about: 'We are committed to providing quality education and holistic development of students.',
    address: '',
    phone: '',
    email: '',
    mapUrl: '',
    primaryColor: '#4F46E5',
    showAdmission: true,
    stats: [
        { label: 'Students', value: '500+' },
        { label: 'Teachers', value: '25+' },
        { label: 'Years', value: '10+' },
    ],
    facilities: ['Smart Classrooms', 'Science Lab', 'Library', 'Sports Ground', 'Computer Lab'],
    gallery: [] as string[],
}

export default function WebsiteBuilderPage() {
    const [content, setContent] = useState(DEFAULT_CONTENT)
    const [school, setSchool] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [tab, setTab] = useState<'template' | 'content' | 'preview'>('template')

    useEffect(() => {
        fetch('/api/website')
            .then(r => r.json())
            .then(d => {
                setSchool(d.school)
                if (d.website) {
                    setContent({ ...DEFAULT_CONTENT, ...d.website })
                } else if (d.school) {
                    // Pre-fill from school data
                    setContent(prev => ({
                        ...prev,
                        address: d.school.address ?? '',
                        phone: d.school.phone ?? '',
                        email: d.school.email ?? '',
                    }))
                }
                setLoading(false)
            })
    }, [])

    const set = (k: string, v: any) => setContent(prev => ({ ...prev, [k]: v }))

    const handleSave = async () => {
        setSaving(true)
        const res = await fetch('/api/website', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website: content }),
        })
        setSaving(false)
        setAlert(res.ok
            ? { type: 'success', msg: 'Website saved! Changes are live.' }
            : { type: 'error', msg: 'Save failed — try again' }
        )
    }

    const subdomain = typeof window !== 'undefined'
        ? window.location.hostname.replace(`.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shivshakticloud.in'}`, '')
        : ''

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="School Website"
                subtitle={`${subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shivshakticloud.in'}`}
                action={
                    <div className="flex gap-2">
                        <a
                            href={`//${subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shivshakticloud.in'}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Preview ↗
                        </a>
                        <Button onClick={handleSave} loading={saving}>
                            Save & Publish
                        </Button>
                    </div>
                }
            />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-6">
                {(['template', 'content'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${tab === t
                                ? 'bg-white text-slate-800 font-medium shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t === 'template' ? '🎨 Template' : '📝 Content'}
                    </button>
                ))}
            </div>

            {/* Template selector */}
            {tab === 'template' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TEMPLATES.map(tmpl => (
                        <div
                            key={tmpl.id}
                            onClick={() => {
                                set('template', tmpl.id)
                                set('primaryColor', tmpl.colors.primary)
                            }}
                            className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${content.template === tmpl.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:border-indigo-300'
                                }`}
                        >
                            <div className="text-4xl mb-3 text-center">{tmpl.preview}</div>
                            <p className="font-semibold text-slate-800 text-center">{tmpl.name}</p>
                            <p className="text-xs text-slate-500 text-center mt-1">{tmpl.description}</p>
                            <div className="flex gap-2 mt-3 justify-center">
                                <div className="w-5 h-5 rounded-full" style={{ background: tmpl.colors.primary }} />
                                <div className="w-5 h-5 rounded-full" style={{ background: tmpl.colors.secondary }} />
                            </div>
                            {content.template === tmpl.id && (
                                <p className="text-xs text-indigo-600 font-medium text-center mt-2">✓ Selected</p>
                            )}
                        </div>
                    ))}

                    {/* Primary color picker */}
                    <div className="md:col-span-3">
                        <Card>
                            <p className="text-sm font-medium text-slate-700 mb-3">Custom Primary Color</p>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={content.primaryColor}
                                    onChange={e => set('primaryColor', e.target.value)}
                                    className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200"
                                />
                                <div>
                                    <p className="text-sm text-slate-600">School ka brand color chunein</p>
                                    <p className="text-xs text-slate-400">Yeh color website ke headings, buttons mein use hoga</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Content editor */}
            {tab === 'content' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic info */}
                    <Card>
                        <p className="text-sm font-semibold text-slate-700 mb-4">Basic Information</p>
                        <div className="space-y-4">
                            <Input
                                label="Tagline"
                                placeholder="Excellence in Education"
                                value={content.tagline}
                                onChange={e => set('tagline', e.target.value)}
                            />
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">About School</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
                                    value={content.about}
                                    onChange={e => set('about', e.target.value)}
                                    placeholder="School ke baare mein likhein..."
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="showAdmission"
                                    checked={content.showAdmission}
                                    onChange={e => set('showAdmission', e.target.checked)}
                                    className="rounded"
                                />
                                <label htmlFor="showAdmission" className="text-sm text-slate-600 cursor-pointer">
                                    Show admission form button on website
                                </label>
                            </div>
                        </div>
                    </Card>

                    {/* Contact */}
                    <Card>
                        <p className="text-sm font-semibold text-slate-700 mb-4">Contact Details</p>
                        <div className="space-y-4">
                            <Input
                                label="Phone"
                                placeholder="9999999999"
                                value={content.phone}
                                onChange={e => set('phone', e.target.value)}
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="school@example.com"
                                value={content.email}
                                onChange={e => set('email', e.target.value)}
                            />
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
                                    value={content.address}
                                    onChange={e => set('address', e.target.value)}
                                />
                            </div>
                            <Input
                                label="Google Maps Embed URL (optional)"
                                placeholder="https://maps.google.com/..."
                                value={content.mapUrl}
                                onChange={e => set('mapUrl', e.target.value)}
                            />
                        </div>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <p className="text-sm font-semibold text-slate-700 mb-4">School Stats (homepage pe dikhte hain)</p>
                        <div className="space-y-3">
                            {content.stats.map((stat, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200"
                                        placeholder="Label"
                                        value={stat.label}
                                        onChange={e => {
                                            const stats = [...content.stats]
                                            stats[idx] = { ...stat, label: e.target.value }
                                            set('stats', stats)
                                        }}
                                    />
                                    <input
                                        className="w-24 h-9 px-3 text-sm rounded-lg border border-slate-200"
                                        placeholder="Value"
                                        value={stat.value}
                                        onChange={e => {
                                            const stats = [...content.stats]
                                            stats[idx] = { ...stat, value: e.target.value }
                                            set('stats', stats)
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Facilities */}
                    <Card>
                        <p className="text-sm font-semibold text-slate-700 mb-4">Facilities</p>
                        <div className="space-y-2">
                            {content.facilities.map((f, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200"
                                        value={f}
                                        onChange={e => {
                                            const facs = [...content.facilities]
                                            facs[idx] = e.target.value
                                            set('facilities', facs)
                                        }}
                                    />
                                    <button
                                        onClick={() => set('facilities', content.facilities.filter((_, i) => i !== idx))}
                                        className="text-red-400 hover:text-red-600 px-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => set('facilities', [...content.facilities, ''])}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                + Add facility
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Save button at bottom */}
            <div className="flex justify-end mt-6">
                <Button onClick={handleSave} loading={saving} size="lg">
                    Save & Publish Website
                </Button>
            </div>
        </div>
    )
}