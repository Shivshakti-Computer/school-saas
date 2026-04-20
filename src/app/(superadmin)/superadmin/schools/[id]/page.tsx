// FILE: src/app/(superadmin)/superadmin/schools/[id]/page.tsx
// UPDATED: Credit balance + adjust + addon limits shown

import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { User } from '@/models/User'
import { Student } from '@/models/Student'
import { Subscription } from '@/models/Subscription'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Users, GraduationCap,
  Calendar, Globe, Zap, MessageSquare,
} from 'lucide-react'
import { SchoolDetailActions } from './SchoolDetailActions'
import { ExtendSubscriptionButton } from './ExtentSubscriptionButton'

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await connectDB()

  const school = await School.findById(id).lean() as any
  if (!school) return notFound()

  const [
    students,
    teachers,
    admins,
    subscription,
    creditRecord,
    last30DaysMsgs,
  ] = await Promise.all([
    Student.countDocuments({ tenantId: school._id, status: 'active' }),
    User.countDocuments({ tenantId: school._id, role: 'teacher', isActive: true }),
    User.find({ tenantId: school._id, role: 'admin', isActive: true })
      .select('name phone email lastLogin')
      .lean(),
    Subscription.findOne({ tenantId: school._id, status: 'active' })
      .sort({ createdAt: -1 })
      .lean(),
    MessageCredit.findOne({ tenantId: school._id }).lean(),
    CreditTransaction.aggregate([
      {
        $match: {
          tenantId: school._id,
          type: 'message_deduct',
          createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
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
  ])

  const activeSub = await Subscription.findOne({
    tenantId: id,
    status: 'active',
  }).lean() as any

  const now = new Date()
  const trialEnd = new Date(school.trialEndsAt)
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
  const isPaid = Boolean(subscription)
  const status = isPaid ? 'paid' : daysLeft > 0 ? 'trial' : 'expired'

  const creditBalance = (creditRecord as any)?.balance ?? school.creditBalance ?? 0
  const totalUsed = (creditRecord as any)?.totalUsed ?? 0
  const totalEarned = (creditRecord as any)?.totalEarned ?? 0

  const planColors: Record<string, string> = {
    starter: 'bg-slate-100 text-slate-700',
    growth: 'bg-indigo-100 text-indigo-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
  }

  const channelIcons: Record<string, string> = {
    sms: '📱', whatsapp: '💬', email: '📧',
  }

  return (
    <div className="space-y-6">
      <Link
        href="/superadmin/schools"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Schools
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
              {school.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{school.name}</h1>
              <p className="text-sm text-slate-500">
                Code:{' '}
                <span className="font-mono font-semibold">{school.subdomain}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${planColors[school.plan]
                }`}
            >
              {school.plan}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status === 'paid'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'trial'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-red-100 text-red-700'
                }`}
            >
              {status === 'paid'
                ? 'Paid'
                : status === 'trial'
                  ? `Trial (${daysLeft} days left)`
                  : 'Expired'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${school.isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
                }`}
            >
              {school.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <GraduationCap size={18} className="text-indigo-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{students}</p>
          <p className="text-xs text-slate-500">Active Students</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Users size={18} className="text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{teachers}</p>
          <p className="text-xs text-slate-500">Teachers</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Calendar size={18} className="text-amber-600 mb-2" />
          <p className="text-lg font-bold text-slate-900">
            {new Date(school.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
          <p className="text-xs text-slate-500">Registered On</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Globe size={18} className="text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">
            {school.modules?.length || 0}
          </p>
          <p className="text-xs text-slate-500">Enabled Modules</p>
        </div>
      </div>

      {/* ✅ ADD: Right after stats, before Credit Panel */}
      <ExtendSubscriptionButton
        tenantId={id}
        schoolSubdomain={school.subdomain}
        currentEnd={activeSub?.currentPeriodEnd}
      />

      {/* ── NEW: Credit Panel ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap size={14} className="text-indigo-600" />
          Message Credits
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div
            className={`rounded-xl p-4 text-center ${creditBalance < 50
              ? 'bg-red-50 border border-red-200'
              : 'bg-indigo-50 border border-indigo-100'
              }`}
          >
            <p
              className={`text-2xl font-bold ${creditBalance < 50 ? 'text-red-600' : 'text-indigo-600'
                }`}
            >
              {creditBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Balance</p>
            {creditBalance < 50 && (
              <p className="text-[10px] text-red-500 mt-0.5">⚠️ Low</p>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {totalEarned.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Earned</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {totalUsed.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Used</p>
          </div>
        </div>

        {/* Last 30 days channel usage */}
        {last30DaysMsgs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Last 30 days:</p>
            <div className="flex gap-3 flex-wrap">
              {last30DaysMsgs.map((u: any) => (
                <div
                  key={u._id}
                  className="bg-slate-50 rounded-lg px-3 py-2 text-xs"
                >
                  <span className="font-medium">
                    {channelIcons[u._id] ?? '📨'} {u.count} {u._id}
                  </span>
                  <span className="text-slate-400 ml-1">
                    ({u.credits} credits)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions — client component */}
        <SchoolDetailActions
          schoolId={id}
          schoolName={school.name}
          creditBalance={creditBalance}
          status={status}
          daysLeft={daysLeft}
          isActive={school.isActive}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            School Information
          </h3>
          <div className="space-y-3 text-sm">
            {([
              ['Phone', school.phone],
              ['Email', school.email],
              ['Address', school.address || 'Not set'],
              [
                'Trial Ends',
                new Date(school.trialEndsAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
              ],
              ['Subscription ID', school.subscriptionId || 'None'],
              [
                'Extra Students (addon)',
                school.addonLimits?.extraStudents ?? 0,
              ],
              [
                'Extra Teachers (addon)',
                school.addonLimits?.extraTeachers ?? 0,
              ],
            ] as [string, any][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-800 font-medium text-right">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Admin Users
          </h3>
          {(admins as any[]).length === 0 ? (
            <p className="text-sm text-slate-400">No admin users found</p>
          ) : (
            <div className="space-y-3">
              {(admins as any[]).map((a: any) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      {a.phone} · {a.email}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {a.lastLogin
                      ? `Last: ${new Date(a.lastLogin).toLocaleDateString('en-IN')}`
                      : 'Never logged in'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modules */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Enabled Modules
          </h3>
          <div className="flex flex-wrap gap-2">
            {(school.modules || []).map((m: string) => (
              <span
                key={m}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}