import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { NextRequest, NextResponse } from 'next/server'

// GET — all schools list
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const schools = await School.find({})
    .sort({ createdAt: -1 })
    .select('name subdomain plan isActive trialEndsAt subscriptionId phone email address modules createdAt')
    .lean()

  return NextResponse.json({ schools: JSON.parse(JSON.stringify(schools)) })
}

// PUT — toggle school active status, change plan, extend trial
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'School ID required' }, { status: 400 })
  }

  // Only allow specific fields to be updated
  const allowedFields: Record<string, boolean> = {
    isActive: true,
    plan: true,
    trialEndsAt: true,
    modules: true,
  }

  const safeUpdates: Record<string, any> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields[key]) {
      safeUpdates[key] = value
    }
  }

  const school = await School.findByIdAndUpdate(id, safeUpdates, { new: true })
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, school: JSON.parse(JSON.stringify(school)) })
}