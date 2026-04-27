// FILE: src/app/api/students/route.ts

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


// ─────────────────────────────────────────────
// Helper — Academy/Coaching Student Data Builder
// ─────────────────────────────────────────────
function buildAcademyCoachingData(
    body: any,
    userId: string,
    tenantId: string,
    admissionNo: string,
    academicYear: string,
) {
    return {
        tenantId,
        userId,
        admissionNo,
        // ✅ School fields blank — model mein optional hain
        rollNo: '',
        class: '',
        section: '',
        stream: '',
        academicYear,
        admissionDate: new Date(body.admissionDate || Date.now()),
        admissionClass: '',
        // ✅ Academy/Coaching fields
        currentBatch: body.currentBatch,
        currentCourse: body.currentCourse || null,
        enrollments: body.enrollments || [],
        // ✅ Personal fields — same as school
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        bloodGroup: body.bloodGroup || '',
        nationality: body.nationality || 'Indian',
        religion: body.religion || '',
        category: body.category || 'general',
        fatherName: body.fatherName.trim(),
        fatherOccupation: body.fatherOccupation || '',
        fatherPhone: body.fatherPhone || '',
        motherName: body.motherName || '',
        motherOccupation: body.motherOccupation || '',
        motherPhone: body.motherPhone || '',
        parentPhone: body.parentPhone.trim(),
        parentEmail: body.parentEmail || '',
        address: body.address?.trim() || 'Not provided',
        city: body.city || '',
        state: body.state || '',
        pincode: body.pincode || '',
        emergencyContact: body.emergencyContact || '',
        emergencyName: body.emergencyName || '',
        previousSchool: body.previousSchool || '',
        previousClass: body.previousClass || '',
        tcNumber: body.tcNumber || '',
        sessionHistory: [],
        status: 'active',
    }
}

// ─────────────────────────────────────────────
// Password Generator
//
// Phone wala student   → parentPhone
// No-phone student     → AdmissionNo + DOB (DDMMYYYY)
//   e.g. DPS202526000115052008
//
// Parent               → parentPhone
// ─────────────────────────────────────────────
function formatDOBPassword(dateOfBirth: string): string {
    const dob = new Date(dateOfBirth)
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = dob.getFullYear()
    return `${dd}${mm}${yyyy}`   // "15052008"
}


function buildStudentData(
    body: any,
    userId: string,
    tenantId: string,
    admissionNo: string,
    rollNo: string,
    academicYear: string,
) {
    return {
        tenantId,
        userId,
        admissionNo,
        rollNo,
        academicYear,
        admissionDate: new Date(body.admissionDate),
        admissionClass: body.class,
        class: body.class,
        section: body.section,
        stream: body.stream || '',
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        bloodGroup: body.bloodGroup || '',
        nationality: body.nationality || 'Indian',
        religion: body.religion || '',
        category: body.category || 'general',
        fatherName: body.fatherName.trim(),
        fatherOccupation: body.fatherOccupation || '',
        fatherPhone: body.fatherPhone || '',
        motherName: body.motherName || '',
        motherOccupation: body.motherOccupation || '',
        motherPhone: body.motherPhone || '',
        parentPhone: body.parentPhone.trim(),
        parentEmail: body.parentEmail || '',
        address: body.address?.trim() || 'Not provided',
        city: body.city || '',
        state: body.state || '',
        pincode: body.pincode || '',
        emergencyContact: body.emergencyContact || '',
        emergencyName: body.emergencyName || '',
        previousSchool: body.previousSchool || '',
        previousClass: body.previousClass || '',
        tcNumber: body.tcNumber || '',
        sessionHistory: [{
            academicYear,
            class: body.class,
            section: body.section,
            rollNo,
        }],
        status: 'active',
    }
}

