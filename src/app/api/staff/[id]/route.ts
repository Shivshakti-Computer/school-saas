// FILE: src/app/api/staff/[id]/route.ts
// Single staff: Get, Update, Delete (soft)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Staff } from '@/models/Staff'
import { logDataChange } from '@/lib/audit'
import { getClientInfo, sanitizeBody } from '@/lib/security'
import bcrypt from 'bcryptjs'

// ── GET: Single staff detail ──
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'superadmin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const staff = await Staff.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    }).lean()

    if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Get linked user info (for login status)
    const user = await User.findById((staff as any).userId)
        .select('name phone email role isActive lastLogin allowedModules')
        .lean()

    return NextResponse.json({ staff, user })
}

// ── PUT: Update staff ──
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
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

    const staff = await Staff.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Store previous data for audit
    const previousData = staff.toObject()

    // ── Update allowed fields ──
    const updatableFields = [
        'firstName', 'lastName', 'gender', 'dateOfBirth', 'bloodGroup',
        'maritalStatus', 'nationality', 'religion', 'category', 'motherTongue', 'photo',
        'alternatePhone', 'email', 'personalEmail',
        'currentAddress', 'permanentAddress', 'city', 'state', 'pincode',
        'staffCategory', 'designation', 'department', 'qualification',
        'specialization', 'experience', 'previousSchool',
        'joiningDate', 'confirmationDate', 'probationEndDate',
        'subjects', 'classes', 'sections', 'isClassTeacher', 'classTeacherOf',
        'allowedModules',
        'salaryGrade', 'basicSalary', 'allowances', 'deductions',
        'bankName', 'bankBranch', 'accountNumber', 'ifscCode',
        'panNumber', 'pfNumber', 'esiNumber', 'uanNumber',
        'aadharNumber', 'voterIdNumber',
        'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone',
        'status', 'statusReason', 'relievingDate', 'exitRemarks',
        'leaveBalance',
    ]

    for (const field of updatableFields) {
        if (body[field] !== undefined) {
            (staff as any)[field] = body[field]
        }
    }

    // Update fullName if name changed
    if (body.firstName !== undefined || body.lastName !== undefined) {
        staff.fullName = `${staff.firstName} ${staff.lastName || ''}`.trim()
    }

    await staff.save()

    // ── Sync User record ──
    const userUpdate: any = {}

    if (body.firstName !== undefined || body.lastName !== undefined) {
        userUpdate.name = staff.fullName
    }
    if (body.email !== undefined) {
        userUpdate.email = body.email
    }
    if (body.subjects !== undefined) {
        userUpdate.subjects = body.subjects
    }
    if (body.classTeacherOf !== undefined) {
        userUpdate.class = body.classTeacherOf?.class || ''
        userUpdate.section = body.classTeacherOf?.section || ''
    }
    if (body.allowedModules !== undefined) {
        userUpdate.allowedModules = body.allowedModules
    }
    if (body.status !== undefined) {
        // If staff status changes, sync User isActive
        userUpdate.isActive = ['active', 'on_leave'].includes(body.status)
    }

    // Password change
    if (body.newPassword) {
        userUpdate.password = await bcrypt.hash(body.newPassword, 10)
    }

    if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(staff.userId, userUpdate)
    }

    // ── Audit ──
    await logDataChange(
        'UPDATE',
        'Staff',
        id,
        `Updated staff: ${staff.fullName} (${staff.employeeId})`,
        session,
        clientInfo.ip,
        previousData,
        body
    )

    return NextResponse.json({
        staff: staff.toObject(),
        message: `Staff "${staff.fullName}" updated successfully`,
    })
}

// ── DELETE: Soft delete (set status to terminated) ──
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const clientInfo = getClientInfo(req)

    const staff = await Staff.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Soft delete — mark as terminated
    staff.status = 'terminated'
    staff.statusReason = 'Removed by admin'
    staff.relievingDate = new Date()
    await staff.save()

    // Deactivate user account
    await User.findByIdAndUpdate(staff.userId, { isActive: false })

    // Audit
    await logDataChange(
        'DELETE',
        'Staff',
        id,
        `Terminated staff: ${staff.fullName} (${staff.employeeId})`,
        session,
        clientInfo.ip
    )

    return NextResponse.json({
        message: `Staff "${staff.fullName}" has been deactivated`,
    })
}