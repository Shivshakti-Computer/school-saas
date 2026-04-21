// FILE: src/app/api/upload/route.ts
// UPDATED: R2 support + storage tracking
// ─────────────────────────────────────────────────────────

import { authOptions } from '@/lib/auth'
import { uploadFormFile } from '@/lib/storage'
import { updateStorageUsage, checkStorageLimit } from '@/lib/storageAddon'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import type { PlanId } from '@/config/pricing'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  // ── Storage limit check (R2 ke liye) ──
  await connectDB()
  const school = await School.findById(session.user.tenantId)
    .select('plan addonLimits')
    .lean() as any

  const storageCheck = await checkStorageLimit(
    session.user.tenantId,
    (school?.plan ?? 'starter') as PlanId,
    file.size,
    school?.addonLimits
  )

  if (!storageCheck.canUpload) {
    return NextResponse.json(
      { error: storageCheck.message ?? 'Storage limit exceeded' },
      { status: 413 }
    )
  }

  // Upload
  const url = await uploadFormFile(
    file,
    folder,                    // ← Changed here
    session.user.tenantId
  )
  // ── Track storage usage ──
  await updateStorageUsage(session.user.tenantId, file.size)

  return NextResponse.json({ url })
}