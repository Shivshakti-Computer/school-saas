// FILE: src/app/api/settings/appearance/route.ts
// ✅ UPDATED: Trial mein sab appearance features allowed
// ✅ Plan gating sirf paid subscriptions pe

import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import type {
    UploadApiResponse,
    UploadApiErrorResponse,
    UploadApiOptions
} from 'cloudinary'
import { apiGuardWithBody, apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { isValidHexColor } from '@/types/settings'
import type { UpdateAppearanceBody } from '@/types/settings'
import { checkStorageLimit, updateStorageUsage } from '@/lib/storageAddon'
import { getStorageProvider, uploadFormFile } from '@/lib/storage'
import { deleteFromR2 } from '@/lib/r2Client'
import { PlanId } from '@/config/pricing'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
})

// ─────────────────────────────────────────────────────────
// Plan Feature Gates
// ✅ Trial mein sab allowed — sirf paid plan check
// ─────────────────────────────────────────────────────────

const PLAN_ORDER: Record<string, number> = {
    starter: 1, growth: 2, pro: 3, enterprise: 4,
}

function isPlanAllowed(currentPlan: string, requiredPlan: string): boolean {
    return (PLAN_ORDER[currentPlan] || 0) >= (PLAN_ORDER[requiredPlan] || 0)
}

// ─────────────────────────────────────────────────────────
// Validate appearance body
// ─────────────────────────────────────────────────────────

function validateAppearance(body: UpdateAppearanceBody): string | null {
    if (body.portalTheme) {
        if (
            body.portalTheme.primaryColor &&
            !isValidHexColor(body.portalTheme.primaryColor)
        ) {
            return 'Invalid primary color format (use hex: #RRGGBB)'
        }
        if (
            body.portalTheme.accentColor &&
            !isValidHexColor(body.portalTheme.accentColor)
        ) {
            return 'Invalid accent color format (use hex: #RRGGBB)'
        }
        if (
            body.portalTheme.darkMode &&
            !['light', 'dark', 'system'].includes(body.portalTheme.darkMode)
        ) {
            return 'Dark mode must be light, dark, or system'
        }
    }

    if (
        body.printHeader?.customTagline &&
        body.printHeader.customTagline.length > 100
    ) {
        return 'Tagline too long (max 100 chars)'
    }

    return null
}

// ─────────────────────────────────────────────────────────
// Upload helper
// ─────────────────────────────────────────────────────────

function uploadToCloudinary(
    buffer: Buffer,
    options: UploadApiOptions
): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                options,
                (
                    err: UploadApiErrorResponse | undefined,
                    result: UploadApiResponse | undefined
                ) => {
                    if (err) return reject(err)
                    if (!result) return reject(new Error('Upload failed: no result'))
                    resolve(result)
                }
            )
            .end(buffer)
    })
}

