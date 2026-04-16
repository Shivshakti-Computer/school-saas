'use client'

import { useState, useCallback, useRef } from 'react'
import {
    Library, Plus, BookOpen, Search,
    RotateCcw, Edit2, Trash2, X,
    AlertTriangle, CheckCircle2,
    ChevronDown, Filter, Printer,
    BookMarked, Clock, AlertCircle,
    IndianRupee,
} from 'lucide-react'
import { PageHeader, Spinner, EmptyState, Badge } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
    'General', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics',
    'History', 'Literature', 'Computer', 'Reference', 'Magazine',
    'Hindi', 'English', 'Social Studies', 'Art', 'Music', 'Sports',
]

const LANGUAGES = ['English', 'Hindi', 'Sanskrit', 'Urdu', 'Marathi', 'Gujarati', 'Tamil', 'Telugu']

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface IBook {
    _id: string
    title: string
    author: string
    isbn: string
    category: string
    publisher: string
    publishYear?: number
    edition: string
    language: string
    tags: string[]
    totalCopies: number
    availableCopies: number
    location: string
    description: string
}

interface IIssue {
    _id: string
    bookId: { _id: string; title: string; author: string; isbn: string }
    studentId: {
        _id: string
        admissionNo: string
        class: string
        section: string
        userId: { name: string; phone?: string }
    }
    issuedAt: string
    dueDate: string
    returnedAt?: string
    fine: number
    finePaid: boolean
    status: 'issued' | 'returned' | 'overdue' | 'lost'
    finePerDay: number
}

interface BookStats {
    totalBooks: number
    totalCopies: number
    availableCopies: number
    issuedCopies: number
    categories: string[]
}

