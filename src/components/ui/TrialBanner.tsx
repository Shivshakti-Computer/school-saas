// =============================================================
// FILE: src/components/ui/TrialBanner.tsx
// Timezone fix — getTimeLeft already UTC-safe hai
// Display ke liye toLocaleString with IST timezone
// =============================================================
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
}

function getTimeLeft(trialEndsAt: string | null): TimeLeft {
    if (!trialEndsAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }

    // new Date() ISO string ko automatically UTC se local time mein convert karta hai
    // "2026-03-25T09:22:30.482+00:00" → diff correctly calculate hoga
    const diff = new Date(trialEndsAt).getTime() - Date.now()

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }

    return {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    }
}

function pad(n: number) {
    return String(n).padStart(2, '0')
}

// IST mein human-readable expiry time — "25 Mar 2026, 2:52 PM"
function formatExpiryIST(trialEndsAt: string | null): string {
    if (!trialEndsAt) return ''
    return new Date(trialEndsAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

export function TrialBanner() {
    const { data: session } = useSession()
    const [status, setStatus] = useState<any>(null)
    const [dismissed, setDismissed] = useState(false)
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

    useEffect(() => {
        if (!session || session.user.role !== 'admin') return
        fetch('/api/subscription/status')
            .then(r => r.json())
            .then(d => {
                setStatus(d)
                setTimeLeft(getTimeLeft(d.trialEndsAt))
            })
    }, [session])

    useEffect(() => {
        if (!status?.trialEndsAt) return
        const timer = setInterval(() => {
            const tl = getTimeLeft(status.trialEndsAt)
            setTimeLeft(tl)
            if (tl.total <= 0) clearInterval(timer)
        }, 1000)
        return () => clearInterval(timer)
    }, [status?.trialEndsAt])

    if (!status || dismissed) return null
    if (status.isPaid) return null
    if (!status.isInTrial) return null
    if ((status.daysLeft ?? 99) > 7) return null

    const isUrgent = (status.daysLeft ?? 99) <= 2
    const bgClass = isUrgent ? 'bg-red-600' : 'bg-amber-500'

    return (
        <div className={`px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${bgClass} text-white`}>

            <div className="flex items-center gap-3 flex-wrap">
                <span>⏱️ Trial khatam hoga:</span>

                {/* Live countdown */}
                {timeLeft && timeLeft.total > 0 ? (
                    <div className="flex items-center gap-1 font-mono font-semibold">
                        {timeLeft.days > 0 && (
                            <>
                                <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs tabular-nums">
                                    {timeLeft.days}d
                                </span>
                                <span className="opacity-60 text-xs">:</span>
                            </>
                        )}
                        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
                            <>
                                <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs tabular-nums">
                                    {pad(timeLeft.hours)}h
                                </span>
                                <span className="opacity-60 text-xs">:</span>
                            </>
                        )}
                        <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs tabular-nums">
                            {pad(timeLeft.minutes)}m
                        </span>
                        <span className="opacity-60 text-xs">:</span>
                        <span className={`bg-white/20 rounded px-1.5 py-0.5 text-xs tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>
                            {pad(timeLeft.seconds)}s
                        </span>
                    </div>
                ) : (
                    <span className="font-semibold">Abhi expire ho gaya!</span>
                )}

                {/* IST mein exact expiry time */}
                {status.trialEndsAt && (
                    <span className="opacity-75 text-xs">
                        ({formatExpiryIST(status.trialEndsAt)} IST)
                    </span>
                )}

                {isUrgent && (
                    <span className="font-medium text-xs opacity-90">— Abhi subscribe karein!</span>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                    href="/admin/subscription"
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                >
                    Subscribe Now
                </Link>
                <button
                    onClick={() => setDismissed(true)}
                    className="opacity-70 hover:opacity-100 text-lg leading-none"
                >
                    ×
                </button>
            </div>

        </div>
    )
}