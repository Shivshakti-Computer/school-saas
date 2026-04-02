// FILE: src/app/(superadmin)/superadmin/schools/[id]/SchoolDetailActions.tsx
// NEW: Client actions — extend trial, toggle active, credit adjust

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Calendar, Power } from 'lucide-react'

interface Props {
    schoolId: string
    schoolName: string
    creditBalance: number
    status: 'paid' | 'trial' | 'expired'
    daysLeft: number
    isActive: boolean
}

export function SchoolDetailActions({
    schoolId, schoolName, creditBalance, status, daysLeft, isActive,
}: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [creditAmount, setCreditAmount] = useState('')
    const [showCreditInput, setShowCreditInput] = useState(false)
    const [message, setMessage] = useState<{
        type: 'success' | 'error'; text: string
    } | null>(null)

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    // ── Extend trial ──
    const extendTrial = async () => {
        setLoading('trial')
        try {
            const res = await fetch(
                `/api/superadmin/schools/${schoolId}/extend-trial`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            )
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            showMsg(
                'success',
                `Trial extended! New end: ${new Date(data.trialEndsAt).toLocaleDateString('en-IN')} · ${data.creditsAdded} credits added`
            )
            router.refresh()
        } catch (err: any) {
            showMsg('error', err.message)
        }
        setLoading(null)
    }

    // ── Toggle active ──
    const toggleActive = async () => {
        setLoading('active')
        try {
            const res = await fetch(`/api/superadmin/schools/${schoolId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            showMsg('success', `School ${!isActive ? 'activated' : 'disabled'}`)
            router.refresh()
        } catch (err: any) {
            showMsg('error', err.message)
        }
        setLoading(null)
    }

    // ── Adjust credits ──
    const adjustCredits = async () => {
        const amount = parseInt(creditAmount)
        if (isNaN(amount) || amount === 0) return

        setLoading('credits')
        try {
            const res = await fetch(`/api/superadmin/schools/${schoolId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adjustCredits: amount }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            showMsg(
                'success',
                `Credits adjusted! New balance: ${data.creditBalance.toLocaleString('en-IN')}`
            )
            setCreditAmount('')
            setShowCreditInput(false)
            router.refresh()
        } catch (err: any) {
            showMsg('error', err.message)
        }
        setLoading(null)
    }

    return (
        <div className="space-y-3">
            {/* Alert */}
            {message && (
                <div
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
                {/* Extend trial */}
                {status !== 'paid' && (
                    <button
                        onClick={extendTrial}
                        disabled={loading === 'trial'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        <Calendar size={14} />
                        {loading === 'trial' ? 'Extending…' : 'Extend Trial (+7 days)'}
                    </button>
                )}

                {/* Toggle active */}
                <button
                    onClick={toggleActive}
                    disabled={loading === 'active'}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 ${isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                >
                    <Power size={14} />
                    {loading === 'active'
                        ? 'Updating…'
                        : isActive ? 'Disable School' : 'Enable School'}
                </button>

                {/* Credit adjust toggle */}
                <button
                    onClick={() => setShowCreditInput(!showCreditInput)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm font-semibold"
                >
                    <Zap size={14} />
                    Adjust Credits
                </button>
            </div>

            {/* Credit input */}
            {showCreditInput && (
                <div className="flex gap-2 items-center">
                    <input
                        type="number"
                        value={creditAmount}
                        onChange={e => setCreditAmount(e.target.value)}
                        placeholder="e.g. 500 or -100"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    {creditAmount && !isNaN(parseInt(creditAmount)) && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                            → {Math.max(0, creditBalance + parseInt(creditAmount)).toLocaleString('en-IN')} cr
                        </span>
                    )}
                    <button
                        onClick={adjustCredits}
                        disabled={
                            loading === 'credits' ||
                            !creditAmount ||
                            isNaN(parseInt(creditAmount))
                        }
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    >
                        {loading === 'credits' ? 'Saving…' : 'Apply'}
                    </button>
                    <button
                        onClick={() => {
                            setShowCreditInput(false)
                            setCreditAmount('')
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}