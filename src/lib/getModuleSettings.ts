// FILE: src/lib/getModuleSettings.ts
// ═══════════════════════════════════════════════════════════
// Server-side helper — module ke settings fetch karo
// Attendance, Exam, Library modules mein use karo
// ═══════════════════════════════════════════════════════════

import { connectDB } from './db'
import { SchoolSettings } from '@/models/SchoolSettings'
import type { IModuleSettings } from '@/types/settings'

// Cache — per request memoize (Next.js server component safe)
const settingsCache = new Map<string, {
    data: IModuleSettings
    fetchedAt: number
}>()

const CACHE_TTL = 30 * 1000 // 30 seconds

export async function getModuleSettings(
    tenantId: string
): Promise<IModuleSettings> {
    // Cache check
    const cached = settingsCache.get(tenantId)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.data
    }

    await connectDB()

    const settings = await SchoolSettings
        .findOne({ tenantId })
        .select('modules')
        .lean() as any

    const moduleSettings: IModuleSettings = settings?.modules || {
        hiddenModules: [],
        fees: {
            allowPartialPayment: false,
            allowOnlinePayment: false,
            showDueAmountOnPortal: true,
        },
        attendance: {
            allowTeacherEdit: true,
            editWindowHours: 24,
            sendSMSOnSubmit: false,
        },
        exams: {
            showResultToStudent: true,
            showResultToParent: true,
            allowGraceMarks: false,
            gracemarksLimit: 5,
        },
        library: {
            maxBooksPerStudent: 2,
            maxIssueDays: 14,
            finePerDay: 2,
        },
        homework: {
            allowStudentSubmission: true,
            submissionFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx'],
            maxFileSizeMB: 10,
        },
    }

    // Cache store
    settingsCache.set(tenantId, {
        data: moduleSettings,
        fetchedAt: Date.now(),
    })

    return moduleSettings
}

// Cache invalidate — settings save hone pe call karo
export function invalidateModuleSettingsCache(tenantId: string): void {
    settingsCache.delete(tenantId)
}