// FILE: src/lib/apiGuard.ts
// Combines: rate limiting + auth + role + DB-FRESH plan check + sanitization + audit

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { connectDB } from './db'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { isModuleAllowed } from './plans'
import { checkRateLimit, RATE_LIMITS, sanitizeBody, getClientInfo } from './security'
import { logAudit } from './audit'
import type { PlanId } from './plans'
import type { AuditAction, AuditResource } from '@/models/AuditLog'

interface GuardOptions {
    allowedRoles?: string[]
    requiredModules?: string[]
    rateLimit?: keyof typeof RATE_LIMITS
    auditAction?: AuditAction
    auditResource?: AuditResource
    skipPlanCheck?: boolean  // for subscription/auth routes
}

interface GuardResult {
    session: any
    clientInfo: ReturnType<typeof getClientInfo>
    freshPlan: PlanId
    subscriptionStatus: string
}

export async function apiGuard(
    req: NextRequest,
    options: GuardOptions = {}
): Promise<GuardResult | NextResponse> {

    // ── 1. Rate Limit ──
    if (options.rateLimit) {
        const rl = checkRateLimit(req, RATE_LIMITS[options.rateLimit])
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many requests', retryAfter: Math.ceil(rl.resetIn / 1000) },
                { status: 429 }
            )
        }
    }

    // ── 2. Auth Check ──
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 3. Role Check ──
    if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
        const clientInfo = getClientInfo(req)
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'MODULE_ACCESS_DENIED',
            resource: options.auditResource || 'System',
            description: `Role denied: ${session.user.role} → ${req.method} ${req.nextUrl.pathname}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'FAILURE',
        })
        return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 })
    }

    // Superadmin bypasses plan checks
    if (session.user.role === 'superadmin') {
        return {
            session,
            clientInfo: getClientInfo(req),
            freshPlan: 'enterprise' as PlanId,
            subscriptionStatus: 'active',
        }
    }

    // ── 4. DB-FRESH Plan + Subscription Check (like planGuard) ──
    let freshPlan: PlanId = 'starter' as PlanId
    let subscriptionStatus = 'expired'

    if (!options.skipPlanCheck) {
        await connectDB()

        const school = await School.findById(session.user.tenantId)
            .select('plan subscriptionId trialEndsAt isActive modules')
            .lean() as any

        if (!school || !school.isActive) {
            return NextResponse.json(
                { error: 'School not found or deactivated' },
                { status: 403 }
            )
        }

        // Check active subscription from DB
        const activeSub = await Subscription.findOne({
            tenantId: session.user.tenantId,
            status: 'active',
        }).sort({ createdAt: -1 }).lean() as any

        const now = new Date()
        const trialEnd = new Date(school.trialEndsAt)
        const hasPaidSub = Boolean(activeSub)
        const subEnd = activeSub?.currentPeriodEnd
            ? new Date(activeSub.currentPeriodEnd)
            : null

        if (hasPaidSub && subEnd && subEnd > now) {
            freshPlan = activeSub.plan as PlanId
            subscriptionStatus = 'active'
        } else if (!hasPaidSub && trialEnd > now) {
            freshPlan = 'starter' as PlanId
            subscriptionStatus = 'trial'
        } else {
            freshPlan = 'starter' as PlanId
            subscriptionStatus = 'expired'
        }

        // Expired check
        if (subscriptionStatus === 'expired') {
            return NextResponse.json(
                { error: 'Subscription expired', code: 'EXPIRED', upgrade: '/admin/subscription' },
                { status: 403 }
            )
        }

        // Module check using DB-fresh plan (NOT JWT)
        if (options.requiredModules && options.requiredModules.length > 0) {
            for (const mod of options.requiredModules) {
                if (!isModuleAllowed(freshPlan, mod)) {
                    return NextResponse.json(
                        {
                            error: `Module '${mod}' is not available in your ${freshPlan} plan`,
                            code: 'MODULE_BLOCKED',
                            currentPlan: freshPlan,
                            upgrade: '/admin/subscription',
                        },
                        { status: 403 }
                    )
                }
            }
        }
    }

    return {
        session,
        clientInfo: getClientInfo(req),
        freshPlan,
        subscriptionStatus,
    }
}

// ── With Body Sanitization ──
export async function apiGuardWithBody<T = any>(
    req: NextRequest,
    options: GuardOptions = {}
): Promise<{ session: any; body: T; clientInfo: any; freshPlan: PlanId; subscriptionStatus: string } | NextResponse> {

    const guard = await apiGuard(req, options)
    if (guard instanceof NextResponse) return guard

    try {
        const raw = await req.json()
        const body = sanitizeBody<T>(raw)
        return { ...guard, body }
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
}