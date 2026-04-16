import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { LibraryBook, LibraryIssue } from '@/models/Library'
import { SchoolSettings } from '@/models/SchoolSettings'  // ✅ ADD
import { LibraryClient } from './LibraryClient'
import '@/models/Student'
import '@/models/User'
import { requireModule } from '@/lib/planGuard'

export const metadata = {
  title: 'Library | Skolify',
}

export default async function LibraryPage() {
  await requireModule('library')

  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  await connectDB()

  // ✅ Fetch settings — same pattern as other modules
  const settings = await SchoolSettings.findOne({
    tenantId: session.user.tenantId,
  })
    .select('modules.library')
    .lean()

  const librarySettings = settings?.modules?.library ?? {
    maxIssueDays: 14,
    finePerDay: 2,
    maxBooksPerStudent: 2,
  }

  // ── Auto-mark overdue before page load ──
  await LibraryIssue.updateMany(
    {
      tenantId: session.user.tenantId,
      status: 'issued',
      dueDate: { $lt: new Date() },
    },
    { $set: { status: 'overdue' } }
  )

  // ── Initial data fetch ──
  const [books, issues] = await Promise.all([
    LibraryBook.find({
      tenantId: session.user.tenantId,
      isActive: true,
    })
      .sort({ title: 1 })
      .limit(100)
      .lean(),

    LibraryIssue.find({
      tenantId: session.user.tenantId,
      status: { $in: ['issued', 'overdue'] },
    })
      .populate('bookId', 'title author isbn')
      .populate({
        path: 'studentId',
        select: 'admissionNo class section',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ dueDate: 1 })
      .limit(100)
      .lean(),
  ])

  // ── Stats ──
  const allBooks = books
  const allIssues = await LibraryIssue.find({
    tenantId: session.user.tenantId,
  }).select('status fine finePaid').lean()

  const bookStats = {
    totalBooks: allBooks.length,
    totalCopies: allBooks.reduce((s, b) => s + b.totalCopies, 0),
    availableCopies: allBooks.reduce((s, b) => s + b.availableCopies, 0),
    issuedCopies: allBooks.reduce((s, b) => s + (b.totalCopies - b.availableCopies), 0),
    categories: [...new Set(allBooks.map(b => b.category))].sort(),
  }

  const issueStats = {
    totalIssued: allIssues.filter(i => i.status === 'issued').length,
    overdue: allIssues.filter(i => i.status === 'overdue').length,
    returned: allIssues.filter(i => i.status === 'returned').length,
    totalFines: allIssues.reduce((s, i) => s + (i.fine || 0), 0),
    unpaidFines: allIssues
      .filter(i => !i.finePaid && i.fine > 0)
      .reduce((s, i) => s + i.fine, 0),
  }

  return (
    <LibraryClient
      initialBooks={JSON.parse(JSON.stringify(books))}
      initialIssues={JSON.parse(JSON.stringify(issues))}
      bookStats={bookStats}
      issueStats={issueStats}
      userRole={session.user.role}
      librarySettings={librarySettings}  // ✅ ADD
    />
  )
}