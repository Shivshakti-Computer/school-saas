import { connectDB } from '@/lib/db'
import { Subscription } from '@/models/Subscription'
import { School } from '@/models/School'
import { CreditCard } from 'lucide-react'

export default async function SubscriptionsPage() {
  await connectDB()

  const subscriptions = await Subscription.find({})
    .sort({ createdAt: -1 })
    .populate('tenantId', 'name subdomain')
    .lean() as any[]

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-slate-100 text-slate-700',
    paused: 'bg-amber-100 text-amber-700',
    created: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-sm text-slate-500">{subscriptions.length} total subscriptions</p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CreditCard size={32} className="mx-auto mb-3 opacity-40" />
          <p>No subscriptions yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium">School</th>
                  <th className="text-left px-3 py-3 font-medium">Plan</th>
                  <th className="text-left px-3 py-3 font-medium">Cycle</th>
                  <th className="text-left px-3 py-3 font-medium">Amount</th>
                  <th className="text-left px-3 py-3 font-medium">Status</th>
                  <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Period</th>
                  <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">Razorpay ID</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s: any) => (
                  <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{s.tenantId?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{s.tenantId?.subdomain || ''}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-semibold capitalize">{s.plan}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs capitalize">{s.billingCycle}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-semibold text-slate-800">₹{s.amount?.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[s.status] || 'bg-slate-100'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-500">
                        {new Date(s.currentPeriodStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {' — '}
                        {new Date(s.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-[11px] font-mono text-slate-400">{s.razorpaySubId}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}