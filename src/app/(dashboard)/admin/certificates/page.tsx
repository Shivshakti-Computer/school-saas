// FILE: src/app/(dashboard)/admin/certificates/page.tsx
// PRODUCTION READY — Certificate management page
// FIXED: Template type union error resolved
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Award,
    Plus,
    List,
    LayoutGrid,
    Search,
    Pencil,
    Trash2,
    Send,
    Users,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
} from 'lucide-react'
import {
    PageHeader,
    Button,
    Badge,
    Modal,
    Alert,
    EmptyState,
    Spinner,
} from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import { TemplateForm } from '@/components/certificates/TemplateForm'
import { IssueModal } from '@/components/certificates/IssueModal'
import { BulkIssueModal } from '@/components/certificates/BulkIssueModal'
import { IssuedList } from '@/components/certificates/IssuedList'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ── Strict Type Unions ─────────────────────────────────────

type CertificateTypeUnion =
    | 'merit'
    | 'participation'
    | 'achievement'
    | 'appreciation'
    | 'custom'
    | 'character'
    | 'sports'
    | 'completion'
    | 'internship'
    | 'skill'
    | 'test_topper'

type LayoutUnion = 'classic' | 'modern' | 'elegant'
type ApplicableToUnion = 'student' | 'staff' | 'both'

// ── Constants ──────────────────────────────────────────────

const VALID_CERT_TYPES: CertificateTypeUnion[] = [
    'merit', 'participation', 'achievement', 'appreciation', 'custom',
    'character', 'sports', 'completion', 'internship', 'skill', 'test_topper',
]

const VALID_LAYOUTS: LayoutUnion[] = ['classic', 'modern', 'elegant']

const VALID_APPLICABLE: ApplicableToUnion[] = ['student', 'staff', 'both']

const CERT_TYPE_COLORS: Record<CertificateTypeUnion, string> = {
    merit: '#F59E0B',
    participation: '#3B82F6',
    achievement: '#8B5CF6',
    appreciation: '#10B981',
    character: '#6366F1',
    sports: '#EF4444',
    completion: '#059669',
    internship: '#0891B2',
    skill: '#7C3AED',
    test_topper: '#DC2626',
    custom: '#6B7280',
}

const CERT_TYPE_LABELS: Record<CertificateTypeUnion, string> = {
    merit: 'Merit',
    participation: 'Participation',
    achievement: 'Achievement',
    appreciation: 'Appreciation',
    character: 'Character',
    sports: 'Sports',
    completion: 'Course Completion',
    internship: 'Internship',
    skill: 'Skill',
    test_topper: 'Test Topper',
    custom: 'Custom',
}

// ── Interfaces ─────────────────────────────────────────────

interface Template {
    _id: string
    name: string
    type: CertificateTypeUnion
    category?: string
    layout: LayoutUnion
    applicableTo: ApplicableToUnion
    fields: Array<{
        name: string
        type: 'text' | 'date' | 'number'
        required: boolean
        placeholder?: string
    }>
    showAccreditations: boolean
    signatureLabel: string
    isActive: boolean
    createdAt: string
}

interface IssuedCert {
    _id: string
    recipientName: string
    recipientIdentifier: string
    recipientType: string
    certificateType: string
    certificateNumber: string
    title: string
    issuedByName: string
    issuedDate: string
    verificationCode: string
    pdfUrl?: string
    savedToStorage: boolean
    status: 'issued' | 'revoked'
    revokedAt?: string
    revokedReason?: string
    class?: string
    section?: string
    createdAt: string
}

interface Pagination {
    total: number
    page: number
    limit: number
    totalPages: number
}

// ── Safe Cast Helper ───────────────────────────────────────

