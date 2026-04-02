// FILE: src/app/api/superadmin/schools/route.ts
// UPDATED: creditBalance + addonLimits fields, manual credit adjust

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { MessageCredit } from '@/models/MessageCredit'
import { CreditTransaction } from '@/models/CreditTransaction'
import { NextRequest, NextResponse } from 'next/server'

// ── GET — all schools list ──
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const schools = await School.find({})
    .sort({ createdAt: -1 })
    .select(
      'name subdomain plan isActive trialEndsAt subscriptionId phone email address modules createdAt creditBalance addonLimits'
    )
    .lean()

  // Credit balances for each school
  const schoolIds = schools.map(s => (s._id as any).toString())
  const creditRecords = await MessageCredit.find({
    tenantId: { $in: schoolIds },
  })
    .select('tenantId balance totalUsed totalEarned')
    .lean()

  const creditMap = creditRecords.reduce((acc: any, c) => {
    acc[c.tenantId.toString()] = c
    return acc
  }, {})

  const schoolsWithCredits = schools.map(s => ({
    ...s,
    creditInfo: creditMap[(s._id as any).toString()] ?? {
      balance: (s as any).creditBalance ?? 0,
      totalUsed: 0,
      totalEarned: 0,
    },
  }))

  return NextResponse.json({
    schools: JSON.parse(JSON.stringify(schoolsWithCredits)),
  })
}

// ── PUT — toggle active, change plan, extend trial, adjust credits ──
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

  // ── Manual credit adjustment ──
  if (typeof updates.adjustCredits === 'number') {
    const amount = updates.adjustCredits

    let credit = await MessageCredit.findOne({ tenantId: id })
    if (!credit) {
      credit = await MessageCredit.create({
        tenantId: id,
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
      })
    }

    const newBalance = Math.max(0, credit.balance + amount)

    await MessageCredit.findOneAndUpdate(
      { tenantId: id },
      {
        $inc: {
          balance: amount,
          ...(amount > 0 ? { totalEarned: amount } : {}),
        },
        $set: { balance: newBalance },
      }
    )

    // Log transaction
    await CreditTransaction.create({
      tenantId: id,
      type: amount > 0 ? 'manual_add' : 'manual_deduct',
      amount,
      channel: 'manual',
      purpose: 'superadmin_adjustment',
      description: `Manual adjustment by superadmin: ${amount > 0 ? '+' : ''}${amount} credits`,
      createdBy: session.user.id,
    })

    const updatedCredit = await MessageCredit.findOne({ tenantId: id }).lean()
    return NextResponse.json({
      success: true,
      creditBalance: (updatedCredit as any)?.balance ?? 0,
    })
  }

  // ── General school field updates ──
  const allowedFields: Record<string, boolean> = {
    isActive: true,
    plan: true,
    trialEndsAt: true,
    modules: true,
    addonLimits: true,
  }

  const safeUpdates: Record<string, any> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields[key]) {
      safeUpdates[key] = value
    }
  }

  const school = await School.findByIdAndUpdate(
    id,
    { $set: safeUpdates },
    { new: true }
  )
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    school: JSON.parse(JSON.stringify(school)),
  })
}