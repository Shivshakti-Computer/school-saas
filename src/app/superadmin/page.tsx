// =============================================================
// FILE: src/app/superadmin/page.tsx
// Superadmin main dashboard
// =============================================================

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import  '@/models/User'
import { Student } from '@/models/Student'
import Link from 'next/link'

async function getStats() {
    await connectDB()
    const now = new Date()

    const [
        totalSchools,
        activeSchools,
        trialSchools,
        paidSchools,
        expiringSchools,
        totalStudents,
        recentSchools,
        recentSubs,
        planBreakdown,
    ] = await Promise.all([
        School.countDocuments({}),
        School.countDocuments({ isActive: true }),
        School.countDocuments({
            isActive: true,
            subscriptionId: null,
            trialEndsAt: { $gte: now },
        }),
        School.countDocuments({
            isActive: true,
            subscriptionId: { $ne: null },
        }),
        // Trial expiring in 3 days
        School.find({
            isActive: true,
            subscriptionId: null,
            trialEndsAt: {
                $gte: now,
                $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            },
        }).select('name subdomain trialEndsAt').lean(),
        Student.countDocuments({ status: 'active' }),
        School.find({}).sort({ createdAt: -1 }).limit(8)
            .select('name subdomain plan isActive trialEndsAt subscriptionId createdAt').lean(),
        Subscription.find({ status: 'active' }).sort({ createdAt: -1 }).limit(5)
            .populate('tenantId', 'name subdomain').lean(),
        School.aggregate([
            { $group: { _id: '$plan', count: { $sum: 1 } } },
        ]),
    ])

    // Revenue calculation (active subscriptions)
    const allSubs = await Subscription.find({ status: 'active' }).lean()
    const monthlyRevenue = allSubs.reduce((sum, s) => {
        if (s.billingCycle === 'monthly') return sum + s.amount
        return sum + Math.round(s.amount / 12)
    }, 0)

    return {
        totalSchools, activeSchools, trialSchools, paidSchools,
        expiringSchools, totalStudents, recentSchools, recentSubs,
        planBreakdown, monthlyRevenue,
    }
}

export default async function SuperadminDashboard() {
    const stats = await getStats()

    const planColors: Record<string, string> = {
        starter: 'bg-slate-100 text-slate-700',
        pro: 'bg-indigo-100 text-indigo-700',
        enterprise: 'bg-purple-100 text-purple-700',
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-800">Superadmin Dashboard</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Schools', val: stats.totalSchools, color: 'bg-slate-900 text-white' },
                    { label: 'Active (Trial)', val: stats.trialSchools, color: 'bg-blue-600 text-white' },
                    { label: 'Paid Schools', val: stats.paidSchools, color: 'bg-emerald-600 text-white' },
                    { label: 'Total Students', val: stats.totalStudents, color: 'bg-indigo-600 text-white' },
                    { label: 'MRR (Monthly)', val: `₹${stats.monthlyRevenue.toLocaleString('en-IN')}`, color: 'bg-amber-500 text-white' },
                ].map(s => (
                    <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                        <p className="text-2xl font-bold">{s.val}</p>
                        <p className="text-xs opacity-75 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Plan breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Plan Distribution</h3>
                    <div className="space-y-3">
                        {stats.planBreakdown.map((p: any) => (
                            <div key={p._id} className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${planColors[p._id] ?? 'bg-slate-100 text-slate-600'}`}>
                                    {p._id}
                                </span>
                                <div className="flex-1 bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-indigo-500 h-2 rounded-full"
                                        style={{ width: `${Math.round((p.count / stats.totalSchools) * 100)}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-slate-700 min-w-[24px] text-right">
                                    {p.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expiring trials */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">
                        Trial Expiring Soon
                        {stats.expiringSchools.length > 0 && (
                            <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                                {stats.expiringSchools.length}
                            </span>
                        )}
                    </h3>
                    {stats.expiringSchools.length === 0 ? (
                        <p className="text-sm text-slate-400">Koi trial 3 days mein expire nahi ho raha</p>
                    ) : (
                        <div className="space-y-2">
                            {(stats.expiringSchools as any[]).map(s => (
                                <div key={s._id.toString()} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{s.name}</p>
                                        <p className="text-xs text-slate-400">{s.subdomain}</p>
                                    </div>
                                    <p className="text-xs text-amber-700 font-medium">
                                        {new Date(s.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent schools */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700">Recent Schools</h3>
                    <Link href="/superadmin/schools" className="text-xs text-indigo-600 hover:underline">
                        View all →
                    </Link>
                </div>
                <div className="divide-y divide-slate-50">
                    {(stats.recentSchools as any[]).map(s => {
                        const trialEnd = new Date(s.trialEndsAt)
                        const now = new Date()
                        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        const status = s.subscriptionId ? 'paid'
                            : daysLeft > 0 ? 'trial'
                                : 'expired'

                        return (
                            <div key={s._id.toString()} className="flex items-center gap-4 px-5 py-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold flex-shrink-0">
                                    {s.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                                    <p className="text-xs text-slate-400">{s.subdomain}.shivshakticloud.in</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${planColors[s.plan] ?? 'bg-slate-100 text-slate-600'}`}>
                                    {s.plan}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                        status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {status === 'paid' ? 'Paid' : status === 'trial' ? `Trial (${daysLeft}d)` : 'Expired'}
                                </span>
                                <p className="text-xs text-slate-400 hidden lg:block">
                                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}