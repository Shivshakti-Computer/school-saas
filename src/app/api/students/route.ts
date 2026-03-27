/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/students/route.ts
   GET  → list students (with filters)
   POST → add single student
   ─────────────────────────────────────────────────────────── */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { FeeStructure } from '@/models/FeeStructure'
import { Fee } from '@/models/Fee'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl

    const query: Record<string, any> = { tenantId: session.user.tenantId }
    const cls = searchParams.get('class')
    const section = searchParams.get('section')
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (cls) query.class = cls
    if (section) query.section = section
    if (status) query.status = status
    if (search) query.$or = [
        { admissionNo: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
    ]

    const [students, total] = await Promise.all([
        Student.find(query)
            .populate('userId', 'name phone email')
            .sort({ class: 1, rollNo: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Student.countDocuments(query),
    ])

    return NextResponse.json({ students, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    // Validate required fields
    const required = ['name', 'phone', 'class', 'section', 'fatherName',
        'parentPhone', 'address', 'dateOfBirth', 'gender', 'admissionDate']
    for (const field of required) {
        if (!body[field]) {
            return NextResponse.json({ error: `${field} is required` }, { status: 400 })
        }
    }

    // Check duplicate phone in this tenant
    const existing = await User.findOne({ tenantId: session.user.tenantId, phone: body.phone })
    if (existing) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 })
    }

    // Auto-generate admission number: YYYY-0001
    const year = new Date().getFullYear()
    const count = await Student.countDocuments({ tenantId: session.user.tenantId })
    const admissionNo = `${year}-${String(count + 1).padStart(4, '0')}`

    // Default password = parent phone number
    const hashedPwd = await bcrypt.hash(body.parentPhone, 10)

    const user = await User.create({
        tenantId: session.user.tenantId,
        name: body.name,
        phone: body.phone,
        email: body.email || undefined,
        role: 'student',
        password: hashedPwd,
        class: body.class,
        section: body.section,
    })

    const student = await Student.create({
        tenantId: session.user.tenantId,
        userId: user._id,
        admissionNo,
        rollNo: body.rollNo || String(count + 1),
        class: body.class,
        section: body.section,
        fatherName: body.fatherName,
        motherName: body.motherName,
        parentPhone: body.parentPhone,
        parentEmail: body.parentEmail,
        address: body.address,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        admissionDate: new Date(body.admissionDate),
        bloodGroup: body.bloodGroup,
    })


    // Is class ke liye active fee structures dhundho
    const activeStructures = await FeeStructure.find({
        tenantId: session.user.tenantId,
        isActive: true,
        autoAssign: true,
        $or: [
            { class: 'all' },
            { class: body.class },
            { class: { $regex: new RegExp('(^|,)\\s*' + body.class + '\\s*(,|$)') } },
        ],
    })

    // Har structure ke liye fee record banao
    for (const struct of activeStructures) {
        await Fee.create({
            tenantId: session.user.tenantId,
            studentId: student._id,
            structureId: struct._id,
            amount: struct.totalAmount,
            discount: 0,
            lateFine: 0,
            finalAmount: struct.totalAmount,
            dueDate: struct.dueDate,
            status: 'pending',
            paidAmount: 0,
        })
    }

    console.log(`Auto-assigned ${activeStructures.length} fee structures to new student`)

    // Parent account banao (agar already nahi hai)
    const existingParent = await User.findOne({
        tenantId: session.user.tenantId,
        phone: body.parentPhone,
        role: 'parent',
    })

    if (!existingParent) {
        const parentPwd = await bcrypt.hash(body.parentPhone, 10)
        await User.create({
            tenantId: session.user.tenantId,
            name: `${body.fatherName} (Parent)`,
            phone: body.parentPhone,
            role: 'parent',
            password: parentPwd,
            studentRef: student._id,
            isActive: true,
        })
    }

    return NextResponse.json({ student, admissionNo }, { status: 201 })
}