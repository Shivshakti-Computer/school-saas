// =============================================================
// FILE: src/components/pwa/PWAInstallPrompt.tsx
// Smart install prompt — shown after 3rd visit, per role
// =============================================================

'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
    const { data: session } = useSession()
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Already installed?
        const standalone = window.matchMedia('(display-mode: standalone)').matches
        setIsStandalone(standalone)
        if (standalone) return

        // iOS detection
        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
        setIsIOS(ios)

        // Track visit count
        const visits = parseInt(localStorage.getItem('pwa_visits') ?? '0') + 1
        localStorage.setItem('pwa_visits', String(visits))
        const dismissed = localStorage.getItem('pwa_dismissed') === '1'

        if (dismissed) return

        // Show after 2nd visit
        if (visits >= 2) {
            if (ios) {
                setShowBanner(true)
                return
            }
        }

        // Android/Desktop — capture beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            if (visits >= 2) setShowBanner(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const install = async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setShowBanner(false)
        }
        setDeferredPrompt(null)
    }

    const dismiss = () => {
        setShowBanner(false)
        localStorage.setItem('pwa_dismissed', '1')
    }

    if (!showBanner || isStandalone || !session) return null

    const role = session.user.role
    const roleLabel: Record<string, string> = {
        admin: 'Admin Panel',
        teacher: 'Teacher App',
        student: 'Student Portal',
        parent: 'Parent App',
    }

    return (
        <div style={{
            position: 'fixed', bottom: 16, left: 16, right: 16,
            zIndex: 9998,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            border: '1px solid #E2E8F0',
            maxWidth: 480, margin: '0 auto',
        }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                📱
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', marginBottom: 2 }}>
                    Install {session.user.schoolName} {roleLabel[role]}
                </p>
                {isIOS ? (
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                        Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install
                    </p>
                ) : (
                    <p style={{ fontSize: 12, color: '#64748B' }}>
                        Install for faster access — works offline too
                    </p>
                )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={dismiss} style={{ padding: '8px 12px', fontSize: 13, color: '#64748B', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer' }}>
                    Later
                </button>
                {!isIOS && deferredPrompt && (
                    <button onClick={install} style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'white', background: '#4F46E5', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        Install
                    </button>
                )}
            </div>
        </div>
    )
}
