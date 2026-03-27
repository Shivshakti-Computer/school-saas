// FILE: src/app/api/library/books/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { LibraryBook } from '@/models/Library'
import { checkModuleAccess, moduleBlockedResponse } from '@/lib/planGaurd'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!checkModuleAccess(session.user.plan, 'library')) return moduleBlockedResponse('library')
    await connectDB()
    const books = await LibraryBook.find({ tenantId: session.user.tenantId, isActive: true }).sort({ title: 1 }).lean()
    return NextResponse.json({ books })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!checkModuleAccess(session.user.plan, 'library')) return moduleBlockedResponse('library')
    await connectDB()
    const body = await req.json()
    const book = await LibraryBook.create({
        tenantId: session.user.tenantId,
        title: body.title,
        author: body.author,
        isbn: body.isbn,
        category: body.category ?? 'General',
        totalCopies: Number(body.totalCopies) || 1,
        availableCopies: Number(body.totalCopies) || 1,
        location: body.location,
        isActive: true,
    })
    return NextResponse.json({ book }, { status: 201 })
}