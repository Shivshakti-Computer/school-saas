// src/types/next-auth.d.ts
// Yeh file NextAuth ke default types ko extend karti hai
// Iske bina session.user.role, tenantId etc. TypeScript error deta hai

// src/types/next-auth.d.ts

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
            subscriptionStatus: string  // 'trial' | 'active' | 'expired'
        }
    }
}

interface User extends DefaultUser {
    role: string
    tenantId: string
    subdomain: string
    plan: string
    schoolName: string
    modules: string[]
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
        lastDbCheck: number
    }
}