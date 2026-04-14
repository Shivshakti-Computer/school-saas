// FILE: src/app/api/settings/route.ts
// ═══════════════════════════════════════════════════════════
// GET /api/settings
// Fetch all settings for the logged-in admin's school
// Returns: school profile + all settings in one response
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import type { SettingsResponse, SchoolProfileData } from '@/types/settings'

export async function GET(req: NextRequest) {
    // ── Auth Guard — only admin ──
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const tenantId = session.user.tenantId

    try {
        await connectDB()

        // ── Fetch School + Settings in parallel ──
        const [school, settings] = await Promise.all([
            School.findById(tenantId)
                .select(
                    'name subdomain email phone address logo plan ' +
                    'trialEndsAt creditBalance isActive onboardingComplete ' +
                    'theme paymentSettings modules'
                )
                .lean() as Promise<any>,

            // getOrCreate — agar settings nahi hai toh defaults ke saath create karo
            SchoolSettings.findOne({ tenantId }).lean() as Promise<any>,
        ])

        if (!school) {
            return NextResponse.json(
                { error: 'School not found' },
                { status: 404 }
            )
        }

        // ── Settings nahi hai — defaults ke saath create karo ──
        let settingsDoc = settings
        if (!settingsDoc) {
            const { DEFAULT_CLASSES, DEFAULT_SECTIONS, DEFAULT_SUBJECTS, DEFAULT_GRADE_SCALE } =
                await import('@/models/SchoolSettings')
            const { getCurrentAcademicYear } = await import('@/lib/academicYear')

            settingsDoc = await SchoolSettings.create({
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

            // lean() ke liye plain object chahiye
            settingsDoc = settingsDoc.toObject()
        }

        // ── Build School Profile ──
        const schoolProfile: SchoolProfileData = {
            id: school._id.toString(),
            name: school.name,
            subdomain: school.subdomain,
            email: school.email,
            phone: school.phone,
            address: school.address || '',
            logo: school.logo,
            plan: school.plan,
            trialEndsAt: school.trialEndsAt?.toISOString(),
            creditBalance: school.creditBalance || 0,
            isActive: school.isActive,
            onboardingComplete: school.onboardingComplete,
            theme: {
                primary: school.theme?.primary || '#6366f1',
                secondary: school.theme?.secondary || '#f97316',
            },
            razorpayConfigured: Boolean(
                school.paymentSettings?.razorpayKeyId &&
                school.paymentSettings?.razorpayKeySecret
            ),
        }

        // ── Build Response ──
        // Razorpay keys KABHI return nahi karenge — security
        const response: SettingsResponse = {
            school: schoolProfile,

            academic: settingsDoc.academic || {},

            notifications: settingsDoc.notifications || {},

            payment: {
                ...(settingsDoc.payment || {}),
                // Razorpay configured status School model se
                razorpayConfigured: schoolProfile.razorpayConfigured,
            },

            appearance: {
                ...(settingsDoc.appearance || {}),
                // Agar appearance.schoolLogo nahi → school.logo use karo
                schoolLogo: settingsDoc.appearance?.schoolLogo || school.logo,
            },

            modules: settingsDoc.modules || {},

            meta: {
                settingsId: settingsDoc._id?.toString() || '',
                lastUpdatedBy: settingsDoc.lastUpdatedByName,
                lastUpdatedAt: settingsDoc.updatedAt?.toISOString(),
            },
        }

        return NextResponse.json(response)

    } catch (error: any) {
        console.error('[GET /api/settings]', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}