// ─────────────────────────────────────────────────────────
// PATCH — Update appearance settings
// ─────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    const guard = await apiGuardWithBody<UpdateAppearanceBody>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'SETTINGS_CHANGE',
        auditResource: 'School',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId
    const currentPlan = (guard.freshPlan as string) || session.user.plan || 'starter'

    // ✅ Trial check — trial mein sab allowed
    const subscriptionStatus = (session.user as any).subscriptionStatus || 'trial'
    const isTrial = subscriptionStatus === 'trial'

    const validationError = validateAppearance(body)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // ✅ Plan-based feature gating — sirf paid plan pe
    // Trial mein ye checks skip
    if (!isTrial) {
        if (body.portalTheme?.primaryColor || body.portalTheme?.accentColor) {
            if (!isPlanAllowed(currentPlan, 'growth')) {
                return NextResponse.json(
                    { error: 'Theme colors require Growth plan or higher' },
                    { status: 403 }
                )
            }
        }

        if (body.portalTheme?.darkMode) {
            if (!isPlanAllowed(currentPlan, 'growth')) {
                return NextResponse.json(
                    { error: 'Dark mode requires Growth plan or higher' },
                    { status: 403 }
                )
            }
        }

        if (body.printHeader) {
            if (!isPlanAllowed(currentPlan, 'pro')) {
                return NextResponse.json(
                    { error: 'Print header settings require Pro plan or higher' },
                    { status: 403 }
                )
            }
        }

        if (body.printHeader?.customTagline) {
            if (!isPlanAllowed(currentPlan, 'pro')) {
                return NextResponse.json(
                    { error: 'Custom tagline requires Pro plan or higher' },
                    { status: 403 }
                )
            }
        }
    }

    try {
        await connectDB()

        const setFields: Record<string, unknown> = {
            lastUpdatedBy: session.user.id,
            lastUpdatedByName: session.user.name,
        }

        if (body.schoolLogo !== undefined) {
            setFields['appearance.schoolLogo'] = body.schoolLogo
            setFields['appearance.schoolLogoPublicId'] = body.schoolLogoPublicId || ''

            await School.findByIdAndUpdate(tenantId, {
                $set: { logo: body.schoolLogo },
            })
        }

        if (body.favicon !== undefined) {
            setFields['appearance.favicon'] = body.favicon
        }

        if (body.portalTheme) {
            if (body.portalTheme.primaryColor !== undefined) {
                setFields['appearance.portalTheme.primaryColor'] =
                    body.portalTheme.primaryColor

                await School.findByIdAndUpdate(tenantId, {
                    $set: { 'theme.primary': body.portalTheme.primaryColor },
                })
            }
            if (body.portalTheme.accentColor !== undefined) {
                setFields['appearance.portalTheme.accentColor'] =
                    body.portalTheme.accentColor

                await School.findByIdAndUpdate(tenantId, {
                    $set: { 'theme.secondary': body.portalTheme.accentColor },
                })
            }
            if (body.portalTheme.darkMode !== undefined) {
                setFields['appearance.portalTheme.darkMode'] =
                    body.portalTheme.darkMode
            }
        }

        if (body.printHeader) {
            Object.entries(body.printHeader).forEach(([key, val]) => {
                if (val !== undefined) {
                    setFields[`appearance.printHeader.${key}`] = val
                }
            })
        }

        await SchoolSettings.findOneAndUpdate(
            { tenantId },
            { $set: setFields },
            { upsert: true }
        )

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'SETTINGS_CHANGE',
            resource: 'School',
            resourceId: tenantId,
            description: `Appearance settings updated${isTrial ? ' (trial)' : ''}`,
            newData: {
                ...body,
                schoolLogoPublicId: body.schoolLogoPublicId ? '[SET]' : undefined,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Appearance settings updated successfully',
        })

    } catch (error: unknown) {
        console.error('[PATCH /api/settings/appearance]', error)
        return NextResponse.json(
            { error: 'Failed to update appearance settings' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────
// POST — Logo Upload
// ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'upload',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const tenantId = session.user.tenantId

    try {
        const formData = await req.formData()
        const file = formData.get('logo') as File | null
        const type = (formData.get('type') as string) || 'logo'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        const ALLOWED_MIME = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
        ] as const

        const isAllowedMime = (mime: string): mime is typeof ALLOWED_MIME[number] =>
            (ALLOWED_MIME as readonly string[]).includes(mime)

        if (!isAllowedMime(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WebP, SVG' },
                { status: 400 }
            )
        }

        const MAX_SIZE_BYTES = 2 * 1024 * 1024
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'File too large. Max size: 2MB' },
                { status: 400 }
            )
        }

        await connectDB()
        const school = await School.findById(tenantId)
            .select('plan addonLimits')
            .lean() as any

        const planId: PlanId = (school?.plan as PlanId) || 'starter'

        const storageCheck = await checkStorageLimit(
            tenantId,
            planId,
            file.size,
            school?.addonLimits
        )

        if (!storageCheck.canUpload) {
            return NextResponse.json(
                { error: storageCheck.message ?? 'Storage limit exceeded' },
                { status: 413 }
            )
        }

        let oldLogoUrl: string | null = null
        try {
            const existing = await SchoolSettings
                .findOne({ tenantId })
                .select('appearance.schoolLogo appearance.favicon')
                .lean() as {
                    appearance?: {
                        schoolLogo?: string
                        favicon?: string
                    }
                } | null

            oldLogoUrl = type === 'logo'
                ? existing?.appearance?.schoolLogo || null
                : existing?.appearance?.favicon || null
        } catch {
            console.warn('[appearance/upload] Old logo lookup failed — non-critical')
        }

        const url = await uploadFormFile(
            file,
            'logos',
            tenantId
        )

        await updateStorageUsage(tenantId, file.size)

        if (oldLogoUrl && oldLogoUrl !== url) {
            try {
                if (oldLogoUrl.includes('r2.cloudflarestorage.com')) {
                    const r2BaseUrl = process.env.R2_PUBLIC_URL || ''
                    if (r2BaseUrl && oldLogoUrl.startsWith(r2BaseUrl)) {
                        const key = oldLogoUrl.replace(`${r2BaseUrl}/`, '')
                        await deleteFromR2(key)
                    }
                } else if (oldLogoUrl.includes('cloudinary.com')) {
                    const parts = oldLogoUrl.split('/')
                    const publicIdWithExt = parts[parts.length - 1]
                    const publicId = publicIdWithExt.split('.')[0]
                    const folderIndex = parts.findIndex(p => p === 'school-saas')
                    if (folderIndex !== -1) {
                        const fullPublicId = parts.slice(folderIndex, -1).join('/') + '/' + publicId
                        await cloudinary.uploader.destroy(fullPublicId)
                    }
                }
            } catch (err) {
                console.warn('[appearance/upload] Old logo delete failed — non-critical:', err)
            }
        }

        const setFields: Record<string, unknown> = {}

        if (type === 'logo') {
            setFields['appearance.schoolLogo'] = url
            setFields['appearance.schoolLogoPublicId'] = url

            await School.findByIdAndUpdate(tenantId, {
                $set: { logo: url },
            })
        } else {
            setFields['appearance.favicon'] = url
            setFields['appearance.faviconPublicId'] = url
        }

        await SchoolSettings.findOneAndUpdate(
            { tenantId },
            { $set: setFields },
            { upsert: true }
        )

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'SETTINGS_CHANGE',
            resource: 'School',
            resourceId: tenantId,
            description: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded`,
            metadata: {
                type,
                size: file.size,
                url,
                storageProvider: getStorageProvider(),
                oldLogoUrl: oldLogoUrl || undefined,
            },
            ipAddress: 'unknown',
            userAgent: 'unknown',
        })

        return NextResponse.json({
            success: true,
            url,
            publicId: url,
            message: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`,
        })

    } catch (error: unknown) {
        console.error('[POST /api/settings/appearance]', error)
        return NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        )
    }
}