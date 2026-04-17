// FILE: src/app/api/homework/parent/route.ts
// ═══════════════════════════════════════════════════════════
// Parent Portal — View Child's Homework
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models/Homework'
import { Student } from '@/models/Student'
import { getCurrentAcademicYear } from '@/lib/academicYear'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['parent'],
        rateLimit: 'api',
        requiredModules: ['homework'],
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const url = new URL(req.url)
        const childId = url.searchParams.get('childId')

        if (!childId) {
            return NextResponse.json(
                { error: 'Child ID is required' },
                { status: 400 }
            )
        }

        // Verify child belongs to parent
        const child = await Student.findOne({
            userId: childId,
            tenantId: session.user.tenantId,
            status: 'active',
        })
            .select('class section')
            .populate('userId', 'name')
            .lean()

        if (!child) {
            return NextResponse.json(
                { error: 'Child not found' },
                { status: 404 }
            )
        }

        // TODO: Add parent verification (parentId field in Student model)

        const academicYear = getCurrentAcademicYear()

        // Find homework for child's class
        const homework = await Homework.find({
            tenantId: session.user.tenantId,
            academicYear,
            isActive: true,
            status: 'active',
            class: child.class,
            'submissions.studentId': childId,
        })
            .sort({ dueDate: 1 })
            .limit(50)
            .lean()

        // Extract child's submission
        const homeworkWithSubmission = homework.map((hw) => {
            const childSubmission = hw.submissions.find(
                (s: any) => s.studentId.toString() === childId
            )

            return {
                _id: hw._id,
                title: hw.title,
                description: hw.description,
                subject: hw.subject,
                class: hw.class,
                section: hw.section,
                assignedDate: hw.assignedDate,
                dueDate: hw.dueDate,
                attachments: hw.attachments,
                createdByName: hw.createdByName,
                submission: childSubmission || null,
            }
        })

        // Stats
        const pending = homeworkWithSubmission.filter(
            (hw) => hw.submission?.status === 'pending'
        ).length

        const submitted = homeworkWithSubmission.filter(
            (hw) =>
                hw.submission?.status === 'submitted' ||
                hw.submission?.status === 'late'
        ).length

        const graded = homeworkWithSubmission.filter(
            (hw) => hw.submission?.status === 'graded'
        ).length

        const overdue = homeworkWithSubmission.filter(
            (hw) =>
                hw.submission?.status === 'pending' &&
                new Date(hw.dueDate) < new Date()
        ).length

        return NextResponse.json({
            homework: homeworkWithSubmission,
            child: {
                id: childId,
                name: (child.userId as any)?.name,
                class: child.class,
                section: child.section,
            },
            stats: {
                pending,
                submitted,
                graded,
                overdue,
            },
        })

    } catch (err: any) {
        console.error('Parent homework GET error:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to fetch homework' },
            { status: 500 }
        )
    }
}