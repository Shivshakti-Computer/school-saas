// FILE: src/app/api/superadmin/enquiries/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Enquiry } from '@/models/Enquiry'

async function guardSuperadmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') return null
  return session
}

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
  const update: any = { ...body }

  if (body.status === 'resolved') {
    update.resolvedAt = new Date()
  }

  const updated = await Enquiry.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  )

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, enquiry: updated })
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
  await Enquiry.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}