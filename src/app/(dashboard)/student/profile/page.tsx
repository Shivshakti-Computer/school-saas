// -------------------------------------------------------------
// FILE: src/app/(dashboard)/student/profile/page.tsx
// -------------------------------------------------------------
'use client'
import { useState, useEffect } from 'react'
import { Card, PageHeader, Button, Input, Alert, Spinner } from '@/components/ui'

export default function StudentProfilePage() {
    const [student, setStudent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
    const [pwLoading, setPwLoading] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    useEffect(() => {
        fetch('/api/students/profile')
            .then(r => r.json())
            .then(d => { setStudent(d.student); setLoading(false) })
    }, [])

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (pwForm.newPw !== pwForm.confirm) {
            setAlert({ type: 'error', msg: 'New passwords do not match' })
            return
        }
        setPwLoading(true)
        const res = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
        })
        const d = await res.json()
        setPwLoading(false)
        if (res.ok) {
            setAlert({ type: 'success', msg: 'Password changed successfully!' })
            setPwForm({ current: '', newPw: '', confirm: '' })
        } else {
            setAlert({ type: 'error', msg: d.error ?? 'Failed' })
        }
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    if (!student) return <p className="text-slate-500 text-sm">Profile not found</p>

    const user = student.userId as any

    return (
        <div className="space-y-4 max-w-lg">
            <PageHeader title="My Profile" />

            {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

            {/* Profile info */}
            <Card>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
                        {user?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">{user?.name}</p>
                        <p className="text-sm text-slate-500">Student</p>
                    </div>
                </div>

                <div className="space-y-2 text-sm divide-y divide-slate-50">
                    {[
                        { label: 'Admission No', value: student.admissionNo },
                        { label: 'Class', value: `${student.class} - ${student.section}` },
                        { label: 'Roll No', value: student.rollNo },
                        { label: 'Father Name', value: student.fatherName },
                        { label: 'Phone', value: user?.phone },
                        { label: 'Parent Phone', value: student.parentPhone },
                        { label: 'Address', value: student.address },
                    ].map(item => (
                        <div key={item.label} className="flex justify-between py-2">
                            <span className="text-slate-400">{item.label}</span>
                            <span className="text-slate-700 font-medium text-right max-w-xs">{item.value}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Change password */}
            <Card>
                <p className="text-sm font-semibold text-slate-700 mb-4">Change Password</p>
                <form onSubmit={changePassword} className="space-y-3">
                    <Input
                        label="Current Password"
                        type="password"
                        value={pwForm.current}
                        onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                        required
                    />
                    <Input
                        label="New Password"
                        type="password"
                        value={pwForm.newPw}
                        onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                        helper="Minimum 6 characters"
                        required
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={pwForm.confirm}
                        onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                        required
                    />
                    <Button type="submit" loading={pwLoading} size="sm">
                        Update Password
                    </Button>
                </form>
            </Card>
        </div>
    )
}
