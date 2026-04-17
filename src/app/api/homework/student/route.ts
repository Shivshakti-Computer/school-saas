// FILE: src/app/api/homework/student/route.ts
// ═══════════════════════════════════════════════════════════
// Student Portal — List Homework
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Homework } from '@/models/Homework'
import { getCurrentAcademicYear } from '@/lib/academicYear'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['student'],
        rateLimit: 'api',
        requiredModules: ['homework'],
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const url = new URL(req.url)
        const status = url.searchParams.get('status') || 'pending' // pending, submitted, graded
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '20')

        const academicYear = getCurrentAcademicYear()

        // Find homework where student is in submissions
        const query: any = {
            tenantId: session.user.tenantId,
            academicYear,
            isActive: true,
            status: 'active',
            'submissions.studentId': session.user.id,
        }

        // Filter by submission status
        if (status === 'pending') {
            query['submissions.status'] = 'pending'
        } else if (status === 'submitted') {
            query['submissions.status'] = { $in: ['submitted', 'late'] }
        } else if (status === 'graded') {
            query['submissions.status'] = 'graded'
        }

        const total = await Homework.countDocuments(query)
        const skip = (page - 1) * limit
        const pages = Math.ceil(total / limit)

        const homework = await Homework.find(query)
            .sort({ dueDate: 1 })
            .skip(skip)
            .limit(limit)
            .select('-submissions')
            .lean()

        // Add student's submission to each homework
        const homeworkWithSubmission = await Promise.all(
            homework.map(async (hw) => {
                const fullHw = await Homework.findById(hw._id).lean()
                const studentSubmission = fullHw?.submissions.find(
                    (s: any) => s.studentId.toString() === session.user.id
                )

                return {
                    ...hw,
                    mySubmission: studentSubmission || null,
                }
            })
        )

        // Stats
        const allHomework = await Homework.find({
            tenantId: session.user.tenantId,
            academicYear,
            isActive: true,
            status: 'active',
            'submissions.studentId': session.user.id,
        }).select('submissions').lean()

        const pending = allHomework.filter((hw) =>
            hw.submissions.some(
                (s: any) =>
                    s.studentId.toString() === session.user.id &&
                    s.status === 'pending'
            )
        ).length

        const submitted = allHomework.filter((hw) =>
            hw.submissions.some(
                (s: any) =>
                    s.studentId.toString() === session.user.id &&
                    (s.status === 'submitted' || s.status === 'late')
            )
        ).length

        const graded = allHomework.filter((hw) =>
            hw.submissions.some(
                (s: any) =>
                    s.studentId.toString() === session.user.id &&
                    s.status === 'graded'
            )
        ).length

        const overdue = allHomework.filter((hw) =>
            hw.submissions.some(
                (s: any) =>
                    s.studentId.toString() === session.user.id &&
                    s.status === 'pending' &&
                    new Date(hw.dueDate) < new Date()
            )
        ).length

        return NextResponse.json({
            homework: homeworkWithSubmission,
            total,
            page,
            limit,
            pages,
            stats: {
                pending,
                submitted,
                graded,
                overdue,
            },
        })

    } catch (err: any) {
        console.error('Student homework GET error:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to fetch homework' },
            { status: 500 }
        )
    }
}