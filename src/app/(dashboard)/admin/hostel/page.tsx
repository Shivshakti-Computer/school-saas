'use client'

import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState, StatCard } from '@/components/ui'
import { Building, Plus, Utensils, Users } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const ROOM_TYPES = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'dormitory', label: 'Dormitory' },
]

export default function HostelPage() {
    const [tab, setTab] = useState<'rooms' | 'mess'>('rooms')
    const [rooms, setRooms] = useState<any[]>([])
    const [messMenu, setMessMenu] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [addRoomModal, setAddRoomModal] = useState(false)
    const [messModal, setMessModal] = useState<string | null>(null)

    const [roomForm, setRoomForm] = useState({
        hostelName: '', roomNo: '', floor: 0, type: 'double' as string, capacity: 2, monthlyFee: 0, amenities: '',
    })

    const [mealForm, setMealForm] = useState<Array<{ type: string; items: string; time: string }>>([
        { type: 'breakfast', items: '', time: '07:30' },
        { type: 'lunch', items: '', time: '12:30' },
        { type: 'snacks', items: '', time: '16:30' },
        { type: 'dinner', items: '', time: '20:00' },
    ])

    const fetchData = async () => {
        const [roomRes, messRes] = await Promise.all([
            fetch('/api/hostel'),
            fetch('/api/hostel?type=mess'),
        ])
        const roomData = await roomRes.json()
        const messData = await messRes.json()
        setRooms(roomData.rooms || [])
        setStats(roomData.stats)
        setMessMenu(messData.menu || [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const handleAddRoom = async () => {
        if (!roomForm.hostelName.trim() || !roomForm.roomNo.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/hostel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...roomForm,
                    amenities: roomForm.amenities.split(',').map(a => a.trim()).filter(Boolean),
                }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Room added!' })
            setAddRoomModal(false)
            await fetchData()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handleSaveMess = async () => {
        if (!messModal) return
        setSaving(true)
        try {
            const res = await fetch('/api/hostel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'mess',
                    day: messModal,
                    meals: mealForm.map(m => ({ ...m, items: m.items.split(',').map(i => i.trim()).filter(Boolean) })),
                }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: `${messModal} menu saved!` })
            setMessModal(null)
            await fetchData()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const openMessEdit = (day: string) => {
        const existing = messMenu.find(m => m.day === day)
        if (existing?.meals) {
            setMealForm(existing.meals.map((m: any) => ({ type: m.type, items: m.items?.join(', ') || '', time: m.time })))
        } else {
            setMealForm([
                { type: 'breakfast', items: '', time: '07:30' },
                { type: 'lunch', items: '', time: '12:30' },
                { type: 'snacks', items: '', time: '16:30' },
                { type: 'dinner', items: '', time: '20:00' },
            ])
        }
        setMessModal(day)
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Hostel Management"
                subtitle="Rooms, occupancy, mess menu"
                action={<Button onClick={() => setAddRoomModal(true)}><Plus size={16} /> Add Room</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Rooms" value={stats.totalRooms} icon={<Building size={18} />} color="indigo" />
                    <StatCard label="Total Capacity" value={stats.totalCapacity} icon={<Users size={18} />} color="blue" />
                    <StatCard label="Occupied" value={stats.totalOccupied} icon={<Users size={18} />} color="emerald" />
                    <StatCard label="Vacant" value={stats.totalCapacity - stats.totalOccupied} icon={<Building size={18} />} color="amber" />
                </div>
            )}

            <div className="flex gap-2 mb-5">
                {(['rooms', 'mess'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                        {t === 'rooms' ? 'Rooms' : 'Mess Menu'}
                    </button>
                ))}
            </div>

            {/* Rooms Tab */}
            {tab === 'rooms' && (
                rooms.length === 0 ? (
                    <EmptyState icon={<Building size={24} />} title="No rooms" description="Add hostel rooms" />
                ) : (
                    <Card padding={false}>
                        <Table headers={['Hostel', 'Room', 'Floor', 'Type', 'Capacity', 'Occupied', 'Fee', 'Status']}>
                            {rooms.map(r => (
                                <Tr key={r._id}>
                                    <Td className="font-medium">{r.hostelName}</Td>
                                    <Td>{r.roomNo}</Td>
                                    <Td>{r.floor}</Td>
                                    <Td><Badge>{r.type}</Badge></Td>
                                    <Td>{r.capacity}</Td>
                                    <Td>{r.occupants?.length || 0}</Td>
                                    <Td>₹{r.monthlyFee?.toLocaleString('en-IN')}</Td>
                                    <Td>
                                        <Badge variant={(r.occupants?.length || 0) >= r.capacity ? 'danger' : 'success'}>
                                            {(r.occupants?.length || 0) >= r.capacity ? 'Full' : 'Available'}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))}
                        </Table>
                    </Card>
                )
            )}

            {/* Mess Tab */}
            {tab === 'mess' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DAYS.map(day => {
                        const menu = messMenu.find(m => m.day === day)
                        return (
                            <div
                                key={day}
                                className="cursor-pointer hover:border-indigo-200 transition-colors"
                                onClick={() => openMessEdit(day)}
                            >
                                <Card>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-sm">{day}</h3>
                                        <Utensils size={14} className="text-slate-400" />
                                    </div>
                                    {menu?.meals?.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {menu.meals.map((m: any, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-xs">
                                                    <Badge variant={m.type === 'breakfast' ? 'warning' : m.type === 'lunch' ? 'success' : m.type === 'snacks' ? 'info' : 'purple'}>
                                                        {m.type}
                                                    </Badge>
                                                    <span className="text-slate-600">{m.items?.join(', ') || 'Not set'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400">Click to set menu</p>
                                    )}
                                </Card>
                            </div>
                        )
                    })}
                </div>
            )}

            <Portal>
                {/* Add Room */}
                <Modal open={addRoomModal} onClose={() => setAddRoomModal(false)} title="Add Hostel Room">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Hostel Name" value={roomForm.hostelName} onChange={e => setRoomForm({ ...roomForm, hostelName: e.target.value })} placeholder="e.g. Boys Hostel" />
                            <Input label="Room No" value={roomForm.roomNo} onChange={e => setRoomForm({ ...roomForm, roomNo: e.target.value })} placeholder="e.g. 101" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Floor" type="number" value={String(roomForm.floor)} onChange={e => setRoomForm({ ...roomForm, floor: Number(e.target.value) })} />
                            <Select label="Type" value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })} options={ROOM_TYPES} />
                            <Input label="Capacity" type="number" value={String(roomForm.capacity)} onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} />
                        </div>
                        <Input label="Monthly Fee ₹" type="number" value={String(roomForm.monthlyFee)} onChange={e => setRoomForm({ ...roomForm, monthlyFee: Number(e.target.value) })} />
                        <Input label="Amenities (comma separated)" value={roomForm.amenities} onChange={e => setRoomForm({ ...roomForm, amenities: e.target.value })} placeholder="Fan, Bed, Desk, Cupboard" />
                        <Button className="w-full" onClick={handleAddRoom} loading={saving}>Add Room</Button>
                    </div>
                </Modal>

                {/* Mess Menu Modal */}
                <Modal open={!!messModal} onClose={() => setMessModal(null)} title={`${messModal} — Mess Menu`}>
                    <div className="space-y-4">
                        {mealForm.map((meal, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={meal.type === 'breakfast' ? 'warning' : meal.type === 'lunch' ? 'success' : meal.type === 'snacks' ? 'info' : 'purple'}>
                                        {meal.type}
                                    </Badge>
                                    <Input type="time" value={meal.time} onChange={e => {
                                        const updated = [...mealForm]; updated[i] = { ...meal, time: e.target.value }; setMealForm(updated)
                                    }} className="w-28" />
                                </div>
                                <Input placeholder="Items (comma separated)" value={meal.items} onChange={e => {
                                    const updated = [...mealForm]; updated[i] = { ...meal, items: e.target.value }; setMealForm(updated)
                                }} />
                            </div>
                        ))}
                        <Button className="w-full" onClick={handleSaveMess} loading={saving}>Save Menu</Button>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}