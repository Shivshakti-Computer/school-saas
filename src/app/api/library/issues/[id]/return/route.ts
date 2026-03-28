import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { LibraryBook, LibraryIssue } from '@/models/Library'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const body = await req.json()
    const finePerDay = body.finePerDay || 2

    const issue = await LibraryIssue.findOne({ _id: id, tenantId: session.user.tenantId })
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    if (issue.status === 'returned') return NextResponse.json({ error: 'Already returned' }, { status: 400 })

    const today = new Date()
    const dueDate = new Date(issue.dueDate)
    const daysLate = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / 86400000))
    const fine = daysLate * finePerDay

    await LibraryIssue.findByIdAndUpdate(id, {
        status: 'returned',
        returnedAt: today,
        fine,
    })

    await LibraryBook.findByIdAndUpdate(issue.bookId, { $inc: { availableCopies: 1 } })

    return NextResponse.json({ success: true, fine, daysLate })
}