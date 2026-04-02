// FILE: src/app/(dashboard)/admin/page.tsx
// UPDATED: creditBalance + addonLimits added to getDashboardData
// BACKWARD COMPATIBLE
// ═══════════════════════════════════════════════════════════

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { Fee } from '@/models/Fee'
import { Attendance } from '@/models/Attendance'
import { Notice } from '@/models/Notice'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { PLANS } from '@/config/pricing'
import type { PlanId } from '@/config/pricing'
import { AdminDashboardClient } from './DashboardClient'
import { Types } from 'mongoose'

async function getDashboardData(tenantId: string) {
  await connectDB()

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalStudents,
    totalTeachers,
    todayPresent,
    todayAbsent,
    totalStudentsForAttendance,
    pendingFees,
    paidFeesThisMonth,
    totalFeeCollected,
    activeNotices,
    recentStudents,
    recentFees,
    recentNotices,
    school,
    activeSub,
    last7DaysAttendance,
    classWiseStudents,
    // ── NEW: Credit data ──
    creditRecord,
    last30DaysMsgUsage,
  ] = await Promise.all([
    Student.countDocuments({ tenantId, status: 'active' }),
    User.countDocuments({ tenantId, role: { $in: ['teacher', 'staff'] }, isActive: true }),
    Attendance.countDocuments({ tenantId, date: today, status: 'present' }),
    Attendance.countDocuments({ tenantId, date: today, status: 'absent' }),
    Attendance.countDocuments({ tenantId, date: today }),
    Fee.countDocuments({ tenantId, status: 'pending' }),
    Fee.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Fee.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Notice.countDocuments({ tenantId, isActive: true }),
    Student.find({ tenantId, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .select('admissionNo class section createdAt userId')
      .lean(),
    Fee.find({ tenantId, status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(5)
      .populate({
        path: 'studentId',
        select: 'admissionNo',
        populate: { path: 'userId', select: 'name' },
      })
      .select('amount paidAt studentId')
      .lean(),
    Notice.find({ tenantId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title createdAt')
      .lean(),
    School.findById(tenantId)
      .select('name plan trialEndsAt subscriptionId modules createdAt creditBalance addonLimits')
      .lean(),
    Subscription.findOne({
      tenantId,
      status: { $in: ['active', 'scheduled_cancel'] },
    })
      .sort({ createdAt: -1 })
      .lean(),

    // Last 7 days attendance
    (async () => {
      const days: Array<{
        date: string
        present: number
        absent: number
        total: number
      }> = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const [present, absent] = await Promise.all([
          Attendance.countDocuments({ tenantId, date: dateStr, status: 'present' }),
          Attendance.countDocuments({ tenantId, date: dateStr, status: 'absent' }),
        ])
        days.push({ date: dateStr, present, absent, total: present + absent })
      }
      return days
    })(),

    // Class-wise students
    Student.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), status: 'active' } },
      { $group: { _id: '$class', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // ── NEW: Credit balance ──
    MessageCredit.findOne({ tenantId }).lean(),

    // ── NEW: Last 30 days message usage by channel ──
    CreditTransaction.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          type: 'message_deduct',
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
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

  const attendancePct =
    totalStudentsForAttendance > 0
      ? Math.round((todayPresent / totalStudentsForAttendance) * 100)
      : 0

  const feeThisMonth = paidFeesThisMonth[0]?.total || 0
  const feeTotal = totalFeeCollected[0]?.total || 0

  // Subscription info
  const schoolData = school as any
  const subData = activeSub as any
  const trialEnd = schoolData?.trialEndsAt
    ? new Date(schoolData.trialEndsAt)
    : null
  const isPaid = Boolean(subData)
  const isInTrial = !isPaid && trialEnd && trialEnd > now
  const isExpired = !isInTrial && !isPaid
  const daysLeft = trialEnd
    ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
    : 0

  // ── Credit info ──
  const credit = creditRecord as any
  const planConfig = PLANS[schoolData?.plan as PlanId] ?? PLANS.starter
  const extraStudents = schoolData?.addonLimits?.extraStudents ?? 0
  const extraTeachers = schoolData?.addonLimits?.extraTeachers ?? 0

  const effectiveStudentLimit = isInTrial
    ? 100
    : planConfig.maxStudents === -1
      ? -1
      : planConfig.maxStudents + extraStudents

  const effectiveTeacherLimit = isInTrial
    ? 10
    : planConfig.maxTeachers === -1
      ? -1
      : planConfig.maxTeachers + extraTeachers

  return {
    stats: {
      totalStudents,
      totalTeachers,
      todayPresent,
      todayAbsent,
      attendancePct,
      pendingFees,
      feeThisMonth,
      feeTotal,
      activeNotices,
    },
    recentStudents: JSON.parse(JSON.stringify(recentStudents)),
    recentFees: JSON.parse(JSON.stringify(recentFees)),
    recentNotices: JSON.parse(JSON.stringify(recentNotices)),
    attendanceChart: JSON.parse(JSON.stringify(last7DaysAttendance)),
    classWise: JSON.parse(JSON.stringify(classWiseStudents)),
    subscription: {
      plan: schoolData?.plan || 'starter',
      isPaid: Boolean(isPaid),
      isInTrial: Boolean(isInTrial),
      isExpired: Boolean(isExpired),
      daysLeft: isInTrial ? daysLeft : null,
      validTill:
        isPaid && subData?.currentPeriodEnd
          ? new Date(subData.currentPeriodEnd).toLocaleDateString('en-IN')
          : trialEnd?.toLocaleDateString('en-IN') || '',
      isScheduledCancel: subData?.status === 'scheduled_cancel',
    },
    // ── NEW: Credits ──
    credits: {
      balance: credit?.balance ?? schoolData?.creditBalance ?? 0,
      totalUsed: credit?.totalUsed ?? 0,
      totalEarned: credit?.totalEarned ?? 0,
      freePerMonth: isInTrial ? 0 : planConfig.freeCreditsPerMonth,
      lowWarning: (credit?.balance ?? 0) < 100,
      last30Days: JSON.parse(JSON.stringify(last30DaysMsgUsage)),
    },
    // ── NEW: Limits with add-ons ──
    limits: {
      students: {
        used: totalStudents,
        limit: effectiveStudentLimit,
        planLimit: isInTrial ? 100 : planConfig.maxStudents,
        addon: extraStudents,
      },
      teachers: {
        used: totalTeachers,
        limit: effectiveTeacherLimit,
        planLimit: isInTrial ? 10 : planConfig.maxTeachers,
        addon: extraTeachers,
      },
    },
    schoolName: schoolData?.name || '',
    schoolCreatedAt: schoolData?.createdAt
      ? new Date(schoolData.createdAt).toLocaleDateString('en-IN')
      : '',
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/login')

  const data = await getDashboardData(session.user.tenantId)
  const userName = session.user.name?.split(' ')[0] || 'Admin'

  return <AdminDashboardClient data={data} userName={userName} />
}