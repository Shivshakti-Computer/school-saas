'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Modal, Input, Spinner, Alert, EmptyState } from '@/components/ui'
import { Image, Plus, Trash2, Upload, Eye, X } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface Album {
    _id: string
    name: string
    description: string
    coverImage?: string
    images: Array<{ url: string; caption?: string; uploadedAt: string }>
    isPublic: boolean
    createdAt: string
}

export default function GalleryPage() {
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [viewAlbum, setViewAlbum] = useState<Album | null>(null)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)

    // Form
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(true)

    const fetchAlbums = () => {
        fetch('/api/gallery')
            .then(r => r.json())
            .then(d => { setAlbums(Array.isArray(d) ? d : []); setLoading(false) })
    }

    useEffect(() => { fetchAlbums() }, [])

    const handleCreate = async () => {
        if (!name.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isPublic, images: [] }),
            })
            if (!res.ok) throw new Error('Failed to create album')
            setAlert({ type: 'success', msg: 'Album created successfully!' })
            setModalOpen(false)
            setName('')
            setDescription('')
            fetchAlbums()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this album?')) return
        try {
            await fetch('/api/gallery', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            setAlert({ type: 'success', msg: 'Album deleted' })
            fetchAlbums()
        } catch (e: any) {
            setAlert({ type: 'error', msg: e.message })
        }
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Gallery & Events"
                subtitle={`${albums.length} albums`}
                action={
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus size={16} /> New Album
                    </Button>
                }
            />

            {alert && (
                <div className="mb-5">
                    <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
                </div>
            )}

            {albums.length === 0 ? (
                <EmptyState
                    icon={<Image size={24} />}
                    title="No albums yet"
                    description="Create your first photo album to showcase school events"
                    action={<Button onClick={() => setModalOpen(true)}><Plus size={14} /> Create Album</Button>}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {albums.map(album => (
                        <Card key={album._id} padding={false} className="overflow-hidden group">
                            <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
                                {album.coverImage ? (
                                    <img src={album.coverImage} alt={album.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                        <Image size={40} />
                                        <span className="text-xs">{album.images?.length || 0} photos</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setViewAlbum(album)}
                                        className="w-8 h-8 rounded-lg bg-white/90 shadow flex items-center justify-center text-slate-600 hover:text-indigo-600"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(album._id)}
                                        className="w-8 h-8 rounded-lg bg-white/90 shadow flex items-center justify-center text-slate-600 hover:text-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {album.isPublic && (
                                    <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                        Public
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-slate-800 text-sm mb-0.5">{album.name}</h3>
                                <p className="text-xs text-slate-500 line-clamp-1">{album.description || 'No description'}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    {album.images?.length || 0} photos · {new Date(album.createdAt).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Portal>
                {/* Create Modal */}
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Album">
                    <div className="space-y-4">
                        <Input label="Album Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Annual Day 2026" />
                        <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
                            Show on school website
                        </label>
                        <Button className="w-full" onClick={handleCreate} loading={saving}>Create Album</Button>
                    </div>
                </Modal>

                {/* View Modal */}
                <Modal open={!!viewAlbum} onClose={() => setViewAlbum(null)} title={viewAlbum?.name || 'Album'} size="lg">
                    {viewAlbum && (
                        <div>
                            <p className="text-sm text-slate-500 mb-4">{viewAlbum.description}</p>
                            {viewAlbum.images?.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {viewAlbum.images.map((img, i) => (
                                        <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                            <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    <Upload size={32} className="mx-auto mb-2" />
                                    <p className="text-sm">No photos yet. Upload photos to this album.</p>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </Portal>
        </div>
    )
}