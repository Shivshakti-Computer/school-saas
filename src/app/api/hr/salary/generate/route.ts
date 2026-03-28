import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Staff } from '@/models/Staff'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { month, deductions } = await req.json()

    const activeStaff = await Staff.find({
        tenantId: session.user.tenantId,
        status: 'active',
    }).populate('userId', 'name').lean()

    const salarySlips = activeStaff.map(s => {
        const gross = s.salary || 0
        const basic = Math.round(gross * 0.5)
        const hra = Math.round(gross * 0.2)
        const da = Math.round(gross * 0.15)
        const other = gross - basic - hra - da
        const pf = Math.round(basic * 0.12)
        const tax = Math.round(gross * 0.05)
        const totalDeductions = pf + tax + (deductions || 0)
        const netPay = gross - totalDeductions

        return {
            staffId: s._id,
            employeeId: s.employeeId,
            name: (s.userId as any)?.name || 'Unknown',
            designation: s.designation,
            department: s.department,
            month,
            earnings: { basic, hra, da, other, gross },
            deductions: { pf, tax, other: deductions || 0, total: totalDeductions },
            netPay,
            bankAccount: s.bankAccount,
        }
    })

    return NextResponse.json({
        month,
        totalStaff: salarySlips.length,
        totalPayout: salarySlips.reduce((s, sl) => s + sl.netPay, 0),
        slips: salarySlips,
    })
}