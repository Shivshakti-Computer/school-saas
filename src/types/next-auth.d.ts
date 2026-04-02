// FILE: src/types/next-auth.d.ts
// UPDATED: Added allowedModules for staff role-based access

import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT as DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name: string
            email: string
            role: string
            tenantId: string
            subdomain: string
            plan: string
            schoolName: string
            modules: string[]
            trialEndsAt: string
            subscriptionId: string | null
            subscriptionEnd: string | null
            subscriptionStatus: string
            twoFactorRequired: boolean
            // ── NEW ──
            allowedModules: string[]   // Staff-specific module permissions
            employeeId?: string
            staffCategory?: string     // 'teaching' | 'non_teaching' | 'admin' | 'support'
            // ── NEW ──
            creditBalance: number
            addonLimits: {
                extraStudents: number
                extraTeachers: number
            }
        } & DefaultSession['user']
    }
}

interface User extends DefaultUser {
    role: string
    tenantId: string
    subdomain: string
    plan: string
    schoolName: string
    modules: string[]
    trialEndsAt: string
    subscriptionId: string | null
    subscriptionEnd: string | null
    subscriptionStatus: string
    twoFactorRequired: boolean
    allowedModules: string[]
    employeeId?: string
    staffCategory?: string
    // ── NEW ──
    creditBalance: number
    addonLimits: {
        extraStudents: number
        extraTeachers: number
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
        modules: string[]
        trialEndsAt: string
        subscriptionId: string | null
        subscriptionEnd: string | null
        subscriptionStatus: string
        twoFactorRequired: boolean
        lastDbCheck: number
        // ── NEW ──
        allowedModules: string[]
        employeeId?: string
        staffCategory?: string
        // ── NEW ──
        creditBalance: number
        addonLimits: {
            extraStudents: number
            extraTeachers: number
        }
    }
}