import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { logAudit } from '@/lib/audit'
import { LibraryBook } from '@/models/Library'

// ─────────────────────────────────────────────
// GET /api/library/books
// Query: search, category, available, page, limit
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['library'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const { searchParams } = req.nextUrl

    const search = searchParams.get('search')?.trim()
    const category = searchParams.get('category')?.trim()
    const available = searchParams.get('available') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
    const skip = (page - 1) * limit

    await connectDB()

    try {
        const filter: Record<string, any> = {
            tenantId: session.user.tenantId,
            isActive: true,
        }

        if (category) filter.category = category
        if (available) filter.availableCopies = { $gt: 0 }

        // Full-text search OR regex fallback
        if (search) {
            if (search.length >= 3) {
                filter.$text = { $search: search }
            } else {
                filter.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } },
                    { isbn: { $regex: search, $options: 'i' } },
                ]
            }
        }

        const [books, total] = await Promise.all([
            LibraryBook.find(filter)
                .sort(search ? { score: { $meta: 'textScore' } } : { title: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            LibraryBook.countDocuments(filter),
        ])

        // Stats — always from full collection (no search filter)
        const statsFilter = {
            tenantId: session.user.tenantId,
            isActive: true,
        }
        const allBooks = await LibraryBook.find(statsFilter)
            .select('totalCopies availableCopies category')
            .lean()

        const stats = {
            totalBooks: allBooks.length,
            totalCopies: allBooks.reduce((s, b) => s + b.totalCopies, 0),
            availableCopies: allBooks.reduce((s, b) => s + b.availableCopies, 0),
            issuedCopies: allBooks.reduce((s, b) => s + (b.totalCopies - b.availableCopies), 0),
            categories: [...new Set(allBooks.map(b => b.category))].sort(),
        }

        return NextResponse.json({
            success: true,
            books,
            stats,
            pagination: {
                page, limit, total,
                pages: Math.ceil(total / limit),
            },
        })

    } catch (err: any) {
        console.error('[LIBRARY BOOKS GET]', err)
        return NextResponse.json(
            { error: 'Failed to fetch books' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// POST /api/library/books — Add book
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        title: string
        author: string
        isbn?: string
        category: string
        publisher?: string
        publishYear?: number
        edition?: string
        language?: string
        tags?: string[]
        totalCopies: number
        location?: string
        description?: string
    }>(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['library'],
        rateLimit: 'mutation',
        auditAction: 'CREATE',
        auditResource: 'Library',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    // ── Validate ──
    if (!body.title?.trim()) {
        return NextResponse.json({ error: 'Book title is required' }, { status: 400 })
    }
    if (!body.author?.trim()) {
        return NextResponse.json({ error: 'Author name is required' }, { status: 400 })
    }
    const copies = Math.max(1, parseInt(String(body.totalCopies)) || 1)

    await connectDB()

    try {
        // Duplicate ISBN check (within same school)
        if (body.isbn?.trim()) {
            const dup = await LibraryBook.findOne({
                tenantId: session.user.tenantId,
                isbn: body.isbn.trim(),
                isActive: true,
            }).lean()
            if (dup) {
                return NextResponse.json(
                    { error: `A book with ISBN "${body.isbn}" already exists` },
                    { status: 409 }
                )
            }
        }

        const book = await LibraryBook.create({
            tenantId: session.user.tenantId,
            title: body.title.trim(),
            author: body.author.trim(),
            isbn: body.isbn?.trim() ?? '',
            category: body.category?.trim() ?? 'General',
            publisher: body.publisher?.trim() ?? '',
            publishYear: body.publishYear ?? undefined,
            edition: body.edition?.trim() ?? '',
            language: body.language?.trim() ?? 'English',
            tags: body.tags ?? [],
            totalCopies: copies,
            availableCopies: copies,
            location: body.location?.trim() ?? '',
            description: body.description?.trim() ?? '',
            isActive: true,
            createdBy: session.user.id,
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Library',
            resourceId: book._id.toString(),
            description: `Added book: "${book.title}" by ${book.author} (${copies} copies)`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json(
            { success: true, book, message: 'Book added successfully' },
            { status: 201 }
        )

    } catch (err: any) {
        console.error('[LIBRARY BOOKS POST]', err)
        return NextResponse.json(
            { error: 'Failed to add book' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// PUT /api/library/books — Edit book
// Body: { id, ...fields }
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function PUT(req: NextRequest) {
    const guard = await apiGuardWithBody<{
        id: string
        title?: string
        author?: string
        isbn?: string
        category?: string
        publisher?: string
        publishYear?: number
        edition?: string
        language?: string
        tags?: string[]
        totalCopies?: number
        location?: string
        description?: string
    }>(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['library'],
        rateLimit: 'mutation',
        auditAction: 'UPDATE',
        auditResource: 'Library',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    if (!body.id) {
        return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    await connectDB()

    try {
        const existing = await LibraryBook.findOne({
            _id: body.id,
            tenantId: session.user.tenantId,
            isActive: true,
        })
        if (!existing) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 })
        }

        // If totalCopies changed — adjust availableCopies proportionally
        const updateData: Record<string, any> = { updatedBy: session.user.id }

        if (body.title) updateData.title = body.title.trim()
        if (body.author) updateData.author = body.author.trim()
        if (body.isbn !== undefined) updateData.isbn = body.isbn?.trim() ?? ''
        if (body.category) updateData.category = body.category.trim()
        if (body.publisher !== undefined) updateData.publisher = body.publisher?.trim() ?? ''
        if (body.publishYear) updateData.publishYear = body.publishYear
        if (body.edition !== undefined) updateData.edition = body.edition?.trim() ?? ''
        if (body.language) updateData.language = body.language.trim()
        if (body.tags) updateData.tags = body.tags
        if (body.location !== undefined) updateData.location = body.location?.trim() ?? ''
        if (body.description !== undefined) updateData.description = body.description?.trim() ?? ''

        if (body.totalCopies !== undefined) {
            const newTotal = Math.max(1, parseInt(String(body.totalCopies)) || 1)
            const issuedNow = existing.totalCopies - existing.availableCopies
            const newAvail = Math.max(0, newTotal - issuedNow)
            updateData.totalCopies = newTotal
            updateData.availableCopies = newAvail
        }

        const book = await LibraryBook.findByIdAndUpdate(
            body.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Library',
            resourceId: body.id,
            description: `Updated book: "${existing.title}"`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ success: true, book })

    } catch (err: any) {
        console.error('[LIBRARY BOOKS PUT]', err)
        return NextResponse.json(
            { error: 'Failed to update book' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────
// DELETE /api/library/books — Soft delete
// Body: { id }
// Roles: admin only
// ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const guard = await apiGuardWithBody<{ id: string }>(req, {
        allowedRoles: ['admin'],
        requiredModules: ['library'],
        rateLimit: 'mutation',
        auditAction: 'DELETE',
        auditResource: 'Library',
    })
    if (guard instanceof NextResponse) return guard

    const { session, body, clientInfo } = guard

    if (!body.id) {
        return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    await connectDB()

    try {
        const book = await LibraryBook.findOne({
            _id: body.id,
            tenantId: session.user.tenantId,
        })
        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 })
        }

        // Cannot delete if copies are issued
        if (book.availableCopies < book.totalCopies) {
            return NextResponse.json(
                { error: `Cannot delete — ${book.totalCopies - book.availableCopies} copies are currently issued` },
                { status: 409 }
            )
        }

        await LibraryBook.findByIdAndUpdate(body.id, {
            $set: { isActive: false, updatedBy: session.user.id },
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: 'DELETE',
            resource: 'Library',
            resourceId: body.id,
            description: `Deleted book: "${book.title}" by ${book.author}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ success: true, message: 'Book deleted successfully' })

    } catch (err: any) {
        console.error('[LIBRARY BOOKS DELETE]', err)
        return NextResponse.json(
            { error: 'Failed to delete book' },
            { status: 500 }
        )
    }
}