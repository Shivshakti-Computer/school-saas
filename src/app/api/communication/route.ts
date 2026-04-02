// FILE: src/app/api/communication/route.ts
// UPDATED: Credit system integrated, MessageLog use karo
// BACKWARD COMPATIBLE — same response structure
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Communication, Student } from '@/models'
import { MessageLog } from '@/models/MessageLog'
import { sendBulkMessages } from '@/lib/messaging'
import { checkCredits } from '@/lib/credits'
import { apiGuard } from '@/lib/apiGuard'
import { RATE_LIMITS } from '@/lib/security'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    await connectDB()

    // Communication history + MessageLog dono se
    const [commHistory, msgLogs] = await Promise.all([
        Communication.find({ tenantId: guard.session.user.tenantId })
            .sort({ sentAt: -1 })
            .limit(30)
            .lean(),
        MessageLog.find({ tenantId: guard.session.user.tenantId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean(),
    ])

    return NextResponse.json({
        history: commHistory,
        messageLogs: msgLogs,
    })
}

export async function POST(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    await connectDB()

    const data = await req.json()
    const { tenantId, id: userId, name: userName } = guard.session.user

    // ── Get target students ──
    let students: any[] = []
    if (data.recipients === 'all') {
        students = await Student.find({
            tenantId,
            status: 'active',
        }).lean()
    } else if (data.recipients === 'class') {
        students = await Student.find({
            tenantId,
            class: data.targetClass,
            status: 'active',
        }).lean()
    } else if (data.recipients === 'section') {
        students = await Student.find({
            tenantId,
            class: data.targetClass,
            section: data.targetSection,
            status: 'active',
        }).lean()
    }

    if (students.length === 0) {
        return NextResponse.json(
            { error: 'Koi student nahi mila selected criteria mein' },
            { status: 400 }
        )
    }

    // ── Channel determine ──
    const channel = data.type === 'whatsapp'
        ? 'whatsapp'
        : data.type === 'email'
            ? 'email'
            : 'sms'

    // ── Pre-check credits ──
    const creditCheck = await checkCredits(tenantId, channel, students.length)
    if (!creditCheck.canSend) {
        return NextResponse.json(
            {
                error: creditCheck.message,
                code: 'INSUFFICIENT_CREDITS',
                balance: creditCheck.balance,
                required: creditCheck.required,
                purchaseUrl: '/admin/subscription',
            },
            { status: 402 } // Payment Required
        )
    }

    // ── Build recipients list ──
    const recipients = students
        .map(s => {
            const phone = s.parentPhone || s.phone
            const email = s.parentEmail || s.email
            const recipient = channel === 'email' ? email : phone

            if (!recipient) return null

            return {
                recipient,
                recipientName: s.name || 'Student',
                message: data.content,
            }
        })
        .filter(Boolean) as Array<{
            recipient: string
            recipientName: string
            message: string
        }>

    if (recipients.length === 0) {
        return NextResponse.json(
            { error: `Kisi bhi student ka ${channel} number/email nahi mila` },
            { status: 400 }
        )
    }

    // ── Send bulk messages ──
    const result = await sendBulkMessages({
        tenantId,
        channel,
        purpose: 'custom',
        recipients,
        sentBy: userId,
        sentByName: userName,
        subject: data.subject, // for email
    })

    // ── Log in Communication model (backward compat) ──
    const comm = await Communication.create({
        ...data,
        tenantId,
        sentBy: userId,
        totalSent: result.sent,
        totalFailed: result.failed,
        totalSkipped: result.skipped,
        creditsUsed: result.creditsUsed,
        channel,
        recipientCount: recipients.length,
    })

    return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        creditsUsed: result.creditsUsed,
        insufficientCredits: result.insufficientCredits,
        comm,
        // Warning if low credits
        lowCreditWarning: creditCheck.lowCreditWarning,
        remainingCredits: creditCheck.remaining,
    })
}