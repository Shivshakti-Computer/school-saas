'use client'

import { useState } from 'react'
import { Card, PageHeader, Button, Select, Alert } from '@/components/ui'
import { FileText, FileSpreadsheet } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type ReportFormat = 'pdf' | 'excel'
type LoadingKey = `${string}-${ReportFormat}` | null

interface ReportCard {
    key: string
    title: string
    desc: string
    icon: string
}

// ─────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────
const REPORTS: ReportCard[] = [
    {
        key: 'attendance',
        title: 'Attendance Report',
        desc: 'Monthly attendance summary for all students with percentage',
        icon: '✅',
    },
    {
        key: 'fees',
        title: 'Fee Collection Report',
        desc: 'Fee collected, pending, and overdue amounts with student details',
        icon: '💳',
    },
    {
        key: 'students',
        title: 'Student List',
        desc: 'Complete student directory with contact details',
        icon: '👨‍🎓',
    },
    {
        key: 'results',
        title: 'Exam Results',
        desc: 'Class-wise results with marks and grades',
        icon: '📊',
    },
]

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
    const [cls, setCls] = useState('')
    const [loading, setLoading] = useState<LoadingKey>(null)
    const [alert, setAlert] = useState<{
        type: 'success' | 'error'
        msg: string
    } | null>(null)

    // Last 12 months dropdown options
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        return {
            value: d.toISOString().slice(0, 7),
            label: d.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
            }),
        }
    })

    // ── Download handler ────────────────────────────────────────
    const download = async (reportKey: string, format: ReportFormat) => {
        const key = `${reportKey}-${format}` as LoadingKey
        setLoading(key)
        setAlert(null)

        try {
            const params = new URLSearchParams({ month, format })
            if (cls) params.set('class', cls)

            const res = await fetch(`/api/reports/${reportKey}?${params}`)

            if (!res.ok) {
                let errMsg = 'Export failed. Please try again.'
                try {
                    const body = await res.json()
                    if (body?.error) errMsg = body.error
                } catch { /* ignore */ }
                throw new Error(errMsg)
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${reportKey}-${month}.${format === 'excel' ? 'xlsx' : 'pdf'}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            setAlert({
                type: 'success',
                msg: `${format.toUpperCase()} downloaded successfully.`,
            })
        } catch (err: any) {
            setAlert({
                type: 'error',
                msg: err.message ?? 'Unknown error occurred.',
            })
        } finally {
            setLoading(null)
        }
    }

    // ────────────────────────────────────────────────────────────
    return (
        <div>
            <PageHeader
                title="Reports & Exports"
                subtitle="Download attendance, fee and student reports"
            />

            {alert && (
                <div className="mb-4">
                    <Alert
                        type={alert.type}
                        message={alert.msg}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            {/* Filters */}
            <Card className="mb-6">
                <div className="flex flex-wrap gap-4">
                    <Select
                        label="Month"
                        options={months}
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="w-52"
                    />
                    <Select
                        label="Class (optional)"
                        options={[
                            { value: '', label: 'All Classes' },
                            ...CLASSES.map(c => ({ value: c, label: `Class ${c}` })),
                        ]}
                        value={cls}
                        onChange={e => setCls(e.target.value)}
                        className="w-40"
                    />
                </div>
            </Card>

            {/* Report cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REPORTS.map(r => (
                    <Card key={r.key}>
                        <div className="flex items-start gap-4">
                            <span className="text-3xl">{r.icon}</span>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">
                                    {r.title}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {r.desc}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        loading={loading === `${r.key}-pdf`}
                                        disabled={loading !== null}
                                        onClick={() => download(r.key, 'pdf')}
                                    >
                                        <FileText size={12} className="mr-1" />
                                        PDF
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        loading={loading === `${r.key}-excel`}
                                        disabled={loading !== null}
                                        onClick={() => download(r.key, 'excel')}
                                    >
                                        <FileSpreadsheet size={12} className="mr-1" />
                                        Excel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}