// FILE: src/types/next-auth.d.ts
// ═══════════════════════════════════════════════════════════
// NextAuth type extensions
// logo field add kiya — backward compatible
// ═══════════════════════════════════════════════════════════

import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
    interface User {
        id: string
        role: string
        tenantId: string
        subdomain: string
        plan: string
        schoolName: string
        schoolLogo?: string          // ← NEW
        modules: string[]
        institutionType: 'school' | 'academy' | 'coaching'
        trialEndsAt: string
        subscriptionId: string | null
        subscriptionEnd: string | null
        subscriptionStatus: string
        twoFactorRequired: boolean
        allowedModules: string[]
        employeeId?: string
        staffCategory?: string
        creditBalance: number
        addonLimits: {
            extraStudents: number
            extraTeachers: number
        }

        // ── Teacher-specific fields ──
        teacherClasses: string[]
        teacherSections: string[]
        teacherSubjects: string[]
        isClassTeacher: boolean
        classTeacherOf?: {
            class: string
            section: string
        }
    }

    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            role: string
            tenantId: string
            subdomain: string
            plan: string
            schoolName: string
            schoolLogo?: string        // ← NEW
            modules: string[]
            institutionType: 'school' | 'academy' | 'coaching'
            trialEndsAt: string
            subscriptionId: string | null
            subscriptionEnd: string | null
            subscriptionStatus: string
            twoFactorRequired: boolean
            allowedModules: string[]
            employeeId?: string
            staffCategory?: string
            creditBalance: number
            addonLimits: {
                extraStudents: number
                extraTeachers: number
            }

            // ── Teacher-specific fields ──
            teacherClasses: string[]      // assigned classes: ['6', '7', '8']
            teacherSections: string[]     // assigned sections: ['A', 'B']
            teacherSubjects: string[]     // assigned subjects: ['Math', 'Science']
            isClassTeacher: boolean
            classTeacherOf?: {
                class: string
                section: string
            }
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: string
        tenantId: string
        subdomain: string
        plan: string
        schoolName: string
        schoolLogo?: string          // ← NEW
        modules: string[]
        institutionType: 'school' | 'academy' | 'coaching'
        trialEndsAt: string
        subscriptionId: string | null
        subscriptionEnd: string | null
        subscriptionStatus: string
        twoFactorRequired: boolean
        lastDbCheck: number
        allowedModules: string[]
        employeeId?: string
        staffCategory?: string
        creditBalance: number
        addonLimits: {
            extraStudents: number
            extraTeachers: number
        }

        // ── Teacher-specific fields ──
        teacherClasses: string[]
        teacherSections: string[]
        teacherSubjects: string[]
        isClassTeacher: boolean
        classTeacherOf?: {
            class: string
            section: string
        }
    }
}