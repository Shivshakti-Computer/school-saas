// FILE: src/lib/admissionUtils.ts
// Server-only file — mongoose use karta hai
// Client components mein IMPORT MAT KARO
// ═══════════════════════════════════════════════════════════

import { connectDB } from './db'
import { Student } from '@/models/Student'
import { School } from '@/models/School'

// ── Re-export from pure file (backward compat) ───────────
// Purane imports toot na jayein
export {
    getCurrentAcademicYear,
    getAcademicYears,
    isValidAcademicYear,
    getNextClass,
} from '@/lib/academicYear'

// ── Server-only functions neeche rahein ──────────────────

export function getSchoolCode(subdomain: string): string {
    const s = subdomain.toUpperCase().trim()
    const words = s.split(/[-_\s]+/).filter(Boolean)
    if (words.length >= 2) {
        return words.map((w) => w[0]).join('').slice(0, 4)
    }
    return s.slice(0, 3)
}

export async function getSubdomainByTenantId(
    tenantId: string
): Promise<string> {
    try {
        const school = await School.findById(tenantId)
            .select('subdomain')
            .lean() as any
        return school?.subdomain || 'SCH'
    } catch {
        return 'SCH'
    }
}

export async function generateAdmissionNo(
    tenantId: string,
    subdomain: string,
    academicYear: string
): Promise<string> {
    await connectDB()
    const schoolCode = getSchoolCode(subdomain)
    const last = await Student.findOne({ tenantId, academicYear })
        .sort({ createdAt: -1 })
        .select('admissionNo')
        .lean() as { admissionNo?: string } | null

    let nextSeq = 1
    if (last?.admissionNo) {
        const parts = last.admissionNo.split('/')
        const lastSeq = parseInt(parts[parts.length - 1] || '0') || 0
        nextSeq = lastSeq + 1
    }
    return `${schoolCode}/${academicYear}/${String(nextSeq).padStart(4, '0')}`
}

export async function generateRollNo(
    tenantId: string,
    className: string,
    section: string,
    academicYear: string
): Promise<string> {
    await connectDB()
    const last = await Student.findOne({
        tenantId,
        class: className,
        section,
        academicYear,
        status: { $ne: 'transferred' },
    })
        .sort({ createdAt: -1 })
        .select('rollNo')
        .lean() as { rollNo?: string } | null

    let nextSeq = 1
    if (last?.rollNo) {
        const lastSeq = parseInt(last.rollNo) || 0
        nextSeq = lastSeq + 1
    }
    return String(nextSeq).padStart(2, '0')
}

export async function generateAdmissionNoForBulk(
    tenantId: string,
    subdomain: string,
    academicYear: string,
    offset: number = 0
): Promise<string> {
    await connectDB()
    const schoolCode = getSchoolCode(subdomain)
    const last = await Student.findOne({ tenantId, academicYear })
        .sort({ createdAt: -1 })
        .select('admissionNo')
        .lean() as { admissionNo?: string } | null

    let baseSeq = 1
    if (last?.admissionNo) {
        const parts = last.admissionNo.split('/')
        const lastSeq = parseInt(parts[parts.length - 1] || '0') || 0
        baseSeq = lastSeq + 1
    }
    const nextSeq = baseSeq + offset
    return `${schoolCode}/${academicYear}/${String(nextSeq).padStart(4, '0')}`
}

export async function reassignRollNumbers(
    tenantId: string,
    className: string,
    section: string,
    academicYear: string
): Promise<void> {
    await connectDB()
    const students = await Student.find({
        tenantId,
        class: className,
        section,
        academicYear,
        status: 'active',
    })
        .populate('userId', 'name')
        .sort({ 'userId.name': 1 })

    for (let i = 0; i < students.length; i++) {
        await Student.findByIdAndUpdate(students[i]._id, {
            rollNo: String(i + 1).padStart(2, '0'),
        })
    }
}