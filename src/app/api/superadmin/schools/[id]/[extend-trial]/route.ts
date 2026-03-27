// =============================================================
// FILE: src/app/api/superadmin/schools/[id]/extend-trial/route.ts
// POST → trial ko 7 days extend karo
// =============================================================

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { School } from "@/models/School"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"


export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        await connectDB()

        const school = await School.findById(id)
        if (!school) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const newTrialEnd = new Date(school.trialEndsAt)
        // Agar pehle se expire ho gaya hai to aaj se 7 din
        if (newTrialEnd < new Date()) {
            newTrialEnd.setTime(Date.now())
        }
        newTrialEnd.setDate(newTrialEnd.getDate() + 7)

        await School.findByIdAndUpdate(id, { trialEndsAt: newTrialEnd })

        return NextResponse.json({
            success: true,
            trialEndsAt: newTrialEnd.toISOString(),
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
