'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState, StatCard } from '@/components/ui'
import { Library, Plus, BookOpen, ArrowLeft, Search, RotateCcw } from 'lucide-react'

const CATEGORIES = ['General', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Literature', 'Computer', 'Reference', 'Magazine']

export default function LibraryPage() {
    const [tab, setTab] = useState<'books' | 'issues'>('books')
    const [books, setBooks] = useState<any[]>([])
    const [issues, setIssues] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [bookStats, setBookStats] = useState<any>(null)
    const [issueStats, setIssueStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('')

    // Modals
    const [addBookModal, setAddBookModal] = useState(false)
    const [issueBookModal, setIssueBookModal] = useState(false)

    // Forms
    const [bookForm, setBookForm] = useState({
        title: '', author: '', isbn: '', category: 'General', publisher: '', totalCopies: 1, location: '',
    })
    const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '' })

    const fetchBooks = async () => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (filterCat) params.set('category', filterCat)
        const res = await fetch(`/api/library/books?${params}`)
        const data = await res.json()
        setBooks(data.books || [])
        setBookStats(data.stats)
    }

    const fetchIssues = async () => {
        const res = await fetch('/api/library/issues')
        const data = await res.json()
        setIssues(data.issues || [])
        setIssueStats(data.stats)
    }

    const fetchStudents = async () => {
        const res = await fetch('/api/students')
        const data = await res.json()
        setStudents(Array.isArray(data) ? data : data.students || [])
    }

    useEffect(() => {
        Promise.all([fetchBooks(), fetchIssues(), fetchStudents()]).then(() => setLoading(false))
    }, [])

    useEffect(() => { fetchBooks() }, [search, filterCat])

    const handleAddBook = async () => {
        if (!bookForm.title.trim() || !bookForm.author.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/library/books', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookForm),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Book added!' })
            setAddBookModal(false)
            setBookForm({ title: '', author: '', isbn: '', category: 'General', publisher: '', totalCopies: 1, location: '' })
            fetchBooks()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handleIssueBook = async () => {
        if (!issueForm.bookId || !issueForm.studentId || !issueForm.dueDate) return
        setSaving(true)
        try {
            const res = await fetch('/api/library/issues', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(issueForm),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setAlert({ type: 'success', msg: 'Book issued!' })
            setIssueBookModal(false)
            setIssueForm({ bookId: '', studentId: '', dueDate: '' })
            fetchBooks()
            fetchIssues()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handleReturn = async (issueId: string) => {
        try {
            const res = await fetch(`/api/library/issues/${issueId}/return`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finePerDay: 2 }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setAlert({ type: 'success', msg: data.fine > 0 ? `Returned! Late fine: ₹${data.fine} (${data.daysLate} days)` : 'Returned successfully!' })
            fetchBooks()
            fetchIssues()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Library Management"
                subtitle="Books, issues, returns"
                action={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setIssueBookModal(true)}>
                            <BookOpen size={16} /> Issue Book
                        </Button>
                        <Button onClick={() => setAddBookModal(true)}>
                            <Plus size={16} /> Add Book
                        </Button>
                    </div>
                }
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {/* Stats */}
            {bookStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Books" value={bookStats.totalBooks} icon={<Library size={18} />} color="indigo" />
                    <StatCard label="Total Copies" value={bookStats.totalCopies} icon={<BookOpen size={18} />} color="blue" />
                    <StatCard label="Available" value={bookStats.availableCopies} icon={<BookOpen size={18} />} color="emerald" />
                    <StatCard label="Issued" value={bookStats.issuedCopies} icon={<BookOpen size={18} />} color="amber" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {(['books', 'issues'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {t === 'books' ? `Books (${books.length})` : `Issues (${issueStats?.totalIssued || 0} active)`}
                    </button>
                ))}
            </div>

            {/* Books Tab */}
            {tab === 'books' && (
                <>
                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books..." className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                        </div>
                        <Select value={filterCat} onChange={e => setFilterCat(e.target.value)} options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
                    </div>
                    {books.length === 0 ? (
                        <EmptyState icon={<Library size={24} />} title="No books" description="Add books to your library" />
                    ) : (
                        <Card padding={false}>
                            <Table headers={['Title', 'Author', 'ISBN', 'Category', 'Location', 'Copies', 'Available']}>
                                {books.map(b => (
                                    <Tr key={b._id}>
                                        <Td className="font-medium">{b.title}</Td>
                                        <Td>{b.author}</Td>
                                        <Td className="text-xs text-slate-500 font-mono">{b.isbn || '—'}</Td>
                                        <Td><Badge>{b.category}</Badge></Td>
                                        <Td className="text-xs text-slate-500">{b.location || '—'}</Td>
                                        <Td>{b.totalCopies}</Td>
                                        <Td><Badge variant={b.availableCopies > 0 ? 'success' : 'danger'}>{b.availableCopies}</Badge></Td>
                                    </Tr>
                                ))}
                            </Table>
                        </Card>
                    )}
                </>
            )}

            {/* Issues Tab */}
            {tab === 'issues' && (
                <Card padding={false}>
                    {issues.length === 0 ? (
                        <div className="py-10 text-center text-slate-400">No issues found</div>
                    ) : (
                        <Table headers={['Book', 'Student', 'Issued', 'Due Date', 'Status', 'Fine', 'Action']}>
                            {issues.map(i => (
                                <Tr key={i._id}>
                                    <Td className="font-medium">{i.bookId?.title || 'Unknown'}</Td>
                                    <Td>{i.studentId?.userId?.name || 'Unknown'} <span className="text-xs text-slate-400">({i.studentId?.admissionNo})</span></Td>
                                    <Td className="text-xs">{new Date(i.issuedAt).toLocaleDateString('en-IN')}</Td>
                                    <Td className="text-xs">{new Date(i.dueDate).toLocaleDateString('en-IN')}</Td>
                                    <Td>
                                        <Badge variant={i.status === 'returned' ? 'success' : i.status === 'overdue' ? 'danger' : 'warning'}>
                                            {i.status}
                                        </Badge>
                                    </Td>
                                    <Td>{i.fine > 0 ? `₹${i.fine}` : '—'}</Td>
                                    <Td>
                                        {i.status !== 'returned' && (
                                            <Button size="sm" variant="secondary" onClick={() => handleReturn(i._id)}>
                                                <RotateCcw size={12} /> Return
                                            </Button>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Table>
                    )}
                </Card>
            )}

            {/* Add Book Modal */}
            <Modal open={addBookModal} onClose={() => setAddBookModal(false)} title="Add Book">
                <div className="space-y-4">
                    <Input label="Title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Author" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
                        <Input label="ISBN" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Select label="Category" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
                        <Input label="Total Copies" type="number" value={String(bookForm.totalCopies)} onChange={e => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Publisher" value={bookForm.publisher} onChange={e => setBookForm({ ...bookForm, publisher: e.target.value })} />
                        <Input label="Shelf/Rack" value={bookForm.location} onChange={e => setBookForm({ ...bookForm, location: e.target.value })} />
                    </div>
                    <Button className="w-full" onClick={handleAddBook} loading={saving}>Add Book</Button>
                </div>
            </Modal>

            {/* Issue Book Modal */}
            <Modal open={issueBookModal} onClose={() => setIssueBookModal(false)} title="Issue Book">
                <div className="space-y-4">
                    <Select label="Book" value={issueForm.bookId} onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })} options={[{ value: '', label: 'Select Book' }, ...books.filter(b => b.availableCopies > 0).map(b => ({ value: b._id, label: `${b.title} — ${b.author} (${b.availableCopies} avail)` }))]} />
                    <Select label="Student" value={issueForm.studentId} onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })} options={[{ value: '', label: 'Select Student' }, ...students.map((s: any) => ({ value: s._id, label: `${s.userId?.name || 'Unknown'} — ${s.class} (${s.admissionNo})` }))]} />
                    <Input label="Due Date" type="date" value={issueForm.dueDate} onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })} />
                    <Button className="w-full" onClick={handleIssueBook} loading={saving}>Issue Book</Button>
                </div>
            </Modal>
        </div>
    )
}