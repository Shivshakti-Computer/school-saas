// FILE: src/app/api/students/route.ts
// FIXED: Search by name via User populate

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { FeeStructure } from '@/models/FeeStructure'
import { Fee } from '@/models/Fee'
import { checkCanAddStudent } from '@/lib/limitGuard'
import {
    generateAdmissionNo,
    generateRollNo,
    getCurrentAcademicYear,
} from '@/lib/admissionUtils'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl

    const cls          = searchParams.get('class')
    const section      = searchParams.get('section')
    const status       = searchParams.get('status') || 'active'
    const search       = searchParams.get('search')
    const academicYear = searchParams.get('academicYear')
    const gender       = searchParams.get('gender')
    const category     = searchParams.get('category')
    const page         = parseInt(searchParams.get('page')  || '1')
    const limit        = parseInt(searchParams.get('limit') || '20')

    // Build student query
    const query: Record<string, any> = { 
        tenantId: session.user.tenantId 
    }
    
    if (cls)          query.class        = cls
    if (section)      query.section      = section
    if (status)       query.status       = status
    if (academicYear) query.academicYear = academicYear
    if (gender)       query.gender       = gender
    if (category)     query.category     = category

    // Name search — pehle User me search karo
    if (search) {
        // Search by admissionNo, fatherName, parentPhone
        const directSearch = [
            { admissionNo:  { $regex: search, $options: 'i' } },
            { fatherName:   { $regex: search, $options: 'i' } },
            { parentPhone:  { $regex: search, $options: 'i' } },
            { rollNo:       { $regex: search, $options: 'i' } },
        ]

        // Also search by user name
        const matchedUsers = await User.find({
            tenantId: session.user.tenantId,
            role: 'student',
            name: { $regex: search, $options: 'i' },
        }).select('_id').lean()

        const userIds = matchedUsers.map(u => u._id)

        query.$or = [
            ...directSearch,
            ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
        ]
    }

    const [students, total] = await Promise.all([
        Student.find(query)
            .populate('userId', 'name phone email')
            .sort({ class: 1, section: 1, rollNo: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Student.countDocuments(query),
    ])

    const currentYear = getCurrentAcademicYear()

    return NextResponse.json({
        students,
        total,
        page,
        pages: Math.ceil(total / limit),
        currentYear,
    })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Check student limit
    const limitCheck = await checkCanAddStudent(session.user.tenantId)
    if (!limitCheck.allowed) {
        return NextResponse.json({
            error: limitCheck.message,
            limitReached: true,
            current: limitCheck.current,
            limit: limitCheck.limit,
        }, { status: 403 })
    }

    const body = await req.json()

    // Validate required fields
    const required = [
        'name', 'phone', 'class', 'section',
        'fatherName', 'parentPhone', 'address',
        'dateOfBirth', 'gender', 'admissionDate',
    ]
    for (const field of required) {
        if (!body[field]?.toString().trim()) {
            return NextResponse.json(
                { error: `${field} is required` },
                { status: 400 }
            )
        }
    }

    // Duplicate phone check
    const existing = await User.findOne({
        tenantId: session.user.tenantId,
        phone: body.phone,
    })
    if (existing) {
        return NextResponse.json(
            { error: 'Is phone number se pehle se account registered hai' },
            { status: 409 }
        )
    }

    // Get school for admission number
    const school = await School.findById(session.user.tenantId)
        .select('subdomain')
        .lean() as any

    const subdomain    = school?.subdomain || 'SCH'
    const academicYear = body.academicYear || getCurrentAcademicYear()

    // Generate admission & roll numbers
    const [admissionNo, rollNo] = await Promise.all([
        generateAdmissionNo(
            session.user.tenantId,
            subdomain,
            academicYear
        ),
        generateRollNo(
            session.user.tenantId,
            body.class,
            body.section,
            academicYear
        ),
    ])

    // Create User account
    const hashedPwd = await bcrypt.hash(body.parentPhone, 10)
    const user = await User.create({
        tenantId: session.user.tenantId,
        name:     body.name.trim(),
        phone:    body.phone.trim(),
        email:    body.email?.trim() || undefined,
        role:     'student',
        password: hashedPwd,
        class:    body.class,
        section:  body.section,
        isActive: true,
    })

    // Create Student record
    const student = await Student.create({
        tenantId:  session.user.tenantId,
        userId:    user._id,
        admissionNo,
        rollNo,
        academicYear,
        admissionDate:  new Date(body.admissionDate),
        admissionClass: body.class,

        class:   body.class,
        section: body.section,

        dateOfBirth: new Date(body.dateOfBirth),
        gender:      body.gender,
        bloodGroup:  body.bloodGroup  || '',
        nationality: body.nationality || 'Indian',
        religion:    body.religion    || '',
        category:    body.category    || 'general',

        fatherName:       body.fatherName.trim(),
        fatherOccupation: body.fatherOccupation || '',
        fatherPhone:      body.fatherPhone       || '',
        motherName:       body.motherName        || '',
        motherOccupation: body.motherOccupation  || '',
        motherPhone:      body.motherPhone       || '',
        parentPhone:      body.parentPhone.trim(),
        parentEmail:      body.parentEmail       || '',

        address: body.address.trim(),
        city:    body.city    || '',
        state:   body.state   || '',
        pincode: body.pincode || '',

        emergencyContact: body.emergencyContact || '',
        emergencyName:    body.emergencyName    || '',

        previousSchool: body.previousSchool || '',
        previousClass:  body.previousClass  || '',
        tcNumber:       body.tcNumber       || '',

        sessionHistory: [{
            academicYear,
            class:   body.class,
            section: body.section,
            rollNo,
        }],

        status: 'active',
    })

    // Auto-assign fee structures (non-blocking)
    ;(async () => {
        try {
            const structures = await FeeStructure.find({
                tenantId:   session.user.tenantId,
                isActive:   true,
                autoAssign: true,
                $or: [
                    { class: 'all' },
                    { class: body.class },
                    // Comma-separated classes: "9,10,11"
                    { class: { $regex: `(^|,)\\s*${body.class}\\s*(,|$)` } },
                ],
                academicYear,
            })

            for (const struct of structures) {
                await Fee.create({
                    tenantId:    session.user.tenantId,
                    studentId:   student._id,
                    structureId: struct._id,
                    amount:      struct.totalAmount,
                    discount:    0,
                    lateFine:    0,
                    finalAmount: struct.totalAmount,
                    dueDate:     struct.dueDate,
                    status:      'pending',
                    paidAmount:  0,
                    academicYear,
                })
            }
        } catch (e) {
            console.error('[Fee Auto-Assign Error]', e)
        }
    })()

    // Create Parent account (non-blocking)
    ;(async () => {
        try {
            const existingParent = await User.findOne({
                tenantId: session.user.tenantId,
                phone:    body.parentPhone,
                role:     'parent',
            })

            if (!existingParent) {
                const parentPwd = await bcrypt.hash(body.parentPhone, 10)
                await User.create({
                    tenantId:   session.user.tenantId,
                    name:       `${body.fatherName} (Parent)`,
                    phone:      body.parentPhone.trim(),
                    role:       'parent',
                    password:   parentPwd,
                    studentRef: student._id,
                    isActive:   true,
                })
            }
        } catch (e) {
            console.error('[Parent Creation Error]', e)
        }
    })()

    return NextResponse.json({
        student,
        admissionNo,
        rollNo,
        academicYear,
        limits: {
            current:   limitCheck.current + 1,
            limit:     limitCheck.limit,
            remaining: limitCheck.isUnlimited 
                ? -1 
                : Math.max(0, limitCheck.remaining - 1),
        },
    }, { status: 201 })
}