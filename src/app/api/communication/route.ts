// FILE: src/app/api/communication/route.ts
// FIXED:
//   1. Academic year filter in Student.find()
//   2. Template variables from shared config
//   3. Proper credit rounding
//   4. Email HTML properly passed to sendBulkMessages
//   5. academicYears from Student.distinct + sessionHistory
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { Communication } from '@/models/Communication'
import { Student } from '@/models/Student'
import { MessageLog } from '@/models/MessageLog'
import { MessageCredit } from '@/models/MessageCredit'
import { sendBulkMessages } from '@/lib/message'
import { Types } from 'mongoose'
import { School } from '@/models'
import {
    getTemplateById,
    replaceTemplateVariables,
} from '@/config/messageTemplates'
import { getCurrentAcademicYear } from '@/lib/academicYear'

// ── Helpers ──────────────────────────────────────────────

function roundCredits(value: number): number {
    return Math.round(value * 100) / 100
}

function isHtmlString(text: string): boolean {
    return /<[a-z][\s\S]*>/i.test(text)
}

// ══════════════════════════════════════════════════════════
// GET — History + Stats + Academic Years
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard

    await connectDB()

    const tenantId = guard.session.user.tenantId

    try {
        // ── History ─────────────────────────────────────────
        const history = await Communication.find({ tenantId })
            .sort({ sentAt: -1 })
            .limit(50)
            .lean()

        // ── Stats ────────────────────────────────────────────
        const messageLogs = await MessageLog.aggregate([
            {
                $match: {
                    tenantId: new Types.ObjectId(tenantId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalSent: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'sent'] }, 1, 0],
                        },
                    },
                    totalFailed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
                        },
                    },
                    creditsUsed: { $sum: '$creditsUsed' },
                },
            },
        ])

        // ── Credit Balance ────────────────────────────────────
        let creditBalance = 0

        const creditDoc = await MessageCredit.findOne({
            tenantId: new Types.ObjectId(tenantId),
        })
            .select('balance')
            .lean() as any

        if (creditDoc) {
            creditBalance = roundCredits(creditDoc.balance || 0)
        } else {
            creditBalance = roundCredits(
                guard.session.user.creditBalance || 0
            )
        }

        const stats = {
            totalSent: messageLogs[0]?.totalSent || 0,
            totalFailed: messageLogs[0]?.totalFailed || 0,
            creditsUsed: roundCredits(messageLogs[0]?.creditsUsed || 0),
            creditBalance,
        }

        // ── Academic Years ────────────────────────────────────
        // Current academicYear field se distinct
        const currentYears = await Student.distinct('academicYear', {
            tenantId,
        }) as string[]

        // sessionHistory ke andar ke years bhi include karo
        // (promoted students ke purane years)
        const historyAgg = await Student.aggregate([
            {
                $match: { tenantId: new Types.ObjectId(tenantId) },
            },
            { $unwind: '$sessionHistory' },
            {
                $group: {
                    _id: '$sessionHistory.academicYear',
                },
            },
            {
                $match: {
                    _id: { $nin: [null, ''] },
                },
            },
        ])

        const historyYears = historyAgg
            .map((h: any) => h._id as string)
            .filter(Boolean)

        // Combine + deduplicate + sort descending
        const allYears = [
            ...new Set([...currentYears, ...historyYears]),
        ]
            .filter(Boolean)
            .sort((a, b) => b.localeCompare(a))

        return NextResponse.json({
            success: true,
            history,
            stats,
            academicYears: allYears,
            currentAcademicYear: getCurrentAcademicYear(),
        })

    } catch (error: any) {
        console.error('[COMMUNICATION-API GET] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch communication data',
                stats: {
                    totalSent: 0,
                    totalFailed: 0,
                    creditsUsed: 0,
                    creditBalance: 0,
                },
                academicYears: [],
                currentAcademicYear: getCurrentAcademicYear(),
            },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// POST — Send Bulk Message
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard

    await connectDB()

    const data = guard.body as any
    const { tenantId, id: userId, name: userName } =
        guard.session.user

    // ── Validate ──────────────────────────────────────────
    if (!data.channel || !data.message) {
        return NextResponse.json(
            { error: 'Channel and message are required' },
            { status: 400 }
        )
    }

    if (!data.academicYear) {
        return NextResponse.json(
            { error: 'Academic year is required' },
            { status: 400 }
        )
    }

    if (data.channel === 'email' && !data.subject?.trim()) {
        return NextResponse.json(
            { error: 'Email subject is required' },
            { status: 400 }
        )
    }

    if (data.recipients === 'class' && !data.targetClass) {
        return NextResponse.json(
            { error: 'Target class is required' },
            { status: 400 }
        )
    }

    if (
        data.recipients === 'section' &&
        (!data.targetClass || !data.targetSection)
    ) {
        return NextResponse.json(
            { error: 'Target class and section are required' },
            { status: 400 }
        )
    }

    // ── School Name ───────────────────────────────────────
    const school = await School.findById(tenantId)
        .select('name')
        .lean() as any
    const schoolName = school?.name || 'School'

    // ── Fetch Students ────────────────────────────────────────
    const currentAcYear = getCurrentAcademicYear()
    const isCurrentYear = data.academicYear === currentAcYear

    const baseMatch: Record<string, any> = {
        tenantId,
        status: 'active',
    }

    const classFilter = data.targetClass
    const sectionFilter = data.targetSection

    let students: any[] = []

    if (isCurrentYear) {
        const query: Record<string, any> = {
            ...baseMatch,
            academicYear: data.academicYear,
        }

        if (data.recipients === 'class' && classFilter) {
            query.class = classFilter
        } else if (
            data.recipients === 'section' &&
            classFilter &&
            sectionFilter
        ) {
            query.class = classFilter
            query.section = sectionFilter
        }

        students = await Student.find(query)
            .select('parentPhone parentEmail class section fatherName userId')
            .populate('userId', 'name phone email')   // ✅ name add
            .lean()

    } else {
        const historyMatch: Record<string, any> = {
            ...baseMatch,
            'sessionHistory.academicYear': data.academicYear,
        }

        if (data.recipients === 'class' && classFilter) {
            historyMatch['sessionHistory.class'] = classFilter
        } else if (
            data.recipients === 'section' &&
            classFilter &&
            sectionFilter
        ) {
            historyMatch['sessionHistory.class'] = classFilter
            historyMatch['sessionHistory.section'] = sectionFilter
        }

        const directMatch: Record<string, any> = {
            ...baseMatch,
            academicYear: data.academicYear,
        }

        if (data.recipients === 'class' && classFilter) {
            directMatch.class = classFilter
        } else if (
            data.recipients === 'section' &&
            classFilter &&
            sectionFilter
        ) {
            directMatch.class = classFilter
            directMatch.section = sectionFilter
        }

        const [historyStudents, directStudents] = await Promise.all([
            Student.find(historyMatch)
                .select('parentPhone parentEmail class section fatherName userId')
                .populate('userId', 'name phone email')  // ✅ name add
                .lean(),
            Student.find(directMatch)
                .select('parentPhone parentEmail class section fatherName userId')
                .populate('userId', 'name phone email')  // ✅ name add
                .lean(),
        ])

        const seen = new Set<string>()
        students = [...historyStudents, ...directStudents].filter(s => {
            const id = s._id.toString()
            if (seen.has(id)) return false
            seen.add(id)
            return true
        })
    }

    if (students.length === 0) {
        return NextResponse.json(
            {
                error:
                    `No active students found for academic year ` +
                    `${data.academicYear}` +
                    (data.targetClass ? ` in Class ${data.targetClass}` : '') +
                    (data.targetSection ? `-${data.targetSection}` : ''),
            },
            { status: 400 }
        )
    }

    // ── Build Recipients List ─────────────────────────────────
    const recipients: Array<{
        recipient: string
        recipientName: string
        message: string
    }> = []

    for (const s of students) {
        // ── Contact determine karo ──────────────────────────────
        let contact: string | undefined

        if (data.recipientType === 'student') {
            contact =
                data.channel === 'email'
                    ? (s.userId as any)?.email
                    : (s.userId as any)?.phone
        } else {
            // parent (default)
            contact =
                data.channel === 'email'
                    ? s.parentEmail
                    : s.parentPhone
        }

        if (!contact) continue

        // ── Student name — User model se ───────────────────────
        // Student model mein name field nahi hai
        // naam sirf userId (User) mein hai
        const studentName =
            (s.userId as any)?.name ||   // ✅ Primary — User model
            s.fatherName ||               // Fallback — father name
            'Student'                     // Last resort

        const classSection =
            `${s.class}${s.section ? '-' + s.section : ''}`

        // ── Variable values ─────────────────────────────────────
        const variableValues: Record<string, string> = {
            STUDENT_NAME: studentName,    // ✅ Sahi naam
            SCHOOL_NAME: schoolName,
            CLASS: classSection,
            DATE: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            DUE_DATE: data.dueDate || 'soon',
            AMOUNT: data.amount ? String(data.amount) : '0',
            EXAM_NAME: data.examName || 'Exam',
            MESSAGE: data.customMessage || data.message,
        }

        // ── Message personalize karo ────────────────────────────
        const personalizedMsg = replaceTemplateVariables(
            data.message,
            variableValues
        )

        recipients.push({
            recipient: contact,
            recipientName: studentName,
            message: personalizedMsg,
        })
    }

    if (recipients.length === 0) {
        return NextResponse.json(
            {
                error:
                    `No valid ${data.channel} contacts found. ` +
                    `${data.recipientType === 'student'
                        ? 'Students'
                        : 'Parents'
                    } ke paas ${data.channel} contact nahi hai.`,
            },
            { status: 400 }
        )
    }

    // ── Send Bulk ─────────────────────────────────────────
    const result = await sendBulkMessages({
        tenantId,
        channel: data.channel,
        purpose: data.purpose || 'custom',
        recipients,
        sentBy: userId,
        sentByName: userName,
        subject: data.subject,
    })

    // ── Insufficient Credits ──────────────────────────────
    if (result.insufficientCredits) {
        const creditDoc = await MessageCredit.findOne({
            tenantId: new Types.ObjectId(tenantId),
        })
            .select('balance')
            .lean() as any

        return NextResponse.json(
            {
                error: 'Insufficient credits',
                code: 'INSUFFICIENT_CREDITS',
                balance: creditDoc?.balance || 0,
                required: recipients.length,
                purchaseUrl: '/admin/subscription',
            },
            { status: 402 }
        )
    }

    // ── Log in Communication Model ────────────────────────
    const comm = await Communication.create({
        tenantId,
        channel: data.channel,
        purpose: data.purpose || 'custom',
        title: data.subject || data.purpose,
        message: data.message,
        recipients: data.recipients,
        targetClass: data.targetClass,
        targetSection: data.targetSection,
        recipientType: data.recipientType || 'parent',
        academicYear: data.academicYear,
        totalSent: result.sent,
        totalFailed: result.failed,
        totalSkipped: result.skipped,
        creditsUsed: roundCredits(result.creditsUsed),
        sentBy: userId,
        sentByName: userName,
        sentAt: new Date(),
    })

    return NextResponse.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        creditsUsed: roundCredits(result.creditsUsed),
        totalStudents: students.length,
        validContacts: recipients.length,
        comm,
    })
}