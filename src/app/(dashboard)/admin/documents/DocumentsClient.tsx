// FILE: src/app/(dashboard)/admin/documents/DocumentsClient.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
    FileCheck, Plus, Trash2, Download,
    Search, X, FileText, Award, Users,
    ChevronRight, AlertCircle, CheckCircle,
    Printer, Clock, Hash, Save, HardDrive,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
interface DocTemplate {
    _id: string
    name: string
    type: 'tc' | 'cc' | 'bonafide' | 'custom'
    content: string
    variables: string[]
    isDefault: boolean
    createdAt: string
}

interface IssuedDoc {
    _id: string
    templateId: string
    studentName: string
    studentAdmissionNo: string
    documentType: string
    serialNo: string
    issuedByName: string
    status: 'issued' | 'revoked'
    savedToStorage: boolean
    pdfUrl?: string
    createdAt: string
}

interface StudentOption {
    _id: string
    name: string
    admissionNo: string
    class: string
    section: string
}

type TabType = 'templates' | 'issued'

// ─────────────────────────────────────────────────────────
// ✅ PROFESSIONAL TEMPLATES (Institution-aware)
// ─────────────────────────────────────────────────────────
const DOC_TYPES = [
    { value: 'tc', label: 'Transfer Certificate (TC)' },
    { value: 'cc', label: 'Character Certificate (CC)' },
    { value: 'bonafide', label: 'Bonafide Certificate' },
    { value: 'custom', label: 'Custom Document' },
] as const

const DOC_TYPE_LABELS: Record<string, Record<string, string>> = {
    school: {
        tc: 'Transfer Certificate (TC)',
        cc: 'Character Certificate (CC)',
        bonafide: 'Bonafide Certificate',
        custom: 'Custom Document',
    },
    academy: {
        tc: 'Course Completion Letter',
        cc: 'Character Certificate',
        bonafide: 'Enrollment Certificate',
        custom: 'Custom Document',
    },
    coaching: {
        tc: 'Transfer Letter',
        cc: 'Character Certificate',
        bonafide: 'Enrollment Certificate',
        custom: 'Custom Document',
    },
}

