// FILE: src/app/api/settings/appearance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'                          // ✅ top-level import
import type { 
    UploadApiResponse, 
    UploadApiErrorResponse,
    UploadApiOptions          // ✅ yeh sahi type hai options ke liye
} from 'cloudinary'
import { apiGuardWithBody, apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { isValidHexColor } from '@/types/settings'
import type { UpdateAppearanceBody } from '@/types/settings'

// ── Cloudinary config — module level ──────────────────────
// ✅ Ek baar config karo, har request pe nahi
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
})

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
// Upload helper — Promise wrapper around upload_stream
// ✅ Proper Cloudinary types use kiye
// ─────────────────────────────────────────────────────────

function uploadToCloudinary(
    buffer: Buffer,
    options: UploadApiOptions  // ✅ correct type
): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                options,
                (
                    err: UploadApiErrorResponse | undefined,
                    result: UploadApiResponse | undefined
                ) => {
                    if (err)     return reject(err)
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

    const validationError = validateAppearance(body)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    try {
        await connectDB()

        const setFields: Record<string, unknown> = {
            lastUpdatedBy: session.user.id,
            lastUpdatedByName: session.user.name,
        }

        // Logo
        if (body.schoolLogo !== undefined) {
            setFields['appearance.schoolLogo'] = body.schoolLogo
            setFields['appearance.schoolLogoPublicId'] = body.schoolLogoPublicId || ''

            await School.findByIdAndUpdate(tenantId, {
                $set: { logo: body.schoolLogo },
            })
        }

        // Favicon
        if (body.favicon !== undefined) {
            setFields['appearance.favicon'] = body.favicon
        }

        // Portal theme
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

        // Print header
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
            description: 'Appearance settings updated',
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
// POST — Logo Upload (multipart/form-data)
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

        // ── Validate file ──────────────────────────────────
        const ALLOWED_MIME = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
        ] as const

        type AllowedMime = typeof ALLOWED_MIME[number]

        // ✅ Type-safe mime check
        const isAllowedMime = (mime: string): mime is AllowedMime =>
            (ALLOWED_MIME as readonly string[]).includes(mime)

        if (!isAllowedMime(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WebP, SVG' },
                { status: 400 }
            )
        }

        const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'File too large. Max size: 2MB' },
                { status: 400 }
            )
        }

        // ── Upload to Cloudinary ───────────────────────────
        const buffer = Buffer.from(await file.arrayBuffer())
        const folder = `school-saas/logos/${tenantId}`
        const publicId = `${type}_${Date.now()}`
        const isSVG = file.type === 'image/svg+xml'

        // ✅ uploadToCloudinary helper use karo — proper types
        const uploadResult = await uploadToCloudinary(buffer, {
            folder,
            public_id: publicId,
            resource_type: 'image',
            ...(!isSVG && {
                transformation: [
                    {
                        width: 400,
                        height: 400,
                        crop: 'limit',
                        quality: 'auto',
                        fetch_format: 'auto',
                    },
                ],
            }),
        })

        // ── Delete old logo ────────────────────────────────
        try {
            await connectDB()

            const existing = await SchoolSettings
                .findOne({ tenantId })
                .select('appearance.schoolLogoPublicId appearance.faviconPublicId')
                .lean() as {
                    appearance?: {
                        schoolLogoPublicId?: string
                        faviconPublicId?: string
                    }
                } | null                                   // ✅ lean() type cast

            const oldPublicId =
                type === 'logo'
                    ? existing?.appearance?.schoolLogoPublicId
                    : existing?.appearance?.faviconPublicId

            if (oldPublicId && oldPublicId !== uploadResult.public_id) {
                await cloudinary.uploader.destroy(oldPublicId)
            }
        } catch {
            // Old logo delete fail — non-critical, log only
            console.warn('[appearance/upload] Old logo delete failed — non-critical')
        }

        // ── Save to DB ─────────────────────────────────────
        await connectDB()
        const setFields: Record<string, unknown> = {}

        if (type === 'logo') {
            setFields['appearance.schoolLogo'] = uploadResult.secure_url
            setFields['appearance.schoolLogoPublicId'] = uploadResult.public_id

            await School.findByIdAndUpdate(tenantId, {
                $set: { logo: uploadResult.secure_url },
            })
        } else {
            setFields['appearance.favicon'] = uploadResult.secure_url
            setFields['appearance.faviconPublicId'] = uploadResult.public_id
        }

        await SchoolSettings.findOneAndUpdate(
            { tenantId },
            { $set: setFields },
            { upsert: true }
        )

        return NextResponse.json({
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
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