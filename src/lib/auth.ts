/* ─────────────────────────────────────────────────────────────
   FILE: src/lib/auth.ts
   ─────────────────────────────────────────────────────────── */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'

// Trial mein allowed modules — ONLY starter features
const TRIAL_MODULES = ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery']
const TRIAL_PLAN = 'starter'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',

      credentials: {
        phone:     { label: 'Phone/Email', type: 'text' },
        email:     { label: 'Email', type: 'text' },
        password:  { label: 'Password', type: 'password' },
        subdomain: { label: 'School Code', type: 'text' },
        type:      { label: 'Type', type: 'text' },
      },

      async authorize(credentials) {
        try {
          await connectDB()

          /* ══════════════════════════════════════════
             SUPERADMIN LOGIN
             Triggered when type === 'superadmin'
             ══════════════════════════════════════════ */
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
                schoolName: 'VidyaFlow Admin',
                modules: [],
                trialEndsAt: new Date(Date.now() + 365 * 86400000).toISOString(),
                subscriptionId: null,
                subscriptionEnd: null,
                subscriptionStatus: 'active',
              } as any
            }
            return null
          }

          /* ══════════════════════════════════════════
             SCHOOL LOGIN (Admin / Teacher / Student / Parent)
             All roles use same flow:
             - School Code (subdomain) + Phone/Email + Password
             - Role is determined from User model
             - Correct portal redirect happens in frontend
             ══════════════════════════════════════════ */
          
          // Validate inputs
          if (!credentials?.phone?.trim() || !credentials?.password) {
            console.log('AUTH: Missing phone or password')
            return null
          }

          const subdomain = credentials.subdomain?.toLowerCase().trim()
          if (!subdomain) {
            console.log('AUTH: Missing school code')
            return null
          }

          // Find school by school code
          const school = await School.findOne({ subdomain, isActive: true })
          if (!school) {
            console.log('AUTH: School not found for code:', subdomain)
            return null
          }

          // Find user in this school (match phone OR email)
          const loginId = credentials.phone.trim()
          const user = await User.findOne({
            tenantId: school._id,
            $or: [
              { phone: loginId },
              { email: loginId.toLowerCase() },
            ],
            isActive: true,
          })

          if (!user) {
            console.log('AUTH: User not found in school:', subdomain, 'with:', loginId)
            return null
          }

          // Verify password
          const match = await bcrypt.compare(credentials.password, user.password)
          if (!match) {
            console.log('AUTH: Password mismatch for user:', loginId)
            return null
          }

          // Update last login timestamp
          await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })

          // ── Determine subscription state ──
          const activeSub = await Subscription.findOne({
            tenantId: school._id,
            status: 'active',
          }).sort({ createdAt: -1 }).lean() as any

          const now = new Date()
          const trialEnd = new Date(school.trialEndsAt)
          const hasPaidSub = Boolean(activeSub)
          const subEnd = activeSub?.currentPeriodEnd
            ? new Date(activeSub.currentPeriodEnd)
            : null

          let effectivePlan: string
          let effectiveModules: string[]
          let subscriptionStatus: string

          if (hasPaidSub && subEnd && subEnd > now) {
            // ✅ Active paid subscription
            effectivePlan = activeSub.plan
            effectiveModules = school.modules || []
            subscriptionStatus = 'active'
          } else if (!hasPaidSub && trialEnd > now) {
            // ⏱️ Active trial — ONLY starter modules
            effectivePlan = TRIAL_PLAN
            effectiveModules = TRIAL_MODULES
            subscriptionStatus = 'trial'
          } else if (hasPaidSub && subEnd && subEnd <= now) {
            // ❌ Paid subscription expired
            effectivePlan = 'starter'
            effectiveModules = []
            subscriptionStatus = 'expired'
          } else {
            // ❌ Trial expired, no subscription
            effectivePlan = 'starter'
            effectiveModules = []
            subscriptionStatus = 'expired'
          }

          console.log('AUTH SUCCESS:', {
            user: user.name,
            role: user.role,
            school: school.name,
            plan: effectivePlan,
            status: subscriptionStatus,
          })

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email || user.phone,
            role: user.role,           // admin | teacher | student | parent
            tenantId: school._id.toString(),
            subdomain: school.subdomain,
            plan: effectivePlan,
            schoolName: school.name,
            modules: effectiveModules,
            trialEndsAt: school.trialEndsAt.toISOString(),
            subscriptionId: school.subscriptionId ?? null,
            subscriptionEnd: subEnd ? subEnd.toISOString() : null,
            subscriptionStatus,
          } as any

        } catch (error) {
          console.error('AUTH ERROR:', error)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ── First login — copy all fields from authorize() ──
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
        token.subscriptionEnd = (user as any).subscriptionEnd
        token.subscriptionStatus = (user as any).subscriptionStatus
        token.lastDbCheck = Date.now()
        return token
      }

      // ── Superadmin — no DB refresh needed ──
      if (token.role === 'superadmin') return token

      // ── Refresh from DB every 30 seconds ──
      const lastCheck = (token.lastDbCheck as number) || 0
      const THIRTY_SECONDS = 30 * 1000

      if (Date.now() - lastCheck > THIRTY_SECONDS) {
        try {
          await connectDB()
          const school = await School.findById(token.tenantId)
            .select('plan modules subscriptionId trialEndsAt isActive name')
            .lean() as any

          if (!school || !school.isActive) {
            token.plan = 'starter'
            token.modules = []
            token.subscriptionId = null
            token.subscriptionEnd = null
            token.subscriptionStatus = 'expired'
            token.lastDbCheck = Date.now()
            return token
          }

          // Check active subscription
          const activeSub = await Subscription.findOne({
            tenantId: token.tenantId,
            status: 'active',
          }).sort({ createdAt: -1 }).lean() as any

          const now = new Date()
          const trialEnd = new Date(school.trialEndsAt)
          const hasPaidSub = Boolean(activeSub)
          const subEnd = activeSub?.currentPeriodEnd
            ? new Date(activeSub.currentPeriodEnd)
            : null

          if (hasPaidSub && subEnd && subEnd > now) {
            token.plan = activeSub.plan
            token.modules = school.modules || []
            token.subscriptionId = school.subscriptionId
            token.subscriptionEnd = subEnd.toISOString()
            token.subscriptionStatus = 'active'
          } else if (!hasPaidSub && trialEnd > now) {
            token.plan = TRIAL_PLAN
            token.modules = TRIAL_MODULES
            token.subscriptionId = null
            token.subscriptionEnd = null
            token.subscriptionStatus = 'trial'
          } else {
            token.plan = 'starter'
            token.modules = []
            token.subscriptionId = null
            token.subscriptionEnd = null
            token.subscriptionStatus = 'expired'
          }

          token.schoolName = school.name || token.schoolName
          token.trialEndsAt = school.trialEndsAt
            ? new Date(school.trialEndsAt).toISOString()
            : token.trialEndsAt

        } catch (err) {
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
        session.user.subscriptionEnd = token.subscriptionEnd as string | null
        session.user.subscriptionStatus = token.subscriptionStatus as string
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}