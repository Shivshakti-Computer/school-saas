// FILE: src/lib/admissionUtils.ts — FINAL FIX

import { connectDB } from './db'
import { Student } from '@/models/Student'

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

function getSchoolCode(subdomain: string): string {
    const s = subdomain.toUpperCase().trim()
    if (s.length <= 4) return s
    const words = s.split(/[-_\s]+/).filter(Boolean)
    if (words.length >= 2) {
        return words.map(w => w[0]).join('').slice(0, 4)
    }
    return s.slice(0, 3)
}

export async function generateAdmissionNo(
    tenantId: string,
    subdomain: string,
    academicYear: string
): Promise<string> {
    await connectDB()

    const schoolCode = getSchoolCode(subdomain)

    // ✅ Sirf tenantId + academicYear se last dhundho
    // Regex hatao — schoolCode mismatch issue fix
    const last = await Student.findOne({
        tenantId,
        academicYear,
    })
        .sort({ createdAt: -1 })  // Latest student
        .select('admissionNo')
        .lean() as any

    let nextSeq = 1

    if (last?.admissionNo) {
        // "DPS/2025-26/0007" → split → last part → 7 → next = 8
        // "SCH/2025-26/0003" → split → last part → 3 → next = 4
        // Koi bhi format ho — last "/" ke baad number lo
        const lastPart = last.admissionNo.split('/').pop()
        const lastSeq = parseInt(lastPart || '0') || 0
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
        .sort({ createdAt: -1 })  // Latest
        .select('rollNo')
        .lean() as any

    let nextSeq = 1

    if (last?.rollNo) {
        const lastRoll = parseInt(last.rollNo) || 0
        nextSeq = lastRoll + 1
    }

    return String(nextSeq).padStart(2, '0')
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

export function isValidAcademicYear(year: string): boolean {
    return /^\d{4}-\d{2}$/.test(year)
}

export function getNextClass(currentClass: string): string | null {
    const classNum = parseInt(currentClass)
    if (isNaN(classNum)) return null
    if (classNum >= 12) return null
    return String(classNum + 1)
}