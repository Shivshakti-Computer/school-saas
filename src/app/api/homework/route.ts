// FILE: src/app/api/homework/route.ts
// ═══════════════════════════════════════════════════════════
// Homework CRUD — Admin & Teacher
// ✅ FIXED: Academic year handling for teacher homework creation
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models/Homework'
import { Student } from '@/models/Student'
import { logAudit } from '@/lib/audit'
import { sendBulkMessages } from '@/lib/message'
import { PUSH_TEMPLATES, sendPushToTenant } from '@/lib/push'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import { getModuleSettings } from '@/lib/getModuleSettings'
import {
    createHomeworkSchema,
    homeworkFilterSchema,
    type CreateHomeworkInput,
} from '@/lib/validators/homework'

// ══════════════════════════════════════════════════════════
// GET — List Homework
// ══════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff'],
        rateLimit: 'api',
        requiredModules: ['homework'],
        auditAction: 'VIEW',
        auditResource: 'Homework',
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const url = new URL(req.url)
        const rawFilters = {
            status: url.searchParams.get('status') || undefined,
            class: url.searchParams.get('class') || undefined,
            section: url.searchParams.get('section') || undefined,
            subject: url.searchParams.get('subject') || undefined,
            search: url.searchParams.get('search') || undefined,
            dateFrom: url.searchParams.get('dateFrom') || undefined,
            dateTo: url.searchParams.get('dateTo') || undefined,
            page: parseInt(url.searchParams.get('page') || '1'),
            limit: parseInt(url.searchParams.get('limit') || '20'),
            sortBy: url.searchParams.get('sortBy') || 'dueDate',
            sortOrder: url.searchParams.get('sortOrder') || 'asc',
        }

        const filters = homeworkFilterSchema.parse(rawFilters)

        const query: any = {
            tenantId: session.user.tenantId,
            isActive: true,
        }

        if (session.user.role === 'teacher') {
            query.createdBy = session.user.id
        }

        if (filters.status) query.status = filters.status
        if (filters.class) query.class = filters.class
        if (filters.section) query.section = filters.section
        if (filters.subject) query.subject = filters.subject

        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ]
        }

        if (filters.dateFrom || filters.dateTo) {
            query.dueDate = {}
            if (filters.dateFrom) {
                query.dueDate.$gte = new Date(filters.dateFrom)
            }
            if (filters.dateTo) {
                query.dueDate.$lte = new Date(filters.dateTo)
            }
        }

        const total = await Homework.countDocuments(query)
        const skip = (filters.page - 1) * filters.limit
        const pages = Math.ceil(total / filters.limit)

        const sort: any = {}
        sort[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1

        const homework = await Homework.find(query)
            .sort(sort)
            .skip(skip)
            .limit(filters.limit)
            .lean()

        // Stats
        let stats
        if (session.user.role === 'admin' || session.user.role === 'teacher') {
            const statsQuery: any = {
                tenantId: session.user.tenantId,
                isActive: true,
                ...(session.user.role === 'teacher' && {
                    createdBy: session.user.id,
                }),
            }

            const now = new Date()

            const allHomework = await Homework.find(statsQuery)
                .select('status dueDate submittedCount pendingCount lateCount gradedCount')
                .lean()

            stats = {
                total,
                active: allHomework.filter(h =>
                    h.status === 'active' && new Date(h.dueDate) >= now
                ).length,
                overdue: allHomework.filter(h =>
                    h.status === 'active' &&
                    new Date(h.dueDate) < now &&
                    (h.pendingCount ?? 0) > 0
                ).length,
                totalSubmitted: allHomework.reduce(
                    (sum, h) => sum + (h.submittedCount ?? 0), 0
                ),
                totalPending: allHomework.reduce(
                    (sum, h) => sum + (h.pendingCount ?? 0), 0
                ),
            }
        }

        return NextResponse.json({
            homework,
            total,
            page: filters.page,
            limit: filters.limit,
            pages,
            stats,
        })

    } catch (err: any) {
        console.error('Homework GET error:', err)

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'VIEW',
            resource: 'Homework',
            description: `Failed to fetch homework: ${err.message}`,
            ipAddress: 'unknown',
            userAgent: 'unknown',
            status: 'FAILURE',
        })

        return NextResponse.json(
            { error: err.message || 'Failed to fetch homework' },
            { status: 500 }
        )
    }
}

