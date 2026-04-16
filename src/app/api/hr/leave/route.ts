// ═══════════════════════════════════════════════════════════
// POST /api/hr/leave — Leave deduction
// GET  /api/hr/leave — Leave history (future)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody, apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Staff } from '@/models/Staff'
import { getModuleSettings } from '@/lib/getModuleSettings'
import { logAudit } from '@/lib/audit'

type LeaveType = 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'unpaid'

const LEAVE_LABELS: Record<LeaveType, string> = {
    casual: 'Casual Leave',
    sick: 'Sick Leave',
    earned: 'Earned Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    unpaid: 'Leave Without Pay',
}

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        staffId: string
        leaveType: LeaveType
        days: number
        reason?: string
        fromDate?: string
        toDate?: string
        action: 'deduct' | 'credit'  // deduct = leave lena, credit = add back
    }>(req, {
        allowedRoles: ['admin'],
        requiredModules: ['hr'],
        rateLimit: 'mutation',
        auditAction: 'UPDATE',
        auditResource: 'Staff',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId

    // Validate
    if (!body.staffId) {
        return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const validLeaveTypes: LeaveType[] = [
        'casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid',
    ]
    if (!validLeaveTypes.includes(body.leaveType)) {
        return NextResponse.json({ error: 'Invalid leave type' }, { status: 400 })
    }

    const days = Number(body.days)
    if (!days || days < 0.5 || days > 365) {
        return NextResponse.json(
            { error: 'Days must be between 0.5 and 365' },
            { status: 400 }
        )
    }

    const action = body.action || 'deduct'

    try {
        await connectDB()

        const staff = await Staff.findOne({ _id: body.staffId, tenantId })
        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        const currentBalance =
            staff.leaveBalance[body.leaveType as keyof typeof staff.leaveBalance] ?? 0

        // Check balance for deduction (not for unpaid leave)
        if (action === 'deduct' && body.leaveType !== 'unpaid') {
            if (currentBalance < days) {
                return NextResponse.json(
                    {
                        error: `Insufficient ${LEAVE_LABELS[body.leaveType]} balance. Available: ${currentBalance} days`,
                        availableBalance: currentBalance,
                    },
                    { status: 400 }
                )
            }
        }

        // Apply leave change
        const increment = action === 'deduct' ? -days : days

        const updated = await Staff.findByIdAndUpdate(
            body.staffId,
            { $inc: { [`leaveBalance.${body.leaveType}`]: increment } },
            { new: true }
        )

        const newBalance =
            updated?.leaveBalance[body.leaveType as keyof typeof updated.leaveBalance] ?? 0

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Staff',
            resourceId: body.staffId,
            description: `Leave ${action}ed: ${staff.fullName} — ${days} days ${LEAVE_LABELS[body.leaveType]} (${action === 'deduct' ? 'Deducted' : 'Credited'})`,
            newData: {
                leaveType: body.leaveType,
                days,
                action,
                previousBalance: currentBalance,
                newBalance,
                reason: body.reason,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            staffId: body.staffId,
            staffName: staff.fullName,
            leaveType: body.leaveType,
            leaveLabel: LEAVE_LABELS[body.leaveType],
            days,
            action,
            previousBalance: currentBalance,
            remainingBalance: newBalance,
            message: `${days} day(s) ${LEAVE_LABELS[body.leaveType]} ${action === 'deduct' ? 'deducted' : 'credited'} for ${staff.fullName}`,
        })

    } catch (error: any) {
        console.error('[POST /api/hr/leave]', error)
        return NextResponse.json(
            { error: 'Failed to process leave' },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        requiredModules: ['hr'],
        rateLimit: 'read',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const tenantId = session.user.tenantId
    const { searchParams } = req.nextUrl
    const staffId = searchParams.get('staffId')

    try {
        await connectDB()

        const filter: Record<string, any> = { tenantId, status: 'active' }
        if (staffId) filter._id = staffId

        const staff = await Staff.find(filter)
            .populate('userId', 'name')
            .select('employeeId fullName designation department leaveBalance status')
            .sort({ employeeId: 1 })
            .lean()

        // Get HR settings for leave policy
        const moduleSettings = await getModuleSettings(tenantId)
        const hrSettings = moduleSettings.hr

        return NextResponse.json({
            staff,
            leavePolicy: {
                casualLeavesPerYear: hrSettings?.casualLeavesPerYear ?? 12,
                sickLeavesPerYear: hrSettings?.sickLeavesPerYear ?? 10,
                earnedLeavesPerYear: hrSettings?.earnedLeavesPerYear ?? 15,
            },
        })

    } catch (error: any) {
        console.error('[GET /api/hr/leave]', error)
        return NextResponse.json(
            { error: 'Failed to fetch leave data' },
            { status: 500 }
        )
    }
}