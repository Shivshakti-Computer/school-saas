// FILE: src/app/api/superadmin/announcements/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Announcement } from '@/models/Announcement'

async function guardSuperadmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') return null
  return session
}

// PATCH — Update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guardSuperadmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id } = await params
  const body = await req.json()

  // Auto set publishedAt when publishing
  if (body.status === 'published') {
    body.publishedAt = body.publishedAt || new Date()
  }

  const updated = await Announcement.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  )

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, announcement: updated })
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guardSuperadmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id } = await params
  await Announcement.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}