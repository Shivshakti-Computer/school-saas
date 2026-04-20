// FILE: src/app/api/storage/export/route.ts
// Trigger data export (background job)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { createStorageExport } from '@/lib/storageExport'

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req, {
    allowedRoles: ['admin'],
    rateLimit: 'mutation',
  })
  if (guard instanceof NextResponse) return guard

  const { session } = guard

  try {
    await connectDB()

    const school = await School.findById(session.user.tenantId)
      .select('name email storageAddon')
      .lean() as any

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    if (!school.storageAddon?.extraStorageGB) {
      return NextResponse.json(
        { error: 'No storage addon purchased' },
        { status: 400 }
      )
    }

    // ── Initiate export (async job) ──
    const result = await createStorageExport(
      session.user.tenantId,
      school.name,
      school.email
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Download links sent to your email',
      fileCount: result.fileCount,
      totalSizeMB: ((result.totalSizeBytes ?? 0) / (1024 * 1024)).toFixed(2),
      expiresAt: result.expiresAt,
    })

  } catch (err: any) {
    console.error('[POST /api/storage/export]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}