// FILE: src/app/api/students/promote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { Fee } from '@/models/Fee'
import { FeeStructure } from '@/models/FeeStructure'
import { getCurrentAcademicYear, getNextClass } from '@/lib/admissionUtils'

/**
 * POST /api/students/promote
 * Bulk promote students to next class/session
 * 
 * Body: {
 *   studentIds: string[]    // selected students
 *   fromClass: string       // "9"
 *   fromSection: string     // "A"
 *   toClass: string         // "10" (auto or manual)
 *   toSection: string       // "A"
 *   toAcademicYear: string  // "2025-26"
 *   result: 'promoted' | 'detained'
 * }
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await req.json()
    const {
        studentIds,
        fromClass,
        toClass,
        toSection,
        toAcademicYear,
        result = 'promoted',
    } = body

    if (!studentIds?.length || !toClass || !toSection || !toAcademicYear) {
        return NextResponse.json(
            { error: 'studentIds, toClass, toSection, toAcademicYear required' },
            { status: 400 }
        )
    }

    const promoted: string[] = []
    const failed: string[] = []
    const currentYear = getCurrentAcademicYear()

    for (const studentId of studentIds) {
        try {
            const student = await Student.findOne({
                _id: studentId,
                tenantId: session.user.tenantId,
                status: 'active',
            })

            if (!student) {
                failed.push(studentId)
                continue
            }

            // Count existing students in target class-section for roll no
            const existingCount = await Student.countDocuments({
                tenantId: session.user.tenantId,
                class: toClass,
                section: toSection,
                academicYear: toAcademicYear,
                status: 'active',
            })

            const newRollNo = String(existingCount + 1)

            // Save current session to history
            const historyEntry = {
                academicYear: student.academicYear,
                class: student.class,
                section: student.section,
                rollNo: student.rollNo,
                promotedAt: new Date(),
                result: result as 'promoted' | 'detained',
            }

            if (result === 'promoted') {
                // Promote to new class
                await Student.findByIdAndUpdate(studentId, {
                    $push: { sessionHistory: historyEntry },
                    $set: {
                        class: toClass,
                        section: toSection,
                        rollNo: newRollNo,
                        academicYear: toAcademicYear,
                    },
                })

                // Update User class/section
                await User.findByIdAndUpdate(student.userId, {
                    $set: { class: toClass, section: toSection },
                })

                // Auto-assign new year fee structures
                try {
                    const newStructures = await FeeStructure.find({
                        tenantId: session.user.tenantId,
                        isActive: true,
                        autoAssign: true,
                        $or: [
                            { class: 'all' },
                            { class: toClass },
                        ],
                    })

                    for (const struct of newStructures) {
                        // Check if fee already exists for this year
                        const existsFee = await Fee.findOne({
                            tenantId: session.user.tenantId,
                            studentId,
                            structureId: struct._id,
                            academicYear: toAcademicYear,
                        })

                        if (!existsFee) {
                            await Fee.create({
                                tenantId: session.user.tenantId,
                                studentId,
                                structureId: struct._id,
                                amount: struct.totalAmount,
                                discount: 0,
                                lateFine: 0,
                                finalAmount: struct.totalAmount,
                                dueDate: struct.dueDate,
                                status: 'pending',
                                paidAmount: 0,
                                academicYear: toAcademicYear,
                            })
                        }
                    }
                } catch (feeErr) {
                    console.error('Fee assignment during promotion:', feeErr)
                }

            } else if (result === 'detained') {
                // Detained — same class, new session
                await Student.findByIdAndUpdate(studentId, {
                    $push: { sessionHistory: historyEntry },
                    $set: {
                        rollNo: newRollNo,
                        academicYear: toAcademicYear,
                    },
                })
            }

            promoted.push(studentId)
        } catch (err) {
            console.error('Promote error for', studentId, err)
            failed.push(studentId)
        }
    }

    return NextResponse.json({
        success: true,
        promoted: promoted.length,
        failed: failed.length,
        failedIds: failed,
        newYear: toAcademicYear,
    })
}

/**
 * GET /api/students/promote
 * Preview — kitne students promote honge
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const cls = searchParams.get('class')
    const section = searchParams.get('section')

    const query: any = {
        tenantId: session.user.tenantId,
        status: 'active',
    }
    if (cls) query.class = cls
    if (section) query.section = section

    const students = await Student.find(query)
        .populate('userId', 'name')
        .select('admissionNo class section rollNo academicYear userId')
        .sort({ class: 1, section: 1, rollNo: 1 })
        .lean()

    const currentYear = getCurrentAcademicYear()
    const nextYear = getNextAcademicYear(currentYear)

    return NextResponse.json({
        students,
        count: students.length,
        currentYear,
        nextYear,
    })
}

function getNextAcademicYear(current: string): string {
    const year = parseInt(current.split('-')[0])
    return `${year + 1}-${String(year + 2).slice(-2)}`
}