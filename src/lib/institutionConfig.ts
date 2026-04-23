// FILE: src/lib/institutionConfig.ts
// Terminology & feature config per institution type
// ═══════════════════════════════════════════════════════════

export type InstitutionType = 'school' | 'academy' | 'coaching'

export interface InstitutionConfig {
    label: string
    icon: string
    description: string
    terms: {
        student: string
        class: string
        section: string
        subject: string
        teacher: string
        exam: string
        homework: string
        fee: string
        academic: string
        attendance: string
    }
    features: {
        hasClasses: boolean
        hasSections: boolean
        hasBatches: boolean
        hasCourses: boolean
        hasStreams: boolean
        hasAcademicYear: boolean
        hasSessionYear: boolean
    }
}

export const INSTITUTION_CONFIG: Record<InstitutionType, InstitutionConfig> = {
    school: {
        label: 'School',
        icon: '🏫',
        description: 'K-12 schools with standard academic structure',
        terms: {
            student: 'Student',
            class: 'Class',
            section: 'Section',
            subject: 'Subject',
            teacher: 'Teacher',
            exam: 'Exam',
            homework: 'Homework',
            fee: 'Fee',
            academic: 'Academic Year',
            attendance: 'Attendance',
        },
        features: {
            hasClasses: true,
            hasSections: true,
            hasBatches: false,
            hasCourses: false,
            hasStreams: true,
            hasAcademicYear: true,
            hasSessionYear: false,
        },
    },

    academy: {
        label: 'Computer Academy',
        icon: '💻',
        description: 'Computer training institutes with course-based structure',
        terms: {
            student: 'Student',
            class: 'Batch',
            section: '',
            subject: 'Course',
            teacher: 'Instructor',
            exam: 'Assessment',
            homework: 'Assignment',
            fee: 'Course Fee',
            academic: 'Session',
            attendance: 'Attendance',
        },
        features: {
            hasClasses: false,
            hasSections: false,
            hasBatches: true,
            hasCourses: true,
            hasStreams: false,
            hasAcademicYear: false,
            hasSessionYear: true,
        },
    },

    coaching: {
        label: 'Coaching Institute',
        icon: '📚',
        description: 'Coaching centers for competitive exams',
        terms: {
            student: 'Student',
            class: 'Batch',
            section: '',
            subject: 'Subject',
            teacher: 'Faculty',
            exam: 'Test',
            homework: 'Assignment',
            fee: 'Fee',
            academic: 'Session',
            attendance: 'Attendance',
        },
        features: {
            hasClasses: false,
            hasSections: false,
            hasBatches: true,
            hasCourses: true,
            hasStreams: false,
            hasAcademicYear: false,
            hasSessionYear: true,
        },
    },
}

// Helper functions
export function getTerm(
    institutionType: InstitutionType,
    key: keyof InstitutionConfig['terms']
): string {
    return INSTITUTION_CONFIG[institutionType].terms[key]
}

export function hasFeature(
    institutionType: InstitutionType,
    feature: keyof InstitutionConfig['features']
): boolean {
    return INSTITUTION_CONFIG[institutionType].features[feature]
}

export function getInstitutionLabel(type: InstitutionType): string {
    return INSTITUTION_CONFIG[type].label
}

export function getInstitutionIcon(type: InstitutionType): string {
    return INSTITUTION_CONFIG[type].icon
}

// Validation
export function isValidInstitutionType(type: string): type is InstitutionType {
    return ['school', 'academy', 'coaching'].includes(type)
}