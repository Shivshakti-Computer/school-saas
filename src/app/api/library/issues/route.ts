// FILE: src/app/api/library/issues/route.ts
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { checkModuleAccess, moduleBlockedResponse } from '@/lib/planGaurd'
import { LibraryBook, LibraryIssue } from '@/models/Library'
import '@/models/Student'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!checkModuleAccess(session.user.plan, 'library')) return moduleBlockedResponse('library')
    await connectDB()
    const status = req.nextUrl.searchParams.get('status')
    const query: any = { tenantId: session.user.tenantId }
    if (status) query.status = status
    const issues = await LibraryIssue.find(query)
        .populate('bookId', 'title author')
        .populate({ path: 'studentId', select: 'admissionNo', populate: { path: 'userId', select: 'name' } })
        .sort({ createdAt: -1 })
        .lean()
    return NextResponse.json({ issues })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!checkModuleAccess(session.user.plan, 'library')) return moduleBlockedResponse('library')
    await connectDB()
    const { bookId, studentId, dueDate } = await req.json()

    const book = await LibraryBook.findOne({ _id: bookId, tenantId: session.user.tenantId })
    if (!book || book.availableCopies < 1) return NextResponse.json({ error: 'Book not available' }, { status: 400 })

    const issue = await LibraryIssue.create({
        tenantId: session.user.tenantId, bookId, studentId,
        issuedDate: new Date(),
        dueDate: new Date(dueDate),
        status: 'issued',
    })
    await LibraryBook.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } })
    return NextResponse.json({ issue }, { status: 201 })
}