// ══════════════════════════════════════════════════════════
// POST — Create Homework with Notifications
// ✅ FIXED: Proper academic year handling
// ══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<CreateHomeworkInput>(req, {
        allowedRoles: ['admin', 'teacher'],
        rateLimit: 'mutation',
        requiredModules: ['homework'],
        auditAction: 'CREATE',
        auditResource: 'Homework',
    })

    if (guard instanceof NextResponse) return guard
    const { session, body, clientInfo } = guard

    try {
        await connectDB()

        const validated = createHomeworkSchema.parse(body)
        
        // ✅ FIX: Extract academic year with multiple fallbacks
        const academicYear = (body as any).academicYear || 
                            (body as any).notifAcademicYear || 
                            getCurrentAcademicYear()

        console.log('[HOMEWORK POST] Request Details:', {
            role: session.user.role,
            academicYear,
            class: validated.class,
            section: validated.section || 'All Sections',
            subject: validated.subject,
        })

        // Get module settings
        const moduleSettings = await getModuleSettings(session.user.tenantId)
        const hwSettings = moduleSettings.homework || {}

        // Apply settings
        const maxFileSizeMB = hwSettings.maxFileSizeMB || 10
        const allowedFileTypes = hwSettings.submissionFileTypes || [
            'pdf', 'jpg', 'jpeg', 'png', 'docx'
        ]

        // ✅ FIX: Build student query with proper academic year
        const studentQuery: any = {
            tenantId: session.user.tenantId,
            academicYear: academicYear,
            class: validated.class,
            status: 'active',
        }

        // ✅ Only add section if explicitly provided and not empty
        if (validated.section && validated.section.trim() !== '') {
            studentQuery.section = validated.section
        }

        // ✅ Add target students filter if provided
        if (validated.targetStudents && validated.targetStudents.length > 0) {
            studentQuery._id = { $in: validated.targetStudents }
        }

        console.log('[HOMEWORK POST] Student Query:', JSON.stringify(studentQuery, null, 2))

        // ✅ Find students with detailed logging
        const students = await Student.find(studentQuery)
            .select('_id userId rollNumber')
            .populate('userId', 'name phone email')
            .lean()

        console.log('[HOMEWORK POST] Students Found:', students.length)

        if (students.length === 0) {
            // ✅ Enhanced error with debug information
            console.error('[HOMEWORK POST] No students found. Debug info:', {
                query: studentQuery,
                academicYear,
                class: validated.class,
                section: validated.section || 'All',
            })

            // ✅ Check if students exist with different criteria
            const debugCount = await Student.countDocuments({
                tenantId: session.user.tenantId,
                class: validated.class,
                status: 'active',
            })

            const debugCountWithYear = await Student.countDocuments({
                tenantId: session.user.tenantId,
                academicYear: academicYear,
                status: 'active',
            })

            return NextResponse.json(
                { 
                    error: 'No students found for selected class/section',
                    debug: {
                        academicYear,
                        class: validated.class,
                        section: validated.section || 'All Sections',
                        query: studentQuery,
                        studentsInClass: debugCount,
                        studentsInAcademicYear: debugCountWithYear,
                        hint: debugCount > 0 
                            ? 'Students exist in this class but not in the selected academic year'
                            : 'No students found in this class at all'
                    }
                },
                { status: 400 }
            )
        }

        // ✅ Create homework with pre-filled submissions
        const submissions = students.map((s: any) => ({
            studentId: s.userId._id,
            studentName: s.userId.name,
            studentClass: validated.class,
            studentSection: validated.section || '',
            rollNumber: (s as any).rollNumber || '',
            status: 'pending',
            isLate: false,
            attachments: [],
        }))

        const homework = await Homework.create({
            tenantId: session.user.tenantId,
            academicYear,
            title: validated.title,
            description: validated.description,
            subject: validated.subject,
            class: validated.class,
            section: validated.section,
            targetStudents: validated.targetStudents,
            dueDate: validated.dueDate,
            allowLateSubmission: validated.allowLateSubmission,
            attachments: validated.attachments || [],
            submissions,
            totalStudents: students.length,
            submittedCount: 0,
            pendingCount: students.length,
            lateCount: 0,
            gradedCount: 0,
            maxFileSizeMB,
            allowedFileTypes,
            createdBy: session.user.id,
            createdByName: session.user.name,
            createdByRole: session.user.role,
            status: 'active',
            isActive: true,
        })

        console.log('[HOMEWORK POST] Homework Created:', {
            id: homework._id,
            totalStudents: students.length,
        })

        // ✅ Send notifications
        let smsResult: any = null
        let whatsappResult: any = null
        let emailResult: any = null
        let pushSent = false

        if (validated.sendNotification) {
            const channels = validated.notificationChannels || {
                sms: false,
                whatsapp: false,
                email: false,
                push: true,
            }

            const dueFormatted = new Date(validated.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })

            // ── SMS ──
            if (channels.sms) {
                const studentsWithPhone = await Student.find({
                    _id: { $in: students.map((s: any) => s._id) }
                })
                    .select('_id parentPhone userId')
                    .populate('userId', 'name phone')
                    .lean()

                const smsRecipients = studentsWithPhone
                    .filter((s: any) => s.parentPhone || (s.userId as any)?.phone)
                    .map((s: any) => ({
                        recipient: s.parentPhone || (s.userId as any).phone,
                        recipientName: (s.userId as any)?.name + "'s Parent" || 'Parent',
                        message: `New homework: ${validated.subject} for Class ${validated.class}. Due: ${dueFormatted}. Login to submit. -${session.user.schoolName}`,
                    }))

                if (smsRecipients.length > 0) {
                    smsResult = await sendBulkMessages({
                        tenantId: session.user.tenantId,
                        channel: 'sms',
                        purpose: 'custom',
                        recipients: smsRecipients,
                        sentBy: session.user.id,
                        sentByName: session.user.name,
                    })

                    if (!smsResult.insufficientCredits) {
                        homework.notificationSent = true
                    }
                }
            }

            // ── WhatsApp ──
            if (channels.whatsapp) {
                const studentsWithPhone = await Student.find({
                    _id: { $in: students.map((s: any) => s._id) }
                })
                    .select('_id parentPhone userId')
                    .populate('userId', 'name phone')
                    .lean()

                const waRecipients = studentsWithPhone
                    .filter((s: any) => s.parentPhone || (s.userId as any)?.phone)
                    .map((s: any) => ({
                        recipient: s.parentPhone || (s.userId as any).phone,
                        recipientName: (s.userId as any)?.name + "'s Parent" || 'Parent',
                        message: `📚 *New Homework*\n\n*Subject:* ${validated.subject}\n*Class:* ${validated.class}\n*Due Date:* ${dueFormatted}\n\n*Title:* ${validated.title}\n\n${validated.description}\n\nLogin to student portal to submit.\n\nRegards,\n${session.user.schoolName}`,
                    }))

                if (waRecipients.length > 0) {
                    whatsappResult = await sendBulkMessages({
                        tenantId: session.user.tenantId,
                        channel: 'whatsapp',
                        purpose: 'custom',
                        recipients: waRecipients,
                        sentBy: session.user.id,
                        sentByName: session.user.name,
                    })

                    if (!whatsappResult.insufficientCredits) {
                        homework.notificationSent = true
                    }
                }
            }

            // ── Email ──
            if (channels.email) {
                const studentsWithEmail = await Student.find({
                    _id: { $in: students.map((s: any) => s._id) }
                })
                    .select('_id parentEmail userId')
                    .populate('userId', 'name')
                    .lean()

                const emailRecipients = studentsWithEmail
                    .filter((s: any) => s.parentEmail && s.parentEmail.trim() !== '')
                    .map((s: any) => ({
                        recipient: s.parentEmail,
                        recipientName: (s.userId as any)?.name + "'s Parent" || 'Parent',
                        message: `New homework assigned for ${validated.subject}.\n\nTitle: ${validated.title}\nDue Date: ${dueFormatted}\n\n${validated.description}\n\nLogin to student portal to view details and submit.\n\nRegards,\n${session.user.schoolName}`,
                    }))

                if (emailRecipients.length > 0) {
                    emailResult = await sendBulkMessages({
                        tenantId: session.user.tenantId,
                        channel: 'email',
                        purpose: 'custom',
                        recipients: emailRecipients,
                        sentBy: session.user.id,
                        sentByName: session.user.name,
                        subject: `New Homework: ${validated.subject} — ${session.user.schoolName}`,
                    })

                    if (!emailResult.insufficientCredits) {
                        homework.notificationSent = true
                    }
                } else {
                    console.log('[HOMEWORK] No parent emails found for notifications')
                }
            }

            // ── Push ──
            if (channels.push) {
                try {
                    await sendPushToTenant(
                        session.user.tenantId,
                        ['student'],
                        {
                            title: `New Homework: ${validated.subject}`,
                            body: `${validated.title} — Due: ${dueFormatted}`,
                        }
                    )
                    pushSent = true
                } catch (err) {
                    console.error('Push notification error:', err)
                }
            }

            await homework.save()
        }

        // ✅ Calculate total credits used
        let totalCreditsUsed = 0
        if (smsResult && !smsResult.insufficientCredits) {
            totalCreditsUsed += smsResult.creditsUsed || 0
        }
        if (whatsappResult && !whatsappResult.insufficientCredits) {
            totalCreditsUsed += whatsappResult.creditsUsed || 0
        }
        if (emailResult && !emailResult.insufficientCredits) {
            totalCreditsUsed += emailResult.creditsUsed || 0
        }

        homework.creditsUsed = Math.round(totalCreditsUsed * 100) / 100
        await homework.save()

        // Audit log
        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Homework',
            resourceId: homework._id.toString(),
            description: `Created homework: ${validated.title} for Class ${validated.class}${validated.section ? `-${validated.section}` : ''} (${academicYear})`,
            metadata: {
                subject: validated.subject,
                class: validated.class,
                section: validated.section,
                academicYear,
                totalStudents: students.length,
                dueDate: validated.dueDate,
                notificationSent: homework.notificationSent,
            },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        const saved = await Homework.findById(homework._id).lean()

        return NextResponse.json({
            homework: saved,
            notifications: {
                sms: smsResult,
                whatsapp: whatsappResult,
                email: emailResult,
                push: { sent: pushSent },
            },
        }, { status: 201 })

    } catch (err: any) {
        console.error('Homework POST error:', err)

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Homework',
            description: `Failed to create homework: ${err.message}`,
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
            { error: err.message || 'Failed to create homework' },
            { status: 500 }
        )
    }
}