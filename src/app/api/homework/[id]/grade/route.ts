// FILE: src/app/api/homework/[id]/grade/route.ts
// ═══════════════════════════════════════════════════════════
// Teacher Grade Submission
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models/Homework'
import { logAudit } from '@/lib/audit'
import { sendMessage } from '@/lib/message'
import { gradeSubmissionSchema } from '@/lib/validators/homework'

interface RouteContext {
    params: Promise<{ id: string }>
}

// ══════════════════════════════════════════════════════════
// POST — Grade Submission
// ══════════════════════════════════════════════════════════

export async function POST(
    req: NextRequest,
    context: RouteContext
) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin', 'teacher'],
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
        })

        if (!homework) {
            return NextResponse.json(
                { error: 'Homework not found' },
                { status: 404 }
            )
        }

        // Permission check (teacher can only grade own homework)
        if (session.user.role === 'teacher') {
            if (homework.createdBy.toString() !== session.user.id) {
                return NextResponse.json(
                    { error: 'You can only grade your own homework' },
                    { status: 403 }
                )
            }
        }

        const validated = gradeSubmissionSchema.parse(body)

        // Find submission
        const submissionIndex = homework.submissions.findIndex(
            (s: any) => s.studentId.toString() === validated.studentId
        )

        if (submissionIndex === -1) {
            return NextResponse.json(
                { error: 'Student submission not found' },
                { status: 404 }
            )
        }

        const submission = homework.submissions[submissionIndex] as any

        // Check if submitted
        if (submission.status === 'pending') {
            return NextResponse.json(
                { error: 'Student has not submitted homework yet' },
                { status: 400 }
            )
        }

        // Update grade
        submission.grade = {
            marks: validated.marks,
            maxMarks: validated.maxMarks,
            grade: validated.grade,
            feedback: validated.feedback,
            gradedBy: session.user.id,
            gradedByName: session.user.name,
            gradedAt: new Date(),
        }
        submission.status = 'graded'

        homework.submissions[submissionIndex] = submission

        // Update graded count
        homework.gradedCount = homework.submissions.filter(
            (s: any) => s.status === 'graded'
        ).length

        await homework.save()

        // Send notification to student
        try {
            const Student = require('@/models/Student').Student
            const User = require('@/models/User').User

            const student = await Student.findOne({
                userId: validated.studentId,
                tenantId: session.user.tenantId,
            })
                .select('parentPhone parentEmail userId')
                .populate('userId', 'phone email name')
                .lean()

            if (student) {
                const gradeText = validated.marks !== undefined
                    ? `${validated.marks}/${validated.maxMarks}`
                    : validated.grade || 'Graded'

                const message = `Homework graded: ${homework.subject} - ${homework.title}. Grade: ${gradeText}. Login to view feedback.`

                // Notify student
                const studentUser = student.userId as any
                if (studentUser?.phone) {
                    await sendMessage({
                        tenantId: session.user.tenantId,
                        channel: 'sms',
                        purpose: 'custom',
                        recipient: studentUser.phone,
                        recipientName: studentUser.name,
                        message: message + ` -${session.user.schoolName}`,
                        sentBy: session.user.id,
                        sentByName: session.user.name,
                        skipCreditCheck: false,
                    })
                }

                // Notify parent
                if (student.parentPhone) {
                    await sendMessage({
                        tenantId: session.user.tenantId,
                        channel: 'sms',
                        purpose: 'custom',
                        recipient: student.parentPhone,
                        recipientName: `${studentUser?.name}'s Parent`,
                        message: `${studentUser?.name}'s homework graded: ${homework.subject}. Grade: ${gradeText}. ${validated.feedback || ''}`,
                        sentBy: session.user.id,
                        sentByName: session.user.name,
                        skipCreditCheck: false,
                    })
                }
            }
        } catch (err) {
            console.error('Student notification error:', err)
            // Don't fail grading if notification fails
        }

        // Audit log
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Homework',
            resourceId: homework._id.toString(),
            description: `Graded homework submission for ${submission.studentName}`,
            metadata: {
                homeworkId: homework._id.toString(),
                subject: homework.subject,
                studentId: validated.studentId,
                grade: validated.marks !== undefined
                    ? `${validated.marks}/${validated.maxMarks}`
                    : validated.grade,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({
            success: true,
            message: 'Homework graded successfully',
            submission: homework.submissions[submissionIndex],
        })

    } catch (err: any) {
        console.error('Homework grade error:', err)

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Homework',
            description: `Failed to grade homework: ${err.message}`,
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
            { error: err.message || 'Failed to grade homework' },
            { status: 500 }
        )
    }
}