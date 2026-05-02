// FILE: src/app/api/settings/schools/route.ts
// FIXES:
// 1. GET — certificateSettings + accreditations School se return karo
// 2. PATCH — allowedUpdates ko updateData mein merge karo (ye kabhi save nahi ho raha tha)
// 3. PATCH — hasUpdate check fix karo (certificateSettings/accreditations bhi valid update hai)

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody, apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import type { UpdateSchoolProfileBody } from '@/types/settings'

// ── Validation ── (UNCHANGED)
function validateSchoolProfile(body: UpdateSchoolProfileBody): string | null {
    if (body.name !== undefined) {
        if (!body.name.trim()) return 'School name cannot be empty'
        if (body.name.trim().length < 3)
            return 'School name must be at least 3 characters'
        if (body.name.trim().length > 100)
            return 'School name too long (max 100 chars)'
    }
    if (body.email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(body.email)) return 'Invalid email address'
    }
    if (body.phone !== undefined) {
        const phoneRegex = /^[6-9]\d{9}$/
        const cleaned = body.phone.replace(/[\s\-\+]/g, '')
        if (!phoneRegex.test(cleaned))
            return 'Invalid phone number (10 digits required)'
    }
    if (body.address !== undefined) {
        if (body.address.trim().length > 300)
            return 'Address too long (max 300 chars)'
    }
    return null
}

// ─────────────────────────────────────────────────────────
// GET — Current school profile
// ✅ FIX: certificateSettings + accreditations bhi return karo
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

        // ✅ FIX: certificateSettings + accreditations bhi select karo
        const school = await School.findById(tenantId)
            .select(
                'name subdomain email phone address logo plan trialEndsAt ' +
                'creditBalance isActive onboardingComplete theme ' +
                'paymentSettings modules ' +
                'certificateSettings accreditations ' // ✅ ADD
            )
            .lean() as any

        if (!school) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            )
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
            // ✅ ADD: CertificateTab ke liye ye dono return karo
            certificateSettings: school.certificateSettings || null,
            accreditations: school.accreditations || null,
        })
    } catch (error: any) {
        console.error('[GET /api/settings/schools]', error)
        return NextResponse.json(
            { error: 'Failed to fetch school profile' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────
// PATCH — Update School Profile
// ✅ FIX 1: allowedUpdates ko updateData mein merge karo
// ✅ FIX 2: hasUpdate check mein certificateSettings/accreditations bhi count karo
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

    // ✅ FIX: hasUpdate mein certificateSettings + accreditations bhi check karo
    const profileFields = ['name', 'email', 'phone', 'address', 'logo', 'logoPublicId']
    const hasProfileUpdate = profileFields.some(
        (f) => body[f as keyof UpdateSchoolProfileBody] !== undefined
    )
    const hasCertUpdate =
        body.certificateSettings !== undefined ||
        body.accreditations !== undefined

    if (!hasProfileUpdate && !hasCertUpdate) {
        return NextResponse.json(
            { error: 'No fields to update' },
            { status: 400 }
        )
    }

    try {
        await connectDB()

        const current = await School.findById(tenantId)
            .select('name email phone address logo')
            .lean() as any

        if (!current) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            )
        }

        // ── Build updateData ──
        const updateData: Record<string, any> = {}

        // Profile fields
        if (body.name !== undefined)
            updateData.name = body.name.trim()
        if (body.email !== undefined)
            updateData.email = body.email.toLowerCase().trim()
        if (body.phone !== undefined)
            updateData.phone = body.phone.replace(/[\s\-]/g, '')
        if (body.address !== undefined)
            updateData.address = body.address.trim()
        if (body.logo !== undefined)
            updateData.logo = body.logo

        // ✅ FIX: certificateSettings directly updateData mein daalo
        // (pehle allowedUpdates mein tha jo kabhi save nahi hota tha)
        if (body.certificateSettings !== undefined) {
            updateData.certificateSettings = {
                enableDigitalSignature:
                    body.certificateSettings.enableDigitalSignature ?? false,
                digitalSignatureUrl:
                    body.certificateSettings.digitalSignatureUrl || '',
                signatureName:
                    body.certificateSettings.signatureName || '',
                signatureDesignation:
                    body.certificateSettings.signatureDesignation ||
                    'Principal',
                enableQRCode:
                    body.certificateSettings.enableQRCode ?? true,
                qrCodePosition:
                    body.certificateSettings.qrCodePosition ||
                    'bottom-right',
                showVerificationURL:
                    body.certificateSettings.showVerificationURL ?? true,
                defaultLayout:
                    body.certificateSettings.defaultLayout || 'modern',
                showAccreditationsOnCertificate:
                    body.certificateSettings
                        .showAccreditationsOnCertificate ?? true,
                watermarkText:
                    body.certificateSettings.watermarkText || '',
                enableWatermark:
                    body.certificateSettings.enableWatermark ?? false,
            }
        }

        // ✅ FIX: accreditations directly updateData mein daalo
        if (body.accreditations !== undefined) {
            // Helper to map accreditation array
            const mapAccred = (arr: any[] = []) =>
                arr.map((a) => ({
                    name: a.name || '',
                    logoUrl: a.logoUrl || '',
                    registrationNo: a.registrationNo || '',
                    issuedBy: a.issuedBy || '',
                    validFrom: a.validFrom
                        ? new Date(a.validFrom)
                        : undefined,
                    validUntil: a.validUntil
                        ? new Date(a.validUntil)
                        : undefined,
                    isActive: a.isActive ?? true,
                    displayOrder: a.displayOrder ?? 0,
                }))

            updateData.accreditations = {
                affiliations: mapAccred(
                    body.accreditations.affiliations
                ),
                recognitions: mapAccred(
                    body.accreditations.recognitions
                ),
                registrations: mapAccred(
                    body.accreditations.registrations
                ),
                partnerships: mapAccred(
                    body.accreditations.partnerships
                ),
            }
        }

        const updated = await School.findByIdAndUpdate(
            tenantId,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .select('name email phone address logo')
            .lean() as any

        // ── Sync logo to SchoolSettings.appearance ── (UNCHANGED)
        if (body.logo !== undefined) {
            await SchoolSettings.findOneAndUpdate(
                { tenantId },
                {
                    $set: {
                        'appearance.schoolLogo': body.logo,
                        'appearance.schoolLogoPublicId':
                            body.logoPublicId || '',
                    },
                },
                { upsert: true }
            )
        }

        // ── lastUpdatedBy sync ── (UNCHANGED)
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
            description: hasCertUpdate
                ? 'Certificate settings updated'
                : 'School profile updated',
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
            message: hasCertUpdate
                ? 'Certificate settings saved successfully'
                : 'School profile updated successfully',
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
            { error: 'Failed to update' },
            { status: 500 }
        )
    }
}