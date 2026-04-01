'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState, StatCard } from '@/components/ui'
import { Briefcase, Plus, DollarSign, Calendar, Users } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const DEPARTMENTS = ['Administration', 'Science', 'Mathematics', 'English', 'Hindi', 'Social Studies', 'Computer', 'Physical Education', 'Art', 'Library', 'Accounts', 'Support']
const DESIGNATIONS = ['Principal', 'Vice Principal', 'Class Teacher', 'Subject Teacher', 'Librarian', 'Lab Assistant', 'Accountant', 'Clerk', 'Peon', 'Security', 'Driver']

export default function HRPage() {
    const [tab, setTab] = useState<'staff' | 'salary' | 'leave'>('staff')
    const [staffList, setStaffList] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [addModal, setAddModal] = useState(false)
    const [salaryModal, setSalaryModal] = useState(false)
    const [salaryData, setSalaryData] = useState<any>(null)
    const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7))

    const [form, setForm] = useState({
        userId: '', employeeId: '', designation: 'Class Teacher', department: 'Administration',
        salary: '', joiningDate: '', address: '', emergencyContact: '', bankAccount: '', ifscCode: '', panNumber: '',
    })

    const fetchStaff = async () => {
        const res = await fetch('/api/hr')
        const data = await res.json()
        setStaffList(data.staff || [])
        setStats(data.stats)
    }

    const fetchTeachers = async () => {
        const res = await fetch('/api/users?role=teacher')
        const data = await res.json()
        setTeachers(Array.isArray(data) ? data : data.users || [])
    }

    useEffect(() => {
        Promise.all([fetchStaff(), fetchTeachers()]).then(() => setLoading(false))
    }, [])

    const handleAddStaff = async () => {
        if (!form.userId || !form.employeeId || !form.salary) return
        setSaving(true)
        try {
            const res = await fetch('/api/hr', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, salary: Number(form.salary) }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
            setAlert({ type: 'success', msg: 'Staff added!' })
            setAddModal(false)
            fetchStaff()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const generateSalary = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/hr/salary/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month: salaryMonth }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setSalaryData(data)
            setAlert({ type: 'success', msg: `Salary generated for ${data.totalStaff} staff — Total: ₹${data.totalPayout.toLocaleString('en-IN')}` })
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handleLeave = async (staffId: string, leaveType: string, days: number) => {
        try {
            const res = await fetch('/api/hr/leave', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId, leaveType, days }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setAlert({ type: 'success', msg: `Leave approved. Remaining ${leaveType}: ${data.remainingBalance}` })
            fetchStaff()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="HR & Payroll"
                subtitle="Staff management, salary, leaves"
                action={<Button onClick={() => setAddModal(true)}><Plus size={16} /> Add Staff Record</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Staff" value={stats.total} icon={<Users size={18} />} color="indigo" />
                    <StatCard label="Active" value={stats.active} icon={<Users size={18} />} color="emerald" />
                    <StatCard label="Monthly Payroll" value={`₹${stats.totalSalary?.toLocaleString('en-IN')}`} icon={<DollarSign size={18} />} color="amber" />
                    <StatCard label="Departments" value={stats.departments?.length || 0} icon={<Briefcase size={18} />} color="blue" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {([
                    { key: 'staff', label: 'Staff Directory' },
                    { key: 'salary', label: 'Salary' },
                    { key: 'leave', label: 'Leave Management' },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Staff Tab */}
            {tab === 'staff' && (
                staffList.length === 0 ? (
                    <EmptyState icon={<Briefcase size={24} />} title="No staff records" description="Add staff HR records" />
                ) : (
                    <Card padding={false}>
                        <Table headers={['Emp ID', 'Name', 'Designation', 'Department', 'Salary', 'Joining', 'Status']}>
                            {staffList.map(s => (
                                <Tr key={s._id}>
                                    <Td className="font-mono text-xs">{s.employeeId}</Td>
                                    <Td className="font-medium">{(s.userId as any)?.name || 'Unknown'}</Td>
                                    <Td>{s.designation}</Td>
                                    <Td><Badge>{s.department}</Badge></Td>
                                    <Td>₹{s.salary?.toLocaleString('en-IN')}</Td>
                                    <Td className="text-xs">{new Date(s.joiningDate).toLocaleDateString('en-IN')}</Td>
                                    <Td><Badge variant={s.status === 'active' ? 'success' : 'danger'}>{s.status}</Badge></Td>
                                </Tr>
                            ))}
                        </Table>
                    </Card>
                )
            )}

            {/* Salary Tab */}
            {tab === 'salary' && (
                <Card>
                    <div className="flex items-end gap-4 mb-6">
                        <Input label="Month" type="month" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} />
                        <Button onClick={generateSalary} loading={saving}><DollarSign size={16} /> Generate Salary</Button>
                    </div>
                    {salaryData && (
                        <>
                            <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-emerald-800 font-semibold">
                                    {salaryData.month} — {salaryData.totalStaff} staff — Total Payout: ₹{salaryData.totalPayout?.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <Table headers={['Emp ID', 'Name', 'Designation', 'Basic', 'HRA', 'DA', 'Gross', 'PF', 'Tax', 'Net Pay']}>
                                {salaryData.slips?.map((sl: any) => (
                                    <Tr key={sl.staffId}>
                                        <Td className="font-mono text-xs">{sl.employeeId}</Td>
                                        <Td className="font-medium">{sl.name}</Td>
                                        <Td className="text-xs">{sl.designation}</Td>
                                        <Td className="text-xs">₹{sl.earnings?.basic?.toLocaleString('en-IN')}</Td>
                                        <Td className="text-xs">₹{sl.earnings?.hra?.toLocaleString('en-IN')}</Td>
                                        <Td className="text-xs">₹{sl.earnings?.da?.toLocaleString('en-IN')}</Td>
                                        <Td className="text-xs font-medium">₹{sl.earnings?.gross?.toLocaleString('en-IN')}</Td>
                                        <Td className="text-xs text-red-600">-₹{sl.deductions?.pf?.toLocaleString('en-IN')}</Td>
                                        <Td className="text-xs text-red-600">-₹{sl.deductions?.tax?.toLocaleString('en-IN')}</Td>
                                        <Td className="font-semibold text-emerald-700">₹{sl.netPay?.toLocaleString('en-IN')}</Td>
                                    </Tr>
                                ))}
                            </Table>
                        </>
                    )}
                </Card>
            )}

            {/* Leave Tab */}
            {tab === 'leave' && (
                staffList.length === 0 ? (
                    <EmptyState icon={<Calendar size={24} />} title="No staff" />
                ) : (
                    <Card padding={false}>
                        <Table headers={['Emp ID', 'Name', 'Casual', 'Sick', 'Earned', 'Action']}>
                            {staffList.filter(s => s.status === 'active').map(s => (
                                <Tr key={s._id}>
                                    <Td className="font-mono text-xs">{s.employeeId}</Td>
                                    <Td className="font-medium">{(s.userId as any)?.name || 'Unknown'}</Td>
                                    <Td><Badge variant={s.leaveBalance?.casual > 0 ? 'success' : 'danger'}>{s.leaveBalance?.casual || 0}</Badge></Td>
                                    <Td><Badge variant={s.leaveBalance?.sick > 0 ? 'success' : 'danger'}>{s.leaveBalance?.sick || 0}</Badge></Td>
                                    <Td><Badge>{s.leaveBalance?.earned || 0}</Badge></Td>
                                    <Td>
                                        <div className="flex gap-1">
                                            {(['casual', 'sick'] as const).map(type => (
                                                <Button key={type} size="sm" variant="ghost" onClick={() => handleLeave(s._id, type, 1)}>
                                                    -{type.charAt(0).toUpperCase()}L
                                                </Button>
                                            ))}
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </Table>
                    </Card>
                )
            )}

            <Portal>
                {/* Add Staff Modal */}
                <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Staff Record" size="lg">
                    <div className="space-y-4">
                        <Select label="Link Teacher Account" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} options={[{ value: '', label: 'Select Teacher' }, ...teachers.map((t: any) => ({ value: t._id, label: t.name }))]} />
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Employee ID" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP001" />
                            <Select label="Designation" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} options={DESIGNATIONS.map(d => ({ value: d, label: d }))} />
                            <Select label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Monthly Salary ₹" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
                        </div>
                        <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Emergency Contact" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} />
                            <Input label="PAN Number" value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Bank Account" value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
                            <Input label="IFSC Code" value={form.ifscCode} onChange={e => setForm({ ...form, ifscCode: e.target.value })} />
                        </div>
                        <Button className="w-full" onClick={handleAddStaff} loading={saving}>Add Staff Record</Button>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}