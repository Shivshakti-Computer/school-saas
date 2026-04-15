// FILE: src/app/(dashboard)/admin/students/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users, Search, Upload, Plus, Filter,
  ChevronLeft, ChevronRight, Eye, Edit2,
  TrendingUp, Download, RefreshCw, X,
  UserCheck, AlertCircle, GraduationCap,
  Phone, MapPin, Calendar, Hash, BookOpen,
  CheckSquare, Printer, MoreVertical, Shield,
  Sparkles, IndianRupee, Info,
  CheckIcon,
} from 'lucide-react'
import { Spinner, Alert } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import { INDIA_STATES, STATE_CITIES } from '@/lib/india-locations'

/* ═══ Types ═══ */
interface Student {
  _id: string
  admissionNo: string
  rollNo: string
  class: string
  section: string
  stream?: string
  academicYear: string
  fatherName: string
  motherName?: string
  parentPhone: string
  status: 'active' | 'inactive' | 'transferred' | 'graduated'
  gender: string
  bloodGroup?: string
  category?: string
  dateOfBirth?: string
  address?: string
  userId: { name: string; phone: string; email?: string }
}

interface FeeStructure {
  _id: string
  name: string
  class: string
  section: string
  academicYear: string
  term: string
  totalAmount: number
  dueDate: string
  items: Array<{ label: string; amount: number; isOptional: boolean }>
}

interface FiltersState {
  search: string
  class: string
  section: string
  status: string
  academicYear: string
  gender: string
  category: string
  stream: string
}

interface OptionalFeeItem {
  _id: string
  structureId: string
  name: string
  amount: number
  dueDate: string
}

interface NewStudentData {
  studentId: string
  admissionNo: string
  rollNo: string
  name: string
  optionalFees: OptionalFeeItem[]
}

/* ═══ Constants ═══ */
const CLASSES  = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12']
const SECTIONS = ['A','B','C','D','E']
const GENDERS  = ['male','female','other']
const CATEGORIES = ['general','obc','sc','st','other']
const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']

const STREAMS = [
  {
    value: 'science',
    label: 'Science',
    color: 'var(--color-info-600)',
    bg: 'var(--color-info-50)',
    subjects: ['Physics','Chemistry','Mathematics','Biology','Computer Science','English'],
  },
  {
    value: 'commerce',
    label: 'Commerce',
    color: 'var(--color-success-600)',
    bg: 'var(--color-success-50)',
    subjects: ['Accountancy','Business Studies','Economics','Mathematics','English'],
  },
  {
    value: 'arts',
    label: 'Arts / Humanities',
    color: 'var(--color-violet-600)',
    bg: 'var(--color-violet-50)',
    subjects: ['History','Geography','Political Science','Economics','Sociology','English'],
  },
  {
    value: 'vocational',
    label: 'Vocational',
    color: 'var(--color-warning-600)',
    bg: 'var(--color-warning-50)',
    subjects: ['Vocational Trade','Computer Applications','English'],
  },
]

/* ── Helpers ── */
function getAcademicYears(): string[] {
  const years: string[] = []
  const now = new Date()
  const yr  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  for (let y = yr + 1; y >= yr - 3; y--) {
    years.push(`${y}-${String(y + 1).slice(-2)}`)
  }
  return years
}

function getCurrentAcademicYear(): string {
  const now = new Date()
  const yr  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${yr}-${String(yr + 1).slice(-2)}`
}

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    active:      {
      bg: 'var(--color-success-50)',
      color: 'var(--color-success-700)',
      dot: 'var(--color-success-500)',
      label: 'Active',
    },
    inactive:    {
      bg: 'var(--color-surface-100)',
      color: 'var(--text-muted)',
      dot: 'var(--text-muted)',
      label: 'Inactive',
    },
    transferred: {
      bg: 'var(--color-warning-50)',
      color: 'var(--color-warning-700)',
      dot: 'var(--color-warning-500)',
      label: 'Transferred',
    },
    graduated:   {
      bg: 'var(--color-info-50)',
      color: 'var(--color-info-700)',
      dot: 'var(--color-info-500)',
      label: 'Graduated',
    },
  }
  const c = cfg[status] ?? cfg.inactive
  return (
    <span
      className="badge"
      style={{
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid transparent`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: c.dot }}
      />
      {c.label}
    </span>
  )
}

/* ── Gender Badge ── */
function GenderBadge({ gender }: { gender: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    male:   {
      bg: 'var(--color-info-50)',
      color: 'var(--color-info-700)',
    },
    female: {
      bg: 'var(--color-violet-50)',
      color: 'var(--color-violet-700)',
    },
    other:  {
      bg: 'var(--color-surface-100)',
      color: 'var(--text-secondary)',
    },
  }
  const c = cfg[gender] ?? cfg.other
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-2xs font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {gender}
    </span>
  )
}

/* ── Stream Badge ── */
function StreamBadge({ stream }: { stream?: string }) {
  if (!stream) return null
  const cfg = STREAMS.find(s => s.value === stream)
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Sparkles size={9} />
      {cfg.label}
    </span>
  )
}

/* ═══════════════════════════════════════════
   REUSABLE FORM COMPONENTS
   ═══════════════════════════════════════════ */
const FormInput = ({
  label, value, onChange, type = 'text',
  required = false, placeholder = '', helper,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  helper?: string
}) => (
  <div className="flex flex-col gap-1">
    <label className="input-label">
      {label}
      {required && <span style={{ color: 'var(--color-danger-500)' }}> *</span>}
    </label>
    <input
      type={type}
      className="input-clean"
      placeholder={placeholder}
      value={value}
      required={required}
      onChange={e => onChange(e.target.value)}
    />
    {helper && (
      <p className="input-hint">{helper}</p>
    )}
  </div>
)

const FormSelect = ({
  label, value, onChange, options, required = false, helper,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  helper?: string
}) => (
  <div className="flex flex-col gap-1">
    <label className="input-label">
      {label}
      {required && <span style={{ color: 'var(--color-danger-500)' }}> *</span>}
    </label>
    <select
      className="input-clean"
      value={value}
      required={required}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {helper && (
      <p className="input-hint">{helper}</p>
    )}
  </div>
)

/* ═══════════════════════════════════════════
   FEE PREVIEW CARD
   ═══════════════════════════════════════════ */
