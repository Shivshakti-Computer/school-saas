import { NextRequest, NextResponse } from 'next/server'
import { connectDB }            from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { logAudit }             from '@/lib/audit'
import { LibraryBook, LibraryIssue } from '@/models/Library'
import '@/models/Student'
import '@/models/User'

// ─────────────────────────────────────────────
// GET /api/library/issues
// Query: status, studentId, page, limit
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const guard = await apiGuard(req, {
    allowedRoles:    ['admin', 'staff'],
    requiredModules: ['library'],
    rateLimit:       'api',
  })
  if (guard instanceof NextResponse) return guard

  const { session } = guard
  const { searchParams } = req.nextUrl

  const status    = searchParams.get('status')?.trim()
  const studentId = searchParams.get('studentId')?.trim()
  const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit     = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const skip      = (page - 1) * limit

  await connectDB()

  try {
    // ── Auto-mark overdue ──
    await LibraryIssue.updateMany(
      {
        tenantId: session.user.tenantId,
        status:   'issued',
        dueDate:  { $lt: new Date() },
      },
      { $set: { status: 'overdue' } }
    )

    const filter: Record<string, any> = {
      tenantId: session.user.tenantId,
    }
    if (status)    filter.status    = status
    if (studentId) filter.studentId = studentId

    const [issues, total] = await Promise.all([
      LibraryIssue.find(filter)
        .populate('bookId', 'title author isbn category')
        .populate({
          path:     'studentId',
          select:   'admissionNo class section',
          populate: { path: 'userId', select: 'name phone' },
        })
        .populate('issuedBy',   'name')
        .populate('returnedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LibraryIssue.countDocuments(filter),
    ])

    // Stats from full collection
    const allIssues = await LibraryIssue.find({
      tenantId: session.user.tenantId,
    })
      .select('status fine finePaid')
      .lean()

    const stats = {
      totalIssued:  allIssues.filter(i => i.status === 'issued').length,
      overdue:      allIssues.filter(i => i.status === 'overdue').length,
      returned:     allIssues.filter(i => i.status === 'returned').length,
      lost:         allIssues.filter(i => i.status === 'lost').length,
      totalFines:   allIssues.reduce((s, i) => s + (i.fine || 0), 0),
      unpaidFines:  allIssues
        .filter(i => !i.finePaid && i.fine > 0)
        .reduce((s, i) => s + i.fine, 0),
    }

    return NextResponse.json({
      success: true,
      issues,
      stats,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (err: any) {
    console.error('[LIBRARY ISSUES GET]', err)
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────
// POST /api/library/issues — Issue a book
// Roles: admin, staff
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const guard = await apiGuardWithBody<{
    bookId:     string
    studentId:  string
    dueDate:    string
    finePerDay?: number
    notes?:     string
  }>(req, {
    allowedRoles:    ['admin', 'staff'],
    requiredModules: ['library'],
    rateLimit:       'mutation',
    auditAction:     'CREATE',
    auditResource:   'Library',
  })
  if (guard instanceof NextResponse) return guard

  const { session, body, clientInfo } = guard

  // ── Validate ──
  if (!body.bookId)    return NextResponse.json({ error: 'Book is required'    }, { status: 400 })
  if (!body.studentId) return NextResponse.json({ error: 'Student is required' }, { status: 400 })
  if (!body.dueDate)   return NextResponse.json({ error: 'Due date is required'}, { status: 400 })

  const due = new Date(body.dueDate)
  if (isNaN(due.getTime()) || due <= new Date()) {
    return NextResponse.json(
      { error: 'Due date must be a future date' },
      { status: 400 }
    )
  }

  await connectDB()

  try {
    // Check book exists + available
    const book = await LibraryBook.findOne({
      _id:      body.bookId,
      tenantId: session.user.tenantId,
      isActive: true,
    })
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }
    if (book.availableCopies < 1) {
      return NextResponse.json(
        { error: 'No copies available for this book' },
        { status: 400 }
      )
    }

    // Check student does not already have this book
    const existing = await LibraryIssue.findOne({
      tenantId:  session.user.tenantId,
      bookId:    body.bookId,
      studentId: body.studentId,
      status:    { $in: ['issued', 'overdue'] },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'This student already has a copy of this book' },
        { status: 409 }
      )
    }

    // Check student limit — max 3 books at a time
    const activeCount = await LibraryIssue.countDocuments({
      tenantId:  session.user.tenantId,
      studentId: body.studentId,
      status:    { $in: ['issued', 'overdue'] },
    })
    if (activeCount >= 3) {
      return NextResponse.json(
        { error: 'Student already has 3 books issued (maximum limit)' },
        { status: 400 }
      )
    }

    // Create issue + decrement book copies — atomic
    const [issue] = await Promise.all([
      LibraryIssue.create({
        tenantId:   session.user.tenantId,
        bookId:     body.bookId,
        studentId:  body.studentId,
        issuedAt:   new Date(),
        dueDate:    due,
        finePerDay: body.finePerDay ?? 2,
        status:     'issued',
        issuedBy:   session.user.id,
        notes:      body.notes?.trim() ?? '',
      }),
      LibraryBook.findByIdAndUpdate(
        body.bookId,
        { $inc: { availableCopies: -1 } }
      ),
    ])

    await logAudit({
      tenantId:    session.user.tenantId,
      userId:      session.user.id,
      userName:    session.user.name,
      userRole:    session.user.role,
      action:      'CREATE',
      resource:    'Library',
      resourceId:  issue._id.toString(),
      description: `Issued book "${book.title}" to student ${body.studentId} — due ${due.toLocaleDateString('en-IN')}`,
      ipAddress:   clientInfo.ip,
      userAgent:   clientInfo.userAgent,
      status:      'SUCCESS',
    })

    return NextResponse.json(
      { success: true, issue, message: 'Book issued successfully' },
      { status: 201 }
    )

  } catch (err: any) {
    console.error('[LIBRARY ISSUES POST]', err)
    return NextResponse.json(
      { error: 'Failed to issue book' },
      { status: 500 }
    )
  }
}