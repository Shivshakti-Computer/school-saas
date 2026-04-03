import { connectDB } from './db'
import { Student } from '@/models/Student'
import { School } from '@/models/School'

// ─────────────────────────────────────────────
// Academic Year Helpers
// ─────────────────────────────────────────────

export function getCurrentAcademicYear(): string {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    if (month >= 4) {
        return `${year}-${String(year + 1).slice(-2)}`
    }
    return `${year - 1}-${String(year).slice(-2)}`
}

export function getAcademicYears(): string[] {
    const currentYear = new Date().getFullYear()
    const years: string[] = []
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
        years.push(`${y}-${String(y + 1).slice(-2)}`)
    }
    return years.reverse()
}

export function isValidAcademicYear(year: string): boolean {
    return /^\d{4}-\d{2}$/.test(year)
}

export function getNextClass(currentClass: string): string | null {
    const classNum = parseInt(currentClass)
    if (isNaN(classNum)) return null
    if (classNum >= 12) return null
    return String(classNum + 1)
}

// ─────────────────────────────────────────────
// School Code Generator
// Input:  "delhi-public-school" → "DPS"
//         "dps"                 → "DPS"
//         "kendriya"            → "KEN"
// ─────────────────────────────────────────────

export function getSchoolCode(subdomain: string): string {
    const s = subdomain.toUpperCase().trim()

    // Remove special chars, split on separators
    const words = s.split(/[-_\s]+/).filter(Boolean)

    if (words.length >= 2) {
        // Multi-word: take first letter of each word, max 4 chars
        return words.map((w) => w[0]).join('').slice(0, 4)
    }

    // Single word: take first 3 chars
    return s.slice(0, 3)
}

// ─────────────────────────────────────────────
// Subdomain from TenantId
// School model se subdomain fetch karo
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Admission Number Generator
//
// Format: DPS/2025-26/0001
//
// Logic:
//  1. Us tenantId + academicYear ka last admissionNo dhundo
//  2. Last sequence number extract karo
//  3. +1 karke naya banao
//
// Race condition safe: MongoDB unique index hai admissionNo pe
// Conflict hone pe caller retry kare (route.ts mein hai)
// ─────────────────────────────────────────────

export async function generateAdmissionNo(
    tenantId: string,
    subdomain: string,
    academicYear: string
): Promise<string> {
    await connectDB()

    const schoolCode = getSchoolCode(subdomain)

    // Latest student dhundo — createdAt desc
    const last = await Student.findOne({
        tenantId,
        academicYear,
    })
        .sort({ createdAt: -1 })
        .select('admissionNo')
        .lean() as { admissionNo?: string } | null

    let nextSeq = 1

    if (last?.admissionNo) {
        // "DPS/2025-26/0007" → ["DPS", "2025-26", "0007"] → "0007" → 7
        // "SCH/2025-26/003"  → ["SCH", "2025-26", "003"]  → "003"  → 3
        const parts = last.admissionNo.split('/')
        const lastSeq = parseInt(parts[parts.length - 1] || '0') || 0
        nextSeq = lastSeq + 1
    }

    // DPS/2025-26/0001
    return `${schoolCode}/${academicYear}/${String(nextSeq).padStart(4, '0')}`
}

// ─────────────────────────────────────────────
// Roll Number Generator
// Format: 01, 02, 03 ...
// Class + Section wise sequential
// ─────────────────────────────────────────────

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
        const lastRoll = parseInt(last.rollNo) || 0
        nextSeq = lastRoll + 1
    }

    return String(nextSeq).padStart(2, '0')
}

// ─────────────────────────────────────────────
// Bulk-Import ke liye — Optimized Version
//
// countDocuments ki jagah — last record dhundo
// Faster + race-condition safe
// ─────────────────────────────────────────────

export async function generateAdmissionNoForBulk(
    tenantId: string,
    subdomain: string,
    academicYear: string,
    offset: number = 0  // Bulk mein ek saath multiple chahiye: offset 0,1,2...
): Promise<string> {
    await connectDB()

    const schoolCode = getSchoolCode(subdomain)

    const last = await Student.findOne({
        tenantId,
        academicYear,
    })
        .sort({ createdAt: -1 })
        .select('admissionNo')
        .lean() as { admissionNo?: string } | null

    let baseSeq = 1

    if (last?.admissionNo) {
        const parts = last.admissionNo.split('/')
        const lastSeq = parseInt(parts[parts.length - 1] || '0') || 0
        baseSeq = lastSeq + 1
    }

    // Offset add karo — bulk mein 5 students ek saath process ho rahe hain
    const nextSeq = baseSeq + offset

    return `${schoolCode}/${academicYear}/${String(nextSeq).padStart(4, '0')}`
}

// ─────────────────────────────────────────────
// Roll Number Reassign (after transfer/delete)
// ─────────────────────────────────────────────

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