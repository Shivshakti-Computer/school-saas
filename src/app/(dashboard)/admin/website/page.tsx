'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button, Card, Input, Alert, PageHeader, Spinner, Modal, Badge } from '@/components/ui'
import {
    Globe, Eye, Palette, FileText, Settings, Plus, Trash2,
    GripVertical, ChevronDown, ChevronUp, ExternalLink,
    Image, Users, Calendar, MessageSquare, Phone,
    BookOpen, Award, Star, Megaphone, Layout, Save, Check,
    Lock, Zap, Video, Download, Building, GraduationCap,
    Bus, FileCheck, Crown
} from 'lucide-react'
import type { WebsitePlanLimits } from '@/lib/websitePlans'
import Link from 'next/link'
import { getDefaultWebsite } from '@/lib/websiteDefault'

const TEMPLATES = [
    { id: 'modern', name: 'Modern', description: 'Bold gradient hero, card-based, vibrant', preview: '🎨', minPlan: 'starter' },
    { id: 'classic', name: 'Classic', description: 'Traditional school look, formal feel', preview: '🏫', minPlan: 'growth' },
    { id: 'elegant', name: 'Elegant', description: 'Minimal premium, typography-focused', preview: '✨', minPlan: 'growth' },
]

const ALL_SECTION_TYPES = [
    { value: 'hero', label: 'Hero Banner', icon: Layout, minPlan: 'starter' },
    { value: 'about', label: 'About Section', icon: FileText, minPlan: 'starter' },
    { value: 'stats', label: 'Statistics', icon: Award, minPlan: 'starter' },
    { value: 'facilities', label: 'Facilities', icon: Star, minPlan: 'starter' },
    { value: 'contact', label: 'Contact Info', icon: Phone, minPlan: 'starter' },
    { value: 'cta', label: 'Call to Action', icon: Megaphone, minPlan: 'starter' },
    { value: 'academics', label: 'Academics', icon: BookOpen, minPlan: 'growth' },
    { value: 'faculty', label: 'Faculty', icon: Users, minPlan: 'growth' },
    { value: 'testimonials', label: 'Testimonials', icon: MessageSquare, minPlan: 'growth' },
    { value: 'events', label: 'Events & News', icon: Calendar, minPlan: 'growth' },
    { value: 'principalMessage', label: 'Principal Message', icon: Users, minPlan: 'growth' },
    { value: 'videoTour', label: 'Video Tour', icon: Video, minPlan: 'growth' },
    { value: 'gallery', label: 'Photo Gallery', icon: Image, minPlan: 'starter' },
    { value: 'achievements', label: 'Achievements', icon: Award, minPlan: 'pro' },
    { value: 'downloads', label: 'Downloads', icon: Download, minPlan: 'pro' },
    { value: 'infrastructure', label: 'Infrastructure', icon: Building, minPlan: 'pro' },
    { value: 'feeStructure', label: 'Fee Structure', icon: FileCheck, minPlan: 'pro' },
    { value: 'liveNotices', label: 'Live Notice Board', icon: Megaphone, minPlan: 'pro' },
    { value: 'academicCalendar', label: 'Academic Calendar', icon: Calendar, minPlan: 'enterprise' },
    { value: 'transportRoutes', label: 'Transport Routes', icon: Bus, minPlan: 'enterprise' },
    { value: 'alumni', label: 'Alumni', icon: GraduationCap, minPlan: 'enterprise' },
    { value: 'custom', label: 'Custom Content', icon: FileText, minPlan: 'growth' },
]

type Tab = 'overview' | 'template' | 'pages' | 'content' | 'premium' | 'media' | 'settings'

// ── Locked Feature Component ──
function LockedFeature({ feature, requiredPlan, children }: {
    feature: string; requiredPlan: string; children: React.ReactNode
}) {
    return (
        <div className="relative">
            <div className="opacity-40 pointer-events-none select-none">{children}</div>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                <div className="text-center p-4">
                    <Lock size={20} className="text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">{feature}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Available in {requiredPlan}+ plan</p>
                    <Link
                        href="/admin/subscription"
                        className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-indigo-600 hover:underline"
                    >
                        <Zap size={10} /> Upgrade
                    </Link>
                </div>
            </div>
        </div>
    )
}

