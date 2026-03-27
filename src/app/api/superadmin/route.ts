/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/superadmin/route.ts
   GET → all schools stats (only superadmin)
   ─────────────────────────────────────────────────────────── */
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
 
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
 
  await connectDB()
 
  const [
    totalSchools,
    activeSchools,
    trialSchools,
    paidSchools,
    schoolsByPlan,
  ] = await Promise.all([
    School.countDocuments({}),
    School.countDocuments({ isActive: true }),
    School.countDocuments({ isActive: true, subscriptionId: null, trialEndsAt: { $gte: new Date() } }),
    School.countDocuments({ isActive: true, subscriptionId: { $ne: null } }),
    School.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]),
  ])
 
  const recentSchools = await School.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name subdomain plan isActive trialEndsAt createdAt')
    .lean()
 
  return NextResponse.json({
    stats: { totalSchools, activeSchools, trialSchools, paidSchools, schoolsByPlan },
    recentSchools,
  })
}