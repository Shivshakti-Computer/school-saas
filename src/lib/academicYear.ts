// FILE: src/lib/academicYear.ts
// Pure utility — NO server imports
// Browser + Server dono mein safe
// ═══════════════════════════════════════════════════════════

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