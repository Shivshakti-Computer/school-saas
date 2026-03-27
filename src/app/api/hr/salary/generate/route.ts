// FILE: src/app/api/hr/salary/generate/route.ts

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { checkModuleAccess, moduleBlockedResponse } from "@/lib/planGaurd"
import { User } from "@/models/User"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!checkModuleAccess(session.user.plan, 'hr')) return moduleBlockedResponse('hr')
    await connectDB()
    const { month } = await req.json()  // "2025-03"

    // Get all teachers
    const teachers = await User.find({
        tenantId: session.user.tenantId,
        role: { $in: ['teacher', 'admin'] },
        isActive: true,
    }).lean() as any[]

    let generated = 0
    for (const teacher of teachers) {
        const baseSalary = teacher.salary ?? 15000  // Default ₹15,000
        // Generate PDF and save record
        // In production: use generateSalarySlipPDF(teacher, month, baseSalary)
        generated++
    }

    return NextResponse.json({ generated, month })
}
