// FILE: src/app/(dashboard)/admin/teachers/page.tsx
// Complete Teacher & Staff Management Page
// Design: Uses portal CSS classes, modern UI, real fields

'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Button, Badge, Card, Table, Tr, Td,
    PageHeader, Modal, Input, Select, Alert,
    EmptyState, Spinner, StatCard,
} from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import {
    Users, UserCheck, UserPlus, Search, Filter,
    MoreVertical, Eye, Edit, Trash2, Shield,
    ChevronLeft, ChevronRight, Download, Phone,
    Mail, Calendar, Briefcase, X, Check,
    AlertCircle, Building2, Clock, UserX,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

/* ── Types ── */
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
    staffCategory: 'teaching' | 'non_teaching' | 'admin' | 'support'
    designation: string
    department: string
    qualification: string
    joiningDate: string
    basicSalary: number
    grossSalary?: number
    subjects?: string[]
    classes?: string[]
    isClassTeacher?: boolean
    classTeacherOf?: { class: string; section: string }
    allowedModules: string[]
    status: 'active' | 'inactive' | 'on_leave' | 'resigned' | 'terminated'
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

const STAFF_CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'teaching', label: 'Teaching Staff' },
    { value: 'non_teaching', label: 'Non-Teaching' },
    { value: 'admin', label: 'Administrative' },
    { value: 'support', label: 'Support Staff' },
]

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'resigned', label: 'Resigned' },
    { value: 'terminated', label: 'Terminated' },
]

const DESIGNATIONS = [
    'Principal', 'Vice Principal',
    'PGT (Post Graduate Teacher)', 'TGT (Trained Graduate Teacher)',
    'PRT (Primary Teacher)', 'NTT (Nursery Teacher)',
    'Lab Assistant', 'Librarian', 'PTI (Physical Training Instructor)',
    'Computer Teacher', 'Art Teacher', 'Music Teacher',
    'Accountant', 'Clerk', 'Office Assistant',
    'Peon', 'Security Guard', 'Driver', 'Sweeper',
    'Counselor', 'Nurse', 'Other',
]

const DEPARTMENTS = [
    'Science', 'Mathematics', 'English', 'Hindi', 'Social Science',
    'Computer Science', 'Commerce', 'Arts', 'Physical Education',
    'Administration', 'Accounts', 'Library', 'Laboratory',
    'Transport', 'Maintenance', 'Security', 'Other',
]

const QUALIFICATIONS = [
    'Ph.D', 'M.Ed', 'B.Ed', 'M.A', 'M.Sc', 'M.Com', 'MBA',
    'B.A', 'B.Sc', 'B.Com', 'BCA', 'B.Tech',
    'D.El.Ed', 'NTT Diploma', '12th Pass', '10th Pass', 'Other',
]

const SUBJECTS = [
    'Mathematics', 'Science', 'English', 'Hindi', 'Social Science',
    'Computer Science', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Political Science',
    'Accountancy', 'Business Studies', 'Physical Education',
    'Art & Craft', 'Music', 'Sanskrit', 'Urdu',
    'Environmental Studies', 'General Knowledge', 'Moral Science',
]

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D', 'E']