function FeePreviewCard({
  selectedClass,
  selectedSection,
  academicYear,
}: {
  selectedClass: string
  selectedSection: string
  academicYear: string
}) {
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading]       = useState(false)
  const [fetched, setFetched]       = useState(false)

  useEffect(() => {
    if (!selectedClass) {
      setStructures([])
      setFetched(false)
      return
    }
    setLoading(true)
    setFetched(false)

    const params = new URLSearchParams()
    params.set('class', selectedClass)
    params.set('year', academicYear)

    fetch(`/api/fees/structure?${params}`)
      .then(r => r.json())
      .then(data => {
        const matched = (data.structures ?? []).filter((s: FeeStructure) => {
          const classMatch   = s.class === 'all' || s.class === selectedClass
          const sectionMatch = !s.section || s.section === 'all' || s.section === selectedSection
          return classMatch && sectionMatch
        })
        setStructures(matched)
        setFetched(true)
      })
      .catch(() => setFetched(true))
      .finally(() => setLoading(false))
  }, [selectedClass, selectedSection, academicYear])

  if (!selectedClass) return null

  const totalFee = structures.reduce((sum, s) => sum + s.totalAmount, 0)

  return (
    <div
      className="col-span-2 rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--color-info-200)',
        backgroundColor: 'var(--color-info-50)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{
          backgroundColor: 'var(--color-info-100)',
          borderBottom: '1px solid var(--color-info-200)',
        }}
      >
        <IndianRupee size={13} style={{ color: 'var(--color-info-600)' }} />
        <span className="text-xs font-bold" style={{ color: 'var(--color-info-700)' }}>
          Auto-detected Fee Structure
        </span>
        <span className="text-2xs ml-auto" style={{ color: 'var(--color-info-500)' }}>
          Class {selectedClass}
          {selectedSection ? `-${selectedSection}` : ''} · {academicYear}
        </span>
      </div>

      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs" style={{ color: 'var(--color-info-500)' }}>
              Detecting fee structure...
            </span>
          </div>
        ) : !fetched ? null : structures.length === 0 ? (
          <div className="flex items-start gap-2">
            <Info size={13} style={{ color: 'var(--color-info-400)', marginTop: 1 }} />
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-info-700)' }}>
                No fee structure found
              </p>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--color-info-500)' }}>
                Class {selectedClass} ke liye koi fee structure nahi bana hai.
                Student add hoga but fee baad mein assign karni padegi.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {structures.map(s => {
              const mandatoryItems = s.items.filter(i => !i.isOptional)
              const optionalItems  = s.items.filter(i => i.isOptional)
              const mandatoryAmt   = mandatoryItems.reduce((sum, i) => sum + i.amount, 0)

              return (
                <div
                  key={s._id}
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--color-info-200)' }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-info-800)' }}>
                        {s.name}
                      </p>
                      <p className="text-2xs" style={{ color: 'var(--color-info-500)' }}>
                        {s.term} · Due:{' '}
                        {new Date(s.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold tabular-nums"
                        style={{ color: 'var(--color-info-700)' }}
                      >
                        ₹{mandatoryAmt.toLocaleString('en-IN')}
                      </p>
                      <p className="text-2xs" style={{ color: 'var(--color-info-400)' }}>
                        {mandatoryItems.length} mandatory item
                        {mandatoryItems.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {optionalItems.length > 0 && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5"
                      style={{
                        backgroundColor: 'var(--color-warning-50)',
                        borderTop: '1px solid var(--color-warning-200)',
                      }}
                    >
                      <Info size={10} style={{ color: 'var(--color-warning-600)', flexShrink: 0 }} />
                      <p className="text-2xs" style={{ color: 'var(--color-warning-700)' }}>
                        {optionalItems.length} optional fee
                        {optionalItems.length > 1 ? 's' : ''}{' '}
                        ({optionalItems.map(i => i.label).join(', ')}) —
                        manually assign karni padegi
                      </p>
                    </div>
                  )}
                </div>
              )
            })}

            {structures.length > 1 && (
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-info-600)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--color-info-100)' }}>
                  Total Annual Fee
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: '#ffffff' }}>
                  ₹{totalFee.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <p className="text-2xs flex items-center gap-1" style={{ color: 'var(--color-info-500)' }}>
              <CheckSquare size={9} />
              Yeh fees student add hote hi automatically assign ho jayengi
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function StudentsPage() {
  const [students,    setStudents]    = useState<Student[]>([])
  const [total,       setTotal]       = useState(0)
  const [pages,       setPages]       = useState(1)
  const [page,        setPage]        = useState(1)
  const [loading,     setLoading]     = useState(true)
  const [alert,       setAlert]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Modals
  const [showAdd,              setShowAdd]              = useState(false)
  const [showView,             setShowView]             = useState(false)
  const [showEdit,             setShowEdit]             = useState(false)
  const [showPromote,          setShowPromote]          = useState(false)
  const [selectedStudent,      setSelectedStudent]      = useState<Student | null>(null)
  const [selectedIds,          setSelectedIds]          = useState<string[]>([])
  const [showOptionalFeeModal, setShowOptionalFeeModal] = useState(false)
  const [newlyCreatedStudent,  setNewlyCreatedStudent]  = useState<NewStudentData | null>(null)
  const [selectedOptionalFees, setSelectedOptionalFees] = useState<string[]>([])

  // Filters
  const [filters, setFilters] = useState<FiltersState>({
    search: '', class: '', section: '',
    status: 'active', academicYear: getCurrentAcademicYear(),
    gender: '', category: '', stream: '',
  })
  const [showFilters,  setShowFilters]  = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Fetch Students ── */
  const fetchStudents = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search)       params.set('search',       filters.search)
      if (filters.class)        params.set('class',        filters.class)
      if (filters.section)      params.set('section',      filters.section)
      if (filters.status)       params.set('status',       filters.status)
      if (filters.academicYear) params.set('academicYear', filters.academicYear)
      if (filters.gender)       params.set('gender',       filters.gender)
      if (filters.category)     params.set('category',     filters.category)
      if (filters.stream)       params.set('stream',       filters.stream)
      params.set('page',  String(pg))
      params.set('limit', '20')

      const res  = await fetch(`/api/students?${params}`)
      const data = await res.json()

      setStudents(data.students ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages  ?? 1)
      setPage(pg)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchStudents(1), 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [fetchStudents])

  useEffect(() => {
    if (window.location.search.includes('action=add')) setShowAdd(true)
  }, [])

  const setFilter = (key: keyof FiltersState, val: string) =>
    setFilters(f => ({ ...f, [key]: val }))

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) setSelectedIds([])
    else setSelectedIds(students.map(s => s._id))
  }
  const toggleSelect = (id: string) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const activeFilters = [
    filters.class, filters.section, filters.gender,
    filters.category, filters.stream,
  ].filter(Boolean).length

  const showSuccess = (msg: string) => {
    setAlert({ type: 'success', msg })
    setTimeout(() => setAlert(null), 4000)
  }
  const showError = (msg: string) => setAlert({ type: 'error', msg })

  return (
    <div className="space-y-5 pb-8 portal-content-enter">

      {/* ═══ PAGE HEADER ═══ */}
      <div className="portal-page-header">
        <div>
          <div className="portal-breadcrumb mb-1.5">
            <span>Dashboard</span>
            <ChevronRight size={12} className="bc-sep" />
            <span className="bc-current">Students</span>
          </div>
          <h1 className="portal-page-title">Student Management</h1>
          <p className="portal-page-subtitle">
            {total} students · {filters.academicYear} session
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Promote Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowPromote(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-warning-50)',
                color: 'var(--color-warning-700)',
                border: '1px solid var(--color-warning-300)',
              }}
            >
              <TrendingUp size={14} />
              Promote ({selectedIds.length})
            </button>
          )}

          {/* Download Template */}
          <button
            onClick={() => {
              const year = filters.academicYear || getCurrentAcademicYear()
              window.location.href =
                `/api/students/bulk-import/template?academicYear=${encodeURIComponent(year)}`
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-info-50)',
              color: 'var(--color-info-700)',
              border: '1px solid var(--color-info-200)',
            }}
            title={`Template for ${filters.academicYear || getCurrentAcademicYear()}`}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hidden sm:inline">Template</span>
            <span
              className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-bold"
              style={{
                backgroundColor: 'var(--color-info-100)',
                color: 'var(--color-info-800)',
              }}
            >
              {filters.academicYear || getCurrentAcademicYear()}
            </span>
          </button>

          {/* Import Excel */}
          <label
            htmlFor="excel-upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Import Excel</span>
          </label>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              showSuccess('Importing...')
              const fd = new FormData()
              fd.append('file', file)
              fd.append('academicYear', filters.academicYear || getCurrentAcademicYear())
              try {
                const res  = await fetch('/api/students/bulk-import', { method: 'POST', body: fd })
                const data = await res.json()
                if (!res.ok) {
                  showError(data.error || 'Import failed')
                  e.target.value = ''
                  return
                }
                if (data.success > 0) {
                  showSuccess(
                    `${data.success} students imported for ${data.academicYear}` +
                    (data.failed > 0 ? ` · ${data.failed} failed` : '')
                  )
                }
                if (data.failed > 0 && data.errors?.length > 0) {
                  console.group(`[Bulk Import] ${data.failed} rows failed`)
                  data.errors.forEach((err: {
                    row: number; name: string; field: string; message: string
                  }) => {
                    console.warn(`Row ${err.row} (${err.name}) | ${err.field}: ${err.message}`)
                  })
                  console.groupEnd()
                  const preview    = data.errors.slice(0, 3)
                  const moreCount  = data.errors.length - 3
                  const errorLines = preview
                    .map((err: { row: number; name: string; field: string; message: string }) =>
                      `Row ${err.row} (${err.name}): [${err.field}] ${err.message}`
                    )
                    .join('\n')
                  const fullMsg = data.success > 0
                    ? `⚠️ ${data.failed} rows failed:\n${errorLines}` +
                      (moreCount > 0 ? `\n...aur ${moreCount} errors (console mein dekho)` : '')
                    : `❌ Import failed:\n${errorLines}` +
                      (moreCount > 0 ? `\n...aur ${moreCount} errors (console mein dekho)` : '')
                  if (data.success > 0) {
                    setTimeout(() => showError(fullMsg), 1000)
                  } else {
                    showError(fullMsg)
                  }
                }
                fetchStudents(1)
              } catch {
                showError('Network error — please try again')
              } finally {
                e.target.value = ''
              }
            }}
          />

          {/* Add Student */}
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Student
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
      )}

      {/* ═══ FILTERS ═══ */}
      <div className="portal-card">
        <div className="portal-card-body">
          <div className="flex flex-wrap gap-3">

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="portal-search">
                <Search size={14} className="search-icon" />
                <input
                  placeholder="Search name, admission no, phone..."
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                />
              </div>
            </div>

            {/* Class */}
            <select
              className="input-clean h-9 px-3 text-sm cursor-pointer"
              style={{ minWidth: '120px' }}
              value={filters.class}
              onChange={e => {
                setFilter('class', e.target.value)
                if (!['11', '12'].includes(e.target.value)) setFilter('stream', '')
              }}
            >
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>

            {/* Stream (11/12 only) */}
            {(filters.class === '11' || filters.class === '12') && (
              <select
                className="input-clean h-9 px-3 text-sm cursor-pointer"
                style={{
                  minWidth: '130px',
                  borderColor: 'var(--color-violet-400)',
                  color: 'var(--color-violet-600)',
                  backgroundColor: 'var(--color-violet-50)',
                }}
                value={filters.stream}
                onChange={e => setFilter('stream', e.target.value)}
              >
                <option value="">All Streams</option>
                {STREAMS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}

            {/* Section */}
            <select
              className="input-clean h-9 px-3 text-sm cursor-pointer"
              style={{ minWidth: '110px' }}
              value={filters.section}
              onChange={e => setFilter('section', e.target.value)}
            >
              <option value="">All Sections</option>
              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>

            {/* Academic Year */}
            <select
              className="input-clean h-9 px-3 text-sm cursor-pointer"
              style={{ minWidth: '120px' }}
              value={filters.academicYear}
              onChange={e => setFilter('academicYear', e.target.value)}
            >
              {getAcademicYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Status */}
            <select
              className="input-clean h-9 px-3 text-sm cursor-pointer"
              style={{ minWidth: '110px' }}
              value={filters.status}
              onChange={e => setFilter('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="graduated">Graduated</option>
            </select>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-icon relative h-9 w-auto px-3 gap-1.5 inline-flex items-center text-sm"
              style={{
                borderColor: showFilters ? 'var(--color-info-500)' : 'var(--border)',
                color: showFilters ? 'var(--color-info-600)' : 'var(--text-secondary)',
                backgroundColor: showFilters ? 'var(--color-info-50)' : 'transparent',
              }}
            >
              <Filter size={13} />
              More
              {activeFilters > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-2xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-info-600)',
                    color: '#fff',
                  }}
                >
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchStudents(page)}
              className="btn-icon h-9 w-9"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div
              className="flex flex-wrap gap-3 mt-3 pt-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <select
                className="input-clean h-9 px-3 text-sm cursor-pointer"
                style={{ minWidth: '110px' }}
                value={filters.gender}
                onChange={e => setFilter('gender', e.target.value)}
              >
                <option value="">All Genders</option>
                {GENDERS.map(g => (
                  <option key={g} value={g} className="capitalize">{g}</option>
                ))}
              </select>

              <select
                className="input-clean h-9 px-3 text-sm cursor-pointer"
                style={{ minWidth: '120px' }}
                value={filters.category}
                onChange={e => setFilter('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="uppercase">
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>

              {!filters.class && (
                <select
                  className="input-clean h-9 px-3 text-sm cursor-pointer"
                  style={{ minWidth: '130px' }}
                  value={filters.stream}
                  onChange={e => setFilter('stream', e.target.value)}
                >
                  <option value="">All Streams</option>
                  {STREAMS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => {
                  setFilters({
                    search: '', class: '', section: '',
                    status: 'active', academicYear: getCurrentAcademicYear(),
                    gender: '', category: '', stream: '',
                  })
                  setShowFilters(false)
                }}
                className="h-9 px-3 text-sm rounded-lg transition-colors"
                style={{
                  color: 'var(--color-danger-600)',
                  backgroundColor: 'var(--color-danger-50)',
                  border: '1px solid var(--color-danger-200)',
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="portal-card overflow-hidden">

        {/* Bulk Selection Bar */}
        {selectedIds.length > 0 && (
          <div
            className="px-4 py-2.5 flex items-center gap-3 text-sm"
            style={{
              backgroundColor: 'var(--color-info-50)',
              borderBottom: '1px solid var(--color-info-200)',
            }}
          >
            <CheckSquare size={15} style={{ color: 'var(--color-info-600)' }} />
            <span style={{ color: 'var(--color-info-700)', fontWeight: 600 }}>
              {selectedIds.length} students selected
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setShowPromote(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-warning-600)',
                color: '#fff',
              }}
            >
              <TrendingUp size={12} /> Promote Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="btn-icon w-6 h-6"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading students...
            </p>
          </div>

        /* Empty */
        ) : students.length === 0 ? (
          <div className="portal-empty py-20">
            <div className="portal-empty-icon"><Users size={24} /></div>
            <p className="portal-empty-title">No students found</p>
            <p className="portal-empty-text">
              {Object.values(filters).some(Boolean)
                ? 'Try adjusting your filters'
                : 'Add your first student to get started'}
            </p>
            {!Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setShowAdd(true)}
                className="btn-primary btn-sm mt-4 inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Add First Student
              </button>
            )}
          </div>

        /* Table */
        ) : (
          <div className="table-wrapper">
            <table className="portal-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.length === students.length && students.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Adm. No</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Roll No</th>
                  <th>Father</th>
                  <th>Contact</th>
                  <th>Gender</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr
                    key={s._id}
                    className="group"
                    style={{
                      backgroundColor: selectedIds.includes(s._id)
                        ? 'var(--color-info-50)'
                        : 'transparent',
                    }}
                  >
                    {/* Checkbox */}
                    <td>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.includes(s._id)}
                        onChange={() => toggleSelect(s._id)}
                      />
                    </td>

                    {/* Admission No */}
                    <td>
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: 'var(--color-info-600)' }}
                      >
                        {s.admissionNo}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: 'var(--color-primary-100)',
                            color: 'var(--color-primary-600)',
                          }}
                        >
                          {s.userId?.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {s.userId?.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {s.userId?.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td>
                      <div className="flex flex-col gap-1">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold w-fit"
                          style={{
                            backgroundColor: 'var(--color-primary-100)',
                            color: 'var(--color-primary-600)',
                          }}
                        >
                          {s.class}-{s.section}
                        </span>
                        {s.stream && <StreamBadge stream={s.stream} />}
                      </div>
                    </td>

                    {/* Roll No */}
                    <td>
                      <span
                        className="text-sm font-mono font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        #{s.rollNo}
                      </span>
                    </td>

                    {/* Father */}
                    <td>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {s.fatherName}
                      </p>
                      {s.motherName && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {s.motherName}
                        </p>
                      )}
                    </td>

                    {/* Contact */}
                    <td>
                      <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {s.parentPhone}
                      </span>
                    </td>

                    {/* Gender */}
                    <td>
                      <GenderBadge gender={s.gender} />
                    </td>

                    {/* Session */}
                    <td>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {s.academicYear}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={s.status} />
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        {/* View */}
                        <button
                          onClick={() => { setSelectedStudent(s); setShowView(true) }}
                          className="btn-icon w-7 h-7"
                          title="View Details"
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-info-50)'
                            e.currentTarget.style.color = 'var(--color-info-600)'
                            e.currentTarget.style.borderColor = 'var(--color-info-200)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'var(--text-muted)'
                            e.currentTarget.style.borderColor = 'var(--border)'
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => { setSelectedStudent(s); setShowEdit(true) }}
                          className="btn-icon w-7 h-7"
                          title="Edit"
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-success-50)'
                            e.currentTarget.style.color = 'var(--color-success-600)'
                            e.currentTarget.style.borderColor = 'var(--color-success-200)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'var(--text-muted)'
                            e.currentTarget.style.borderColor = 'var(--border)'
                          }}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Print ID */}
                        <button
                          onClick={() => window.open(`/api/pdf/idcard/${s._id}`, '_blank')}
                          className="btn-icon w-7 h-7"
                          title="Print ID Card"
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'var(--color-violet-50)'
                            e.currentTarget.style.color = 'var(--color-violet-600)'
                            e.currentTarget.style.borderColor = 'var(--color-violet-200)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = 'var(--text-muted)'
                            e.currentTarget.style.borderColor = 'var(--border)'
                          }}
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && !loading && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} students
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => fetchStudents(page - 1)}
                className="btn-icon w-8 h-8 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pages - 4)) + i
                return (
                  <button
                    key={p}
                    onClick={() => fetchStudents(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: p === page ? 'var(--color-info-600)' : 'transparent',
                      color: p === page ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${p === page ? 'var(--color-info-600)' : 'var(--border)'}`,
                    }}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                disabled={page === pages}
                onClick={() => fetchStudents(page + 1)}
                className="btn-icon w-8 h-8 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      <Portal>
        <AddStudentModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={(msg, data) => {
            setShowAdd(false)
            fetchStudents(1)
            if (data.optionalFees && data.optionalFees.length > 0) {
              setNewlyCreatedStudent(data)
              setSelectedOptionalFees([])
              setShowOptionalFeeModal(true)
            } else {
              showSuccess(msg)
            }
          }}
        />

        {selectedStudent && (
          <ViewStudentModal
            open={showView}
            student={selectedStudent}
            onClose={() => setShowView(false)}
            onEdit={() => { setShowView(false); setShowEdit(true) }}
            onIdCard={() => window.open(`/api/pdf/idcard/${selectedStudent._id}`, '_blank')}
          />
        )}

        {selectedStudent && (
          <EditStudentModal
            open={showEdit}
            student={selectedStudent}
            onClose={() => setShowEdit(false)}
            onSuccess={(msg) => {
              setShowEdit(false)
              fetchStudents(page)
              showSuccess(msg)
            }}
          />
        )}

        <PromoteModal
          open={showPromote}
          studentIds={selectedIds}
          onClose={() => setShowPromote(false)}
          onSuccess={(msg) => {
            setShowPromote(false)
            setSelectedIds([])
            fetchStudents(page)
            showSuccess(msg)
          }}
        />

        {/* Optional Fee Modal */}
        {showOptionalFeeModal && newlyCreatedStudent && (
          <div className="modal-backdrop">
            <div
              className="absolute inset-0"
              onClick={() => {
                setShowOptionalFeeModal(false)
                setNewlyCreatedStudent(null)
                setSelectedOptionalFees([])
                showSuccess('Student added successfully!')
              }}
            />
            <div className="modal-panel modal-sm relative">

              {/* Header */}
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Optional Fees Assign Karo</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {newlyCreatedStudent.name} · {newlyCreatedStudent.admissionNo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOptionalFeeModal(false)
                    setNewlyCreatedStudent(null)
                    setSelectedOptionalFees([])
                    showSuccess('Student added successfully!')
                  }}
                  className="modal-close"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="modal-body">
                {/* Info Banner */}
                <div
                  className="flex items-start gap-2 p-3 rounded-lg mb-4"
                  style={{
                    backgroundColor: 'var(--color-warning-50)',
                    border: '1px solid var(--color-warning-200)',
                  }}
                >
                  <Info size={13} style={{
                    color: 'var(--color-warning-600)',
                    flexShrink: 0, marginTop: 1,
                  }} />
                  <p className="text-xs" style={{ color: 'var(--color-warning-800)' }}>
                    Ye fees optional hain (Transport, Hostel, etc.)
                    Mandatory fees already assign ho gayi hain.
                    Jo chahiye wo select karo.
                  </p>
                </div>

                {/* Fee List */}
                <div className="space-y-2 max-h-64 overflow-y-auto portal-scrollbar">
                  {newlyCreatedStudent.optionalFees.map(fee => {
                    const isSelected = selectedOptionalFees.includes(fee._id)
                    return (
                      <label
                        key={fee._id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          border: `1.5px solid ${isSelected
                            ? 'var(--color-info-400)'
                            : 'var(--border)'}`,
                          backgroundColor: isSelected
                            ? 'var(--color-info-50)'
                            : 'var(--bg-card)',
                        }}
                      >
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedOptionalFees(prev =>
                              prev.includes(fee._id)
                                ? prev.filter(id => id !== fee._id)
                                : [...prev, fee._id]
                            )
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {fee.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ₹{fee.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        {isSelected && (
                          <span
                            className="text-2xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: 'var(--color-info-100)',
                              color: 'var(--color-info-800)',
                            }}
                          >
                            ✓ Selected
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>

                {/* Selected Total */}
                {selectedOptionalFees.length > 0 && (
                  <div
                    className="mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--color-info-50)',
                      border: '1px solid var(--color-info-200)',
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--color-info-700)' }}>
                      {selectedOptionalFees.length} fee(s) selected
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-info-700)' }}>
                      ₹{newlyCreatedStudent.optionalFees
                        .filter(f => selectedOptionalFees.includes(f._id))
                        .reduce((sum, f) => sum + f.amount, 0)
                        .toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                {/* Skip */}
                <button
                  className="btn-ghost btn-sm flex-1"
                  onClick={() => {
                    setShowOptionalFeeModal(false)
                    setNewlyCreatedStudent(null)
                    setSelectedOptionalFees([])
                    showSuccess('Student added successfully!')
                  }}
                >
                  Skip
                </button>

                {/* Assign */}
                <button
                  className="btn-primary btn-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedOptionalFees.length === 0}
                  onClick={async () => {
                    if (!newlyCreatedStudent || selectedOptionalFees.length === 0) return
                    try {
                      const feesToAssign = newlyCreatedStudent.optionalFees
                        .filter(f => selectedOptionalFees.includes(f._id))

                      const groupedByStructure = feesToAssign.reduce(
                        (acc, fee) => {
                          if (!acc[fee.structureId]) {
                            acc[fee.structureId] = {
                              structureId: fee.structureId,
                              dueDate: fee.dueDate,
                              items: [],
                            }
                          }
                          acc[fee.structureId].items.push({
                            label: fee.name,
                            amount: fee.amount,
                          })
                          return acc
                        },
                        {} as Record<string, {
                          structureId: string
                          dueDate: string
                          items: Array<{ label: string; amount: number }>
                        }>
                      )

                      const calls = Object.values(groupedByStructure).flatMap(
                        group => group.items.map(item =>
                          fetch('/api/fees/optional-assign', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              structureId: group.structureId,
                              studentIds:  [newlyCreatedStudent.studentId],
                              item,
                              dueDate:     group.dueDate,
                              academicYear: getCurrentAcademicYear(),
                            }),
                          }).then(r => r.json())
                        )
                      )

                      const results = await Promise.all(calls)
                      const failed  = results.filter(r => r.error)
                      if (failed.length > 0) throw new Error(failed[0].error)

                      const totalAssigned = results.reduce((sum, r) => sum + (r.assigned || 0), 0)
                      setShowOptionalFeeModal(false)
                      setNewlyCreatedStudent(null)
                      setSelectedOptionalFees([])
                      showSuccess(`Student added! ${totalAssigned} optional fee(s) assigned.`)
                    } catch (err: any) {
                      showError(err.message || 'Optional fees assign nahi hui')
                    }
                  }}
                >
                  Assign Selected ({selectedOptionalFees.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </Portal>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════
   STREAM SELECTOR
   ═══════════════════════════════════════════════════════════════ */
function StreamSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="col-span-2">
      <label className="input-label">
        Stream / Faculty{' '}
        <span style={{ color: 'var(--color-danger-500)' }}>*</span>
      </label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {STREAMS.map(s => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange(s.value)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{
              border: `2px solid ${value === s.value
                ? s.color
                : 'var(--border)'}`,
              backgroundColor: value === s.value
                ? s.bg
                : 'var(--bg-card)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                backgroundColor: value === s.value
                  ? s.color
                  : 'var(--color-surface-100)',
                color: value === s.value
                  ? '#ffffff'
                  : 'var(--text-muted)',
              }}
            >
              {s.label.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold"
                style={{
                  color: value === s.value
                    ? s.color
                    : 'var(--text-primary)',
                }}
              >
                {s.label}
              </p>
              <p
                className="text-2xs truncate mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {s.subjects.slice(0, 3).join(', ')}...
              </p>
            </div>
            {value === s.value && (
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: s.color }}
              >
                <span className="text-white text-2xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADDRESS STEP — State → City auto-populate
   Sirf existing fields (state, city, pincode, address)
   ═══════════════════════════════════════════════════════════════ */
function AddressStep({
  form,
  setField,
}: {
  form: any
  setField: (key: string, val: string) => void
}) {
  // Cities for selected state
  const cities = form.state ? (STATE_CITIES[form.state] ?? []) : []

  // Jab state change ho — city reset karo
  const handleStateChange = (val: string) => {
    setField('state', val)
    setField('city', '')   // reset city — same field, no new field added
  }

  return (
    <div className="grid grid-cols-2 gap-4">

      {/* Full Address — col-span-2 */}
      <div className="col-span-2">
        <FormInput
          label="Full Address"
          value={form.address}
          onChange={val => setField('address', val)}
          required
          placeholder="House No, Street, Village/Colony"
        />
      </div>

      {/* State — dropdown */}
      <div className="flex flex-col gap-1">
        <label className="input-label">State</label>
        <select
          className="input-clean"
          value={form.state}
          onChange={e => handleStateChange(e.target.value)}
        >
          <option value="">Select State</option>
          {INDIA_STATES.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* City — dropdown if state selected, else text input */}
      <div className="flex flex-col gap-1">
        <label className="input-label">City/Town</label>
        {cities.length > 0 ? (
          <select
            className="input-clean"
            value={form.city}
            onChange={e => setField('city', e.target.value)}
          >
            <option value="">Select City</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
            {/* "Other" option — user manually type kar sake */}
            <option value="__other__">Other (type below)</option>
          </select>
        ) : (
          <input
            className="input-clean"
            placeholder={form.state ? 'City/Town name' : 'Select state first'}
            value={form.city}
            onChange={e => setField('city', e.target.value)}
            disabled={!form.state}
          />
        )}
        {/* Agar "Other" select kiya ho to text input show karo */}
        {form.city === '__other__' && (
          <input
            className="input-clean mt-1"
            placeholder="City/Town name likho"
            onChange={e => setField('city', e.target.value)}
            autoFocus
          />
        )}
      </div>

      {/* Pincode */}
      <FormInput
        label="Pincode"
        value={form.pincode}
        onChange={val => setField('pincode', val)}
        placeholder="226001"
      />

      {/* Login Credentials Preview */}
      <div
        className="col-span-2 p-3 rounded-xl"
        style={{
          backgroundColor: 'var(--color-success-50)',
          border: '1px solid var(--color-success-200)',
        }}
      >
        <p
          className="text-xs font-semibold mb-2"
          style={{ color: 'var(--color-success-800)' }}
        >
          🔐 Login Credentials (auto-set honge)
        </p>

        {/* Student Login */}
        <div className="mb-2">
          <p
            className="text-2xs font-semibold uppercase mb-0.5"
            style={{ color: 'var(--color-success-700)' }}
          >
            Student Login
          </p>
          <p className="text-xs" style={{ color: 'var(--color-success-800)' }}>
            Username:{' '}
            <strong>
              {form.phone?.trim() ? form.phone : 'Admission No (auto)'}
            </strong>
            {' '}| Password:{' '}
            <strong>
              {form.dateOfBirth
                ? (() => {
                    const d  = new Date(form.dateOfBirth)
                    const dd = String(d.getDate()).padStart(2, '0')
                    const mm = String(d.getMonth() + 1).padStart(2, '0')
                    return `${dd}${mm}${d.getFullYear()}`
                  })()
                : 'DOB (DDMMYYYY)'}
            </strong>
          </p>
        </div>

        {/* Parent Login */}
        <div
          className="pt-2"
          style={{ borderTop: '1px solid var(--color-success-200)' }}
        >
          <p
            className="text-2xs font-semibold uppercase mb-0.5"
            style={{ color: 'var(--color-success-700)' }}
          >
            Parent Login
          </p>
          <p className="text-xs" style={{ color: 'var(--color-success-800)' }}>
            Username:{' '}
            <strong>{form.parentPhone || 'Parent Phone'}</strong>
            {' '}| Password:{' '}
            <strong>
              {form.dateOfBirth
                ? (() => {
                    const d  = new Date(form.dateOfBirth)
                    const dd = String(d.getDate()).padStart(2, '0')
                    const mm = String(d.getMonth() + 1).padStart(2, '0')
                    return `${dd}${mm}${d.getFullYear()}`
                  })()
                : 'DOB (DDMMYYYY)'}
            </strong>
          </p>
          <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Same parent ke 2 bachche hain to parent ka password
            pehle bachche ka DOB rahega
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADD STUDENT MODAL
   ═══════════════════════════════════════════════════════════════ */
function AddStudentModal({
  open, onClose, onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (msg: string, data: NewStudentData) => void
}) {
  const initForm = () => ({
    name: '', phone: '', email: '',
    class: '', section: 'A', stream: '',
    academicYear: getCurrentAcademicYear(),
    admissionDate: new Date().toISOString().split('T')[0],
    dateOfBirth: '', gender: 'male',
    bloodGroup: '', nationality: 'Indian',
    religion: '', category: 'general',
    fatherName: '', fatherOccupation: '', fatherPhone: '',
    motherName: '', motherOccupation: '', motherPhone: '',
    parentPhone: '', parentEmail: '',
    address: '', city: '', state: '', pincode: '',
    emergencyName: '', emergencyContact: '',
    previousSchool: '', previousClass: '', tcNumber: '',
  })

  const [form,    setForm]    = useState(initForm())
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [step,    setStep]    = useState(1)
  const totalSteps = 4

  const isHigherSecondary = ['11', '12'].includes(form.class)

  const setField = useCallback((key: string, val: string) => {
    setForm(prev => {
      const updated = { ...prev, [key]: val }
      if (key === 'class' && !['11', '12'].includes(val)) {
        updated.stream = ''
      }
      return updated
    })
  }, [])

  const reset = useCallback(() => {
    setForm(initForm())
    setStep(1)
    setError('')
  }, [])

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!form.name.trim()) {
        setError('Student ka naam required hai')
        return
      }
      if (!form.class) {
        setError('Class select karna zaroori hai')
        return
      }
      if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
        setError('Phone number 10 digits ka hona chahiye')
        return
      }
      if (isHigherSecondary && !form.stream) {
        setError('Class 11 & 12 ke liye Stream select karna zaroori hai')
        return
      }
    }
    if (step === 3) {
      if (!form.parentPhone.trim()) {
        setError('Parent/Guardian phone required hai')
        return
      }
      if (!/^\d{10}$/.test(form.parentPhone.trim())) {
        setError('Parent phone 10 digits ka hona chahiye')
        return
      }
      if (
        form.phone.trim() &&
        form.phone.trim() === form.parentPhone.trim()
      ) {
        setError('Student phone aur parent phone alag hone chahiye')
        return
      }
    }
    setError('')
    setStep(s => s + 1)
  }, [step, form, isHigherSecondary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        phone: form.phone.trim() || undefined,
      }
      const res  = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      reset()
      onSuccess(
        `✅ ${data.name} added! | Adm: ${data.admissionNo} | Roll: ${data.rollNo} | Password: ${data.loginInfo.student.password}`,
        data
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = useCallback(() => {
    onClose()
    reset()
  }, [onClose, reset])

  if (!open) return null

  const stepLabels = ['Academic', 'Personal', 'Family', 'Address']

  return (
    <div className="modal-backdrop">
      <div className="absolute inset-0" onClick={handleClose} />
      <div
        className="modal-panel relative"
        style={{ maxWidth: '42rem' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add New Student</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Step {step} of {totalSteps}
            </p>
          </div>
          <button onClick={handleClose} type="button" className="modal-close">
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-3 pb-0 flex-shrink-0">
          <div
            className="w-full h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-surface-100)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(step / totalSteps) * 100}%`,
                background: 'linear-gradient(90deg, var(--color-info-600), var(--color-violet-600))',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {stepLabels.map((s, i) => (
              <span
                key={s}
                className="text-2xs font-medium"
                style={{
                  color: step > i
                    ? 'var(--color-info-600)'
                    : 'var(--text-light)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto portal-scrollbar px-6 py-4">

            {/* ── Step 1: Academic ── */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Student Full Name"
                  value={form.name}
                  onChange={val => setField('name', val)}
                  required
                  placeholder="Rahul Kumar"
                />
                <div>
                  <FormInput
                    label="Student Phone (Optional)"
                    value={form.phone}
                    onChange={val => setField('phone', val)}
                    placeholder="Chote bachhe ke liye blank chhod sakte hain"
                  />
                  <p className="input-hint mt-1">
                    {form.phone.trim()
                      ? 'Login: Phone + Parent Phone'
                      : 'Login: Admission No + DOB (auto-set hoga)'}
                  </p>
                </div>
                <FormInput
                  label="Email (Optional)"
                  value={form.email}
                  onChange={val => setField('email', val)}
                  type="email"
                  placeholder="student@email.com"
                />
                <FormSelect
                  label="Academic Year"
                  value={form.academicYear}
                  onChange={val => setField('academicYear', val)}
                  required
                  options={getAcademicYears().map(y => ({ value: y, label: y }))}
                />
                <FormSelect
                  label="Class"
                  value={form.class}
                  onChange={val => setField('class', val)}
                  required
                  options={[
                    { value: '', label: 'Select Class' },
                    ...CLASSES.map(c => ({ value: c, label: `Class ${c}` })),
                  ]}
                />
                <FormSelect
                  label="Section"
                  value={form.section}
                  onChange={val => setField('section', val)}
                  required
                  options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))}
                />
                <FormInput
                  label="Admission Date"
                  value={form.admissionDate}
                  onChange={val => setField('admissionDate', val)}
                  type="date"
                  required
                />
                {isHigherSecondary && (
                  <StreamSelector
                    value={form.stream}
                    onChange={val => setField('stream', val)}
                  />
                )}
                {form.class && (
                  <FeePreviewCard
                    selectedClass={form.class}
                    selectedSection={form.section}
                    academicYear={form.academicYear}
                  />
                )}
              </div>
            )}

            {/* ── Step 2: Personal ── */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Date of Birth"
                  value={form.dateOfBirth}
                  onChange={val => setField('dateOfBirth', val)}
                  type="date"
                  required
                />
                <FormSelect
                  label="Gender"
                  value={form.gender}
                  onChange={val => setField('gender', val)}
                  required
                  options={[
                    { value: 'male',   label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other',  label: 'Other' },
                  ]}
                />
                <FormSelect
                  label="Blood Group"
                  value={form.bloodGroup}
                  onChange={val => setField('bloodGroup', val)}
                  options={[
                    { value: '', label: 'Not Known' },
                    ...BLOOD_GROUPS.map(b => ({ value: b, label: b })),
                  ]}
                />
                <FormSelect
                  label="Category"
                  value={form.category}
                  onChange={val => setField('category', val)}
                  options={CATEGORIES.map(c => ({
                    value: c, label: c.toUpperCase(),
                  }))}
                />
                <FormInput
                  label="Nationality"
                  value={form.nationality}
                  onChange={val => setField('nationality', val)}
                  placeholder="Indian"
                />
                <FormInput
                  label="Religion"
                  value={form.religion}
                  onChange={val => setField('religion', val)}
                  placeholder="Optional"
                />
                <FormInput
                  label="Previous School"
                  value={form.previousSchool}
                  onChange={val => setField('previousSchool', val)}
                  placeholder="School name"
                />
                <FormInput
                  label="Previous Class"
                  value={form.previousClass}
                  onChange={val => setField('previousClass', val)}
                  placeholder="e.g. Class 10"
                />
                <FormInput
                  label="TC Number"
                  value={form.tcNumber}
                  onChange={val => setField('tcNumber', val)}
                  placeholder="Transfer Certificate No."
                />
              </div>
            )}

            {/* ── Step 3: Family ── */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Father's Name"
                  value={form.fatherName}
                  onChange={val => setField('fatherName', val)}
                  required
                  placeholder="Ram Kumar"
                />
                <FormInput
                  label="Father's Phone"
                  value={form.fatherPhone}
                  onChange={val => setField('fatherPhone', val)}
                  placeholder="9888888888"
                />
                <FormInput
                  label="Father's Occupation"
                  value={form.fatherOccupation}
                  onChange={val => setField('fatherOccupation', val)}
                  placeholder="Farmer, Teacher, etc."
                />
                <div />
                <FormInput
                  label="Mother's Name"
                  value={form.motherName}
                  onChange={val => setField('motherName', val)}
                  placeholder="Sita Devi"
                />
                <FormInput
                  label="Mother's Phone"
                  value={form.motherPhone}
                  onChange={val => setField('motherPhone', val)}
                  placeholder="9777777777"
                />
                <FormInput
                  label="Mother's Occupation"
                  value={form.motherOccupation}
                  onChange={val => setField('motherOccupation', val)}
                  placeholder="Optional"
                />
                <div />
                <div>
                  <FormInput
                    label="Parent/Guardian Phone"
                    value={form.parentPhone}
                    onChange={val => setField('parentPhone', val)}
                    required
                    placeholder="Primary contact number"
                  />
                  <p className="input-hint mt-1">
                    {!form.phone.trim()
                      ? 'Is number se parent portal login hoga. Same parent ke 2 bachhe ho to same number use kar sakte hain.'
                      : 'Parent portal login + student ka default password'}
                  </p>
                </div>
                <FormInput
                  label="Parent Email"
                  value={form.parentEmail}
                  onChange={val => setField('parentEmail', val)}
                  type="email"
                  placeholder="parent@email.com"
                />
                <FormInput
                  label="Emergency Contact Name"
                  value={form.emergencyName}
                  onChange={val => setField('emergencyName', val)}
                  placeholder="Uncle/Relative name"
                />
                <FormInput
                  label="Emergency Contact No."
                  value={form.emergencyContact}
                  onChange={val => setField('emergencyContact', val)}
                  placeholder="9666666666"
                />
              </div>
            )}

            {/* ── Step 4: Address ── */}
            {step === 4 && (
              <AddressStep form={form} setField={setField} />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-2">
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-danger-50)',
                  color: 'var(--color-danger-600)',
                  border: '1px solid var(--color-danger-200)',
                }}
              >
                <AlertCircle size={15} />
                {error}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer justify-between">
            <button
              type="button"
              onClick={step > 1 ? () => setStep(s => s - 1) : handleClose}
              className="btn-ghost btn-sm inline-flex items-center gap-1.5"
            >
              {step > 1 ? <><ChevronLeft size={14} /> Back</> : 'Cancel'}
            </button>
            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary btn-sm inline-flex items-center gap-1.5"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {loading ? <Spinner size="sm" /> : <Plus size={14} />}
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   SECTION HELPER — ViewStudentModal ke liye
   ═══════════════════════════════════════════ */
function Section({
  title, icon, children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: 'var(--color-info-600)' }}>{icon}</span>
        <h4
          className="text-2xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
        </h4>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="divide-y px-4" style={{ borderColor: 'var(--bg-subtle)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   VIEW STUDENT MODAL
   ═══════════════════════════════════════════ */
function ViewStudentModal({
  open, student, onClose, onEdit, onIdCard,
}: {
  open: boolean
  student: Student
  onClose: () => void
  onEdit: () => void
  onIdCard: () => void
}) {
  const [fullData, setFullData] = useState<any>(null)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!open || !student._id) return
    setLoading(true)
    fetch(`/api/students/${student._id}`)
      .then(r => r.json())
      .then(d => setFullData(d.student))
      .finally(() => setLoading(false))
  }, [open, student._id])

  if (!open) return null
  const s          = fullData || student
  const streamInfo = STREAMS.find(st => st.value === s.stream)

  const Row = ({ label, value }: { label: string; value?: string }) => (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: '1px solid var(--bg-subtle)' }}
    >
      <span
        className="text-xs font-semibold w-32 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium flex-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {value || (
          <span style={{ color: 'var(--text-light)' }}>—</span>
        )}
      </span>
    </div>
  )

  return (
    <div className="modal-backdrop">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="modal-panel relative"
        style={{ maxWidth: '42rem' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-4 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-primary-600)',
              color: '#ffffff',
            }}
          >
            {s.userId?.name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-primary-950)' }}>
              {s.userId?.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--color-primary-200)',
                  color: 'var(--color-primary-800)',
                }}
              >
                {s.admissionNo}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-primary-600)' }}>
                Class {s.class}-{s.section} · Roll #{s.rollNo}
              </span>
              <StatusBadge status={s.status} />
              {s.stream && streamInfo && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: streamInfo.bg,
                    color: streamInfo.color,
                  }}
                >
                  <Sparkles size={9} />
                  {streamInfo.label}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onIdCard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: '#ffffff',
              }}
            >
              <Printer size={12} /> ID Card
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                color: 'var(--color-primary-600)',
                border: '1px solid var(--color-primary-200)',
              }}
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={onClose}
              className="modal-close"
              style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto portal-scrollbar px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-5">
              <Section title="Academic Information" icon={<GraduationCap size={14} />}>
                <Row label="Admission No"   value={s.admissionNo} />
                <Row label="Academic Year"  value={s.academicYear} />
                <Row label="Class & Section" value={`Class ${s.class} - Section ${s.section}`} />
                {s.stream && (
                  <Row label="Stream" value={streamInfo?.label} />
                )}
                <Row label="Roll Number"    value={`#${s.rollNo}`} />
                <Row
                  label="Admission Date"
                  value={s.admissionDate
                    ? new Date(s.admissionDate).toLocaleDateString('en-IN')
                    : ''}
                />
              </Section>

              <Section title="Personal Information" icon={<UserCheck size={14} />}>
                <Row
                  label="Date of Birth"
                  value={s.dateOfBirth
                    ? new Date(s.dateOfBirth).toLocaleDateString('en-IN')
                    : ''}
                />
                <Row label="Gender"      value={s.gender} />
                <Row label="Blood Group" value={s.bloodGroup || '—'} />
                <Row label="Category"    value={s.category?.toUpperCase()} />
                <Row label="Nationality" value={s.nationality} />
                <Row label="Religion"    value={s.religion} />
              </Section>

              <Section title="Family Information" icon={<Users size={14} />}>
                <Row label="Father's Name"       value={s.fatherName} />
                <Row label="Father's Phone"      value={s.fatherPhone} />
                <Row label="Father's Occupation" value={s.fatherOccupation} />
                <Row label="Mother's Name"       value={s.motherName} />
                <Row label="Mother's Phone"      value={s.motherPhone} />
                <Row label="Parent Phone"        value={s.parentPhone} />
                <Row label="Parent Email"        value={s.parentEmail} />
                <Row
                  label="Emergency Contact"
                  value={s.emergencyContact
                    ? `${s.emergencyName} — ${s.emergencyContact}`
                    : ''}
                />
              </Section>

              <Section title="Address" icon={<MapPin size={14} />}>
                <Row label="Address" value={s.address} />
                <Row label="City"    value={s.city} />
                <Row label="State"   value={s.state} />
                <Row label="Pincode" value={s.pincode} />
              </Section>

              {(s.previousSchool || s.tcNumber) && (
                <Section title="Previous School" icon={<BookOpen size={14} />}>
                  <Row label="School Name"    value={s.previousSchool} />
                  <Row label="Previous Class" value={s.previousClass} />
                  <Row label="TC Number"      value={s.tcNumber} />
                </Section>
              )}

              {s.sessionHistory?.length > 0 && (
                <Section title="Session History" icon={<Calendar size={14} />}>
                  <div className="space-y-2 mt-1 py-2">
                    {s.sessionHistory.map((h: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--bg-muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: 'var(--color-primary-100)',
                            color: 'var(--color-primary-600)',
                          }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {h.academicYear} — Class {h.class}-{h.section}
                          </span>
                          <span
                            className="text-xs ml-2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Roll #{h.rollNo}
                          </span>
                        </div>
                        {h.result && (
                          <span
                            className="text-2xs font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: h.result === 'promoted'
                                ? 'var(--color-success-50)'
                                : 'var(--color-danger-50)',
                              color: h.result === 'promoted'
                                ? 'var(--color-success-600)'
                                : 'var(--color-danger-600)',
                            }}
                          >
                            {h.result}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   FIELD COMPONENT — EditStudentModal ke liye
   ═══════════════════════════════════════════ */
const Field = ({
  label, field, type = 'text', options, form, onChange,
}: {
  label: string
  field: string
  type?: string
  options?: { value: string; label: string }[]
  form: any
  onChange: (k: string, v: string) => void
}) => (
  <div className="flex flex-col gap-1">
    <label className="input-label">{label}</label>
    {options ? (
      <select
        className="input-clean"
        value={form[field] || ''}
        onChange={e => onChange(field, e.target.value)}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        className="input-clean"
        value={form[field] || ''}
        onChange={e => onChange(field, e.target.value)}
      />
    )}
  </div>
)

/* ═══════════════════════════════════════════
   EDIT STUDENT MODAL
   ═══════════════════════════════════════════ */
function EditStudentModal({
  open, student, onClose, onSuccess,
}: {
  open: boolean
  student: Student
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [form,     setForm]     = useState<any>({})
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [fetching, setFetching] = useState(false)

  const isHigherSecondary = ['11', '12'].includes(form.class)

  // Cities for edit modal state dropdown
  const editCities = form.state ? (STATE_CITIES[form.state] ?? []) : []

  useEffect(() => {
    if (!open || !student._id) return
    setFetching(true)
    fetch(`/api/students/${student._id}`)
      .then(r => r.json())
      .then(d => {
        const s = d.student
        setForm({
          class:            s.class,
          section:          s.section,
          stream:           s.stream || '',
          fatherName:       s.fatherName,
          motherName:       s.motherName || '',
          fatherOccupation: s.fatherOccupation || '',
          fatherPhone:      s.fatherPhone || '',
          motherOccupation: s.motherOccupation || '',
          motherPhone:      s.motherPhone || '',
          parentPhone:      s.parentPhone,
          parentEmail:      s.parentEmail || '',
          address:          s.address,
          city:             s.city || '',
          state:            s.state || '',
          pincode:          s.pincode || '',
          bloodGroup:       s.bloodGroup || '',
          category:         s.category || 'general',
          emergencyName:    s.emergencyName || '',
          emergencyContact: s.emergencyContact || '',
          status:           s.status,
        })
      })
      .finally(() => setFetching(false))
  }, [open, student._id])

  const set = useCallback((k: string, v: string) => {
    setForm((f: any) => {
      const updated = { ...f, [k]: v }
      if (k === 'class' && !['11', '12'].includes(v)) {
        updated.stream = ''
      }
      // State change → city reset
      if (k === 'state') {
        updated.city = ''
      }
      return updated
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isHigherSecondary && !form.stream) {
      setError('Class 11/12 ke liye stream select karna zaroori hai')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch(`/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to update'); return }
      onSuccess('Student updated successfully!')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="modal-panel relative"
        style={{ maxWidth: '42rem' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Edit Student</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {student.admissionNo} · {student.userId?.name}
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={16} />
          </button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto portal-scrollbar px-6 py-4">
              <div className="space-y-5">

                {/* Academic */}
                <div>
                  <h4
                    className="text-2xs font-bold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Academic
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Class" field="class"
                      form={form} onChange={set}
                      options={[
                        { value: '', label: 'Select' },
                        ...CLASSES.map(c => ({ value: c, label: `Class ${c}` })),
                      ]}
                    />
                    <Field
                      label="Section" field="section"
                      form={form} onChange={set}
                      options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))}
                    />
                    {isHigherSecondary && (
                      <div className="col-span-2">
                        <StreamSelector
                          value={form.stream || ''}
                          onChange={val => set('stream', val)}
                        />
                      </div>
                    )}
                    <Field
                      label="Status" field="status"
                      form={form} onChange={set}
                      options={[
                        { value: 'active',      label: 'Active' },
                        { value: 'inactive',    label: 'Inactive' },
                        { value: 'transferred', label: 'Transferred' },
                        { value: 'graduated',   label: 'Graduated' },
                      ]}
                    />
                    <Field
                      label="Blood Group" field="bloodGroup"
                      form={form} onChange={set}
                      options={[
                        { value: '', label: 'Not Known' },
                        ...BLOOD_GROUPS.map(b => ({ value: b, label: b })),
                      ]}
                    />
                  </div>
                </div>

                {/* Family */}
                <div>
                  <h4
                    className="text-2xs font-bold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Family
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Father's Name"       field="fatherName"       form={form} onChange={set} />
                    <Field label="Father's Phone"      field="fatherPhone"      form={form} onChange={set} />
                    <Field label="Father's Occupation" field="fatherOccupation" form={form} onChange={set} />
                    <Field label="Mother's Name"       field="motherName"       form={form} onChange={set} />
                    <Field label="Parent Phone"        field="parentPhone"      form={form} onChange={set} />
                    <Field label="Parent Email"        field="parentEmail"      form={form} onChange={set} />
                    <Field label="Emergency Name"      field="emergencyName"    form={form} onChange={set} />
                    <Field label="Emergency Contact"   field="emergencyContact" form={form} onChange={set} />
                  </div>
                </div>

                {/* Address — State → City dropdown */}
                <div>
                  <h4
                    className="text-2xs font-bold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Address
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Field label="Full Address" field="address" form={form} onChange={set} />
                    </div>

                    {/* State dropdown */}
                    <div className="flex flex-col gap-1">
                      <label className="input-label">State</label>
                      <select
                        className="input-clean"
                        value={form.state || ''}
                        onChange={e => set('state', e.target.value)}
                      >
                        <option value="">Select State</option>
                        {INDIA_STATES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    {/* City — dynamic */}
                    <div className="flex flex-col gap-1">
                      <label className="input-label">City/Town</label>
                      {editCities.length > 0 ? (
                        <>
                          <select
                            className="input-clean"
                            value={
                              editCities.includes(form.city)
                                ? form.city
                                : form.city
                                  ? '__other__'
                                  : ''
                            }
                            onChange={e => {
                              if (e.target.value !== '__other__') {
                                set('city', e.target.value)
                              } else {
                                set('city', '')
                              }
                            }}
                          >
                            <option value="">Select City</option>
                            {editCities.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="__other__">Other</option>
                          </select>
                          {/* Show text input if city not in list */}
                          {form.city && !editCities.includes(form.city) && (
                            <input
                              className="input-clean mt-1"
                              placeholder="City/Town name"
                              value={form.city}
                              onChange={e => set('city', e.target.value)}
                            />
                          )}
                        </>
                      ) : (
                        <input
                          className="input-clean"
                          placeholder={form.state ? 'City/Town name' : 'Select state first'}
                          value={form.city || ''}
                          onChange={e => set('city', e.target.value)}
                          disabled={!form.state}
                        />
                      )}
                    </div>

                    <Field label="Pincode" field="pincode" form={form} onChange={set} />
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mx-6 mb-2 flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-danger-50)',
                  color: 'var(--color-danger-600)',
                  border: '1px solid var(--color-danger-200)',
                }}
              >
                <AlertCircle size={15} />{error}
              </div>
            )}

            {/* Footer */}
            <div className="modal-footer justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-sm inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {loading ? <Spinner size="sm" /> : null}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PROMOTE MODAL
   ═══════════════════════════════════════════ */
function PromoteModal({
  open, studentIds, onClose, onSuccess,
}: {
  open: boolean
  studentIds: string[]
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const nextYear = (() => {
    const current = getCurrentAcademicYear()
    const yr      = parseInt(current.split('-')[0])
    return `${yr + 1}-${String(yr + 2).slice(-2)}`
  })()

  const [form, setForm] = useState({
    toClass:       '',
    toSection:     'A',
    toAcademicYear: nextYear,
    result:        'promoted' as 'promoted' | 'detained',
    toStream:      '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const isHigherSecondary = ['11', '12'].includes(form.toClass)

  const handlePromote = async () => {
    if (!form.toClass || !form.toSection || !form.toAcademicYear) {
      setError('Please fill all fields')
      return
    }
    if (isHigherSecondary && !form.toStream) {
      setError('Class 11/12 ke liye stream select karo')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          studentIds,
          stream: isHigherSecondary ? form.toStream : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      onSuccess(
        `${data.promoted} students promoted to Class ${form.toClass}-${form.toSection} (${form.toAcademicYear})`
      )
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="modal-panel modal-sm relative">

        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-warning-50)' }}
            >
              <TrendingUp size={18} style={{ color: 'var(--color-warning-600)' }} />
            </div>
            <div>
              <h3 className="modal-title">Promote Students</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {studentIds.length} students selected
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-4">

          {/* Info Banner */}
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: 'var(--color-warning-50)',
              border: '1px solid var(--color-warning-200)',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--color-warning-800)' }}>
              ⚠️ Before promoting:
            </p>
            <ul
              className="text-xs mt-1 space-y-0.5"
              style={{ color: 'var(--color-warning-700)' }}
            >
              <li>• Session history will be saved automatically</li>
              <li>• New roll numbers will be assigned</li>
              <li>• New fee structures will be auto-assigned</li>
            </ul>
          </div>

          {/* Result Type */}
          <div className="grid grid-cols-2 gap-3">
            {(['promoted', 'detained'] as const).map(r => (
              <button
                key={r}
                onClick={() => set('result', r)}
                className="py-3 px-4 rounded-xl text-sm font-semibold transition-all capitalize"
                style={{
                  backgroundColor: form.result === r
                    ? (r === 'promoted'
                        ? 'var(--color-success-50)'
                        : 'var(--color-danger-50)')
                    : 'var(--bg-muted)',
                  color: form.result === r
                    ? (r === 'promoted'
                        ? 'var(--color-success-600)'
                        : 'var(--color-danger-600)')
                    : 'var(--text-muted)',
                  border: `2px solid ${form.result === r
                    ? (r === 'promoted'
                        ? 'var(--color-success-200)'
                        : 'var(--color-danger-200)')
                    : 'var(--border)'}`,
                }}
              >
                {r === 'promoted' ? '✓ Promoted' : '⚠ Detained'}
              </button>
            ))}
          </div>

          {/* Class & Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="input-label">
                {form.result === 'detained' ? 'Same Class' : 'Promote to Class'}
              </label>
              <select
                className="input-clean"
                value={form.toClass}
                onChange={e => {
                  set('toClass', e.target.value)
                  if (!['11', '12'].includes(e.target.value)) set('toStream', '')
                }}
              >
                <option value="">Select Class</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="input-label">Section</label>
              <select
                className="input-clean"
                value={form.toSection}
                onChange={e => set('toSection', e.target.value)}
              >
                {SECTIONS.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stream (11/12 only) */}
          {isHigherSecondary && (
            <StreamSelector
              value={form.toStream}
              onChange={val => set('toStream', val)}
            />
          )}

          {/* Academic Year */}
          <div className="flex flex-col gap-1">
            <label className="input-label">New Academic Year</label>
            <select
              className="input-clean"
              value={form.toAcademicYear}
              onChange={e => set('toAcademicYear', e.target.value)}
            >
              {getAcademicYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-danger-50)',
                color: 'var(--color-danger-600)',
                border: '1px solid var(--color-danger-200)',
              }}
            >
              <AlertCircle size={14} />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer justify-end">
          <button
            onClick={onClose}
            className="btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button
            onClick={handlePromote}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{
              backgroundColor: 'var(--color-warning-600)',
              color: '#ffffff',
            }}
          >
            {loading
              ? <Spinner size="sm" />
              : <TrendingUp size={14} />}
            {loading
              ? 'Processing...'
              : `Promote ${studentIds.length} Students`}
          </button>
        </div>
      </div>
    </div>
  )
}