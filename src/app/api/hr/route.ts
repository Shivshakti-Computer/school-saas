// ═══════════════════════════════════════════════════════════
// GET  /api/hr  — Staff list + stats
// POST /api/hr  — Add staff record
// PUT  /api/hr  — Update staff record
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Staff } from '@/models/Staff'
import '@/models/User'
import { logAudit } from '@/lib/audit'
import { getModuleSettings } from '@/lib/getModuleSettings'
import '@/models/User'

// ── Validation helpers ──
function validateStaffBody(body: any): string | null {
  if (!body.userId) return 'Teacher account is required'
  if (!body.employeeId?.trim()) return 'Employee ID is required'
  if (!body.firstName?.trim()) return 'First name is required'
  if (!body.lastName?.trim()) return 'Last name is required'
  if (!body.gender) return 'Gender is required'
  if (!body.phone?.trim()) return 'Phone is required'
  if (!body.currentAddress?.trim()) return 'Current address is required'
  if (!body.staffCategory) return 'Staff category is required'
  if (!body.designation?.trim()) return 'Designation is required'
  if (!body.department?.trim()) return 'Department is required'
  if (!body.qualification?.trim()) return 'Qualification is required'
  if (!body.joiningDate) return 'Joining date is required'
  if (!body.emergencyContactName?.trim()) return 'Emergency contact name is required'
  if (!body.emergencyContactPhone?.trim()) return 'Emergency contact phone is required'

  const salary = Number(body.basicSalary)
  if (isNaN(salary) || salary < 0) return 'Invalid salary amount'

  if (body.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(body.panNumber)) {
    return 'Invalid PAN number format'
  }

  if (body.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(body.ifscCode)) {
    return 'Invalid IFSC code format'
  }

  return null
}

