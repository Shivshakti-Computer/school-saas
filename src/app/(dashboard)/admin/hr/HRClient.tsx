'use client'

import { useEffect, useState, useCallback } from 'react'
import {
    Briefcase, Plus, DollarSign, Calendar,
    Users, Search, Filter, RefreshCw,
    ChevronDown, CheckCircle, XCircle,
    Mail, MessageSquare, Download,
    AlertTriangle, Settings, UserCheck,
    TrendingUp, Clock,
    BookOpen,
} from 'lucide-react'
import {
    Button, Card, Table, Tr, Td, Badge,
    Modal, Input, Select, Spinner,
    EmptyState, StatCard, Alert, PageHeader,
} from '@/components/ui'
import { Portal } from '@/components/ui/Portal'
import Link from 'next/link'

// ── Types ──
interface StaffRecord {
    _id: string
    employeeId: string
    firstName: string
    lastName: string
    fullName: string
    gender: string
    staffCategory: string
    designation: string
    department: string
    qualification: string
    phone: string
    email?: string
    currentAddress: string
    emergencyContactName: string
    emergencyContactPhone: string
    basicSalary: number
    grossSalary: number
    netSalary: number
    allowances: {
        hra: number; da: number; ta: number
        medical: number; special: number; other: number
    }
    deductions: {
        pf: number; esi: number; professionalTax: number
        tds: number; other: number
    }
    joiningDate: string
    status: string
    leaveBalance: {
        casual: number; sick: number; earned: number
        maternity: number; paternity: number; unpaid: number
    }
    userId: { name: string; email: string; phone: string }
    allowedModules: string[]
}

interface HRStats {
    total: number
    active: number
    inactive: number
    onLeave: number
    teaching: number
    nonTeaching: number
    totalMonthlySalary: number
    departments: string[]
}

interface SalarySlip {
    staffId: string
    employeeId: string
    name: string
    designation: string
    department: string
    month: string
    earnings: {
        basic: number; hra: number; da: number; ta: number
        medical: number; special: number; otherAllowances: number; gross: number
    }
    deductions: {
        pf: number; esi: number; professionalTax: number
        tds: number; otherDeductions: number; total: number
    }
    netPay: number
    bankAccount?: string
    workingDays: number
    presentDays: number
}

interface LeaveRecord {
    _id: string
    employeeId: string
    fullName: string
    designation: string
    department: string
    leaveBalance: {
        casual: number; sick: number; earned: number
        maternity: number; paternity: number; unpaid: number
    }
}

interface LeavePolicy {
    casualLeavesPerYear: number
    sickLeavesPerYear: number
    earnedLeavesPerYear: number
}

// ── Constants ──
const DEPARTMENTS = [
    'Administration', 'Science', 'Mathematics', 'English', 'Hindi',
    'Social Studies', 'Computer', 'Physical Education', 'Art',
    'Library', 'Accounts', 'Support', 'Other',
]

const DESIGNATIONS = [
    'Principal', 'Vice Principal', 'HOD', 'PGT', 'TGT', 'PRT',
    'Class Teacher', 'Subject Teacher', 'Librarian', 'Lab Assistant',
    'Accountant', 'Clerk', 'Peon', 'Security', 'Driver', 'Nurse', 'Other',
]

const STAFF_CATEGORIES = [
    { value: 'teaching', label: 'Teaching Staff' },
    { value: 'non_teaching', label: 'Non-Teaching Staff' },
    { value: 'admin', label: 'Administration' },
    { value: 'support', label: 'Support Staff' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: any }> = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'danger' },
    on_leave: { label: 'On Leave', variant: 'warning' },
    resigned: { label: 'Resigned', variant: 'danger' },
    terminated: { label: 'Terminated', variant: 'danger' },
}

// ── Initial form state ──
const INITIAL_FORM = {
    userId: '',
    employeeId: '',
    firstName: '',
    lastName: '',
    gender: 'male',
    staffCategory: 'teaching',
    designation: 'Subject Teacher',
    department: 'Science',
    qualification: '',
    phone: '',
    currentAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    basicSalary: '',
    joiningDate: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
    pfNumber: '',
    experience: '',
}

type TabType = 'staff' | 'salary' | 'leave'

