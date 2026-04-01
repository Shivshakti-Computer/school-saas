// FILE: src/app/api/students/route.ts — COMPLETE FINAL

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

/* ══════════════════════════════════════════════
   HELPER — Student data object banana
   Ek jagah define karo — duplicate nahi hoga
   ══════════════════════════════════════════════ */
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
        admissionDate:  new Date(body.admissionDate),
        admissionClass: body.class,

        class:   body.class,
        section: body.section,
        stream:  body.stream || '',

        dateOfBirth: new Date(body.dateOfBirth),
        gender:      body.gender,
        bloodGroup:  body.bloodGroup  || '',
        nationality: body.nationality || 'Indian',
        religion:    body.religion    || '',
        category:    body.category    || 'general',

        fatherName:       body.fatherName.trim(),
        fatherOccupation: body.fatherOccupation || '',
        fatherPhone:      body.fatherPhone      || '',
        motherName:       body.motherName       || '',
        motherOccupation: body.motherOccupation || '',
        motherPhone:      body.motherPhone      || '',
        parentPhone:      body.parentPhone.trim(),
        parentEmail:      body.parentEmail      || '',

        address: body.address?.trim() || 'Not provided',
        city:    body.city    || '',
        state:   body.state   || '',
        pincode: body.pincode || '',

        emergencyContact: body.emergencyContact || '',
        emergencyName:    body.emergencyName    || '',
        previousSchool:   body.previousSchool   || '',
        previousClass:    body.previousClass    || '',
        tcNumber:         body.tcNumber         || '',

        sessionHistory: [{
            academicYear,
            class:   body.class,
            section: body.section,
            rollNo,
        }],

        status: 'active',
    }
}

