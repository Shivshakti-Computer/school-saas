// FILE: src/app/(dashboard)/admin/library/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button, Card, Badge, Table, Tr, Td, PageHeader, Modal, Input, Select, Alert, EmptyState, Spinner } from '@/components/ui'
import { BookOpen, Plus } from 'lucide-react'

export default function LibraryClient() {
    const [tab, setTab] = useState<'books' | 'issued'>('books')
    const [books, setBooks] = useState<any[]>([])
    const [issues, setIssues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const fetchBooks = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/library/books')
        const data = await res.json()
        setBooks(data.books ?? [])
        setLoading(false)
    }, [])

    const fetchIssues = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/library/issues?status=issued')
        const data = await res.json()
        setIssues(data.issues ?? [])
        setLoading(false)
    }, [])

    useEffect(() => {
        if (tab === 'books') fetchBooks()
        if (tab === 'issued') fetchIssues()
    }, [tab, fetchBooks, fetchIssues])

    const returnBook = async (issueId: string) => {
        await fetch(`/api/library/issues/${issueId}/return`, { method: 'POST' })
        setAlert({ type: 'success', msg: 'Book returned successfully' })
        fetchIssues()
    }

    return (
        <div>
            <PageHeader title="Library" subtitle="Manage books, issues and returns"
                action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Book</Button>} />

            {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} className="mb-4" />}

            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-4">
                {(['books', 'issued'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${tab === t ? 'bg-white text-slate-800 font-medium shadow-sm' : 'text-slate-500'}`}>
                        {t === 'books' ? '📚 Book Catalogue' : '📋 Issued Books'}
                    </button>
                ))}
            </div>

            {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                : tab === 'books' ? (
                    <Card padding={false}>
                        {books.length === 0 ? <EmptyState icon={<BookOpen size={24} />} title="No books added" description="Add books to the library catalogue" action={<Button size="sm" onClick={() => setShowAdd(true)}>Add First Book</Button>} /> : (
                            <Table headers={['Title', 'Author', 'Category', 'Available', 'Total']}>
                                {books.map(b => (
                                    <Tr key={b._id}>
                                        <Td><p className="font-medium text-slate-700">{b.title}</p>{b.isbn && <p className="text-xs text-slate-400 font-mono">ISBN: {b.isbn}</p>}</Td>
                                        <Td className="text-slate-600 text-sm">{b.author}</Td>
                                        <Td><Badge variant="info">{b.category}</Badge></Td>
                                        <Td><span className={`text-sm font-semibold ${b.availableCopies === 0 ? 'text-red-500' : 'text-emerald-600'}`}>{b.availableCopies}</span></Td>
                                        <Td className="text-slate-500 text-sm">{b.totalCopies}</Td>
                                    </Tr>
                                ))}
                            </Table>
                        )}
                    </Card>
                ) : (
                    <Card padding={false}>
                        {issues.length === 0 ? <EmptyState icon={<BookOpen size={24} />} title="No books currently issued" /> : (
                            <Table headers={['Book', 'Student', 'Issued', 'Due Date', 'Status', 'Action']}>
                                {issues.map(i => {
                                    const isOverdue = new Date(i.dueDate) < new Date() && i.status !== 'returned'
                                    return (
                                        <Tr key={i._id}>
                                            <Td><p className="font-medium text-slate-700 text-sm">{i.bookId?.title}</p></Td>
                                            <Td><p className="text-sm text-slate-600">{i.studentId?.userId?.name}</p><p className="text-xs text-slate-400">{i.studentId?.admissionNo}</p></Td>
                                            <Td className="text-sm text-slate-500">{new Date(i.issuedDate).toLocaleDateString('en-IN')}</Td>
                                            <Td><p className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-500'}`}>{new Date(i.dueDate).toLocaleDateString('en-IN')}</p></Td>
                                            <Td><Badge variant={i.status === 'returned' ? 'success' : isOverdue ? 'danger' : 'warning'}>{isOverdue ? 'Overdue' : i.status}</Badge></Td>
                                            <Td>{i.status === 'issued' && <Button size="sm" variant="secondary" onClick={() => returnBook(i._id)}>Return</Button>}</Td>
                                        </Tr>
                                    )
                                })}
                            </Table>
                        )}
                    </Card>
                )}

            <AddBookModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchBooks(); setAlert({ type: 'success', msg: 'Book added to catalogue!' }) }} />
        </div>
    )
}

function AddBookModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1, location: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('')
        const res = await fetch('/api/library/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const d = await res.json()
        setLoading(false)
        if (!res.ok) { setError(d.error ?? 'Error'); return }
        onSuccess()
    }

    return (
        <Modal open={open} onClose={onClose} title="Add Book to Library">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Book Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                <Input label="Author *" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="ISBN" value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} />
                    <Select label="Category" options={['General', 'Science', 'Mathematics', 'History', 'Literature', 'Fiction', 'Reference', 'Other'].map(c => ({ value: c, label: c }))} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                    <Input label="Total Copies" type="number" value={form.totalCopies} onChange={e => setForm(f => ({ ...f, totalCopies: Number(e.target.value) }))} />
                    <Input label="Shelf Location" placeholder="A-12" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                {error && <Alert type="error" message={error} />}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="submit" loading={loading}>Add Book</Button>
                </div>
            </form>
        </Modal>
    )
}