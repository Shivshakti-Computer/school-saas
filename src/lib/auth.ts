/* ─────────────────────────────────────────────────────────────
   FILE: src/lib/auth.ts  (SUPERADMIN + SCHOOL CLEAN VERSION)
   ─────────────────────────────────────────────────────────── */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import { User } from '@/models/User'
import { School } from '@/models/School'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',

            // 🔥 UPDATED CREDENTIALS
            credentials: {
                phone: { label: 'Phone/Email', type: 'text' },
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                subdomain: { label: 'School Code', type: 'text' },
                type: { label: 'Type', type: 'text' }, // 🔥 IMPORTANT
            },

            async authorize(credentials) {
                try {
                    console.log("🔐 LOGIN ATTEMPT:", credentials)

                    await connectDB()

                    /* =====================================================
                       🔥 1. SUPERADMIN LOGIN (CLEAN)
                    ===================================================== */
                    if (credentials?.type === 'superadmin') {

                        if (!credentials.email || !credentials.password) {
                            console.log("❌ Missing superadmin credentials")
                            return null
                        }

                        // ENV-based (you can later replace with DB)
                        if (
                            credentials.email === process.env.SUPERADMIN_EMAIL &&
                            credentials.password === process.env.SUPERADMIN_PASSWORD
                        ) {
                            console.log("✅ Superadmin login success")

                            return {
                                id: 'superadmin',
                                name: 'Super Admin',
                                email: credentials.email,
                                role: 'superadmin',

                                tenantId: '',
                                subdomain: '',
                                plan: 'enterprise',
                                schoolName: 'Super Admin',
                                modules: [],

                                trialEndsAt: new Date().toISOString(),
                                subscriptionId: null,
                            } as any
                        }

                        console.log("❌ Invalid superadmin credentials")
                        return null
                    }

                    /* =====================================================
                       🏫 2. SCHOOL LOGIN (UNCHANGED LOGIC)
                    ===================================================== */

                    if (!credentials?.phone || !credentials?.password) {
                        console.log("❌ Missing phone/password")
                        return null
                    }

                    const subdomain = credentials.subdomain?.toLowerCase().trim()
                    if (!subdomain) {
                        console.log("❌ Missing subdomain")
                        return null
                    }

                    // 🔍 Find school
                    const school = await School.findOne({
                        subdomain,
                        isActive: true,
                    })

                    if (!school) {
                        console.log("❌ School not found")
                        return null
                    }

                    // 👤 Find user
                    const user = await User.findOne({
                        tenantId: school._id,
                        $or: [
                            { phone: credentials.phone },
                            { email: credentials.phone },
                        ],
                        isActive: true,
                    })

                    if (!user) {
                        console.log("❌ User not found")
                        return null
                    }

                    // 🔐 Password check
                    const match = await bcrypt.compare(
                        credentials.password,
                        user.password
                    )

                    if (!match) {
                        console.log("❌ Password mismatch")
                        return null
                    }

                    // 📌 Update last login
                    await User.findByIdAndUpdate(user._id, {
                        lastLogin: new Date(),
                    })

                    console.log("✅ School login success")

                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email || user.phone,
                        role: user.role,

                        tenantId: school._id.toString(),
                        subdomain: school.subdomain,
                        plan: school.plan,
                        schoolName: school.name,
                        modules: school.modules,

                        trialEndsAt: school.trialEndsAt.toISOString(),
                        subscriptionId: school.subscriptionId ?? null,
                    } as any
                } catch (error) {
                    console.error("🔥 AUTH ERROR:", error)
                    return null
                }
            },
        }),
    ],

    /* =====================================================
       🔐 JWT CALLBACK
    ===================================================== */
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.tenantId = (user as any).tenantId
                token.subdomain = (user as any).subdomain
                token.plan = (user as any).plan
                token.schoolName = (user as any).schoolName
                token.modules = (user as any).modules
                token.trialEndsAt = (user as any).trialEndsAt
                token.subscriptionId = (user as any).subscriptionId
            }
            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.tenantId = token.tenantId as string
                session.user.subdomain = token.subdomain as string
                session.user.plan = token.plan as string
                session.user.schoolName = token.schoolName as string
                session.user.modules = token.modules as string[]
                session.user.trialEndsAt = token.trialEndsAt as string
                session.user.subscriptionId = token.subscriptionId as string | null
            }
            return session
        },
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },

    secret: process.env.NEXTAUTH_SECRET,
}