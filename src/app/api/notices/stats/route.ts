// FILE: src/app/api/notices/stats/route.ts
// Notice analytics
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { NoticeRead } from '@/models/NoticeRead'
import type { NoticeStats } from '@/types/notice'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff', 'student', 'parent'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const baseQuery = {
            tenantId: session.user.tenantId,
            isActive: true,
        }

        // ── Basic Stats ──
        const [total, published, draft, archived, pinned, urgent] = await Promise.all([
            Notice.countDocuments(baseQuery),
            Notice.countDocuments({ ...baseQuery, status: 'published' }),
            Notice.countDocuments({ ...baseQuery, status: 'draft' }),
            Notice.countDocuments({ ...baseQuery, status: 'archived' }),
            Notice.countDocuments({ ...baseQuery, isPinned: true }),
            Notice.countDocuments({ ...baseQuery, priority: 'urgent', status: 'published' }),
        ])

        const stats: NoticeStats = {
            total,
            published,
            draft,
            archived,
            pinned,
            urgent,
        }

        // ── User-Specific Stats (for non-admins) ──
        if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
            // Get notices user has access to
            const userQuery: any = {
                ...baseQuery,
                status: 'published',
                $or: [
                    { targetRole: 'all' },
                    { targetRole: session.user.role },
                ],
            }

            const userNotices = await Notice.find(userQuery).select('_id').lean()
            const noticeIds = userNotices.map(n => n._id)

            // Count unread
            const readNoticeIds = await NoticeRead.find({
                userId: session.user.id,
                noticeId: { $in: noticeIds },
            }).distinct('noticeId')

            stats.unreadCount = noticeIds.length - readNoticeIds.length
        }

        return NextResponse.json({ stats })

    } catch (err: any) {
        console.error('Notice stats error:', err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}