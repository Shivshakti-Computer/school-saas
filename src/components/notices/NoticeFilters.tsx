// FILE: src/components/notices/NoticeFilters.tsx
'use client'

import { Select, Input, Button } from '@/components/ui'
import { X } from 'lucide-react'
import type { NoticeFilters } from '@/types/notice'

interface NoticeFiltersProps {
    filters: NoticeFilters
    onChange: (filters: NoticeFilters) => void
    onReset: () => void
    showAdminFilters?: boolean
}

export function NoticeFiltersComponent({
    filters,
    onChange,
    onReset,
    showAdminFilters = false,
}: NoticeFiltersProps) {
    const updateFilter = (key: keyof NoticeFilters, value: any) => {
        onChange({ ...filters, [key]: value, page: 1 }) // Reset to page 1 on filter change
    }

    const hasActiveFilters =
        filters.status ||
        filters.targetRole ||
        filters.priority ||
        filters.search ||
        filters.isPinned !== undefined

    return (
        <div className="space-y-3">
            {/* Search */}
            <Input
                placeholder="Search notices..."
                value={filters.search || ''}
                onChange={e => updateFilter('search', e.target.value || undefined)}
            />

            {/* Filter Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {showAdminFilters && (
                    <Select
                        value={filters.status || ''}
                        onChange={e => updateFilter('status', e.target.value || undefined)}
                        options={[
                            { value: '', label: 'All Status' },
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Drafts' },
                            { value: 'archived', label: 'Archived' },
                        ]}
                    />
                )}

                <Select
                    value={filters.targetRole || ''}
                    onChange={e => updateFilter('targetRole', e.target.value || undefined)}
                    options={[
                        { value: '', label: 'All Roles' },
                        { value: 'all', label: 'Everyone' },
                        { value: 'student', label: 'Students' },
                        { value: 'teacher', label: 'Teachers' },
                        { value: 'parent', label: 'Parents' },
                        { value: 'staff', label: 'Staff' },
                    ]}
                />

                <Select
                    value={filters.priority || ''}
                    onChange={e => updateFilter('priority', e.target.value || undefined)}
                    options={[
                        { value: '', label: 'All Priorities' },
                        { value: 'urgent', label: '🚨 Urgent' },
                        { value: 'high', label: 'High' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'low', label: 'Low' },
                    ]}
                />

                <Select
                    value={filters.isPinned === true ? 'true' : filters.isPinned === false ? 'false' : ''}
                    onChange={e => updateFilter('isPinned', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
                    options={[
                        { value: '', label: 'All Notices' },
                        { value: 'true', label: '📌 Pinned Only' },
                        { value: 'false', label: 'Not Pinned' },
                    ]}
                />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="w-full sm:w-auto"
                >
                    <X size={14} />
                    Clear Filters
                </Button>
            )}
        </div>
    )
}