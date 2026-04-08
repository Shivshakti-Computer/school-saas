'use client'
import { useEffect, useState } from 'react'
import { PageHeader, Button, Card, Badge, Modal, Input, Select, Spinner, Alert, EmptyState } from '@/components/ui'
import { PlayCircle, Plus, BookOpen, Video, FileText, Eye, Globe } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

const CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Hindi', 'English', 'Mathematics', 'Science', 'Social Studies', 'Computer', 'Sanskrit']
const LESSON_TYPES = [
    { value: 'video', label: '🎥 Video', icon: Video },
    { value: 'pdf', label: '📄 PDF Document', icon: FileText },
    { value: 'text', label: '📝 Text Content', icon: BookOpen },
    { value: 'quiz', label: '❓ Quiz', icon: BookOpen },
]

export default function LMSPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
    const [saving, setSaving] = useState(false)
    const [courseModal, setCourseModal] = useState(false)
    const [lessonModal, setLessonModal] = useState<string | null>(null)
    const [viewCourse, setViewCourse] = useState<any>(null)
    const [filterClass, setFilterClass] = useState('')

    const [courseForm, setCourseForm] = useState({
        title: '', description: '', class: '1', subject: 'Hindi',
    })

    const [lessonForm, setLessonForm] = useState({
        title: '', type: 'video' as string, content: '', duration: 0,
    })

    const fetchCourses = () => {
        const url = filterClass ? `/api/lms?class=${filterClass}` : '/api/lms'
        fetch(url).then(r => r.json()).then(d => { setCourses(d.courses || []); setLoading(false) })
    }

    useEffect(() => { fetchCourses() }, [filterClass])

    const handleCreateCourse = async () => {
        if (!courseForm.title.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/lms', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseForm),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Course created!' })
            setCourseModal(false)
            setCourseForm({ title: '', description: '', class: '1', subject: 'Hindi' })
            fetchCourses()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handleAddLesson = async () => {
        if (!lessonModal || !lessonForm.title.trim()) return
        setSaving(true)
        try {
            const res = await fetch('/api/lms', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: lessonModal, action: 'addLesson', lesson: lessonForm }),
            })
            if (!res.ok) throw new Error('Failed')
            setAlert({ type: 'success', msg: 'Lesson added!' })
            setLessonModal(null)
            setLessonForm({ title: '', type: 'video', content: '', duration: 0 })
            fetchCourses()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
        setSaving(false)
    }

    const handlePublish = async (id: string) => {
        try {
            await fetch('/api/lms', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'publish' }),
            })
            setAlert({ type: 'success', msg: 'Course published!' })
            fetchCourses()
        } catch (e: any) { setAlert({ type: 'error', msg: e.message }) }
    }

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

    return (
        <div>
            <PageHeader
                title="Online Learning (LMS)"
                subtitle={`${courses.length} courses`}
                action={<Button onClick={() => setCourseModal(true)}><Plus size={16} /> New Course</Button>}
            />

            {alert && <div className="mb-5"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

            <div className="flex gap-3 mb-5">
                <Select value={filterClass} onChange={e => setFilterClass(e.target.value)} options={[{ value: '', label: 'All Classes' }, ...CLASSES.map(c => ({ value: c, label: `Class ${c}` }))]} />
            </div>

            {courses.length === 0 ? (
                <EmptyState icon={<PlayCircle size={24} />} title="No courses" description="Create online courses for students" action={<Button onClick={() => setCourseModal(true)}><Plus size={14} /> Create Course</Button>} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {courses.map(course => (
                        <Card key={course._id} className="flex flex-col">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-sm">{course.title}</h3>
                                    <div className="flex gap-1.5 mt-1">
                                        <Badge variant="info">Class {course.class}</Badge>
                                        <Badge variant="primary">{course.subject}</Badge>
                                    </div>
                                </div>
                                {course.isPublished ? (
                                    <Badge variant="success"><Globe size={10} className="mr-1" />Live</Badge>
                                ) : (
                                    <Badge variant="warning">Draft</Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description || 'No description'}</p>

                            <div className="bg-slate-50 rounded-lg p-2.5 mb-3 flex-1">
                                <p className="text-xs font-medium text-slate-600 mb-1.5">{course.lessons?.length || 0} Lessons</p>
                                {course.lessons?.slice(0, 3).map((l: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                        <span>{l.type === 'video' ? '🎥' : l.type === 'pdf' ? '📄' : l.type === 'quiz' ? '❓' : '📝'}</span>
                                        <span className="truncate">{l.title}</span>
                                    </div>
                                ))}
                                {(course.lessons?.length || 0) > 3 && (
                                    <p className="text-[10px] text-slate-400">+{course.lessons.length - 3} more</p>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setLessonModal(course._id)}>
                                    <Plus size={12} /> Lesson
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setViewCourse(course)}>
                                    <Eye size={12} />
                                </Button>
                                {!course.isPublished && (
                                    <Button size="sm" onClick={() => handlePublish(course._id)}>
                                        <Globe size={12} /> Publish
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Portal>
                {/* Create Course */}
                <Modal open={courseModal} onClose={() => setCourseModal(false)} title="New Course">
                    <div className="space-y-4">
                        <Input label="Course Title" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="e.g. Mathematics Chapter 1–5" />
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Class" value={courseForm.class} onChange={e => setCourseForm({ ...courseForm, class: e.target.value })} options={CLASSES.map(c => ({ value: c, label: `Class ${c}` }))} />
                            <Select label="Subject" value={courseForm.subject} onChange={e => setCourseForm({ ...courseForm, subject: e.target.value })} options={SUBJECTS.map(s => ({ value: s, label: s }))} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                            <textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400" placeholder="What will students learn?" />
                        </div>
                        <Button className="w-full" onClick={handleCreateCourse} loading={saving}>Create Course</Button>
                    </div>
                </Modal>

                {/* Add Lesson */}
                <Modal open={!!lessonModal} onClose={() => setLessonModal(null)} title="Add Lesson">
                    <div className="space-y-4">
                        <Input label="Lesson Title" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. Introduction to Algebra" />
                        <Select label="Content Type" value={lessonForm.type} onChange={e => setLessonForm({ ...lessonForm, type: e.target.value })} options={LESSON_TYPES} />
                        <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                                {lessonForm.type === 'video' ? 'YouTube/Video URL' : lessonForm.type === 'pdf' ? 'PDF URL' : 'Content'}
                            </label>
                            <textarea
                                value={lessonForm.content}
                                onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                                className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400"
                                placeholder={lessonForm.type === 'video' ? 'https://youtube.com/watch?v=...' : lessonForm.type === 'pdf' ? 'https://example.com/file.pdf' : 'Type lesson content here...'}
                            />
                        </div>
                        {lessonForm.type === 'video' && (
                            <Input label="Duration (minutes)" type="number" value={String(lessonForm.duration)} onChange={e => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })} />
                        )}
                        <Button className="w-full" onClick={handleAddLesson} loading={saving}>Add Lesson</Button>
                    </div>
                </Modal>

                {/* View Course */}
                <Modal open={!!viewCourse} onClose={() => setViewCourse(null)} title={viewCourse?.title || 'Course'} size="lg">
                    {viewCourse && (
                        <div>
                            <div className="flex gap-2 mb-4">
                                <Badge variant="info">Class {viewCourse.class}</Badge>
                                <Badge variant="primary">{viewCourse.subject}</Badge>
                                <Badge variant={viewCourse.isPublished ? 'success' : 'warning'}>
                                    {viewCourse.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-4">{viewCourse.description}</p>
                            <h4 className="font-semibold text-sm mb-3">Lessons ({viewCourse.lessons?.length || 0})</h4>
                            <div className="space-y-2">
                                {viewCourse.lessons?.map((l: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm">
                                            {l.type === 'video' ? '🎥' : l.type === 'pdf' ? '📄' : l.type === 'quiz' ? '❓' : '📝'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">{l.title}</p>
                                            <p className="text-xs text-slate-500">{l.type}{l.duration ? ` · ${l.duration} min` : ''}</p>
                                        </div>
                                        <Badge>{l.order || i + 1}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal>
            </Portal>
        </div>
    )
}