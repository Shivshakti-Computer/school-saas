/* ─────────────────────────────────────────────────────────────
   FILE: src/lib/auth.ts  (FIXED — DB-fresh plan on every request)
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

            credentials: {
                phone: { label: 'Phone/Email', type: 'text' },
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                subdomain: { label: 'School Code', type: 'text' },
                type: { label: 'Type', type: 'text' },
            },

            async authorize(credentials) {
                try {
                    await connectDB()

                    /* ── SUPERADMIN LOGIN ── */
                    if (credentials?.type === 'superadmin') {
                        if (!credentials.email || !credentials.password) return null

                        if (
                            credentials.email === process.env.SUPERADMIN_EMAIL &&
                            credentials.password === process.env.SUPERADMIN_PASSWORD
                        ) {
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
                        return null
                    }

                    /* ── SCHOOL LOGIN ── */
                    if (!credentials?.phone || !credentials?.password) return null

                    const subdomain = credentials.subdomain?.toLowerCase().trim()
                    if (!subdomain) return null

                    const school = await School.findOne({ subdomain, isActive: true })
                    if (!school) return null

                    const user = await User.findOne({
                        tenantId: school._id,
                        $or: [
                            { phone: credentials.phone },
                            { email: credentials.phone },
                        ],
                        isActive: true,
                    })
                    if (!user) return null

                    const match = await bcrypt.compare(credentials.password, user.password)
                    if (!match) return null

                    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })

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
                    console.error('AUTH ERROR:', error)
                    return null
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, trigger }) {
            // ── First login — set all fields from authorize() ──
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
                token.lastDbCheck = Date.now()
                return token
            }

            // ── Superadmin — no DB check needed ──
            if (token.role === 'superadmin') return token

            // ── KEY FIX: Refresh plan from DB every 2 minutes ──
            // This ensures plan changes (cancel, expire, upgrade)
            // are reflected WITHOUT requiring logout
            const lastCheck = (token.lastDbCheck as number) || 0
            const TWO_MINUTES = 2 * 60 * 1000

            if (Date.now() - lastCheck > TWO_MINUTES) {
                try {
                    await connectDB()
                    const school = await School.findById(token.tenantId)
                        .select('plan modules subscriptionId trialEndsAt isActive')
                        .lean() as any

                    if (school) {
                        token.plan = school.plan
                        token.modules = school.modules
                        token.subscriptionId = school.subscriptionId ?? null
                        token.trialEndsAt = school.trialEndsAt
                            ? new Date(school.trialEndsAt).toISOString()
                            : token.trialEndsAt

                        // If school deactivated, force plan to starter
                        if (!school.isActive) {
                            token.plan = 'starter'
                            token.modules = ['students', 'teachers', 'attendance', 'notices']
                            token.subscriptionId = null
                        }
                    }
                } catch (err) {
                    // DB error — use cached token values, don't block user
                    console.error('JWT refresh error:', err)
                }
                token.lastDbCheck = Date.now()
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