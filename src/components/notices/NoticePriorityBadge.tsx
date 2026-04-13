// FILE: src/components/notices/NoticePriorityBadge.tsx
import { Badge } from '@/components/ui'
import type { NoticePriority } from '@/models/Notice'

interface NoticePriorityBadgeProps {
    priority: NoticePriority
}

export function NoticePriorityBadge({ priority }: NoticePriorityBadgeProps) {
    const config: Record<NoticePriority, { variant: any; label: string; icon?: string }> = {
        low: { variant: 'default', label: 'Low' },
        normal: { variant: 'info', label: 'Normal' },
        high: { variant: 'warning', label: 'High', icon: '⚠️' },
        urgent: { variant: 'danger', label: 'Urgent', icon: '🚨' },
    }

    const { variant, label, icon } = config[priority]

    return (
        <Badge variant={variant}>
            {icon && <span className="mr-1">{icon}</span>}
            {label}
        </Badge>
    )
}