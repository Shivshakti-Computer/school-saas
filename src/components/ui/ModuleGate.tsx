// =============================================================
// FILE: src/components/ui/ModuleGate.tsx
// Plan-based module gating — lock icon + upgrade prompt
// Use: Kisi bhi page pe wrap karo agar plan check karna ho
// =============================================================

'use client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { isModuleAllowed } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

interface Props {
    moduleKey: string
    children: React.ReactNode
    fallback?: React.ReactNode   // optional custom fallback
}

export function ModuleGate({ moduleKey, children, fallback }: Props) {
    const { data: session } = useSession()

    if (!session) return null

    const plan = session.user.plan as PlanId
    const allowed = isModuleAllowed(plan, moduleKey)

    if (allowed) return <>{children}</>

    if (fallback) return <>{fallback}</>

    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
            <p className="text-slate-700 font-semibold mb-1">
                Yeh module aapke plan mein nahi hai
            </p>
            <p className="text-slate-400 text-sm mb-4 max-w-xs">
                <strong className="capitalize">{moduleKey}</strong> module ke liye plan upgrade karo
            </p>
            <Link
                href="/admin/subscription"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
                View Plans & Upgrade →
            </Link>
            <p className="text-xs text-slate-400 mt-2">
                Current plan: <strong className="capitalize">{plan}</strong>
            </p>
        </div>
    )
}