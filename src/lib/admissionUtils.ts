// FILE: src/lib/admissionUtils.ts
// Admission Number & Roll Number generation utilities

import { connectDB } from './db'
import { Student } from '@/models/Student'
import '@/models/School'

/**
 * Get current academic year
 * Indian academic year: April to March
 * April 2024 → March 2025 = "2024-25"
 */
export function getCurrentAcademicYear(): string {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12
    const year = now.getFullYear()

    if (month >= 4) {
        // April onwards = new year
        return `${year}-${String(year + 1).slice(-2)}`
    } else {
        // Jan-March = previous year's session
        return `${year - 1}-${String(year).slice(-2)}`
    }
}

/**
 * Get all academic years for dropdown
 * Last 5 years + current + next
 */
export function getAcademicYears(): string[] {
    const currentYear = new Date().getFullYear()
    const years: string[] = []
    
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
        years.push(`${y}-${String(y + 1).slice(-2)}`)
    }
    
    return years.reverse()
}

/**
 * Generate Admission Number
 * Format: SCHOOLCODE/YEAR/SEQNO
 * Example: DPS/2024-25/0001
 * 
 * School code = first 3-4 chars of subdomain (uppercase)
 */
export async function generateAdmissionNo(
    tenantId: string,
    subdomain: string,
    academicYear: string
): Promise<string> {
    await connectDB()

    // School code from subdomain
    // "delhipublicschool" → "DPS" (initials)
    // "stmarys" → "STM"
    const schoolCode = getSchoolCode(subdomain)

    // Count students in this academic year for this school
    const count = await Student.countDocuments({
        tenantId,
        academicYear,
    })

    const seq = String(count + 1).padStart(4, '0')
    return `${schoolCode}/${academicYear}/${seq}`
}

/**
 * Extract school code from subdomain
 * Examples:
 * "dps" → "DPS"
 * "stmarys" → "STM"  
 * "kendriyavidyalaya" → "KV"
 * "sunshine" → "SUN"
 */
function getSchoolCode(subdomain: string): string {
    const s = subdomain.toUpperCase().trim()
    
    // If short (≤4 chars), use as-is
    if (s.length <= 4) return s
    
    // Try to get initials (split on common separators)
    const words = s.split(/[-_\s]+/).filter(Boolean)
    if (words.length >= 2) {
        return words.map(w => w[0]).join('').slice(0, 4)
    }
    
    // Otherwise take first 3 chars
    return s.slice(0, 3)
}

/**
 * Generate Roll Number — Section-wise sequential
 * Format: Simple number (1, 2, 3...)
 * Ordered alphabetically by name within section
 */
export async function generateRollNo(
    tenantId: string,
    className: string,
    section: string,
    academicYear: string
): Promise<string> {
    await connectDB()

    const count = await Student.countDocuments({
        tenantId,
        class: className,
        section,
        academicYear,
        status: { $ne: 'transferred' },
    })

    return String(count + 1)
}

/**
 * Reassign roll numbers for a class-section
 * Call this after promotion/transfer to keep roll nos sequential
 */
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
    .sort({ 'userId.name': 1 }) // Alphabetical

    for (let i = 0; i < students.length; i++) {
        await Student.findByIdAndUpdate(students[i]._id, {
            rollNo: String(i + 1),
        })
    }
}

/**
 * Validate academic year format
 */
export function isValidAcademicYear(year: string): boolean {
    return /^\d{4}-\d{2}$/.test(year)
}

/**
 * Get next class after promotion
 */
export function getNextClass(currentClass: string): string | null {
    const classNum = parseInt(currentClass)
    if (isNaN(classNum)) return null
    if (classNum >= 12) return null // Already max
    return String(classNum + 1)
}