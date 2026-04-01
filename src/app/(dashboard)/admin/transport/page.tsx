'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Spinner, Alert, EmptyState, StatCard } from '@/components/ui'
import { Bus, Plus, MapPin, Trash2, Phone } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

export default function TransportPage() {
    const [routes, setRoutes] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [addModal, setAddModal] = useState(false)
    const [viewRoute, setViewRoute] = useState<any>(null)

    const [form, setForm] = useState({
        routeName: '', routeNo: '', busNo: '', driverName: '', driverPhone: '',
        conductorName: '', conductorPhone: '', capacity: 40,
        stops: [{ name: '', pickupTime: '07:00', dropTime: '14:00', fee: 0 }],
    })

    const fetchRoutes = async () => {
        const res = await fetch('/api/transport')
        const data = await res.json()
        setRoutes(data.routes || [])
        setStats(data.stats)
        setLoading(false)
    }

    useEffect(() => { fetchRoutes() }, [])

    const addStop = () => {
        setForm({ ...form, stops: [...form.stops, { name: '', pickupTime: '07:00', dropTime: '14:00', fee: 0 }] })
    }

    const removeStop = (i: number) => {
        setForm({ ...form, stops: form.stops.filter((_, idx) => idx !== i) })
    }

    const updateStop = (i: number, field: string, value: any) => {
        const stops = [...form.stops]
        stops[i] = { ...stops[i], [field]: value }
        setForm({ ...form, stops })
    }

    const handleCreate = async () => {
        if (!form.routeName.trim() || !form.routeNo.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/transport', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Route created!' })
            setAddModal(false)
            setForm({ routeName: '', routeNo: '', busNo: '', driverName: '', driverPhone: '', conductorName: '', conductorPhone: '', capacity: 40, stops: [{ name: '', pickupTime: '07:00', dropTime: '14:00', fee: 0 }] })
            fetchRoutes()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this route?')) return
        await fetch('/api/transport', {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        setAlert({ type: 'success', msg: 'Route deleted' })
        fetchRoutes()
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Transport Management"
                subtitle="Bus routes, drivers, stops"
                action={<Button onClick={() => setAddModal(true)}><Plus size={16} /> Add Route</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label="Total Routes" value={stats.totalRoutes} icon={<Bus size={18} />} color="indigo" />
                    <StatCard label="Students Using" value={stats.totalStudents} icon={<MapPin size={18} />} color="emerald" />
                    <StatCard label="Total Capacity" value={stats.totalCapacity} icon={<Bus size={18} />} color="amber" />
                </div>
            )}

            {routes.length === 0 ? (
                <EmptyState icon={<Bus size={24} />} title="No routes" description="Add bus routes" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {routes.map(route => (
                        <Card key={route._id}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-800">{route.routeName}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="info">Route {route.routeNo}</Badge>
                                        <Badge>Bus {route.busNo}</Badge>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setViewRoute(route)} className="p-1.5 rounded-lg hover:bg-slate-100"><MapPin size={14} /></button>
                                    <button onClick={() => handleDelete(route._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> Driver: {route.driverName} — {route.driverPhone}</p>
                                {route.conductorName && <p className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> Conductor: {route.conductorName}</p>}
                                <p>Stops: {route.stops?.length || 0} · Capacity: {route.capacity} · Students: {route.assignedStudents?.length || 0}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Portal>
                {/* View Route Modal */}
                <Modal open={!!viewRoute} onClose={() => setViewRoute(null)} title={viewRoute?.routeName || 'Route'} size="lg">
                    {viewRoute && (
                        <div>
                            <div className="space-y-2 mb-4">
                                {viewRoute.stops?.map((stop: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">{i + 1}</div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{stop.name}</p>
                                            <p className="text-xs text-slate-500">Pickup: {stop.pickupTime} · Drop: {stop.dropTime}</p>
                                        </div>
                                        <Badge variant="warning">₹{stop.fee}/mo</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Add Route Modal */}
                <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Bus Route" size="lg">
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Route Name" value={form.routeName} onChange={e => setForm({ ...form, routeName: e.target.value })} placeholder="e.g. City Route 1" />
                            <Input label="Route No" value={form.routeNo} onChange={e => setForm({ ...form, routeNo: e.target.value })} placeholder="R1" />
                            <Input label="Bus No" value={form.busNo} onChange={e => setForm({ ...form, busNo: e.target.value })} placeholder="CG-07-1234" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Driver Name" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
                            <Input label="Driver Phone" value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Conductor (optional)" value={form.conductorName} onChange={e => setForm({ ...form, conductorName: e.target.value })} />
                            <Input label="Capacity" type="number" value={String(form.capacity)} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-slate-600">Stops</label>
                                <button onClick={addStop} className="text-xs text-indigo-600 hover:underline">+ Add Stop</button>
                            </div>
                            {form.stops.map((stop, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-end">
                                    <Input placeholder="Stop name" value={stop.name} onChange={e => updateStop(i, 'name', e.target.value)} className="flex-1" />
                                    <Input type="time" value={stop.pickupTime} onChange={e => updateStop(i, 'pickupTime', e.target.value)} className="w-24" />
                                    <Input type="time" value={stop.dropTime} onChange={e => updateStop(i, 'dropTime', e.target.value)} className="w-24" />
                                    <Input type="number" placeholder="Fee" value={String(stop.fee)} onChange={e => updateStop(i, 'fee', Number(e.target.value))} className="w-20" />
                                    {form.stops.length > 1 && <button onClick={() => removeStop(i)} className="text-red-500 mb-2">✕</button>}
                                </div>
                            ))}
                        </div>
                        <Button className="w-full" onClick={handleCreate} loading={saving}>Create Route</Button>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}