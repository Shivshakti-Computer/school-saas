// FILE: src/app/(superadmin)/superadmin/revenue/page.tsx
// UPDATED: Credit revenue section added

import { connectDB } from '@/lib/db'
import { Subscription } from '@/models/Subscription'
import { CreditTransaction } from '@/models/CreditTransaction'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'

export default async function RevenuePage() {
  await connectDB()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    activeSubs,
    allSubs,
    creditPurchasesAllTime,
    creditPurchasesThisMonth,
    creditUsageByChannel,
    topCreditUsers,
  ] = await Promise.all([
    Subscription.find({ status: 'active' }).lean() as Promise<any[]>,
    Subscription.find({}).lean() as Promise<any[]>,

    // All time credit purchase revenue
    CreditTransaction.aggregate([
      { $match: { type: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),

    // This month credit purchases
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'purchase',
          createdAt: { $gte: thisMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),

    // Last 30 days usage by channel
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'message_deduct',
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 },
          credits: { $sum: { $abs: '$amount' } },
        },
      },
      { $sort: { credits: -1 } },
    ]),

    // Top schools by credit usage
    CreditTransaction.aggregate([
      {
        $match: {
          type: 'message_deduct',
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: '$tenantId',
          credits: { $sum: { $abs: '$amount' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { credits: -1 } },
      { $limit: 5 },
    ]),
  ])

  // ── Subscription revenue ──
  const mrr = activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + (s.amount || 0)
    return sum + Math.round((s.amount || 0) / 12)
  }, 0)
  const arr = mrr * 12

  const monthlySubs = activeSubs.filter(s => s.billingCycle === 'monthly').length
  const yearlySubs = activeSubs.filter(s => s.billingCycle === 'yearly').length

  const totalCollected = allSubs
    .filter(s => ['active', 'cancelled'].includes(s.status))
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  // ── By plan ──
  const byPlan: Record<string, { count: number; revenue: number }> = {}
  activeSubs.forEach(s => {
    const p = s.plan || 'unknown'
    if (!byPlan[p]) byPlan[p] = { count: 0, revenue: 0 }
    byPlan[p].count++
    byPlan[p].revenue +=
      s.billingCycle === 'monthly'
        ? s.amount || 0
        : Math.round((s.amount || 0) / 12)
  })

  // ── Credit numbers ──
  const creditRevenueAllTime = creditPurchasesAllTime[0]?.total ?? 0
  const creditRevenueMonth = creditPurchasesThisMonth[0]?.total ?? 0
  const creditPacksMonth = creditPurchasesThisMonth[0]?.count ?? 0

  const planColors: Record<string, string> = {
    starter:    'border-slate-300',
    growth:     'border-indigo-400',
    pro:        'border-purple-400',
    enterprise: 'border-amber-400',
  }

  const channelIcons: Record<string, string> = {
    sms: '📱', whatsapp: '💬', email: '📧',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Revenue Analytics</h1>
        <p className="text-sm text-slate-500">Subscription + credit revenue overview</p>
      </div>

      {/* ── Subscription Revenue ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Subscription Revenue
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-5">
            <p className="text-xs opacity-80">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold mt-1">₹{mrr.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-70 mt-1">MRR</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl p-5">
            <p className="text-xs opacity-80">Annual Run Rate</p>
            <p className="text-3xl font-bold mt-1">₹{arr.toLocaleString('en-IN')}</p>
            <p className="text-xs opacity-70 mt-1">ARR</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">Active Subscriptions</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{activeSubs.length}</p>
            <p className="text-xs text-slate-400 mt-1">
              Monthly: {monthlySubs} · Yearly: {yearlySubs}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">Total Collected (All Time)</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              ₹{totalCollected.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* ── NEW: Credit Revenue ── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          💳 Credit Revenue
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-xl p-5">
            <p className="text-xs opacity-80">Credit Revenue (This Month)</p>
            <p className="text-3xl font-bold mt-1">
              ₹{creditRevenueMonth.toLocaleString('en-IN')}
            </p>
            <p className="text-xs opacity-70 mt-1">
              {creditPacksMonth} packs sold
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">Credit Revenue (All Time)</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              ₹{creditRevenueAllTime.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {creditPurchasesAllTime[0]?.count ?? 0} total packs
            </p>
          </div>
          {creditUsageByChannel.map((c: any) => (
            <div
              key={c._id}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <p className="text-xs text-slate-500 capitalize">
                {channelIcons[c._id] ?? '📨'} {c._id} (30d)
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {c.count.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {c.credits} credits used
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by plan */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          Revenue by Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(byPlan).map(([plan, data]) => {
            const planConfig = PLANS[plan as PlanId]
            return (
              <div
                key={plan}
                className={`rounded-xl border-2 ${
                  planColors[plan] || 'border-slate-200'
                } p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 capitalize">
                    {planConfig?.name || plan}
                  </span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {data.count} schools
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ₹{data.revenue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-500">Monthly revenue</p>
              </div>
            )
          })}
        </div>
        {Object.keys(byPlan).length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            No active subscriptions yet
          </p>
        )}
      </div>
    </div>
  )
}