// FILE: src/app/api/settings/modules/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { MODULE_REGISTRY } from '@/lib/moduleRegistry'
import { isModuleAllowed, getPlan, getTrialModulesForInstitution } from '@/lib/plans'
import { invalidateModuleSettingsCache } from '@/lib/getModuleSettings'
import { filterModulesByInstitution } from '@/lib/moduleRegistry'
import type { UpdateModulesBody } from '@/types/settings'
import type { ModuleKey } from '@/lib/moduleRegistry'
import type { PlanId } from '@/lib/plans'
import type { InstitutionType } from '@/lib/institutionConfig'

// ══════════════════════════════════════════════════════════
// Validation
// ══════════════════════════════════════════════════════════

function validateModules(
    body: UpdateModulesBody,
    currentPlan: string,
    institutionType: string = 'school',
    isTrial: boolean = false
): string | null {
    if (body.enableModules?.length) {
        for (const mod of body.enableModules) {
            const config = MODULE_REGISTRY[mod as ModuleKey]
            if (!config) return `Unknown module: ${mod}`

            // ✅ Trial mein plan check skip — sab modules allowed
            if (!isTrial && !isModuleAllowed(currentPlan as PlanId, mod)) {
                return `Module '${config.label}' is not available in your ${currentPlan} plan`
            }

            // Institution type check hamesha — trial mein bhi
            if (!config.institutionTypes.includes(institutionType as any)) {
                return `Module '${config.label}' is not available for your institution type`
            }
        }
    }

    if (body.disableModules?.length) {
        for (const mod of body.disableModules) {
            const config = MODULE_REGISTRY[mod as ModuleKey]
            if (config?.isCore) {
                return `'${config.label}' is a core module and cannot be disabled`
            }
        }
    }

    // Attendance validation
    if (body.attendance?.editWindowHours !== undefined &&
        (body.attendance.editWindowHours < 1 || body.attendance.editWindowHours > 72)) {
        return 'Edit window must be between 1 and 72 hours'
    }

    // Exams validation
    if (body.exams?.gracemarksLimit !== undefined &&
        (body.exams.gracemarksLimit < 0 || body.exams.gracemarksLimit > 10)) {
        return 'Grace marks limit must be between 0 and 10%'
    }

    // Library validation
    if (body.library) {
        if (body.library.maxBooksPerStudent !== undefined &&
            (body.library.maxBooksPerStudent < 1 || body.library.maxBooksPerStudent > 20)) {
            return 'Max books per student must be between 1 and 20'
        }
        if (body.library.maxIssueDays !== undefined &&
            (body.library.maxIssueDays < 1 || body.library.maxIssueDays > 60)) {
            return 'Max issue days must be between 1 and 60'
        }
        if (body.library.finePerDay !== undefined && body.library.finePerDay < 0) {
            return 'Fine per day cannot be negative'
        }
    }

    // Homework validation
    if (body.homework) {
        if (body.homework.maxFileSizeMB !== undefined &&
            (body.homework.maxFileSizeMB < 1 || body.homework.maxFileSizeMB > 50)) {
            return 'Max file size must be between 1 and 50 MB'
        }
        if (body.homework.submissionFileTypes !== undefined &&
            body.homework.submissionFileTypes.length === 0) {
            return 'At least one file type must be allowed'
        }
    }

    // HR validation
    if (body.hr) {
        const hr = body.hr
        if (hr.pfPercentage !== undefined &&
            (hr.pfPercentage < 0 || hr.pfPercentage > 30)) {
            return 'PF percentage must be between 0 and 30'
        }
        if (hr.esiPercentage !== undefined &&
            (hr.esiPercentage < 0 || hr.esiPercentage > 10)) {
            return 'ESI percentage must be between 0 and 10'
        }
        if (hr.casualLeavesPerYear !== undefined &&
            (hr.casualLeavesPerYear < 0 || hr.casualLeavesPerYear > 30)) {
            return 'Casual leaves must be between 0 and 30'
        }
        if (hr.sickLeavesPerYear !== undefined &&
            (hr.sickLeavesPerYear < 0 || hr.sickLeavesPerYear > 30)) {
            return 'Sick leaves must be between 0 and 30'
        }
        if (hr.earnedLeavesPerYear !== undefined &&
            (hr.earnedLeavesPerYear < 0 || hr.earnedLeavesPerYear > 60)) {
            return 'Earned leaves must be between 0 and 60'
        }
        if (hr.salaryDisbursementDay !== undefined &&
            (hr.salaryDisbursementDay < 1 || hr.salaryDisbursementDay > 28)) {
            return 'Salary disbursement day must be between 1 and 28'
        }
        if (hr.payslipFooterText !== undefined &&
            hr.payslipFooterText.length > 200) {
            return 'Payslip footer text too long (max 200 chars)'
        }
    }

    return null
}

