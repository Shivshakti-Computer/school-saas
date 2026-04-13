// FILE: src/app/api/notices/[id]/mark-read/route.ts
// Track notice read receipt
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { NoticeRead } from '@/models/NoticeRead'

// ✅ FIXED: params is now a Promise in Next.js 15
interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  const guard = await apiGuard(req, {
    allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
    rateLimit: 'api',
  })

  if (guard instanceof NextResponse) return guard
  const { session } = guard

  try {
    await connectDB()

    // ✅ FIXED: Await params
    const { id } = await context.params

    // ── Check if notice exists ──
    const notice = await Notice.findOne({
      _id: id,
      tenantId: session.user.tenantId,
      isActive: true,
      status: 'published',
    })

    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      )
    }

    // ── Check if already read (upsert) ──
    const readRecord = await NoticeRead.findOneAndUpdate(
      {
        noticeId: id,
        userId: session.user.id,
      },
      {
        noticeId: id,
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        tenantId: session.user.tenantId,
        readAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    )

    // ── Update notice read count ──
    const totalReads = await NoticeRead.countDocuments({
      noticeId: id,
    })

    await Notice.findByIdAndUpdate(id, {
      readCount: totalReads,
    })

    return NextResponse.json({
      success: true,
      readAt: readRecord.readAt,
    })

  } catch (err: any) {
    console.error('Mark read error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}