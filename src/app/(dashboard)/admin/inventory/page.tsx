'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Table, Tr, Td, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { Package, Plus, Edit2, AlertTriangle } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const CATEGORIES = ['Furniture', 'Electronics', 'Stationery', 'Sports', 'Lab Equipment', 'Books', 'Cleaning', 'Other']

interface InventoryItemType {
    _id: string
    name: string
    category: string
    sku?: string
    quantity: number
    minStock: number
    unitPrice: number
    location?: string
    lastUpdated: string
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItemType[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editItem, setEditItem] = useState<InventoryItemType | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('')

    const [form, setForm] = useState({
        name: '', category: 'Furniture', sku: '', quantity: 0, minStock: 5, unitPrice: 0, location: '',
    })

    const fetchItems = () => {
        fetch('/api/inventory').then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchItems() }, [])

    const openEdit = (item: InventoryItemType) => {
        setEditItem(item)
        setForm({
            name: item.name, category: item.category, sku: item.sku || '',
            quantity: item.quantity, minStock: item.minStock, unitPrice: item.unitPrice, location: item.location || '',
        })
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            if (editItem) {
                const res = await fetch('/api/inventory', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editItem._id, ...form }),
                })
                if (!res.ok) throw new Error('Failed')
                setAlert({ type: 'success', msg: 'Item updated!' })
            } else {
                const res = await fetch('/api/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })
                if (!res.ok) throw new Error('Failed')
                setAlert({ type: 'success', msg: 'Item added!' })
            }
            setModalOpen(false)
            setEditItem(null)
            setForm({ name: '', category: 'Furniture', sku: '', quantity: 0, minStock: 5, unitPrice: 0, location: '' })
            fetchItems()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const filtered = items.filter(i => {
        const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase())
        const matchCat = !filterCat || i.category === filterCat
        return matchSearch && matchCat
    })

    const lowStock = items.filter(i => i.quantity <= i.minStock).length
    const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Inventory Management"
                subtitle={`${items.length} items · Total value: ₹${totalValue.toLocaleString('en-IN')}`}
                action={<Button onClick={() => { setEditItem(null); setForm({ name: '', category: 'Furniture', sku: '', quantity: 0, minStock: 5, unitPrice: 0, location: '' }); setModalOpen(true) }}><Plus size={16} /> Add Item</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            {lowStock > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800"><strong>{lowStock} items</strong> are below minimum stock level</p>
                </div>
            )}

            <div className="flex gap-3 mb-5">
                <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
                <Select
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value)}
                    options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]}
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={<Package size={24} />} title="No items found" description="Add inventory items to track" />
            ) : (
                <Card padding={false}>
                    <Table headers={['Item', 'Category', 'SKU', 'Quantity', 'Min Stock', 'Unit Price', 'Location', 'Action']}>
                        {filtered.map(item => (
                            <Tr key={item._id}>
                                <Td className="font-medium">{item.name}</Td>
                                <Td><Badge>{item.category}</Badge></Td>
                                <Td className="text-xs text-slate-500">{item.sku || '—'}</Td>
                                <Td>
                                    <span className={item.quantity <= item.minStock ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                                        {item.quantity}
                                    </span>
                                </Td>
                                <Td className="text-slate-500">{item.minStock}</Td>
                                <Td>₹{item.unitPrice.toLocaleString('en-IN')}</Td>
                                <Td className="text-xs text-slate-500">{item.location || '—'}</Td>
                                <Td>
                                    <button onClick={() => openEdit(item)} className="text-indigo-600 hover:underline text-sm"><Edit2 size={14} /></button>
                                </Td>
                            </Tr>
                        ))}
                    </Table>
                </Card>
            )}

            <Portal>
                <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null) }} title={editItem ? 'Edit Item' : 'Add Item'}>
                    <div className="space-y-4">
                        <Input label="Item Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Desk" />
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
                            <Input label="SKU Code" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Optional" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Quantity" type="number" value={String(form.quantity)} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                            <Input label="Min Stock" type="number" value={String(form.minStock)} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} />
                            <Input label="Unit Price ₹" type="number" value={String(form.unitPrice)} onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) })} />
                        </div>
                        <Input label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 101" />
                        <Button className="w-full" onClick={handleSave} loading={saving}>{editItem ? 'Update Item' : 'Add Item'}</Button>
                    </div>
                </Modal>
            </Portal>
        </div>
    )
}