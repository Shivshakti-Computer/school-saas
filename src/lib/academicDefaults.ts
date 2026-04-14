// FILE: src/lib/academicDefaults.ts
// ═══════════════════════════════════════════════════════════
// Pure data constants — NO mongoose, NO server imports
// ✅ Client components mein safely import ho sakta hai
// ✅ Server components bhi use kar sakte hain
// ═══════════════════════════════════════════════════════════

import type {
    IClassConfig,
    ISectionConfig,
    IGradeScale,
    IAcademicConfig,
} from '@/types/settings'

// ─────────────────────────────────────────────────────────
// Academic Year Helper
// ─────────────────────────────────────────────────────────

export function getCurrentAcademicYear(): string {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`
    return `${year - 1}-${String(year).slice(-2)}`
}

// ─────────────────────────────────────────────────────────
// Default Classes
// ─────────────────────────────────────────────────────────

export const DEFAULT_CLASSES: IClassConfig[] = [
    // Pre-Primary
    { name: 'Nursery', group: 'pre_primary', displayName: 'Nursery', order: 0, isActive: true },
    { name: 'LKG', group: 'pre_primary', displayName: 'LKG', order: 1, isActive: true },
    { name: 'UKG', group: 'pre_primary', displayName: 'UKG', order: 2, isActive: true },
    // Primary
    { name: '1', group: 'primary', displayName: 'Class 1', order: 3, isActive: true },
    { name: '2', group: 'primary', displayName: 'Class 2', order: 4, isActive: true },
    { name: '3', group: 'primary', displayName: 'Class 3', order: 5, isActive: true },
    { name: '4', group: 'primary', displayName: 'Class 4', order: 6, isActive: true },
    { name: '5', group: 'primary', displayName: 'Class 5', order: 7, isActive: true },
    // Middle
    { name: '6', group: 'middle', displayName: 'Class 6', order: 8, isActive: true },
    { name: '7', group: 'middle', displayName: 'Class 7', order: 9, isActive: true },
    { name: '8', group: 'middle', displayName: 'Class 8', order: 10, isActive: true },
    // Secondary
    { name: '9', group: 'secondary', displayName: 'Class 9', order: 11, isActive: true },
    { name: '10', group: 'secondary', displayName: 'Class 10', order: 12, isActive: true },
    // Sr. Secondary — Stream wise
    { name: '11', group: 'sr_secondary', stream: 'Science', displayName: 'Class 11 (Science)', order: 13, isActive: true },
    { name: '11', group: 'sr_secondary', stream: 'Commerce', displayName: 'Class 11 (Commerce)', order: 14, isActive: true },
    { name: '11', group: 'sr_secondary', stream: 'Arts', displayName: 'Class 11 (Arts)', order: 15, isActive: true },
    { name: '12', group: 'sr_secondary', stream: 'Science', displayName: 'Class 12 (Science)', order: 16, isActive: true },
    { name: '12', group: 'sr_secondary', stream: 'Commerce', displayName: 'Class 12 (Commerce)', order: 17, isActive: true },
    { name: '12', group: 'sr_secondary', stream: 'Arts', displayName: 'Class 12 (Arts)', order: 18, isActive: true },
]

// ─────────────────────────────────────────────────────────
// Default Sections
// ─────────────────────────────────────────────────────────

export const DEFAULT_SECTIONS: ISectionConfig[] = [
    { name: 'A', isActive: true },
    { name: 'B', isActive: true },
    { name: 'C', isActive: true },
]

// ─────────────────────────────────────────────────────────
// Default Subjects
// ─────────────────────────────────────────────────────────

export const DEFAULT_SUBJECTS: IAcademicConfig['subjects'] = [
    {
        classGroup: 'pre_primary',
        subjectList: ['English', 'Hindi', 'Mathematics', 'EVS', 'Drawing', 'Moral Science'],
    },
    {
        classGroup: 'primary',
        subjectList: ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer', 'Drawing', 'Moral Science'],
    },
    {
        classGroup: 'middle',
        subjectList: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
    },
    {
        classGroup: 'secondary',
        subjectList: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Physical Education'],
    },
    {
        classGroup: 'sr_secondary',
        stream: 'Science',
        subjectList: ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Physical Education'],
    },
    {
        classGroup: 'sr_secondary',
        stream: 'Commerce',
        subjectList: ['English', 'Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'Computer Science', 'Physical Education'],
    },
    {
        classGroup: 'sr_secondary',
        stream: 'Arts',
        subjectList: ['English', 'Hindi', 'History', 'Geography', 'Political Science', 'Economics', 'Sociology', 'Physical Education'],
    },
]

// ─────────────────────────────────────────────────────────
// Default Grade Scale
// ─────────────────────────────────────────────────────────

export const DEFAULT_GRADE_SCALE: IGradeScale[] = [
    { grade: 'A+', minMarks: 91, maxMarks: 100, gradePoint: 10.0, description: 'Outstanding' },
    { grade: 'A', minMarks: 81, maxMarks: 90, gradePoint: 9.0, description: 'Excellent' },
    { grade: 'B+', minMarks: 71, maxMarks: 80, gradePoint: 8.0, description: 'Very Good' },
    { grade: 'B', minMarks: 61, maxMarks: 70, gradePoint: 7.0, description: 'Good' },
    { grade: 'C+', minMarks: 51, maxMarks: 60, gradePoint: 6.0, description: 'Above Average' },
    { grade: 'C', minMarks: 41, maxMarks: 50, gradePoint: 5.0, description: 'Average' },
    { grade: 'D', minMarks: 33, maxMarks: 40, gradePoint: 4.0, description: 'Pass' },
    { grade: 'F', minMarks: 0, maxMarks: 32, gradePoint: 0.0, description: 'Fail' },
]