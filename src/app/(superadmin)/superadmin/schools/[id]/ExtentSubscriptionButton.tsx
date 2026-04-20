// FILE: src/app/(superadmin)/superadmin/schools/[id]/ExtendSubscriptionButton.tsx
'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

export function ExtendSubscriptionButton({ 
  tenantId,
  schoolSubdomain,
  currentEnd 
}: { 
  tenantId: string
  schoolSubdomain: string
  currentEnd?: string 
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // ✅ Sirf tumhare test school ke liye allow karo
  const ALLOWED_TEST_SCHOOLS = [
    'demo_school',
    'test_school',
    'skolify',
  ]

  const isTestSchool = ALLOWED_TEST_SCHOOLS.includes(schoolSubdomain)

  async function handleExtend(months: number) {
    if (!isTestSchool) {
      setMessage('❌ Only allowed for test schools')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/superadmin/extend-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, months }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage(`✅ Extended till ${new Date(data.newPeriodEnd).toLocaleDateString('en-IN')}`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage(`❌ ${data.error || 'Failed'}`)
      }
    } catch (err) {
      setMessage('❌ Network error')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Agar test school nahi hai to button dikhao hi mat
  if (!isTestSchool) {
    return null
  }

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-800">
          Extend Subscription (Test School Only)
        </h3>
      </div>

      {currentEnd && (
        <p className="text-xs text-slate-600 mb-3">
          Current end: <strong>{new Date(currentEnd).toLocaleDateString('en-IN')}</strong>
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => handleExtend(1)}
          disabled={loading}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-50 transition-colors"
        >
          +1 Month
        </button>
        <button
          onClick={() => handleExtend(3)}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 disabled:opacity-50 transition-colors"
        >
          +3 Months
        </button>
        <button
          onClick={() => handleExtend(6)}
          disabled={loading}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 disabled:opacity-50 transition-colors"
        >
          +6 Months
        </button>
        <button
          onClick={() => handleExtend(12)}
          disabled={loading}
          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 disabled:opacity-50 transition-colors"
        >
          +1 Year
        </button>
      </div>

      {message && (
        <p className={`text-xs font-medium ${
          message.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {message}
        </p>
      )}

      {loading && (
        <p className="text-xs text-slate-400 italic">Extending...</p>
      )}

      <p className="text-[10px] text-slate-400 mt-3 italic">
        ⚠️ For testing only — no Razorpay charge
      </p>
    </div>
  )
}