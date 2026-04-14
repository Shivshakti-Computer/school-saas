// FILE: src/app/api/settings/academic/route.ts
// ═══════════════════════════════════════════════════════════
// PATCH /api/settings/academic
// Classes, sections, subjects, grading system, timings
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { isValidTime } from '@/types/settings'
import type { UpdateAcademicBody } from '@/types/settings'

// ── Validate academic body ──
function validateAcademic(body: UpdateAcademicBody): string | null {
    if (body.passPercentage !== undefined) {
        if (body.passPercentage < 0 || body.passPercentage > 100) {
            return 'Pass percentage must be between 0 and 100'
        }
    }

    if (body.attendanceThreshold !== undefined) {
        if (body.attendanceThreshold < 0 || body.attendanceThreshold > 100) {
            return 'Attendance threshold must be between 0 and 100'
        }
    }

    if (body.workingDaysPerWeek !== undefined) {
        if (![5, 6].includes(body.workingDaysPerWeek)) {
            return 'Working days must be 5 or 6'
        }
    }

    if (body.schoolTimings) {
        const { start, end, lunchBreak } = body.schoolTimings
        if (start && !isValidTime(start)) return 'Invalid school start time'
        if (end && !isValidTime(end)) return 'Invalid school end time'
        if (start && end && start >= end) return 'Start time must be before end time'
        if (lunchBreak) {
            if (lunchBreak.start && !isValidTime(lunchBreak.start)) {
                return 'Invalid lunch break start time'
            }
            if (lunchBreak.end && !isValidTime(lunchBreak.end)) {
                return 'Invalid lunch break end time'
            }
        }
    }

    if (body.classes !== undefined) {
        if (!Array.isArray(body.classes)) return 'Classes must be an array'
        if (body.classes.length === 0) return 'At least one class is required'

        for (const cls of body.classes) {
            if (!cls.name?.trim()) return 'Class name cannot be empty'
            if (!cls.group) return `Class group required for ${cls.name}`
            if (!cls.displayName?.trim()) return `Display name required for ${cls.name}`
        }
    }

    if (body.sections !== undefined) {
        if (!Array.isArray(body.sections)) return 'Sections must be an array'
        if (body.sections.length === 0) return 'At least one section is required'

        for (const sec of body.sections) {
            if (!sec.name?.trim()) return 'Section name cannot be empty'
            if (sec.name.length > 5) return `Section name too long: ${sec.name}`
        }

        // Duplicate check
        const names = body.sections.map((s) => s.name.toUpperCase())
        if (new Set(names).size !== names.length) {
            return 'Duplicate section names found'
        }
    }

    if (body.gradingSystem === 'grades' && body.gradeScale) {
        if (body.gradeScale.length < 2) {
            return 'Grade scale must have at least 2 grades'
        }
        for (const grade of body.gradeScale) {
            if (!grade.grade?.trim()) return 'Grade label required'
            if (grade.minMarks < 0 || grade.minMarks > 100) {
                return `Invalid min marks for grade ${grade.grade}`
            }
            if (grade.maxMarks < 0 || grade.maxMarks > 100) {
                return `Invalid max marks for grade ${grade.grade}`
            }
            if (grade.minMarks > grade.maxMarks) {
                return `Min marks cannot exceed max marks for ${grade.grade}`
            }
        }
    }

    if (body.academicYearStartMonth !== undefined) {
        if (body.academicYearStartMonth < 1 || body.academicYearStartMonth > 12) {
            return 'Academic year start month must be 1-12'
        }
    }

    return null
}

export async function PATCH(req: NextRequest) {
    const guard = await apiGuardWithBody<UpdateAcademicBody>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'SETTINGS_CHANGE',
        auditResource: 'School',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId

    // ── Validate ──
    const validationError = validateAcademic(body)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    try {
        await connectDB()

        // ── Build $set object — only provided fields update karo ──
        const setFields: Record<string, any> = {
            lastUpdatedBy: session.user.id,
            lastUpdatedByName: session.user.name,
        }

        if (body.classes !== undefined)
            setFields['academic.classes'] = body.classes

        if (body.sections !== undefined)
            setFields['academic.sections'] = body.sections

        if (body.subjects !== undefined)
            setFields['academic.subjects'] = body.subjects

        if (body.gradingSystem !== undefined)
            setFields['academic.gradingSystem'] = body.gradingSystem

        if (body.passPercentage !== undefined)
            setFields['academic.passPercentage'] = body.passPercentage

        if (body.gradeScale !== undefined)
            setFields['academic.gradeScale'] = body.gradeScale

        if (body.cgpaScale !== undefined)
            setFields['academic.cgpaScale'] = body.cgpaScale

        if (body.attendanceThreshold !== undefined)
            setFields['academic.attendanceThreshold'] = body.attendanceThreshold

        if (body.workingDaysPerWeek !== undefined)
            setFields['academic.workingDaysPerWeek'] = body.workingDaysPerWeek

        if (body.schoolTimings !== undefined)
            setFields['academic.schoolTimings'] = body.schoolTimings

        if (body.currentAcademicYear !== undefined)
            setFields['academic.currentAcademicYear'] = body.currentAcademicYear

        if (body.academicYearStartMonth !== undefined)
            setFields['academic.academicYearStartMonth'] = body.academicYearStartMonth

        // ── Upsert — agar settings nahi hai toh create karo ──
        const updated = await SchoolSettings.findOneAndUpdate(
            { tenantId },
            { $set: setFields },
            { new: true, upsert: true, runValidators: false }
        ).select('academic').lean() as any

        // ── Audit ──
        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'SETTINGS_CHANGE',
            resource: 'School',
            resourceId: tenantId,
            description: 'Academic settings updated',
            newData: body,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Academic settings updated successfully',
            academic: updated?.academic,
        })

    } catch (error: any) {
        console.error('[PATCH /api/settings/academic]', error)
        return NextResponse.json(
            { error: 'Failed to update academic settings' },
            { status: 500 }
        )
    }
}