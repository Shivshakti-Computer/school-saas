import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Staff } from '@/models/Staff'
import '@/models/User'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const department = searchParams.get('department')

    const filter: any = { tenantId: session.user.tenantId }
    if (status) filter.status = status
    if (department) filter.department = department

    const staff = await Staff.find(filter)
        .populate('userId', 'name email phone')
        .sort({ employeeId: 1 })
        .lean()

    const stats = {
        total: staff.length,
        active: staff.filter(s => s.status === 'active').length,
        totalSalary: staff.filter(s => s.status === 'active').reduce((s, st) => s + (st.salary || 0), 0),
        departments: [...new Set(staff.map(s => s.department))],
    }

    return NextResponse.json({ staff, stats })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const staff = await Staff.create({
        tenantId: session.user.tenantId,
        userId: body.userId,
        employeeId: body.employeeId,
        designation: body.designation,
        department: body.department,
        subjects: body.subjects || [],
        classes: body.classes || [],
        joiningDate: new Date(body.joiningDate),
        salary: Number(body.salary),
        bankAccount: body.bankAccount,
        ifscCode: body.ifscCode,
        panNumber: body.panNumber,
        address: body.address,
        emergencyContact: body.emergencyContact,
        status: 'active',
    })

    return NextResponse.json({ staff }, { status: 201 })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, ...data } = await req.json()

    const staff = await Staff.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        data,
        { new: true }
    )

    return NextResponse.json({ staff })
}