// ─────────────────────────────────────────────────────────
// GET — Staff list with stats
// ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const guard = await apiGuard(req, {
    allowedRoles: ['admin', 'staff'],
    requiredModules: ['hr'],
    rateLimit: 'read',
  })
  if (guard instanceof NextResponse) return guard

  const { session } = guard
  const tenantId = session.user.tenantId
  const { searchParams } = req.nextUrl

  const status = searchParams.get('status')
  const department = searchParams.get('department')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    await connectDB()

    const filter: Record<string, any> = { tenantId }
    if (status) filter.status = status
    if (department) filter.department = department
    if (category) filter.staffCategory = category
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ]
    }

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .populate('userId', 'name email phone isActive')
        .sort({ employeeId: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Staff.countDocuments(filter),
    ])

    // Stats — always from full dataset (no filter)
    const allActive = await Staff.find({ tenantId, status: 'active' })
      .select('department staffCategory basicSalary grossSalary')
      .lean()

    const stats = {
      total: await Staff.countDocuments({ tenantId }),
      active: allActive.length,
      inactive: await Staff.countDocuments({ tenantId, status: 'inactive' }),
      onLeave: await Staff.countDocuments({ tenantId, status: 'on_leave' }),
      teaching: allActive.filter(s => s.staffCategory === 'teaching').length,
      nonTeaching: allActive.filter(s => s.staffCategory !== 'teaching').length,
      totalMonthlySalary: allActive.reduce(
        (sum, s) => sum + (s.grossSalary || s.basicSalary || 0), 0
      ),
      departments: [...new Set(allActive.map(s => s.department))].sort(),
    }

    return NextResponse.json({
      staff,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('[GET /api/hr]', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────
// POST — Add new staff record
// ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const guard = await apiGuardWithBody(req, {
    allowedRoles: ['admin'],
    requiredModules: ['hr'],
    rateLimit: 'mutation',
    auditAction: 'CREATE',
    auditResource: 'Staff',
  })
  if (guard instanceof NextResponse) return guard

  const { session, body, clientInfo } = guard
  const tenantId = session.user.tenantId

  const validationError = validateStaffBody(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    await connectDB()

    // Check employee ID unique in this school
    const existing = await Staff.findOne({
      tenantId,
      employeeId: body.employeeId.trim().toUpperCase(),
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      )
    }

    // Check user already has staff record
    const userExists = await Staff.findOne({ tenantId, userId: body.userId })
    if (userExists) {
      return NextResponse.json(
        { error: 'This user already has a staff record' },
        { status: 409 }
      )
    }

    // Get HR module settings for leave defaults
    const moduleSettings = await getModuleSettings(tenantId)
    const hrSettings = moduleSettings.hr

    // Calculate gross & net salary
    const basicSalary = Number(body.basicSalary) || 0
    const allowances = body.allowances || {}
    const deductions = body.deductions || {}

    const totalAllowances =
      (allowances.hra || 0) + (allowances.da || 0) + (allowances.ta || 0) +
      (allowances.medical || 0) + (allowances.special || 0) + (allowances.other || 0)

    // Auto-calculate PF from settings if enabled
    if (hrSettings?.pfEnabled && !deductions.pf) {
      deductions.pf = Math.round(basicSalary * (hrSettings.pfPercentage / 100))
    }
    if (hrSettings?.esiEnabled && !deductions.esi) {
      deductions.esi = Math.round(basicSalary * (hrSettings.esiPercentage / 100))
    }

    const totalDeductions =
      (deductions.pf || 0) + (deductions.esi || 0) +
      (deductions.professionalTax || 0) + (deductions.tds || 0) + (deductions.other || 0)

    const grossSalary = basicSalary + totalAllowances
    const netSalary = grossSalary - totalDeductions

    const staff = await Staff.create({
      tenantId,
      userId: body.userId,
      employeeId: body.employeeId.trim().toUpperCase(),
      firstName: body.firstName.trim(),
      lastName: body.lastName?.trim() || '',
      fullName: `${body.firstName.trim()} ${body.lastName?.trim() || ''}`.trim(),
      gender: body.gender,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      bloodGroup: body.bloodGroup || '',
      maritalStatus: body.maritalStatus || '',
      nationality: body.nationality || 'Indian',
      religion: body.religion || '',
      category: body.category || '',
      motherTongue: body.motherTongue || '',
      phone: body.phone.trim(),
      alternatePhone: body.alternatePhone?.trim(),
      email: body.email?.trim(),
      personalEmail: body.personalEmail?.trim(),
      currentAddress: body.currentAddress.trim(),
      permanentAddress: body.permanentAddress?.trim(),
      city: body.city?.trim(),
      state: body.state?.trim(),
      pincode: body.pincode?.trim(),
      staffCategory: body.staffCategory,
      designation: body.designation.trim(),
      department: body.department.trim(),
      qualification: body.qualification.trim(),
      specialization: body.specialization?.trim(),
      experience: Number(body.experience) || 0,
      previousSchool: body.previousSchool?.trim(),
      joiningDate: new Date(body.joiningDate),
      subjects: body.subjects || [],
      classes: body.classes || [],
      sections: body.sections || [],
      isClassTeacher: body.isClassTeacher || false,
      classTeacherOf: body.classTeacherOf,
      allowedModules: body.allowedModules || [],
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      bankName: body.bankName?.trim(),
      bankBranch: body.bankBranch?.trim(),
      accountNumber: body.accountNumber?.trim(),
      ifscCode: body.ifscCode?.trim().toUpperCase(),
      panNumber: body.panNumber?.trim().toUpperCase(),
      pfNumber: body.pfNumber?.trim(),
      esiNumber: body.esiNumber?.trim(),
      uanNumber: body.uanNumber?.trim(),
      aadharNumber: body.aadharNumber?.trim(),
      emergencyContactName: body.emergencyContactName.trim(),
      emergencyContactRelation: body.emergencyContactRelation?.trim(),
      emergencyContactPhone: body.emergencyContactPhone.trim(),
      // Leave balance from HR settings defaults
      leaveBalance: {
        casual: hrSettings?.casualLeavesPerYear ?? 12,
        sick: hrSettings?.sickLeavesPerYear ?? 10,
        earned: hrSettings?.earnedLeavesPerYear ?? 15,
        maternity: 0,
        paternity: 0,
        unpaid: 0,
      },
      status: 'active',
    })

    await logAudit({
      tenantId,
      userId: session.user.id,
      userName: session.user.name || 'Admin',
      userRole: session.user.role,
      action: 'CREATE',
      resource: 'Staff',
      resourceId: staff._id.toString(),
      description: `Staff record created: ${staff.fullName} (${staff.employeeId})`,
      newData: {
        employeeId: staff.employeeId,
        designation: staff.designation,
        department: staff.department,
        basicSalary: staff.basicSalary,
      },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    })

    return NextResponse.json({ staff }, { status: 201 })

  } catch (error: any) {
    console.error('[POST /api/hr]', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create staff record' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────
// PUT — Update staff record
// ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const guard = await apiGuardWithBody(req, {
    allowedRoles: ['admin'],
    requiredModules: ['hr'],
    rateLimit: 'mutation',
    auditAction: 'UPDATE',
    auditResource: 'Staff',
  })
  if (guard instanceof NextResponse) return guard

  const { session, body, clientInfo } = guard
  const tenantId = session.user.tenantId

  if (!body.id) {
    return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
  }

  try {
    await connectDB()

    const existing = await Staff.findOne({ _id: body.id, tenantId })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Recalculate salary if changed
    const updateData = { ...body }
    delete updateData.id
    delete updateData.tenantId

    if (
      updateData.basicSalary !== undefined ||
      updateData.allowances !== undefined ||
      updateData.deductions !== undefined
    ) {
      const basic = Number(updateData.basicSalary ?? existing.basicSalary) || 0
      const allowances = updateData.allowances ?? existing.allowances ?? {}
      const deductions = updateData.deductions ?? existing.deductions ?? {}

      const totalAllowances =
        (allowances.hra || 0) + (allowances.da || 0) + (allowances.ta || 0) +
        (allowances.medical || 0) + (allowances.special || 0) + (allowances.other || 0)

      const totalDeductions =
        (deductions.pf || 0) + (deductions.esi || 0) +
        (deductions.professionalTax || 0) + (deductions.tds || 0) + (deductions.other || 0)

      updateData.grossSalary = basic + totalAllowances
      updateData.netSalary = updateData.grossSalary - totalDeductions

      if (updateData.firstName || updateData.lastName) {
        const first = (updateData.firstName ?? existing.firstName).trim()
        const last = (updateData.lastName ?? existing.lastName ?? '').trim()
        updateData.fullName = `${first} ${last}`.trim()
      }
    }

    const staff = await Staff.findByIdAndUpdate(
      body.id,
      { $set: updateData },
      { new: true }
    ).populate('userId', 'name email phone')

    await logAudit({
      tenantId,
      userId: session.user.id,
      userName: session.user.name || 'Admin',
      userRole: session.user.role,
      action: 'UPDATE',
      resource: 'Staff',
      resourceId: body.id,
      description: `Staff record updated: ${existing.fullName} (${existing.employeeId})`,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    })

    return NextResponse.json({ staff })

  } catch (error: any) {
    console.error('[PUT /api/hr]', error)
    return NextResponse.json(
      { error: 'Failed to update staff record' },
      { status: 500 }
    )
  }
}