// ══════════════════════════════════════════════════════════
// PATCH — Update Module Settings
// ══════════════════════════════════════════════════════════

export async function PATCH(req: NextRequest) {
    const guard = await apiGuardWithBody<UpdateModulesBody>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'SETTINGS_CHANGE',
        auditResource: 'School',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard
    const tenantId = session.user.tenantId
    const currentPlan = guard.freshPlan as PlanId

    // ✅ Session se institutionType aur subscriptionStatus lo
    const institutionType = ((session.user as any).institutionType || 'school') as InstitutionType
    const subscriptionStatus = (session.user as any).subscriptionStatus || 'trial'
    const isTrial = subscriptionStatus === 'trial'

    // ✅ Validation — trial mein plan check skip
    const validationError = validateModules(body, currentPlan, institutionType, isTrial)
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
    }

    try {
        await connectDB()

        const planConfig = getPlan(currentPlan)

        // ✅ Trial mein institution-specific full modules
        // Paid plan mein plan ke modules
        const planModules = isTrial
            ? getTrialModulesForInstitution(institutionType)
            : planConfig.modules

        // ✅ Institution type ke hisaab se filter
        // Academy ko school-only modules save nahi hone chahiye
        const institutionSafePlanModules = filterModulesByInstitution(
            planModules,
            institutionType
        )

        // Current hidden modules DB se lo
        const currentSettings = await SchoolSettings.findOne({ tenantId })
            .select('modules.hiddenModules')
            .lean() as any

        let hiddenModules: string[] = currentSettings?.modules?.hiddenModules || []

        // ✅ Enable = hidden se hata do
        if (body.enableModules?.length) {
            hiddenModules = hiddenModules.filter(
                (m) => !body.enableModules!.includes(m)
            )
        }

        // ✅ Disable = hidden mein add karo (sirf non-core)
        if (body.disableModules?.length) {
            body.disableModules.forEach((mod) => {
                const config = MODULE_REGISTRY[mod as ModuleKey]
                if (!config?.isCore && !hiddenModules.includes(mod)) {
                    hiddenModules.push(mod)
                }
            })
        }

        // ✅ School.modules = institution-safe plan modules (hamesha)
        await School.findByIdAndUpdate(tenantId, {
            $set: { modules: institutionSafePlanModules }
        })

        // Build setFields
        const setFields: Record<string, any> = {
            lastUpdatedBy: session.user.id,
            lastUpdatedByName: session.user.name,
            'modules.hiddenModules': hiddenModules,
        }

        // Section map
        const sectionMap: Record<string, any> = {
            fees: body.fees,
            attendance: body.attendance,
            exams: body.exams,
            library: body.library,
            homework: body.homework,
            hr: body.hr,
        }

        Object.entries(sectionMap).forEach(([section, sectionBody]) => {
            if (sectionBody) {
                Object.entries(sectionBody).forEach(([key, val]) => {
                    if (val !== undefined) {
                        setFields[`modules.${section}.${key}`] = val
                    }
                })
            }
        })

        await SchoolSettings.findOneAndUpdate(
            { tenantId },
            { $set: setFields },
            { upsert: true }
        )

        // Cache invalidate
        invalidateModuleSettingsCache(tenantId)

        // ✅ Effective modules = institutionSafePlanModules - hiddenModules
        const effectiveModules = institutionSafePlanModules.filter(
            (m) => !hiddenModules.includes(m)
        )

        // Audit log
        const enabledLabels = body.enableModules?.map(
            (m) => MODULE_REGISTRY[m as ModuleKey]?.label || m
        )
        const disabledLabels = body.disableModules?.map(
            (m) => MODULE_REGISTRY[m as ModuleKey]?.label || m
        )

        await logAudit({
            tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Admin',
            userRole: session.user.role,
            action: 'SETTINGS_CHANGE',
            resource: 'School',
            resourceId: tenantId,
            description: [
                enabledLabels?.length ? `Enabled: ${enabledLabels.join(', ')}` : '',
                disabledLabels?.length ? `Disabled: ${disabledLabels.join(', ')}` : '',
                body.homework ? 'Homework settings updated' : '',
                `Institution: ${institutionType} | Trial: ${isTrial}`,
                'Module settings updated',
            ].filter(Boolean).join(' | '),
            newData: { hiddenModules, effectiveModules, institutionType, isTrial },
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
        })

        return NextResponse.json({
            success: true,
            message: 'Module settings updated successfully',
            effectiveModules,
            hiddenModules,
        })

    } catch (error: any) {
        console.error('[PATCH /api/settings/modules]', error)
        return NextResponse.json(
            { error: 'Failed to update module settings' },
            { status: 500 }
        )
    }
}