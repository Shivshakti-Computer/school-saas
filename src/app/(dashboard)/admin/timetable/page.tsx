'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Select, Input, Spinner, Alert, EmptyState, Modal } from '@/components/ui'
import { Clock, Plus, Save, Trash2, X } from 'lucide-react'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const DAY_LABELS: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

const CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SECTIONS = ['A', 'B', 'C', 'D']

interface Period {
    periodNo: number
    startTime: string
    endTime: string
    subject: string
    teacherId?: string
}

interface DaySchedule {
    day: string
    periods: Period[]
}

export default function TimetablePage() {
    const [selectedClass, setSelectedClass] = useState('1')
    const [selectedSection, setSelectedSection] = useState('A')
    const [timetable, setTimetable] = useState<DaySchedule[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [addPeriodModal, setAddPeriodModal] = useState<string | null>(null)

    // New period form
    const [newPeriod, setNewPeriod] = useState<Period>({
        periodNo: 1, startTime: '09:00', endTime: '09:40', subject: '', teacherId: ''
    })

    const fetchTimetable = async () => {
        setLoading(true)
        try {
            const [ttRes, teachRes] = await Promise.all([
                fetch(`/api/timetable?class=${selectedClass}&section=${selectedSection}`),
                fetch('/api/users?role=teacher'),
            ])
            const ttData = await ttRes.json()
            const teachData = await teachRes.json()
            setTeachers(Array.isArray(teachData) ? teachData : teachData.users || [])

            if (Array.isArray(ttData) && ttData.length > 0) {
                setTimetable(ttData[0].days || [])
            } else {
                setTimetable(DAYS.map(day => ({ day, periods: [] })))
            }
        } catch (e) {
            setTimetable(DAYS.map(day => ({ day, periods: [] })))
        }
        setLoading(false)
    }

    useEffect(() => { fetchTimetable() }, [selectedClass, selectedSection])

    const handleSave = async () => {
        setSaving(true)
        setAlert(null)
        try {
            const res = await fetch('/api/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class: selectedClass,
                    section: selectedSection,
                    days: timetable,
                }),
            })
            if (!res.ok) throw new Error('Failed to save')
            setAlert({ type: 'success', msg: 'Timetable saved successfully!' })
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const addPeriod = (day: string) => {
        if (!newPeriod.subject.trim()) return
        setTimetable(prev => prev.map(d => {
            if (d.day === day) {
                return { ...d, periods: [...d.periods, { ...newPeriod, periodNo: d.periods.length + 1 }] }
            }
            return d
        }))
        setNewPeriod({ periodNo: 1, startTime: '09:00', endTime: '09:40', subject: '', teacherId: '' })
        setAddPeriodModal(null)
    }

    const removePeriod = (day: string, periodNo: number) => {
        setTimetable(prev => prev.map(d => {
            if (d.day === day) {
                const filtered = d.periods.filter(p => p.periodNo !== periodNo)
                return { ...d, periods: filtered.map((p, i) => ({ ...p, periodNo: i + 1 })) }
            }
            return d
        }))
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Timetable Management"
                subtitle="Class-wise period scheduling"
                action={
                    <Button onClick={handleSave} loading={saving}>
                        <Save size={16} /> Save Timetable
                    </Button>
                }
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            <div className="flex gap-3 mb-6">
                <Select
                    label="Class"
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    options={CLASSES.map(c => ({ value: c, label: `Class ${c}` }))}
                />
                <Select
                    label="Section"
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))}
                />
            </div>

            <div className="space-y-4">
                {timetable.map(day => (
                    <Card key={day.day}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-slate-800">{DAY_LABELS[day.day]}</h3>
                            <Button size="sm" variant="secondary" onClick={() => setAddPeriodModal(day.day)}>
                                <Plus size={14} /> Add Period
                            </Button>
                        </div>
                        {day.periods.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">No periods added</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {day.periods.sort((a, b) => a.periodNo - b.periodNo).map(period => (
                                    <div key={period.periodNo} className="bg-slate-50 rounded-lg p-3 relative group">
                                        <button
                                            onClick={() => removePeriod(day.day, period.periodNo)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                        <p className="text-[10px] text-slate-400 font-medium mb-0.5">Period {period.periodNo}</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">{period.subject}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{period.startTime} – {period.endTime}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Add Period Modal */}
            <Modal open={!!addPeriodModal} onClose={() => setAddPeriodModal(null)} title={`Add Period — ${DAY_LABELS[addPeriodModal || ''] || ''}`}>
                <div className="space-y-4">
                    <Input label="Subject" value={newPeriod.subject} onChange={e => setNewPeriod({ ...newPeriod, subject: e.target.value })} placeholder="e.g. Mathematics" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Start Time" type="time" value={newPeriod.startTime} onChange={e => setNewPeriod({ ...newPeriod, startTime: e.target.value })} />
                        <Input label="End Time" type="time" value={newPeriod.endTime} onChange={e => setNewPeriod({ ...newPeriod, endTime: e.target.value })} />
                    </div>
                    {teachers.length > 0 && (
                        <Select
                            label="Teacher (optional)"
                            value={newPeriod.teacherId || ''}
                            onChange={e => setNewPeriod({ ...newPeriod, teacherId: e.target.value })}
                            options={[{ value: '', label: 'Select Teacher' }, ...teachers.map((t: any) => ({ value: t._id, label: t.name }))]}
                        />
                    )}
                    <Button className="w-full" onClick={() => addPeriodModal && addPeriod(addPeriodModal)}>
                        Add Period
                    </Button>
                </div>
            </Modal>
        </div>
    )
}