/* ============================================================
   FILE: src/app/(dashboard)/admin/reports/page.tsx
   Reports Hub — Navigation to module-specific reports
   ============================================================ */

'use client'

import { useRouter } from 'next/navigation'
import {
  Calendar,
  DollarSign,
  Users,
  GraduationCap,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

interface ReportCard {
  key:         string
  title:       string
  description: string
  icon:        LucideIcon
  iconBg:      string
  iconColor:   string
  action:      'navigate' | 'download'
  path?:       string
  downloadKey?: string
  category:    'attendance' | 'financial' | 'academic' | 'administrative'
  enabled:     boolean
}

// ── Constants ─────────────────────────────────────────────────

const REPORTS: ReportCard[] = [
  {
    key:         'attendance',
    title:       'Attendance Reports',
    description: 'Monthly attendance summary, low attendance alerts, and daily attendance registers with downloadable PDF/Excel formats',
    icon:        Calendar,
    iconBg:      'bg-primary-50',
    iconColor:   'text-primary-600',
    action:      'navigate',
    path:        '/admin/attendance/reports',
    category:    'attendance',
    enabled:     true,
  },
  {
    key:         'fees',
    title:       'Fee Collection Reports',
    description: 'Fee collected, pending, and overdue amounts with student-wise payment details and collection trends',
    icon:        DollarSign,
    iconBg:      'bg-emerald-50',
    iconColor:   'text-emerald-600',
    action:      'navigate',
    path:        '/admin/fees/reports',
    category:    'financial',
    enabled:     false,  // Coming soon
  },
  {
    key:         'students',
    title:       'Student Directory',
    description: 'Complete student list with contact details, admission information, and parent contact directory',
    icon:        Users,
    iconBg:      'bg-amber-50',
    iconColor:   'text-amber-600',
    action:      'download',
    downloadKey: 'students-directory',
    category:    'administrative',
    enabled:     false,  // Coming soon
  },
  {
    key:         'results',
    title:       'Exam Results Reports',
    description: 'Class-wise exam results with marks, grades, performance analysis, and subject-wise breakdown',
    icon:        GraduationCap,
    iconBg:      'bg-violet-50',
    iconColor:   'text-violet-600',
    action:      'navigate',
    path:        '/admin/exams/reports',
    category:    'academic',
    enabled:     false,  // Coming soon
  },
]

// ── Main Component ────────────────────────────────────────────

export default function ReportsHubPage() {
  const router = useRouter()

  const handleCardClick = (report: ReportCard) => {
    if (!report.enabled) return

    if (report.action === 'navigate' && report.path) {
      router.push(report.path)
    } else if (report.action === 'download' && report.downloadKey) {
      // Direct download for simple reports
      const month = new Date().toISOString().slice(0, 7)
      window.open(
        `/api/reports/${report.downloadKey}?format=pdf&month=${month}`,
        '_blank'
      )
    }
  }

  return (
    <div className="portal-content-enter">

      {/* ── Page Header ── */}
      <div className="portal-page-header">
        <div>
          <nav className="portal-breadcrumb" aria-label="Breadcrumb">
            <span>Dashboard</span>
            <span className="bc-sep" aria-hidden>/</span>
            <span className="bc-current">Reports</span>
          </nav>
          <h1 className="portal-page-title">Reports & Analytics</h1>
          <p className="portal-page-subtitle">
            Download and view detailed reports for attendance, fees, students, and academic performance
          </p>
        </div>
      </div>

      {/* ── Reports Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {REPORTS.map(report => {
          const Icon = report.icon
          
          return (
            <button
              key={report.key}
              onClick={() => handleCardClick(report)}
              disabled={!report.enabled}
              className={`
                portal-card text-left w-full
                transition-all duration-200
                ${report.enabled
                  ? 'card-interactive cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
                }
              `}
            >
              <div className="portal-card-body">
                <div className="flex items-start gap-4">

                  {/* Icon */}
                  <div className={`
                    w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0
                    ${report.iconBg}
                  `}>
                    <Icon className={`w-6 h-6 ${report.iconColor}`} aria-hidden />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="portal-card-title">
                        {report.title}
                      </h3>
                      {report.enabled ? (
                        <ChevronRight
                          className="w-5 h-5 text-text-muted flex-shrink-0 group-hover:text-primary-500 transition-colors"
                          aria-hidden
                        />
                      ) : (
                        <span className="badge badge-neutral text-2xs px-2 py-0.5">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Info Card ── */}
      <div className="portal-card">
        <div className="portal-card-body">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-text-primary mb-2">
                Quick Tips
              </p>
              <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0 mt-0.5">•</span>
                  <span>Click on any <strong>enabled report card</strong> to view detailed options and filters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0 mt-0.5">•</span>
                  <span>Most reports are available in both <strong>PDF</strong> (for printing) and <strong>Excel</strong> (for analysis) formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0 mt-0.5">•</span>
                  <span>Use filters to generate targeted reports for specific <strong>classes, sections, or time periods</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0 mt-0.5">•</span>
                  <span>Downloaded files are automatically named with <strong>date and filter information</strong> for easy organization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}