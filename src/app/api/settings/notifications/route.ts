// FILE: src/app/api/settings/notifications/route.ts
// ═══════════════════════════════════════════════════════════
// PATCH /api/settings/notifications
// Auto SMS, Email, WhatsApp triggers + quiet hours
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { isValidTime } from '@/types/settings'
import type { UpdateNotificationsBody } from '@/types/settings'

function validateNotifications(body: UpdateNotificationsBody): string | null {
    // Fee reminder days
    if (body.sms?.feeReminderDaysBefore !== undefined) {
        const days = body.sms.feeReminderDaysBefore
        if (days < 1 || days > 30) {
            return 'Fee reminder days must be between 1 and 30'
        }
    }
    if (body.email?.feeReminderDaysBefore !== undefined) {
        const days = body.email.feeReminderDaysBefore
        if (days < 1 || days > 30) {
            return 'Email fee reminder days must be between 1 and 30'
        }
    }

    // Quiet hours
    if (body.quietHours) {
        if (body.quietHours.start && !isValidTime(body.quietHours.start)) {
            return 'Invalid quiet hours start time'
        }
        if (body.quietHours.end && !isValidTime(body.quietHours.end)) {
            return 'Invalid quiet hours end time'
        }
    }

    return null
}

export async function PATCH(req: NextRequest) {
    const guard = await apiGuardWithBody<UpdateNotificationsBody>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'SETTINGS_CHANGE',
        auditResource: 'School',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId

    const validationError = validateNotifications(body)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    try {
        await connectDB()

        // ── Deep merge — sirf provided fields update karo ──
        const setFields: Record<string, any> = {
            lastUpdatedBy: session.user.id,
            lastUpdatedByName: session.user.name,
        }

        // SMS fields
        if (body.sms) {
            Object.entries(body.sms).forEach(([key, val]) => {
                if (val !== undefined) {
                    setFields[`notifications.sms.${key}`] = val
                }
            })
        }

        // Email fields
        if (body.email) {
            Object.entries(body.email).forEach(([key, val]) => {
                if (val !== undefined) {
                    setFields[`notifications.email.${key}`] = val
                }
            })
        }

        // WhatsApp fields
        if (body.whatsapp) {
            Object.entries(body.whatsapp).forEach(([key, val]) => {
                if (val !== undefined) {
                    setFields[`notifications.whatsapp.${key}`] = val
                }
            })
        }

        // Quiet hours
        if (body.quietHours) {
            Object.entries(body.quietHours).forEach(([key, val]) => {
                if (val !== undefined) {
                    setFields[`notifications.quietHours.${key}`] = val
                }
            })
        }

        const updated = await SchoolSettings.findOneAndUpdate(
            { tenantId },
            { $set: setFields },
            { new: true, upsert: true }
        ).select('notifications').lean() as any

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'SETTINGS_CHANGE',
            resource: 'School',
            resourceId: tenantId,
            description: 'Notification settings updated',
            newData: body,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Notification settings updated successfully',
            notifications: updated?.notifications,
        })

    } catch (error: any) {
        console.error('[PATCH /api/settings/notifications]', error)
        return NextResponse.json(
            { error: 'Failed to update notification settings' },
            { status: 500 }
        )
    }
}