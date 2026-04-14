// FILE: src/components/settings/shared/SettingSection.tsx

'use client'

import { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'   // ✅ LucideIcon type import

interface SettingSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  icon?: LucideIcon                               // ✅ icon prop add kiya
  badge?: {
    label: string
    color?: 'primary' | 'success' | 'warning' | 'danger'
  }
  headerAction?: ReactNode
}

const badgeColors = {
  primary: 'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
}

export function SettingSection({
  title,
  description,
  children,
  className = '',
  icon: Icon,                                     // ✅ destructure as Icon
  badge,
  headerAction,
}: SettingSectionProps) {
  return (
    <div className={`portal-card ${className}`}>
      {/* Header */}
      <div className="portal-card-header">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">

            {/* ✅ Icon render — agar pass kiya ho to */}
            {Icon && (
              <span className="
                flex items-center justify-center
                w-7 h-7 rounded-[var(--radius-sm)]
                bg-[var(--primary-50)] text-[var(--primary-600)]
                flex-shrink-0
              ">
                <Icon size={15} />
              </span>
            )}

            <h3 className="portal-card-title">{title}</h3>

            {badge && (
              <span className={`badge ${badgeColors[badge.color || 'primary']}`}>
                {badge.label}
              </span>
            )}
          </div>

          {description && (
            <p className="portal-card-subtitle mt-0.5">{description}</p>
          )}
        </div>

        {headerAction && (
          <div className="flex-shrink-0">{headerAction}</div>
        )}
      </div>

      {/* Body */}
      <div className="portal-card-body">
        {children}
      </div>
    </div>
  )
}