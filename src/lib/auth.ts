// FILE: src/lib/auth.ts
// ✅ UPDATED: Teacher session me classes, sections, subjects added
// ✅ Backward compatible — existing logic untouched

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { Subscription } from '@/models/Subscription'
import { Staff } from '@/models/Staff'
import { SchoolSettings } from '@/models/SchoolSettings'
import { is2FAEnabled, isTrustedDevice } from './twoFactor'
import { logLogin } from './audit'
import { TRIAL_CONFIG } from '@/config/pricing'

const TRIAL_MODULES = TRIAL_CONFIG.modules
const TRIAL_PLAN = TRIAL_CONFIG.plan

// ─────────────────────────────────────────────────────────
// Helper — hiddenModules fetch karo
// ─────────────────────────────────────────────────────────
async function getHiddenModules(tenantId: string): Promise<string[]> {
    try {
        const settings = await SchoolSettings
            .findOne({ tenantId })
            .select('modules.hiddenModules')
            .lean() as any
        return settings?.modules?.hiddenModules || []
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────────────────
// Helper — Teacher data fetch (Staff record se)
// ─────────────────────────────────────────────────────────
interface TeacherData {
    teacherClasses: string[]
    teacherSections: string[]
    teacherSubjects: string[]
    isClassTeacher: boolean
    classTeacherOf?: { class: string; section: string }
    allowedModules: string[]
    employeeId?: string
}

async function getTeacherData(
    tenantId: string,
    userId: string,
    userAllowedModules: string[]
): Promise<TeacherData> {
    try {
        const staffRecord = await Staff.findOne({
            tenantId,
            userId,
            status: { $in: ['active', 'on_leave'] },
        })
            .select(
                'allowedModules employeeId classes sections subjects ' +
                'isClassTeacher classTeacherOf'
            )
            .lean() as any

        if (!staffRecord) {
            return {
                teacherClasses: [],
                teacherSections: [],
                teacherSubjects: [],
                isClassTeacher: false,
                allowedModules: userAllowedModules,
                employeeId: undefined,
            }
        }

        return {
            teacherClasses: staffRecord.classes || [],
            teacherSections: staffRecord.sections || [],
            teacherSubjects: staffRecord.subjects || [],
            isClassTeacher: staffRecord.isClassTeacher || false,
            classTeacherOf: staffRecord.classTeacherOf?.class
                ? {
                    class: staffRecord.classTeacherOf.class,
                    section: staffRecord.classTeacherOf.section || '',
                }
                : undefined,
            allowedModules:
                staffRecord.allowedModules?.length > 0
                    ? staffRecord.allowedModules
                    : userAllowedModules,
            employeeId: staffRecord.employeeId,
        }
    } catch {
        return {
            teacherClasses: [],
            teacherSections: [],
            teacherSubjects: [],
            isClassTeacher: false,
            allowedModules: userAllowedModules,
        }
    }
}

// ─────────────────────────────────────────────────────────
// Helper — subscription status resolve
// ─────────────────────────────────────────────────────────
async function resolveSubscriptionStatus(
    school: any,
    activeSub: any,
    hiddenModules: string[] = []
): Promise<{
    effectivePlan: string
    effectiveModules: string[]
    subscriptionStatus: string
    subscriptionEnd: string | null
}> {
    const now = new Date()

    const trialEnd = school.trialEndsAt
        ? new Date(school.trialEndsAt)
        : new Date(Date.now() + TRIAL_CONFIG.durationDays * 86400000)

    const hasPaidSub = Boolean(activeSub)
    const subEnd = activeSub?.currentPeriodEnd
        ? new Date(activeSub.currentPeriodEnd)
        : null

    if (hasPaidSub && subEnd && subEnd > now) {
        const allModules: string[] = school.modules || []
        const visibleModules = allModules.filter(
            (m: string) => !hiddenModules.includes(m)
        )
        return {
            effectivePlan: activeSub.plan,
            effectiveModules: visibleModules,
            subscriptionStatus:
                activeSub.status === 'scheduled_cancel'
                    ? 'scheduled_cancel'
                    : 'active',
            subscriptionEnd: subEnd.toISOString(),
        }
    }

    if (!hasPaidSub && trialEnd > now) {
        const baseModules =
            school.modules?.length > 0 ? school.modules : TRIAL_MODULES
        const visibleModules = baseModules.filter(
            (m: string) => !hiddenModules.includes(m)
        )
        return {
            effectivePlan: TRIAL_PLAN,
            effectiveModules: visibleModules,
            subscriptionStatus: 'trial',
            subscriptionEnd: null,
        }
    }

    return {
        effectivePlan: 'starter',
        effectiveModules: [],
        subscriptionStatus: 'expired',
        subscriptionEnd: null,
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                phone: { label: 'Phone / Admission No', type: 'text' },
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                subdomain: { label: 'School Code', type: 'text' },
                type: { label: 'Type', type: 'text' },
                twoFactorVerified: { label: '2FA Verified', type: 'text' },
                deviceId: { label: 'Device ID', type: 'text' },
            },

            async authorize(credentials, req) {
                try {
                    await connectDB()

                    const ip =
                        (req as any)?.headers?.['x-forwarded-for']
                            ?.split(',')[0]
                            ?.trim() || 'unknown'
                    const userAgent =
                        (req as any)?.headers?.['user-agent'] || 'unknown'

                    // ── Superadmin ──
                    if (credentials?.type === 'superadmin') {
                        if (!credentials.email || !credentials.password) return null
                        if (
                            credentials.email === process.env.SUPERADMIN_EMAIL &&
                            credentials.password === process.env.SUPERADMIN_PASSWORD
                        ) {
                            await logLogin(
                                'superadmin', 'Super Admin', 'superadmin',
                                '', ip, userAgent, true
                            )
                            return {
                                id: 'superadmin',
                                name: 'Super Admin',
                                email: credentials.email,
                                role: 'superadmin',
                                tenantId: '',
                                subdomain: '',
                                plan: 'enterprise',
                                schoolName: 'Skolify Admin',
                                schoolLogo: undefined,
                                modules: [],
                                trialEndsAt: new Date(
                                    Date.now() + 365 * 86400000
                                ).toISOString(),
                                subscriptionId: null,
                                subscriptionEnd: null,
                                subscriptionStatus: 'active',
                                twoFactorRequired: false,
                                allowedModules: [],
                                employeeId: undefined,
                                staffCategory: undefined,
                                creditBalance: 0,
                                addonLimits: { extraStudents: 0, extraTeachers: 0 },
                                teacherClasses: [],
                                teacherSections: [],
                                teacherSubjects: [],
                                isClassTeacher: false,
                                classTeacherOf: undefined,
                            } as any
                        }
                        await logLogin(
                            'unknown', credentials.email, 'superadmin',
                            '', ip, userAgent, false
                        )
                        return null
                    }

                    // ── School Login ──
                    if (!credentials?.phone?.trim() || !credentials?.password)
                        return null
                    const subdomain = credentials.subdomain?.toLowerCase().trim()
                    if (!subdomain) return null

                    const school = await School.findOne({
                        subdomain,
                        isActive: true,
                    }).lean() as any
                    if (!school) return null

                    const loginId = credentials.phone.trim()
                    const user = await User.findOne({
                        tenantId: school._id,
                        $or: [
                            { phone: loginId },
                            { email: loginId.toLowerCase() },
                            { admissionNo: loginId, role: 'student' },
                        ],
                        isActive: true,
                    })

                    if (!user) {
                        await logLogin(
                            'unknown', loginId, 'unknown',
                            school._id.toString(), ip, userAgent, false
                        )
                        return null
                    }

                    const match = await bcrypt.compare(
                        credentials.password,
                        user.password
                    )
                    if (!match) {
                        await logLogin(
                            user._id.toString(), user.name, user.role,
                            school._id.toString(), ip, userAgent, false
                        )
                        return null
                    }

                    // ── 2FA ──
                    let twoFactorRequired = false
                    if (user.role === 'admin') {
                        const has2FA = await is2FAEnabled(user._id.toString())
                        if (has2FA) {
                            const deviceId = credentials.deviceId || ''
                            const trusted = deviceId
                                ? await isTrustedDevice(user._id.toString(), deviceId)
                                : false
                            if (
                                !trusted &&
                                credentials.twoFactorVerified !== 'true'
                            ) {
                                twoFactorRequired = true
                            }
                        }
                    }

                    await User.findByIdAndUpdate(user._id, {
                        lastLogin: new Date(),
                    })
                    await logLogin(
                        user._id.toString(), user.name, user.role,
                        school._id.toString(), ip, userAgent, true
                    )

                    // ── Staff data ──
                    let allowedModules: string[] = []
                    let employeeId: string | undefined
                    let staffCategory: string | undefined

                    // Teacher-specific defaults
                    let teacherClasses: string[] = []
                    let teacherSections: string[] = []
                    let teacherSubjects: string[] = []
                    let isClassTeacher = false
                    let classTeacherOf: { class: string; section: string } | undefined

                    if (user.role === 'staff') {
                        const staffRecord = await Staff.findOne({
                            tenantId: school._id,
                            userId: user._id,
                            status: { $in: ['active', 'on_leave'] },
                        })
                            .select('allowedModules employeeId staffCategory')
                            .lean() as any

                        if (staffRecord) {
                            allowedModules = staffRecord.allowedModules || []
                            employeeId = staffRecord.employeeId
                            staffCategory = staffRecord.staffCategory
                        }
                        if (
                            allowedModules.length === 0 &&
                            user.allowedModules?.length
                        ) {
                            allowedModules = user.allowedModules
                        }
                    }

                    // ── Teacher data — Staff record se fetch ──
                    if (user.role === 'teacher') {
                        const teacherData = await getTeacherData(
                            school._id.toString(),
                            user._id.toString(),
                            user.allowedModules || []
                        )
                        allowedModules = teacherData.allowedModules
                        employeeId = teacherData.employeeId
                        teacherClasses = teacherData.teacherClasses
                        teacherSections = teacherData.teacherSections
                        teacherSubjects = teacherData.teacherSubjects
                        isClassTeacher = teacherData.isClassTeacher
                        classTeacherOf = teacherData.classTeacherOf
                    }

                    // ── Subscription + hiddenModules ──
                    const [activeSub, hiddenModules] = await Promise.all([
                        Subscription.findOne({
                            tenantId: school._id,
                            status: { $in: ['active', 'scheduled_cancel'] },
                        })
                            .sort({ createdAt: -1 })
                            .lean() as any,
                        getHiddenModules(school._id.toString()),
                    ])

                    const {
                        effectivePlan,
                        effectiveModules,
                        subscriptionStatus,
                        subscriptionEnd,
                    } = await resolveSubscriptionStatus(
                        school,
                        activeSub,
                        hiddenModules
                    )

                    const trialEnd = school.trialEndsAt
                        ? new Date(school.trialEndsAt)
                        : new Date(
                            Date.now() + TRIAL_CONFIG.durationDays * 86400000
                        )

                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email || user.phone,
                        role: user.role,
                        tenantId: school._id.toString(),
                        subdomain: school.subdomain,
                        plan: effectivePlan,
                        schoolName: school.name,
                        schoolLogo: school.logo || undefined,
                        modules: effectiveModules,
                        trialEndsAt: trialEnd.toISOString(),
                        subscriptionId: school.subscriptionId ?? null,
                        subscriptionEnd,
                        subscriptionStatus,
                        twoFactorRequired,
                        allowedModules,
                        employeeId,
                        staffCategory,
                        creditBalance: school.creditBalance ?? 0,
                        addonLimits: school.addonLimits ?? {
                            extraStudents: 0,
                            extraTeachers: 0,
                        },
                        // ── Teacher fields ──
                        teacherClasses,
                        teacherSections,
                        teacherSubjects,
                        isClassTeacher,
                        classTeacherOf,
                    } as any
                } catch (error) {
                    console.error('AUTH ERROR:', error)
                    return null
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, trigger, session: updateData }) {
            // ── Initial login ──
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.tenantId = (user as any).tenantId
                token.subdomain = (user as any).subdomain
                token.plan = (user as any).plan
                token.schoolName = (user as any).schoolName
                token.schoolLogo = (user as any).schoolLogo
                token.modules = (user as any).modules
                token.trialEndsAt = (user as any).trialEndsAt
                token.subscriptionId = (user as any).subscriptionId
                token.subscriptionEnd = (user as any).subscriptionEnd
                token.subscriptionStatus = (user as any).subscriptionStatus
                token.twoFactorRequired =
                    (user as any).twoFactorRequired || false
                token.lastDbCheck = Date.now()
                token.allowedModules = (user as any).allowedModules || []
                token.employeeId = (user as any).employeeId
                token.staffCategory = (user as any).staffCategory
                token.creditBalance = (user as any).creditBalance ?? 0
                token.addonLimits = (user as any).addonLimits ?? {
                    extraStudents: 0,
                    extraTeachers: 0,
                }
                // ── Teacher fields ──
                token.teacherClasses = (user as any).teacherClasses || []
                token.teacherSections = (user as any).teacherSections || []
                token.teacherSubjects = (user as any).teacherSubjects || []
                token.isClassTeacher = (user as any).isClassTeacher || false
                token.classTeacherOf = (user as any).classTeacherOf
                return token
            }

            // ── updateSession() trigger ──
            if (trigger === 'update' && updateData) {
                if (updateData.schoolName)
                    token.schoolName = updateData.schoolName
                if (updateData.schoolLogo !== undefined)
                    token.schoolLogo = updateData.schoolLogo
                if (updateData.modules) token.modules = updateData.modules
                if (updateData.plan) token.plan = updateData.plan
                if (updateData.subscriptionStatus)
                    token.subscriptionStatus = updateData.subscriptionStatus
                if (updateData.creditBalance !== undefined)
                    token.creditBalance = updateData.creditBalance
                token.lastDbCheck = 0
                return token
            }

            if (token.role === 'superadmin') return token

            // ── DB refresh every 30s ──
            const lastCheck = (token.lastDbCheck as number) || 0
            const THIRTY_SECONDS = 30 * 1000

            if (Date.now() - lastCheck > THIRTY_SECONDS) {
                try {
                    await connectDB()

                    const [school, hiddenModules] = await Promise.all([
                        School.findById(token.tenantId)
                            .select(
                                'plan modules subscriptionId trialEndsAt ' +
                                'isActive name creditBalance addonLimits logo'
                            )
                            .lean() as any,
                        getHiddenModules(token.tenantId as string),
                    ])

                    if (!school || !school.isActive) {
                        token.plan = 'starter'
                        token.modules = []
                        token.subscriptionId = null
                        token.subscriptionEnd = null
                        token.subscriptionStatus = 'expired'
                        token.creditBalance = 0
                        token.lastDbCheck = Date.now()
                        return token
                    }

                    const activeSub = await Subscription.findOne({
                        tenantId: token.tenantId,
                        status: { $in: ['active', 'scheduled_cancel'] },
                    })
                        .sort({ createdAt: -1 })
                        .lean() as any

                    const {
                        effectivePlan,
                        effectiveModules,
                        subscriptionStatus,
                        subscriptionEnd,
                    } = await resolveSubscriptionStatus(
                        school,
                        activeSub,
                        hiddenModules
                    )

                    const trialEnd = school.trialEndsAt
                        ? new Date(school.trialEndsAt)
                        : new Date(Date.now() + 30 * 86400000)

                    token.plan = effectivePlan
                    token.modules = effectiveModules
                    token.subscriptionId = school.subscriptionId ?? null
                    token.subscriptionEnd = subscriptionEnd
                    token.subscriptionStatus = subscriptionStatus
                    token.trialEndsAt = trialEnd.toISOString()

                    if (token.role === 'staff') {
                        const staffRecord = await Staff.findOne({
                            tenantId: token.tenantId,
                            userId: token.id,
                            status: { $in: ['active', 'on_leave'] },
                        })
                            .select('allowedModules employeeId staffCategory')
                            .lean() as any

                        token.allowedModules = staffRecord?.allowedModules || []
                        token.employeeId = staffRecord?.employeeId
                        token.staffCategory = staffRecord?.staffCategory
                    }

                    // ── Teacher DB refresh ──
                    if (token.role === 'teacher') {
                        const teacherData = await getTeacherData(
                            token.tenantId as string,
                            token.id as string,
                            token.allowedModules as string[] || []
                        )
                        token.allowedModules = teacherData.allowedModules
                        token.employeeId = teacherData.employeeId
                        token.teacherClasses = teacherData.teacherClasses
                        token.teacherSections = teacherData.teacherSections
                        token.teacherSubjects = teacherData.teacherSubjects
                        token.isClassTeacher = teacherData.isClassTeacher
                        token.classTeacherOf = teacherData.classTeacherOf
                    }

                    token.creditBalance = school.creditBalance ?? 0
                    token.addonLimits = school.addonLimits ?? {
                        extraStudents: 0,
                        extraTeachers: 0,
                    }
                    token.schoolName = school.name || token.schoolName
                    token.schoolLogo = school.logo || undefined
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
                session.user.schoolLogo = token.schoolLogo as string | undefined
                session.user.modules = token.modules as string[]
                session.user.trialEndsAt = token.trialEndsAt as string
                session.user.subscriptionId =
                    token.subscriptionId as string | null
                session.user.subscriptionEnd =
                    token.subscriptionEnd as string | null
                session.user.subscriptionStatus =
                    token.subscriptionStatus as string
                session.user.twoFactorRequired =
                    token.twoFactorRequired as boolean
                session.user.allowedModules =
                    (token.allowedModules as string[]) || []
                session.user.employeeId = token.employeeId as string | undefined
                session.user.staffCategory =
                    token.staffCategory as string | undefined
                session.user.creditBalance = (token.creditBalance as number) ?? 0
                session.user.addonLimits = (token.addonLimits as any) ?? {
                    extraStudents: 0,
                    extraTeachers: 0,
                }
                // ── Teacher fields ──
                session.user.teacherClasses =
                    (token.teacherClasses as string[]) || []
                session.user.teacherSections =
                    (token.teacherSections as string[]) || []
                session.user.teacherSubjects =
                    (token.teacherSubjects as string[]) || []
                session.user.isClassTeacher =
                    (token.isClassTeacher as boolean) || false
                session.user.classTeacherOf = token.classTeacherOf as
                    | { class: string; section: string }
                    | undefined
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