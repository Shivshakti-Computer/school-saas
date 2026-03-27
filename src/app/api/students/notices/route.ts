// -------------------------------------------------------------
// FILE: src/app/api/student/notices/route.ts
// GET → student/parent ke liye notices
// -------------------------------------------------------------

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

 
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    await connectDB()
    const { Notice } = await import('@/models/Notice')
 
    const role = session.user.role
    const now  = new Date()
 
    const notices = await Notice.find({
      tenantId: session.user.tenantId,
      isActive: true,
      $or: [{ targetRole: 'all' }, { targetRole: role }],
    })
      .sort({ priority: -1, publishedAt: -1 })
      .limit(30)
      .lean()
 
    const active = notices.filter((n: any) => !n.expiresAt || new Date(n.expiresAt) >= now)
 
    return NextResponse.json({ notices: active })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}