// ─────────────────────────────────────────────────────────────
// FILE: src/lib/planGuard.ts — DB-FRESH plan check
// JWT se nahi, DB se verify karta hai
// ─────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { isModuleAllowed } from '@/lib/plans'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import type { PlanId } from '@/lib/plans'

/**
 * Server component mein call karo — DB se fresh plan check
 * Usage: await requireModule('fees')
 */
export async function requireModule(moduleKey: string, redirectTo = '/admin') {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/login')

    // ← KEY: DB se fresh plan check, JWT pe bharosa nahi
    await connectDB()
    const school = await School.findById(session.user.tenantId)
        .select('plan subscriptionId trialEndsAt')
        .lean() as any

    if (!school) redirect('/login')

    // Check subscription expiry
    const isExpired =
        !school.subscriptionId &&
        new Date(school.trialEndsAt) < new Date()

    if (isExpired) {
        redirect('/admin/subscription')
    }

    // Check module access with DB plan (not JWT plan)
    const dbPlan = school.plan as PlanId
    const allowed = isModuleAllowed(dbPlan, moduleKey)

    if (!allowed) {
        redirect(`/admin/subscription?blocked=${moduleKey}`)
    }

    return { ...session, freshPlan: dbPlan }
}

/**
 * API route mein call karo — DB se fresh check
 * Returns { allowed, plan } or throws 403
 */
export async function requireModuleAPI(
    tenantId: string,
    moduleKey: string
): Promise<{ allowed: true; plan: PlanId }> {
    await connectDB()
    const school = await School.findById(tenantId)
        .select('plan subscriptionId trialEndsAt')
        .lean() as any

    if (!school) {
        throw new Error('School not found')
    }

    // Check expiry
    const isExpired =
        !school.subscriptionId &&
        new Date(school.trialEndsAt) < new Date()

    if (isExpired) {
        throw new Error('Subscription expired')
    }

    const dbPlan = school.plan as PlanId
    if (!isModuleAllowed(dbPlan, moduleKey)) {
        throw new Error(`Module '${moduleKey}' not available in ${dbPlan} plan`)
    }

    return { allowed: true, plan: dbPlan }
}

/**
 * API route helper — returns Response object for blocked module
 */
export function moduleBlockedResponse(moduleKey: string) {
    return Response.json(
        {
            error: `Module '${moduleKey}' is not available in your current plan.`,
            code: 'MODULE_BLOCKED',
            upgrade: '/admin/subscription',
        },
        { status: 403 }
    )
}