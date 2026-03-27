// -------------------------------------------------------------
// FILE: src/lib/planGuard.ts — NEW FILE
// Server-side plan + module check utility
// -------------------------------------------------------------

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { isModuleAllowed } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

/**
 * Server component mein call karo — access denied hone pe redirect
 * Usage: await requireModule('fees')
 */
export async function requireModule(moduleKey: string, redirectTo = '/admin') {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/login')

    const allowed = isModuleAllowed(session.user.plan as PlanId, moduleKey)
    if (!allowed) {
        redirect(`${redirectTo}?blocked=${moduleKey}`)
    }
    return session
}

/**
 * API route mein call karo — 403 response return karo
 */
export function checkModuleAccess(plan: string, moduleKey: string): boolean {
    return isModuleAllowed(plan as PlanId, moduleKey)
}

/**
 * NextResponse 403 for API routes
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