function castTemplate(raw: any): Template {
    return {
        _id: raw._id || '',
        name: raw.name || '',
        type: VALID_CERT_TYPES.includes(raw.type)
            ? (raw.type as CertificateTypeUnion)
            : 'custom',
        category: raw.category,
        layout: VALID_LAYOUTS.includes(raw.layout)
            ? (raw.layout as LayoutUnion)
            : 'modern',
        applicableTo: VALID_APPLICABLE.includes(raw.applicableTo)
            ? (raw.applicableTo as ApplicableToUnion)
            : 'student',
        fields: Array.isArray(raw.fields)
            ? raw.fields.map((f: any) => ({
                name: f.name || '',
                type: (['text', 'date', 'number'] as const).includes(f.type)
                    ? f.type
                    : 'text',
                required: f.required ?? false,
                placeholder: f.placeholder,
            }))
            : [],
        showAccreditations: raw.showAccreditations ?? true,
        signatureLabel: raw.signatureLabel || 'Principal',
        isActive: raw.isActive ?? true,
        createdAt: raw.createdAt || new Date().toISOString(),
    }
}

// ── Component ──────────────────────────────────────────────

export default function CertificatesPage() {
    const { data: session } = useSession()
    const institutionType =
        (session?.user?.institutionType as
            | 'school'
            | 'academy'
            | 'coaching') || 'school'

    // ── State ──────────────────────────────────────────────────

    const [tab, setTab] = useState<'templates' | 'issued'>('templates')

    // Templates
    const [templates, setTemplates] = useState<Template[]>([])
    const [templatesLoading, setTemplatesLoading] = useState(true)
    const [templateSearch, setTemplateSearch] = useState('')

    // Issued
    const [issued, setIssued] = useState<IssuedCert[]>([])
    const [issuedLoading, setIssuedLoading] = useState(false)
    const [issuedSearch, setIssuedSearch] = useState('')
    const [issuedPage, setIssuedPage] = useState(1)
    const [issuedPagination, setIssuedPagination] =
        useState<Pagination | null>(null)

    // Modals
    const [createModal, setCreateModal] = useState(false)
    const [editModal, setEditModal] = useState<{
        open: boolean
        template: Template | null
    }>({ open: false, template: null })
    const [issueModal, setIssueModal] = useState<{
        open: boolean
        template: Template | null
    }>({ open: false, template: null })
    const [bulkModal, setBulkModal] = useState<{
        open: boolean
        template: Template | null
    }>({ open: false, template: null })
    const [deleteModal, setDeleteModal] = useState<{
        open: boolean
        template: Template | null
    }>({ open: false, template: null })

    // Feedback
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Academic settings for bulk issue class filter
    const [academicClasses, setAcademicClasses] = useState<
        Array<{ name: string; displayName: string }>
    >([])
    const [academicSections, setAcademicSections] = useState<
        Array<{ name: string }>
    >([])

    // ── Fetch Templates ────────────────────────────────────────

    const fetchTemplates = useCallback(async () => {
        setTemplatesLoading(true)
        try {
            const params = new URLSearchParams({ type: 'templates' })
            if (templateSearch) params.set('search', templateSearch)

            const res = await fetch(`/api/certificates?${params}`)
            const data = await res.json()

            const raw = Array.isArray(data.templates) ? data.templates : []
            setTemplates(raw.map(castTemplate))
        } catch {
            setTemplates([])
        } finally {
            setTemplatesLoading(false)
        }
    }, [templateSearch])

    // ── Fetch Issued ───────────────────────────────────────────

    const fetchIssued = useCallback(async () => {
        setIssuedLoading(true)
        try {
            const params = new URLSearchParams({
                type: 'issued',
                page: String(issuedPage),
                limit: '20',
            })
            if (issuedSearch) params.set('search', issuedSearch)

            const res = await fetch(`/api/certificates?${params}`)
            const data = await res.json()

            setIssued(Array.isArray(data.issued) ? data.issued : [])
            setIssuedPagination(data.pagination || null)
        } catch {
            setIssued([])
        } finally {
            setIssuedLoading(false)
        }
    }, [issuedSearch, issuedPage])

    // ── Fetch Academic Settings ────────────────────────────────

    const fetchAcademicSettings = useCallback(async () => {
        if (institutionType !== 'school') return
        try {
            const res = await fetch('/api/settings/academic')
            const data = await res.json()
            setAcademicClasses(data.classes || [])
            setAcademicSections(data.sections || [])
        } catch {
            // Optional — bulk issue still works without
        }
    }, [institutionType])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    useEffect(() => {
        if (tab === 'issued') fetchIssued()
    }, [tab, fetchIssued])

    useEffect(() => {
        fetchAcademicSettings()
    }, [fetchAcademicSettings])

    // ── Delete Template ────────────────────────────────────────

    const handleDelete = async () => {
        if (!deleteModal.template) return
        setDeleting(true)

        try {
            const res = await fetch(
                `/api/certificates?id=${deleteModal.template._id}&type=template`,
                { method: 'DELETE' }
            )

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete')

            setTemplates(prev =>
                prev.filter(t => t._id !== deleteModal.template!._id)
            )
            setDeleteModal({ open: false, template: null })
            setAlert({ type: 'success', msg: 'Template deleted successfully' })
        } catch (err: any) {
            setAlert({ type: 'error', msg: err.message })
        } finally {
            setDeleting(false)
        }
    }

    // ── Filtered Templates ─────────────────────────────────────

    const filteredTemplates = templates.filter(
        t =>
            !templateSearch ||
            t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
            t.type.toLowerCase().includes(templateSearch.toLowerCase())
    )

    // ── Render ─────────────────────────────────────────────────

    return (
        <div className="portal-content-enter">
            <PageHeader
                title="Certificates"
                subtitle="Create certificate templates and issue to students or staff"
                action={
                    <div className="flex items-center gap-2">
                        <Link href="/admin/certificates/guide">
                            <Button variant="secondary">
                                <HelpCircle size={15} />
                                Guide
                            </Button>
                        </Link>
                        <Button onClick={() => setCreateModal(true)}>
                            <Plus size={15} />
                            New Template
                        </Button>
                    </div>
                }
            />

            {alert && (
                <div className="mb-5">
                    <Alert
                        type={alert.type}
                        message={alert.msg}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            {/* ── Tabs ──────────────────────────────────────────── */}
            <div
                className="flex items-center gap-1 p-1 rounded-[var(--radius-md)]
                   border border-[var(--border)] mb-6 w-fit"
                style={{ background: 'var(--bg-muted)' }}
            >
                {(
                    [
                        { id: 'templates', label: 'Templates', icon: LayoutGrid },
                        { id: 'issued', label: 'Issued Certificates', icon: List },
                    ] as const
                ).map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="flex items-center gap-2 px-4 py-2
                       rounded-[var(--radius-sm)] text-sm font-medium
                       transition-all duration-150"
                        style={{
                            background:
                                tab === id ? 'var(--bg-card)' : 'transparent',
                            color:
                                tab === id
                                    ? 'var(--text-primary)'
                                    : 'var(--text-secondary)',
                            boxShadow: tab === id ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        <Icon size={15} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── TEMPLATES TAB ─────────────────────────────────── */}
            {tab === 'templates' && (
                <>
                    {/* Search */}
                    <div className="flex items-center gap-3 mb-5">
                        <div
                            className="portal-search flex-1 max-w-sm"
                            style={{ minWidth: 0 }}
                        >
                            <Search size={15} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={templateSearch}
                                onChange={e => setTemplateSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {templatesLoading ? (
                        <div className="flex justify-center py-16">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <EmptyState
                            icon={<Award size={22} />}
                            title="No certificate templates yet"
                            description="Create your first certificate template to start issuing certificates"
                            action={
                                <Button onClick={() => setCreateModal(true)}>
                                    <Plus size={14} />
                                    Create Template
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map(template => {
                                const color = CERT_TYPE_COLORS[template.type]

                                return (
                                    <div
                                        key={template._id}
                                        className="portal-card overflow-hidden"
                                    >
                                        {/* Color accent top */}
                                        <div
                                            className="h-1 w-full"
                                            style={{ background: color }}
                                        />

                                        <div className="p-4">
                                            {/* Header */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <div
                                                    className="w-10 h-10 rounded-[var(--radius-md)]
                                     flex items-center justify-center
                                     flex-shrink-0"
                                                    style={{
                                                        background: `${color}18`,
                                                        color,
                                                    }}
                                                >
                                                    <Award size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="text-sm font-bold truncate"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        {template.name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        <Badge variant="primary">
                                                            {CERT_TYPE_LABELS[template.type]}
                                                        </Badge>
                                                        {template.category && (
                                                            <span
                                                                className="text-[10px]"
                                                                style={{ color: 'var(--text-muted)' }}
                                                            >
                                                                {template.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div className="space-y-1.5 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        Layout
                                                    </span>
                                                    <span
                                                        className="text-xs font-medium capitalize"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        {template.layout}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        Applicable To
                                                    </span>
                                                    <span
                                                        className="text-xs font-medium capitalize"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        {template.applicableTo}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        Signature
                                                    </span>
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        {template.signatureLabel}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        Dynamic Fields
                                                    </span>
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        {template.fields.length}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        Accreditations
                                                    </span>
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{
                                                            color: template.showAccreditations
                                                                ? 'var(--success)'
                                                                : 'var(--text-muted)',
                                                        }}
                                                    >
                                                        {template.showAccreditations ? 'Shown' : 'Hidden'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div
                                                className="pt-3 border-t border-[var(--border)]
                                   flex items-center gap-2 flex-wrap"
                                            >
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        setIssueModal({ open: true, template })
                                                    }
                                                >
                                                    <Send size={12} />
                                                    Issue
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setBulkModal({ open: true, template })
                                                    }
                                                >
                                                    <Users size={12} />
                                                    Bulk Issue
                                                </Button>

                                                <button
                                                    onClick={() =>
                                                        setEditModal({ open: true, template })
                                                    }
                                                    className="btn-icon btn-icon-sm"
                                                    title="Edit template"
                                                >
                                                    <Pencil size={13} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        setDeleteModal({ open: true, template })
                                                    }
                                                    className="btn-icon btn-icon-sm"
                                                    style={{ color: 'var(--danger)' }}
                                                    title="Delete template"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── ISSUED TAB ────────────────────────────────────── */}
            {tab === 'issued' && (
                <>
                    {/* Search */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="portal-search flex-1 max-w-sm">
                            <Search size={15} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name, certificate number..."
                                value={issuedSearch}
                                onChange={e => {
                                    setIssuedSearch(e.target.value)
                                    setIssuedPage(1)
                                }}
                            />
                        </div>
                    </div>

                    <div className="portal-card">
                        <IssuedList
                            certificates={issued}
                            loading={issuedLoading}
                            onRevoked={id =>
                                setIssued(prev =>
                                    prev.map(c =>
                                        c._id === id
                                            ? { ...c, status: 'revoked' as const }
                                            : c
                                    )
                                )
                            }
                            onPdfSaved={(id, pdfUrl) =>
                                setIssued(prev =>
                                    prev.map(c =>
                                        c._id === id
                                            ? { ...c, pdfUrl, savedToStorage: true }
                                            : c
                                    )
                                )
                            }
                        />

                        {/* Pagination */}
                        {issuedPagination &&
                            issuedPagination.totalPages > 1 && (
                                <div
                                    className="flex items-center justify-between px-4 py-3
                             border-t border-[var(--border)]"
                                >
                                    <p
                                        className="text-xs"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Showing{' '}
                                        {(issuedPage - 1) * 20 + 1}–
                                        {Math.min(
                                            issuedPage * 20,
                                            issuedPagination.total
                                        )}{' '}
                                        of {issuedPagination.total}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() =>
                                                setIssuedPage(p => Math.max(1, p - 1))
                                            }
                                            disabled={issuedPage === 1}
                                            className="btn-icon btn-icon-sm"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <span
                                            className="text-xs px-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {issuedPage} / {issuedPagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setIssuedPage(p =>
                                                    Math.min(issuedPagination.totalPages, p + 1)
                                                )
                                            }
                                            disabled={
                                                issuedPage === issuedPagination.totalPages
                                            }
                                            className="btn-icon btn-icon-sm"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                    </div>
                </>
            )}

            {/* ── MODALS ────────────────────────────────────────── */}
            <Portal>
                {/* Create Template Modal */}
                <Modal
                    open={createModal}
                    onClose={() => setCreateModal(false)}
                    title="Create Certificate Template"
                    size="lg"
                >
                    <TemplateForm
                        institutionType={institutionType}
                        onSuccess={rawTemplate => {
                            setTemplates(prev => [castTemplate(rawTemplate), ...prev])
                            setCreateModal(false)
                            setAlert({
                                type: 'success',
                                msg: 'Certificate template created successfully',
                            })
                        }}
                        onCancel={() => setCreateModal(false)}
                    />
                </Modal>

                {/* Edit Template Modal */}
                <Modal
                    open={editModal.open}
                    onClose={() => setEditModal({ open: false, template: null })}
                    title="Edit Certificate Template"
                    size="lg"
                >
                    {editModal.template && (
                        <TemplateForm
                            institutionType={institutionType}
                            initialData={editModal.template}
                            onSuccess={rawUpdated => {
                                const updated = castTemplate(rawUpdated)
                                setTemplates(prev =>
                                    prev.map(t =>
                                        t._id === updated._id ? updated : t
                                    )
                                )
                                setEditModal({ open: false, template: null })
                                setAlert({
                                    type: 'success',
                                    msg: 'Template updated successfully',
                                })
                            }}
                            onCancel={() =>
                                setEditModal({ open: false, template: null })
                            }
                        />
                    )}
                </Modal>

                {/* Issue Modal */}
                <Modal
                    open={issueModal.open}
                    onClose={() =>
                        setIssueModal({ open: false, template: null })
                    }
                    title={`Issue — ${issueModal.template?.name || ''}`}
                    size="md"
                >
                    {issueModal.template && (
                        <IssueModal
                            template={issueModal.template}
                            institutionType={institutionType}
                            onSuccess={issuedCert => {
                                setIssueModal({ open: false, template: null })
                                setAlert({
                                    type: 'success',
                                    msg: `Certificate issued: ${issuedCert.certificateNumber}`,
                                })
                                if (tab === 'issued') fetchIssued()
                            }}
                            onCancel={() =>
                                setIssueModal({ open: false, template: null })
                            }
                        />
                    )}
                </Modal>

                {/* Bulk Issue Modal */}
                <Modal
                    open={bulkModal.open}
                    onClose={() =>
                        setBulkModal({ open: false, template: null })
                    }
                    title={`Bulk Issue — ${bulkModal.template?.name || ''}`}
                    size="md"
                >
                    {bulkModal.template && (
                        <BulkIssueModal
                            template={bulkModal.template}
                            institutionType={institutionType}
                            classes={academicClasses}
                            sections={academicSections}
                            onSuccess={({ count }) => {
                                setBulkModal({ open: false, template: null })
                                setAlert({
                                    type: 'success',
                                    msg: `${count} certificates issued successfully`,
                                })
                                if (tab === 'issued') fetchIssued()
                            }}
                            onCancel={() =>
                                setBulkModal({ open: false, template: null })
                            }
                        />
                    )}
                </Modal>

                {/* Delete Confirm Modal */}
                <Modal
                    open={deleteModal.open}
                    onClose={() =>
                        setDeleteModal({ open: false, template: null })
                    }
                    title="Delete Template"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Are you sure you want to delete{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>
                                {deleteModal.template?.name}
                            </strong>
                            ? This action cannot be undone. Issued certificates will
                            remain unaffected.
                        </p>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    setDeleteModal({ open: false, template: null })
                                }
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                loading={deleting}
                            >
                                Delete Template
                            </Button>
                        </div>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}