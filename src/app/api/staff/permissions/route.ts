// FILE: src/app/api/staff/permissions/route.ts
// Quick endpoint to update staff module permissions
// Used by the permissions toggle UI

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Staff } from '@/models/Staff'
import { logDataChange } from '@/lib/audit'
import { getClientInfo, sanitizeBody } from '@/lib/security'
import { getStaffAssignableModules } from '@/lib/moduleRegistry'

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const clientInfo = getClientInfo(req)

    let body: any
    try {
        const raw = await req.json()
        body = sanitizeBody(raw)
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { staffId, allowedModules } = body

    if (!staffId || !Array.isArray(allowedModules)) {
        return NextResponse.json({
            error: 'staffId and allowedModules (array) are required'
        }, { status: 400 })
    }

    // Validate that modules are actually assignable
    const enabledModules = session.user.modules || []
    const plan = session.user.plan || 'starter'
    const assignable = getStaffAssignableModules(enabledModules, plan)
    const assignableKeys = assignable.map(m => m.key)

    const validModules = allowedModules.filter((m: string) => assignableKeys.includes(m as any))

    // Update Staff record
    const staff = await Staff.findOneAndUpdate(
        { _id: staffId, tenantId: session.user.tenantId },
        { allowedModules: validModules },
        { new: true }
    )

    if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Sync to User record
    await User.findByIdAndUpdate(staff.userId, {
        allowedModules: validModules,
    })

    // Audit
    await logDataChange(
        'UPDATE',
        'Staff',
        staffId,
        `Updated module permissions for ${staff.fullName}: [${validModules.join(', ')}]`,
        session,
        clientInfo.ip
    )

    return NextResponse.json({
        allowedModules: validModules,
        staffName: staff.fullName,
        message: `Permissions updated for ${staff.fullName}`,
    })
}

// GET: List assignable modules for current school/plan
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enabledModules = session.user.modules || []
    const plan = session.user.plan || 'starter'
    const assignable = getStaffAssignableModules(enabledModules, plan)

    return NextResponse.json({ modules: assignable })
}