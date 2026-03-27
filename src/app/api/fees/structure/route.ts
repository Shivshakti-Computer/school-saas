// -------------------------------------------------------------
// FILE: src/app/api/fees/structure/route.ts — COMPLETE REWRITE
// GET  → list all structures (with filters)
// POST → create + auto-assign to existing students
// -------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { FeeStructure } from '@/models/FeeStructure'
import { Fee } from '@/models/Fee'
import { Student } from '@/models/Student'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()

    const { searchParams } = req.nextUrl
    const cls = searchParams.get('class')
    const academicYear = searchParams.get('year')

    const query: any = { tenantId: session.user.tenantId }
    if (cls && cls !== 'all') query.class = { $in: [cls, 'all'] }
    if (academicYear) query.academicYear = academicYear

    const structures = await FeeStructure.find(query)
      .sort({ createdAt: -1 })
      .lean()

    // Count students per structure
    const withCounts = await Promise.all(
      structures.map(async s => {
        const assignedCount = await Fee.countDocuments({
          tenantId: session.user.tenantId,
          structureId: s._id,
        })
        return { ...s, assignedCount }
      })
    )

    return NextResponse.json({ structures: withCounts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const body = await req.json()

    if (!body.name || !body.class || !body.dueDate || !body.items?.length) {
      return NextResponse.json({ error: 'name, class, dueDate, items required' }, { status: 400 })
    }

    const totalAmount = body.items.reduce((s: number, i: any) => s + Number(i.amount), 0)

    const structure = await FeeStructure.create({
      tenantId: session.user.tenantId,
      name: body.name,
      class: body.class,
      section: body.section || 'all',
      academicYear: body.academicYear ?? new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
      term: body.term ?? 'Term 1',
      items: body.items,
      totalAmount,
      dueDate: new Date(body.dueDate),
      lateFinePerDay: Number(body.lateFinePerDay) || 0,
      lateFineType: body.lateFineType || 'fixed',
      maxLateFine: Number(body.maxLateFine) || 0,
      isActive: true,
      autoAssign: body.autoAssign !== false,
      createdBy: session.user.id,
    })

    // Auto-assign to existing students
    let feesCreated = 0
    if (body.autoAssign !== false) {
      const studentQuery: any = {
        tenantId: session.user.tenantId,
        status: 'active',
      }
      // Class filter
      if (body.class !== 'all') {
        const classes = body.class.split(',').map((c: string) => c.trim())
        studentQuery.class = { $in: classes }
      }
      // Section filter
      if (body.section && body.section !== 'all') {
        studentQuery.section = body.section
      }

      const students = await Student.find(studentQuery).select('_id').lean()

      if (students.length > 0) {
        const ops = students.map(s => ({
          insertOne: {
            document: {
              tenantId: session.user.tenantId,
              studentId: s._id,
              structureId: structure._id,
              amount: totalAmount,
              discount: 0,
              lateFine: 0,
              finalAmount: totalAmount,
              dueDate: new Date(body.dueDate),
              status: 'pending',
              paidAmount: 0,
            },
          },
        }))
        await Fee.bulkWrite(ops)
        feesCreated = students.length
      }
    }

    return NextResponse.json({ structure, feesCreated }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}