/* ══════════════════════════════════════════════
   GET
   ══════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl

    const cls = searchParams.get('class')
    const section = searchParams.get('section')
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search')
    const academicYear = searchParams.get('academicYear')
    const gender = searchParams.get('gender')
    const category = searchParams.get('category')
    const stream = searchParams.get('stream')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: Record<string, any> = {
        tenantId: session.user.tenantId,
    }

    if (cls) query.class = cls
    if (section) query.section = section
    if (status) query.status = status
    if (academicYear) query.academicYear = academicYear
    if (gender) query.gender = gender
    if (category) query.category = category
    if (stream) query.stream = stream

    if (search) {
        const directSearch = [
            { admissionNo: { $regex: search, $options: 'i' } },
            { fatherName: { $regex: search, $options: 'i' } },
            { parentPhone: { $regex: search, $options: 'i' } },
            { rollNo: { $regex: search, $options: 'i' } },
        ]

        const matchedUsers = await User.find({
            tenantId: session.user.tenantId,
            role: 'student',
            name: { $regex: search, $options: 'i' },
        }).select('_id').lean()

        const userIds = matchedUsers.map(u => u._id)

        query.$or = [
            ...directSearch,
            ...(userIds.length > 0
                ? [{ userId: { $in: userIds } }]
                : []),
        ]
    }

    const [students, total] = await Promise.all([
        Student.find(query)
            .populate('userId', 'name phone email admissionNo')
            // ✅ ADD: Populate batch & course for academy/coaching
            .populate('currentBatch', 'batchCode batchName status')
            .populate('currentCourse', 'code name category')
            .sort({ class: 1, section: 1, rollNo: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Student.countDocuments(query),
    ])

    return NextResponse.json({
        students,
        total,
        page,
        pages: Math.ceil(total / limit),
        currentYear: getCurrentAcademicYear(),
    })
}

/* ══════════════════════════════════════════════
   POST — Create Student
   ══════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
    let session: any = null
    let limitCheck: any = null
    let studentUser: any = null

    try {
        session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        limitCheck = await checkCanAddStudent(session.user.tenantId)
        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: limitCheck.message,
                limitReached: true,
                current: limitCheck.current,
                limit: limitCheck.limit,
            }, { status: 403 })
        }

        const body = await req.json()

        // ✅ BACKWARD COMPATIBLE — Institution type check
        const school = await School.findById(session.user.tenantId)
            .select('institutionType subdomain').lean() as any

        const institutionType = school?.institutionType || 'school'
        const subdomain = school?.subdomain || 'SCH'

        // ── Required fields — conditional based on institution type ──
        let required: string[] = []

        if (institutionType === 'school') {
            // School validations — same as before
            required = [
                'name', 'class', 'section',
                'fatherName', 'parentPhone',
                'dateOfBirth', 'gender', 'admissionDate',
            ]
            for (const field of required) {
                if (!body[field]?.toString().trim()) {
                    return NextResponse.json(
                        { error: `${field} is required`, field },
                        { status: 400 }
                    )
                }
            }
            if (['11', '12'].includes(body.class) && !body.stream) {
                return NextResponse.json(
                    { error: 'Class 11/12 ke liye stream required hai', field: 'stream' },
                    { status: 400 }
                )
            }
        } else {
            // Academy/Coaching validations
            required = [
                'name', 'currentBatch',
                'fatherName', 'parentPhone',
                'dateOfBirth', 'gender',
            ]
            for (const field of required) {
                if (!body[field]?.toString().trim()) {
                    return NextResponse.json(
                        { error: `${field} is required`, field },
                        { status: 400 }
                    )
                }
            }
            if (institutionType === 'academy' && !body.currentCourse) {
                return NextResponse.json(
                    { error: 'Course selection required for academy', field: 'currentCourse' },
                    { status: 400 }
                )
            }
        }

        const parentPhone = body.parentPhone.trim()
        const studentPhone: string | null = body.phone?.trim() || null

        // ── Parent phone format ──
        if (!/^\d{10}$/.test(parentPhone)) {
            return NextResponse.json(
                { error: 'Parent phone 10 digits ka hona chahiye', field: 'parentPhone' },
                { status: 400 }
            )
        }

        // ── Student phone validations (optional) ──
        if (studentPhone) {
            if (!/^\d{10}$/.test(studentPhone)) {
                return NextResponse.json(
                    { error: 'Student phone 10 digits ka hona chahiye', field: 'phone' },
                    { status: 400 }
                )
            }
            if (studentPhone === parentPhone) {
                return NextResponse.json(
                    { error: 'Student phone aur parent phone alag hone chahiye', field: 'phone' },
                    { status: 400 }
                )
            }
            const phoneExists = await User.findOne({
                tenantId: session.user.tenantId,
                phone: studentPhone,
            })
            if (phoneExists) {
                return NextResponse.json(
                    { error: `Phone ${studentPhone} already registered hai`, field: 'phone' },
                    { status: 409 }
                )
            }
            const parentAsStudent = await User.findOne({
                tenantId: session.user.tenantId,
                phone: parentPhone,
                role: 'student',
            })
            if (parentAsStudent) {
                return NextResponse.json(
                    {
                        error: `Parent phone ${parentPhone} ek student account pe registered hai`,
                        field: 'parentPhone',
                    },
                    { status: 409 }
                )
            }
        }

        // ── Academic Year ──
        const academicYear = body.academicYear || getCurrentAcademicYear()

        // ── Generate Admission No (same for all types) ──
        const admissionNo = await generateAdmissionNo(
            session.user.tenantId, subdomain, academicYear
        )

        // ── Roll No — only for schools ──
        let rollNo = ''
        if (institutionType === 'school') {
            rollNo = await generateRollNo(
                session.user.tenantId, body.class, body.section, academicYear
            )
        }

        // ✅ Password = DOB (DDMMYYYY) — simple
        const dobPassword = formatDOBPassword(body.dateOfBirth)
        const hashedPwd = await bcrypt.hash(dobPassword, 10)

        // ── Create Student User ──
        try {
            studentUser = await User.create({
                tenantId: session.user.tenantId,
                name: body.name.trim(),
                phone: studentPhone || null,
                email: body.email?.trim() || null,
                role: 'student',
                password: hashedPwd,
                admissionNo,
                class: body.class,
                section: body.section,
                isActive: true,
            })
        } catch (userErr: any) {
            if (userErr.code === 11000) {
                return NextResponse.json(
                    { error: `Phone ${studentPhone} already registered hai`, field: 'phone' },
                    { status: 409 }
                )
            }
            throw userErr
        }

        // ── Create Student Record — conditional builder ──
        let student: any

        try {
            const studentData = institutionType === 'school'
                ? buildStudentData(
                    body, studentUser._id,
                    session.user.tenantId,
                    admissionNo, rollNo, academicYear,
                )
                : buildAcademyCoachingData(
                    body, studentUser._id,
                    session.user.tenantId,
                    admissionNo, academicYear,
                )

            student = await Student.create(studentData)
        } catch (studentErr: any) {
            if (studentUser?._id) {
                await User.findByIdAndDelete(studentUser._id)
            }

            if (studentErr.code === 11000 &&
                studentErr.message?.includes('admissionNo')) {

                const actualLast = await Student.findOne({
                    tenantId: session.user.tenantId, academicYear,
                })
                    .sort({ createdAt: -1 })
                    .select('admissionNo').lean() as any

                let retrySeq = 1
                if (actualLast?.admissionNo) {
                    const lastPart = actualLast.admissionNo.split('/').pop()
                    retrySeq = (parseInt(lastPart || '0') || 0) + 1
                }

                const schoolCode = subdomain.toUpperCase().slice(0, 3)
                const retryAdmissionNo =
                    `${schoolCode}/${academicYear}/${String(retrySeq).padStart(4, '0')}`

                try {
                    const retryUser = await User.create({
                        tenantId: session.user.tenantId,
                        name: body.name.trim(),
                        phone: studentPhone || null,
                        email: body.email?.trim() || null,
                        role: 'student',
                        password: hashedPwd,  // Same DOB password
                        admissionNo: retryAdmissionNo,
                        class: body.class,
                        section: body.section,
                        isActive: true,
                    })
                    studentUser = retryUser
                    student = await Student.create(
                        buildStudentData(
                            body, retryUser._id,
                            session.user.tenantId,
                            retryAdmissionNo, rollNo, academicYear,
                        )
                    )
                } catch (retryErr: any) {
                    if (studentUser?._id) {
                        await User.findByIdAndDelete(studentUser._id)
                    }
                    return NextResponse.json(
                        { error: 'Student creation failed — please try again' },
                        { status: 500 }
                    )
                }
            } else if (studentErr.name === 'ValidationError') {
                const messages = Object.values(studentErr.errors)
                    .map((e: any) => e.message).join(', ')
                return NextResponse.json(
                    { error: `Validation: ${messages}` }, { status: 400 }
                )
            } else {
                return NextResponse.json(
                    { error: studentErr.message || 'Student creation failed' },
                    { status: 500 }
                )
            }
        }

        // ── Fee Auto-Assign ──
        // ── Fee Auto-Assign — only for schools ──
        let feesAssigned = 0
        const optionalFees: Array<{
            _id: string
            structureId: string
            name: string
            amount: number
            dueDate: string
        }> = []

        if (institutionType === 'school') {
            try {
                const structures = await FeeStructure.find({
                    tenantId: session.user.tenantId,
                    isActive: true,
                    autoAssign: true,
                    academicYear,
                    $or: [
                        { class: 'all' },
                        { class: body.class },
                        { class: { $regex: `(^|,)\\s*${body.class}\\s*(,|$)` } },
                    ],
                }).lean() as any[]

                const matched = structures.filter((fs: any) => {
                    const sectionOk = !fs.section || fs.section === 'all' || fs.section === body.section
                    const streamOk = !fs.stream || fs.stream === '' || fs.stream === body.stream
                    return sectionOk && streamOk
                })

                if (matched.length > 0) {
                    const mandatoryOps: any[] = []
                    for (const fs of matched) {
                        const mandatoryItems = fs.items.filter((i: any) => !i.isOptional)
                        const optionalItems = fs.items.filter((i: any) => i.isOptional)

                        if (mandatoryItems.length > 0) {
                            const mandatoryAmount = mandatoryItems.reduce(
                                (sum: number, i: any) => sum + i.amount, 0
                            )
                            mandatoryOps.push({
                                insertOne: {
                                    document: {
                                        tenantId: session.user.tenantId,
                                        studentId: student._id,
                                        structureId: fs._id,
                                        amount: mandatoryAmount,
                                        discount: 0,
                                        lateFine: 0,
                                        finalAmount: mandatoryAmount,
                                        dueDate: fs.dueDate,
                                        status: 'pending',
                                        paidAmount: 0,
                                    },
                                },
                            })
                            feesAssigned++
                        }

                        for (const item of optionalItems) {
                            optionalFees.push({
                                _id: `${fs._id.toString()}_${item.label}`,
                                structureId: fs._id.toString(),
                                name: item.label,
                                amount: item.amount,
                                dueDate: fs.dueDate.toISOString(),
                            })
                        }
                    }
                    if (mandatoryOps.length > 0) {
                        await Fee.bulkWrite(mandatoryOps)
                    }
                }
            } catch (feeErr) {
                console.error('[Fee Auto-Assign Error]', feeErr)
            }
        }  // ✅ Add this closing brace

        // ── Parent Account — Sibling Aware ──
        ; (async () => {
            try {
                const existingParent = await User.findOne({
                    tenantId: session.user.tenantId,
                    phone: parentPhone,
                    role: 'parent',
                })

                if (existingParent) {
                    // Sibling — existing parent mein student add karo
                    // Password change NAHI — pehle bachche ka DOB hi rahega
                    await User.findByIdAndUpdate(existingParent._id, {
                        $addToSet: { studentRef: student._id },
                    })
                } else {
                    // ✅ Naya parent — password = is bachche ka DOB
                    const parentHashedPwd = await bcrypt.hash(dobPassword, 10)
                    await User.create({
                        tenantId: session.user.tenantId,
                        name: `${body.fatherName.trim()} (Parent)`,
                        phone: parentPhone,
                        role: 'parent',
                        password: parentHashedPwd,
                        studentRef: [student._id],
                        isActive: true,
                    })
                }
            } catch (e: any) {
                if (e.code !== 11000) {
                    console.error('[Parent Error]', e)
                }
            }
        })()

        // ✅ Response — simple login info
        return NextResponse.json({
            success: true,
            studentId: student._id.toString(),
            admissionNo: student.admissionNo,
            rollNo: student.rollNo,
            name: body.name.trim(),
            academicYear,
            feesAssigned,
            optionalFees,
            loginInfo: {
                // Student login
                student: {
                    username: studentPhone || admissionNo,
                    password: dobPassword,        // "15052008"
                    loginWith: studentPhone
                        ? 'phone'
                        : 'admissionNo',
                },
                // Parent login
                parent: {
                    username: parentPhone,
                    password: dobPassword,        // same — is bachche ka DOB
                    note: existingParentNote(),   // helper — niche define
                },
            },
            limits: {
                current: limitCheck.current + 1,
                limit: limitCheck.limit,
                remaining: limitCheck.isUnlimited
                    ? -1
                    : Math.max(0, limitCheck.remaining - 1),
            },
        }, { status: 201 })

    } catch (err: any) {
        console.error('[Student POST Error]', err)
        if (studentUser?._id) {
            await User.findByIdAndDelete(studentUser._id).catch(() => { })
        }
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field'
            return NextResponse.json(
                { error: `Duplicate ${field} — already exists` }, { status: 409 }
            )
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors)
                .map((e: any) => e.message).join(', ')
            return NextResponse.json(
                { error: `Validation: ${messages}` }, { status: 400 }
            )
        }
        return NextResponse.json(
            { error: err.message || 'Internal server error' }, { status: 500 }
        )
    }
}

// Helper — response mein include karo
function existingParentNote() {
    return 'Agar parent already registered hai to unka password same rahega (pehle bachche ka DOB)'
}
