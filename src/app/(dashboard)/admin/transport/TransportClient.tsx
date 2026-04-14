'use client'

import { useState, useCallback, useRef } from 'react'
import {
    Bus, Plus, MapPin, Trash2, Phone,
    Edit2, X, AlertTriangle, CheckCircle2,
    Users, ChevronDown, Car, Truck,
    Clock, IndianRupee, Save,
} from 'lucide-react'
import { Spinner, EmptyState } from '@/components/ui'
import { Portal } from '@/components/ui/Portal'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface IStop {
    name: string
    pickupTime: string
    dropTime: string
    fee: number
    order: number
}

interface IRoute {
    _id: string
    routeName: string
    routeNo: string
    busNo: string
    vehicleType: 'bus' | 'van' | 'auto'
    driverName: string
    driverPhone: string
    driverLicense: string
    conductorName: string
    conductorPhone: string
    stops: IStop[]
    capacity: number
    assignedStudents: Array<{
        _id: string
        admissionNo: string
        class: string
        section: string
        userId: { name: string }
    }>
    notes: string
}

interface IStats {
    totalRoutes: number
    totalStudents: number
    totalCapacity: number
    totalBuses: number
    totalVans: number
}

// ─────────────────────────────────────────────
// Default stop
// ─────────────────────────────────────────────
const defaultStop = () => ({
    name: '', pickupTime: '07:00', dropTime: '14:00', fee: 0, order: 0,
})

const defaultForm = () => ({
    routeName: '',
    routeNo: '',
    busNo: '',
    vehicleType: 'bus' as const,
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    conductorName: '',
    conductorPhone: '',
    capacity: 40,
    notes: '',
    stops: [defaultStop()],
})

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function occupancyColor(used: number, capacity: number) {
    const pct = capacity > 0 ? (used / capacity) * 100 : 0
    if (pct >= 90) return { bar: '#EF4444', text: 'var(--danger-dark)', bg: 'var(--danger-light)' }
    if (pct >= 70) return { bar: '#F59E0B', text: 'var(--warning-dark)', bg: 'var(--warning-light)' }
    return { bar: '#10B981', text: 'var(--success-dark)', bg: 'var(--success-light)' }
}

