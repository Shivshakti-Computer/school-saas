// src/app/(dashboard)/student/exams/page.tsx — NEW FILE
// Student apne exams dekhe + admit card download kare
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Spinner, EmptyState, Card } from '@/components/ui'
import { BookOpen, Download, Calendar, Clock, FileText,} from 'lucide-react'

interface ExamSubject {
  name:          string
  date:          string
  time:          string
  duration:      number
  totalMaxMarks: number
  components:    Array<{ name: string; maxMarks: number }>
}

interface ExamItem {
  _id:              string
  name:             string
  class:            string
  section:          string
  academicYear:     string
  status:           string
  resultPublished:  boolean
  admitCardEnabled: boolean
  subjects:         ExamSubject[]
}

export default function StudentExamsPage() {
  const [exams,   setExams]   = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/exams')
      .then(r => r.json())
      .then(d => { setExams(d.exams ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      upcoming:  { bg: 'bg-[var(--info-light)]',    text: 'text-[var(--info-dark)]',    label: 'Upcoming' },
      ongoing:   { bg: 'bg-[var(--warning-light)]', text: 'text-[var(--warning-dark)]', label: 'Ongoing'  },
      completed: { bg: 'bg-[var(--success-light)]', text: 'text-[var(--success-dark)]', label: 'Completed'},
    }
    const c = map[status] ?? map.upcoming
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  return (
    <div className="portal-content-enter space-y-5">

      <PageHeader
        title="My Exams"
        subtitle="Exam schedule, admit cards and results"
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No exams scheduled"
          description="Aapke exams yahan dikhenge jab school schedule karega"
        />
      ) : (
        <div className="space-y-4">
          {exams.map(exam => (
            <Card key={exam._id} padding={false}>

              {/* Exam header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === exam._id ? null : exam._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-[var(--text-primary)]">
                      {exam.name}
                    </h3>
                    {statusBadge(exam.status)}
                    {exam.resultPublished && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--success-light)] text-[var(--success-dark)]">
                        Results Out
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {exam.academicYear} · {exam.subjects.length} subjects
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  {/* Admit Card download */}
                  {exam.admitCardEnabled && (
                    <a
                      href={`/api/pdf/admitcard/${exam._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--primary-50)] text-[var(--primary-600)] border border-[var(--primary-200)] hover:bg-[var(--primary-100)] transition-all"
                    >
                      <Download size={12} />
                      Admit Card
                    </a>
                  )}
                </div>
              </div>

              {/* Schedule (expanded) */}
              {expanded === exam._id && (
                <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                    Exam Schedule
                  </p>
                  <div className="space-y-2">
                    {[...exam.subjects]
                      .sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                      )
                      .map(sub => {
                        const dateStr = sub.date
                          ? new Date(sub.date).toLocaleDateString('en-IN', {
                              weekday: 'short', day: '2-digit',
                              month: 'short', year: 'numeric',
                            })
                          : '—'
                        const marksInfo = sub.components?.length > 0
                          ? sub.components.map(c => `${c.name}(${c.maxMarks})`).join(' + ')
                          : `${sub.totalMaxMarks} marks`

                        return (
                          <div
                            key={sub.name}
                            className="flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] border border-[var(--border)]"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {sub.name}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {marksInfo}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-shrink-0">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {dateStr}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {sub.time || '—'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}