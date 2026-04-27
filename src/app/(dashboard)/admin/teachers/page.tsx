'use client'

import {
    useState, useEffect, useCallback, useRef, useMemo,
} from 'react'
import {
    Users, UserCheck, UserPlus, Search, MoreVertical,
    Eye, Edit, Shield, ChevronLeft, ChevronRight,
    Phone, Mail, X, Check, AlertTriangle, Briefcase,
    Clock, UserX, BookOpen, GraduationCap, Loader2,
    AlertCircle, Code, Calendar,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Portal } from '@/components/ui/Portal'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'
import type { IClassConfig, ISectionConfig } from '@/types/settings'

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

type StaffCategory = 'teaching' | 'non_teaching' | 'admin' | 'support'
type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'resigned' | 'terminated'
type StaffRole = 'staff' | 'teacher'
type InstitutionType = 'school' | 'academy' | 'coaching'

interface ClassTeacherOf {
    class: string
    section: string
}

interface StaffMember {
    _id: string
    employeeId: string
    firstName: string
    lastName: string
    fullName: string
    gender: string
    phone: string
    email?: string
    photo?: string
    staffCategory: StaffCategory
    designation: string
    department: string
    qualification: string
    joiningDate: string
    basicSalary: number
    grossSalary?: number
    // School-specific
    subjects?: string[]
    classes?: string[]
    sections?: string[]
    isClassTeacher?: boolean
    classTeacherOf?: ClassTeacherOf
    // Academy/Coaching-specific
    batchIds?: string[]
    courseIds?: string[]
    allowedModules: string[]
    status: StaffStatus
    createdAt: string
}

interface StaffStats {
    total: number
    active: number
    onLeave: number
    inactive: number
}

interface AssignableModule {
    key: string
    label: string
    icon: string
    description: string
    color: string
}

interface Batch {
    _id: string
    batchCode: string
    batchName: string
    courseId: { name: string; code: string }
    startDate: string
    endDate: string
    status: string
}

interface Course {
    _id: string
    code: string
    name: string
    category: string
    isActive: boolean
}

// ═══════════════════════════════════════════════════════════
// Static Options
// ═══════════════════════════════════════════════════════════

const STAFF_CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'teaching', label: 'Teaching Staff' },
    { value: 'non_teaching', label: 'Non-Teaching' },
    { value: 'admin', label: 'Administrative' },
    { value: 'support', label: 'Support Staff' },
] as const

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'terminated', label: 'Terminated' },
] as const

const DESIGNATIONS = [
    'Principal', 'Vice Principal',
    'PGT (Post Graduate Teacher)', 'TGT (Trained Graduate Teacher)',
    'PRT (Primary Teacher)', 'NTT (Nursery Teacher)',
    'Instructor', 'Senior Instructor', 'Faculty',
    'Lab Assistant', 'Librarian', 'PTI (Physical Training Instructor)',
    'Computer Teacher', 'Art Teacher', 'Music Teacher',
    'Accountant', 'Clerk', 'Office Assistant',
    'Peon', 'Security Guard', 'Driver', 'Sweeper',
    'Counselor', 'Nurse', 'Other',
] as const

const DEPARTMENTS = [
    'Science', 'Mathematics', 'English', 'Hindi', 'Social Science',
    'Computer Science', 'Commerce', 'Arts', 'Physical Education',
    'Programming', 'Web Development', 'Data Science', 'Digital Marketing',
    'Graphics Design', 'Competitive Exams', 'Engineering',
    'Administration', 'Accounts', 'Library', 'Laboratory',
    'Transport', 'Maintenance', 'Security', 'Other',
] as const

const QUALIFICATIONS = [
    'Ph.D', 'M.Ed', 'B.Ed', 'M.A', 'M.Sc', 'M.Com', 'MBA',
    'B.A', 'B.Sc', 'B.Com', 'BCA', 'B.Tech', 'MCA', 'M.Tech',
    'D.El.Ed', 'NTT Diploma', '12th Pass', '10th Pass', 'Other',
] as const

// ═══════════════════════════════════════════════════════════
// Toast System
// ═══════════════════════════════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface ToastItem { id: string; type: ToastType; title: string; message?: string }

function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const dismiss = useCallback((id: string) => {
        setToasts(p => p.filter(t => t.id !== id))
        const t = timers.current.get(id)
        if (t) { clearTimeout(t); timers.current.delete(id) }
    }, [])

    const show = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        setToasts(p => [...p.slice(-4), { id, type, title, message }])
        const t = setTimeout(() => dismiss(id), 5000)
        timers.current.set(id, t)
    }, [dismiss])

    useEffect(() => {
        const ts = timers.current
        return () => { ts.forEach(t => clearTimeout(t)); ts.clear() }
    }, [])

    return { toasts, show, dismiss }
}