function VehicleIcon({ type, size = 16 }: { type: string; size?: number }) {
    if (type === 'van') return <Car size={size} />
    if (type === 'auto') return <Truck size={size} />
    return <Bus size={size} />
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({
    label, value, icon, bg, iconColor, subtext,
}: {
    label: string
    value: string | number
    icon: React.ReactNode
    bg: string
    iconColor: string
    subtext?: string
}) {
    return (
        <div
            className="rounded-[var(--radius-lg)] p-4 border"
            style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, color: iconColor }}
                >
                    {icon}
                </div>
                <div>
                    <p
                        className="text-2xl font-extrabold tabular-nums"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {value}
                    </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        {label}
                    </p>
                    {subtext && (
                        <p className="text-[0.625rem] mt-0.5" style={{ color: 'var(--text-light)' }}>
                            {subtext}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Form Field
// ─────────────────────────────────────────────
function Field({
    label, required, children,
}: {
    label: string
    required?: boolean
    children: React.ReactNode
}) {
    return (
        <div>
            <label
                className="block text-xs font-semibold mb-1.5 font-display"
                style={{ color: 'var(--text-primary)' }}
            >
                {label}
                {required && <span style={{ color: 'var(--danger)' }}> *</span>}
            </label>
            {children}
        </div>
    )
}

// ─────────────────────────────────────────────
// Route Form Modal (Add + Edit)
// ─────────────────────────────────────────────
function RouteFormModal({
    route,
    onClose,
    onSave,
}: {
    route?: IRoute | null
    onClose: () => void
    onSave: (data: any) => Promise<void>
}) {
    const isEdit = !!route
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState(() =>
        isEdit
            ? {
                routeName: route!.routeName,
                routeNo: route!.routeNo,
                busNo: route!.busNo,
                vehicleType: route!.vehicleType,
                driverName: route!.driverName,
                driverPhone: route!.driverPhone,
                driverLicense: route!.driverLicense ?? '',
                conductorName: route!.conductorName ?? '',
                conductorPhone: route!.conductorPhone ?? '',
                capacity: route!.capacity,
                notes: route!.notes ?? '',
                stops: route!.stops?.length
                    ? route!.stops
                    : [defaultStop()],
            }
            : defaultForm()
    )

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

    const addStop = () =>
        setForm(f => ({ ...f, stops: [...f.stops, defaultStop()] }))

    const removeStop = (i: number) =>
        setForm(f => ({
            ...f,
            stops: f.stops.filter((_, idx) => idx !== i),
        }))

    const updateStop = (i: number, k: string, v: any) =>
        setForm(f => {
            const stops = [...f.stops]
            stops[i] = { ...stops[i], [k]: v }
            return { ...f, stops }
        })

    const handleSave = async () => {
        setError('')
        if (!form.routeName.trim()) { setError('Route name is required'); return }
        if (!form.routeNo.trim()) { setError('Route number is required'); return }
        if (!form.busNo.trim()) { setError('Bus number is required'); return }
        if (!form.driverName.trim()) { setError('Driver name is required'); return }
        if (!form.driverPhone.trim()) { setError('Driver phone is required'); return }

        const emptyStop = form.stops.find(s => !s.name.trim())
        if (emptyStop) { setError('All stop names are required'); return }

        setSaving(true)
        try {
            await onSave({
                ...(isEdit && { id: route!._id }),
                ...form,
                capacity: Number(form.capacity),
            })
        } catch (e: any) {
            setError(e.message)
            setSaving(false)
        }
    }

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-2xl rounded-2xl overflow-hidden my-8"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4 border-b"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <div>
                            <h3
                                className="text-base font-bold font-display"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {isEdit ? 'Edit Route' : 'Add Bus Route'}
                            </h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {isEdit ? `Editing ${route!.routeNo}` : 'Create a new transport route'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-5 max-h-[72vh] overflow-y-auto">

                        {error && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}
                            >
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}

                        {/* Route Info */}
                        <div>
                            <p
                                className="text-xs font-bold uppercase tracking-wider mb-3"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Route Information
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Route Name" required>
                                    <input
                                        value={form.routeName}
                                        onChange={e => set('routeName', e.target.value)}
                                        placeholder="e.g. City Route 1"
                                        className="input-clean"
                                    />
                                </Field>
                                <Field label="Route No" required>
                                    <input
                                        value={form.routeNo}
                                        onChange={e => set('routeNo', e.target.value)}
                                        placeholder="R1"
                                        className="input-clean"
                                        disabled={isEdit}
                                    />
                                </Field>
                                <Field label="Vehicle Type">
                                    <select
                                        value={form.vehicleType}
                                        onChange={e => set('vehicleType', e.target.value)}
                                        className="input-clean"
                                    >
                                        <option value="bus">Bus</option>
                                        <option value="van">Van</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                <Field label="Bus / Vehicle Number" required>
                                    <input
                                        value={form.busNo}
                                        onChange={e => set('busNo', e.target.value)}
                                        placeholder="e.g. CG-07-1234"
                                        className="input-clean"
                                    />
                                </Field>
                                <Field label="Seating Capacity">
                                    <input
                                        type="number"
                                        value={form.capacity}
                                        onChange={e => set('capacity', Number(e.target.value))}
                                        min="1" max="100"
                                        className="input-clean"
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Driver Info */}
                        <div>
                            <p
                                className="text-xs font-bold uppercase tracking-wider mb-3"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Driver & Conductor
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Driver Name" required>
                                    <input
                                        value={form.driverName}
                                        onChange={e => set('driverName', e.target.value)}
                                        placeholder="Driver full name"
                                        className="input-clean"
                                    />
                                </Field>
                                <Field label="Driver Phone" required>
                                    <input
                                        value={form.driverPhone}
                                        onChange={e => set('driverPhone', e.target.value)}
                                        placeholder="10-digit number"
                                        className="input-clean"
                                    />
                                </Field>
                                <Field label="License No">
                                    <input
                                        value={form.driverLicense}
                                        onChange={e => set('driverLicense', e.target.value)}
                                        placeholder="DL number"
                                        className="input-clean"
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <Field label="Conductor Name">
                                    <input
                                        value={form.conductorName}
                                        onChange={e => set('conductorName', e.target.value)}
                                        placeholder="Optional"
                                        className="input-clean"
                                    />
                                </Field>
                                <Field label="Conductor Phone">
                                    <input
                                        value={form.conductorPhone}
                                        onChange={e => set('conductorPhone', e.target.value)}
                                        placeholder="Optional"
                                        className="input-clean"
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Stops */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Stops ({form.stops.length})
                                </p>
                                <button
                                    onClick={addStop}
                                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5
                             rounded-[var(--radius-sm)] transition-all"
                                    style={{
                                        background: 'var(--primary-50)',
                                        color: 'var(--primary-600)',
                                        border: '1px solid var(--primary-200)',
                                    }}
                                >
                                    <Plus size={11} /> Add Stop
                                </button>
                            </div>

                            <div className="space-y-2">
                                {form.stops.map((stop, i) => (
                                    <div
                                        key={i}
                                        className="grid gap-2 items-end p-3 rounded-[var(--radius-md)] border"
                                        style={{
                                            background: 'var(--bg-subtle)',
                                            borderColor: 'var(--border)',
                                            gridTemplateColumns: '1fr auto auto auto auto',
                                        }}
                                    >
                                        {/* Stop number */}
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center
                                   text-xs font-bold flex-shrink-0"
                                                style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}
                                            >
                                                {i + 1}
                                            </div>
                                            <input
                                                value={stop.name}
                                                onChange={e => updateStop(i, 'name', e.target.value)}
                                                placeholder="Stop name"
                                                className="input-clean flex-1"
                                            />
                                        </div>

                                        {/* Pickup */}
                                        <div>
                                            <p className="text-[0.5625rem] font-semibold mb-1"
                                                style={{ color: 'var(--text-muted)' }}>
                                                Pickup
                                            </p>
                                            <input
                                                type="time"
                                                value={stop.pickupTime}
                                                onChange={e => updateStop(i, 'pickupTime', e.target.value)}
                                                className="input-clean w-28"
                                            />
                                        </div>

                                        {/* Drop */}
                                        <div>
                                            <p className="text-[0.5625rem] font-semibold mb-1"
                                                style={{ color: 'var(--text-muted)' }}>
                                                Drop
                                            </p>
                                            <input
                                                type="time"
                                                value={stop.dropTime}
                                                onChange={e => updateStop(i, 'dropTime', e.target.value)}
                                                className="input-clean w-28"
                                            />
                                        </div>

                                        {/* Fee */}
                                        <div>
                                            <p className="text-[0.5625rem] font-semibold mb-1"
                                                style={{ color: 'var(--text-muted)' }}>
                                                Fee/mo ₹
                                            </p>
                                            <input
                                                type="number"
                                                value={stop.fee}
                                                onChange={e => updateStop(i, 'fee', Number(e.target.value))}
                                                min="0"
                                                className="input-clean w-20"
                                            />
                                        </div>

                                        {/* Remove */}
                                        {form.stops.length > 1 && (
                                            <button
                                                onClick={() => removeStop(i)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center
                                   transition-all self-end mb-0.5"
                                                style={{
                                                    background: 'var(--danger-light)',
                                                    color: 'var(--danger)',
                                                    border: '1px solid rgba(239,68,68,0.2)',
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <Field label="Notes">
                            <textarea
                                value={form.notes}
                                onChange={e => set('notes', e.target.value)}
                                placeholder="Any additional notes about this route…"
                                rows={2}
                                className="input-clean resize-none"
                            />
                        </Field>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex gap-2.5 px-5 py-4 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                    >
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px]"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                         text-white flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                            }}
                        >
                            {saving ? <Spinner size="sm" /> : <Save size={14} />}
                            {saving
                                ? 'Saving…'
                                : isEdit ? 'Update Route' : 'Create Route'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// Route Detail Modal — stops + students
// ─────────────────────────────────────────────
function RouteDetailModal({
    route,
    onClose,
}: {
    route: IRoute
    onClose: () => void
}) {
    const occ = occupancyColor(
        route.assignedStudents?.length ?? 0,
        route.capacity
    )

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-lg rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s ease forwards',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-start justify-between px-5 py-4 border-b"
                        style={{ borderColor: 'var(--border)' }}
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <VehicleIcon type={route.vehicleType} size={16} />
                                <h3
                                    className="text-base font-bold font-display"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {route.routeName}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}
                                >
                                    Route {route.routeNo}
                                </span>
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                                >
                                    Bus {route.busNo}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

                        {/* Driver info */}
                        <div
                            className="grid grid-cols-2 gap-3 p-3 rounded-[var(--radius-md)]"
                            style={{ background: 'var(--bg-muted)' }}
                        >
                            <div>
                                <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-0.5"
                                    style={{ color: 'var(--text-muted)' }}>
                                    Driver
                                </p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {route.driverName}
                                </p>
                                <p className="text-xs flex items-center gap-1 mt-0.5"
                                    style={{ color: 'var(--text-muted)' }}>
                                    <Phone size={10} /> {route.driverPhone}
                                </p>
                            </div>
                            {route.conductorName && (
                                <div>
                                    <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-0.5"
                                        style={{ color: 'var(--text-muted)' }}>
                                        Conductor
                                    </p>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {route.conductorName}
                                    </p>
                                    {route.conductorPhone && (
                                        <p className="text-xs flex items-center gap-1 mt-0.5"
                                            style={{ color: 'var(--text-muted)' }}>
                                            <Phone size={10} /> {route.conductorPhone}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Occupancy */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                    Occupancy
                                </p>
                                <span
                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: occ.bg, color: occ.text }}
                                >
                                    {route.assignedStudents?.length ?? 0} / {route.capacity}
                                </span>
                            </div>
                            <div
                                className="w-full h-2 rounded-full overflow-hidden"
                                style={{ background: 'var(--bg-muted)' }}
                            >
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100,
                                            ((route.assignedStudents?.length ?? 0) / route.capacity) * 100
                                        )}%`,
                                        background: occ.bar,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Stops */}
                        {route.stops?.length > 0 && (
                            <div>
                                <p
                                    className="text-xs font-bold uppercase tracking-wider mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Stops ({route.stops.length})
                                </p>
                                <div className="space-y-1.5">
                                    {[...route.stops]
                                        .sort((a, b) => a.order - b.order)
                                        .map((stop, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border"
                                                style={{
                                                    background: 'var(--bg-subtle)',
                                                    borderColor: 'var(--border)',
                                                }}
                                            >
                                                <div
                                                    className="w-6 h-6 rounded-full flex items-center justify-center
                                     text-xs font-bold flex-shrink-0"
                                                    style={{
                                                        background: 'var(--primary-100)',
                                                        color: 'var(--primary-700)',
                                                    }}
                                                >
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="text-sm font-semibold truncate"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        {stop.name}
                                                    </p>
                                                    <p
                                                        className="text-[0.625rem] flex items-center gap-2 mt-0.5"
                                                        style={{ color: 'var(--text-muted)' }}
                                                    >
                                                        <Clock size={9} /> {stop.pickupTime} pickup · {stop.dropTime} drop
                                                    </p>
                                                </div>
                                                {stop.fee > 0 && (
                                                    <div
                                                        className="flex items-center gap-0.5 text-xs font-bold px-2 py-1
                                       rounded-full"
                                                        style={{
                                                            background: 'var(--warning-light)',
                                                            color: 'var(--warning-dark)',
                                                        }}
                                                    >
                                                        <IndianRupee size={10} />
                                                        {stop.fee}/mo
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Assigned Students */}
                        {route.assignedStudents?.length > 0 && (
                            <div>
                                <p
                                    className="text-xs font-bold uppercase tracking-wider mb-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    Assigned Students ({route.assignedStudents.length})
                                </p>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {route.assignedStudents.map(s => (
                                        <div
                                            key={s._id}
                                            className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]"
                                            style={{ background: 'var(--bg-muted)' }}
                                        >
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center
                                   text-xs font-bold flex-shrink-0"
                                                style={{
                                                    background: 'var(--primary-100)',
                                                    color: 'var(--primary-700)',
                                                }}
                                            >
                                                {(s.userId?.name || 'S').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {s.userId?.name}
                                                </p>
                                                <p className="text-[0.625rem]" style={{ color: 'var(--text-muted)' }}>
                                                    {s.admissionNo} · Class {s.class}{s.section ? `-${s.section}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {route.notes && (
                            <div
                                className="px-3 py-2 rounded-[var(--radius-md)] text-sm"
                                style={{
                                    background: 'var(--bg-muted)',
                                    color: 'var(--text-secondary)',
                                    borderLeft: '3px solid var(--primary-300)',
                                }}
                            >
                                {route.notes}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// Delete Confirm
// ─────────────────────────────────────────────
function DeleteModal({
    route,
    onClose,
    onDelete,
}: {
    route: IRoute
    onClose: () => void
    onDelete: () => Promise<void>
}) {
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')

    const handle = async () => {
        setDeleting(true)
        try { await onDelete() }
        catch (e: any) { setError(e.message); setDeleting(false) }
    }

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)' }}
            >
                <div
                    className="w-full max-w-sm rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-xl)',
                        animation: 'scaleIn 0.2s ease forwards',
                    }}
                >
                    <div className="px-5 py-4">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'var(--danger-light)' }}
                        >
                            <Trash2 size={20} style={{ color: 'var(--danger)' }} />
                        </div>
                        <h3 className="text-base font-bold font-display mb-1.5"
                            style={{ color: 'var(--text-primary)' }}>
                            Delete Route?
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Delete <strong>"{route.routeName}"</strong> ({route.routeNo})?
                            This cannot be undone.
                        </p>
                        {error && (
                            <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>{error}</p>
                        )}
                    </div>
                    <div
                        className="flex gap-2.5 px-5 py-3 border-t"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                    >
                        <button
                            onClick={onClose}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold border-[1.5px]"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handle}
                            disabled={deleting}
                            className="flex-1 h-10 rounded-[var(--radius-md)] text-sm font-semibold
                         text-white flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                        >
                            {deleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
                            {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}

// ─────────────────────────────────────────────
// MAIN CLIENT
// ─────────────────────────────────────────────
export function TransportClient({
    initialRoutes,
    initialStats,
    userRole,
}: {
    initialRoutes: IRoute[]
    initialStats: IStats
    userRole: string
}) {
    const canEdit = userRole === 'admin'

    const [routes, setRoutes] = useState<IRoute[]>(initialRoutes)
    const [stats, setStats] = useState<IStats>(initialStats)
    const [loading, setLoading] = useState(false)

    const [showAdd, setShowAdd] = useState(false)
    const [editRoute, setEditRoute] = useState<IRoute | null>(null)
    const [viewRoute, setViewRoute] = useState<IRoute | null>(null)
    const [deleteRoute, setDeleteRoute] = useState<IRoute | null>(null)

    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showToast = useCallback((type: 'success' | 'error', msg: string) => {
        setToast({ type, msg })
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 3500)
    }, [])

    // ── Fetch ──
    const fetchRoutes = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/transport')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setRoutes(data.routes ?? [])
            setStats(data.stats)
        } catch (e: any) {
            showToast('error', e.message || 'Failed to load routes')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    // ── Create ──
    const handleCreate = async (data: any) => {
        const res = await fetch('/api/transport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to create route')
        setShowAdd(false)
        showToast('success', 'Route created successfully!')
        fetchRoutes()
    }

    // ── Edit ──
    const handleEdit = async (data: any) => {
        const res = await fetch('/api/transport', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to update route')
        setEditRoute(null)
        showToast('success', 'Route updated!')
        fetchRoutes()
    }

    // ── Delete ──
    const handleDelete = async () => {
        if (!deleteRoute) return
        const res = await fetch('/api/transport', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deleteRoute._id }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to delete route')
        setDeleteRoute(null)
        showToast('success', 'Route deleted')
        fetchRoutes()
    }

    return (
        <>
            <div className="space-y-5 pb-8 max-w-[1280px] mx-auto">

                {/* ── PAGE HEADER ── */}
                <div className="portal-page-header">
                    <div>
                        <div className="portal-breadcrumb mb-1">
                            <span style={{ color: 'var(--text-muted)' }}>Admin</span>
                            <span className="bc-sep">/</span>
                            <span className="bc-current">Transport</span>
                        </div>
                        <h1 className="portal-page-title">Transport Management</h1>
                        <p className="portal-page-subtitle">
                            Bus routes, drivers, stops & student assignments
                        </p>
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex items-center gap-1.5 px-4 h-9 rounded-[var(--radius-md)]
                         text-sm font-semibold text-white"
                            style={{
                                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                            }}
                        >
                            <Plus size={14} /> Add Route
                        </button>
                    )}
                </div>

                {/* ── STATS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <StatCard
                        label="Total Routes" value={stats.totalRoutes}
                        icon={<Bus size={18} />}
                        bg="var(--info-light)" iconColor="var(--info)"
                    />
                    <StatCard
                        label="Students" value={stats.totalStudents}
                        icon={<Users size={18} />}
                        bg="var(--primary-50)" iconColor="var(--primary-500)"
                    />
                    <StatCard
                        label="Total Capacity" value={stats.totalCapacity}
                        icon={<Bus size={18} />}
                        bg="var(--success-light)" iconColor="var(--success)"
                        subtext={`${stats.totalCapacity - stats.totalStudents} seats free`}
                    />
                    <StatCard
                        label="Buses" value={stats.totalBuses}
                        icon={<Bus size={18} />}
                        bg="var(--bg-muted)" iconColor="var(--text-secondary)"
                    />
                    <StatCard
                        label="Vans" value={stats.totalVans}
                        icon={<Car size={18} />}
                        bg="var(--bg-muted)" iconColor="var(--text-secondary)"
                    />
                </div>

                {/* ── ROUTES GRID ── */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner size="lg" />
                    </div>
                ) : routes.length === 0 ? (
                    <div className="portal-card">
                        <div className="portal-empty">
                            <div className="portal-empty-icon">
                                <Bus size={22} style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <p className="portal-empty-title">No routes yet</p>
                            <p className="portal-empty-text">
                                Add bus routes to manage your school transport
                            </p>
                            {canEdit && (
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className="mt-4 flex items-center gap-1.5 px-4 h-9
                             rounded-[var(--radius-md)] text-sm font-semibold text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                    }}
                                >
                                    <Plus size={14} /> Add First Route
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {routes.map(route => {
                            const assigned = route.assignedStudents?.length ?? 0
                            const occ = occupancyColor(assigned, route.capacity)

                            return (
                                <div
                                    key={route._id}
                                    className="rounded-[var(--radius-lg)] border transition-all duration-200
                             hover:-translate-y-0.5"
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderColor: 'var(--border)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                >
                                    {/* Card Header */}
                                    <div
                                        className="px-4 pt-4 pb-3 border-b"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div
                                                    className="w-9 h-9 rounded-[var(--radius-md)] flex items-center
                                     justify-center flex-shrink-0"
                                                    style={{
                                                        background: 'var(--primary-50)',
                                                        color: 'var(--primary-500)',
                                                    }}
                                                >
                                                    <VehicleIcon type={route.vehicleType} size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-sm font-bold truncate"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        {route.routeName}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                        <span
                                                            className="text-[0.625rem] px-1.5 py-0.5 rounded-full font-bold"
                                                            style={{
                                                                background: 'var(--primary-50)',
                                                                color: 'var(--primary-600)',
                                                            }}
                                                        >
                                                            {route.routeNo}
                                                        </span>
                                                        <span
                                                            className="text-[0.625rem] px-1.5 py-0.5 rounded-full font-semibold"
                                                            style={{
                                                                background: 'var(--bg-muted)',
                                                                color: 'var(--text-muted)',
                                                            }}
                                                        >
                                                            {route.busNo}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {canEdit && (
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => setEditRoute(route)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center
                                       border-[1.5px] transition-all"
                                                        style={{
                                                            borderColor: 'var(--border)',
                                                            color: 'var(--text-muted)',
                                                        }}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteRoute(route)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center
                                       border-[1.5px] transition-all"
                                                        style={{
                                                            borderColor: 'rgba(239,68,68,0.2)',
                                                            color: 'var(--danger)',
                                                            background: 'var(--danger-light)',
                                                        }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="px-4 py-3 space-y-2.5">

                                        {/* Driver */}
                                        <div
                                            className="flex items-center gap-2 text-xs"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            <Phone size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            <span className="truncate">
                                                {route.driverName} · {route.driverPhone}
                                            </span>
                                        </div>

                                        {/* Stops */}
                                        <div
                                            className="flex items-center gap-2 text-xs"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            <span>
                                                {route.stops?.length ?? 0} stops
                                                {route.stops?.[0] && ` · Starts ${route.stops[0].pickupTime}`}
                                            </span>
                                        </div>

                                        {/* Occupancy bar */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[0.625rem] font-semibold"
                                                    style={{ color: 'var(--text-muted)' }}>
                                                    Occupancy
                                                </span>
                                                <span
                                                    className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{ background: occ.bg, color: occ.text }}
                                                >
                                                    {assigned}/{route.capacity}
                                                </span>
                                            </div>
                                            <div
                                                className="w-full h-1.5 rounded-full overflow-hidden"
                                                style={{ background: 'var(--bg-muted)' }}
                                            >
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, (assigned / route.capacity) * 100)}%`,
                                                        background: occ.bar,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div
                                        className="px-4 py-2.5 border-t"
                                        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}
                                    >
                                        <button
                                            onClick={() => setViewRoute(route)}
                                            className="w-full flex items-center justify-center gap-1.5
                                 text-xs font-semibold transition-all py-1"
                                            style={{ color: 'var(--primary-600)' }}
                                        >
                                            <MapPin size={11} /> View Details
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── MODALS ── */}
            {showAdd && (
                <RouteFormModal
                    onClose={() => setShowAdd(false)}
                    onSave={handleCreate}
                />
            )}

            {editRoute && (
                <RouteFormModal
                    route={editRoute}
                    onClose={() => setEditRoute(null)}
                    onSave={handleEdit}
                />
            )}

            {viewRoute && (
                <RouteDetailModal
                    route={viewRoute}
                    onClose={() => setViewRoute(null)}
                />
            )}

            {deleteRoute && (
                <DeleteModal
                    route={deleteRoute}
                    onClose={() => setDeleteRoute(null)}
                    onDelete={handleDelete}
                />
            )}

            {/* ── TOAST ── */}
            {toast && (
                <Portal>
                    <div
                        className="fixed bottom-5 right-5 z-[70] flex items-center gap-3
                       px-4 py-3 rounded-[var(--radius-lg)] border max-w-xs"
                        style={{
                            background: 'var(--bg-card)',
                            borderColor: 'var(--border)',
                            boxShadow: 'var(--shadow-lg)',
                            animation: 'toastIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
                        }}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        ) : (
                            <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                        )}
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {toast.msg}
                        </p>
                        <button onClick={() => setToast(null)} style={{ color: 'var(--text-muted)' }}>
                            <X size={14} />
                        </button>
                    </div>
                </Portal>
            )}
        </>
    )
}