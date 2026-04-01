// FILE: src/app/api/staff/route.ts
// Staff CRUD: List + Create (User + Staff record together)
// Only admin can manage staff

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Staff } from '@/models/Staff'
import { checkCanAddTeacher } from '@/lib/limitGuard'
import { logDataChange } from '@/lib/audit'
import { getClientInfo, sanitizeBody } from '@/lib/security'
import bcrypt from 'bcryptjs'

// ── GET: List all staff ──
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'superadmin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const tenantId = session.user.tenantId
    const url = req.nextUrl

    // Query params for filtering
    const status = url.searchParams.get('status')           // active, inactive, resigned, etc.
    const category = url.searchParams.get('category')       // teaching, non_teaching, admin, support
    const department = url.searchParams.get('department')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    const query: any = { tenantId }

    if (status) query.status = status
    if (category) query.staffCategory = category
    if (department) query.department = department
    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ]
    }

    const skip = (page - 1) * limit

    const [staffList, total] = await Promise.all([
        Staff.find(query)
            .select('-documents -accountNumber -panNumber -aadharNumber -ifscCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Staff.countDocuments(query),
    ])

    // Get counts by status for stats
    const [totalCount, activeCount, onLeaveCount, inactiveCount] = await Promise.all([
        Staff.countDocuments({ tenantId }),
        Staff.countDocuments({ tenantId, status: 'active' }),
        Staff.countDocuments({ tenantId, status: 'on_leave' }),
        Staff.countDocuments({ tenantId, status: { $in: ['inactive', 'resigned', 'terminated'] } }),
    ])

    // Get unique departments
    const departments = await Staff.distinct('department', { tenantId })

    return NextResponse.json({
        staff: staffList,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        stats: {
            total: totalCount,
            active: activeCount,
            onLeave: onLeaveCount,
            inactive: inactiveCount,
        },
        departments,
    })
}

// ── POST: Create new staff (User + Staff record) ──
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized — only admin can add staff' }, { status: 401 })
    }

    await connectDB()
    const tenantId = session.user.tenantId
    const clientInfo = getClientInfo(req)

    let body: any
    try {
        const raw = await req.json()
        body = sanitizeBody(raw)
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // ── Validation ──
    const {
        firstName, lastName, phone, email, gender, designation, department,
        qualification, staffCategory, joiningDate, basicSalary,
        currentAddress, emergencyContactName, emergencyContactPhone,
        password, allowedModules, role: staffRole,
        // Optional fields
        subjects, classes, sections, isClassTeacher, classTeacherOf,
        dateOfBirth, bloodGroup, maritalStatus, alternatePhone,
        personalEmail, permanentAddress, city, state, pincode,
        specialization, experience, previousSchool,
        salaryGrade, bankName, bankBranch, accountNumber, ifscCode,
        panNumber, aadharNumber, emergencyContactRelation,
        allowances, deductions,
    } = body

    if (!firstName || !phone || !gender || !designation || !department ||
        !qualification || !staffCategory || !joiningDate || !currentAddress ||
        !emergencyContactName || !emergencyContactPhone) {
        return NextResponse.json({
            error: 'Missing required fields: firstName, phone, gender, designation, department, qualification, staffCategory, joiningDate, currentAddress, emergencyContactName, emergencyContactPhone'
        }, { status: 400 })
    }

    // ── CHECK TEACHER LIMIT (staff counts toward teacher limit) ──
    const limitCheck = await checkCanAddTeacher(tenantId)
    if (!limitCheck.allowed) {
        return NextResponse.json({
            error: limitCheck.message,
            limitReached: true,
            current: limitCheck.current,
            limit: limitCheck.limit,
            plan: limitCheck.plan,
        }, { status: 403 })
    }

    // ── Check duplicate phone ──
    const existingUser = await User.findOne({ tenantId, phone })
    if (existingUser) {
        return NextResponse.json({ error: 'Phone number already registered in this school' }, { status: 409 })
    }

    // ── Generate Employee ID ──
    const lastStaff = await Staff.findOne({ tenantId })
        .sort({ createdAt: -1 })
        .select('employeeId')
        .lean() as any

    let empNumber = 1
    if (lastStaff?.employeeId) {
        const match = lastStaff.employeeId.match(/\d+/)
        if (match) empNumber = parseInt(match[0]) + 1
    }
    const employeeId = `EMP-${String(empNumber).padStart(4, '0')}`

    const fullName = `${firstName} ${lastName || ''}`.trim()

    // ── Determine User role ──
    // staffRole can be 'staff' or 'teacher'
    // 'staff' = uses staff RBAC (only allowed modules)
    // 'teacher' = traditional teacher role (uses moduleRegistry roles)
    const userRole = staffRole === 'teacher' ? 'teacher' : 'staff'

    // ── Create User Account ──
    const hashedPassword = await bcrypt.hash(password || phone, 10)

    const newUser = await User.create({
        tenantId,
        name: fullName,
        phone,
        email: email || undefined,
        role: userRole,
        password: hashedPassword,
        employeeId,
        subjects: subjects || [],
        class: classTeacherOf?.class || '',
        section: classTeacherOf?.section || '',
        allowedModules: allowedModules || [],
        isActive: true,
    })

    // ── Create Staff Record ──
    const newStaff = await Staff.create({
        tenantId,
        userId: newUser._id,
        employeeId,
        firstName,
        lastName: lastName || '',
        fullName,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        bloodGroup: bloodGroup || undefined,
        maritalStatus: maritalStatus || undefined,
        phone,
        alternatePhone: alternatePhone || undefined,
        email: email || undefined,
        personalEmail: personalEmail || undefined,
        currentAddress,
        permanentAddress: permanentAddress || undefined,
        city: city || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        staffCategory,
        designation,
        department,
        qualification,
        specialization: specialization || undefined,
        experience: experience || 0,
        previousSchool: previousSchool || undefined,
        joiningDate: new Date(joiningDate),
        subjects: subjects || [],
        classes: classes || [],
        sections: sections || [],
        isClassTeacher: isClassTeacher || false,
        classTeacherOf: classTeacherOf || undefined,
        allowedModules: allowedModules || [],
        salaryGrade: salaryGrade || undefined,
        basicSalary: basicSalary || 0,
        allowances: allowances || {},
        deductions: deductions || {},
        bankName: bankName || undefined,
        bankBranch: bankBranch || undefined,
        accountNumber: accountNumber || undefined,
        ifscCode: ifscCode || undefined,
        panNumber: panNumber || undefined,
        aadharNumber: aadharNumber || undefined,
        emergencyContactName,
        emergencyContactRelation: emergencyContactRelation || undefined,
        emergencyContactPhone,
        status: 'active',
    })

    // ── Audit Log ──
    await logDataChange(
        'CREATE',
        'Staff',
        newStaff._id.toString(),
        `Created staff: ${fullName} (${employeeId}) as ${userRole}`,
        session,
        clientInfo.ip
    )

    return NextResponse.json({
        staff: newStaff,
        user: {
            _id: newUser._id,
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            employeeId: newUser.employeeId,
        },
        message: `Staff member "${fullName}" created successfully. Login: Phone ${phone}, Password: ${password ? '(custom)' : phone}`,
    }, { status: 201 })
}