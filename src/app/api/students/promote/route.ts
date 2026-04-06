// FILE: src/app/api/students/promote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { Fee } from '@/models/Fee'
import { FeeStructure } from '@/models/FeeStructure'
import { getCurrentAcademicYear } from '@/lib/admissionUtils'

/**
 * POST /api/students/promote
 * Bulk promote students to next class/session
 *
 * ✅ BACKWARD COMPATIBLE:
 * - Manual promotion (frontend): sends specific studentIds
 *   already filtered by UI → works as before
 * - AI promotion (Python): sends all class students
 *   → now filtered by academicYear on server
 *
 * Body: {
 *   studentIds:     string[]              // selected student _ids
 *   fromClass:      string                // "10"
 *   toClass:        string                // "11"
 *   toSection:      string                // "A"
 *   toAcademicYear: string                // "2027-28"
 *   result:         'promoted'|'detained' // default 'promoted'
 *   filterByYear?:  string                // optional: only promote this year's students
 *                                         // AI sends this, manual UI does NOT
 * }
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    await connectDB()

    const body = await req.json()
    const {
        studentIds,
        fromClass,
        toClass,
        toSection,
        toAcademicYear,
        result      = 'promoted',
        filterByYear,           // ✅ NEW optional field for AI calls
    } = body

    // ── Validation ─────────────────────────────────────
    if (!studentIds?.length || !toClass || !toSection || !toAcademicYear) {
        return NextResponse.json(
            { error: 'studentIds, toClass, toSection, toAcademicYear required' },
            { status: 400 }
        )
    }

    console.log(`📚 Promote request:`, {
        studentCount:   studentIds.length,
        fromClass,
        toClass,
        toSection,
        toAcademicYear,
        result,
        filterByYear:   filterByYear || 'none (manual mode)',
    })

    const promoted:       string[] = []
    const failed:         string[] = []
    const skippedOldYear: string[] = []

    for (const studentId of studentIds) {
        try {
            const student = await Student.findOne({
                _id:      studentId,
                tenantId: session.user.tenantId,
                status:   'active',
            })

            if (!student) {
                console.log(`⚠️  Student not found: ${studentId}`)
                failed.push(studentId)
                continue
            }

            // ✅ BACKWARD COMPATIBLE academic year filter:
            // - If filterByYear is provided (AI call):
            //   skip students not in that year
            // - If filterByYear is NOT provided (manual UI call):
            //   promote all selected students as before
            if (filterByYear && student.academicYear !== filterByYear) {
                console.log(
                    `⏭️  Skipping ${studentId}: ` +
                    `academicYear=${student.academicYear} ` +
                    `(expected ${filterByYear})`
                )
                skippedOldYear.push(studentId)
                continue
            }

            // Count existing in target class for roll number
            const existingCount = await Student.countDocuments({
                tenantId:     session.user.tenantId,
                class:        toClass,
                section:      toSection,
                academicYear: toAcademicYear,
                status:       'active',
            })

            const newRollNo = String(existingCount + 1)

            // Save current session to history
            const historyEntry = {
                academicYear: student.academicYear,
                class:        student.class,
                section:      student.section,
                rollNo:       student.rollNo,
                promotedAt:   new Date(),
                result:       result as 'promoted' | 'detained',
            }

            if (result === 'promoted') {
                // ── Update student record ───────────────
                await Student.findByIdAndUpdate(studentId, {
                    $push: { sessionHistory: historyEntry },
                    $set: {
                        class:        toClass,
                        section:      toSection,
                        rollNo:       newRollNo,
                        academicYear: toAcademicYear,
                    },
                })

                // ── Update user class/section ───────────
                await User.findByIdAndUpdate(student.userId, {
                    $set: { class: toClass, section: toSection },
                })

                // ── Auto-assign fee structures ──────────
                try {
                    const newStructures = await FeeStructure.find({
                        tenantId:   session.user.tenantId,
                        isActive:   true,
                        autoAssign: true,
                        $or: [
                            { class: 'all'   },
                            { class: toClass },
                        ],
                    })

                    for (const struct of newStructures) {
                        const existsFee = await Fee.findOne({
                            tenantId:     session.user.tenantId,
                            studentId,
                            structureId:  struct._id,
                            academicYear: toAcademicYear,
                        })

                        if (!existsFee) {
                            await Fee.create({
                                tenantId:     session.user.tenantId,
                                studentId,
                                structureId:  struct._id,
                                amount:       struct.totalAmount,
                                discount:     0,
                                lateFine:     0,
                                finalAmount:  struct.totalAmount,
                                dueDate:      struct.dueDate,
                                status:       'pending',
                                paidAmount:   0,
                                academicYear: toAcademicYear,
                            })
                        }
                    }
                } catch (feeErr) {
                    console.error('Fee assignment error during promotion:', feeErr)
                    // Don't fail promotion if fee assignment fails
                }

            } else if (result === 'detained') {
                // ── Detained: same class, new session ──
                await Student.findByIdAndUpdate(studentId, {
                    $push: { sessionHistory: historyEntry },
                    $set: {
                        rollNo:       newRollNo,
                        academicYear: toAcademicYear,
                    },
                })
            }

            promoted.push(studentId)

        } catch (err) {
            console.error(`❌ Promote error for ${studentId}:`, err)
            failed.push(studentId)
        }
    }

    console.log(`✅ Promotion complete:`, {
        promoted:       promoted.length,
        failed:         failed.length,
        skippedOldYear: skippedOldYear.length,
    })

    return NextResponse.json({
        success:        true,
        promoted:       promoted.length,
        failed:         failed.length,
        failedIds:      failed,
        skippedOldYear: skippedOldYear.length,  // ✅ info for AI
        newYear:        toAcademicYear,
    })
}

/**
 * GET /api/students/promote
 * Preview — kitne students promote honge
 *
 * ✅ BACKWARD COMPATIBLE:
 * - Manual (UI): no 'year' param → uses currentYear (same as before)
 * - AI (Python): sends 'year' param explicitly if needed
 *
 * Query params:
 *   class?:   string  // filter by class
 *   section?: string  // filter by section
 *   year?:    string  // filter by academicYear (optional, defaults to current)
 */
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    await connectDB()

    const { searchParams } = req.nextUrl
    const cls     = searchParams.get('class')
    const section = searchParams.get('section')
    const yearParam = searchParams.get('year')  // ✅ optional override

    // ✅ BACKWARD COMPATIBLE:
    // Use provided year OR auto-calculate current year
    const currentYear = yearParam || getCurrentAcademicYear()
    const nextYear    = getNextAcademicYear(currentYear)

    // ✅ Always filter by academic year
    // Manual UI also benefits from this (no old students shown)
    const query: any = {
        tenantId:     session.user.tenantId,
        status:       'active',
        academicYear: currentYear,   // ← KEY FIX
    }

    if (cls)     query.class   = cls
    if (section) query.section = section

    console.log(`🔍 Promote GET query:`, {
        class:        cls       || 'all',
        section:      section   || 'all',
        academicYear: currentYear,
        tenantId:     session.user.tenantId,
    })

    const students = await Student.find(query)
        .populate('userId', 'name')
        .select('admissionNo class section rollNo academicYear userId')
        .sort({ class: 1, section: 1, rollNo: 1 })
        .lean()

    console.log(`✅ Preview: ${students.length} students (year: ${currentYear})`)

    return NextResponse.json({
        students,
        count:       students.length,
        currentYear,
        nextYear,
    })
}

// ── Helper ────────────────────────────────────────────────
function getNextAcademicYear(current: string): string {
    const parts = current.split('-')
    if (parts.length !== 2) return current

    const startYear = parseInt(parts[0])
    if (isNaN(startYear)) return current

    const nextStart = startYear + 1
    const nextEnd   = String(nextStart + 1).slice(-2)
    return `${nextStart}-${nextEnd}`
}