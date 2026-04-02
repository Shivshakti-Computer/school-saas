// FILE: src/app/(superadmin)/superadmin/schools/page.tsx
// UPDATED: Credit balance column + manual adjust button

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Building2, Zap } from 'lucide-react'

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'trial' | 'paid' | 'expired'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  // Credit adjust modal
  const [creditModal, setCreditModal] = useState<{
    id: string; name: string; balance: number
  } | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)

  const fetchSchools = async () => {
    setLoading(true)
    const res = await fetch('/api/superadmin/schools')
    const data = await res.json()
    setSchools(data.schools || [])
    setLoading(false)
  }

  useEffect(() => { fetchSchools() }, [])

  const toggleActive = async (id: string, isActive: boolean) => {
    setActionLoading(id)
    await fetch('/api/superadmin/schools', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    await fetchSchools()
    setActionLoading(null)
  }

  const adjustCredits = async () => {
    if (!creditModal) return
    const amount = parseInt(creditAmount)
    if (isNaN(amount) || amount === 0) return

    setCreditLoading(true)
    await fetch('/api/superadmin/schools', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: creditModal.id,
        adjustCredits: amount,
      }),
    })
    await fetchSchools()
    setCreditLoading(false)
    setCreditModal(null)
    setCreditAmount('')
  }

  const now = new Date()

  const filtered = schools.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)

    if (!matchSearch) return false

    const trialEnd = new Date(s.trialEndsAt)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
    const status = s.subscriptionId ? 'paid' : daysLeft > 0 ? 'trial' : 'expired'

    if (filter === 'all') return true
    return filter === status
  })

  const planColors: Record<string, string> = {
    starter:    'bg-slate-100 text-slate-700',
    growth:     'bg-indigo-100 text-indigo-700',
    pro:        'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">All Schools</h1>
          <p className="text-sm text-slate-500">{schools.length} registered schools</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, or phone..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'trial', 'paid', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading schools...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No schools found</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium">School</th>
                  <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Code</th>
                  <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">Phone</th>
                  <th className="text-left px-3 py-3 font-medium">Plan</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  {/* ── NEW: Credits column ── */}
                  <th className="text-left px-3 py-3 font-medium hidden xl:table-cell">Credits</th>
                  <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">Registered</th>
                  <th className="text-left px-3 py-3 font-medium">Active</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const trialEnd = new Date(s.trialEndsAt)
                  const daysLeft = Math.ceil(
                    (trialEnd.getTime() - now.getTime()) / 86400000
                  )
                  const status = s.subscriptionId
                    ? 'paid'
                    : daysLeft > 0 ? 'trial' : 'expired'

                  const creditBalance =
                    s.creditInfo?.balance ?? s.creditBalance ?? 0
                  const isLowCredit = creditBalance < 50

                  return (
                    <tr
                      key={s._id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-400 md:hidden">
                          {s.subdomain}
                        </p>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                          {s.subdomain}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-600">{s.phone}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${
                            planColors[s.plan] || 'bg-slate-100'
                          }`}
                        >
                          {s.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : status === 'trial'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {status === 'trial'
                            ? `Trial (${daysLeft}d)`
                            : status === 'paid' ? 'Paid' : 'Expired'}
                        </span>
                      </td>

                      {/* ── NEW: Credits ── */}
                      <td className="px-3 py-3 hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-semibold ${
                              isLowCredit ? 'text-red-600' : 'text-slate-700'
                            }`}
                          >
                            {creditBalance.toLocaleString('en-IN')}
                          </span>
                          {isLowCredit && (
                            <span className="text-[10px] text-red-500">⚠️</span>
                          )}
                          <button
                            onClick={() =>
                              setCreditModal({
                                id: s._id,
                                name: s.name,
                                balance: creditBalance,
                              })
                            }
                            className="text-[10px] text-indigo-600 hover:underline"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {new Date(s.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleActive(s._id, s.isActive)}
                          disabled={actionLoading === s._id}
                          className={`w-8 h-5 rounded-full transition-colors relative ${
                            s.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${
                              s.isActive ? 'right-[3px]' : 'left-[3px]'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/superadmin/schools/${s._id}`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Credit Adjust Modal ── */}
      {creditModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setCreditModal(null)
              setCreditAmount('')
            }
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-indigo-600" />
              <h3 className="font-bold text-slate-900">Adjust Credits</h3>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              School: <strong>{creditModal.name}</strong>
            </p>
            <p className="text-sm text-slate-600 mb-4">
              Current Balance:{' '}
              <strong className="text-indigo-600">
                {creditModal.balance.toLocaleString('en-IN')} credits
              </strong>
            </p>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Amount (positive = add, negative = deduct)
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                placeholder="e.g. 500 or -100"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              {creditAmount && !isNaN(parseInt(creditAmount)) && (
                <p className="text-xs text-slate-500 mt-1">
                  New balance:{' '}
                  <strong>
                    {Math.max(
                      0,
                      creditModal.balance + parseInt(creditAmount)
                    ).toLocaleString('en-IN')}{' '}
                    credits
                  </strong>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCreditModal(null)
                  setCreditAmount('')
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={adjustCredits}
                disabled={creditLoading || !creditAmount || isNaN(parseInt(creditAmount))}
                className="flex-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {creditLoading ? 'Saving…' : 'Adjust'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}