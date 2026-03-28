import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { LibraryBook, LibraryIssue } from '@/models/Library'
import '@/models/Student'
import '@/models/User'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const status = req.nextUrl.searchParams.get('status')

    const filter: any = { tenantId: session.user.tenantId }
    if (status) filter.status = status

    // Auto-mark overdue
    await LibraryIssue.updateMany(
        { tenantId: session.user.tenantId, status: 'issued', dueDate: { $lt: new Date() } },
        { status: 'overdue' }
    )

    const issues = await LibraryIssue.find(filter)
        .populate('bookId', 'title author isbn')
        .populate({
            path: 'studentId',
            select: 'admissionNo class',
            populate: { path: 'userId', select: 'name' }
        })
        .sort({ createdAt: -1 })
        .lean()

    const stats = {
        totalIssued: issues.filter(i => i.status === 'issued').length,
        overdue: issues.filter(i => i.status === 'overdue').length,
        returned: issues.filter(i => i.status === 'returned').length,
        totalFines: issues.reduce((s, i) => s + (i.fine || 0), 0),
    }

    return NextResponse.json({ issues, stats })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { bookId, studentId, dueDate } = await req.json()

    const book = await LibraryBook.findOne({ _id: bookId, tenantId: session.user.tenantId })
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    if (book.availableCopies < 1) return NextResponse.json({ error: 'No copies available' }, { status: 400 })

    // Check if student already has this book
    const existing = await LibraryIssue.findOne({
        tenantId: session.user.tenantId,
        bookId,
        studentId,
        status: { $in: ['issued', 'overdue'] },
    })
    if (existing) return NextResponse.json({ error: 'Student already has this book' }, { status: 400 })

    const issue = await LibraryIssue.create({
        tenantId: session.user.tenantId,
        bookId,
        studentId,
        issuedAt: new Date(),
        dueDate: new Date(dueDate),
        status: 'issued',
        issuedBy: session.user.id,
    })

    await LibraryBook.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } })

    return NextResponse.json({ issue }, { status: 201 })
}