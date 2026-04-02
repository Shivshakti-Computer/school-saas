// FILE: src/app/(superadmin)/superadmin/page.tsx
// UPDATED: Credit stats + messaging analytics added

import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import Link from 'next/link'
import {
  Building2, Users, GraduationCap, CreditCard,
  TrendingUp, AlertTriangle, ArrowRight, MessageSquare,
  Zap, BarChart2,
} from 'lucide-react'

async function getStats() {
  await connectDB()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalSchools,
    activeSchools,
    trialSchools,
    paidSchools,
    expiredSchools,
    totalStudents,
    totalTeachers,
    expiringTrials,
    recentSchools,
    recentSubs,
    planBreakdown,
    newSchoolsThisMonth,
    // ── NEW: Credit data ──
    totalCreditBalance,
    last30DaysCreditUsage,
    creditPurchasesThisMonth,
  ] = await Promise.all([
    School.countDocuments({}),
    School.countDocuments({ isActive: true }),
    School.countDocuments({
      isActive: true,
      subscriptionId: null,
      trialEndsAt: { $gte: now },
    }),
    Subscription.countDocuments({ status: 'active' }),
    School.countDocuments({
      isActive: true,
      subscriptionId: null,
      trialEndsAt: { $lt: now },
    }),
    Student.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    School.find({
      isActive: true,
      subscriptionId: null,
      trialEndsAt: {
        $gte: now,
        $lte: new Date(now.getTime() + 3 * 86400000),
      },
    })
      .select('name subdomain trialEndsAt phone')
      .lean(),
    School.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name subdomain plan isActive trialEndsAt subscriptionId createdAt phone')
      .lean(),
    Subscription.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('tenantId', 'name subdomain')
      .lean(),
    School.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
    School.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

    // Total credit balance across all schools
    MessageCredit.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]),

    // Last 30 days by channel
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'message_deduct',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          credits: { $sum: { $abs: '$amount' } },
        },
      },
    ]),

    // Credit purchases this month
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'purchase',
          createdAt: { $gte: thisMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
    ]),
  ])

  // Revenue
  const allActiveSubs = await Subscription.find({ status: 'active' }).lean() as any[]
  const monthlyRevenue = allActiveSubs.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + (s.amount || 0)
    return sum + Math.round((s.amount || 0) / 12)
  }, 0)
  const yearlyRevenue = monthlyRevenue * 12

  return {
    totalSchools,
    activeSchools,
    trialSchools,
    paidSchools,
    expiredSchools,
    totalStudents,
    totalTeachers,
    expiringTrials: JSON.parse(JSON.stringify(expiringTrials)),
    recentSchools: JSON.parse(JSON.stringify(recentSchools)),
    recentSubs: JSON.parse(JSON.stringify(recentSubs)),
    planBreakdown: JSON.parse(JSON.stringify(planBreakdown)),
    monthlyRevenue,
    yearlyRevenue,
    newSchoolsThisMonth,
    // ── NEW ──
    credits: {
      totalBalance: totalCreditBalance[0]?.total ?? 0,
      last30DaysUsage: JSON.parse(JSON.stringify(last30DaysCreditUsage)),
      purchasesThisMonth: creditPurchasesThisMonth[0]?.count ?? 0,
      revenueThisMonth: creditPurchasesThisMonth[0]?.revenue ?? 0,
    },
  }
}

function StatCard({
  label, value, icon: Icon, color, href, sub,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  href?: string
  sub?: string
}) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-900 text-white',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    amber: 'bg-amber-500 text-white',
    red: 'bg-red-600 text-white',
    purple: 'bg-purple-600 text-white',
    violet: 'bg-violet-600 text-white',
  }
  const content = (
    <div
      className={`${colorMap[color] || colorMap.slate} rounded-xl p-4 hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-80 mt-1">{label}</p>
          {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
        </div>
        <Icon size={20} className="opacity-60" />
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default async function SuperadminDashboard() {
  const stats = await getStats()

  const planColors: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-700',
    growth: 'bg-indigo-100 text-indigo-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }

  const channelIcons: Record<string, string> = {
    sms: '📱',
    whatsapp: '💬',
    email: '📧',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric',
            month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* School Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Schools"
          value={stats.totalSchools}
          icon={Building2}
          color="slate"
          href="/superadmin/schools"
        />
        <StatCard
          label="Active Trials"
          value={stats.trialSchools}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Paid Schools"
          value={stats.paidSchools}
          icon={CreditCard}
          color="emerald"
          href="/superadmin/subscriptions"
        />
        <StatCard
          label="MRR"
          value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="amber"
          href="/superadmin/revenue"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          label="Total Teachers"
          value={stats.totalTeachers}
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Expired Trials"
          value={stats.expiredSchools}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="New This Month"
          value={stats.newSchoolsThisMonth}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* ── NEW: Credit Stats Row ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-500" />
          Credit & Messaging Analytics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Credit Balance"
            value={stats.credits.totalBalance.toLocaleString('en-IN')}
            icon={Zap}
            color="violet"
            sub="Across all schools"
          />
          <StatCard
            label="Credit Revenue (Month)"
            value={`₹${stats.credits.revenueThisMonth.toLocaleString('en-IN')}`}
            icon={TrendingUp}
            color="emerald"
            sub={`${stats.credits.purchasesThisMonth} packs sold`}
          />
          {stats.credits.last30DaysUsage.map((u: any) => (
            <div
              key={u._id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {u.count.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">
                    {channelIcons[u._id] ?? '📨'} {u._id} messages
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {u.credits} credits used (30d)
                  </p>
                </div>
                <BarChart2 size={18} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Plan Distribution
          </h3>
          <div className="space-y-3">
            {stats.planBreakdown.map((p: any) => (
              <div key={p._id} className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${planColors[p._id] || 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {p._id || 'unknown'}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.round((p.count / Math.max(stats.totalSchools, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 min-w-[28px] text-right">
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Trials */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Trials Expiring in 3 Days
            {stats.expiringTrials.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {stats.expiringTrials.length}
              </span>
            )}
          </h3>
          {stats.expiringTrials.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              No trials expiring soon
            </p>
          ) : (
            <div className="space-y-2">
              {stats.expiringTrials.map((s: any) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.subdomain} · {s.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {new Date(s.trialEndsAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                    <Link
                      href={`/superadmin/schools/${s._id}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Schools */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Recent Schools</h3>
          <Link
            href="/superadmin/schools"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={10} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-50">
                <th className="text-left px-5 py-2.5 font-medium">School</th>
                <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Code</th>
                <th className="text-left px-3 py-2.5 font-medium">Plan</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Registered</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSchools.map((s: any) => {
                const trialEnd = new Date(s.trialEndsAt)
                const daysLeft = Math.ceil(
                  (trialEnd.getTime() - now.getTime()) / 86400000
                )
                const status = s.subscriptionId
                  ? 'paid'
                  : daysLeft > 0 ? 'trial' : 'expired'

                return (
                  <tr
                    key={s._id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.name}</p>
                          <p className="text-[11px] text-slate-400 md:hidden">{s.subdomain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {s.subdomain}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${planColors[s.plan] || 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'trial'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {status === 'paid'
                          ? 'Paid'
                          : status === 'trial'
                            ? `Trial (${daysLeft}d)`
                            : 'Expired'}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// now ke liye constant (server component mein)
const now = new Date()