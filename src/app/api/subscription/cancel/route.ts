// =============================================================
// FILE: src/app/api/subscription/cancel/route.ts
// POST → subscription cancel karo
// =============================================================

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { School } from "@/models/School"
import { Subscription } from "@/models/Subscription"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const { reason } = await req.json()

        await Subscription.findOneAndUpdate(
            { tenantId: session.user.tenantId, status: 'active' },
            { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason }
        )

        // School ko downgrade karo — starter plan + clear subscription
        await School.findByIdAndUpdate(session.user.tenantId, {
            subscriptionId: null,
            plan: 'starter',
        })

        return NextResponse.json({ success: true })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}