/* ══════════════════════════════════════════════
   GET — List Students with filters
   ══════════════════════════════════════════════ */
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
    const stream       = searchParams.get('stream')
    const page         = parseInt(searchParams.get('page')  || '1')
    const limit        = parseInt(searchParams.get('limit') || '20')

    const query: Record<string, any> = {
        tenantId: session.user.tenantId,
    }

    if (cls)          query.class        = cls
    if (section)      query.section      = section
    if (status)       query.status       = status
    if (academicYear) query.academicYear = academicYear
    if (gender)       query.gender       = gender
    if (category)     query.category     = category
    if (stream)       query.stream       = stream

    if (search) {
        const directSearch = [
            { admissionNo: { $regex: search, $options: 'i' } },
            { fatherName:  { $regex: search, $options: 'i' } },
            { parentPhone: { $regex: search, $options: 'i' } },
            { rollNo:      { $regex: search, $options: 'i' } },
        ]

        const matchedUsers = await User.find({
            tenantId: session.user.tenantId,
            role:     'student',
            name:     { $regex: search, $options: 'i' },
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
    let session: any  = null
    let limitCheck: any = null
    let user: any     = null

    try {
        // ── Auth ──
        session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        // ── Limit Check ──
        limitCheck = await checkCanAddStudent(session.user.tenantId)
        if (!limitCheck.allowed) {
            return NextResponse.json({
                error:        limitCheck.message,
                limitReached: true,
                current:      limitCheck.current,
                limit:        limitCheck.limit,
            }, { status: 403 })
        }

        // ── Parse Body ──
        const body = await req.json()

        // ── Debug log (remove in production) ──
        // console.log('[Student POST] body keys:', Object.keys(body))
        // console.log('[Student POST] class:', body.class, 'section:', body.section)

        // ── Validation ──
        const required = [
            'name', 'phone', 'class', 'section',
            'fatherName', 'parentPhone',
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

        // Stream validation for 11/12
        if (['11', '12'].includes(body.class) && !body.stream) {
            return NextResponse.json(
                { error: 'Class 11/12 ke liye stream required hai' },
                { status: 400 }
            )
        }

        // ── Duplicate Phone Check ──
        const existing = await User.findOne({
            tenantId: session.user.tenantId,
            phone:    body.phone.trim(),
        })
        if (existing) {
            return NextResponse.json(
                { error: 'Is phone number se pehle se account registered hai' },
                { status: 409 }
            )
        }

        // ── School Info ──
        const school = await School.findById(session.user.tenantId)
            .select('subdomain')
            .lean() as any

        const subdomain    = school?.subdomain || 'SCH'
        const academicYear = body.academicYear || getCurrentAcademicYear()

        // ── Generate Numbers ──
        const admissionNo = await generateAdmissionNo(
            session.user.tenantId,
            subdomain,
            academicYear
        )
        const rollNo = await generateRollNo(
            session.user.tenantId,
            body.class,
            body.section,
            academicYear
        )

        // ── Create User ──
        const hashedPwd = await bcrypt.hash(body.parentPhone, 10)

        try {
            user = await User.create({
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
        } catch (userErr: any) {
            if (userErr.code === 11000) {
                return NextResponse.json(
                    { error: 'Is phone number se pehle se account registered hai' },
                    { status: 409 }
                )
            }
            throw userErr
        }

        // ── Create Student ──
        // ✅ buildStudentData helper use karo — koi field miss nahi hogi
        let student: any

        try {
            student = await Student.create(
                buildStudentData(
                    body,
                    user._id,
                    session.user.tenantId,
                    admissionNo,
                    rollNo,
                    academicYear,
                )
            )
        } catch (studentErr: any) {
            // ── Rollback user ──
            if (user?._id) {
                await User.findByIdAndDelete(user._id)
                console.warn('[Rollback] User deleted:', user._id.toString())
            }

            // ── AdmissionNo conflict — retry ──
            if (studentErr.code === 11000 &&
                studentErr.message?.includes('admissionNo')) {

                console.warn('[AdmissionNo Conflict] Retrying with fresh number...')

                // Fresh number generate karo from actual DB state
                const actualLast = await Student.findOne({
                    tenantId:    session.user.tenantId,
                    academicYear,
                })
                    .sort({ createdAt: -1 })
                    .select('admissionNo')
                    .lean() as any

                let retrySeq = 1
                if (actualLast?.admissionNo) {
                    const lastPart = actualLast.admissionNo.split('/').pop()
                    retrySeq = (parseInt(lastPart || '0') || 0) + 1
                }

                const schoolCodeRetry = subdomain.toUpperCase().slice(0, 3)
                const retryAdmissionNo = `${schoolCodeRetry}/${academicYear}/${String(retrySeq).padStart(4, '0')}`

                // New user banana padega (purana delete ho gaya)
                try {
                    const retryUser = await User.create({
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

                    user = retryUser // update reference for rollback

                    student = await Student.create(
                        buildStudentData(
                            body,
                            retryUser._id,
                            session.user.tenantId,
                            retryAdmissionNo,
                            rollNo,
                            academicYear,
                        )
                    )
                } catch (retryErr: any) {
                    if (user?._id) await User.findByIdAndDelete(user._id)
                    console.error('[Retry Failed]', retryErr)
                    return NextResponse.json(
                        { error: 'Student creation failed — please try again' },
                        { status: 500 }
                    )
                }

            } else if (studentErr.name === 'ValidationError') {
                const messages = Object.values(studentErr.errors)
                    .map((e: any) => e.message)
                    .join(', ')
                return NextResponse.json(
                    { error: `Validation failed: ${messages}` },
                    { status: 400 }
                )
            } else {
                return NextResponse.json(
                    { error: studentErr.message || 'Student creation failed' },
                    { status: 500 }
                )
            }
        }

        // ── Fee Auto-Assign ──
        let feesAssigned = 0
        try {
            const structures = await FeeStructure.find({
                tenantId:    session.user.tenantId,
                isActive:    true,
                autoAssign:  true,
                academicYear,
                $or: [
                    { class: 'all' },
                    { class: body.class },
                    { class: { $regex: `(^|,)\\s*${body.class}\\s*(,|$)` } },
                ],
            }).lean() as any[]

            const matched = structures.filter((fs: any) => {
                const sectionOk =
                    !fs.section ||
                    fs.section === 'all' ||
                    fs.section === body.section

                const streamOk =
                    !fs.stream ||
                    fs.stream === '' ||
                    fs.stream === body.stream

                return sectionOk && streamOk
            })

            if (matched.length > 0) {
                const ops = matched.map((fs: any) => ({
                    insertOne: {
                        document: {
                            tenantId:    session.user.tenantId,
                            studentId:   student._id,
                            structureId: fs._id,
                            amount:      fs.totalAmount,
                            discount:    0,
                            lateFine:    0,
                            finalAmount: fs.totalAmount,
                            dueDate:     fs.dueDate,
                            status:      'pending',
                            paidAmount:  0,
                        },
                    },
                }))
                await Fee.bulkWrite(ops)
                feesAssigned = matched.length
            }
        } catch (feeErr) {
            console.error('[Fee Auto-Assign Error]', feeErr)
        }

        // ── Parent Account — fire and forget ──
        ;(async () => {
            try {
                const existingParent = await User.findOne({
                    tenantId: session.user.tenantId,
                    phone:    body.parentPhone.trim(),
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

        // ── Success ──
        return NextResponse.json({
            success:      true,
            studentId:    student._id,
            admissionNo:  student.admissionNo,
            rollNo:       student.rollNo,
            academicYear,
            feesAssigned,
            limits: {
                current:   limitCheck.current + 1,
                limit:     limitCheck.limit,
                remaining: limitCheck.isUnlimited
                    ? -1
                    : Math.max(0, limitCheck.remaining - 1),
            },
        }, { status: 201 })

    } catch (err: any) {
        console.error('[Student POST Error]', err)

        // Global rollback
        if (user?._id) {
            try {
                await User.findByIdAndDelete(user._id)
                console.warn('[Global Rollback] User deleted:', user._id)
            } catch (rbErr) {
                console.error('[Rollback Failed]', rbErr)
            }
        }

        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field'
            return NextResponse.json(
                { error: `Duplicate ${field} — already exists` },
                { status: 409 }
            )
        }

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors)
                .map((e: any) => e.message)
                .join(', ')
            return NextResponse.json(
                { error: `Validation: ${messages}` },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}