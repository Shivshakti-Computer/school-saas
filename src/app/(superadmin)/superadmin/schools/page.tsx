'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Search, Filter, Eye, Ban, CheckCircle, ArrowRight } from 'lucide-react'

export default function SchoolsPage() {
    const [schools, setSchools] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'trial' | 'paid' | 'expired'>('all')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

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

    const now = new Date()

    const filtered = schools.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
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
        starter: 'bg-slate-100 text-slate-700',
        growth: 'bg-indigo-100 text-indigo-700',
        pro: 'bg-purple-100 text-purple-700',
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
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                                    <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">Registered</th>
                                    <th className="text-left px-3 py-3 font-medium">Active</th>
                                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => {
                                    const trialEnd = new Date(s.trialEndsAt)
                                    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
                                    const status = s.subscriptionId ? 'paid' : daysLeft > 0 ? 'trial' : 'expired'

                                    return (
                                        <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                                                <p className="text-[11px] text-slate-400 md:hidden">{s.subdomain}</p>
                                            </td>
                                            <td className="px-3 py-3 hidden md:table-cell">
                                                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{s.subdomain}</span>
                                            </td>
                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                <span className="text-xs text-slate-600">{s.phone}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${planColors[s.plan] || 'bg-slate-100'}`}>
                                                    {s.plan}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                        status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {status === 'trial' ? `Trial (${daysLeft}d)` : status === 'paid' ? 'Paid' : 'Expired'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                <span className="text-xs text-slate-500">
                                                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <button
                                                    onClick={() => toggleActive(s._id, s.isActive)}
                                                    disabled={actionLoading === s._id}
                                                    className={`w-8 h-5 rounded-full transition-colors relative ${s.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${s.isActive ? 'right-[3px]' : 'left-[3px]'}`} />
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
        </div>
    )
}