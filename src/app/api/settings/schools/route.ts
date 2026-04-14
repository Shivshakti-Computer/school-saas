// FILE: src/app/api/settings/school/route.ts
// ═══════════════════════════════════════════════════════════
// PATCH /api/settings/school
// Update school profile: name, email, phone, address, logo
//
// GET /api/settings/school/logo-upload
// Cloudinary upload signature generate karo
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { getClientInfo } from '@/lib/security'
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
        // Indian phone — 10 digits
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

    // ── Validate ──
    const validationError = validateSchoolProfile(body)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // ── Kuch bhi update nahi ──
    const allowedFields = ['name', 'email', 'phone', 'address', 'logo', 'logoPublicId']
    const hasUpdate = allowedFields.some(
        (f) => body[f as keyof UpdateSchoolProfileBody] !== undefined
    )
    if (!hasUpdate) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    try {
        await connectDB()

        // ── Fetch current for audit ──
        const current = await School.findById(tenantId)
            .select('name email phone address logo')
            .lean() as any

        if (!current) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // ── Build update object ──
        const updateData: Record<string, any> = {}

        if (body.name !== undefined) updateData.name = body.name.trim()
        if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim()
        if (body.phone !== undefined) updateData.phone = body.phone.replace(/[\s\-]/g, '')
        if (body.address !== undefined) updateData.address = body.address.trim()
        if (body.logo !== undefined) updateData.logo = body.logo

        // ── Update School ──
        const updated = await School.findByIdAndUpdate(
            tenantId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('name email phone address logo').lean() as any

        // ── Update appearance.schoolLogo in SchoolSettings too ──
        // Sync karo taaki dono consistent rahein
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

        // ── Update lastUpdatedBy in settings ──
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

        // ── Audit Log ──
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
        console.error('[PATCH /api/settings/school]', error)
        return NextResponse.json(
            { error: 'Failed to update school profile' },
            { status: 500 }
        )
    }
}