// ── Plan Badge ──
function PlanBadge({ plan }: { plan: string }) {
    const colors: Record<string, string> = {
        starter: 'bg-slate-100 text-slate-600',
        growth: 'bg-indigo-100 text-indigo-700',
        pro: 'bg-purple-100 text-purple-700',
        enterprise: 'bg-amber-100 text-amber-700',
    }
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${colors[plan] || colors.starter}`}>
            {plan}
        </span>
    )
}

export default function WebsiteBuilderPage() {
    const { data: session } = useSession()
    const [website, setWebsite] = useState<any>(null)
    const [school, setSchool] = useState<any>(null)
    const [plan, setPlan] = useState<string>('starter')
    const [limits, setLimits] = useState<WebsitePlanLimits | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [tab, setTab] = useState<Tab>('overview')
    const [editingPage, setEditingPage] = useState<string | null>(null)
    const [addPageModal, setAddPageModal] = useState(false)
    const [newPage, setNewPage] = useState({ title: '', slug: '' })

    useEffect(() => {
        fetch('/api/website')
            .then(r => r.json())
            .then(d => {
                setSchool(d.school)
                setPlan(d.plan || 'starter')
                setLimits(d.limits)
                setWebsite(d.website || getDefaultWebsite({
                    name: d.school?.name || '', address: d.school?.address || '',
                    phone: d.school?.phone || '', email: d.school?.email || '',
                }))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const set = (key: string, value: any) => setWebsite((prev: any) => ({ ...prev, [key]: value }))

    const isLocked = (feature: keyof WebsitePlanLimits): boolean => {
        if (!limits) return false
        return !limits[feature]
    }

    const handleSave = async (shouldPublish = false) => {
        setSaving(true)
        try {
            const dataToSave = { ...website }
            if (shouldPublish) dataToSave.isPublished = true

            const res = await fetch('/api/website', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ website: dataToSave }),
            })
            const data = await res.json()

            if (res.ok) {
                if (shouldPublish) set('isPublished', true)
                setAlert({ type: 'success', msg: data.message || 'Saved!' })
            } else {
                setAlert({ type: 'error', msg: data.error || 'Failed to save' })
            }
        } catch { setAlert({ type: 'error', msg: 'Something went wrong' }) }
        setSaving(false)
    }

    const handlePublish = () => handleSave(true)
    const handleUnpublish = async () => {
        setSaving(true)
        const res = await fetch('/api/website', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website: { ...website, isPublished: false } }),
        })
        if (res.ok) { set('isPublished', false); setAlert({ type: 'success', msg: 'Unpublished' }) }
        setSaving(false)
    }

    const addPage = () => {
        if (!newPage.title.trim()) return
        const customPages = (website.pages || []).filter((p: any) => !p.isSystem)
        if (limits && customPages.length >= limits.maxCustomPages) {
            setAlert({ type: 'error', msg: `Your ${plan} plan allows only ${limits.maxCustomPages} custom pages. Upgrade to add more.` })
            return
        }
        const slug = newPage.slug || newPage.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
        const page = {
            id: Math.random().toString(36).slice(2, 10),
            title: newPage.title, slug,
            sections: [{ id: Math.random().toString(36).slice(2, 10), type: 'custom', title: newPage.title, enabled: true, order: 0, content: { heading: newPage.title, body: '' } }],
            enabled: true, order: (website.pages?.length || 0), isSystem: false,
        }
        set('pages', [...(website.pages || []), page])
        setNewPage({ title: '', slug: '' })
        setAddPageModal(false)
    }

    const deletePage = (pageId: string) => set('pages', website.pages.filter((p: any) => p.id !== pageId))
    const togglePage = (pageId: string) => set('pages', website.pages.map((p: any) => p.id === pageId ? { ...p, enabled: !p.enabled } : p))

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    const isPublished = website?.isPublished
    const customPageCount = (website?.pages || []).filter((p: any) => !p.isSystem).length

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'overview', label: 'Overview', icon: Globe },
        { key: 'template', label: 'Template', icon: Palette },
        { key: 'pages', label: 'Pages', icon: FileText },
        { key: 'content', label: 'Content', icon: FileText },
        { key: 'premium', label: 'Premium', icon: Crown },
        { key: 'media', label: 'Media', icon: Image },
        { key: 'settings', label: 'Settings', icon: Settings },
    ]

    return (
        <div>
            <PageHeader
                title="School Website"
                subtitle={isPublished ? 'Your website is live' : 'Build and publish your school website'}
                action={
                    <div className="flex gap-2">
                        <a href={`/${school?.subdomain || ''}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
                            <Eye size={14} /> Preview
                        </a>
                        <Button onClick={() => handleSave(false)} loading={saving} variant="secondary">
                            <Save size={14} /> Save
                        </Button>
                        {isPublished ? (
                            <Button onClick={handleUnpublish} variant="ghost">Unpublish</Button>
                        ) : (
                            <Button onClick={handlePublish}><Globe size={14} /> Publish</Button>
                        )}
                    </div>
                }
            />

            {alert && <div className="mb-4"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {/* Status Bar with Plan info */}
            <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-xl border border-slate-200 p-3">
                <Badge variant={isPublished ? 'success' : 'warning'}>
                    {isPublished ? '● Live' : '○ Draft'}
                </Badge>
                <PlanBadge plan={plan} />
                <span className="text-xs text-slate-500">Template: <strong className="capitalize">{website?.template}</strong></span>
                <span className="text-xs text-slate-500">Pages: <strong>{website?.pages?.filter((p: any) => p.enabled).length || 0}</strong></span>
                <span className="text-xs text-slate-500">Gallery: <strong>{website?.gallery?.length || 0}/{limits?.maxGalleryPhotos || 10}</strong></span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded">/{school?.subdomain}</span>
                    {isPublished && (
                        <a href={`/${school?.subdomain}`} target="_blank" rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            Open <ExternalLink size={10} />
                        </a>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${tab === t.key ? 'bg-white text-slate-900 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}>
                        <t.icon size={14} />
                        {t.label}
                        {t.key === 'premium' && <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded">PRO</span>}
                    </button>
                ))}
            </div>

            {/* ════════════ OVERVIEW TAB ════════════ */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Quick Info</h3>
                            <div className="space-y-4">
                                <Input label="School Tagline" value={website?.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Excellence in Education" />
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">About School</label>
                                    <textarea rows={4} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" value={website?.about || ''} onChange={e => set('about', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Phone" value={website?.phone || ''} onChange={e => set('phone', e.target.value)} />
                                    <Input label="Email" value={website?.email || ''} onChange={e => set('email', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">Address</label>
                                    <textarea rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" value={website?.address || ''} onChange={e => set('address', e.target.value)} />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Website URL</h3>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Your website address</p>
                                <p className="text-sm font-mono font-semibold text-indigo-700">{process.env.NEXT_PUBLIC_APP_DOMAIN}/{school?.subdomain}</p>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Plan Features</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-slate-500">Templates</span><span className="font-medium">{limits?.allowedTemplates.length || 1}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Custom Pages</span><span className="font-medium">{customPageCount}/{limits?.maxCustomPages || 0}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Gallery Photos</span><span className="font-medium">{website?.gallery?.length || 0}/{limits?.maxGalleryPhotos || 10}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Custom Domain</span><span className="font-medium">{limits?.customDomain ? '✓' : '✗'}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Contact Form</span><span className="font-medium">{limits?.contactForm ? '✓' : '✗'}</span></div>
                            </div>
                            <Link href="/admin/subscription" className="mt-3 flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                                <Zap size={10} /> Upgrade for more features
                            </Link>
                        </Card>

                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Admission Status</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Admissions Open</span>
                                <button onClick={() => set('admissionOpen', !website?.admissionOpen)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${website?.admissionOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-[2px] transition-all ${website?.admissionOpen ? 'right-[2px]' : 'left-[2px]'}`} />
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ════════════ TEMPLATE TAB ════════════ */}
            {tab === 'template' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TEMPLATES.map(tmpl => {
                            const isAllowed = limits?.allowedTemplates.includes(tmpl.id)
                            return (
                                <div key={tmpl.id}
                                    onClick={() => isAllowed && set('template', tmpl.id)}
                                    className={`relative rounded-xl border-2 p-5 transition-all ${!isAllowed ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50' :
                                            website?.template === tmpl.id ? 'border-indigo-500 bg-indigo-50 cursor-pointer' :
                                                'border-slate-200 bg-white hover:border-indigo-300 cursor-pointer hover:shadow-md'
                                        }`}>
                                    {!isAllowed && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                            <Lock size={8} /> {tmpl.minPlan}+
                                        </div>
                                    )}
                                    <div className="text-4xl mb-3 text-center">{tmpl.preview}</div>
                                    <p className="font-bold text-slate-800 text-center">{tmpl.name}</p>
                                    <p className="text-xs text-slate-500 text-center mt-1">{tmpl.description}</p>
                                    {website?.template === tmpl.id && isAllowed && (
                                        <div className="flex items-center justify-center gap-1 mt-3 text-xs text-indigo-600 font-medium">
                                            <Check size={12} /> Selected
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <Card>
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Brand Colors</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-2">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={website?.primaryColor || '#4F46E5'} onChange={e => set('primaryColor', e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200" />
                                    <div>
                                        <p className="text-sm font-mono text-slate-700">{website?.primaryColor}</p>
                                        <p className="text-xs text-slate-400">Headers, buttons</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 block mb-2">Secondary Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={website?.secondaryColor || '#10B981'} onChange={e => set('secondaryColor', e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border border-slate-200" />
                                    <div>
                                        <p className="text-sm font-mono text-slate-700">{website?.secondaryColor}</p>
                                        <p className="text-xs text-slate-400">Accents, badges</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ════════════ PAGES TAB ════════════ */}
            {tab === 'pages' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Website Pages</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Custom pages: {customPageCount}/{limits?.maxCustomPages || 0}</p>
                        </div>
                        <Button size="sm" onClick={() => {
                            if (limits && customPageCount >= limits.maxCustomPages) {
                                setAlert({ type: 'error', msg: `Your ${plan} plan allows only ${limits.maxCustomPages} custom pages. Upgrade to add more.` })
                                return
                            }
                            setAddPageModal(true)
                        }}>
                            <Plus size={14} /> Add Page
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {(website?.pages || []).map((page: any) => (
                            <div key={page.id} className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${page.enabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                            {page.title.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{page.title}</p>
                                            <p className="text-xs text-slate-400">/{page.slug} · {page.sections?.length || 0} sections</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {page.isSystem && <Badge variant="info">System</Badge>}
                                        {!page.isSystem && <Badge variant="primary">Custom</Badge>}
                                        <button onClick={() => togglePage(page.id)}
                                            className={`w-8 h-4 rounded-full transition-colors relative ${page.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${page.enabled ? 'right-[2px]' : 'left-[2px]'}`} />
                                        </button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingPage(editingPage === page.id ? null : page.id)}>
                                            {editingPage === page.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </Button>
                                        {!page.isSystem && (
                                            <Button size="sm" variant="ghost" onClick={() => deletePage(page.id)}>
                                                <Trash2 size={14} className="text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {editingPage === page.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                        <p className="text-xs font-medium text-slate-500 mb-2">Sections:</p>
                                        {page.sections?.map((sec: any, idx: number) => {
                                            const secConfig = ALL_SECTION_TYPES.find(s => s.value === sec.type)
                                            const SectionIcon = secConfig?.icon || FileText
                                            const sectionAllowed = limits?.allowedSections.includes(sec.type)
                                            return (
                                                <div key={sec.id} className={`flex items-center gap-3 rounded-lg p-2.5 ${sectionAllowed ? 'bg-slate-50' : 'bg-red-50'}`}>
                                                    <GripVertical size={14} className="text-slate-300" />
                                                    <SectionIcon size={14} className={sectionAllowed ? 'text-slate-500' : 'text-red-400'} />
                                                    <span className={`text-sm flex-1 ${sectionAllowed ? 'text-slate-700' : 'text-red-500'}`}>
                                                        {sec.title}
                                                        {!sectionAllowed && <span className="ml-1 text-[10px] text-red-400">(Locked)</span>}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const pages = [...website.pages]
                                                            const pageIdx = pages.findIndex((p: any) => p.id === page.id)
                                                            pages[pageIdx].sections[idx].enabled = !sec.enabled
                                                            set('pages', pages)
                                                        }}
                                                        className={`w-7 h-4 rounded-full transition-colors relative ${sec.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${sec.enabled ? 'right-[2px]' : 'left-[2px]'}`} />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <Modal open={addPageModal} onClose={() => setAddPageModal(false)} title="Add New Page">
                        <div className="space-y-4">
                            <Input label="Page Title" value={newPage.title} onChange={e => {
                                setNewPage({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') })
                            }} placeholder="e.g. Infrastructure" />
                            <Input label="URL Slug" value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="e.g. infrastructure" />
                            <Button className="w-full" onClick={addPage}>Add Page</Button>
                        </div>
                    </Modal>
                </div>
            )}

            {/* ════════════ CONTENT TAB ════════════ */}
            {tab === 'content' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stats */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">School Stats</h3>
                        <div className="space-y-3">
                            {(website?.stats || []).map((stat: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Label" value={stat.label} onChange={e => {
                                        const stats = [...(website.stats || [])]; stats[idx] = { ...stat, label: e.target.value }; set('stats', stats)
                                    }} />
                                    <input className="w-24 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Value" value={stat.value} onChange={e => {
                                        const stats = [...(website.stats || [])]; stats[idx] = { ...stat, value: e.target.value }; set('stats', stats)
                                    }} />
                                    <button onClick={() => set('stats', website.stats.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => set('stats', [...(website.stats || []), { label: '', value: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add stat</button>
                        </div>
                    </Card>

                    {/* Facilities */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Facilities</h3>
                        <div className="space-y-2">
                            {(website?.facilities || []).map((f: string, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" value={f} onChange={e => {
                                        const facs = [...(website.facilities || [])]; facs[idx] = e.target.value; set('facilities', facs)
                                    }} />
                                    <button onClick={() => set('facilities', website.facilities.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button onClick={() => set('facilities', [...(website.facilities || []), ''])} className="text-xs text-indigo-600 hover:underline">+ Add facility</button>
                        </div>
                    </Card>

                    {/* Faculty */}
                    {isLocked('facultySection') ? (
                        <LockedFeature feature="Faculty Section" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Faculty Members</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Faculty Members</h3>
                            <div className="space-y-3">
                                {(website?.faculty || []).map((f: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-2">
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Name" value={f.name} onChange={e => {
                                            const faculty = [...(website.faculty || [])]; faculty[idx] = { ...f, name: e.target.value }; set('faculty', faculty)
                                        }} />
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Designation" value={f.designation} onChange={e => {
                                            const faculty = [...(website.faculty || [])]; faculty[idx] = { ...f, designation: e.target.value }; set('faculty', faculty)
                                        }} />
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Subject" value={f.subject || ''} onChange={e => {
                                            const faculty = [...(website.faculty || [])]; faculty[idx] = { ...f, subject: e.target.value }; set('faculty', faculty)
                                        }} />
                                        <button onClick={() => set('faculty', website.faculty.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600 justify-self-end"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => set('faculty', [...(website.faculty || []), { name: '', designation: '', subject: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add faculty</button>
                            </div>
                        </Card>
                    )}

                    {/* Testimonials */}
                    {isLocked('testimonials') ? (
                        <LockedFeature feature="Testimonials" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Testimonials</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Testimonials</h3>
                            <div className="space-y-3">
                                {(website?.testimonials || []).map((t: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Name" value={t.name} onChange={e => {
                                                const arr = [...(website.testimonials || [])]; arr[idx] = { ...t, name: e.target.value }; set('testimonials', arr)
                                            }} />
                                            <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Role" value={t.role} onChange={e => {
                                                const arr = [...(website.testimonials || [])]; arr[idx] = { ...t, role: e.target.value }; set('testimonials', arr)
                                            }} />
                                        </div>
                                        <textarea rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none" placeholder="Quote..." value={t.quote} onChange={e => {
                                            const arr = [...(website.testimonials || [])]; arr[idx] = { ...t, quote: e.target.value }; set('testimonials', arr)
                                        }} />
                                        <button onClick={() => set('testimonials', website.testimonials.filter((_: any, i: number) => i !== idx))} className="text-xs text-red-500 hover:underline">Remove</button>
                                    </div>
                                ))}
                                <button onClick={() => set('testimonials', [...(website.testimonials || []), { name: '', role: '', quote: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add testimonial</button>
                            </div>
                        </Card>
                    )}

                    {/* Events */}
                    {isLocked('eventsNews') ? (
                        <LockedFeature feature="Events & News" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Events & News</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Events & News</h3>
                            <div className="space-y-3">
                                {(website?.events || []).map((ev: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Title" value={ev.title} onChange={e => {
                                                const arr = [...(website.events || [])]; arr[idx] = { ...ev, title: e.target.value }; set('events', arr)
                                            }} />
                                            <input type="date" className="h-9 px-3 text-sm rounded-lg border border-slate-200" value={ev.date} onChange={e => {
                                                const arr = [...(website.events || [])]; arr[idx] = { ...ev, date: e.target.value }; set('events', arr)
                                            }} />
                                        </div>
                                        <textarea rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none" placeholder="Description..." value={ev.description} onChange={e => {
                                            const arr = [...(website.events || [])]; arr[idx] = { ...ev, description: e.target.value }; set('events', arr)
                                        }} />
                                        <button onClick={() => set('events', website.events.filter((_: any, i: number) => i !== idx))} className="text-xs text-red-500 hover:underline">Remove</button>
                                    </div>
                                ))}
                                <button onClick={() => set('events', [...(website.events || []), { title: '', date: '', description: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add event</button>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* ════════════ PREMIUM TAB ════════════ */}
            {tab === 'premium' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Principal Message */}
                    {isLocked('principalMessage') ? (
                        <LockedFeature feature="Principal Message" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Principal's Message</h3><p className="text-xs text-slate-400 mt-1">Add principal photo and message</p></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Principal's Message</h3>
                            <div className="space-y-3">
                                <Input label="Name" value={website?.principalMessage?.name || ''} onChange={e => set('principalMessage', { ...(website.principalMessage || {}), name: e.target.value })} placeholder="Dr. Rajesh Kumar" />
                                <Input label="Designation" value={website?.principalMessage?.designation || ''} onChange={e => set('principalMessage', { ...(website.principalMessage || {}), designation: e.target.value })} placeholder="Principal" />
                                <Input label="Photo URL" value={website?.principalMessage?.photo || ''} onChange={e => set('principalMessage', { ...(website.principalMessage || {}), photo: e.target.value })} placeholder="https://..." />
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">Message</label>
                                    <textarea rows={4} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none" value={website?.principalMessage?.message || ''} onChange={e => set('principalMessage', { ...(website.principalMessage || {}), message: e.target.value })} placeholder="Welcome message from the principal..." />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Video Tour */}
                    {isLocked('videoTour') ? (
                        <LockedFeature feature="Video Tour" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Video Tour</h3><p className="text-xs text-slate-400 mt-1">Embed YouTube video</p></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Video Tour</h3>
                            <Input label="YouTube Video URL" value={website?.videoTourUrl || ''} onChange={e => set('videoTourUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." helper="Paste any YouTube video URL" />
                        </Card>
                    )}

                    {/* Announcement Ticker */}
                    {isLocked('announcementTicker') ? (
                        <LockedFeature feature="Announcement Ticker" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Announcement Ticker</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Announcement Ticker</h3>
                            <Input label="Scrolling Text" value={website?.announcementText || ''} onChange={e => set('announcementText', e.target.value)} placeholder="Admissions open for 2025-26 | Annual function on 15th Jan..." helper="This text scrolls at the top of your website" />
                        </Card>
                    )}

                    {/* Achievements */}
                    {isLocked('achievements') ? (
                        <LockedFeature feature="Achievements" requiredPlan="Pro">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Achievements & Awards</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Achievements & Awards</h3>
                            <div className="space-y-3">
                                {(website?.achievements || []).map((a: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2">
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Title" value={a.title} onChange={e => {
                                            const arr = [...(website.achievements || [])]; arr[idx] = { ...a, title: e.target.value }; set('achievements', arr)
                                        }} />
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Year" value={a.year || ''} onChange={e => {
                                            const arr = [...(website.achievements || [])]; arr[idx] = { ...a, year: e.target.value }; set('achievements', arr)
                                        }} />
                                        <div className="flex gap-1">
                                            <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Description" value={a.description} onChange={e => {
                                                const arr = [...(website.achievements || [])]; arr[idx] = { ...a, description: e.target.value }; set('achievements', arr)
                                            }} />
                                            <button onClick={() => set('achievements', website.achievements.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => set('achievements', [...(website.achievements || []), { title: '', description: '', year: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add achievement</button>
                            </div>
                        </Card>
                    )}

                    {/* Downloads */}
                    {isLocked('downloads') ? (
                        <LockedFeature feature="Downloads Section" requiredPlan="Pro">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Downloads</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Downloads (Syllabus, Forms)</h3>
                            <div className="space-y-2">
                                {(website?.downloads || []).map((d: any, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Title" value={d.title} onChange={e => {
                                            const arr = [...(website.downloads || [])]; arr[idx] = { ...d, title: e.target.value }; set('downloads', arr)
                                        }} />
                                        <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="File URL" value={d.url} onChange={e => {
                                            const arr = [...(website.downloads || [])]; arr[idx] = { ...d, url: e.target.value }; set('downloads', arr)
                                        }} />
                                        <button onClick={() => set('downloads', website.downloads.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => set('downloads', [...(website.downloads || []), { title: '', url: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add download</button>
                            </div>
                        </Card>
                    )}

                    {/* Fee Structure */}
                    {isLocked('feeStructure') ? (
                        <LockedFeature feature="Fee Structure" requiredPlan="Pro">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Fee Structure</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Fee Structure</h3>
                            <div className="space-y-2">
                                {(website?.feeStructure || []).map((f: any, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Class" value={f.className} onChange={e => {
                                            const arr = [...(website.feeStructure || [])]; arr[idx] = { ...f, className: e.target.value }; set('feeStructure', arr)
                                        }} />
                                        <input className="w-32 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Fee (₹)" value={f.fee} onChange={e => {
                                            const arr = [...(website.feeStructure || [])]; arr[idx] = { ...f, fee: e.target.value }; set('feeStructure', arr)
                                        }} />
                                        <button onClick={() => set('feeStructure', website.feeStructure.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => set('feeStructure', [...(website.feeStructure || []), { className: '', fee: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add class fee</button>
                            </div>
                        </Card>
                    )}

                    {/* Infrastructure */}
                    {isLocked('infrastructure') ? (
                        <LockedFeature feature="Infrastructure" requiredPlan="Pro">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Infrastructure</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card className="lg:col-span-2">
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Infrastructure</h3>
                            <div className="space-y-3">
                                {(website?.infrastructureItems || []).map((item: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2">
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Title" value={item.title} onChange={e => {
                                            const arr = [...(website.infrastructureItems || [])]; arr[idx] = { ...item, title: e.target.value }; set('infrastructureItems', arr)
                                        }} />
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Description" value={item.description} onChange={e => {
                                            const arr = [...(website.infrastructureItems || [])]; arr[idx] = { ...item, description: e.target.value }; set('infrastructureItems', arr)
                                        }} />
                                        <div className="flex gap-1">
                                            <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Image URL" value={item.image || ''} onChange={e => {
                                                const arr = [...(website.infrastructureItems || [])]; arr[idx] = { ...item, image: e.target.value }; set('infrastructureItems', arr)
                                            }} />
                                            <button onClick={() => set('infrastructureItems', website.infrastructureItems.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => set('infrastructureItems', [...(website.infrastructureItems || []), { title: '', description: '', image: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add infrastructure item</button>
                            </div>
                        </Card>
                    )}

                    {/* Transport Routes — Enterprise */}
                    {isLocked('transportRoutes') ? (
                        <LockedFeature feature="Transport Routes" requiredPlan="Enterprise">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Transport Routes</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Transport Routes</h3>
                            <div className="space-y-2">
                                {(website?.transportRoutes || []).map((r: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2">
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Route Name" value={r.routeName} onChange={e => {
                                            const arr = [...(website.transportRoutes || [])]; arr[idx] = { ...r, routeName: e.target.value }; set('transportRoutes', arr)
                                        }} />
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Stops" value={r.stops} onChange={e => {
                                            const arr = [...(website.transportRoutes || [])]; arr[idx] = { ...r, stops: e.target.value }; set('transportRoutes', arr)
                                        }} />
                                        <div className="flex gap-1">
                                            <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Bus No" value={r.busNo || ''} onChange={e => {
                                                const arr = [...(website.transportRoutes || [])]; arr[idx] = { ...r, busNo: e.target.value }; set('transportRoutes', arr)
                                            }} />
                                            <button onClick={() => set('transportRoutes', website.transportRoutes.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => set('transportRoutes', [...(website.transportRoutes || []), { routeName: '', stops: '', busNo: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add route</button>
                            </div>
                        </Card>
                    )}

                    {/* Alumni — Enterprise */}
                    {isLocked('alumniSection') ? (
                        <LockedFeature feature="Alumni Section" requiredPlan="Enterprise">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Alumni Network</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Notable Alumni</h3>
                            <div className="space-y-2">
                                {(website?.alumniList || []).map((a: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-2">
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Name" value={a.name} onChange={e => {
                                            const arr = [...(website.alumniList || [])]; arr[idx] = { ...a, name: e.target.value }; set('alumniList', arr)
                                        }} />
                                        <input className="h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Batch" value={a.batch} onChange={e => {
                                            const arr = [...(website.alumniList || [])]; arr[idx] = { ...a, batch: e.target.value }; set('alumniList', arr)
                                        }} />
                                        <div className="flex gap-1">
                                            <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Achievement" value={a.achievement || ''} onChange={e => {
                                                const arr = [...(website.alumniList || [])]; arr[idx] = { ...a, achievement: e.target.value }; set('alumniList', arr)
                                            }} />
                                            <button onClick={() => set('alumniList', website.alumniList.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => set('alumniList', [...(website.alumniList || []), { name: '', batch: '', achievement: '' }])} className="text-xs text-indigo-600 hover:underline">+ Add alumni</button>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* ════════════ MEDIA TAB ════════════ */}
            {tab === 'media' && (
                <div className="space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">Photo Gallery</h3>
                            <span className="text-xs text-slate-400">{website?.gallery?.length || 0}/{limits?.maxGalleryPhotos || 10} photos</span>
                        </div>
                        <div className="space-y-2">
                            {(website?.gallery || []).map((img: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input className="flex-1 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Image URL" value={img.url} onChange={e => {
                                        const arr = [...(website.gallery || [])]; arr[idx] = { ...img, url: e.target.value }; set('gallery', arr)
                                    }} />
                                    <input className="w-40 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Caption" value={img.caption || ''} onChange={e => {
                                        const arr = [...(website.gallery || [])]; arr[idx] = { ...img, caption: e.target.value }; set('gallery', arr)
                                    }} />
                                    {limits?.galleryAlbums && (
                                        <input className="w-32 h-9 px-3 text-sm rounded-lg border border-slate-200" placeholder="Album" value={img.album || ''} onChange={e => {
                                            const arr = [...(website.gallery || [])]; arr[idx] = { ...img, album: e.target.value }; set('gallery', arr)
                                        }} />
                                    )}
                                    <button onClick={() => set('gallery', website.gallery.filter((_: any, i: number) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    if (limits && (website?.gallery?.length || 0) >= limits.maxGalleryPhotos) {
                                        setAlert({ type: 'error', msg: `Gallery limit reached (${limits.maxGalleryPhotos}). Upgrade your plan for more.` })
                                        return
                                    }
                                    set('gallery', [...(website.gallery || []), { url: '', caption: '' }])
                                }}
                                className="text-xs text-indigo-600 hover:underline"
                            >+ Add image</button>
                        </div>
                        {!limits?.galleryAlbums && (
                            <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1"><Lock size={8} /> Album grouping available in Pro+ plan</p>
                        )}
                    </Card>

                    <Card>
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Logo</h3>
                        <Input label="Logo URL" value={website?.logo || ''} onChange={e => set('logo', e.target.value)} placeholder="https://example.com/logo.png" />
                    </Card>
                </div>
            )}

            {/* ════════════ SETTINGS TAB ════════════ */}
            {tab === 'settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SEO */}
                    {isLocked('seoSettings') ? (
                        <LockedFeature feature="SEO Settings" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">SEO Settings</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">SEO Settings</h3>
                            <div className="space-y-4">
                                <Input label="SEO Title" value={website?.seoTitle || ''} onChange={e => set('seoTitle', e.target.value)} placeholder={school?.name} />
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-1">SEO Description</label>
                                    <textarea rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none" value={website?.seoDescription || ''} onChange={e => set('seoDescription', e.target.value)} />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Social */}
                    {isLocked('socialLinks') ? (
                        <LockedFeature feature="Social Media Links" requiredPlan="Growth">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Social Media</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Social Media Links</h3>
                            <div className="space-y-3">
                                <Input label="Facebook" value={website?.facebook || ''} onChange={e => set('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                                <Input label="Instagram" value={website?.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/..." />
                                <Input label="YouTube" value={website?.youtube || ''} onChange={e => set('youtube', e.target.value)} placeholder="https://youtube.com/..." />
                                <Input label="WhatsApp" value={website?.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="919876543210" />
                            </div>
                        </Card>
                    )}

                    {/* Map */}
                    <Card>
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Google Map</h3>
                        <Input label="Maps Embed URL" value={website?.mapUrl || ''} onChange={e => set('mapUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
                    </Card>

                    {/* Custom Domain */}
                    {isLocked('customDomain') ? (
                        <LockedFeature feature="Custom Domain" requiredPlan="Pro">
                            <Card><h3 className="text-sm font-semibold text-slate-800">Custom Domain</h3></Card>
                        </LockedFeature>
                    ) : (
                        <Card>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Custom Domain</h3>
                            <Input label="Domain" value={website?.customDomain || ''} onChange={e => set('customDomain', e.target.value)} placeholder="www.yourschool.com" />
                            {website?.customDomain && (
                                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-800 mb-2">DNS Setup:</p>
                                    <div className="space-y-1 text-xs text-amber-700">
                                        <p>Add CNAME record at your domain registrar:</p>
                                        <div className="bg-white rounded p-2 font-mono text-[11px] mt-1">
                                            <p>Type: <strong>CNAME</strong></p>
                                            <p>Name: <strong>www</strong></p>
                                            <p>Value: <strong>cname.vidyaflow.in</strong></p>
                                        </div>
                                        <p className="mt-2">Contact support after DNS setup.</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            )}

            {/* Floating save */}
            <div className="fixed bottom-6 right-6 z-30">
                <Button onClick={() => handleSave(false)} loading={saving} className="shadow-lg shadow-indigo-200">
                    <Save size={14} /> Save Changes
                </Button>
            </div>
        </div>
    )
}