const DEFAULT_TEMPLATES: Record<string, Record<string, string>> = {
    school: {
        tc: `TRANSFER CERTIFICATE

Serial No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, was a bonafide student of this school. The following particulars are furnished as per the school records:

1. Admission Number        : {{admissionNo}}
2. Class in which studying : {{class}} - {{section}}
3. Academic Session        : {{session}}
4. Date of Birth           : {{dob}} (as per school records)
5. Conduct & Character     : {{character}}

The student has cleared all dues of the school. This certificate is issued on the request of the parent/guardian for the purpose of seeking admission elsewhere.

We wish {{studentName}} all the best for his/her future endeavors.

Place: _______________
Date: {{toDate}}

                                        Principal/Head of School
                                        (Signature & School Seal)`,

        cc: `CHARACTER CERTIFICATE

Serial No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, bearing Admission No. {{admissionNo}}, was a student of this school during the Academic Session {{session}}.

During his/her entire period of study in this school, his/her conduct and character were found to be {{character}}. He/She was a sincere and disciplined student.

This certificate is issued on the specific request of the student/parent for official purposes.

Place: _______________
Date: {{toDate}}

                                        Principal/Head of School
                                        (Signature & School Seal)`,

        bonafide: `BONAFIDE CERTIFICATE

Serial No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, is a bonafide student of this school for the Academic Session {{session}}.

Details are as under:

  Admission Number : {{admissionNo}}
  Class            : {{class}} - Section {{section}}
  Roll Number      : {{rollNo}}
  Date of Birth    : {{dob}}
  Address          : {{address}}

This certificate is issued for academic/official purposes only and is valid for the current academic session.

Place: _______________
Date: {{toDate}}

                                        Principal/Head of School
                                        (Signature & School Seal)`,

        custom: `CERTIFICATE

Serial No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, bearing Admission No. {{admissionNo}}, is/was associated with this institution.

This certificate is issued for official purposes as per the request of the concerned person.

Place: _______________
Date: {{toDate}}

                                        Principal/Head of School
                                        (Signature & School Seal)`,
    },

    academy: {
        tc: `COURSE TRANSFER / LEAVING CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, bearing Enrollment No. {{admissionNo}}, was enrolled at this institute in the course {{class}} during the session {{session}}.

During his/her period of study, his/her conduct was found to be {{character}}. The student has cleared all pending dues as on the date of issue.

This certificate is issued on request for the purpose of seeking admission/enrollment at another institute.

We wish the student all success in future endeavors.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,

        cc: `CHARACTER CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, Enrollment No. {{admissionNo}}, was a student of this institute during the session {{session}}.

During his/her entire tenure at this institute, his/her conduct, behaviour, and character were found to be {{character}}. He/She was a dedicated and disciplined learner.

This certificate is issued for official purposes on the request of the student.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,

        bonafide: `ENROLLMENT / BONAFIDE CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, is currently enrolled as a bonafide student at this institute for the session {{session}}.

Enrollment Details:
  Enrollment Number : {{admissionNo}}
  Course / Batch    : {{class}}
  Academic Session  : {{session}}
  Date of Birth     : {{dob}}
  Contact Address   : {{address}}

This certificate is issued for academic/scholarship/official purposes only.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,

        custom: `CERTIFICATE OF ASSOCIATION

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Enrollment No. {{admissionNo}}, is/was associated with this institute during the session {{session}}.

This certificate is issued for official purposes as requested.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,
    },

    coaching: {
        tc: `TRANSFER / LEAVING CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, Roll No. {{admissionNo}}, was enrolled at this coaching institute in {{class}} batch during the session {{session}}.

His/Her conduct during the period of study was {{character}}. All dues have been cleared as on date.

This certificate is issued on the request of the parent/student for official purposes.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,

        cc: `CHARACTER CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, Roll No. {{admissionNo}}, attended this coaching institute for {{class}} during the session {{session}}.

During the course of study, his/her conduct and character were found to be {{character}}. He/She demonstrated sincerity and dedication throughout.

This certificate is issued for official purposes on request.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,

        bonafide: `BONAFIDE STUDENT CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Son/Daughter of Shri {{fatherName}}, is a bonafide student of this coaching institute for the session {{session}}.

Student Details:
  Roll Number   : {{admissionNo}}
  Batch / Course: {{class}}
  Session       : {{session}}
  Date of Birth : {{dob}}
  Address       : {{address}}

This certificate is issued for scholarship/official/academic purposes only.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,

        custom: `CERTIFICATE

Certificate No: {{serialNo}}
Date: {{toDate}}

TO WHOM IT MAY CONCERN

This is to certify that {{studentName}}, Roll No. {{admissionNo}}, is/was a student of this coaching institute during session {{session}}.

This certificate is issued for official purposes as requested.

Place: _______________
Date: {{toDate}}

                                        Director / Head of Institute
                                        (Signature & Institute Seal)`,
    },
}

const TYPE_COLORS: Record<string, string> = {
    tc: 'var(--info)',
    cc: 'var(--success)',
    bonafide: 'var(--warning)',
    custom: 'var(--primary-500)',
}

const TYPE_BG: Record<string, string> = {
    tc: 'var(--info-light)',
    cc: 'var(--success-light)',
    bonafide: 'var(--warning-light)',
    custom: 'var(--primary-50)',
}

// ─────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────
function Toast({
    message,
    type,
    onClose,
}: {
    message: string
    type: 'success' | 'error'
    onClose: () => void
}) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500)
        return () => clearTimeout(t)
    }, [onClose])

    return (
        <Portal>
            <div
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.125rem',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-card)',
                    border: `1px solid var(--border)`,
                    boxShadow: 'var(--shadow-xl)',
                    minWidth: 280,
                    animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
                    borderLeft: `4px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                }}
            >
                {type === 'success'
                    ? <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    : <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                }
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1 }}>
                    {message}
                </span>
                <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <X size={14} />
                </button>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────────────────
