/* ============================================================
   FILE: src/app/(dashboard)/admin/settings/page.tsx
   School Settings — name, logo, theme
   ============================================================ */

'use client'
import { useState, useEffect } from 'react'
import { Button, Input, Card, PageHeader, Alert } from '@/components/ui'

export default function SettingsPage() {
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
    const [loading, setLoading] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    useEffect(() => {
        fetch('/api/schools/me')
            .then(r => r.json())
            .then(d => {
                if (d.school) {
                    setForm({
                        name: d.school.name ?? '',
                        phone: d.school.phone ?? '',
                        email: d.school.email ?? '',
                        address: d.school.address ?? '',
                    })
                }
            })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await fetch('/api/schools/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setLoading(false)
        setAlert(res.ok
            ? { type: 'success', msg: 'Settings saved!' }
            : { type: 'error', msg: 'Failed to save' }
        )
    }

    return (
        <div>
            <PageHeader title="School Settings" subtitle="Update your school information" />

            {alert && (
                <div className="mb-4">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            <Card className="max-w-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="School Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    <Input label="Phone *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                    <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    <div className="pt-2">
                        <Button type="submit" loading={loading}>Save Changes</Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
