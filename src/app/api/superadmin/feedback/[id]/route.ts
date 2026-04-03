// FILE: src/app/api/superadmin/feedback/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Feedback } from '@/models/Feedback'

async function guardSuperadmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') return null
  return session
}

// PATCH — Approve/Reject + note
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
  const update: any = {}

  if (body.status) {
    update.status = body.status
    update.reviewedAt = new Date()
    // Approve → public dikhao
    update.isPublic = body.status === 'approved'
  }
  if (body.superadminNote !== undefined) {
    update.superadminNote = body.superadminNote
  }

  const updated = await Feedback.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  )

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, feedback: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await guardSuperadmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { id } = await params
  await Feedback.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}