// STUDENT SEARCH (same as before — omitted for brevity)
// Copy from previous implementation
// ─────────────────────────────────────────────────────────
function StudentSearch({
    value,
    onSelect,
    selected,
    onClear,
}: {
    value: string
    onSelect: (s: StudentOption) => void
    selected: StudentOption | null
    onClear: () => void
}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<StudentOption[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // ✅ FIXED: Added initial value (null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const search = useCallback((q: string) => {
        // ✅ FIXED: Safe null check before clearTimeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        if (!q.trim()) {
            setResults([])
            setOpen(false)
            return
        }

        setLoading(true)

        // ✅ FIXED: Type-safe assignment
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/students/list?search=${encodeURIComponent(q)}&limit=10`)
                const data = await res.json()
                setResults(data.students || [])
                setOpen(true)
            } catch {
                setResults([])
            } finally {
                setLoading(false)
            }
        }, 350)
    }, [])

    if (selected) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--success)',
                    background: 'var(--success-light)',
                }}
            >
                <div
                    style={{
                        width: 32, height: 32,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--success)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                        {selected.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {selected.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--success-dark)', margin: 0 }}>
                        {selected.admissionNo} • Class {selected.class}-{selected.section}
                    </p>
                </div>
                <button
                    onClick={onClear}
                    style={{
                        width: 24, height: 24,
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--success)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <X size={12} style={{ color: '#fff' }} />
                </button>
            </div>
        )
    }

    return (
        <div ref={wrapperRef} style={{ position: 'relative' }}>
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-card)',
                    transition: 'border-color 0.15s',
                }}
                className="focus-within:border-[var(--primary-500)] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
            >
                <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Student naam ya admission no se search karo..."
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value)
                        search(e.target.value)
                    }}
                    style={{
                        border: 'none', outline: 'none',
                        background: 'transparent',
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        width: '100%',
                        fontFamily: 'var(--font-body)',
                    }}
                />
                {loading && (
                    <svg className="animate-spin w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary-500)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
            </div>

            {open && results.length > 0 && (
                <div
                    style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-dropdown)',
                        zIndex: 50,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}
                >
                    {results.map(s => (
                        <button
                            key={s._id}
                            onClick={() => {
                                onSelect(s)
                                setQuery('')
                                setResults([])
                                setOpen(false)
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                width: '100%', padding: '0.625rem 0.875rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.1s',
                            }}
                            className="hover:bg-[var(--bg-muted)]"
                        >
                            <div
                                style={{
                                    width: 30, height: 30,
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--primary-100)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <span style={{ color: 'var(--primary-600)', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {s.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {s.name}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {s.admissionNo} • Class {s.class}-{s.section}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {open && !loading && results.length === 0 && query && (
                <div
                    style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-dropdown)',
                        zIndex: 50,
                        padding: '0.875rem',
                        textAlign: 'center',
                    }}
                >
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                        Koi student nahi mila
                    </p>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// CREATE TEMPLATE MODAL (same as before)
// Copy from previous — omitted for brevity
// ─────────────────────────────────────────────────────────
function CreateTemplateModal({
    open,
    onClose,
    onCreated,
    institutionType,
}: {
    open: boolean
    onClose: () => void
    onCreated: () => void
    institutionType: string
}) {
    const [form, setForm] = useState({
        name: '',
        type: 'tc' as string,
        content: '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const typeLabels = DOC_TYPE_LABELS[institutionType] || DOC_TYPE_LABELS.school
    const defaultTemplates = DEFAULT_TEMPLATES[institutionType] || DEFAULT_TEMPLATES.school

    const docTypeOptions = Object.entries(typeLabels).map(([value, label]) => ({
        value,
        label,
    }))

    useEffect(() => {
        if (open) {
            setForm({
                name: typeLabels['tc'] || 'Transfer Certificate',
                type: 'tc',
                content: defaultTemplates['tc'] || '',
            })
            setError('')
        }
    }, [open, institutionType])

    const handleTypeChange = (type: string) => {
        setForm(prev => ({
            ...prev,
            type,
            name: typeLabels[type] || type.toUpperCase(),
            content: defaultTemplates[type] || '',
        }))
    }

    const handleCreate = async () => {
        if (!form.name.trim()) { setError('Template naam required hai'); return }
        if (!form.content.trim()) { setError('Content required hai'); return }

        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_template', ...form }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            onCreated()
        } catch (e: any) {
            setError(e.message || 'Kuch gadbad ho gayi')
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <Portal>
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                    background: 'rgba(30,27,75,0.5)',
                    backdropFilter: 'blur(6px)',
                }}
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <div
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-2xl)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-modal)',
                        width: '100%',
                        maxWidth: 600,
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                background: 'var(--primary-50)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Plus size={18} style={{ color: 'var(--primary-600)' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                                    New Template
                                </h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Document template banao
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-muted)', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Doc Type */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem', fontFamily: 'var(--font-display)' }}>
                                Document Type
                            </label>
                            <select
                                value={form.type}
                                onChange={e => handleTypeChange(e.target.value)}
                                className="input-clean"
                            >
                                {docTypeOptions.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem', fontFamily: 'var(--font-display)' }}>
                                Template Name
                            </label>
                            <input
                                type="text"
                                className="input-clean"
                                value={form.name}
                                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Template ka naam..."
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>
                                Content
                            </label>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                                Dynamic fields ke liye{' '}
                                <code style={{ background: 'var(--bg-muted)', padding: '1px 4px', borderRadius: 4, fontSize: '0.7rem' }}>
                                    {'{{variableName}}'}
                                </code>{' '}
                                use karo
                            </p>
                            <textarea
                                value={form.content}
                                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                                rows={8}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1.5px solid var(--border)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.875rem',
                                    fontFamily: 'var(--font-mono)',
                                    lineHeight: 1.6,
                                    resize: 'vertical',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'var(--primary-500)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                                placeholder="Document ka content yahan likhiye..."
                            />
                        </div>

                        {/* Available variables hint */}
                        <div style={{
                            padding: '0.875rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-muted)',
                            border: '1px solid var(--border)',
                        }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Available Variables:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {[
                                    'studentName', 'fatherName', 'motherName',
                                    'class', 'section', 'admissionNo',
                                    'rollNo', 'academicYear', 'session',
                                    'dob', 'address', 'serialNo', 'toDate', 'character',
                                ].map(v => (
                                    <span
                                        key={v}
                                        style={{
                                            fontSize: '0.6875rem',
                                            background: 'var(--primary-50)',
                                            color: 'var(--primary-600)',
                                            border: '1px solid var(--primary-200)',
                                            borderRadius: 'var(--radius-full)',
                                            padding: '2px 8px',
                                            fontFamily: 'var(--font-mono)',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                            setForm(prev => ({
                                                ...prev,
                                                content: prev.content + `{{${v}}}`,
                                            }))
                                        }}
                                        title="Click to insert"
                                    >
                                        {`{{${v}}}`}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--danger-light)',
                                border: '1px solid rgba(239,68,68,0.2)',
                            }}>
                                <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--danger-dark)', margin: 0 }}>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        flexShrink: 0,
                    }}>
                        <button
                            onClick={onClose}
                            className="btn-ghost btn-sm"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="btn-primary btn-sm"
                            disabled={saving}
                            style={{ minWidth: 120 }}
                        >
                            {saving ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : 'Create Template'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────────────────
// GENERATE MODAL
// ─────────────────────────────────────────────────────────
function GenerateModal({
    open,
    template,
    onClose,
    onGenerated,
}: {
    open: boolean
    template: DocTemplate | null
    onClose: () => void
    onGenerated: (content: string, serialNo: string, studentName: string, issuedDocId: string) => void
}) {
    const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null)
    const [customData, setCustomData] = useState<Record<string, string>>({})
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (open) {
            setSelectedStudent(null)
            setCustomData({})
            setError('')
        }
    }, [open])

    const handleGenerate = async () => {
        if (!selectedStudent) { setError('Student select karo'); return }
        if (!template) return

        setGenerating(true)
        setError('')

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate',
                    templateId: template._id,
                    studentId: selectedStudent._id,
                    customData,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')

            // Pass issuedDocId for Save PDF functionality
            onGenerated(
                data.generatedContent,
                data.serialNo,
                data.studentName,
                data.issued._id  // ✅ NEW: Pass issued doc ID
            )
        } catch (e: any) {
            setError(e.message || 'Generate nahi ho saka')
        } finally {
            setGenerating(false)
        }
    }

    if (!open || !template) return null

    return (
        <Portal>
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                    background: 'rgba(30,27,75,0.5)',
                    backdropFilter: 'blur(6px)',
                }}
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <div
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-2xl)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-modal)',
                        width: '100%',
                        maxWidth: 520,
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                background: TYPE_BG[template.type] || 'var(--primary-50)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FileText size={18} style={{ color: TYPE_COLORS[template.type] || 'var(--primary-600)' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                                    Generate {template.name}
                                </h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Student select karke document generate karo
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--bg-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
                                Student Select Karo
                            </label>
                            <StudentSearch
                                value=""
                                onSelect={setSelectedStudent}
                                selected={selectedStudent}
                                onClear={() => setSelectedStudent(null)}
                            />
                        </div>

                        {/* Character field */}
                        {template.variables.includes('character') && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem', fontFamily: 'var(--font-display)' }}>
                                    Character / Conduct
                                </label>
                                <select
                                    className="input-clean"
                                    value={customData.character || 'good'}
                                    onChange={e => setCustomData(prev => ({ ...prev, character: e.target.value }))}
                                >
                                    <option value="good">Good</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="satisfactory">Satisfactory</option>
                                    <option value="very good">Very Good</option>
                                </select>
                            </div>
                        )}

                        {/* From Date field */}
                        {template.variables.includes('fromDate') && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem', fontFamily: 'var(--font-display)' }}>
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    className="input-clean"
                                    value={customData.fromDate || ''}
                                    onChange={e => setCustomData(prev => ({ ...prev, fromDate: e.target.value }))}
                                />
                            </div>
                        )}

                        {/* Template preview */}
                        <div style={{
                            padding: '0.875rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-muted)',
                            border: '1px solid var(--border)',
                        }}>
                            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Template Preview
                            </p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                {template.content.length > 200
                                    ? template.content.substring(0, 200) + '...'
                                    : template.content}
                            </p>
                        </div>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--danger-dark)', margin: 0 }}>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
                        <button onClick={onClose} className="btn-ghost btn-sm" disabled={generating}>
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            className="btn-primary btn-sm"
                            disabled={generating || !selectedStudent}
                            style={{ minWidth: 140 }}
                        >
                            {generating ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generating...
                                </span>
                            ) : (
                                <>
                                    <FileText size={14} />
                                    Generate Document
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────────────────
// ✅ DOCUMENT PREVIEW MODAL — WITH SAVE TO STORAGE BUTTON
// ─────────────────────────────────────────────────────────
function DocumentPreviewModal({
    open,
    content,
    serialNo,
    studentName,
    schoolName,
    issuedDocId,
    onClose,
    onSaved,
}: {
    open: boolean
    content: string
    serialNo: string
    studentName: string
    schoolName: string
    issuedDocId: string
    onClose: () => void
    onSaved: () => void
}) {
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState('')

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${serialNo} - ${studentName}</title>
                <style>
                    @page { margin: 2cm; }
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 14pt;
                        line-height: 1.8;
                        color: #000;
                        margin: 0;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 16px;
                        margin-bottom: 24px;
                    }
                    .school-name {
                        font-size: 20pt;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                    }
                    .doc-title {
                        font-size: 14pt;
                        font-weight: bold;
                        text-transform: uppercase;
                        margin-top: 8px;
                        text-decoration: underline;
                    }
                    .serial {
                        font-size: 11pt;
                        color: #555;
                        margin-top: 4px;
                    }
                    .content {
                        text-align: justify;
                        margin: 24px 0;
                        white-space: pre-wrap;
                    }
                    .footer {
                        margin-top: 48px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature-box {
                        text-align: center;
                        min-width: 150px;
                    }
                    .signature-line {
                        border-top: 1px solid #000;
                        margin-top: 48px;
                        padding-top: 8px;
                        font-size: 11pt;
                    }
                    .date {
                        font-size: 11pt;
                        margin-top: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="school-name">${schoolName}</div>
                    <div class="doc-title">${serialNo.split('-')[0]}</div>
                    <div class="serial">Serial No: ${serialNo}</div>
                </div>
                <div class="content">${content}</div>
                <div class="footer">
                    <div class="date">Date: ${new Date().toLocaleDateString('en-IN')}</div>
                    <div class="signature-box">
                        <div class="signature-line">Principal / Director</div>
                    </div>
                </div>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 300)
    }

    // ✅ NEW: Save PDF to storage
    const handleSave = async () => {
        if (saved) return // Already saved

        setSaving(true)
        setSaveError('')

        try {
            // Generate HTML for PDF (same structure as print)
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${serialNo} - ${studentName}</title>
    <style>
        @page { margin: 2cm; size: A4; }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 14pt;
            line-height: 1.8;
            color: #000;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }
        .school-name {
            font-size: 20pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .doc-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 8px;
            text-decoration: underline;
        }
        .serial {
            font-size: 11pt;
            color: #555;
            margin-top: 4px;
        }
        .content {
            text-align: justify;
            margin: 24px 0;
            white-space: pre-wrap;
            line-height: 2;
        }
        .footer {
            margin-top: 48px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .date {
            font-size: 11pt;
        }
        .signature-box {
            text-align: center;
            min-width: 150px;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 48px;
            padding-top: 8px;
            font-size: 11pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">${schoolName}</div>
        <div class="doc-title">${serialNo.split('-')[0]}</div>
        <div class="serial">Serial No: ${serialNo}</div>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
        <div class="date">Date: ${new Date().toLocaleDateString('en-IN')}</div>
        <div class="signature-box">
            <div class="signature-line">Principal / Director</div>
        </div>
    </div>
</body>
</html>
`

            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_pdf',
                    issuedDocId,
                    htmlContent,
                    schoolName,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Save failed')
            }

            setSaved(true)
            onSaved() // Refresh issued docs list
        } catch (e: any) {
            setSaveError(e.message || 'Storage mein save nahi ho saka')
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <Portal>
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 1001,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                    background: 'rgba(30,27,75,0.6)',
                    backdropFilter: 'blur(8px)',
                }}
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <div
                    style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-2xl)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-modal)',
                        width: '100%',
                        maxWidth: 680,
                        maxHeight: '92vh',
                        display: 'flex',
                        flexDirection: 'column',
                        animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                background: saved ? 'var(--success-light)' : 'var(--primary-50)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {saved ? (
                                    <HardDrive size={18} style={{ color: 'var(--success)' }} />
                                ) : (
                                    <CheckCircle size={18} style={{ color: 'var(--primary-600)' }} />
                                )}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)' }}>
                                    Document Generated!
                                </h2>
                                <p style={{ fontSize: '0.75rem', color: saved ? 'var(--success-dark)' : 'var(--text-muted)', margin: 0 }}>
                                    {saved ? '✓ Saved to storage' : `${serialNo} • ${studentName}`}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* ✅ Save to Storage Button */}
                            {!saved && (
                                <button
                                    onClick={handleSave}
                                    className="btn-secondary btn-sm"
                                    disabled={saving}
                                    style={{ gap: '0.375rem' }}
                                    title="Save PDF to R2 storage (permanent archive)"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save to Records
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Print Button */}
                            <button
                                onClick={handlePrint}
                                className="btn-secondary btn-sm"
                                style={{ gap: '0.375rem' }}
                            >
                                <Printer size={14} />
                                Print
                            </button>

                            {/* Close */}
                            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--bg-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Save Error Alert */}
                    {saveError && (
                        <div style={{
                            margin: '1rem 1.5rem 0',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--danger-light)',
                            border: '1px solid rgba(239,68,68,0.2)',
                        }}>
                            <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.875rem', color: 'var(--danger-dark)', margin: 0 }}>{saveError}</p>
                        </div>
                    )}

                    {/* Saved Success Alert */}
                    {saved && (
                        <div style={{
                            margin: '1rem 1.5rem 0',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--success-light)',
                            border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                            <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.875rem', color: 'var(--success-dark)', margin: 0 }}>
                                PDF successfully saved to storage. You can download it anytime from "Issued Documents" tab.
                            </p>
                        </div>
                    )}

                    {/* Preview */}
                    <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                        {/* Document paper */}
                        <div style={{
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 'var(--radius-md)',
                            padding: '2.5rem',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                            fontFamily: "'Times New Roman', serif",
                        }}>
                            {/* School name */}
                            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                                    {schoolName}
                                </p>
                                <p style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'underline', margin: '0.5rem 0 0' }}>
                                    {serialNo.split('-')[0]}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.25rem 0 0' }}>
                                    Serial No: {serialNo}
                                </p>
                            </div>

                            {/* Content */}
                            <p style={{
                                fontSize: '0.9375rem',
                                lineHeight: 2,
                                textAlign: 'justify',
                                whiteSpace: 'pre-wrap',
                                margin: 0,
                                color: '#111',
                            }}>
                                {content}
                            </p>

                            {/* Footer */}
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                                        Date: {new Date().toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', minWidth: 160, fontSize: '0.875rem' }}>
                                        Principal / Director
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} className="btn-ghost btn-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────────────────
// MAIN CLIENT COMPONENT
// ─────────────────────────────────────────────────────────
export default function DocumentsClient() {
    const { data: session } = useSession()

    const [activeTab, setActiveTab] = useState<TabType>('templates')
    const [templates, setTemplates] = useState<DocTemplate[]>([])
    const [issuedDocs, setIssuedDocs] = useState<IssuedDoc[]>([])
    const [loading, setLoading] = useState(true)

    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [generateModal, setGenerateModal] = useState<{ open: boolean; template: DocTemplate | null }>({ open: false, template: null })
    const [previewModal, setPreviewModal] = useState<{
        open: boolean
        content: string
        serialNo: string
        studentName: string
        issuedDocId: string  // ✅ NEW
    }>({ open: false, content: '', serialNo: '', studentName: '', issuedDocId: '' })

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    const institutionType = (session?.user as any)?.institutionType || 'school'
    const schoolName = session?.user?.schoolName || 'School'
    const typeLabels = DOC_TYPE_LABELS[institutionType] || DOC_TYPE_LABELS.school

    // ── Fetch ──
    const fetchTemplates = useCallback(async () => {
        try {
            const res = await fetch('/api/documents?type=templates')
            const data = await res.json()
            setTemplates(data.templates || [])
        } catch {
            // silent
        }
    }, [])

    const fetchIssued = useCallback(async () => {
        try {
            const res = await fetch('/api/documents?type=issued')
            const data = await res.json()
            setIssuedDocs(data.issued || [])
        } catch {
            // silent
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            await Promise.all([fetchTemplates(), fetchIssued()])
            setLoading(false)
        }
        load()
    }, [fetchTemplates, fetchIssued])

    // ── Delete ──
    const handleDelete = async (id: string) => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Delete failed')
            }
            await fetchTemplates()
            setDeleteConfirm(null)
            setToast({ message: 'Template delete ho gaya', type: 'success' })
        } catch (e: any) {
            setToast({ message: e.message || 'Delete nahi ho saka', type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    // ── After Generate ──
    const handleGenerated = useCallback((
        content: string,
        serialNo: string,
        studentName: string,
        issuedDocId: string  // ✅ NEW param
    ) => {
        setGenerateModal({ open: false, template: null })
        setPreviewModal({ open: true, content, serialNo, studentName, issuedDocId })
        setToast({ message: `${serialNo} successfully generate hua`, type: 'success' })
        fetchIssued()
    }, [fetchIssued])

    // ── After Create ──
    const handleCreated = useCallback(() => {
        setCreateModalOpen(false)
        fetchTemplates()
        setToast({ message: 'Template create ho gaya', type: 'success' })
    }, [fetchTemplates])

    // ✅ After PDF Saved
    const handleSaved = useCallback(() => {
        fetchIssued()
    }, [fetchIssued])

    // ── Doc type badge color ──
    const getTypeBadge = (type: string) => {
        const colorMap: Record<string, { bg: string; color: string }> = {
            tc: { bg: 'var(--info-light)', color: 'var(--info-dark)' },
            cc: { bg: 'var(--success-light)', color: 'var(--success-dark)' },
            bonafide: { bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
            custom: { bg: 'var(--primary-50)', color: 'var(--primary-700)' },
        }
        return colorMap[type] || { bg: 'var(--bg-muted)', color: 'var(--text-muted)' }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <svg className="animate-spin w-8 h-8 mx-auto mb-3" style={{ color: 'var(--primary-500)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* ── Page Header ── */}
            <div className="portal-page-header">
                <div>
                    <h1 className="portal-page-title">Documents</h1>
                    <p className="portal-page-subtitle">
                        {institutionType === 'school'
                            ? 'TC, CC, Bonafide aur custom documents manage karo'
                            : 'Course completion, enrollment aur custom documents manage karo'}
                    </p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="btn-primary btn-sm"
                >
                    <Plus size={15} />
                    New Template
                </button>
            </div>

            {/* ── Stats ── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                }}
            >
                {[
                    {
                        label: 'Total Templates',
                        value: templates.length,
                        icon: <FileText size={18} />,
                        color: 'var(--primary-500)',
                        bg: 'var(--primary-50)',
                    },
                    {
                        label: 'Documents Issued',
                        value: issuedDocs.length,
                        icon: <Award size={18} />,
                        color: 'var(--success)',
                        bg: 'var(--success-light)',
                    },
                    {
                        label: 'Saved to Storage',
                        value: issuedDocs.filter(d => d.savedToStorage).length,
                        icon: <HardDrive size={18} />,
                        color: 'var(--info)',
                        bg: 'var(--info-light)',
                    },
                    {
                        label: 'This Month',
                        value: issuedDocs.filter(d => {
                            const now = new Date()
                            const created = new Date(d.createdAt)
                            return created.getMonth() === now.getMonth() &&
                                created.getFullYear() === now.getFullYear()
                        }).length,
                        icon: <Clock size={18} />,
                        color: 'var(--warning)',
                        bg: 'var(--warning-light)',
                    },
                ].map(stat => (
                    <div key={stat.label} className="portal-stat-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                            <div
                                className="stat-icon"
                                style={{ background: stat.bg, color: stat.color }}
                            >
                                {stat.icon}
                            </div>
                            <div>
                                <p className="stat-value">{stat.value}</p>
                                <p className="stat-label">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.25rem',
                    padding: '0.25rem',
                    background: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    width: 'fit-content',
                }}
            >
                {(['templates', 'issued'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                            transition: 'all 0.15s',
                            background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === tab ? 'var(--primary-600)' : 'var(--text-muted)',
                            boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        {tab === 'templates' ? `Templates (${templates.length})` : `Issued (${issuedDocs.length})`}
                    </button>
                ))}
            </div>

            {/* ── TEMPLATES TAB ── (same as before, copy from previous implementation) */}
            {activeTab === 'templates' && (
                <>
                    {templates.length === 0 ? (
                        <div className="portal-card">
                            <div className="portal-empty">
                                <div className="portal-empty-icon">
                                    <FileCheck size={24} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <p className="portal-empty-title">Koi template nahi hai</p>
                                <p className="portal-empty-text">
                                    {institutionType === 'school'
                                        ? 'TC, CC ya Bonafide certificate template banao'
                                        : 'Course completion ya enrollment certificate template banao'}
                                </p>
                                <div style={{ marginTop: '1.25rem' }}>
                                    <button
                                        onClick={() => setCreateModalOpen(true)}
                                        className="btn-primary btn-sm"
                                    >
                                        <Plus size={14} />
                                        Create Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '1rem',
                            }}
                        >
                            {templates.map(t => {
                                const badge = getTypeBadge(t.type)
                                return (
                                    <div
                                        key={t._id}
                                        className="portal-card"
                                        style={{ transition: 'all 0.2s' }}
                                    >
                                        {/* Card top accent */}
                                        <div
                                            style={{
                                                height: 3,
                                                background: TYPE_COLORS[t.type] || 'var(--primary-500)',
                                                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                                                margin: '-1px -1px 0',
                                            }}
                                        />

                                        <div className="portal-card-body">
                                            {/* Header */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                            background: badge.bg,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <FileCheck size={16} style={{ color: badge.color }} />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {t.name}
                                                        </p>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                padding: '1px 8px',
                                                                borderRadius: 'var(--radius-full)',
                                                                background: badge.bg,
                                                                color: badge.color,
                                                                border: `1px solid ${badge.color}30`,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {typeLabels[t.type] || t.type.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content preview */}
                                            <p
                                                style={{
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--text-muted)',
                                                    lineHeight: 1.6,
                                                    marginBottom: '0.875rem',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {t.content}
                                            </p>

                                            {/* Variables */}
                                            {t.variables && t.variables.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
                                                    {t.variables.slice(0, 5).map(v => (
                                                        <span
                                                            key={v}
                                                            style={{
                                                                fontSize: '0.625rem',
                                                                background: 'var(--bg-muted)',
                                                                color: 'var(--text-muted)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 'var(--radius-full)',
                                                                padding: '1px 6px',
                                                                fontFamily: 'var(--font-mono)',
                                                            }}
                                                        >
                                                            {`{{${v}}}`}
                                                        </span>
                                                    ))}
                                                    {t.variables.length > 5 && (
                                                        <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', padding: '1px 4px' }}>
                                                            +{t.variables.length - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Created date */}
                                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-light)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <Clock size={11} />
                                                {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setGenerateModal({ open: true, template: t })}
                                                    className="btn-primary btn-sm"
                                                    style={{ flex: 1, justifyContent: 'center' }}
                                                >
                                                    <FileText size={13} />
                                                    Generate
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(t._id)}
                                                    style={{
                                                        width: 34, height: 34,
                                                        borderRadius: 'var(--radius-md)',
                                                        background: 'var(--danger-light)',
                                                        border: '1px solid rgba(239,68,68,0.2)',
                                                        color: 'var(--danger)',
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                    title="Delete"
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

            {/* ── ISSUED TAB ── */}
            {activeTab === 'issued' && (
                <>
                    {issuedDocs.length === 0 ? (
                        <div className="portal-card">
                            <div className="portal-empty">
                                <div className="portal-empty-icon">
                                    <Award size={24} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <p className="portal-empty-title">Koi document issue nahi hua</p>
                                <p className="portal-empty-text">
                                    Templates se documents generate karo
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="portal-card">
                            <div className="table-wrapper">
                                <table className="portal-table">
                                    <thead>
                                        <tr>
                                            <th>Serial No</th>
                                            <th>Student</th>
                                            <th>Document Type</th>
                                            <th>Issued By</th>
                                            <th>Date</th>
                                            <th>Storage</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issuedDocs.map(doc => {
                                            const badge = getTypeBadge(doc.documentType)
                                            return (
                                                <tr key={doc._id}>
                                                    <td>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-600)' }}>
                                                            <Hash size={12} />
                                                            {doc.serialNo}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                {doc.studentName}
                                                            </p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {doc.studentAdmissionNo}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: '0.75rem', fontWeight: 600,
                                                            padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                                            background: badge.bg, color: badge.color,
                                                        }}>
                                                            {typeLabels[doc.documentType] || doc.documentType.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                        {doc.issuedByName}
                                                    </td>
                                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'short', year: 'numeric',
                                                        })}
                                                    </td>
                                                    <td>
                                                        {doc.savedToStorage ? (
                                                            <span
                                                                className="status-pill status-active"
                                                                style={{ fontSize: '0.6875rem' }}
                                                            >
                                                                Saved
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="status-pill status-inactive"
                                                                style={{ fontSize: '0.6875rem' }}
                                                            >
                                                                Not Saved
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={doc.status === 'issued' ? 'status-pill status-active' : 'status-pill status-inactive'}
                                                        >
                                                            {doc.status === 'issued' ? 'Issued' : 'Revoked'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {doc.savedToStorage && doc.pdfUrl && (
                                                            <a
                                                                href={doc.pdfUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn-secondary btn-sm"
                                                                style={{ gap: '0.375rem', textDecoration: 'none' }}
                                                            >
                                                                <Download size={13} />
                                                                Download
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Delete Confirm Modal ── (same as before, copy from previous) */}
            {deleteConfirm && (
                <Portal>
                    <div
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1002,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '1rem',
                            background: 'rgba(30,27,75,0.5)',
                            backdropFilter: 'blur(4px)',
                        }}
                        onClick={e => e.target === e.currentTarget && !deleting && setDeleteConfirm(null)}
                    >
                        <div
                            style={{
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-xl)',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-modal)',
                                width: '100%', maxWidth: 380,
                                padding: '1.5rem',
                                animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: 52, height: 52,
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--danger-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1rem',
                                }}
                            >
                                <Trash2 size={22} style={{ color: 'var(--danger)' }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem', fontFamily: 'var(--font-display)' }}>
                                Template Delete Karo?
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
                                Ye template permanently delete ho jayega. Issued documents pe koi asar nahi padega.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="btn-ghost btn-sm"
                                    style={{ flex: 1 }}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="btn-danger-solid btn-sm"
                                    style={{ flex: 1 }}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* ── Modals ── */}
            <CreateTemplateModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreated={handleCreated}
                institutionType={institutionType}
            />

            <GenerateModal
                open={generateModal.open}
                template={generateModal.template}
                onClose={() => setGenerateModal({ open: false, template: null })}
                onGenerated={handleGenerated}
            />

            <DocumentPreviewModal
                open={previewModal.open}
                content={previewModal.content}
                serialNo={previewModal.serialNo}
                studentName={previewModal.studentName}
                schoolName={schoolName}
                issuedDocId={previewModal.issuedDocId}
                onClose={() => setPreviewModal({ open: false, content: '', serialNo: '', studentName: '', issuedDocId: '' })}
                onSaved={handleSaved}
            />

            {/* ── Toast ── */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}