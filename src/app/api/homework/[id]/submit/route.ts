// FILE: src/app/api/homework/[id]/submit/route.ts
// ═══════════════════════════════════════════════════════════
// Student Homework Submission
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models/Homework'
import { logAudit } from '@/lib/audit'
import { sendMessage } from '@/lib/message'
import { submitHomeworkSchema } from '@/lib/validators/homework'
import { getModuleSettings } from '@/lib/getModuleSettings'

interface RouteContext {
    params: Promise<{ id: string }>
}

// ══════════════════════════════════════════════════════════
// POST — Submit Homework
// ══════════════════════════════════════════════════════════

export async function POST(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['student'],
        rateLimit: 'mutation',
        requiredModules: ['homework'],
    })

    if (guard instanceof NextResponse) return guard
    const { session, body, clientInfo } = guard

    try {
        await connectDB()

        const { id } = await context.params

        const homework = await Homework.findOne({
            _id: id,
            tenantId: session.user.tenantId,
            isActive: true,
            status: 'active',
        })

        if (!homework) {
            return NextResponse.json(
                { error: 'Homework not found' },
                { status: 404 }
            )
        }

        // Check if student is in target list
        const submissionIndex = homework.submissions.findIndex(
            (s: any) => s.studentId.toString() === session.user.id
        )

        if (submissionIndex === -1) {
            return NextResponse.json(
                { error: 'You are not assigned this homework' },
                { status: 403 }
            )
        }

        const submission = homework.submissions[submissionIndex] as any

        // Check if already submitted
        if (submission.status === 'submitted' || submission.status === 'graded') {
            return NextResponse.json(
                { error: 'Homework already submitted' },
                { status: 400 }
            )
        }

        // Check deadline
        const now = new Date()
        const dueDate = new Date(homework.dueDate)
        const isLate = now > dueDate

        if (isLate && !homework.allowLateSubmission) {
            return NextResponse.json(
                { error: 'Deadline passed and late submission not allowed' },
                { status: 400 }
            )
        }

        // Validate submission
        const validated = submitHomeworkSchema.parse(body)

        // Get module settings for file validation
        const moduleSettings = await getModuleSettings(session.user.tenantId)
        const hwSettings = moduleSettings.homework || {}
        const maxFileSizeMB = hwSettings.maxFileSizeMB || 10
        const allowedFileTypes = hwSettings.submissionFileTypes || [
            'pdf', 'jpg', 'jpeg', 'png', 'docx'
        ]

        // Validate file sizes and types
        for (const file of validated.attachments) {
            const fileSizeMB = file.size / (1024 * 1024)
            if (fileSizeMB > maxFileSizeMB) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds ${maxFileSizeMB}MB limit` },
                    { status: 400 }
                )
            }

            const fileExt = file.name.split('.').pop()?.toLowerCase()
            if (fileExt && !allowedFileTypes.includes(fileExt)) {
                return NextResponse.json(
                    { error: `File type .${fileExt} not allowed` },
                    { status: 400 }
                )
            }
        }

        // Update submission
        submission.submittedAt = now
        submission.isLate = isLate
        submission.attachments = validated.attachments
        submission.remarks = validated.remarks
        submission.status = isLate ? 'late' : 'submitted'

        // ✅ ADD — yeh line add karo
        homework.submissions[submissionIndex] = submission

        homework.markModified('submissions')

        const allSubs = homework.submissions as any[]
        homework.submittedCount = allSubs.filter(s =>
            s.status === 'submitted' || s.status === 'late' || s.status === 'graded'
        ).length
        homework.pendingCount = allSubs.filter(s => s.status === 'pending').length
        homework.lateCount = allSubs.filter(s => s.isLate === true).length

        await homework.save()

        // Send notification to teacher
        try {
            const teacher = await require('@/models/User').User.findById(homework.createdBy)
                .select('phone email name')
                .lean()

            if (teacher) {
                const message = `${session.user.name} submitted homework: ${homework.title} (${homework.subject})${isLate ? ' - LATE SUBMISSION' : ''}`

                if (teacher.phone) {
                    await sendMessage({
                        tenantId: session.user.tenantId,
                        channel: 'sms',
                        purpose: 'custom',
                        recipient: teacher.phone,
                        recipientName: teacher.name,
                        message: message + ` -${session.user.schoolName}`,
                        sentBy: session.user.id,
                        sentByName: session.user.name,
                        skipCreditCheck: false,
                    })
                }
            }
        } catch (err) {
            console.error('Teacher notification error:', err)
            // Don't fail submission if notification fails
        }

        // Audit log
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Homework',
            resourceId: homework._id.toString(),
            description: `Submitted homework: ${homework.title}${isLate ? ' (Late)' : ''}`,
            metadata: {
                homeworkId: homework._id.toString(),
                subject: homework.subject,
                isLate,
                filesCount: validated.attachments.length,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({
            success: true,
            message: isLate
                ? 'Homework submitted (marked as late)'
                : 'Homework submitted successfully',
            submission: homework.submissions[submissionIndex],
        })

    } catch (err: any) {
        console.error('Homework submit error:', err)

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Homework',
            description: `Failed to submit homework: ${err.message}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'FAILURE',
        })

        if (err.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: err.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: err.message || 'Failed to submit homework' },
            { status: 500 }
        )
    }
}