export default function HRClient() {
    // ── State ──
    const [tab, setTab] = useState<TabType>('staff')
    const [staffList, setStaffList] = useState<StaffRecord[]>([])
    const [leaveStaff, setLeaveStaff] = useState<LeaveRecord[]>([])
    const [leavePolicy, setLeavePolicy] = useState<LeavePolicy | null>(null)
    const [stats, setStats] = useState<HRStats | null>(null)
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [leaveLoading, setLeaveLoading] = useState(false)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error' | 'warning' | 'info'
        msg: string
    } | null>(null)
    const [saving, setSaving] = useState(false)

    // Modals
    const [addModal, setAddModal] = useState(false)
    const [salaryModal, setSalaryModal] = useState(false)
    const [leaveModal, setLeaveModal] = useState<{
        staff: LeaveRecord | null
        open: boolean
    }>({ staff: null, open: false })

    // Salary
    const [salaryMonth, setSalaryMonth] = useState(
        new Date().toISOString().slice(0, 7)
    )
    const [workingDays, setWorkingDays] = useState('26')
    const [sendNotifications, setSendNotifications] = useState(false)
    const [salaryData, setSalaryData] = useState<{
        month: string
        totalStaff: number
        totalPayout: number
        notificationsSent: number
        slips: SalarySlip[]
        settings: {
            pfEnabled: boolean
            pfPercentage: number
            esiEnabled: boolean
            notificationsEnabled: boolean
        }
    } | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [filterDept, setFilterDept] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [filterCategory, setFilterCategory] = useState('')

    // Leave modal state
    const [leaveForm, setLeaveForm] = useState({
        leaveType: 'casual' as 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'unpaid',
        days: '1',
        reason: '',
        action: 'deduct' as 'deduct' | 'credit',
    })

    // Form
    const [form, setForm] = useState({ ...INITIAL_FORM })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // ── Data Fetching ──
    const fetchStaff = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (filterDept) params.set('department', filterDept)
            if (filterStatus) params.set('status', filterStatus)
            if (filterCategory) params.set('category', filterCategory)

            const res = await fetch(`/api/hr?${params}`)
            if (!res.ok) throw new Error('Failed to fetch staff')
            const data = await res.json()
            setStaffList(data.staff || [])
            setStats(data.stats)
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
    }, [search, filterDept, filterStatus, filterCategory])

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/users?role=teacher&limit=200')
            const data = await res.json()
            setTeachers(Array.isArray(data) ? data : data.users || [])
        } catch { /* silent */ }
    }

    const fetchLeaveData = async () => {
        setLeaveLoading(true)
        try {
            const res = await fetch('/api/hr/leave')
            if (!res.ok) throw new Error('Failed to fetch leave data')
            const data = await res.json()
            setLeaveStaff(data.staff || [])
            setLeavePolicy(data.leavePolicy || null)
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        } finally {
            setLeaveLoading(false)
        }
    }

    useEffect(() => {
        Promise.all([fetchStaff(), fetchTeachers()]).finally(() =>
            setLoading(false)
        )
    }, [])

    // Refetch on filter change
    useEffect(() => {
        if (!loading) fetchStaff()
    }, [search, filterDept, filterStatus, filterCategory])

    // Fetch leave data when tab changes
    useEffect(() => {
        if (tab === 'leave' && leaveStaff.length === 0) {
            fetchLeaveData()
        }
    }, [tab])

    // ── Handlers ──
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {}
        if (!form.userId) errors.userId = 'Select a teacher account'
        if (!form.employeeId.trim()) errors.employeeId = 'Employee ID is required'
        if (!form.firstName.trim()) errors.firstName = 'First name is required'
        if (!form.gender) errors.gender = 'Gender is required'
        if (!form.staffCategory) errors.staffCategory = 'Category is required'
        if (!form.designation.trim()) errors.designation = 'Designation is required'
        if (!form.department.trim()) errors.department = 'Department is required'
        if (!form.qualification.trim()) errors.qualification = 'Qualification is required'
        if (!form.phone.trim()) errors.phone = 'Phone is required'
        if (!form.currentAddress.trim()) errors.currentAddress = 'Address is required'
        if (!form.emergencyContactName.trim()) errors.emergencyContactName = 'Emergency contact name required'
        if (!form.emergencyContactPhone.trim()) errors.emergencyContactPhone = 'Emergency contact phone required'
        if (!form.joiningDate) errors.joiningDate = 'Joining date is required'

        const salary = Number(form.basicSalary)
        if (isNaN(salary) || salary < 0) errors.basicSalary = 'Valid salary required'

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleAddStaff = async () => {
        if (!validateForm()) return

        setSaving(true)
        try {
            const res = await fetch('/api/hr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    basicSalary: Number(form.basicSalary),
                    experience: Number(form.experience) || 0,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to add staff')

            setAlert({ type: 'success', msg: `Staff record created for ${data.staff.fullName}` })
            setAddModal(false)
            setForm({ ...INITIAL_FORM })
            setFormErrors({})
            await fetchStaff()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        } finally {
            setSaving(false)
        }
    }

    const handleGenerateSalary = async () => {
        if (!salaryMonth) {
            setAlert({ type: 'error', msg: 'Select a month' })
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/hr/salary/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: salaryMonth,
                    workingDays: parseInt(workingDays) || 26,
                    sendNotifications,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate salary')

            setSalaryData(data)
            setSalaryModal(false)
            setAlert({
                type: 'success',
                msg: `Salary generated for ${data.totalStaff} staff — Total: ₹${data.totalPayout.toLocaleString('en-IN')}${data.notificationsSent > 0 ? ` — ${data.notificationsSent} notifications sent` : ''}`,
            })
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        } finally {
            setSaving(false)
        }
    }

    const handleLeaveAction = async () => {
        if (!leaveModal.staff) return

        const days = parseFloat(leaveForm.days)
        if (!days || days < 0.5) {
            setAlert({ type: 'error', msg: 'Enter valid number of days (min 0.5)' })
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/hr/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staffId: leaveModal.staff._id,
                    leaveType: leaveForm.leaveType,
                    days,
                    reason: leaveForm.reason,
                    action: leaveForm.action,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')

            setAlert({ type: 'success', msg: data.message })
            setLeaveModal({ staff: null, open: false })
            setLeaveForm({ leaveType: 'casual', days: '1', reason: '', action: 'deduct' })
            await fetchLeaveData()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        } finally {
            setSaving(false)
        }
    }

    // ── Computed ──
    const filteredSalarySlips = salaryData?.slips || []

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <div className="space-y-5 portal-content-enter">

            {/* ── Page Header ── */}
            <PageHeader
                title="HR & Payroll"
                subtitle="Staff records, salary management, leave tracking"
                action={
                    <div className="flex items-center gap-2">
                        {/* ✅ NEW - Guide Link */}
                        <Link href="/admin/hr/guide">
                            <Button variant="ghost" size="sm">
                                <BookOpen size={14} />
                                Management Guide
                            </Button>
                        </Link>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchStaff()}
                        >
                            <RefreshCw size={14} />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setAddModal(true)}
                            size="sm"
                        >
                            <Plus size={14} />
                            Add Staff
                        </Button>
                    </div>
                }
            />

            {/* ── Alert ── */}
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.msg}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* ── Stats ── */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Staff"
                        value={stats.total}
                        icon={<Users size={18} />}
                        color="primary"
                    />
                    <StatCard
                        label="Active"
                        value={stats.active}
                        icon={<UserCheck size={18} />}
                        color="success"
                    />
                    <StatCard
                        label="Monthly Payroll"
                        value={`₹${(stats.totalMonthlySalary || 0).toLocaleString('en-IN')}`}
                        icon={<DollarSign size={18} />}
                        color="warning"
                    />
                    <StatCard
                        label="Departments"
                        value={stats.departments?.length || 0}
                        icon={<Briefcase size={18} />}
                        color="info"
                    />
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-1.5 p-1 bg-[var(--bg-muted)] rounded-[var(--radius-lg)] w-fit">
                {(
                    [
                        { key: 'staff', label: 'Staff Directory', icon: Users },
                        { key: 'salary', label: 'Salary & Payroll', icon: DollarSign },
                        { key: 'leave', label: 'Leave Management', icon: Calendar },
                    ] as const
                ).map(t => {
                    const Icon = t.icon
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`
                flex items-center gap-1.5 px-3.5 py-2
                rounded-[var(--radius-md)] text-sm font-semibold
                transition-all duration-150
                ${tab === t.key
                                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }
              `}
                        >
                            <Icon size={14} />
                            {t.label}
                        </button>
                    )
                })}
            </div>

            {/* ════════════════════════════════════════
          TAB: STAFF DIRECTORY
          ════════════════════════════════════════ */}
            {tab === 'staff' && (
                <div className="space-y-4">

                    {/* Filters */}
                    <Card padding={false}>
                        <div className="p-4 flex flex-wrap gap-3 items-end">
                            {/* Search */}
                            <div className="portal-search flex-1 min-w-[200px]">
                                <Search size={15} className="search-icon" />
                                <input
                                    placeholder="Search by name, employee ID..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="text-sm"
                                />
                            </div>

                            {/* Department filter */}
                            <select
                                value={filterDept}
                                onChange={e => setFilterDept(e.target.value)}
                                className="input-clean text-sm h-9 w-40"
                            >
                                <option value="">All Departments</option>
                                {DEPARTMENTS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            {/* Category filter */}
                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="input-clean text-sm h-9 w-44"
                            >
                                <option value="">All Categories</option>
                                {STAFF_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>

                            {/* Status filter */}
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="input-clean text-sm h-9 w-32"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="on_leave">On Leave</option>
                                <option value="resigned">Resigned</option>
                            </select>
                        </div>
                    </Card>

                    {/* Staff Table */}
                    {staffList.length === 0 ? (
                        <EmptyState
                            icon={<Briefcase size={24} />}
                            title="No staff records found"
                            description="Add staff HR records to manage payroll and leaves"
                            action={
                                <Button onClick={() => setAddModal(true)} size="sm">
                                    <Plus size={14} /> Add First Staff
                                </Button>
                            }
                        />
                    ) : (
                        <Card padding={false}>
                            <div className="portal-card-header">
                                <div>
                                    <p className="portal-card-title">Staff Directory</p>
                                    <p className="portal-card-subtitle">
                                        {staffList.length} records
                                        {filterDept || filterStatus || search ? ' (filtered)' : ''}
                                    </p>
                                </div>
                            </div>
                            <Table
                                headers={[
                                    'Emp ID', 'Name', 'Category',
                                    'Designation', 'Department', 'Basic Salary',
                                    'Net Salary', 'Joining Date', 'Status',
                                ]}
                            >
                                {staffList.map(s => {
                                    const status = STATUS_CONFIG[s.status] || STATUS_CONFIG.inactive
                                    return (
                                        <Tr key={s._id}>
                                            <Td>
                                                <span className="font-mono text-xs font-semibold text-[var(--primary-600)]">
                                                    {s.employeeId}
                                                </span>
                                            </Td>
                                            <Td>
                                                <div>
                                                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                                                        {s.fullName}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {s.phone}
                                                    </p>
                                                </div>
                                            </Td>
                                            <Td>
                                                <Badge variant="info">
                                                    {STAFF_CATEGORIES.find(c => c.value === s.staffCategory)?.label || s.staffCategory}
                                                </Badge>
                                            </Td>
                                            <Td className="text-sm">{s.designation}</Td>
                                            <Td>
                                                <Badge>{s.department}</Badge>
                                            </Td>
                                            <Td className="font-mono text-sm">
                                                ₹{(s.basicSalary || 0).toLocaleString('en-IN')}
                                            </Td>
                                            <Td className="font-mono text-sm font-semibold text-[var(--success-dark)]">
                                                ₹{(s.netSalary || 0).toLocaleString('en-IN')}
                                            </Td>
                                            <Td className="text-xs text-[var(--text-muted)]">
                                                {new Date(s.joiningDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </Td>
                                            <Td>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </Td>
                                        </Tr>
                                    )
                                })}
                            </Table>
                        </Card>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════
          TAB: SALARY & PAYROLL
          ════════════════════════════════════════ */}
            {tab === 'salary' && (
                <div className="space-y-4">

                    {/* Generate Salary Card */}
                    <Card>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="input-label mb-1.5">Payroll Month</label>
                                <input
                                    type="month"
                                    value={salaryMonth}
                                    onChange={e => setSalaryMonth(e.target.value)}
                                    className="input-clean"
                                />
                            </div>

                            <div className="w-32">
                                <label className="input-label mb-1.5">Working Days</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={workingDays}
                                    onChange={e => setWorkingDays(e.target.value)}
                                    className="input-clean"
                                />
                            </div>

                            <div className="flex items-center gap-2 pb-1">
                                <input
                                    type="checkbox"
                                    id="sendNotif"
                                    checked={sendNotifications}
                                    onChange={e => setSendNotifications(e.target.checked)}
                                    className="w-4 h-4 accent-[var(--primary-500)]"
                                />
                                <label
                                    htmlFor="sendNotif"
                                    className="text-sm text-[var(--text-secondary)] cursor-pointer"
                                >
                                    Send salary slip notifications
                                </label>
                            </div>

                            <Button
                                onClick={handleGenerateSalary}
                                loading={saving}
                                size="md"
                            >
                                <DollarSign size={15} />
                                Generate Payroll
                            </Button>
                        </div>

                        {sendNotifications && (
                            <div className="mt-3 p-3 bg-[var(--info-light)] border border-[rgba(59,130,246,0.15)] rounded-[var(--radius-md)] flex items-start gap-2">
                                <MessageSquare size={14} className="text-[var(--info)] flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-[var(--info-dark)]">
                                    Salary slip notifications will be sent based on your
                                    <strong> Settings → Notifications</strong> and
                                    <strong> Settings → Modules → HR</strong> configuration.
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Salary Data */}
                    {salaryData ? (
                        <div className="space-y-4">

                            {/* Summary */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label="Total Staff"
                                    value={salaryData.totalStaff}
                                    icon={<Users size={18} />}
                                    color="primary"
                                />
                                <StatCard
                                    label="Total Payout"
                                    value={`₹${salaryData.totalPayout.toLocaleString('en-IN')}`}
                                    icon={<DollarSign size={18} />}
                                    color="success"
                                />
                                <StatCard
                                    label="Month"
                                    value={new Date(salaryData.month + '-01').toLocaleString('en-IN', {
                                        month: 'short', year: 'numeric',
                                    })}
                                    icon={<Calendar size={18} />}
                                    color="info"
                                />
                                <StatCard
                                    label="Notifications Sent"
                                    value={salaryData.notificationsSent}
                                    icon={<Mail size={18} />}
                                    color="warning"
                                />
                            </div>

                            {/* Settings info */}
                            {(salaryData.settings.pfEnabled || salaryData.settings.esiEnabled) && (
                                <div className="flex items-center gap-3 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] text-xs text-[var(--text-muted)]">
                                    <Settings size={13} className="flex-shrink-0" />
                                    <span>
                                        Deductions applied from settings:
                                        {salaryData.settings.pfEnabled && ` PF ${salaryData.settings.pfPercentage}%`}
                                        {salaryData.settings.esiEnabled && ` • ESI`}
                                    </span>
                                </div>
                            )}

                            {/* Salary Slips Table */}
                            <Card padding={false}>
                                <div className="portal-card-header">
                                    <p className="portal-card-title">
                                        Salary Slips —{' '}
                                        {new Date(salaryData.month + '-01').toLocaleString('en-IN', {
                                            month: 'long', year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <Table
                                    headers={[
                                        'Emp ID', 'Name', 'Designation',
                                        'Basic', 'HRA', 'DA', 'Gross',
                                        'PF', 'ESI', 'Other Ded.', 'Total Ded.',
                                        'Net Pay',
                                    ]}
                                >
                                    {filteredSalarySlips.map(sl => (
                                        <Tr key={sl.staffId}>
                                            <Td>
                                                <span className="font-mono text-xs text-[var(--primary-600)]">
                                                    {sl.employeeId}
                                                </span>
                                            </Td>
                                            <Td className="font-semibold text-sm text-[var(--text-primary)]">
                                                {sl.name}
                                            </Td>
                                            <Td className="text-xs">{sl.designation}</Td>
                                            <Td className="font-mono text-xs">
                                                ₹{sl.earnings.basic.toLocaleString('en-IN')}
                                            </Td>
                                            <Td className="font-mono text-xs">
                                                ₹{sl.earnings.hra.toLocaleString('en-IN')}
                                            </Td>
                                            <Td className="font-mono text-xs">
                                                ₹{sl.earnings.da.toLocaleString('en-IN')}
                                            </Td>
                                            <Td className="font-mono text-xs font-semibold text-[var(--success-dark)]">
                                                ₹{sl.earnings.gross.toLocaleString('en-IN')}
                                            </Td>
                                            <Td className="font-mono text-xs text-[var(--danger)]">
                                                {sl.deductions.pf > 0 ? `-₹${sl.deductions.pf.toLocaleString('en-IN')}` : '—'}
                                            </Td>
                                            <Td className="font-mono text-xs text-[var(--danger)]">
                                                {sl.deductions.esi > 0 ? `-₹${sl.deductions.esi.toLocaleString('en-IN')}` : '—'}
                                            </Td>
                                            <Td className="font-mono text-xs text-[var(--danger)]">
                                                {sl.deductions.otherDeductions > 0
                                                    ? `-₹${sl.deductions.otherDeductions.toLocaleString('en-IN')}`
                                                    : '—'}
                                            </Td>
                                            <Td className="font-mono text-xs text-[var(--danger)] font-semibold">
                                                -₹{sl.deductions.total.toLocaleString('en-IN')}
                                            </Td>
                                            <Td>
                                                <span className="font-mono text-sm font-bold text-[var(--success-dark)]">
                                                    ₹{sl.netPay.toLocaleString('en-IN')}
                                                </span>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Table>
                            </Card>
                        </div>
                    ) : (
                        <EmptyState
                            icon={<DollarSign size={24} />}
                            title="No salary data"
                            description="Select a month and generate payroll to see salary slips"
                        />
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════
          TAB: LEAVE MANAGEMENT
          ════════════════════════════════════════ */}
            {tab === 'leave' && (
                <div className="space-y-4">

                    {/* Leave Policy Info */}
                    {leavePolicy && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="portal-card">
                                <div className="portal-card-body-sm flex items-center gap-3">
                                    <div className="stat-icon bg-[var(--primary-50)]" style={{ color: 'var(--primary-500)' }}>
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Casual Leave / Year</p>
                                        <p className="font-bold text-[var(--text-primary)]">
                                            {leavePolicy.casualLeavesPerYear} days
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="portal-card">
                                <div className="portal-card-body-sm flex items-center gap-3">
                                    <div className="stat-icon bg-[var(--success-light)]" style={{ color: 'var(--success)' }}>
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Sick Leave / Year</p>
                                        <p className="font-bold text-[var(--text-primary)]">
                                            {leavePolicy.sickLeavesPerYear} days
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="portal-card">
                                <div className="portal-card-body-sm flex items-center gap-3">
                                    <div className="stat-icon bg-[var(--warning-light)]" style={{ color: 'var(--warning)' }}>
                                        <TrendingUp size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">Earned Leave / Year</p>
                                        <p className="font-bold text-[var(--text-primary)]">
                                            {leavePolicy.earnedLeavesPerYear} days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Leave Table */}
                    {leaveLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : leaveStaff.length === 0 ? (
                        <EmptyState
                            icon={<Calendar size={24} />}
                            title="No active staff"
                            description="Add staff records first to manage leaves"
                        />
                    ) : (
                        <Card padding={false}>
                            <div className="portal-card-header">
                                <div>
                                    <p className="portal-card-title">Leave Balances</p>
                                    <p className="portal-card-subtitle">
                                        {leaveStaff.length} active staff
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchLeaveData}
                                >
                                    <RefreshCw size={13} /> Refresh
                                </Button>
                            </div>
                            <Table
                                headers={[
                                    'Emp ID', 'Name', 'Department',
                                    'Casual', 'Sick', 'Earned',
                                    'Maternity/Paternity', 'Unpaid', 'Action',
                                ]}
                            >
                                {leaveStaff.map(s => (
                                    <Tr key={s._id}>
                                        <Td>
                                            <span className="font-mono text-xs text-[var(--primary-600)]">
                                                {s.employeeId}
                                            </span>
                                        </Td>
                                        <Td>
                                            <div>
                                                <p className="font-semibold text-sm text-[var(--text-primary)]">
                                                    {s.fullName}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {s.designation}
                                                </p>
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge>{s.department}</Badge>
                                        </Td>
                                        <Td>
                                            <LeaveBalanceBadge
                                                current={s.leaveBalance.casual}
                                                max={leavePolicy?.casualLeavesPerYear || 12}
                                            />
                                        </Td>
                                        <Td>
                                            <LeaveBalanceBadge
                                                current={s.leaveBalance.sick}
                                                max={leavePolicy?.sickLeavesPerYear || 10}
                                            />
                                        </Td>
                                        <Td>
                                            <LeaveBalanceBadge
                                                current={s.leaveBalance.earned}
                                                max={leavePolicy?.earnedLeavesPerYear || 15}
                                            />
                                        </Td>
                                        <Td className="text-xs text-[var(--text-muted)]">
                                            M:{s.leaveBalance.maternity || 0} /
                                            P:{s.leaveBalance.paternity || 0}
                                        </Td>
                                        <Td>
                                            {s.leaveBalance.unpaid > 0 ? (
                                                <Badge variant="danger">{s.leaveBalance.unpaid} days</Badge>
                                            ) : (
                                                <span className="text-xs text-[var(--text-muted)]">0</span>
                                            )}
                                        </Td>
                                        <Td>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setLeaveModal({ staff: s, open: true })
                                                    setLeaveForm({
                                                        leaveType: 'casual',
                                                        days: '1',
                                                        reason: '',
                                                        action: 'deduct',
                                                    })
                                                }}
                                            >
                                                <Calendar size={13} />
                                                Manage
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Table>
                        </Card>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════
          MODALS
          ════════════════════════════════════════ */}
            <Portal>

                {/* ── Add Staff Modal ── */}
                <Modal
                    open={addModal}
                    onClose={() => {
                        setAddModal(false)
                        setForm({ ...INITIAL_FORM })
                        setFormErrors({})
                    }}
                    title="Add Staff Record"
                    size="lg"
                >
                    <div className="space-y-4">

                        {/* Link to user account */}
                        <Select
                            label="Link Teacher/Staff Account *"
                            value={form.userId}
                            onChange={e => {
                                setForm({ ...form, userId: e.target.value })
                                setFormErrors({ ...formErrors, userId: '' })
                            }}
                            options={[
                                { value: '', label: 'Select User Account' },
                                ...teachers.map(t => ({
                                    value: t._id,
                                    label: `${t.name} (${t.phone || t.email || 'No contact'})`,
                                })),
                            ]}
                            error={formErrors.userId}
                        />

                        {/* Personal Info */}
                        <div className="pt-1">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Personal Information
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="First Name *"
                                    value={form.firstName}
                                    onChange={e => {
                                        setForm({ ...form, firstName: e.target.value })
                                        setFormErrors({ ...formErrors, firstName: '' })
                                    }}
                                    placeholder="Ramesh"
                                    error={formErrors.firstName}
                                />
                                <Input
                                    label="Last Name"
                                    value={form.lastName}
                                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                                    placeholder="Sharma"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <Select
                                    label="Gender *"
                                    value={form.gender}
                                    onChange={e => setForm({ ...form, gender: e.target.value })}
                                    options={[
                                        { value: 'male', label: 'Male' },
                                        { value: 'female', label: 'Female' },
                                        { value: 'other', label: 'Other' },
                                    ]}
                                    error={formErrors.gender}
                                />
                                <Input
                                    label="Phone *"
                                    value={form.phone}
                                    onChange={e => {
                                        setForm({ ...form, phone: e.target.value })
                                        setFormErrors({ ...formErrors, phone: '' })
                                    }}
                                    placeholder="9876543210"
                                    error={formErrors.phone}
                                />
                                <Input
                                    label="Employee ID *"
                                    value={form.employeeId}
                                    onChange={e => {
                                        setForm({ ...form, employeeId: e.target.value.toUpperCase() })
                                        setFormErrors({ ...formErrors, employeeId: '' })
                                    }}
                                    placeholder="EMP-001"
                                    error={formErrors.employeeId}
                                />
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div className="pt-1">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Professional Details
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label="Staff Category *"
                                    value={form.staffCategory}
                                    onChange={e => setForm({ ...form, staffCategory: e.target.value })}
                                    options={STAFF_CATEGORIES}
                                    error={formErrors.staffCategory}
                                />
                                <Select
                                    label="Designation *"
                                    value={form.designation}
                                    onChange={e => {
                                        setForm({ ...form, designation: e.target.value })
                                        setFormErrors({ ...formErrors, designation: '' })
                                    }}
                                    options={DESIGNATIONS.map(d => ({ value: d, label: d }))}
                                    error={formErrors.designation}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <Select
                                    label="Department *"
                                    value={form.department}
                                    onChange={e => {
                                        setForm({ ...form, department: e.target.value })
                                        setFormErrors({ ...formErrors, department: '' })
                                    }}
                                    options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                                    error={formErrors.department}
                                />
                                <Input
                                    label="Qualification *"
                                    value={form.qualification}
                                    onChange={e => {
                                        setForm({ ...form, qualification: e.target.value })
                                        setFormErrors({ ...formErrors, qualification: '' })
                                    }}
                                    placeholder="B.Ed, M.Sc"
                                    error={formErrors.qualification}
                                />
                                <Input
                                    label="Experience (Years)"
                                    type="number"
                                    min={0}
                                    value={form.experience}
                                    onChange={e => setForm({ ...form, experience: e.target.value })}
                                    placeholder="5"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <Input
                                    label="Joining Date *"
                                    type="date"
                                    value={form.joiningDate}
                                    onChange={e => {
                                        setForm({ ...form, joiningDate: e.target.value })
                                        setFormErrors({ ...formErrors, joiningDate: '' })
                                    }}
                                    error={formErrors.joiningDate}
                                />
                                <Input
                                    label="Basic Monthly Salary (₹) *"
                                    type="number"
                                    min={0}
                                    value={form.basicSalary}
                                    onChange={e => {
                                        setForm({ ...form, basicSalary: e.target.value })
                                        setFormErrors({ ...formErrors, basicSalary: '' })
                                    }}
                                    placeholder="25000"
                                    error={formErrors.basicSalary}
                                />
                            </div>
                        </div>

                        {/* Address & Emergency */}
                        <div className="pt-1">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Contact & Emergency
                            </p>
                            <Input
                                label="Current Address *"
                                value={form.currentAddress}
                                onChange={e => {
                                    setForm({ ...form, currentAddress: e.target.value })
                                    setFormErrors({ ...formErrors, currentAddress: '' })
                                }}
                                placeholder="House No, Street, City, State"
                                error={formErrors.currentAddress}
                            />
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <Input
                                    label="Emergency Contact Name *"
                                    value={form.emergencyContactName}
                                    onChange={e => {
                                        setForm({ ...form, emergencyContactName: e.target.value })
                                        setFormErrors({ ...formErrors, emergencyContactName: '' })
                                    }}
                                    placeholder="Relative name"
                                    error={formErrors.emergencyContactName}
                                />
                                <Input
                                    label="Emergency Contact Phone *"
                                    value={form.emergencyContactPhone}
                                    onChange={e => {
                                        setForm({ ...form, emergencyContactPhone: e.target.value })
                                        setFormErrors({ ...formErrors, emergencyContactPhone: '' })
                                    }}
                                    placeholder="9876543210"
                                    error={formErrors.emergencyContactPhone}
                                />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="pt-1">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                                Bank & ID (Optional)
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Bank Name"
                                    value={form.bankName}
                                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                                    placeholder="SBI, HDFC, etc."
                                />
                                <Input
                                    label="Account Number"
                                    value={form.accountNumber}
                                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                                    placeholder="12345678901234"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <Input
                                    label="IFSC Code"
                                    value={form.ifscCode}
                                    onChange={e =>
                                        setForm({ ...form, ifscCode: e.target.value.toUpperCase() })
                                    }
                                    placeholder="SBIN0001234"
                                />
                                <Input
                                    label="PAN Number"
                                    value={form.panNumber}
                                    onChange={e =>
                                        setForm({ ...form, panNumber: e.target.value.toUpperCase() })
                                    }
                                    placeholder="ABCDE1234F"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={() => {
                                    setAddModal(false)
                                    setForm({ ...INITIAL_FORM })
                                    setFormErrors({})
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleAddStaff}
                                loading={saving}
                            >
                                <Plus size={15} />
                                Create Staff Record
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* ── Leave Management Modal ── */}
                <Modal
                    open={leaveModal.open}
                    onClose={() => {
                        setLeaveModal({ staff: null, open: false })
                        setLeaveForm({ leaveType: 'casual', days: '1', reason: '', action: 'deduct' })
                    }}
                    title={`Manage Leave — ${leaveModal.staff?.fullName || ''}`}
                    size="sm"
                >
                    {leaveModal.staff && (
                        <div className="space-y-4">

                            {/* Current balances */}
                            <div className="p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">
                                    Current Leave Balance
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {(
                                        [
                                            { key: 'casual', label: 'Casual' },
                                            { key: 'sick', label: 'Sick' },
                                            { key: 'earned', label: 'Earned' },
                                        ] as const
                                    ).map(lt => (
                                        <div key={lt.key}>
                                            <p className="text-lg font-bold text-[var(--text-primary)]">
                                                {leaveModal.staff!.leaveBalance[lt.key] || 0}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">{lt.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="flex gap-2">
                                {(
                                    [
                                        { val: 'deduct', label: 'Deduct Leave', icon: XCircle },
                                        { val: 'credit', label: 'Credit Leave', icon: CheckCircle },
                                    ] as const
                                ).map(a => {
                                    const Icon = a.icon
                                    return (
                                        <button
                                            key={a.val}
                                            onClick={() =>
                                                setLeaveForm({ ...leaveForm, action: a.val })
                                            }
                                            className={`
                        flex-1 flex items-center justify-center gap-1.5
                        py-2 rounded-[var(--radius-md)] text-sm font-semibold
                        border transition-all
                        ${leaveForm.action === a.val
                                                    ? a.val === 'deduct'
                                                        ? 'bg-[var(--danger-light)] text-[var(--danger-dark)] border-[rgba(239,68,68,0.3)]'
                                                        : 'bg-[var(--success-light)] text-[var(--success-dark)] border-[rgba(16,185,129,0.3)]'
                                                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)] border-[var(--border)]'
                                                }
                      `}
                                        >
                                            <Icon size={14} />
                                            {a.label}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Leave Type */}
                            <Select
                                label="Leave Type"
                                value={leaveForm.leaveType}
                                onChange={e =>
                                    setLeaveForm({
                                        ...leaveForm,
                                        leaveType: e.target.value as any,
                                    })
                                }
                                options={[
                                    { value: 'casual', label: 'Casual Leave' },
                                    { value: 'sick', label: 'Sick Leave' },
                                    { value: 'earned', label: 'Earned Leave' },
                                    { value: 'maternity', label: 'Maternity Leave' },
                                    { value: 'paternity', label: 'Paternity Leave' },
                                    { value: 'unpaid', label: 'Leave Without Pay' },
                                ]}
                            />

                            {/* Days */}
                            <Input
                                label="Number of Days"
                                type="number"
                                min={0.5}
                                step={0.5}
                                value={leaveForm.days}
                                onChange={e =>
                                    setLeaveForm({ ...leaveForm, days: e.target.value })
                                }
                                helper="0.5 = half day"
                            />

                            {/* Reason */}
                            <div>
                                <label className="input-label">Reason (Optional)</label>
                                <textarea
                                    value={leaveForm.reason}
                                    onChange={e =>
                                        setLeaveForm({ ...leaveForm, reason: e.target.value })
                                    }
                                    rows={2}
                                    className="input-clean resize-none"
                                    placeholder="Reason for leave..."
                                />
                            </div>

                            {/* Warning for low balance */}
                            {leaveForm.action === 'deduct' &&
                                leaveForm.leaveType !== 'unpaid' &&
                                leaveModal.staff && (
                                    (() => {
                                        const bal =
                                            leaveModal.staff!.leaveBalance[
                                            leaveForm.leaveType as keyof typeof leaveModal.staff.leaveBalance
                                            ] || 0
                                        const req = parseFloat(leaveForm.days) || 0
                                        if (req > bal) {
                                            return (
                                                <div className="flex items-center gap-2 p-2.5 bg-[var(--warning-light)] rounded-[var(--radius-md)] border border-[rgba(245,158,11,0.2)]">
                                                    <AlertTriangle size={13} className="text-[var(--warning)] flex-shrink-0" />
                                                    <p className="text-xs text-[var(--warning-dark)]">
                                                        Insufficient balance. Available: {bal} days
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    })()
                                )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                <Button
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => {
                                        setLeaveModal({ staff: null, open: false })
                                        setLeaveForm({ leaveType: 'casual', days: '1', reason: '', action: 'deduct' })
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant={leaveForm.action === 'deduct' ? 'danger' : 'primary'}
                                    className="flex-1"
                                    onClick={handleLeaveAction}
                                    loading={saving}
                                >
                                    {leaveForm.action === 'deduct' ? 'Deduct Leave' : 'Credit Leave'}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </Portal>
        </div>
    )
}

// ── Leave Balance Badge Component ──
function LeaveBalanceBadge({
    current,
    max,
}: {
    current: number
    max: number
}) {
    const pct = max > 0 ? (current / max) * 100 : 0
    const variant =
        pct > 50 ? 'success' : pct > 25 ? 'warning' : 'danger'

    return (
        <div className="flex items-center gap-1.5">
            <Badge variant={variant}>{current}</Badge>
            <span className="text-xs text-[var(--text-muted)]">/{max}</span>
        </div>
    )
}