interface IssueStats {
    totalIssued: number
    overdue: number
    returned: number
    totalFines: number
    unpaidFines: number
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function calcDaysLeft(dueDate: string): number {
    const due = new Date(dueDate)
    const now = new Date()
    const diff = due.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({
    label, value, icon, bg, iconColor, subtext,
}: {
    label: string
    value: string | number
    icon: React.ReactNode
    bg: string
    iconColor: string
    subtext?: string
}) {
    return (
        <div
            className="rounded-[var(--radius-lg)] p-4 border transition-all duration-200"
            style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, color: iconColor }}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <p
                        className="text-2xl font-extrabold tabular-nums leading-none"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {value}
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {label}
                    </p>
                    {subtext && (
                        <p className="text-[0.625rem] mt-0.5" style={{ color: 'var(--text-light)' }}>
                            {subtext}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Add / Edit Book Modal
// ─────────────────────────────────────────────
function BookFormModal({
    book,
    onClose,
    onSave,
}: {
    book?: IBook | null
    onClose: () => void
    onSave: (data: any) => Promise<void>
}) {
    const isEdit = !!book
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        title: book?.title ?? '',
        author: book?.author ?? '',
        isbn: book?.isbn ?? '',
        category: book?.category ?? 'General',
        publisher: book?.publisher ?? '',
        publishYear: book?.publishYear ? String(book.publishYear) : '',
        edition: book?.edition ?? '',
        language: book?.language ?? 'English',
        tags: book?.tags?.join(', ') ?? '',
        totalCopies: book?.totalCopies ? String(book.totalCopies) : '1',
        location: book?.location ?? '',
        description: book?.description ?? '',
    })

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSave = async () => {
        setError('')
        if (!form.title.trim()) { setError('Title is required'); return }
        if (!form.author.trim()) { setError('Author is required'); return }

        setSaving(true)
        try {
            await onSave({
                ...(isEdit && { id: book!._id }),
                title: form.title.trim(),
                author: form.author.trim(),
                isbn: form.isbn.trim(),
                category: form.category,
                publisher: form.publisher.trim(),
                publishYear: form.publishYear ? parseInt(form.publishYear) : undefined,
                edition: form.edition.trim(),
                language: form.language,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                totalCopies: Math.max(1, parseInt(form.totalCopies) || 1),
                location: form.location.trim(),
                description: form.description.trim(),
            })
        } catch (e: any) {
            setError(e.message)
            setSaving(false)
        }
    }

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-xl rounded-2xl overflow-hidden my-8"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4 border-b"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <h3
                            className="text-base font-bold font-display"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {isEdit ? 'Edit Book' : 'Add New Book'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

                        {error && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
                            >
                                <AlertTriangle size={14} />
                                {error}
                            </div>
                        )}

                        {/* Title + Author */}
                        <div className="grid grid-cols-1 gap-3">
                            <FormField label="Book Title" required>
                                <input
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="e.g. Introduction to Physics"
                                    className="input-clean"
                                />
                            </FormField>
                            <FormField label="Author" required>
                                <input
                                    value={form.author}
                                    onChange={e => set('author', e.target.value)}
                                    placeholder="e.g. H.C. Verma"
                                    className="input-clean"
                                />
                            </FormField>
                        </div>

                        {/* ISBN + Category */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="ISBN">
                                <input
                                    value={form.isbn}
                                    onChange={e => set('isbn', e.target.value)}
                                    placeholder="978-..."
                                    className="input-clean font-mono"
                                />
                            </FormField>
                            <FormField label="Category">
                                <select
                                    value={form.category}
                                    onChange={e => set('category', e.target.value)}
                                    className="input-clean"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>

                        {/* Publisher + Year */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Publisher">
                                <input
                                    value={form.publisher}
                                    onChange={e => set('publisher', e.target.value)}
                                    placeholder="e.g. S. Chand"
                                    className="input-clean"
                                />
                            </FormField>
                            <FormField label="Publish Year">
                                <input
                                    type="number"
                                    value={form.publishYear}
                                    onChange={e => set('publishYear', e.target.value)}
                                    placeholder="e.g. 2020"
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    className="input-clean"
                                />
                            </FormField>
                        </div>

                        {/* Edition + Language */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Edition">
                                <input
                                    value={form.edition}
                                    onChange={e => set('edition', e.target.value)}
                                    placeholder="e.g. 3rd Edition"
                                    className="input-clean"
                                />
                            </FormField>
                            <FormField label="Language">
                                <select
                                    value={form.language}
                                    onChange={e => set('language', e.target.value)}
                                    className="input-clean"
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>

                        {/* Copies + Location */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Total Copies" required>
                                <input
                                    type="number"
                                    value={form.totalCopies}
                                    onChange={e => set('totalCopies', e.target.value)}
                                    min="1"
                                    max="9999"
                                    className="input-clean"
                                />
                            </FormField>
                            <FormField label="Shelf / Rack Location">
                                <input
                                    value={form.location}
                                    onChange={e => set('location', e.target.value)}
                                    placeholder="e.g. A-12, Shelf 3"
                                    className="input-clean"
                                />
                            </FormField>
                        </div>

                        {/* Tags */}
                        <FormField label="Tags" hint="Comma separated — e.g. ncert, physics, class-11">
                            <input
                                value={form.tags}
                                onChange={e => set('tags', e.target.value)}
                                placeholder="ncert, science, class-11"
                                className="input-clean"
                            />
                        </FormField>

                        {/* Description */}
                        <FormField label="Description">
                            <textarea
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                placeholder="Brief description of the book..."
                                rows={2}
                                className="input-clean resize-none"
                            />
                        </FormField>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex gap-2.5 px-5 py-4 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                    >
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px]"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                         text-white flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                            }}
                        >
                            {saving ? <Spinner size="sm" /> : null}
                            {saving ? 'Saving…' : isEdit ? 'Update Book' : 'Add Book'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// Issue Book Modal
// ─────────────────────────────────────────────
function IssueModal({
    books,
    onClose,
    onIssue,
    defaultIssueDays = 14,    // ✅ ADD
    defaultFinePerDay = 2,    // ✅ ADD
}: {
    books: IBook[]
    onClose: () => void
    onIssue: (data: any) => Promise<void>
    defaultIssueDays?: number  // ✅ ADD
    defaultFinePerDay?: number // ✅ ADD
}) {
    const [form, setForm] = useState({
        bookId: '',
        admissionNo: '',
        dueDate: '',
        finePerDay: String(defaultFinePerDay),  // ✅ settings se
        notes: '',
    })
    const [studentSearch, setStudentSearch] = useState('')
    const [students, setStudents] = useState<any[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Min due date — tomorrow
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    const minDateStr = minDate.toISOString().split('T')[0]

    // Default due date
    const defaultDue = new Date()
    defaultDue.setDate(defaultDue.getDate() + defaultIssueDays)  // ✅ settings se
    const defaultDueStr = defaultDue.toISOString().split('T')[0]

    // Search students
    const searchStudents = useCallback(async (q: string) => {
        if (!q.trim() || q.length < 2) { setStudents([]); return }
        setSearching(true)
        try {
            const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&limit=10`)
            const data = await res.json()
            setStudents(
                Array.isArray(data) ? data
                    : Array.isArray(data.students) ? data.students
                        : Array.isArray(data.data) ? data.data
                            : []
            )
        } catch { setStudents([]) }
        setSearching(false)
    }, [])

    const handleStudentInput = (v: string) => {
        setStudentSearch(v)
        setSelectedStudent(null)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => searchStudents(v), 350)
    }

    const handleIssue = async () => {
        setError('')
        if (!form.bookId) { setError('Select a book'); return }
        if (!selectedStudent) { setError('Select a student'); return }
        if (!form.dueDate) { setError('Select a due date'); return }

        setSaving(true)
        try {
            await onIssue({
                bookId: form.bookId,
                studentId: selectedStudent._id,
                dueDate: form.dueDate,
                finePerDay: parseFloat(form.finePerDay) || 2,
                notes: form.notes.trim(),
            })
        } catch (e: any) {
            setError(e.message)
            setSaving(false)
        }
    }

    const availableBooks = books.filter(b => b.availableCopies > 0)
    const selectedBook = books.find(b => b._id === form.bookId)

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-md rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4 border-b"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                            Issue Book
                        </h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-4">

                        {error && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
                            >
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}

                        {/* Book Select */}
                        <FormField label="Select Book" required>
                            <select
                                value={form.bookId}
                                onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))}
                                className="input-clean"
                            >
                                <option value="">Choose a book…</option>
                                {availableBooks.map(b => (
                                    <option key={b._id} value={b._id}>
                                        {b.title} — {b.author} ({b.availableCopies} avail)
                                    </option>
                                ))}
                            </select>
                            {availableBooks.length === 0 && (
                                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                                    No books available for issue
                                </p>
                            )}
                        </FormField>

                        {/* Selected book info */}
                        {selectedBook && (
                            <div
                                className="px-3 py-2 rounded-lg text-xs"
                                style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}
                            >
                                <strong>{selectedBook.title}</strong> · {selectedBook.category} ·{' '}
                                {selectedBook.availableCopies} of {selectedBook.totalCopies} available
                            </div>
                        )}

                        {/* Student Search */}
                        <FormField label="Search Student" required>
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: 'var(--text-muted)' }}
                                />
                                <input
                                    value={studentSearch}
                                    onChange={e => handleStudentInput(e.target.value)}
                                    placeholder="Name or admission number…"
                                    className="input-clean pl-9"
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Spinner size="sm" />
                                    </div>
                                )}
                            </div>

                            {/* Dropdown */}
                            {students.length > 0 && !selectedStudent && (
                                <div
                                    className="mt-1 rounded-lg border overflow-hidden shadow-lg"
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                    }}
                                >
                                    {students.map(s => (
                                        <button
                                            key={s._id}
                                            onClick={() => {
                                                setSelectedStudent(s)
                                                setStudentSearch(s.userId?.name || s.admissionNo)
                                                setStudents([])
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left
                                 transition-colors hover:bg-[var(--bg-muted)]"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center
                                   text-xs font-bold flex-shrink-0"
                                                style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}
                                            >
                                                {(s.userId?.name || 'S').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{s.userId?.name || 'Unknown'}</p>
                                                <p className="text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                                                    {s.admissionNo} · Class {s.class}{s.section ? `-${s.section}` : ''}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected student */}
                            {selectedStudent && (
                                <div
                                    className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-lg"
                                    style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}
                                >
                                    <CheckCircle2 size={14} />
                                    <span className="text-sm font-medium">
                                        {selectedStudent.userId?.name} · {selectedStudent.admissionNo}
                                    </span>
                                    <button
                                        onClick={() => { setSelectedStudent(null); setStudentSearch('') }}
                                        className="ml-auto"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                        </FormField>

                        {/* Due Date + Fine/Day */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Due Date" required>
                                <input
                                    type="date"
                                    value={form.dueDate || defaultDueStr}
                                    min={minDateStr}
                                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                    className="input-clean"
                                />
                            </FormField>
                            <FormField label="Fine / Day (₹)">
                                <input
                                    type="number"
                                    value={form.finePerDay}
                                    min="0"
                                    max="100"
                                    onChange={e => setForm(f => ({ ...f, finePerDay: e.target.value }))}
                                    className="input-clean"
                                />
                            </FormField>
                        </div>

                        {/* Notes */}
                        <FormField label="Notes">
                            <input
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Optional notes…"
                                className="input-clean"
                            />
                        </FormField>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex gap-2.5 px-5 py-4 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                    >
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px]"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleIssue}
                            disabled={saving || availableBooks.length === 0}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                         text-white flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                            }}
                        >
                            {saving ? <Spinner size="sm" /> : <BookMarked size={14} />}
                            {saving ? 'Issuing…' : 'Issue Book'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// Return Confirm Modal
// ─────────────────────────────────────────────
function ReturnModal({
    issue,
    onClose,
    onReturn,
}: {
    issue: IIssue
    onClose: () => void
    onReturn: (data: any) => Promise<void>
}) {
    const [markLost, setMarkLost] = useState(false)
    const [finePaid, setFinePaid] = useState(false)
    const [returning, setReturning] = useState(false)
    const [error, setError] = useState('')

    const now = new Date()
    const due = new Date(issue.dueDate)
    const isLate = now > due
    const daysLate = isLate
        ? Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    const estFine = daysLate * (issue.finePerDay ?? 2)

    const handleReturn = async () => {
        setError('')
        setReturning(true)
        try {
            await onReturn({
                markLost,
                finePaid: finePaid || estFine === 0,
                notes: markLost ? 'Book marked as lost' : undefined,
            })
        } catch (e: any) {
            setError(e.message)
            setReturning(false)
        }
    }

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-sm rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s ease forwards',
                    }}
                >
                    <div
                        className="px-5 py-4 border-b flex items-center justify-between"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <h3 className="text-base font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                            Return Book
                        </h3>
                        <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
                            <X size={16} />
                        </button>
                    </div>

                    <div className="px-5 py-4 space-y-3">
                        {error && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
                            >
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}

                        {/* Book info */}
                        <div
                            className="px-3 py-2.5 rounded-lg space-y-1"
                            style={{ background: 'var(--bg-muted)' }}
                        >
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {issue.bookId.title}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {issue.studentId.userId?.name} · {issue.studentId.admissionNo}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Issued: {formatDate(issue.issuedAt)} · Due: {formatDate(issue.dueDate)}
                            </p>
                        </div>

                        {/* Late fine */}
                        {isLate && !markLost && (
                            <div
                                className="px-3 py-2.5 rounded-lg"
                                style={{
                                    background: 'var(--warning-light)',
                                    borderLeft: '3px solid var(--warning)',
                                }}
                            >
                                <div className="flex items-center gap-2 text-sm font-semibold"
                                    style={{ color: 'var(--warning-dark)' }}>
                                    <Clock size={14} />
                                    {daysLate} days late · Fine: ₹{estFine}
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--warning-dark)', opacity: 0.7 }}>
                                    ₹{issue.finePerDay}/day × {daysLate} days
                                </p>
                            </div>
                        )}

                        {/* Lost book */}
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={markLost}
                                onChange={e => setMarkLost(e.target.checked)}
                                className="w-4 h-4 accent-[var(--danger)]"
                            />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Mark as Lost (fine: ₹100)
                            </span>
                        </label>

                        {/* Fine paid */}
                        {(estFine > 0 || markLost) && (
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={finePaid}
                                    onChange={e => setFinePaid(e.target.checked)}
                                    className="w-4 h-4 accent-[var(--success)]"
                                />
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Fine collected (₹{markLost ? 100 : estFine})
                                </span>
                            </label>
                        )}
                    </div>

                    <div
                        className="flex gap-2.5 px-5 py-3 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                    >
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px]"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReturn}
                            disabled={returning}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                         text-white flex items-center justify-center gap-2"
                            style={{
                                background: markLost
                                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                                    : 'linear-gradient(135deg, var(--success), #047857)',
                            }}
                        >
                            {returning ? <Spinner size="sm" /> : <RotateCcw size={14} />}
                            {returning ? 'Processing…' : markLost ? 'Mark Lost' : 'Confirm Return'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// Form Field helper
// ─────────────────────────────────────────────
function FormField({
    label, required, hint, children,
}: {
    label: string
    required?: boolean
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div>
            <label className="block text-xs font-semibold mb-1.5 font-display"
                style={{ color: 'var(--text-primary)' }}>
                {label}
                {required && <span style={{ color: 'var(--danger)' }}> *</span>}
            </label>
            {children}
            {hint && (
                <p className="text-[0.625rem] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────
function DeleteModal({
    book,
    onClose,
    onDelete,
}: {
    book: IBook
    onClose: () => void
    onDelete: () => Promise<void>
}) {
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')

    const handle = async () => {
        setDeleting(true)
        try { await onDelete() }
        catch (e: any) { setError(e.message); setDeleting(false) }
    }

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-sm rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s ease forwards',
                    }}
                >
                    <div className="px-5 py-4">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'var(--danger-light)' }}
                        >
                            <Trash2 size={20} style={{ color: 'var(--danger)' }} />
                        </div>
                        <h3 className="text-base font-bold font-display mb-1.5"
                            style={{ color: 'var(--text-primary)' }}>
                            Delete Book?
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Remove <strong>"{book.title}"</strong> from the library catalogue?
                            This action cannot be undone.
                        </p>
                        {error && (
                            <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>{error}</p>
                        )}
                    </div>
                    <div
                        className="flex gap-2.5 px-5 py-3 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                    >
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px]"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handle}
                            disabled={deleting}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                         text-white flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                        >
                            {deleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// MAIN CLIENT
// ─────────────────────────────────────────────
export function LibraryClient({
    initialBooks,
    initialIssues,
    bookStats: initBookStats,
    issueStats: initIssueStats,
    userRole,
    librarySettings,        // ✅ ADD
}: {
    initialBooks: IBook[]
    initialIssues: IIssue[]
    bookStats: BookStats
    issueStats: IssueStats
    userRole: string
    librarySettings?: {     // ✅ ADD — optional so old callers break nahi hon
        maxIssueDays: number
        finePerDay: number
        maxBooksPerStudent: number
    }
}) {
    const canEdit = userRole === 'admin' || userRole === 'staff'

    // ── State ──
    const [tab, setTab] = useState<'books' | 'issues'>('books')
    const [books, setBooks] = useState<IBook[]>(initialBooks)
    const [issues, setIssues] = useState<IIssue[]>(initialIssues)
    const [bookStats, setBStats] = useState<BookStats>(initBookStats)
    const [issueStats, setIStats] = useState<IssueStats>(initIssueStats)

    // Filters
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('')
    const [filterAvail, setFilterAvail] = useState(false)
    const [issueFilter, setIssueFilter] = useState<'all' | 'issued' | 'overdue' | 'returned'>('all')

    // Loading
    const [booksLoading, setBooksLoading] = useState(false)
    const [issuesLoading, setIssuesLoading] = useState(false)

    // Modals
    const [showAddBook, setShowAddBook] = useState(false)
    const [editBook, setEditBook] = useState<IBook | null>(null)
    const [deleteBook, setDeleteBook] = useState<IBook | null>(null)
    const [showIssue, setShowIssue] = useState(false)
    const [returnIssue, setReturnIssue] = useState<IIssue | null>(null)

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showToast = useCallback((type: 'success' | 'error', msg: string) => {
        setToast({ type, msg })
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 3500)
    }, [])

    // ── Fetch books ──
    const fetchBooks = useCallback(async (
        s = search, c = filterCat, a = filterAvail
    ) => {
        setBooksLoading(true)
        try {
            const p = new URLSearchParams()
            if (s) p.set('search', s)
            if (c) p.set('category', c)
            if (a) p.set('available', 'true')

            const res = await fetch(`/api/library/books?${p}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setBooks(data.books ?? [])
            setBStats(data.stats)
        } catch (e: any) {
            showToast('error', e.message || 'Failed to load books')
        } finally {
            setBooksLoading(false)
        }
    }, [search, filterCat, filterAvail, showToast])

    // ── Fetch issues ──
    const fetchIssues = useCallback(async (status?: string) => {
        setIssuesLoading(true)
        try {
            const p = new URLSearchParams()
            const s = status ?? (issueFilter === 'all' ? '' : issueFilter)
            if (s) p.set('status', s)

            const res = await fetch(`/api/library/issues?${p}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setIssues(data.issues ?? [])
            setIStats(data.stats)
        } catch (e: any) {
            showToast('error', e.message || 'Failed to load issues')
        } finally {
            setIssuesLoading(false)
        }
    }, [issueFilter, showToast])

    // Search debounce
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const handleSearch = (v: string) => {
        setSearch(v)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => fetchBooks(v, filterCat, filterAvail), 400)
    }

    // ── Add book ──
    const handleAddBook = async (data: any) => {
        const res = await fetch('/api/library/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to add book')
        setShowAddBook(false)
        showToast('success', 'Book added successfully!')
        fetchBooks()
    }

    // ── Edit book ──
    const handleEditBook = async (data: any) => {
        const res = await fetch('/api/library/books', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to update book')
        setEditBook(null)
        showToast('success', 'Book updated!')
        fetchBooks()
    }

    // ── Delete book ──
    const handleDeleteBook = async () => {
        if (!deleteBook) return
        const res = await fetch('/api/library/books', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deleteBook._id }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to delete')
        setDeleteBook(null)
        showToast('success', 'Book deleted')
        fetchBooks()
    }

    // ── Issue book ──
    const handleIssueBook = async (data: any) => {
        const res = await fetch('/api/library/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to issue book')
        setShowIssue(false)
        showToast('success', 'Book issued successfully!')
        fetchBooks()
        fetchIssues()
    }

    // ── Return book ──
    const handleReturn = async (data: any) => {
        if (!returnIssue) return
        const res = await fetch(`/api/library/issues/${returnIssue._id}/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to process return')
        setReturnIssue(null)
        showToast('success', json.message || 'Book returned!')
        fetchBooks()
        fetchIssues()
    }

    // ── Issue filter change ──
    const handleIssueFilter = (f: typeof issueFilter) => {
        setIssueFilter(f)
        fetchIssues(f === 'all' ? '' : f)
    }

    // ── Filtered issues (client-side) ──
    const filteredIssues = issues  // already server-filtered

    return (
        <>
            <div className="space-y-5 pb-8 max-w-[1280px] mx-auto">

                {/* ── PAGE HEADER ── */}
                <div className="portal-page-header">
                    <div>
                        <div className="portal-breadcrumb mb-1">
                            <span style={{ color: 'var(--text-muted)' }}>Admin</span>
                            <span className="bc-sep">/</span>
                            <span className="bc-current">Library</span>
                        </div>
                        <h1 className="portal-page-title">Library Management</h1>
                        <p className="portal-page-subtitle">
                            Books catalogue, issue & return management
                        </p>
                    </div>

                    {canEdit && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-3 h-9 rounded-[var(--radius-md)]
                           text-sm font-semibold border-[1.5px] transition-all"
                                style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                <Printer size={14} /> Print
                            </button>

                            <button
                                onClick={() => setShowIssue(true)}
                                className="flex items-center gap-1.5 px-3 h-9 rounded-[var(--radius-md)]
                           text-sm font-semibold border-[1.5px] transition-all"
                                style={{
                                    borderColor: 'var(--primary-200)',
                                    color: 'var(--primary-600)',
                                    background: 'var(--primary-50)',
                                }}
                            >
                                <BookMarked size={14} /> Issue Book
                            </button>

                            <button
                                onClick={() => setShowAddBook(true)}
                                className="flex items-center gap-1.5 px-4 h-9 rounded-[var(--radius-md)]
                           text-sm font-semibold text-white transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                }}
                            >
                                <Plus size={14} /> Add Book
                            </button>
                        </div>
                    )}
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Books" value={bookStats.totalBooks}
                        icon={<Library size={18} />}
                        bg="var(--info-light)" iconColor="var(--info)"
                    />
                    <StatCard
                        label="Total Copies" value={bookStats.totalCopies}
                        icon={<BookOpen size={18} />}
                        bg="var(--primary-50)" iconColor="var(--primary-500)"
                        subtext={`${bookStats.categories.length} categories`}
                    />
                    <StatCard
                        label="Available" value={bookStats.availableCopies}
                        icon={<CheckCircle2 size={18} />}
                        bg="var(--success-light)" iconColor="var(--success)"
                    />
                    <StatCard
                        label="Issued" value={bookStats.issuedCopies}
                        icon={<BookMarked size={18} />}
                        bg="var(--warning-light)" iconColor="var(--warning)"
                        subtext={issueStats.overdue > 0 ? `${issueStats.overdue} overdue` : undefined}
                    />
                </div>

                {/* Overdue + Fine alerts */}
                {issueStats.overdue > 0 && (
                    <div
                        className="flex items-center gap-2.5 px-4 py-3 rounded-[var(--radius-lg)]
                       border-[1.5px] text-sm"
                        style={{
                            background: 'var(--warning-light)',
                            borderColor: 'rgba(245,158,11,0.3)',
                            color: 'var(--warning-dark)',
                        }}
                    >
                        <AlertCircle size={16} />
                        <span>
                            <strong>{issueStats.overdue} books overdue</strong>
                            {issueStats.unpaidFines > 0 && ` · Unpaid fines: ₹${issueStats.unpaidFines}`}
                        </span>
                        <button
                            onClick={() => { setTab('issues'); handleIssueFilter('overdue') }}
                            className="ml-auto text-xs font-semibold underline"
                        >
                            View →
                        </button>
                    </div>
                )}

                {/* ── TABS ── */}
                <div
                    className="flex gap-1 p-1 rounded-[var(--radius-lg)] w-fit"
                    style={{ background: 'var(--bg-muted)' }}
                >
                    {([['books', `Books (${bookStats.totalBooks})`], ['issues', `Issues (${issueStats.totalIssued + issueStats.overdue} active)`]] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
                            style={{
                                background: tab === key ? 'var(--bg-card)' : 'transparent',
                                color: tab === key ? 'var(--primary-600)' : 'var(--text-muted)',
                                boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── BOOKS TAB ── */}
                {tab === 'books' && (
                    <>
                        {/* Filters */}
                        <div
                            className="portal-card"
                            style={{ overflow: 'visible' }}
                        >
                            <div className="portal-card-body-sm flex flex-wrap items-center gap-3">
                                {/* Search */}
                                <div className="flex-1 min-w-[200px] relative">
                                    <Search
                                        size={14}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                    <input
                                        value={search}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Search by title, author, ISBN…"
                                        className="input-clean pl-9"
                                    />
                                </div>

                                {/* Category */}
                                <select
                                    value={filterCat}
                                    onChange={e => {
                                        setFilterCat(e.target.value)
                                        fetchBooks(search, e.target.value, filterAvail)
                                    }}
                                    className="input-clean w-44"
                                >
                                    <option value="">All Categories</option>
                                    {bookStats.categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                {/* Available only */}
                                <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={filterAvail}
                                        onChange={e => {
                                            setFilterAvail(e.target.checked)
                                            fetchBooks(search, filterCat, e.target.checked)
                                        }}
                                        className="w-4 h-4 accent-[var(--primary-500)]"
                                    />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Available only
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Books Table */}
                        <div className="portal-card">
                            {booksLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : books.length === 0 ? (
                                <div className="portal-empty">
                                    <div className="portal-empty-icon">
                                        <Library size={22} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <p className="portal-empty-title">No books found</p>
                                    <p className="portal-empty-text">
                                        {search || filterCat
                                            ? 'Try adjusting your filters'
                                            : 'Add books to build your library catalogue'}
                                    </p>
                                    {canEdit && !search && !filterCat && (
                                        <button
                                            onClick={() => setShowAddBook(true)}
                                            className="mt-4 flex items-center gap-1.5 px-4 h-9
                                 rounded-[var(--radius-md)] text-sm font-semibold text-white"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                            }}
                                        >
                                            <Plus size={14} /> Add First Book
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="portal-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Author</th>
                                                <th>ISBN</th>
                                                <th>Category</th>
                                                <th>Location</th>
                                                <th>Copies</th>
                                                <th>Available</th>
                                                {canEdit && <th>Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {books.map(b => (
                                                <tr key={b._id}>
                                                    <td>
                                                        <div>
                                                            <p
                                                                className="text-sm font-semibold"
                                                                style={{ color: 'var(--text-primary)' }}
                                                            >
                                                                {b.title}
                                                            </p>
                                                            {b.edition && (
                                                                <p className="text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                                                                    {b.edition}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{b.author}</td>
                                                    <td>
                                                        <span
                                                            className="text-xs font-mono"
                                                            style={{ color: 'var(--text-muted)' }}
                                                        >
                                                            {b.isbn || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full
                                         text-xs font-semibold border"
                                                            style={{
                                                                background: 'var(--primary-50)',
                                                                color: 'var(--primary-600)',
                                                                borderColor: 'var(--primary-200)',
                                                            }}
                                                        >
                                                            {b.category}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            {b.location || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="text-sm font-semibold tabular-nums"
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            {b.totalCopies}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full
                                         text-xs font-bold border"
                                                            style={{
                                                                background: b.availableCopies > 0 ? 'var(--success-light)' : 'var(--danger-light)',
                                                                color: b.availableCopies > 0 ? 'var(--success-dark)' : 'var(--danger-dark)',
                                                                borderColor: b.availableCopies > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                                            }}
                                                        >
                                                            {b.availableCopies}
                                                        </span>
                                                    </td>
                                                    {canEdit && (
                                                        <td>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => setEditBook(b)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center
                                             border-[1.5px] transition-all"
                                                                    style={{
                                                                        borderColor: 'var(--border)',
                                                                        color: 'var(--text-muted)',
                                                                    }}
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteBook(b)}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center
                                             border-[1.5px] transition-all"
                                                                    style={{
                                                                        borderColor: 'rgba(239,68,68,0.2)',
                                                                        color: 'var(--danger)',
                                                                        background: 'var(--danger-light)',
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── ISSUES TAB ── */}
                {tab === 'issues' && (
                    <>
                        {/* Issue filter */}
                        <div
                            className="flex gap-1 p-1 rounded-[var(--radius-lg)] w-fit"
                            style={{ background: 'var(--bg-muted)' }}
                        >
                            {(
                                [
                                    ['all', 'All'],
                                    ['issued', `Active (${issueStats.totalIssued})`],
                                    ['overdue', `Overdue (${issueStats.overdue})`],
                                    ['returned', `Returned (${issueStats.returned})`],
                                ] as const
                            ).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => handleIssueFilter(key)}
                                    className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all"
                                    style={{
                                        background: issueFilter === key ? 'var(--bg-card)' : 'transparent',
                                        color: issueFilter === key
                                            ? key === 'overdue' ? 'var(--danger)' : 'var(--primary-600)'
                                            : 'var(--text-muted)',
                                        boxShadow: issueFilter === key ? 'var(--shadow-sm)' : 'none',
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Issues table */}
                        <div className="portal-card">
                            {issuesLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : filteredIssues.length === 0 ? (
                                <div className="portal-empty">
                                    <div className="portal-empty-icon">
                                        <BookOpen size={22} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <p className="portal-empty-title">No issues found</p>
                                    <p className="portal-empty-text">
                                        {issueFilter !== 'all' ? 'No books with this status' : 'Issue a book to see records here'}
                                    </p>
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="portal-table">
                                        <thead>
                                            <tr>
                                                <th>Book</th>
                                                <th>Student</th>
                                                <th>Issued</th>
                                                <th>Due Date</th>
                                                <th>Status</th>
                                                <th>Fine</th>
                                                {canEdit && <th>Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredIssues.map(issue => {
                                                const daysLeft = calcDaysLeft(issue.dueDate)
                                                const isOverdue = issue.status === 'overdue' || daysLeft < 0

                                                return (
                                                    <tr key={issue._id}>
                                                        <td>
                                                            <div>
                                                                <p
                                                                    className="text-sm font-semibold"
                                                                    style={{ color: 'var(--text-primary)' }}
                                                                >
                                                                    {issue.bookId?.title ?? 'Unknown'}
                                                                </p>
                                                                <p
                                                                    className="text-[0.625rem]"
                                                                    style={{ color: 'var(--text-muted)' }}
                                                                >
                                                                    {issue.bookId?.author}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <p
                                                                    className="text-sm font-medium"
                                                                    style={{ color: 'var(--text-primary)' }}
                                                                >
                                                                    {issue.studentId?.userId?.name ?? 'Unknown'}
                                                                </p>
                                                                <p
                                                                    className="text-[0.625rem]"
                                                                    style={{ color: 'var(--text-muted)' }}
                                                                >
                                                                    {issue.studentId?.admissionNo} · Class {issue.studentId?.class}
                                                                    {issue.studentId?.section ? `-${issue.studentId.section}` : ''}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                {formatDate(issue.issuedAt)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <span
                                                                    className="text-xs font-medium"
                                                                    style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)' }}
                                                                >
                                                                    {formatDate(issue.dueDate)}
                                                                </span>
                                                                {issue.status !== 'returned' && (
                                                                    <p
                                                                        className="text-[0.625rem] mt-0.5"
                                                                        style={{
                                                                            color: isOverdue ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--text-muted)',
                                                                        }}
                                                                    >
                                                                        {isOverdue
                                                                            ? `${Math.abs(daysLeft)}d overdue`
                                                                            : `${daysLeft}d left`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full
                                           text-xs font-bold border"
                                                                style={{
                                                                    background: issue.status === 'returned' ? 'var(--success-light)'
                                                                        : issue.status === 'overdue' ? 'var(--danger-light)'
                                                                            : issue.status === 'lost' ? 'var(--danger-light)'
                                                                                : 'var(--warning-light)',
                                                                    color: issue.status === 'returned' ? 'var(--success-dark)'
                                                                        : issue.status === 'overdue' ? 'var(--danger-dark)'
                                                                            : issue.status === 'lost' ? 'var(--danger-dark)'
                                                                                : 'var(--warning-dark)',
                                                                    borderColor: issue.status === 'returned' ? 'rgba(16,185,129,0.2)'
                                                                        : issue.status === 'overdue' ? 'rgba(239,68,68,0.2)'
                                                                            : issue.status === 'lost' ? 'rgba(239,68,68,0.2)'
                                                                                : 'rgba(245,158,11,0.2)',
                                                                }}
                                                            >
                                                                {issue.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {issue.fine > 0 ? (
                                                                <div className="flex items-center gap-1">
                                                                    <IndianRupee size={11} style={{ color: issue.finePaid ? 'var(--success)' : 'var(--danger)' }} />
                                                                    <span
                                                                        className="text-sm font-semibold tabular-nums"
                                                                        style={{ color: issue.finePaid ? 'var(--success-dark)' : 'var(--danger-dark)' }}
                                                                    >
                                                                        {issue.fine}
                                                                    </span>
                                                                    {issue.finePaid && (
                                                                        <span className="text-[0.5rem] font-bold uppercase"
                                                                            style={{ color: 'var(--success)' }}>
                                                                            paid
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                            )}
                                                        </td>
                                                        {canEdit && (
                                                            <td>
                                                                {issue.status !== 'returned' && issue.status !== 'lost' && (
                                                                    <button
                                                                        onClick={() => setReturnIssue(issue)}
                                                                        className="flex items-center gap-1 px-2.5 py-1.5
                                               rounded-[var(--radius-sm)] text-xs font-semibold
                                               border-[1.5px] transition-all"
                                                                        style={{
                                                                            borderColor: 'var(--primary-200)',
                                                                            color: 'var(--primary-600)',
                                                                            background: 'var(--primary-50)',
                                                                        }}
                                                                    >
                                                                        <RotateCcw size={11} /> Return
                                                                    </button>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Fine summary */}
                        {issueStats.totalFines > 0 && (
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)]
                           border text-sm"
                                style={{
                                    background: 'var(--bg-card)',
                                    borderColor: 'var(--border)',
                                }}
                            >
                                <IndianRupee size={16} style={{ color: 'var(--warning)' }} />
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    Total fines collected:{' '}
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                        ₹{issueStats.totalFines}
                                    </strong>
                                </span>
                                {issueStats.unpaidFines > 0 && (
                                    <span
                                        className="ml-auto px-2 py-1 rounded-lg text-xs font-semibold"
                                        style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
                                    >
                                        ₹{issueStats.unpaidFines} unpaid
                                    </span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── MODALS ── */}
            {showAddBook && (
                <BookFormModal
                    onClose={() => setShowAddBook(false)}
                    onSave={handleAddBook}
                />
            )}

            {editBook && (
                <BookFormModal
                    book={editBook}
                    onClose={() => setEditBook(null)}
                    onSave={handleEditBook}
                />
            )}

            {deleteBook && (
                <DeleteModal
                    book={deleteBook}
                    onClose={() => setDeleteBook(null)}
                    onDelete={handleDeleteBook}
                />
            )}

            {showIssue && (
                <IssueModal
                    books={books}
                    onClose={() => setShowIssue(false)}
                    onIssue={handleIssueBook}
                    defaultIssueDays={librarySettings?.maxIssueDays ?? 14}   // ✅ ADD
                    defaultFinePerDay={librarySettings?.finePerDay ?? 2}      // ✅ ADD
                />
            )}

            {returnIssue && (
                <ReturnModal
                    issue={returnIssue}
                    onClose={() => setReturnIssue(null)}
                    onReturn={handleReturn}
                />
            )}

            {/* ── TOAST ── */}
            {toast && (
                <Portal>
                    <div
                        className="fixed bottom-5 right-5 z-[70] flex items-center gap-3
                       px-4 py-3 rounded-[var(--radius-lg)] border max-w-xs"
                        style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border)',
                            boxShadow: 'var(--shadow-lg)',
                            animation: 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
                        }}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        ) : (
                            <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                        )}
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {toast.msg}
                        </p>
                        <button onClick={() => setToast(null)} style={{ color: 'var(--text-muted)' }}>
                            <X size={14} />
                        </button>
                    </div>
                </Portal>
            )}
        </>
    )
}