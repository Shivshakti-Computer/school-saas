// FILE: src/app/api/library/issues/[id]/return/route.ts

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { LibraryBook, LibraryIssue } from "@/models/Library"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') return NextResponse.json({error:'Unauthorized'},{status:401})
  await connectDB()
  const { id } = await params
 
  const issue = await LibraryIssue.findOne({ _id: id, tenantId: session.user.tenantId })
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
 
  const today     = new Date()
  const dueDate   = new Date(issue.dueDate)
  const daysLate  = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / 86400000))
  const lateFine  = daysLate * 2  // ₹2 per day
 
  await LibraryIssue.findByIdAndUpdate(id, {
    status: 'returned', returnedDate: today, lateFine,
  })
  await LibraryBook.findByIdAndUpdate(issue.bookId, { $inc: { availableCopies: 1 } })
 
  return NextResponse.json({ success: true, lateFine, daysLate })
}