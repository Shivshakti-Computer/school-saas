// FILE: src/app/(dashboard)/admin/settings/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import {
    DEFAULT_CLASSES,
    DEFAULT_SECTIONS,
    DEFAULT_SUBJECTS,
    DEFAULT_GRADE_SCALE,
} from '@/lib/academicDefaults'
import { getCurrentAcademicYear } from '@/lib/academicYear'
import { SettingsClient } from './SettingsClient'
import type { SettingsResponse, SchoolProfileData } from '@/types/settings'
import type { PlanId } from '@/config/pricing'
import { getPlan, getTrialModulesForInstitution } from '@/lib/plans'
import { isValidInstitutionType } from '@/lib/institutionConfig'
import type { InstitutionType } from '@/lib/institutionConfig'

export const metadata = {
    title: 'Settings — Skolify',
    description: 'Configure your school settings',
}

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) redirect('/login')
    if (session.user.role !== 'admin') redirect('/admin')

    const tenantId = session.user.tenantId

    try {
        await connectDB()

        const [school, settings] = await Promise.all([
            School.findById(tenantId)
                .select(
                    'name subdomain email phone address logo plan modules ' +
                    'trialEndsAt creditBalance isActive onboardingComplete ' +
                    'theme paymentSettings institutionType subscriptionStatus'  // ✅ ADD
                )
                .lean() as Promise<any>,

            SchoolSettings.findOne({ tenantId }).lean() as Promise<any>,
        ])

        if (!school) redirect('/login')

        // ── Create settings if not exists ──
        let settingsDoc = settings
        if (!settingsDoc) {
            const created = await SchoolSettings.create({
                tenantId,
                academic: {
                    classes: DEFAULT_CLASSES,
                    sections: DEFAULT_SECTIONS,
                    subjects: DEFAULT_SUBJECTS,
                    gradingSystem: 'marks',
                    passPercentage: 33,
                    gradeScale: DEFAULT_GRADE_SCALE,
                    attendanceThreshold: 75,
                    workingDaysPerWeek: 6,
                    schoolTimings: { start: '08:00', end: '14:00' },
                    currentAcademicYear: getCurrentAcademicYear(),
                    academicYearStartMonth: 4,
                },
            })
            settingsDoc = created.toObject()
        }

        const institutionType: InstitutionType = isValidInstitutionType(school.institutionType)
            ? school.institutionType
            : 'school'

        const subscriptionStatus = school.subscriptionStatus || 'trial'
        const isTrial = subscriptionStatus === 'trial'

        // ✅ FIX: Trial mein institution-specific full modules, paid plan mein plan modules
        const planConfig = getPlan(school.plan as PlanId)
        const planModules: string[] = isTrial
            ? getTrialModulesForInstitution(institutionType)
            : planConfig.modules

        const hiddenModules: string[] = settingsDoc.modules?.hiddenModules || []

        // enabledModules = planModules - hiddenModules
        const enabledModules: string[] = planModules.filter(
            (m: string) => !hiddenModules.includes(m)
        )
        const razorpayConfigured = Boolean(
            school.paymentSettings?.razorpayKeyId &&
            school.paymentSettings?.razorpayKeySecret
        )

        const schoolProfile: SchoolProfileData = {
            id: school._id.toString(),
            name: school.name,
            subdomain: school.subdomain,
            email: school.email || '',
            phone: school.phone || '',
            address: school.address || '',
            logo: school.logo,
            plan: school.plan,
            trialEndsAt: school.trialEndsAt?.toISOString() || '',
            creditBalance: school.creditBalance || 0,
            isActive: school.isActive,
            onboardingComplete: school.onboardingComplete,
            theme: {
                primary: school.theme?.primary || '#6366f1',
                secondary: school.theme?.secondary || '#f97316',
            },
            razorpayConfigured,
            // ✅ DB se fresh — session pe depend nahi
            enabledModules,
            hiddenModules,
            subscriptionStatus: school.subscriptionStatus || 'trial',    // ✅ ADD
            institutionType: school.institutionType || 'school',         // ✅ ADD
        }

        const initialData: SettingsResponse = {
            school: schoolProfile,

            academic: settingsDoc.academic || {
                classes: DEFAULT_CLASSES,
                sections: DEFAULT_SECTIONS,
                subjects: DEFAULT_SUBJECTS,
                gradingSystem: 'marks',
                passPercentage: 33,
                gradeScale: DEFAULT_GRADE_SCALE,
                attendanceThreshold: 75,
                workingDaysPerWeek: 6,
                schoolTimings: { start: '08:00', end: '14:00' },
                currentAcademicYear: getCurrentAcademicYear(),
                academicYearStartMonth: 4,
            },

            notifications: settingsDoc.notifications || {},

            payment: {
                ...(settingsDoc.payment || {}),
                razorpayConfigured,
            },

            appearance: {
                ...(settingsDoc.appearance || {}),
                schoolLogo: settingsDoc.appearance?.schoolLogo || school.logo,
                portalTheme: {
                    primaryColor:
                        settingsDoc.appearance?.portalTheme?.primaryColor ||
                        school.theme?.primary ||
                        '#6366f1',
                    accentColor:
                        settingsDoc.appearance?.portalTheme?.accentColor ||
                        school.theme?.secondary ||
                        '#f97316',
                    darkMode:
                        settingsDoc.appearance?.portalTheme?.darkMode || 'light',
                },
                printHeader: settingsDoc.appearance?.printHeader || {
                    showLogo: true,
                    showSchoolName: true,
                    showAddress: true,
                    showPhone: true,
                },
            },

            modules: settingsDoc.modules || {},

            meta: {
                settingsId: settingsDoc._id?.toString() || '',
                lastUpdatedBy: settingsDoc.lastUpdatedByName,
                lastUpdatedAt: settingsDoc.updatedAt?.toISOString(),
            },
        }

        return (
            <SettingsClient
                initialData={initialData}
                lastUpdatedBy={settingsDoc.lastUpdatedByName}
            />
        )

    } catch (error) {
        console.error('[Settings Page]', error)
        redirect('/admin')
    }
}