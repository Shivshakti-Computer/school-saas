import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { logAudit } from '@/lib/audit'
import { LibraryBook, LibraryIssue } from '@/models/Library'

// ─────────────────────────────────────────────
// POST /api/library/issues/[id]/return
// Body: { finePerDay?, markLost?, finePaid? }
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ✅ Promise type
) {
    const guard = await apiGuardWithBody<{
        finePerDay?: number
        markLost?: boolean
        finePaid?: boolean
        notes?: string
    }>(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['library'],
        rateLimit: 'mutation',
        auditAction: 'UPDATE',
        auditResource: 'Library',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const { id: issueId } = await params  // ✅ await params

    if (!issueId) {
        return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 })
    }

    await connectDB()

    try {
        const issue = await LibraryIssue.findOne({
            _id: issueId,
            tenantId: session.user.tenantId,
        })

        if (!issue) {
            return NextResponse.json({ error: 'Issue record not found' }, { status: 404 })
        }
        if (issue.status === 'returned') {
            return NextResponse.json({ error: 'Book already returned' }, { status: 400 })
        }

        const now = new Date()
        const newStatus = body.markLost ? 'lost' : 'returned'

        // ── Fine calculation ──
        let fine = 0
        let daysLate = 0

        if (!body.markLost) {
            const dueDate = new Date(issue.dueDate)
            if (now > dueDate) {
                daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                const fpd = body.finePerDay ?? issue.finePerDay ?? 2
                fine = daysLate * fpd
            }
        }

        // Lost book — fixed fine (replace cost — simplified to 100)
        if (body.markLost) {
            fine = 100  // Admin can adjust — we log it
        }

        // Update issue
        const updatedIssue = await LibraryIssue.findByIdAndUpdate(
            issueId,
            {
                $set: {
                    status: newStatus,
                    returnedAt: now,
                    returnedBy: session.user.id,
                    fine,
                    finePaid: body.finePaid ?? fine === 0,
                    finePaidAt: body.finePaid ? now : undefined,
                    notes: body.notes?.trim() ?? issue.notes,
                },
            },
            { new: true }
        )

        // Return copy to available (only if not lost)
        if (!body.markLost) {
            await LibraryBook.findByIdAndUpdate(
                issue.bookId,
                { $inc: { availableCopies: 1 } }
            )
        }

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Library',
            resourceId: issueId,
            description: body.markLost
                ? `Book marked as LOST — issue ${issueId}, fine ₹${fine}`
                : `Book returned — issue ${issueId}, ${daysLate} days late, fine ₹${fine}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({
            success: true,
            issue: updatedIssue,
            fine,
            daysLate,
            status: newStatus,
            message: body.markLost
                ? `Book marked as lost. Fine: ₹${fine}`
                : fine > 0
                    ? `Book returned. Late fine: ₹${fine} (${daysLate} days)`
                    : 'Book returned successfully',
        })

    } catch (err: any) {
        console.error('[LIBRARY RETURN POST]', err)
        return NextResponse.json(
            { error: 'Failed to process return' },
            { status: 500 }
        )
    }
}