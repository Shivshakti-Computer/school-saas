// FILE: src/app/api/settings/modules/route.ts
// ═══════════════════════════════════════════════════════════
// PATCH /api/settings/modules
// Enable/disable modules + feature toggles per module
//
// Plan check: Module sirf tab toggle hoga jab plan allow kare
// Core modules (isCore: true) disable nahi ho sakte
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { MODULE_REGISTRY } from '@/lib/moduleRegistry'
import { isModuleAllowed } from '@/lib/plans'
import type { UpdateModulesBody } from '@/types/settings'
import type { ModuleKey } from '@/lib/moduleRegistry'

function validateModules(
  body: UpdateModulesBody,
  currentPlan: string
): string | null {
  // Enable modules validate
  if (body.enableModules?.length) {
    for (const mod of body.enableModules) {
      const config = MODULE_REGISTRY[mod as ModuleKey]
      if (!config) {
        return `Unknown module: ${mod}`
      }
      if (!isModuleAllowed(currentPlan as any, mod)) {
        return `Module '${config.label}' is not available in your ${currentPlan} plan`
      }
    }
  }

  // Core modules disable nahi ho sakte
  if (body.disableModules?.length) {
    for (const mod of body.disableModules) {
      const config = MODULE_REGISTRY[mod as ModuleKey]
      if (config?.isCore) {
        return `'${config.label}' is a core module and cannot be disabled`
      }
    }
  }

  // Library settings validate
  if (body.library) {
    if (
      body.library.maxBooksPerStudent !== undefined &&
      (body.library.maxBooksPerStudent < 1 ||
        body.library.maxBooksPerStudent > 20)
    ) {
      return 'Max books per student must be between 1 and 20'
    }
    if (
      body.library.maxIssueDays !== undefined &&
      (body.library.maxIssueDays < 1 || body.library.maxIssueDays > 60)
    ) {
      return 'Max issue days must be between 1 and 60'
    }
    if (
      body.library.finePerDay !== undefined &&
      body.library.finePerDay < 0
    ) {
      return 'Fine per day cannot be negative'
    }
  }

  // Homework file size
  if (
    body.homework?.maxFileSizeMB !== undefined &&
    (body.homework.maxFileSizeMB < 1 || body.homework.maxFileSizeMB > 50)
  ) {
    return 'Max file size must be between 1 and 50 MB'
  }

  // Attendance edit window
  if (
    body.attendance?.editWindowHours !== undefined &&
    (body.attendance.editWindowHours < 1 ||
      body.attendance.editWindowHours > 72)
  ) {
    return 'Edit window must be between 1 and 72 hours'
  }

  // Grace marks
  if (
    body.exams?.gracemarksLimit !== undefined &&
    (body.exams.gracemarksLimit < 0 || body.exams.gracemarksLimit > 10)
  ) {
    return 'Grace marks limit must be between 0 and 10%'
  }

  return null
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuardWithBody<UpdateModulesBody>(req, {
    allowedRoles: ['admin'],
    rateLimit: 'mutation',
    auditAction: 'SETTINGS_CHANGE',
    auditResource: 'School',
  })
  if (guard instanceof NextResponse) return guard

  const { session, body, clientInfo } = guard
  const tenantId    = session.user.tenantId
  const currentPlan = guard.freshPlan

  const validationError = validateModules(body, currentPlan)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    await connectDB()

    // ── Update School.modules array ──
    const schoolUpdate: Record<string, any> = {}

    if (body.enableModules?.length || body.disableModules?.length) {
      const school = await School.findById(tenantId)
        .select('modules')
        .lean() as any

      let currentModules: string[] = school?.modules || []

      // Enable karo
      if (body.enableModules?.length) {
        body.enableModules.forEach((mod) => {
          if (!currentModules.includes(mod)) {
            currentModules.push(mod)
          }
        })
      }

      // Disable karo (core modules skip)
      if (body.disableModules?.length) {
        currentModules = currentModules.filter((mod) => {
          if (body.disableModules!.includes(mod)) {
            const config = MODULE_REGISTRY[mod as ModuleKey]
            // Core modules remove mat karo
            return config?.isCore === true
          }
          return true
        })
      }

      schoolUpdate.modules = currentModules
      await School.findByIdAndUpdate(tenantId, {
        $set: schoolUpdate,
      })
    }

    // ── Update SchoolSettings.modules ──
    const setFields: Record<string, any> = {
      lastUpdatedBy:     session.user.id,
      lastUpdatedByName: session.user.name,
    }

    if (body.hiddenModules !== undefined) {
      setFields['modules.hiddenModules'] = body.hiddenModules
    }

    // Fees settings
    if (body.fees) {
      Object.entries(body.fees).forEach(([key, val]) => {
        if (val !== undefined) setFields[`modules.fees.${key}`] = val
      })
    }

    // Attendance settings
    if (body.attendance) {
      Object.entries(body.attendance).forEach(([key, val]) => {
        if (val !== undefined) setFields[`modules.attendance.${key}`] = val
      })
    }

    // Exams settings
    if (body.exams) {
      Object.entries(body.exams).forEach(([key, val]) => {
        if (val !== undefined) setFields[`modules.exams.${key}`] = val
      })
    }

    // Library settings
    if (body.library) {
      Object.entries(body.library).forEach(([key, val]) => {
        if (val !== undefined) setFields[`modules.library.${key}`] = val
      })
    }

    // Homework settings
    if (body.homework) {
      Object.entries(body.homework).forEach(([key, val]) => {
        if (val !== undefined) setFields[`modules.homework.${key}`] = val
      })
    }

    await SchoolSettings.findOneAndUpdate(
      { tenantId },
      { $set: setFields },
      { upsert: true }
    )

    // ── Audit ──
    const enabledLabels = body.enableModules?.map(
      (m) => MODULE_REGISTRY[m as ModuleKey]?.label || m
    )
    const disabledLabels = body.disableModules?.map(
      (m) => MODULE_REGISTRY[m as ModuleKey]?.label || m
    )

    await logAudit({
      tenantId,
      userId:      session.user.id,
      userName:    session.user.name || 'Admin',
      userRole:    session.user.role,
      action:      'SETTINGS_CHANGE',
      resource:    'School',
      resourceId:  tenantId,
      description: [
        enabledLabels?.length  ? `Enabled: ${enabledLabels.join(', ')}`  : '',
        disabledLabels?.length ? `Disabled: ${disabledLabels.join(', ')}` : '',
        'Module settings updated',
      ]
        .filter(Boolean)
        .join(' | '),
      newData:   body,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Module settings updated successfully',
    })

  } catch (error: any) {
    console.error('[PATCH /api/settings/modules]', error)
    return NextResponse.json(
      { error: 'Failed to update module settings' },
      { status: 500 }
    )
  }
}