function ToastContainer({
    toasts, onDismiss,
}: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
    if (!toasts.length) return null
    const icons: Record<ToastType, React.ReactNode> = {
        success: <Check size={15} />,
        error: <X size={15} />,
        warning: <AlertTriangle size={15} />,
        info: <AlertCircle size={15} />,
    }
    return (
        <Portal>
            <div className="toast-container" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`} role="alert">
                        <div className="toast-icon">{icons[t.type]}</div>
                        <div className="toast-content">
                            <p className="toast-title">{t.title}</p>
                            {t.message && <p className="toast-message">{t.message}</p>}
                        </div>
                        <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                            <X size={13} />
                        </button>
                    </div>
                ))}
            </div>
        </Portal>
    )
}

// ═══════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════

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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {label}
                {required && <span style={{ color: 'var(--danger)' }}> *</span>}
            </label>
            {children}
            {hint && <p className="text-[0.625rem] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
        </div>
    )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            {children}
        </p>
    )
}

function InlineError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div
            className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] border"
            style={{ background: 'var(--danger-light)', borderColor: 'rgba(239,68,68,0.2)' }}
            role="alert"
        >
            <AlertCircle size={15} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm flex-1" style={{ color: 'var(--danger-dark)' }}>{message}</p>
            <button type="button" onClick={onDismiss} style={{ color: 'var(--danger)' }} aria-label="Dismiss">
                <X size={13} />
            </button>
        </div>
    )
}

function CategoryBadge({ cat }: { cat: StaffCategory }) {
    const map: Record<StaffCategory, string> = {
        teaching: 'badge badge-brand',
        non_teaching: 'badge badge-info',
        admin: 'badge badge-warning',
        support: 'badge badge-neutral',
    }
    const labels: Record<StaffCategory, string> = {
        teaching: 'Teaching',
        non_teaching: 'Non-Teaching',
        admin: 'Admin',
        support: 'Support',
    }
    return <span className={map[cat]}>{labels[cat]}</span>
}

function StatusBadge({ status }: { status: StaffStatus }) {
    const map: Record<StaffStatus, string> = {
        active: 'status-pill status-active',
        on_leave: 'status-pill status-pending',
        inactive: 'status-pill status-inactive',
        resigned: 'status-pill status-inactive',
        terminated: 'status-pill status-error',
    }
    const labels: Record<StaffStatus, string> = {
        active: 'Active',
        on_leave: 'On Leave',
        inactive: 'Inactive',
        resigned: 'Resigned',
        terminated: 'Terminated',
    }
    return <span className={map[status]}>{labels[status]}</span>
}

function StatCard({
    label, value, icon, iconBg, iconColor,
}: {
    label: string
    value: number
    icon: React.ReactNode
    iconBg: string
    iconColor: string
}) {
    return (
        <div className="portal-stat-card">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="stat-value">{value}</p>
                    <p className="stat-label">{label}</p>
                </div>
                <div className="stat-icon" style={{ background: iconBg, color: iconColor }} aria-hidden="true">
                    {icon}
                </div>
            </div>
        </div>
    )
}

function StepIndicator({ current, labels }: { current: number; labels: readonly string[] }) {
    return (
        <div className="flex items-start gap-1 mb-6" role="list" aria-label="Form steps">
            {labels.map((label, i) => {
                const num = i + 1
                const done = current > num
                const active = current === num
                return (
                    <div key={label} className="flex-1" role="listitem">
                        <div className="flex items-center gap-1.5">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0 transition-colors"
                                style={{
                                    background: done ? 'var(--success)' : active ? 'var(--primary-600)' : 'var(--bg-muted)',
                                    color: done || active ? '#ffffff' : 'var(--text-muted)',
                                }}
                                aria-current={active ? 'step' : undefined}
                            >
                                {done ? <Check size={10} /> : num}
                            </div>
                            <span className="text-[0.6875rem] font-medium truncate hidden sm:block" style={{ color: active ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                                {label}
                            </span>
                        </div>
                        {i < labels.length - 1 && (
                            <div className="h-0.5 mt-1 rounded-full transition-colors" style={{ background: done ? 'var(--success)' : 'var(--border)' }} aria-hidden="true" />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════
// Chip Components
// ═══════════════════════════════════════════════════════════

function ChipGroup({
    items, selected, onToggle, colorActive, emptyMsg,
}: {
    items: string[]
    selected: string[]
    onToggle: (item: string) => void
    colorActive: 'primary' | 'success'
    emptyMsg?: string
}) {
    const activeStyle = colorActive === 'primary'
        ? { background: 'var(--primary-600)', color: '#fff', borderColor: 'var(--primary-600)' }
        : { background: 'var(--success)', color: '#fff', borderColor: 'var(--success)' }

    if (items.length === 0) {
        return <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>{emptyMsg ?? 'No items available'}</p>
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map(item => {
                const isActive = selected.includes(item)
                return (
                    <button
                        key={item} type="button"
                        onClick={() => onToggle(item)}
                        aria-pressed={isActive}
                        className="px-2.5 py-1 text-xs rounded-[var(--radius-sm)] border font-medium transition-all duration-150"
                        style={isActive ? activeStyle : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                    >
                        {item}
                    </button>
                )
            })}
        </div>
    )
}

function SectionChips({ sections, selected, onToggle }: { sections: string[]; selected: string[]; onToggle: (s: string) => void }) {
    if (sections.length === 0) {
        return <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No active sections. Configure in Academic Settings.</p>
    }
    return (
        <div className="flex flex-wrap gap-2">
            {sections.map(sec => {
                const isActive = selected.includes(sec)
                return (
                    <button
                        key={sec} type="button"
                        onClick={() => onToggle(sec)}
                        aria-pressed={isActive}
                        className="w-10 h-10 rounded-[var(--radius-md)] border-2 font-bold text-sm transition-all duration-150"
                        style={isActive
                            ? { background: 'var(--primary-600)', color: '#fff', borderColor: 'var(--primary-600)', boxShadow: 'var(--shadow-sm)' }
                            : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                        }
                    >
                        {sec}
                    </button>
                )
            })}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════
// Modal Shell Components
// ═══════════════════════════════════════════════════════════

function ModalShell({
    id, title, onClose, size, children,
}: {
    id: string
    title: string
    onClose: () => void
    size?: 'sm' | 'md' | 'lg' | 'xl'
    children: React.ReactNode
}) {
    const maxW = { sm: '28rem', md: '35rem', lg: '44rem', xl: '56rem' }[size ?? 'lg']

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose()
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                style={{ background: 'rgba(30,27,75,0.5)', backdropFilter: 'blur(6px)' }}
                onClick={handleBackdrop}
                role="dialog"
                aria-modal="true"
                aria-labelledby={id}
            >
                <div
                    className="w-full rounded-[var(--radius-2xl)] overflow-hidden my-8 flex flex-col"
                    style={{
                        maxWidth: maxW,
                        maxHeight: 'calc(100vh - 4rem)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-modal)',
                        animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                        <h2 id={id} className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                            {title}
                        </h2>
                        <button
                            type="button" onClick={onClose}
                            className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-colors"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                            aria-label="Close"
                        >
                            <X size={15} />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </Portal>
    )
}

function ModalBody({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
            {children}
        </div>
    )
}

function ModalFooter({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
            {children}
        </div>
    )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button" onClick={onClick}
            className="h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px] transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
        >
            Cancel
        </button>
    )
}

function PrimaryBtn({
    onClick, type = 'button', disabled, loading, children,
}: {
    onClick?: () => void
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            type={type} onClick={onClick}
            disabled={disabled || loading}
            className="h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
        >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {children}
        </button>
    )
}

// ═══════════════════════════════════════════════════════════
// ADD STAFF MODAL - MULTI-TENANT
// ═══════════════════════════════════════════════════════════

const ADD_STEPS_SCHOOL = ['Personal Info', 'Professional', 'Teaching Details', 'Address & Contact'] as const
const ADD_STEPS_ACADEMY = ['Personal Info', 'Professional', 'Batch & Course', 'Address & Contact'] as const

interface AddStaffForm {
    firstName: string; lastName: string; phone: string; email: string
    gender: string; dateOfBirth: string; bloodGroup: string; password: string
    staffCategory: StaffCategory; designation: string; department: string
    qualification: string; specialization: string; experience: string
    joiningDate: string; previousSchool: string; role: StaffRole; basicSalary: string
    // School-specific
    subjects: string[]; classes: string[]; sections: string[]
    isClassTeacher: boolean; classTeacherClass: string; classTeacherSection: string
    // Academy/Coaching-specific
    batchIds: string[]; courseIds: string[]
    // Common
    currentAddress: string; city: string; state: string; pincode: string
    emergencyContactName: string; emergencyContactPhone: string; emergencyContactRelation: string
    allowedModules: string[]
}

function makeEmptyForm(): AddStaffForm {
    return {
        firstName: '', lastName: '', phone: '', email: '',
        gender: 'male', dateOfBirth: '', bloodGroup: '', password: '',
        staffCategory: 'teaching', designation: '', department: '',
        qualification: '', specialization: '', experience: '',
        joiningDate: new Date().toISOString().split('T')[0],
        previousSchool: '', role: 'staff', basicSalary: '',
        subjects: [], classes: [], sections: [],
        isClassTeacher: false, classTeacherClass: '', classTeacherSection: '',
        batchIds: [], courseIds: [],
        currentAddress: '', city: '', state: '', pincode: '',
        emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
        allowedModules: [],
    }
}

function AddStaffModal({ 
    open, 
    onClose, 
    onSuccess,
    institutionType,
}: { 
    open: boolean
    onClose: () => void
    onSuccess: (msg: string) => void
    institutionType: InstitutionType
}) {
    const { settings: academic, loading: acadLoading } = useAcademicSettings()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState<AddStaffForm>(makeEmptyForm)

    // Academy/Coaching data
    const [batches, setBatches] = useState<Batch[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loadingData, setLoadingData] = useState(false)

    useEffect(() => {
        if (!open) { 
            setTimeout(() => { 
                setStep(1)
                setForm(makeEmptyForm())
                setError('') 
            }, 300) 
        }
    }, [open])

    // Fetch batches & courses for academy/coaching
    useEffect(() => {
        if (!open || institutionType === 'school') return
        
        setLoadingData(true)
        Promise.all([
            fetch('/api/batches').then(r => r.json()),
            fetch('/api/courses').then(r => r.json()),
        ])
            .then(([batchData, courseData]) => {
                setBatches(batchData.batches || [])
                setCourses(courseData.courses || [])
            })
            .catch(err => {
                console.error('[AddStaff] Failed to fetch batches/courses:', err)
            })
            .finally(() => setLoadingData(false))
    }, [open, institutionType])

    const set = useCallback(<K extends keyof AddStaffForm>(k: K, v: AddStaffForm[K]) => {
        setForm(f => ({ ...f, [k]: v }))
    }, [])

    const toggleList = useCallback((field: 'subjects' | 'classes' | 'sections' | 'batchIds' | 'courseIds', item: string) => {
        setForm(f => ({
            ...f,
            [field]: f[field].includes(item) ? f[field].filter(x => x !== item) : [...f[field], item],
        }))
    }, [])

    const activeClasses = useMemo(() => 
        academic?.classes?.filter(c => c.isActive).map(c => c.displayName) ?? [], 
        [academic]
    )
    const activeSections = useMemo(() => 
        academic?.sections?.filter(s => s.isActive).map(s => s.name) ?? [], 
        [academic]
    )

    const dynamicSubjects = useMemo<string[]>(() => {
        if (!academic?.subjects) return []
        const out = new Set<string>()
        form.classes.forEach(displayName => {
            const cls = academic.classes?.find(c => c.displayName === displayName)
            if (!cls) return
            const entry = academic.subjects.find(s =>
                s.classGroup === cls.group && (cls.stream ? s.stream === cls.stream : !s.stream)
            )
            entry?.subjectList.forEach(sub => out.add(sub))
        })
        if (out.size === 0) academic.subjects.forEach(s => s.subjectList.forEach(sub => out.add(sub)))
        return Array.from(out).sort()
    }, [form.classes, academic])

    const ADD_STEPS = institutionType === 'school' ? ADD_STEPS_SCHOOL : ADD_STEPS_ACADEMY

    const canProceed = useCallback((): boolean => {
        switch (step) {
            case 1: return !!(form.firstName.trim() && form.phone.trim() && form.gender)
            case 2: return !!(form.staffCategory && form.designation && form.department && form.qualification && form.joiningDate)
            case 3: return true
            case 4: return !!(form.currentAddress.trim() && form.emergencyContactName.trim() && form.emergencyContactPhone.trim())
            default: return true
        }
    }, [step, form])

    const handleSubmit = useCallback(async () => {
        setError('')
        setLoading(true)

        const payload: Record<string, unknown> = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || undefined,
            gender: form.gender,
            dateOfBirth: form.dateOfBirth || undefined,
            bloodGroup: form.bloodGroup || undefined,
            staffCategory: form.staffCategory,
            designation: form.designation,
            department: form.department,
            qualification: form.qualification,
            specialization: form.specialization || undefined,
            experience: form.experience ? parseInt(form.experience) : 0,
            joiningDate: form.joiningDate,
            previousSchool: form.previousSchool || undefined,
            role: form.role,
            currentAddress: form.currentAddress,
            city: form.city || undefined,
            state: form.state || undefined,
            pincode: form.pincode || undefined,
            emergencyContactName: form.emergencyContactName,
            emergencyContactPhone: form.emergencyContactPhone,
            emergencyContactRelation: form.emergencyContactRelation || undefined,
            password: form.password || undefined,
            allowedModules: form.allowedModules,
            basicSalary: form.basicSalary ? parseInt(form.basicSalary) : 0,
        }

        if (form.staffCategory === 'teaching') {
            if (institutionType === 'school') {
                payload.subjects = form.subjects
                payload.classes = form.classes
                payload.sections = form.sections
                payload.isClassTeacher = form.isClassTeacher
                if (form.isClassTeacher && form.classTeacherClass) {
                    payload.classTeacherOf = {
                        class: form.classTeacherClass,
                        section: form.classTeacherSection || activeSections[0] || 'A',
                    }
                }
            } else {
                // Academy/Coaching
                payload.batchIds = form.batchIds
                payload.courseIds = form.courseIds
            }
        }

        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json() as { error?: string; message?: string }
            if (!res.ok) {
                setError(data.error ?? 'Something went wrong')
                setLoading(false)
                return
            }
            onSuccess(data.message ?? 'Staff added successfully!')
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }, [form, activeSections, onSuccess, institutionType])

    if (!open) return null

    return (
        <ModalShell id="add-staff-title" title="Add Staff Member" onClose={onClose} size="lg">
            <ModalBody>
                <StepIndicator current={step} labels={ADD_STEPS} />

                {/* Step 1: Personal Info - Same for all */}
                {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="First Name" required>
                            <input autoFocus className="input-clean" placeholder="Sunita" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                        </FormField>
                        <FormField label="Last Name">
                            <input className="input-clean" placeholder="Devi" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                        </FormField>
                        <FormField label="Phone Number" required>
                            <input className="input-clean" type="tel" placeholder="9222222222" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Email">
                            <input className="input-clean" type="email" placeholder="teacher@school.com" value={form.email} onChange={e => set('email', e.target.value)} />
                        </FormField>
                        <FormField label="Gender" required>
                            <select className="input-clean" value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </FormField>
                        <FormField label="Date of Birth">
                            <input className="input-clean" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                        </FormField>
                        <FormField label="Blood Group">
                            <select className="input-clean" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                                <option value="">Select</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Password" hint="Leave blank → phone number becomes password">
                            <input className="input-clean" type="password" placeholder="Default: phone number" value={form.password} onChange={e => set('password', e.target.value)} />
                        </FormField>
                    </div>
                )}

                {/* Step 2: Professional - Same for all */}
                {step === 2 && (
                    <div className="space-y-4">
                        <FormField label="Login Role" required>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { key: 'teacher' as StaffRole, label: 'Teacher', desc: 'Gets default teacher module access', icon: <UserCheck size={14} /> },
                                    { key: 'staff' as StaffRole, label: 'Staff', desc: 'Only sees modules you allow', icon: <Shield size={14} /> },
                                ] as const).map(r => (
                                    <button
                                        key={r.key} type="button"
                                        onClick={() => set('role', r.key)}
                                        aria-pressed={form.role === r.key}
                                        className="px-3 py-2.5 rounded-[var(--radius-md)] border text-sm text-left transition-all"
                                        style={{
                                            borderColor: form.role === r.key ? 'var(--primary-400)' : 'var(--border)',
                                            background: form.role === r.key ? 'var(--primary-50)' : 'transparent',
                                            color: form.role === r.key ? 'var(--primary-700)' : 'var(--text-secondary)',
                                        }}
                                    >
                                        <span className="flex items-center gap-1.5 font-semibold mb-0.5">{r.icon}{r.label}</span>
                                        <span className="text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </FormField>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Category" required>
                                <select className="input-clean" value={form.staffCategory} onChange={e => set('staffCategory', e.target.value as StaffCategory)}>
                                    <option value="teaching">Teaching Staff</option>
                                    <option value="non_teaching">Non-Teaching Staff</option>
                                    <option value="admin">Administrative Staff</option>
                                    <option value="support">Support Staff</option>
                                </select>
                            </FormField>
                            <FormField label="Designation" required>
                                <select className="input-clean" value={form.designation} onChange={e => set('designation', e.target.value)}>
                                    <option value="">Select Designation</option>
                                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Department" required>
                                <select className="input-clean" value={form.department} onChange={e => set('department', e.target.value)}>
                                    <option value="">Select Department</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Qualification" required>
                                <select className="input-clean" value={form.qualification} onChange={e => set('qualification', e.target.value)}>
                                    <option value="">Select</option>
                                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Specialization">
                                <input className="input-clean" placeholder="e.g. Physics" value={form.specialization} onChange={e => set('specialization', e.target.value)} />
                            </FormField>
                            <FormField label="Experience (years)">
                                <input className="input-clean" type="number" min={0} placeholder="5" value={form.experience} onChange={e => set('experience', e.target.value)} />
                            </FormField>
                            <FormField label="Joining Date" required>
                                <input className="input-clean" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
                            </FormField>
                            <FormField label="Monthly Salary (₹)">
                                <input className="input-clean" type="number" min={0} placeholder="25000" value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} />
                            </FormField>
                        </div>
                    </div>
                )}

                {/* Step 3: Teaching Details - MULTI-TENANT */}
                {step === 3 && (
                    <div className="space-y-5">
                        {form.staffCategory !== 'teaching' ? (
                            <div className="portal-empty py-10">
                                <div className="portal-empty-icon"><Briefcase size={22} /></div>
                                <p className="portal-empty-title">Non-teaching staff</p>
                                <p className="portal-empty-text">Teaching details not required. Click Next to continue.</p>
                            </div>
                        ) : institutionType === 'school' ? (
                            // SCHOOL: Classes, Sections, Subjects
                            acadLoading ? (
                                <div className="portal-empty py-10">
                                    <Loader2 size={28} className="animate-spin mb-2" style={{ color: 'var(--primary-400)' }} />
                                    <p className="portal-empty-text">Loading academic settings…</p>
                                </div>
                            ) : (
                                <>
                                    <FormField label="Classes Assigned">
                                        <div className="p-3 rounded-[var(--radius-md)] border max-h-40 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                            <ChipGroup items={activeClasses} selected={form.classes} onToggle={item => toggleList('classes', item)} colorActive="success" emptyMsg="No active classes. Configure in Academic Settings." />
                                        </div>
                                        <p className="input-hint">{form.classes.length === 0 ? 'No class selected' : `${form.classes.length} class${form.classes.length > 1 ? 'es' : ''} selected`}</p>
                                    </FormField>

                                    <FormField label="Sections Assigned">
                                        <div className="p-3 rounded-[var(--radius-md)] border" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                            <SectionChips sections={activeSections} selected={form.sections} onToggle={sec => toggleList('sections', sec)} />
                                        </div>
                                        <p className="input-hint">{form.sections.length === 0 ? 'No section selected' : `Sections: ${form.sections.join(', ')}`}</p>
                                    </FormField>

                                    <FormField label="Subjects Taught" hint={form.classes.length > 0 ? 'Filtered by selected classes' : 'All subjects shown — select classes to filter'}>
                                        <div className="p-3 rounded-[var(--radius-md)] border max-h-40 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                            <ChipGroup items={dynamicSubjects} selected={form.subjects} onToggle={item => toggleList('subjects', item)} colorActive="primary" emptyMsg="No subjects found. Configure in Academic Settings." />
                                        </div>
                                        <p className="input-hint">{form.subjects.length === 0 ? 'No subject selected' : `${form.subjects.length} subject${form.subjects.length > 1 ? 's' : ''} selected`}</p>
                                    </FormField>

                                    <div className="p-4 rounded-[var(--radius-md)] border space-y-3" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                                            <div
                                                className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                                style={{ background: form.isClassTeacher ? 'var(--primary-600)' : 'var(--bg-card)', borderColor: form.isClassTeacher ? 'var(--primary-600)' : 'var(--border-strong)' }}
                                                aria-hidden="true"
                                            >
                                                {form.isClassTeacher && <Check size={10} color="#fff" />}
                                            </div>
                                            <input type="checkbox" className="sr-only" checked={form.isClassTeacher} onChange={e => set('isClassTeacher', e.target.checked)} />
                                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Is Class Teacher</span>
                                        </label>

                                        {form.isClassTeacher && (
                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                                <FormField label="Class">
                                                    <select className="input-clean" value={form.classTeacherClass} onChange={e => set('classTeacherClass', e.target.value)}>
                                                        <option value="">Select Class</option>
                                                        {academic?.classes?.filter(c => c.isActive).map(cls => (
                                                            <option key={`${cls.name}-${cls.stream ?? ''}`} value={cls.displayName}>{cls.displayName}</option>
                                                        ))}
                                                    </select>
                                                </FormField>
                                                <FormField label="Section">
                                                    <select className="input-clean" value={form.classTeacherSection} onChange={e => set('classTeacherSection', e.target.value)}>
                                                        <option value="">Select Section</option>
                                                        {academic?.sections?.filter(s => s.isActive).map(s => (
                                                            <option key={s.name} value={s.name}>Section {s.name}</option>
                                                        ))}
                                                    </select>
                                                </FormField>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        ) : (
                            // ACADEMY/COACHING: Batches & Courses
                            loadingData ? (
                                <div className="portal-empty py-10">
                                    <Loader2 size={28} className="animate-spin mb-2" style={{ color: 'var(--primary-400)' }} />
                                    <p className="portal-empty-text">Loading batches & courses…</p>
                                </div>
                            ) : (
                                <>
                                    <FormField label="Courses Assigned" hint="Which courses can this instructor teach?">
                                        <div className="p-3 rounded-[var(--radius-md)] border max-h-48 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                            {courses.length === 0 ? (
                                                <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>
                                                    No courses available. Create courses first.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {courses.filter(c => c.isActive).map(course => {
                                                        const isSelected = form.courseIds.includes(course._id)
                                                        return (
                                                            <button
                                                                key={course._id}
                                                                type="button"
                                                                onClick={() => toggleList('courseIds', course._id)}
                                                                className="w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
                                                                style={{
                                                                    background: isSelected ? 'var(--primary-50)' : 'var(--bg-card)',
                                                                    borderColor: isSelected ? 'var(--primary-300)' : 'var(--border)',
                                                                }}
                                                            >
                                                                <div
                                                                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                                                    style={{
                                                                        background: isSelected ? 'var(--primary-600)' : 'var(--bg-muted)',
                                                                        border: isSelected ? 'none' : '2px solid var(--border-strong)',
                                                                    }}
                                                                >
                                                                    {isSelected && <Check size={12} color="#fff" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                                                                        {course.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="badge badge-neutral text-[0.625rem]">
                                                                            <Code size={9} className="mr-0.5" />
                                                                            {course.code}
                                                                        </span>
                                                                        <span className="badge badge-info text-[0.625rem]">
                                                                            {course.category}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <p className="input-hint">
                                            {form.courseIds.length === 0 
                                                ? 'No course selected' 
                                                : `${form.courseIds.length} course${form.courseIds.length > 1 ? 's' : ''} selected`
                                            }
                                        </p>
                                    </FormField>

                                    <FormField label="Batches Assigned" hint="Which batches will this instructor handle?">
                                        <div className="p-3 rounded-[var(--radius-md)] border max-h-48 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                            {batches.length === 0 ? (
                                                <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>
                                                    No batches available. Create batches first.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {batches.map(batch => {
                                                        const isSelected = form.batchIds.includes(batch._id)
                                                        return (
                                                            <button
                                                                key={batch._id}
                                                                type="button"
                                                                onClick={() => toggleList('batchIds', batch._id)}
                                                                className="w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
                                                                style={{
                                                                    background: isSelected ? 'var(--success-light)' : 'var(--bg-card)',
                                                                    borderColor: isSelected ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                                                                }}
                                                            >
                                                                <div
                                                                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                                                    style={{
                                                                        background: isSelected ? 'var(--success)' : 'var(--bg-muted)',
                                                                        border: isSelected ? 'none' : '2px solid var(--border-strong)',
                                                                    }}
                                                                >
                                                                    {isSelected && <Check size={12} color="#fff" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                                                                        {batch.batchName}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="badge badge-neutral text-[0.625rem]">
                                                                            {batch.batchCode}
                                                                        </span>
                                                                        {batch.courseId && (
                                                                            <span className="badge badge-brand text-[0.625rem]">
                                                                                {batch.courseId.name}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                                                                            <Calendar size={9} className="inline mr-0.5" />
                                                                            {new Date(batch.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <p className="input-hint">
                                            {form.batchIds.length === 0 
                                                ? 'No batch selected' 
                                                : `${form.batchIds.length} batch${form.batchIds.length > 1 ? 'es' : ''} selected`
                                            }
                                        </p>
                                    </FormField>
                                </>
                            )
                        )}
                    </div>
                )}

                {/* Step 4: Address & Contact - Same for all */}
                {step === 4 && (
                    <div className="space-y-4">
                        <FormField label="Current Address" required>
                            <textarea className="input-clean resize-none" rows={2} placeholder="House No, Street, Area" value={form.currentAddress} onChange={e => set('currentAddress', e.target.value)} />
                        </FormField>
                        <div className="grid grid-cols-3 gap-3">
                            <FormField label="City">
                                <input className="input-clean" placeholder="Varanasi" value={form.city} onChange={e => set('city', e.target.value)} />
                            </FormField>
                            <FormField label="State">
                                <input className="input-clean" placeholder="Uttar Pradesh" value={form.state} onChange={e => set('state', e.target.value)} />
                            </FormField>
                            <FormField label="Pincode">
                                <input className="input-clean" placeholder="221001" value={form.pincode} onChange={e => set('pincode', e.target.value)} />
                            </FormField>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Emergency Contact</p>
                            <div className="grid grid-cols-3 gap-3">
                                <FormField label="Contact Name" required>
                                    <input className="input-clean" placeholder="Father's Name" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
                                </FormField>
                                <FormField label="Contact Phone" required>
                                    <input className="input-clean" type="tel" placeholder="9111111111" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
                                </FormField>
                                <FormField label="Relation">
                                    <input className="input-clean" placeholder="Father / Spouse" value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} />
                                </FormField>
                            </div>
                        </div>
                    </div>
                )}

                {error && <InlineError message={error} onDismiss={() => setError('')} />}
            </ModalBody>

            <ModalFooter>
                <div className="flex-1">
                    {step > 1 && (
                        <button
                            type="button" onClick={() => setStep(s => s - 1)}
                            className="h-9 px-3 rounded-[var(--radius-md)] text-sm font-medium flex items-center gap-1 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    )}
                </div>
                <CancelBtn onClick={onClose} />
                {step < ADD_STEPS.length ? (
                    <PrimaryBtn disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
                        Next <ChevronRight size={14} />
                    </PrimaryBtn>
                ) : (
                    <PrimaryBtn loading={loading} disabled={!canProceed()} onClick={handleSubmit}>
                        <UserPlus size={14} /> Add Staff
                    </PrimaryBtn>
                )}
            </ModalFooter>
        </ModalShell>
    )
}

// ═══════════════════════════════════════════════════════════
// EDIT MODAL - MULTI-TENANT
// ═══════════════════════════════════════════════════════════

interface EditStaffForm {
    firstName: string; lastName: string; phone: string; email: string; gender: string
    staffCategory: StaffCategory; designation: string; department: string; qualification: string; basicSalary: string
    // School
    subjects: string[]; classes: string[]; sections: string[]
    isClassTeacher: boolean; classTeacherClass: string; classTeacherSection: string
    // Academy/Coaching
    batchIds: string[]; courseIds: string[]
}

function EditStaffModal({ 
    staff, 
    onClose, 
    onSuccess,
    institutionType,
}: { 
    staff: StaffMember
    onClose: () => void
    onSuccess: (msg: string) => void
    institutionType: InstitutionType
}) {
    const { settings: academic, loading: acadLoading } = useAcademicSettings()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    const [batches, setBatches] = useState<Batch[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loadingData, setLoadingData] = useState(false)

    const [form, setForm] = useState<EditStaffForm>({
        firstName: staff.firstName || '',
        lastName: staff.lastName || '',
        phone: staff.phone || '',
        email: staff.email || '',
        gender: staff.gender || 'male',
        staffCategory: staff.staffCategory || 'teaching',
        designation: staff.designation || '',
        department: staff.department || '',
        qualification: staff.qualification || '',
        basicSalary: staff.basicSalary?.toString() || '',
        subjects: staff.subjects || [],
        classes: staff.classes || [],
        sections: staff.sections || [],
        isClassTeacher: staff.isClassTeacher || false,
        classTeacherClass: staff.classTeacherOf?.class || '',
        classTeacherSection: staff.classTeacherOf?.section || '',
        batchIds: staff.batchIds || [],
        courseIds: staff.courseIds || [],
    })

    // Fetch batches & courses for academy/coaching
    useEffect(() => {
        if (institutionType === 'school') return
        
        setLoadingData(true)
        Promise.all([
            fetch('/api/batches').then(r => r.json()),
            fetch('/api/courses').then(r => r.json()),
        ])
            .then(([batchData, courseData]) => {
                setBatches(batchData.batches || [])
                setCourses(courseData.courses || [])
            })
            .catch(err => {
                console.error('[EditStaff] Failed to fetch batches/courses:', err)
            })
            .finally(() => setLoadingData(false))
    }, [institutionType])

    const set = useCallback(<K extends keyof EditStaffForm>(k: K, v: EditStaffForm[K]) => { 
        setForm(f => ({ ...f, [k]: v })) 
    }, [])

    const toggleList = useCallback((field: 'subjects' | 'classes' | 'sections' | 'batchIds' | 'courseIds', item: string) => {
        setForm(f => ({ ...f, [field]: f[field].includes(item) ? f[field].filter(x => x !== item) : [...f[field], item] }))
    }, [])

    const activeClasses = useMemo(() => academic?.classes?.filter(c => c.isActive).map(c => c.displayName) ?? [], [academic])
    const activeSections = useMemo(() => academic?.sections?.filter(s => s.isActive).map(s => s.name) ?? [], [academic])

    const dynamicSubjects = useMemo<string[]>(() => {
        if (!academic?.subjects) return []
        const out = new Set<string>()
        form.classes.forEach(displayName => {
            const cls = academic.classes?.find(c => c.displayName === displayName)
            if (!cls) return
            const entry = academic.subjects.find(s => s.classGroup === cls.group && (cls.stream ? s.stream === cls.stream : !s.stream))
            entry?.subjectList.forEach(sub => out.add(sub))
        })
        if (out.size === 0) academic.subjects.forEach(s => s.subjectList.forEach(sub => out.add(sub)))
        return Array.from(out).sort()
    }, [form.classes, academic])

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const payload: Record<string, unknown> = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || undefined,
            gender: form.gender,
            staffCategory: form.staffCategory,
            designation: form.designation,
            department: form.department,
            qualification: form.qualification,
            basicSalary: form.basicSalary ? parseInt(form.basicSalary) : undefined,
        }

        if (form.staffCategory === 'teaching') {
            if (institutionType === 'school') {
                payload.subjects = form.subjects
                payload.classes = form.classes
                payload.sections = form.sections
                payload.isClassTeacher = form.isClassTeacher
                if (form.isClassTeacher && form.classTeacherClass) {
                    payload.classTeacherOf = { 
                        class: form.classTeacherClass, 
                        section: form.classTeacherSection || activeSections[0] || 'A' 
                    }
                }
            } else {
                payload.batchIds = form.batchIds
                payload.courseIds = form.courseIds
            }
        }

        try {
            const res = await fetch(`/api/staff/${staff._id}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            })
            const data = await res.json() as { error?: string; message?: string }
            if (!res.ok) { 
                setError(data.error ?? 'Failed to update')
                setLoading(false)
                return 
            }
            onSuccess(data.message ?? 'Staff updated successfully!')
        } catch {
            setError('Network error')
        }
        setLoading(false)
    }, [form, staff._id, activeSections, onSuccess, institutionType])

    return (
        <ModalShell id="edit-staff-title" title={`Edit: ${staff.fullName}`} onClose={onClose} size="lg">
            <form id="edit-staff-form" onSubmit={handleSubmit} noValidate>
                <ModalBody>
                    <SectionHeading>Personal Information</SectionHeading>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="First Name" required>
                            <input className="input-clean" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                        </FormField>
                        <FormField label="Last Name">
                            <input className="input-clean" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                        </FormField>
                        <FormField label="Phone" required>
                            <input className="input-clean" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </FormField>
                        <FormField label="Email">
                            <input className="input-clean" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                        </FormField>
                        <FormField label="Gender" required>
                            <select className="input-clean" value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </FormField>
                    </div>

                    <SectionHeading>Professional Details</SectionHeading>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Category" required>
                            <select className="input-clean" value={form.staffCategory} onChange={e => set('staffCategory', e.target.value as StaffCategory)}>
                                <option value="teaching">Teaching</option>
                                <option value="non_teaching">Non-Teaching</option>
                                <option value="admin">Admin</option>
                                <option value="support">Support</option>
                            </select>
                        </FormField>
                        <FormField label="Designation" required>
                            <select className="input-clean" value={form.designation} onChange={e => set('designation', e.target.value)}>
                                <option value="">Select</option>
                                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Department" required>
                            <select className="input-clean" value={form.department} onChange={e => set('department', e.target.value)}>
                                <option value="">Select</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Qualification" required>
                            <select className="input-clean" value={form.qualification} onChange={e => set('qualification', e.target.value)}>
                                <option value="">Select</option>
                                {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Monthly Salary (₹)">
                            <input className="input-clean" type="number" min={0} value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} />
                        </FormField>
                    </div>

                    {form.staffCategory === 'teaching' && (
                        <>
                            <SectionHeading>
                                {institutionType === 'school' ? 'Teaching Details' : 'Batch & Course Assignment'}
                            </SectionHeading>
                            
                            {institutionType === 'school' ? (
                                acadLoading ? (
                                    <div className="flex items-center gap-2 py-3" style={{ color: 'var(--text-muted)' }}>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm">Loading academic settings…</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <FormField label="Classes Assigned">
                                            <div className="p-3 rounded-[var(--radius-md)] border max-h-36 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                                <ChipGroup items={activeClasses} selected={form.classes} onToggle={item => toggleList('classes', item)} colorActive="success" />
                                            </div>
                                            <p className="input-hint">{form.classes.length} class{form.classes.length !== 1 ? 'es' : ''} selected</p>
                                        </FormField>
                                        <FormField label="Sections Assigned">
                                            <div className="p-3 rounded-[var(--radius-md)] border" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                                <SectionChips sections={activeSections} selected={form.sections} onToggle={sec => toggleList('sections', sec)} />
                                            </div>
                                            <p className="input-hint">{form.sections.length === 0 ? 'No section selected' : `Sections: ${form.sections.join(', ')}`}</p>
                                        </FormField>
                                        <FormField label="Subjects Taught">
                                            <div className="p-3 rounded-[var(--radius-md)] border max-h-36 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                                <ChipGroup items={dynamicSubjects} selected={form.subjects} onToggle={item => toggleList('subjects', item)} colorActive="primary" />
                                            </div>
                                            <p className="input-hint">{form.subjects.length} subject{form.subjects.length !== 1 ? 's' : ''} selected</p>
                                        </FormField>
                                        <div className="p-4 rounded-[var(--radius-md)] border space-y-3" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                                                <div
                                                    className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                                    style={{ background: form.isClassTeacher ? 'var(--primary-600)' : 'var(--bg-card)', borderColor: form.isClassTeacher ? 'var(--primary-600)' : 'var(--border-strong)' }}
                                                    aria-hidden="true"
                                                >
                                                    {form.isClassTeacher && <Check size={10} color="#fff" />}
                                                </div>
                                                <input type="checkbox" className="sr-only" checked={form.isClassTeacher} onChange={e => set('isClassTeacher', e.target.checked)} />
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Class Teacher</span>
                                            </label>
                                            {form.isClassTeacher && (
                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                                    <FormField label="Class">
                                                        <select className="input-clean" value={form.classTeacherClass} onChange={e => set('classTeacherClass', e.target.value)}>
                                                            <option value="">Select Class</option>
                                                            {academic?.classes?.filter(c => c.isActive).map(cls => (
                                                                <option key={`${cls.name}-${cls.stream ?? ''}`} value={cls.displayName}>{cls.displayName}</option>
                                                            ))}
                                                        </select>
                                                    </FormField>
                                                    <FormField label="Section">
                                                        <select className="input-clean" value={form.classTeacherSection} onChange={e => set('classTeacherSection', e.target.value)}>
                                                            <option value="">Select Section</option>
                                                            {academic?.sections?.filter(s => s.isActive).map(s => (
                                                                <option key={s.name} value={s.name}>Section {s.name}</option>
                                                            ))}
                                                        </select>
                                                    </FormField>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            ) : (
                                // Academy/Coaching Edit
                                loadingData ? (
                                    <div className="flex items-center gap-2 py-3" style={{ color: 'var(--text-muted)' }}>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm">Loading batches & courses…</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <FormField label="Courses Assigned">
                                            <div className="p-3 rounded-[var(--radius-md)] border max-h-48 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                                {courses.length === 0 ? (
                                                    <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No courses available</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {courses.filter(c => c.isActive).map(course => {
                                                            const isSelected = form.courseIds.includes(course._id)
                                                            return (
                                                                <button
                                                                    key={course._id}
                                                                    type="button"
                                                                    onClick={() => toggleList('courseIds', course._id)}
                                                                    className="w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
                                                                    style={{
                                                                        background: isSelected ? 'var(--primary-50)' : 'var(--bg-card)',
                                                                        borderColor: isSelected ? 'var(--primary-300)' : 'var(--border)',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                                                        style={{
                                                                            background: isSelected ? 'var(--primary-600)' : 'var(--bg-muted)',
                                                                            border: isSelected ? 'none' : '2px solid var(--border-strong)',
                                                                        }}
                                                                    >
                                                                        {isSelected && <Check size={12} color="#fff" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                                                                            {course.name}
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="badge badge-neutral text-[0.625rem]">
                                                                                {course.code}
                                                                            </span>
                                                                            <span className="badge badge-info text-[0.625rem]">
                                                                                {course.category}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="input-hint">
                                                {form.courseIds.length} course{form.courseIds.length !== 1 ? 's' : ''} selected
                                            </p>
                                        </FormField>

                                        <FormField label="Batches Assigned">
                                            <div className="p-3 rounded-[var(--radius-md)] border max-h-48 overflow-y-auto" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)' }}>
                                                {batches.length === 0 ? (
                                                    <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No batches available</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {batches.map(batch => {
                                                            const isSelected = form.batchIds.includes(batch._id)
                                                            return (
                                                                <button
                                                                    key={batch._id}
                                                                    type="button"
                                                                    onClick={() => toggleList('batchIds', batch._id)}
                                                                    className="w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
                                                                    style={{
                                                                        background: isSelected ? 'var(--success-light)' : 'var(--bg-card)',
                                                                        borderColor: isSelected ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                                                        style={{
                                                                            background: isSelected ? 'var(--success)' : 'var(--bg-muted)',
                                                                            border: isSelected ? 'none' : '2px solid var(--border-strong)',
                                                                        }}
                                                                    >
                                                                        {isSelected && <Check size={12} color="#fff" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                                                                            {batch.batchName}
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="badge badge-neutral text-[0.625rem]">
                                                                                {batch.batchCode}
                                                                            </span>
                                                                            {batch.courseId && (
                                                                                <span className="badge badge-brand text-[0.625rem]">
                                                                                    {batch.courseId.name}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="input-hint">
                                                {form.batchIds.length} batch{form.batchIds.length !== 1 ? 'es' : ''} selected
                                            </p>
                                        </FormField>
                                    </div>
                                )
                            )}
                        </>
                    )}

                    {error && <InlineError message={error} onDismiss={() => setError('')} />}
                </ModalBody>

                <ModalFooter>
                    <CancelBtn onClick={onClose} />
                    <PrimaryBtn type="submit" loading={loading}>
                        <Check size={14} /> Save Changes
                    </PrimaryBtn>
                </ModalFooter>
            </form>
        </ModalShell>
    )
}

// ═══════════════════════════════════════════════════════════
// PERMISSIONS MODAL (Same as before - works for all types)
// ═══════════════════════════════════════════════════════════

function PermissionsModal({ 
    staff, 
    onClose, 
    onSuccess 
}: { 
    staff: StaffMember
    onClose: () => void
    onSuccess: () => void 
}) {
    const [modules, setModules] = useState<AssignableModule[]>([])
    const [selected, setSelected] = useState<string[]>(staff.allowedModules ?? [])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        fetch('/api/staff/permissions')
            .then(r => r.json())
            .then((d: { modules?: AssignableModule[] }) => { 
                setModules(d.modules ?? [])
                setFetching(false) 
            })
            .catch(() => setFetching(false))
    }, [])

    const toggle = (key: string) => setSelected(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])

    const handleSave = async () => {
        setLoading(true)
        try {
            await fetch('/api/staff/permissions', { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ staffId: staff._id, allowedModules: selected }) 
            })
            onSuccess()
        } catch { /* handled by parent */ }
        setLoading(false)
    }

    return (
        <ModalShell id="perm-title" title={`Module Access — ${staff.fullName}`} onClose={onClose} size="lg">
            <ModalBody>
                <div className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] border" style={{ background: 'var(--warning-light)', borderColor: 'rgba(245,158,11,0.25)' }}>
                    <AlertCircle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--warning-dark)' }}>
                        <strong>{staff.fullName}</strong> will only see the modules you enable.
                    </p>
                </div>

                {fetching ? (
                    <div className="portal-empty py-10">
                        <Loader2 size={28} className="animate-spin mb-2" style={{ color: 'var(--primary-400)' }} />
                        <p className="portal-empty-text">Loading modules…</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                        {modules.map(mod => {
                            const active = selected.includes(mod.key)
                            return (
                                <button
                                    key={mod.key} type="button" onClick={() => toggle(mod.key)} aria-pressed={active}
                                    className="flex items-start gap-2.5 p-3 rounded-[var(--radius-md)] border text-left transition-all"
                                    style={{ background: active ? 'var(--primary-50)' : 'var(--bg-card)', borderColor: active ? 'var(--primary-300)' : 'var(--border)', boxShadow: active ? 'var(--shadow-sm)' : 'none' }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 transition-colors"
                                        style={{ background: active ? 'var(--primary-600)' : 'var(--bg-muted)' }}
                                    >
                                        {active ? <Check size={13} color="#fff" /> : <div className="w-3 h-3 rounded border-2" style={{ borderColor: 'var(--border-strong)' }} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold" style={{ color: active ? 'var(--primary-700)' : 'var(--text-secondary)' }}>{mod.label}</p>
                                        <p className="text-[0.6875rem] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{mod.description}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>{selected.length} module{selected.length !== 1 ? 's' : ''} selected</p>
                <CancelBtn onClick={onClose} />
                <PrimaryBtn loading={loading} onClick={handleSave}>
                    <Check size={14} /> Save Permissions
                </PrimaryBtn>
            </ModalFooter>
        </ModalShell>
    )
}

// ═══════════════════════════════════════════════════════════
// VIEW STAFF MODAL (Same logic - works for all types)
// ═══════════════════════════════════════════════════════════

function ProfileDetail({ label, value }: { label: string; value?: string | number }) {
    return (
        <div>
            <p className="text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-sm font-medium capitalize mt-0.5" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
        </div>
    )
}

function ViewStaffModal({ 
    staff, 
    onClose,
    institutionType,
}: { 
    staff: StaffMember
    onClose: () => void
    institutionType: InstitutionType
}) {
    return (
        <ModalShell id="view-staff-title" title="Staff Profile" onClose={onClose} size="lg">
            <ModalBody>
                <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
                    <div className="avatar avatar-2xl flex-shrink-0" aria-hidden="true">
                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0) ?? ''}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                            {staff.fullName}
                        </h3>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {staff.designation} · {staff.department}
                        </p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {staff.employeeId}
                        </p>
                    </div>
                    <StatusBadge status={staff.status} />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <ProfileDetail label="Category" value={staff.staffCategory?.replace('_', ' ')} />
                    <ProfileDetail label="Gender" value={staff.gender} />
                    <ProfileDetail label="Phone" value={staff.phone} />
                    <ProfileDetail label="Email" value={staff.email} />
                    <ProfileDetail label="Qualification" value={staff.qualification} />
                    <ProfileDetail label="Joining Date" value={staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString('en-IN') : undefined} />
                    <ProfileDetail label="Salary" value={staff.basicSalary ? `₹${staff.basicSalary.toLocaleString('en-IN')}` : undefined} />
                </div>

                {/* School-specific rendering */}
                {institutionType === 'school' && (
                    <>
                        {(staff.subjects?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <BookOpen size={12} /> Subjects
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.subjects!.map(sub => <span key={sub} className="badge badge-info">{sub}</span>)}
                                </div>
                            </div>
                        )}

                        {(staff.classes?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <GraduationCap size={12} /> Classes
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.classes!.map(cls => <span key={cls} className="badge badge-brand">{cls}</span>)}
                                </div>
                            </div>
                        )}

                        {(staff.sections?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Sections</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.sections!.map(sec => <span key={sec} className="badge badge-neutral">Section {sec}</span>)}
                                </div>
                            </div>
                        )}

                        {staff.isClassTeacher && staff.classTeacherOf && (
                            <div className="p-3 rounded-[var(--radius-md)] border" style={{ background: 'var(--success-light)', borderColor: 'rgba(16,185,129,0.2)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--success-dark)' }}>
                                    📚 Class Teacher of {staff.classTeacherOf.class} — Section {staff.classTeacherOf.section}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Academy/Coaching-specific rendering */}
                {(institutionType === 'academy' || institutionType === 'coaching') && (
                    <>
                        {(staff.courseIds?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <BookOpen size={12} /> Assigned Courses
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.courseIds!.map(courseId => (
                                        <span key={courseId} className="badge badge-brand">{courseId}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(staff.batchIds?.length ?? 0) > 0 && (
                            <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                                    <Users size={12} /> Assigned Batches
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {staff.batchIds!.map(batchId => (
                                        <span key={batchId} className="badge badge-success">{batchId}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Shield size={12} /> Module Access
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {(staff.allowedModules?.length ?? 0) > 0
                            ? staff.allowedModules.map(m => <span key={m} className="badge badge-success">{m}</span>)
                            : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No specific modules assigned</span>
                        }
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <CancelBtn onClick={onClose} />
            </ModalFooter>
        </ModalShell>
    )
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT - PRODUCTION READY
// ═══════════════════════════════════════════════════════════

export default function TeachersStaffPage() {
    const { data: session } = useSession()
    const { toasts, show: showToast, dismiss: dismissToast } = useToast()

    const institutionType = ((session?.user as any)?.institutionType || 'school') as InstitutionType

    const [staff, setStaff] = useState<StaffMember[]>([])
    const [stats, setStats] = useState<StaffStats>({ total: 0, active: 0, onLeave: 0, inactive: 0 })
    const [departments, setDepartments] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterDept, setFilterDept] = useState('')

    const [showAdd, setShowAdd] = useState(false)
    const [showPermissions, setShowPermissions] = useState<StaffMember | null>(null)
    const [showView, setShowView] = useState<StaffMember | null>(null)
    const [showEdit, setShowEdit] = useState<StaffMember | null>(null)
    const [actionMenu, setActionMenu] = useState<{ id: string; position: { top: number; left: number } } | null>(null)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchStaff = useCallback(async () => {
        setLoading(true)
        try {
            const p = new URLSearchParams()
            if (search) p.set('search', search)
            if (filterCategory) p.set('category', filterCategory)
            if (filterStatus) p.set('status', filterStatus)
            if (filterDept) p.set('department', filterDept)
            p.set('page', String(page))
            p.set('limit', '25')

            const res = await fetch(`/api/staff?${p}`)
            const data = await res.json() as Partial<{ 
                staff: StaffMember[]
                stats: StaffStats
                departments: string[]
                pagination: { totalPages: number } 
            }>
            if (res.ok) {
                setStaff(data.staff ?? [])
                setStats(data.stats ?? { total: 0, active: 0, onLeave: 0, inactive: 0 })
                setDepartments(data.departments ?? [])
                setTotalPages(data.pagination?.totalPages ?? 1)
            }
        } catch (err) {
            console.error('[TeachersPage] fetchStaff:', err)
        }
        setLoading(false)
    }, [search, filterCategory, filterStatus, filterDept, page])

    useEffect(() => { fetchStaff() }, [fetchStaff])

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
        return () => clearTimeout(t)
    }, [searchInput])

    useEffect(() => {
        if (!actionMenu) return
        const close = () => setActionMenu(null)
        window.addEventListener('scroll', close, { passive: true })
        return () => window.removeEventListener('scroll', close)
    }, [actionMenu])

    const handleActionClick = (e: React.MouseEvent, staffId: string) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setActionMenu(prev => prev?.id === staffId ? null : { 
            id: staffId, 
            position: { 
                top: rect.bottom + window.scrollY + 4, 
                left: rect.right + window.scrollX - 192 
            } 
        })
    }

    const handleStatusChange = async (staffId: string, newStatus: string) => {
        setActionMenu(null)
        try {
            const res = await fetch(`/api/staff/${staffId}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ status: newStatus }) 
            })
            const data = await res.json() as { error?: string }
            if (res.ok) { 
                showToast('success', 'Status updated', `Changed to ${newStatus}`)
                fetchStaff() 
            } else {
                showToast('error', 'Failed', data.error ?? 'Could not update status')
            }
        } catch {
            showToast('error', 'Network error', 'Please try again')
        }
    }

    const pageTitle = institutionType === 'school' 
        ? 'Teachers & Staff'
        : institutionType === 'academy'
        ? 'Instructors & Staff'
        : 'Faculty & Staff'

    const pageSubtitle = institutionType === 'school'
        ? `Manage ${stats.total} staff members · classes & sections sync from Academic Settings`
        : `Manage ${stats.total} staff members · batches & courses linked dynamically`

    return (
        <div className="portal-content-enter">
            <div className="portal-page-header">
                <div>
                    <div className="portal-breadcrumb mb-1">
                        <span style={{ color: 'var(--text-muted)' }}>Admin</span>
                        <span className="bc-sep">/</span>
                        <span className="bc-current">{pageTitle}</span>
                    </div>
                    <h1 className="portal-page-title">{pageTitle}</h1>
                    <p className="portal-page-subtitle">{pageSubtitle}</p>
                </div>
                <button
                    type="button"
                    className="h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold text-white flex items-center gap-1.5 transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                    onClick={() => setShowAdd(true)}
                >
                    <UserPlus size={15} /> Add Staff
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard 
                    label="Total Staff" 
                    value={stats.total} 
                    icon={<Users size={17} />} 
                    iconBg="var(--primary-50)" 
                    iconColor="var(--primary-600)" 
                />
                <StatCard 
                    label="Active" 
                    value={stats.active} 
                    icon={<UserCheck size={17} />} 
                    iconBg="var(--success-light)" 
                    iconColor="var(--success-dark)" 
                />
                <StatCard 
                    label="On Leave" 
                    value={stats.onLeave} 
                    icon={<Clock size={17} />} 
                    iconBg="var(--info-light)" 
                    iconColor="var(--info-dark)" 
                />
                <StatCard 
                    label="Inactive" 
                    value={stats.inactive} 
                    icon={<UserX size={17} />} 
                    iconBg="var(--danger-light)" 
                    iconColor="var(--danger-dark)" 
                />
            </div>

            <div className="portal-card mb-4" style={{ overflow: 'visible' }}>
                <div className="portal-card-body-sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-[var(--radius-md)] border transition-all" style={{ background: 'var(--bg-muted)', borderColor: 'transparent' }}>
                            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <input
                                type="text" 
                                placeholder="Search by name, phone, employee ID…"
                                value={searchInput} 
                                onChange={e => setSearchInput(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                                aria-label="Search staff"
                            />
                            {searchInput && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchInput('')} 
                                    style={{ color: 'var(--text-muted)' }} 
                                    aria-label="Clear"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        <select 
                            value={filterCategory} 
                            onChange={e => { setFilterCategory(e.target.value); setPage(1) }} 
                            className="input-clean h-9 text-sm" 
                            style={{ minWidth: '140px', width: 'auto' }} 
                            aria-label="Filter by category"
                        >
                            {STAFF_CATEGORIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        
                        <select 
                            value={filterStatus} 
                            onChange={e => { setFilterStatus(e.target.value); setPage(1) }} 
                            className="input-clean h-9 text-sm" 
                            style={{ minWidth: '120px', width: 'auto' }} 
                            aria-label="Filter by status"
                        >
                            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        
                        {departments.length > 0 && (
                            <select 
                                value={filterDept} 
                                onChange={e => { setFilterDept(e.target.value); setPage(1) }} 
                                className="input-clean h-9 text-sm" 
                                style={{ minWidth: '140px', width: 'auto' }} 
                                aria-label="Filter by department"
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            <div className="portal-card">
                {loading ? (
                    <div className="portal-empty">
                        <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--primary-400)' }} />
                        <p className="portal-empty-text">Loading staff members…</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="portal-empty">
                        <div className="portal-empty-icon"><Users size={22} /></div>
                        <p className="portal-empty-title">No staff members found</p>
                        <p className="portal-empty-text">
                            {search || filterCategory || filterStatus || filterDept 
                                ? 'Try adjusting your filters' 
                                : 'Add your first staff member to get started'
                            }
                        </p>
                        {!search && !filterCategory && !filterStatus && !filterDept && (
                            <button 
                                type="button" 
                                onClick={() => setShowAdd(true)} 
                                className="mt-4 h-9 px-4 rounded-[var(--radius-md)] text-sm font-semibold text-white flex items-center gap-2" 
                                style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                            >
                                <UserPlus size={14} /> Add Staff
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="portal-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Category</th>
                                        <th>Department</th>
                                        <th>Designation</th>
                                        <th>Contact</th>
                                        <th>
                                            {institutionType === 'school' ? 'Sections' : 'Batches'}
                                        </th>
                                        <th>Modules</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map(s => (
                                        <tr key={s._id}>
                                            <td>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="avatar avatar-md flex-shrink-0" aria-hidden="true">
                                                        {s.firstName?.charAt(0)}{s.lastName?.charAt(0) ?? ''}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                                            {s.fullName}
                                                        </p>
                                                        <p className="text-[0.6875rem] font-mono" style={{ color: 'var(--text-muted)' }}>
                                                            {s.employeeId}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><CategoryBadge cat={s.staffCategory} /></td>
                                            <td>
                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {s.department}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {s.designation}
                                                </span>
                                                {institutionType === 'school' && s.isClassTeacher && s.classTeacherOf && (
                                                    <p className="text-[0.6875rem] mt-0.5" style={{ color: 'var(--primary-500)' }}>
                                                        CT: {s.classTeacherOf.class}-{s.classTeacherOf.section}
                                                    </p>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-mono flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                                        <Phone size={10} style={{ color: 'var(--text-muted)' }} />
                                                        {s.phone}
                                                    </span>
                                                    {s.email && (
                                                        <span className="text-[0.6875rem] flex items-center gap-1 truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>
                                                            <Mail size={10} />
                                                            {s.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {institutionType === 'school' ? (
                                                    (s.sections?.length ?? 0) > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {s.sections!.map(sec => (
                                                                <span key={sec} className="badge badge-brand" style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                                                                    {sec}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)' }}>—</span>
                                                    )
                                                ) : (
                                                    (s.batchIds?.length ?? 0) > 0 ? (
                                                        <span className="badge badge-success text-[0.625rem]">
                                                            {s.batchIds!.length} batch{s.batchIds!.length > 1 ? 'es' : ''}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-light)' }}>—</span>
                                                    )
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button" 
                                                    onClick={() => setShowPermissions(s)}
                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-[var(--radius-sm)] border transition-colors"
                                                    style={{ background: 'var(--bg-muted)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                                                    aria-label={`Manage modules for ${s.fullName}`}
                                                >
                                                    <Shield size={10} />
                                                    {s.allowedModules?.length ?? 0} modules
                                                </button>
                                            </td>
                                            <td><StatusBadge status={s.status} /></td>
                                            <td>
                                                <button
                                                    type="button" 
                                                    onClick={e => handleActionClick(e, s._id)}
                                                    className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center border transition-colors"
                                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                                    aria-label={`Actions for ${s.fullName}`}
                                                    aria-haspopup="menu"
                                                    aria-expanded={actionMenu?.id === s._id}
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button" 
                                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                                        disabled={page === 1}
                                        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center border transition-colors disabled:opacity-40"
                                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        type="button" 
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                        disabled={page === totalPages}
                                        className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center border transition-colors disabled:opacity-40"
                                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Action Menu */}
            {actionMenu && (
                <Portal>
                    <div className="fixed inset-0 z-[100]" onClick={() => setActionMenu(null)} aria-hidden="true" />
                    <div
                        role="menu"
                        className="fixed w-48 rounded-[var(--radius-lg)] border py-1.5 z-[101]"
                        style={{ 
                            top: `${actionMenu.position.top}px`, 
                            left: `${actionMenu.position.left}px`, 
                            background: 'var(--bg-card)', 
                            borderColor: 'var(--border)', 
                            boxShadow: 'var(--shadow-dropdown)' 
                        }}
                    >
                        {(() => {
                            const s = staff.find(x => x._id === actionMenu.id)
                            if (!s) return null
                            return (
                                <>
                                    <button 
                                        role="menuitem" 
                                        type="button" 
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left" 
                                        style={{ color: 'var(--text-secondary)' }} 
                                        onClick={() => { setShowView(s); setActionMenu(null) }} 
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')} 
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Eye size={14} style={{ color: 'var(--info)' }} /> View Profile
                                    </button>
                                    <button 
                                        role="menuitem" 
                                        type="button" 
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left" 
                                        style={{ color: 'var(--text-secondary)' }} 
                                        onClick={() => { setShowEdit(s); setActionMenu(null) }} 
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')} 
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Edit size={14} style={{ color: 'var(--primary-500)' }} /> Edit Details
                                    </button>
                                    <button 
                                        role="menuitem" 
                                        type="button" 
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left" 
                                        style={{ color: 'var(--text-secondary)' }} 
                                        onClick={() => { setShowPermissions(s); setActionMenu(null) }} 
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-muted)')} 
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <Shield size={14} style={{ color: 'var(--warning)' }} /> Module Access
                                    </button>
                                    <div className="h-px mx-2 my-1" style={{ background: 'var(--border)' }} />
                                    {s.status === 'active' && (
                                        <button 
                                            role="menuitem" 
                                            type="button" 
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left" 
                                            style={{ color: 'var(--danger-dark)' }} 
                                            onClick={() => handleStatusChange(s._id, 'inactive')} 
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-light)')} 
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <UserX size={14} /> Deactivate
                                        </button>
                                    )}
                                    {s.status === 'inactive' && (
                                        <button 
                                            role="menuitem" 
                                            type="button" 
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left" 
                                            style={{ color: 'var(--success-dark)' }} 
                                            onClick={() => handleStatusChange(s._id, 'active')} 
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--success-light)')} 
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <UserCheck size={14} /> Activate
                                        </button>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                </Portal>
            )}

            {/* Modals */}
            <AddStaffModal 
                open={showAdd} 
                onClose={() => setShowAdd(false)} 
                onSuccess={msg => { 
                    setShowAdd(false)
                    fetchStaff()
                    showToast('success', 'Staff Added', msg) 
                }}
                institutionType={institutionType}
            />
            
            {showEdit && (
                <EditStaffModal 
                    staff={showEdit} 
                    onClose={() => setShowEdit(null)} 
                    onSuccess={msg => { 
                        setShowEdit(null)
                        fetchStaff()
                        showToast('success', 'Staff Updated', msg) 
                    }}
                    institutionType={institutionType}
                />
            )}
            
            {showPermissions && (
                <PermissionsModal 
                    staff={showPermissions} 
                    onClose={() => setShowPermissions(null)} 
                    onSuccess={() => { 
                        setShowPermissions(null)
                        fetchStaff()
                        showToast('success', 'Permissions Updated', 'Module access saved') 
                    }}
                />
            )}
            
            {showView && (
                <ViewStaffModal 
                    staff={showView} 
                    onClose={() => setShowView(null)}
                    institutionType={institutionType}
                />
            )}

            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
    )
}