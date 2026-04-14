// FILE: src/app/api/settings/schools/route.ts
// ═══════════════════════════════════════════════════════════
// PATCH /api/settings/schools  ← plural (file tree mein yahi hai)
// GET   /api/settings/schools  ← current school profile fetch
//
// NOTE: SchoolProfileTab '/api/settings/school' (singular) call karta tha
// Hum dono handle karenge — schools/route.ts mein hi
// Aur ek redirect bhi banayenge school/route.ts se
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody, apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import type { UpdateSchoolProfileBody } from '@/types/settings'

// ── Validation ──
function validateSchoolProfile(body: UpdateSchoolProfileBody): string | null {
    if (body.name !== undefined) {
        if (!body.name.trim()) return 'School name cannot be empty'
        if (body.name.trim().length < 3) return 'School name must be at least 3 characters'
        if (body.name.trim().length > 100) return 'School name too long (max 100 chars)'
    }

    if (body.email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(body.email)) return 'Invalid email address'
    }

    if (body.phone !== undefined) {
        const phoneRegex = /^[6-9]\d{9}$/
        const cleaned = body.phone.replace(/[\s\-\+]/g, '')
        if (!phoneRegex.test(cleaned)) return 'Invalid phone number (10 digits required)'
    }

    if (body.address !== undefined) {
        if (body.address.trim().length > 300) return 'Address too long (max 300 chars)'
    }

    return null
}

// ─────────────────────────────────────────────────────────
// GET — Current school profile
// ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const tenantId = session.user.tenantId

    try {
        await connectDB()

        const school = await School.findById(tenantId)
            .select('name subdomain email phone address logo plan trialEndsAt creditBalance isActive onboardingComplete theme paymentSettings modules')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            school: {
                id: school._id.toString(),
                name: school.name,
                subdomain: school.subdomain,
                email: school.email || '',
                phone: school.phone || '',
                address: school.address || '',
                logo: school.logo,
                plan: school.plan,
                trialEndsAt: school.trialEndsAt?.toISOString() || '',
                creditBalance: school.creditBalance || 0,
                isActive: school.isActive,
                onboardingComplete: school.onboardingComplete,
                theme: {
                    primary: school.theme?.primary || '#6366f1',
                    secondary: school.theme?.secondary || '#f97316',
                },
                razorpayConfigured: Boolean(
                    school.paymentSettings?.razorpayKeyId &&
                    school.paymentSettings?.razorpayKeySecret
                ),
                modules: school.modules || [],
            },
        })

    } catch (error: any) {
        console.error('[GET /api/settings/schools]', error)
        return NextResponse.json({ error: 'Failed to fetch school profile' }, { status: 500 })
    }
}

// ─────────────────────────────────────────────────────────
// PATCH — Update School Profile
// ─────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
    const guard = await apiGuardWithBody<UpdateSchoolProfileBody>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'UPDATE',
        auditResource: 'School',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId

    const validationError = validateSchoolProfile(body)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const allowedFields = ['name', 'email', 'phone', 'address', 'logo', 'logoPublicId']
    const hasUpdate = allowedFields.some(
        (f) => body[f as keyof UpdateSchoolProfileBody] !== undefined
    )
    if (!hasUpdate) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    try {
        await connectDB()

        const current = await School.findById(tenantId)
            .select('name email phone address logo')
            .lean() as any

        if (!current) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        const updateData: Record<string, any> = {}
        if (body.name !== undefined) updateData.name = body.name.trim()
        if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim()
        if (body.phone !== undefined) updateData.phone = body.phone.replace(/[\s\-]/g, '')
        if (body.address !== undefined) updateData.address = body.address.trim()
        if (body.logo !== undefined) updateData.logo = body.logo

        const updated = await School.findByIdAndUpdate(
            tenantId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('name email phone address logo').lean() as any

        // ── Sync logo to SchoolSettings.appearance ──
        if (body.logo !== undefined) {
            await SchoolSettings.findOneAndUpdate(
                { tenantId },
                {
                    $set: {
                        'appearance.schoolLogo': body.logo,
                        'appearance.schoolLogoPublicId': body.logoPublicId || '',
                    },
                },
                { upsert: true }
            )
        }

        // ── lastUpdatedBy sync ──
        await SchoolSettings.findOneAndUpdate(
            { tenantId },
            {
                $set: {
                    lastUpdatedBy: session.user.id,
                    lastUpdatedByName: session.user.name,
                },
            },
            { upsert: true }
        )

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'School',
            resourceId: tenantId,
            description: 'School profile updated',
            previousData: {
                name: current.name,
                email: current.email,
                phone: current.phone,
                address: current.address,
            },
            newData: updateData,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'School profile updated successfully',
            school: {
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                address: updated.address,
                logo: updated.logo,
            },
        })

    } catch (error: any) {
        console.error('[PATCH /api/settings/schools]', error)
        return NextResponse.json(
            { error: 'Failed to update school profile' },
            { status: 500 }
        )
    }
}