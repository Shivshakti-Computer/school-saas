// FILE: src/components/homework/HomeworkFilters.tsx
// ═══════════════════════════════════════════════════════════
// Homework Filters
// ═══════════════════════════════════════════════════════════

'use client'

import { Select, Button } from '@/components/ui'
import { Filter, X } from 'lucide-react'
import { useAcademicSettings } from '@/hooks/useAcademicSettings'
import type { HomeworkFilters as IHomeworkFilters } from '@/types/homework'

interface HomeworkFiltersProps {
    filters: IHomeworkFilters
    onChange: (filters: IHomeworkFilters) => void
    onReset: () => void
}

const SUBJECT_OPTIONS = [
    'Mathematics',
    'Science',
    'English',
    'Hindi',
    'Social Science',
    'Computer',
    'Physics',
    'Chemistry',
    'Biology',
    'Accountancy',
    'Business Studies',
    'Economics',
]

export function HomeworkFilters({
    filters,
    onChange,
    onReset,
}: HomeworkFiltersProps) {
    const { settings: academicSettings } = useAcademicSettings()

    const CLASS_OPTIONS = academicSettings
        ? academicSettings.classes
            .filter(c => c.isActive)
            .sort((a, b) => a.order - b.order)
            .reduce<Array<{ value: string; label: string }>>((acc, c) => {
                if (!acc.find(item => item.value === c.name)) {
                    acc.push({
                        value: c.name,
                        label: c.displayName || `Class ${c.name}`,
                    })
                }
                return acc
            }, [])
        : []

    const SECTION_OPTIONS = academicSettings
        ? academicSettings.sections
            .filter(s => s.isActive)
            .map(s => ({ value: s.name, label: s.name }))
        : []

    const updateFilter = (key: keyof IHomeworkFilters, value: any) => {
        onChange({ ...filters, [key]: value, page: 1 })
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
        <div className="portal-card">
            <div className="portal-card-header">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-[var(--text-muted)]" />
                    <h3 className="portal-card-title">Filters</h3>
                </div>
                {hasActiveFilters && (
                    <Button size="sm" variant="ghost" onClick={onReset}>
                        <X size={14} />
                        Clear
                    </Button>
                )}
            </div>

            <div className="portal-card-body space-y-4">
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
                        placeholder="Search by title or description..."
                        value={filters.search || ''}
                        onChange={e => updateFilter('search', e.target.value)}
                    />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status */}
                    <Select
                        value={filters.status || ''}
                        onChange={e => updateFilter('status', e.target.value || undefined)}
                        options={[
                            { value: '', label: 'All Status' },
                            { value: 'active', label: 'Active' },
                            { value: 'archived', label: 'Archived' },
                        ]}
                    />

                    {/* Class */}
                    <Select
                        value={filters.class || ''}
                        onChange={e => updateFilter('class', e.target.value || undefined)}
                        options={[
                            { value: '', label: 'All Classes' },
                            ...CLASS_OPTIONS,
                        ]}
                    />

                    {/* Section */}
                    <Select
                        value={filters.section || ''}
                        onChange={e => updateFilter('section', e.target.value || undefined)}
                        options={[
                            { value: '', label: 'All Sections' },
                            ...SECTION_OPTIONS,
                        ]}
                    />

                    {/* Subject */}
                    <Select
                        value={filters.subject || ''}
                        onChange={e => updateFilter('subject', e.target.value || undefined)}
                        options={[
                            { value: '', label: 'All Subjects' },
                            ...SUBJECT_OPTIONS.map(s => ({ value: s, label: s })),
                        ]}
                    />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                            From Date
                        </label>
                        <input
                            type="date"
                            className="input-clean"
                            value={filters.dateFrom || ''}
                            onChange={e => updateFilter('dateFrom', e.target.value || undefined)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-primary)] mb-1 block">
                            To Date
                        </label>
                        <input
                            type="date"
                            className="input-clean"
                            value={filters.dateTo || ''}
                            onChange={e => updateFilter('dateTo', e.target.value || undefined)}
                        />
                    </div>
                </div>

                {/* Sort */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                        label="Sort By"
                        value={filters.sortBy}
                        onChange={e => updateFilter('sortBy', e.target.value)}
                        options={[
                            { value: 'dueDate', label: 'Due Date' },
                            { value: 'createdAt', label: 'Created Date' },
                            { value: 'submittedCount', label: 'Submissions' },
                        ]}
                    />
                    <Select
                        label="Order"
                        value={filters.sortOrder}
                        onChange={e => updateFilter('sortOrder', e.target.value)}
                        options={[
                            { value: 'asc', label: 'Ascending' },
                            { value: 'desc', label: 'Descending' },
                        ]}
                    />
                </div>
            </div>
        </div>
    )
}