/* ══════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════ */
export default function TeachersStaffPage() {
    const { data: session } = useSession()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [stats, setStats] = useState<StaffStats>({ total: 0, active: 0, onLeave: 0, inactive: 0 })
    const [departments, setDepartments] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterDept, setFilterDept] = useState('')

    // Modals
    const [showAdd, setShowAdd] = useState(false)
    const [showPermissions, setShowPermissions] = useState<StaffMember | null>(null)
    const [showView, setShowView] = useState<StaffMember | null>(null)
    const [actionMenu, setActionMenu] = useState<string | null>(null)

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Auto-clear alert
    useEffect(() => {
        if (alert) {
            const t = setTimeout(() => setAlert(null), 5000)
            return () => clearTimeout(t)
        }
    }, [alert])

    // Fetch staff
    const fetchStaff = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (filterCategory) params.set('category', filterCategory)
            if (filterStatus) params.set('status', filterStatus)
            if (filterDept) params.set('department', filterDept)
            params.set('page', String(page))
            params.set('limit', '25')

            const res = await fetch(`/api/staff?${params.toString()}`)
            const data = await res.json()

            if (res.ok) {
                setStaff(data.staff || [])
                setStats(data.stats || { total: 0, active: 0, onLeave: 0, inactive: 0 })
                setDepartments(data.departments || [])
                setTotalPages(data.pagination?.totalPages || 1)
            }
        } catch (err) {
            console.error('Failed to fetch staff:', err)
        }
        setLoading(false)
    }, [search, filterCategory, filterStatus, filterDept, page])

    useEffect(() => { fetchStaff() }, [fetchStaff])

    // Debounced search
    const [searchInput, setSearchInput] = useState('')
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
        }, 400)
        return () => clearTimeout(t)
    }, [searchInput])

    // Status change handler
    const handleStatusChange = async (staffId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/staff/${staffId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
                setAlert({ type: 'success', msg: 'Status updated successfully' })
                fetchStaff()
            } else {
                const data = await res.json()
                setAlert({ type: 'error', msg: data.error || 'Failed to update status' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Network error' })
        }
        setActionMenu(null)
    }

    // Category badge
    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'teaching': return <Badge variant="purple">Teaching</Badge>
            case 'non_teaching': return <Badge variant="info">Non-Teaching</Badge>
            case 'admin': return <Badge variant="warning">Admin</Badge>
            case 'support': return <Badge variant="default">Support</Badge>
            default: return <Badge variant="default">{cat}</Badge>
        }
    }

    // Status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge variant="success">Active</Badge>
            case 'on_leave': return <Badge variant="warning">On Leave</Badge>
            case 'inactive': return <Badge variant="danger">Inactive</Badge>
            case 'resigned': return <Badge variant="default">Resigned</Badge>
            case 'terminated': return <Badge variant="danger">Terminated</Badge>
            default: return <Badge variant="default">{status}</Badge>
        }
    }

    return (
        <div className="portal-content-enter">
            {/* ── Page Header ── */}
            <PageHeader
                title="Teachers & Staff"
                subtitle={`Manage all ${stats.total} staff members`}
                action={
                    <Button size="sm" onClick={() => setShowAdd(true)}>
                        <UserPlus size={14} />
                        Add Staff
                    </Button>
                }
            />

            {/* ── Alert ── */}
            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="Total Staff"
                    value={stats.total}
                    icon={<Users size={18} />}
                    color="indigo"
                />
                <StatCard
                    label="Active"
                    value={stats.active}
                    icon={<UserCheck size={18} />}
                    color="emerald"
                />
                <StatCard
                    label="On Leave"
                    value={stats.onLeave}
                    icon={<Clock size={18} />}
                    color="amber"
                />
                <StatCard
                    label="Inactive"
                    value={stats.inactive}
                    icon={<UserX size={18} />}
                    color="red"
                />
            </div>

            {/* ── Filters Bar ── */}
            <Card className="mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="portal-search flex-1">
                        <Search size={15} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, employee ID..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <select
                        className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                        value={filterCategory}
                        onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                    >
                        {STAFF_CATEGORIES.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                    >
                        {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                    {/* Department Filter */}
                    {departments.length > 0 && (
                        <select
                            className="h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 cursor-pointer focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                            value={filterDept}
                            onChange={e => { setFilterDept(e.target.value); setPage(1) }}
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    )}
                </div>
            </Card>

            {/* ── Staff Table ── */}
            <Card padding={false}>
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner size="lg" />
                    </div>
                ) : staff.length === 0 ? (
                    <EmptyState
                        icon={<Users size={24} />}
                        title="No staff members found"
                        description={search || filterCategory || filterStatus || filterDept
                            ? 'Try adjusting your filters'
                            : 'Add your first staff member to get started'}
                        action={
                            !search && !filterCategory && !filterStatus && !filterDept ? (
                                <Button size="sm" onClick={() => setShowAdd(true)}>
                                    <UserPlus size={14} /> Add Staff
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <>
                        <Table headers={['Employee', 'Category', 'Department', 'Designation', 'Contact', 'Modules', 'Status', 'Actions']}>
                            {staff.map(s => (
                                <Tr key={s._id}>
                                    {/* Employee */}
                                    <Td>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-600 text-sm font-semibold flex-shrink-0 border border-indigo-100">
                                                {s.firstName?.charAt(0)}{s.lastName?.charAt(0) || ''}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">
                                                    {s.fullName}
                                                </p>
                                                <p className="text-[0.6875rem] text-slate-400 font-mono">
                                                    {s.employeeId}
                                                </p>
                                            </div>
                                        </div>
                                    </Td>

                                    {/* Category */}
                                    <Td>{getCategoryBadge(s.staffCategory)}</Td>

                                    {/* Department */}
                                    <Td>
                                        <span className="text-sm text-slate-600">{s.department}</span>
                                    </Td>

                                    {/* Designation */}
                                    <Td>
                                        <span className="text-sm text-slate-600">{s.designation}</span>
                                        {s.isClassTeacher && s.classTeacherOf && (
                                            <p className="text-[0.6875rem] text-indigo-500 mt-0.5">
                                                CT: Class {s.classTeacherOf.class}-{s.classTeacherOf.section}
                                            </p>
                                        )}
                                    </Td>

                                    {/* Contact */}
                                    <Td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm text-slate-600 font-mono flex items-center gap-1">
                                                <Phone size={10} className="text-slate-400" />
                                                {s.phone}
                                            </span>
                                            {s.email && (
                                                <span className="text-[0.6875rem] text-slate-400 flex items-center gap-1 truncate max-w-[160px]">
                                                    <Mail size={10} />
                                                    {s.email}
                                                </span>
                                            )}
                                        </div>
                                    </Td>

                                    {/* Modules Access */}
                                    <Td>
                                        <button
                                            onClick={() => setShowPermissions(s)}
                                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                                        >
                                            <Shield size={10} />
                                            {s.allowedModules?.length || 0} modules
                                        </button>
                                    </Td>

                                    {/* Status */}
                                    <Td>{getStatusBadge(s.status)}</Td>

                                    {/* Actions */}
                                    <Td>
                                        <div className="relative">
                                            <button
                                                onClick={() => setActionMenu(actionMenu === s._id ? null : s._id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                            >
                                                <MoreVertical size={14} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {actionMenu === s._id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1 animate-dropdown">
                                                        <button
                                                            onClick={() => { setShowView(s); setActionMenu(null) }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Eye size={14} /> View Profile
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowPermissions(s); setActionMenu(null) }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Shield size={14} /> Manage Access
                                                        </button>
                                                        <div className="border-t border-slate-100 my-1" />
                                                        {s.status === 'active' && (
                                                            <button
                                                                onClick={() => handleStatusChange(s._id, 'inactive')}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                            >
                                                                <UserX size={14} /> Deactivate
                                                            </button>
                                                        )}
                                                        {s.status === 'inactive' && (
                                                            <button
                                                                onClick={() => handleStatusChange(s._id, 'active')}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                            >
                                                                <UserCheck size={14} /> Activate
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* ── Modals ── */}
            <Portal>
                {/* Add Staff Modal */}
                <AddStaffModal
                    open={showAdd}
                    onClose={() => setShowAdd(false)}
                    onSuccess={(msg) => {
                        setShowAdd(false)
                        fetchStaff()
                        setAlert({ type: 'success', msg })
                    }}
                />

                {/* Permissions Modal */}
                {showPermissions && (
                    <PermissionsModal
                        staff={showPermissions}
                        onClose={() => setShowPermissions(null)}
                        onSuccess={() => {
                            setShowPermissions(null)
                            fetchStaff()
                            setAlert({ type: 'success', msg: 'Permissions updated!' })
                        }}
                    />
                )}

                {/* View Profile Modal */}
                {showView && (
                    <ViewStaffModal
                        staff={showView}
                        onClose={() => setShowView(null)}
                    />
                )}
            </Portal>
        </div>
    )
}


/* ══════════════════════════════════════════════════
   ADD STAFF MODAL — Multi-step Form
   ══════════════════════════════════════════════════ */
function AddStaffModal({
    open, onClose, onSuccess,
}: {
    open: boolean
    onClose: () => void
    onSuccess: (msg: string) => void
}) {
    const [step, setStep] = useState(1)
    const totalSteps = 4
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        // Step 1: Personal
        firstName: '', lastName: '', phone: '', email: '',
        gender: 'male', dateOfBirth: '', bloodGroup: '',
        // Step 2: Professional
        staffCategory: 'teaching', designation: '', department: '',
        qualification: '', specialization: '', experience: '',
        joiningDate: new Date().toISOString().split('T')[0],
        previousSchool: '',
        role: 'staff', // 'staff' or 'teacher'
        // Step 3: Teaching (if category = teaching)
        subjects: [] as string[],
        classes: [] as string[],
        isClassTeacher: false,
        classTeacherClass: '', classTeacherSection: '',
        // Step 4: Address & Emergency
        currentAddress: '', city: '', state: '', pincode: '',
        emergencyContactName: '', emergencyContactPhone: '',
        emergencyContactRelation: '',
        password: '',
        // Module permissions
        allowedModules: [] as string[],
        basicSalary: '',
    })

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

    const toggleItem = (field: 'subjects' | 'classes', item: string) => {
        setForm(f => ({
            ...f,
            [field]: f[field].includes(item)
                ? f[field].filter(i => i !== item)
                : [...f[field], item],
        }))
    }

    // Validation per step
    const canProceed = () => {
        switch (step) {
            case 1:
                return form.firstName.trim() && form.phone.trim() && form.gender
            case 2:
                return form.staffCategory && form.designation && form.department && form.qualification && form.joiningDate
            case 3:
                return true // optional
            case 4:
                return form.currentAddress.trim() && form.emergencyContactName.trim() && form.emergencyContactPhone.trim()
            default:
                return true
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        const payload: any = {
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

        // Teaching-specific
        if (form.staffCategory === 'teaching') {
            payload.subjects = form.subjects
            payload.classes = form.classes
            payload.isClassTeacher = form.isClassTeacher
            if (form.isClassTeacher && form.classTeacherClass) {
                payload.classTeacherOf = {
                    class: form.classTeacherClass,
                    section: form.classTeacherSection || 'A',
                }
            }
        }

        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Something went wrong')
                setLoading(false)
                return
            }

            // Reset
            setStep(1)
            setForm({
                firstName: '', lastName: '', phone: '', email: '',
                gender: 'male', dateOfBirth: '', bloodGroup: '',
                staffCategory: 'teaching', designation: '', department: '',
                qualification: '', specialization: '', experience: '',
                joiningDate: new Date().toISOString().split('T')[0],
                previousSchool: '', role: 'staff',
                subjects: [], classes: [],
                isClassTeacher: false, classTeacherClass: '', classTeacherSection: '',
                currentAddress: '', city: '', state: '', pincode: '',
                emergencyContactName: '', emergencyContactPhone: '',
                emergencyContactRelation: '', password: '',
                allowedModules: [], basicSalary: '',
            })
            onSuccess(data.message || 'Staff added successfully!')
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    if (!open) return null

    const stepLabels = ['Personal Info', 'Professional', 'Teaching Details', 'Address & Contact']

    return (
        <Modal open={open} onClose={onClose} title="Add Staff Member" size="lg">
            {/* Step Indicator */}
            <div className="flex items-center gap-1 mb-5">
                {stepLabels.map((label, i) => (
                    <div key={i} className="flex-1">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0 transition-colors ${step > i + 1
                                    ? 'bg-emerald-500 text-white'
                                    : step === i + 1
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-400'
                                }`}>
                                {step > i + 1 ? <Check size={10} /> : i + 1}
                            </div>
                            <span className={`text-[0.6875rem] font-medium truncate hidden sm:block ${step === i + 1 ? 'text-indigo-600' : 'text-slate-400'
                                }`}>
                                {label}
                            </span>
                        </div>
                        {i < stepLabels.length - 1 && (
                            <div className={`h-0.5 mt-1 rounded-full transition-colors ${step > i + 1 ? 'bg-emerald-500' : 'bg-slate-100'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); step === totalSteps ? handleSubmit() : setStep(s => s + 1) }}>
                {/* Step 1: Personal */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="First Name *" placeholder="Sunita" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                            <Input label="Last Name" placeholder="Devi" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                            <Input label="Phone Number *" placeholder="9222222222" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                            <Input label="Email" type="email" placeholder="teacher@school.com" value={form.email} onChange={e => set('email', e.target.value)} />
                            <Select label="Gender *" value={form.gender} onChange={e => set('gender', e.target.value)}
                                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
                            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                            <Select label="Blood Group" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}
                                options={[{ value: '', label: 'Select' }, ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ value: v, label: v }))]} />
                            <div>
                                <Input label="Password" type="password" placeholder="Default: phone number" value={form.password} onChange={e => set('password', e.target.value)}
                                    helper="Leave blank → phone number becomes password" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Professional */}
                {step === 2 && (
                    <div className="space-y-4">
                        {/* Role Selection */}
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-2">Login Role *</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => set('role', 'teacher')}
                                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${form.role === 'teacher'
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}>
                                    <UserCheck size={16} className="inline mr-1.5" />
                                    Teacher
                                    <p className="text-[0.625rem] font-normal mt-0.5 text-slate-400">
                                        Gets default teacher module access
                                    </p>
                                </button>
                                <button type="button" onClick={() => set('role', 'staff')}
                                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${form.role === 'staff'
                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}>
                                    <Shield size={16} className="inline mr-1.5" />
                                    Staff
                                    <p className="text-[0.625rem] font-normal mt-0.5 text-slate-400">
                                        Only sees modules you allow
                                    </p>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Category *" value={form.staffCategory} onChange={e => set('staffCategory', e.target.value)}
                                options={[
                                    { value: 'teaching', label: 'Teaching Staff' },
                                    { value: 'non_teaching', label: 'Non-Teaching Staff' },
                                    { value: 'admin', label: 'Administrative Staff' },
                                    { value: 'support', label: 'Support Staff' },
                                ]} />
                            <Select label="Designation *" value={form.designation} onChange={e => set('designation', e.target.value)}
                                options={[{ value: '', label: 'Select Designation' }, ...DESIGNATIONS.map(d => ({ value: d, label: d }))]} />
                            <Select label="Department *" value={form.department} onChange={e => set('department', e.target.value)}
                                options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]} />
                            <Select label="Qualification *" value={form.qualification} onChange={e => set('qualification', e.target.value)}
                                options={[{ value: '', label: 'Select' }, ...QUALIFICATIONS.map(q => ({ value: q, label: q }))]} />
                            <Input label="Specialization" placeholder="e.g., Physics" value={form.specialization} onChange={e => set('specialization', e.target.value)} />
                            <Input label="Experience (years)" type="number" placeholder="5" value={form.experience} onChange={e => set('experience', e.target.value)} />
                            <Input label="Joining Date *" type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} required />
                            <Input label="Monthly Salary (₹)" type="number" placeholder="25000" value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Step 3: Teaching Details */}
                {step === 3 && (
                    <div className="space-y-4">
                        {form.staffCategory !== 'teaching' ? (
                            <div className="text-center py-8 text-slate-400">
                                <Briefcase size={32} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-sm font-medium text-slate-500">Non-teaching staff</p>
                                <p className="text-xs mt-1">Teaching details are not required. Click Next to continue.</p>
                            </div>
                        ) : (
                            <>
                                {/* Subjects */}
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-2">Subjects Taught</label>
                                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                                        {SUBJECTS.map(sub => (
                                            <button key={sub} type="button" onClick={() => toggleItem('subjects', sub)}
                                                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${form.subjects.includes(sub)
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                                    }`}>
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Classes */}
                                <div>
                                    <label className="text-xs font-medium text-slate-600 block mb-2">Classes Assigned</label>
                                    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        {CLASSES.map(cls => (
                                            <button key={cls} type="button" onClick={() => toggleItem('classes', cls)}
                                                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${form.classes.includes(cls)
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                                    }`}>
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Class Teacher */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.isClassTeacher}
                                            onChange={e => set('isClassTeacher', e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm text-slate-600 font-medium">Is Class Teacher</span>
                                    </label>
                                    {form.isClassTeacher && (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <Select value={form.classTeacherClass} onChange={e => set('classTeacherClass', e.target.value)}
                                                options={[{ value: '', label: 'Class' }, ...CLASSES.map(c => ({ value: c, label: c }))]} />
                                            <Select value={form.classTeacherSection} onChange={e => set('classTeacherSection', e.target.value)}
                                                options={SECTIONS.map(s => ({ value: s, label: s }))} />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 4: Address & Emergency */}
                {step === 4 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <Input label="Current Address *" placeholder="House No, Street, Area" value={form.currentAddress} onChange={e => set('currentAddress', e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="City" placeholder="Varanasi" value={form.city} onChange={e => set('city', e.target.value)} />
                            <Input label="State" placeholder="Uttar Pradesh" value={form.state} onChange={e => set('state', e.target.value)} />
                            <Input label="Pincode" placeholder="221001" value={form.pincode} onChange={e => set('pincode', e.target.value)} />
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Emergency Contact</p>
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Contact Name *" placeholder="Father's Name" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} required />
                                <Input label="Contact Phone *" placeholder="9111111111" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} required />
                                <Input label="Relation" placeholder="Father / Spouse" value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && <Alert type="error" message={error} onClose={() => setError('')} />}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <div>
                        {step > 1 && (
                            <Button variant="ghost" type="button" size="sm" onClick={() => setStep(s => s - 1)}>
                                <ChevronLeft size={14} /> Back
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" type="button" size="sm" onClick={onClose}>Cancel</Button>
                        {step < totalSteps ? (
                            <Button type="submit" size="sm" disabled={!canProceed()}>
                                Next <ChevronRight size={14} />
                            </Button>
                        ) : (
                            <Button type="submit" size="sm" loading={loading} disabled={!canProceed()}>
                                <UserPlus size={14} /> Add Staff
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    )
}


/* ══════════════════════════════════════════════════
   PERMISSIONS MODAL — Module Access Control
   ══════════════════════════════════════════════════ */
function PermissionsModal({
    staff, onClose, onSuccess,
}: {
    staff: StaffMember
    onClose: () => void
    onSuccess: () => void
}) {
    const [modules, setModules] = useState<AssignableModule[]>([])
    const [selected, setSelected] = useState<string[]>(staff.allowedModules || [])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    // Fetch assignable modules
    useEffect(() => {
        fetch('/api/staff/permissions')
            .then(r => r.json())
            .then(data => {
                setModules(data.modules || [])
                setFetching(false)
            })
            .catch(() => setFetching(false))
    }, [])

    const toggleModule = (key: string) => {
        setSelected(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        )
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/staff/permissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId: staff._id, allowedModules: selected }),
            })
            if (res.ok) {
                onSuccess()
            }
        } catch { }
        setLoading(false)
    }

    return (
        <Modal open={true} onClose={onClose} title={`Module Access — ${staff.fullName}`} size="lg">
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">
                    <AlertCircle size={12} className="inline mr-1" />
                    <strong>{staff.fullName}</strong> will only see the modules you enable below.
                    They can view and manage data within those modules using the admin panel.
                </p>
            </div>

            {fetching ? (
                <div className="flex justify-center py-8"><Spinner size="md" /></div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {modules.map(mod => {
                        const isActive = selected.includes(mod.key)
                        return (
                            <button
                                key={mod.key}
                                type="button"
                                onClick={() => toggleModule(mod.key)}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${isActive
                                        ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-indigo-600' : 'bg-slate-100'
                                    }`}>
                                    {isActive ? (
                                        <Check size={14} className="text-white" />
                                    ) : (
                                        <div className="w-3 h-3 rounded border-2 border-slate-300" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>
                                        {mod.label}
                                    </p>
                                    <p className="text-[0.625rem] text-slate-400 mt-0.5 line-clamp-1">
                                        {mod.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                    {selected.length} module{selected.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} loading={loading}>
                        Save Permissions
                    </Button>
                </div>
            </div>
        </Modal>
    )
}


/* ══════════════════════════════════════════════════
   VIEW STAFF MODAL — Quick Profile View
   ══════════════════════════════════════════════════ */
function ViewStaffModal({
    staff, onClose,
}: {
    staff: StaffMember
    onClose: () => void
}) {
    return (
        <Modal open={true} onClose={onClose} title="Staff Profile" size="lg">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0) || ''}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">{staff.fullName}</h3>
                        <p className="text-sm text-slate-500">{staff.designation} • {staff.department}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{staff.employeeId}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <DetailItem label="Category" value={staff.staffCategory?.replace('_', '-')} />
                    <DetailItem label="Gender" value={staff.gender} />
                    <DetailItem label="Phone" value={staff.phone} />
                    <DetailItem label="Email" value={staff.email || '-'} />
                    <DetailItem label="Qualification" value={staff.qualification} />
                    <DetailItem label="Joining Date" value={staff.joiningDate ? new Date(staff.joiningDate).toLocaleDateString('en-IN') : '-'} />
                    <DetailItem label="Salary" value={staff.basicSalary ? `₹${staff.basicSalary.toLocaleString('en-IN')}` : '-'} />
                    <DetailItem label="Status" value={staff.status} />
                </div>

                {/* Subjects */}
                {staff.subjects && staff.subjects.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Subjects</p>
                        <div className="flex flex-wrap gap-1.5">
                            {staff.subjects.map(sub => (
                                <Badge key={sub} variant="info">{sub}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Classes */}
                {staff.classes && staff.classes.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Classes</p>
                        <div className="flex flex-wrap gap-1.5">
                            {staff.classes.map(cls => (
                                <Badge key={cls} variant="purple">Class {cls}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Module Access */}
                <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Module Access</p>
                    <div className="flex flex-wrap gap-1.5">
                        {staff.allowedModules?.length > 0 ? (
                            staff.allowedModules.map(mod => (
                                <Badge key={mod} variant="success">{mod}</Badge>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400">No specific modules assigned (uses role default)</span>
                        )}
                    </div>
                </div>

                {/* Class Teacher */}
                {staff.isClassTeacher && staff.classTeacherOf && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-700 font-medium">
                            📚 Class Teacher of Class {staff.classTeacherOf.class}-{staff.classTeacherOf.section}
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    )
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[0.6875rem] text-slate-400">{label}</p>
            <p className="text-sm text-slate-700 font-medium capitalize">{value || '-'}</p>
        </div>
    )
}