// FILE: src/app/(public)/updates/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/marketing/Container'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    feature: { label: 'New Feature', color: 'var(--brand)', bg: 'var(--brand-light)', icon: '✨' },
    update: { label: 'Update', color: 'var(--success)', bg: 'var(--success-light)', icon: '🔄' },
    maintenance: { label: 'Maintenance', color: '#D97706', bg: 'var(--warning-light)', icon: '🔧' },
    offer: { label: 'Offer', color: '#DC2626', bg: '#FEF2F2', icon: '🎁' },
    general: { label: 'Announcement', color: '#7C3AED', bg: '#F5F3FF', icon: '📢' },
}

export default function UpdatesPage() {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        fetch('/api/announcements?limit=50')
            .then(r => r.json())
            .then(data => {
                setAnnouncements(data.announcements || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const filtered = filter === 'all'
        ? announcements
        : announcements.filter(a => a.type === filter)

    return (
        <>
            {/* Hero */}
            <section className="relative pt-24 pb-12 section-brand-light overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
                <Container>
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="badge-brand inline-flex mb-6">📢 Updates</div>
                        <h1
                            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Skolify Updates &{' '}
                            <span className="gradient-text">Announcements</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Naye features, updates, offers — sab kuch ek jagah.
                            Subscribe karein to stay informed.
                        </p>
                    </div>
                </Container>
            </section>

            {/* Announcements */}
            <section className="py-16 section-white">
                <Container>
                    {/* Filter tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {['all', 'feature', 'update', 'offer', 'maintenance', 'general'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className="px-4 py-2 rounded-full text-sm font-semibold
                  transition-all border"
                                style={filter === type
                                    ? {
                                        background: 'var(--brand)',
                                        color: 'white',
                                        borderColor: 'var(--brand)',
                                    }
                                    : {
                                        background: 'var(--surface-0)',
                                        color: 'var(--text-secondary)',
                                        borderColor: 'var(--surface-200)',
                                    }
                                }
                            >
                                {type === 'all'
                                    ? '📋 All'
                                    : `${TYPE_CONFIG[type]?.icon} ${TYPE_CONFIG[type]?.label}`}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-20">
                            <div
                                className="w-8 h-8 border-2 border-t-transparent rounded-full
                  animate-spin mx-auto"
                                style={{ borderColor: 'var(--brand)' }}
                            />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div
                            className="text-center py-20 rounded-2xl border"
                            style={{
                                background: 'var(--surface-50)',
                                borderColor: 'var(--surface-200)',
                            }}
                        >
                            <div className="text-5xl mb-4">📭</div>
                            <h3
                                className="font-bold mb-2"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                No announcements yet
                            </h3>
                            <p style={{ color: 'var(--text-muted)' }}>
                                Check back soon for updates!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5 max-w-3xl">
                            {filtered.map(a => {
                                const tc = TYPE_CONFIG[a.type] || TYPE_CONFIG.general
                                return (
                                    <div
                                        key={a._id}
                                        className="rounded-2xl border p-6 transition-all hover:shadow-soft"
                                        style={{
                                            background: 'var(--surface-0)',
                                            borderColor: 'var(--surface-200)',
                                        }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Type indicator */}
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center
                          justify-center text-xl flex-shrink-0"
                                                style={{ background: tc.bg }}
                                            >
                                                {tc.icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <span
                                                        className="text-xs font-bold px-2.5 py-1 rounded-full border"
                                                        style={{
                                                            background: tc.bg,
                                                            color: tc.color,
                                                            borderColor: `${tc.color}20`,
                                                        }}
                                                    >
                                                        {tc.label}
                                                    </span>
                                                    {a.isPinned && (
                                                        <span
                                                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                                                            style={{
                                                                background: 'var(--warning-light)',
                                                                color: '#D97706',
                                                            }}
                                                        >
                                                            📌 Pinned
                                                        </span>
                                                    )}
                                                    <span
                                                        className="text-xs ml-auto"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        {a.publishedAt
                                                            ? new Date(a.publishedAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: 'numeric',
                                                            })
                                                            : ''}
                                                    </span>
                                                </div>

                                                <h3
                                                    className="font-bold text-base mb-2"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {a.title}
                                                </h3>
                                                <p
                                                    className="text-sm leading-relaxed"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {a.summary}
                                                </p>

                                                {a.tags?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {a.tags.map((tag: string) => (
                                                            <span
                                                                key={tag}
                                                                className="text-[11px] px-2 py-0.5 rounded-full"
                                                                style={{
                                                                    background: 'var(--surface-100)',
                                                                    color: 'var(--text-muted)',
                                                                }}
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </Container>
            </section>
        </>
    )
}