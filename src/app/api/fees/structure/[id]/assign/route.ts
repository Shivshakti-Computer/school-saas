// FILE: src/app/api/fees/structure/[id]/assign/route.ts

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { Student } from "@/models/Student"
import { FeeStructure } from "@/models/FeeStructure"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { Fee } from "@/models/Fee"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await connectDB()

  const structure = await FeeStructure.findOne({
    _id: id,
    tenantId: session.user.tenantId,
  })
  if (!structure) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ✅ FIX — Mandatory amount fresh calculate karo
  // structure.totalAmount pe depend mat karo (could be stale)
  const mandatoryAmount = structure.items
    .filter((i: any) => !i.isOptional)
    .reduce((s: number, i: any) => s + Number(i.amount), 0)

  const body = await req.json()
  const { studentIds, assignAll } = body

  let students: any[] = []

  if (assignAll) {
    const classFilter: any = {
      tenantId: session.user.tenantId,
      status: 'active',
    }
    if (structure.class !== 'all') {
      classFilter.class = {
        $in: structure.class.split(',').map((c: string) => c.trim()),
      }
    }
    if (structure.section && structure.section !== 'all') {
      classFilter.section = structure.section
    }
    students = await Student.find(classFilter).select('_id').lean()
  } else {
    students = (studentIds ?? []).map((sid: string) => ({ _id: sid }))
  }

  let created = 0
  let skipped = 0

  // ✅ N+1 fix — ek query mein saare existing check karo
  const existingFees = await Fee.find({
    tenantId: session.user.tenantId,
    structureId: id,
    isOptionalFee: { $ne: true },   // ✅ sirf regular fees check
    studentId: { $in: students.map(s => s._id) },
  }).select('studentId').lean()

  const alreadyAssigned = new Set(
    existingFees.map((f: any) => f.studentId.toString())
  )

  const ops = []
  for (const s of students) {
    if (alreadyAssigned.has(s._id.toString())) {
      skipped++
      continue
    }
    ops.push({
      insertOne: {
        document: {
          tenantId: session.user.tenantId,
          studentId: s._id,
          structureId: id,
          amount: mandatoryAmount,  // ✅ fresh calculated
          discount: 0,
          lateFine: 0,
          finalAmount: mandatoryAmount,  // ✅ fresh calculated
          dueDate: structure.dueDate,
          status: 'pending',
          paidAmount: 0,
          isOptionalFee: false,            // ✅ explicit flag
        },
      },
    })
    created++
  }

  if (ops.length > 0) {
    await Fee.bulkWrite(ops)
  }

  return NextResponse.json({
    created,
    skipped,
    total: students.length,
  })
}