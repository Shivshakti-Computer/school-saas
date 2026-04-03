// FILE: src/components/marketing/AnnouncementBanner.tsx
// Sitewide top banner — fetches from API
// Client component — layout mein add karo
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function AnnouncementBanner() {
    const [banner, setBanner] = useState<any>(null)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        // Check if dismissed in this session
        const key = 'skolify_banner_dismissed'
        const dismissedId = sessionStorage.getItem(key)

        fetch('/api/announcements?banner=true&limit=1')
            .then(r => r.json())
            .then(data => {
                const b = data.announcements?.[0]
                if (b && b._id !== dismissedId) {
                    setBanner(b)
                }
            })
            .catch(() => { })
    }, [])

    const handleDismiss = () => {
        sessionStorage.setItem('skolify_banner_dismissed', banner._id)
        setDismissed(true)
    }

    if (!banner || dismissed) return null

    return (
        <div
            className="w-full py-2.5 px-4 flex items-center justify-between gap-4
        text-white text-sm font-medium"
            style={{ background: banner.bannerColor || 'var(--brand)' }}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
                <span className="flex-shrink-0">📢</span>
                <span className="truncate">{banner.bannerText || banner.summary}</span>
                <Link
                    href="/updates"
                    className="underline text-white/80 hover:text-white flex-shrink-0
            text-xs ml-1"
                >
                    Learn more →
                </Link>
            </div>
            <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white flex-shrink-0 text-lg
          leading-none transition-colors"
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    )
}