import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { LibraryBook } from '@/models/Library'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const filter: any = { tenantId: session.user.tenantId, isActive: true }
    if (category) filter.category = category
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: { $regex: search, $options: 'i' } },
            { isbn: { $regex: search, $options: 'i' } },
        ]
    }

    const books = await LibraryBook.find(filter).sort({ title: 1 }).lean()
    const stats = {
        totalBooks: books.length,
        totalCopies: books.reduce((s, b) => s + b.totalCopies, 0),
        availableCopies: books.reduce((s, b) => s + b.availableCopies, 0),
        issuedCopies: books.reduce((s, b) => s + (b.totalCopies - b.availableCopies), 0),
    }

    return NextResponse.json({ books, stats })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const book = await LibraryBook.create({
        tenantId: session.user.tenantId,
        title: body.title,
        author: body.author,
        isbn: body.isbn,
        category: body.category || 'General',
        publisher: body.publisher,
        publishYear: body.publishYear,
        totalCopies: Number(body.totalCopies) || 1,
        availableCopies: Number(body.totalCopies) || 1,
        location: body.location,
        isActive: true,
    })

    return NextResponse.json({ book }, { status: 201 })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, ...data } = await req.json()

    const book = await LibraryBook.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        data,
        { new: true }
    )

    return NextResponse.json({ book })
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await req.json()

    await LibraryBook.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        { isActive: false }
    )

    return NextResponse.json({ success: true })
}