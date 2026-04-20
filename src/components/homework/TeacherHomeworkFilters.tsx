// FILE: src/components/homework/TeacherHomeworkFilters.tsx
// ✅ Teacher-scoped filters with Academic Year filter
// - Only shows teacher's assigned classes & subjects
// - Added Academic Year filter

'use client'

import { Select, Button } from '@/components/ui'
import { Filter, X } from 'lucide-react'
import { getAcademicYears } from '@/lib/academicYear'
import type { HomeworkFilters as IHomeworkFilters } from '@/types/homework'

interface TeacherHomeworkFiltersProps {
    filters: IHomeworkFilters
    onChange: (filters: IHomeworkFilters) => void
    onReset: () => void
    allowedClasses: string[]    // teacher's assigned classes
    allowedSubjects: string[]   // teacher's assigned subjects
}

const academicYears = getAcademicYears()

export function TeacherHomeworkFilters({
    filters,
    onChange,
    onReset,
    allowedClasses,
    allowedSubjects,
}: TeacherHomeworkFiltersProps) {
    const updateFilter = (key: keyof IHomeworkFilters, value: any) => {
        onChange({ ...filters, [key]: value || undefined, page: 1 })
    }

    const hasActiveFilters =
        filters.status ||
        filters.class ||
        filters.section ||
        filters.subject ||
        filters.search ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.academicYear

    return (
        <div
            className="portal-card rounded-[var(--radius-lg)] overflow-hidden"
        >
            <div className="portal-card-header">
                <div className="flex items-center gap-2">
                    <Filter
                        size={15}
                        style={{ color: 'var(--text-muted)' }}
                    />
                    <p className="portal-card-title">Filters</p>
                </div>
                {hasActiveFilters && (
                    <Button size="sm" variant="ghost" onClick={onReset}>
                        <X size={13} />
                        Clear
                    </Button>
                )}
            </div>

            <div className="portal-card-body space-y-3">
                {/* Search */}
                <div className="portal-search">
                    <svg
                        className="search-icon"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="8.5" cy="8.5" r="5.5" />
                        <path d="M12.5 12.5L16.5 16.5" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={filters.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                    {filters.search && (
                        <button
                            onClick={() => updateFilter('search', '')}
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Class + Subject + Status + Academic Year */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Class — only teacher's classes */}
                    <select
                        value={filters.class || ''}
                        onChange={(e) => updateFilter('class', e.target.value)}
                        className="input-clean text-sm h-9"
                    >
                        <option value="">All Classes</option>
                        {allowedClasses.map((cls) => (
                            <option key={cls} value={cls}>
                                Class {cls}
                            </option>
                        ))}
                    </select>

                    {/* Subject — only teacher's subjects */}
                    <select
                        value={filters.subject || ''}
                        onChange={(e) => updateFilter('subject', e.target.value)}
                        className="input-clean text-sm h-9"
                    >
                        <option value="">All Subjects</option>
                        {allowedSubjects.map((sub) => (
                            <option key={sub} value={sub}>
                                {sub}
                            </option>
                        ))}
                    </select>

                    {/* Status */}
                    <select
                        value={filters.status || ''}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        className="input-clean text-sm h-9"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>

                    {/* ✅ Academic Year — NEW */}
                    <select
                        value={filters.academicYear || ''}
                        onChange={(e) => updateFilter('academicYear', e.target.value)}
                        className="input-clean text-sm h-9"
                    >
                        <option value="">All Academic Years</option>
                        {academicYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            className="text-xs font-semibold block mb-1"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            From Date
                        </label>
                        <input
                            type="date"
                            className="input-clean text-sm"
                            value={filters.dateFrom || ''}
                            onChange={(e) => updateFilter('dateFrom', e.target.value)}
                        />
                    </div>
                    <div>
                        <label
                            className="text-xs font-semibold block mb-1"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            To Date
                        </label>
                        <input
                            type="date"
                            className="input-clean text-sm"
                            value={filters.dateTo || ''}
                            onChange={(e) => updateFilter('dateTo', e.target.value)}
                        />
                    </div>
                </div>

                {/* Sort */}
                <div className="grid grid-cols-2 gap-3">
                    <select
                        value={filters.sortBy || 'dueDate'}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                        className="input-clean text-sm h-9"
                    >
                        <option value="dueDate">Due Date</option>
                        <option value="createdAt">Created Date</option>
                        <option value="submittedCount">Submissions</option>
                    </select>
                    <select
                        value={filters.sortOrder || 'asc'}
                        onChange={(e) => updateFilter('sortOrder', e.target.value)}
                        className="input-clean text-sm h-9"
                    >
                        <option value="asc">Ascending ↑</option>
                        <option value="desc">Descending ↓</option>
                    </select>
                </div>
            </div>
        </div>
    )
}