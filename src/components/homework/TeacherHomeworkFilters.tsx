// FILE: src/components/homework/TeacherHomeworkFilters.tsx
// ✅ Teacher-scoped filters — only shows teacher's assigned classes & subjects

'use client'

import { Select, Button } from '@/components/ui'
import { Filter, X } from 'lucide-react'
import type { HomeworkFilters as IHomeworkFilters } from '@/types/homework'

interface TeacherHomeworkFiltersProps {
    filters: IHomeworkFilters
    onChange: (filters: IHomeworkFilters) => void
    onReset: () => void
    allowedClasses: string[]    // teacher's assigned classes
    allowedSubjects: string[]   // teacher's assigned subjects
}

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
        filters.dateTo

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

                {/* Class + Subject + Status */}
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

                    {/* Sort */}
                    <select
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onChange={(e) => {
                            const [sortBy, sortOrder] = e.target.value.split('-')
                            onChange({
                                ...filters,
                                sortBy: sortBy as IHomeworkFilters['sortBy'],
                                sortOrder: sortOrder as 'asc' | 'desc',
                                page: 1,
                            })
                        }}
                        className="input-clean text-sm h-9"
                    >
                        <option value="dueDate-asc">Due Date ↑</option>
                        <option value="dueDate-desc">Due Date ↓</option>
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
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
            </div>
        </div>
    )
}