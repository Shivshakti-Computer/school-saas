// -------------------------------------------------------------
// FILE: src/app/api/fees/structure/[id]/assign/route.ts
// POST → manually assign fee to specific students
// -------------------------------------------------------------

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
 
  const structure = await FeeStructure.findOne({ _id: id, tenantId: session.user.tenantId })
  if (!structure) return NextResponse.json({ error: 'Not found' }, { status: 404 })
 
  const body = await req.json()
  const { studentIds, assignAll } = body
 
  let students: any[] = []
 
  if (assignAll) {
    // All students in this class
    const classFilter: any = { tenantId: session.user.tenantId, status: 'active' }
    if (structure.class !== 'all') {
      classFilter.class = { $in: structure.class.split(',').map((c: string) => c.trim()) }
    }
    students = await Student.find(classFilter).select('_id').lean()
  } else {
    students = (studentIds ?? []).map((id: string) => ({ _id: id }))
  }
 
  let created = 0
  let skipped = 0
 
  for (const s of students) {
    // Check if already assigned
    const exists = await Fee.findOne({
      tenantId:    session.user.tenantId,
      studentId:   s._id,
      structureId: id,
    })
    if (exists) { skipped++; continue }
 
    await Fee.create({
      tenantId:    session.user.tenantId,
      studentId:   s._id,
      structureId: id,
      amount:      structure.totalAmount,
      discount:    0,
      lateFine:    0,
      finalAmount: structure.totalAmount,
      dueDate:     structure.dueDate,
      status:      'pending',
      paidAmount:  0,
    })
    created++
  }
 
  return NextResponse.json({ created, skipped, total: students.length })
}