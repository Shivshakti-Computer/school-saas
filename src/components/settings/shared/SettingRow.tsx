// FILE: src/components/settings/shared/SettingRow.tsx
// Reusable label + input row for settings forms

'use client'

import { ReactNode } from 'react'

interface SettingRowProps {
    label: string
    description?: string
    required?: boolean
    error?: string
    children: ReactNode
    // Horizontal layout (label left, input right)
    horizontal?: boolean
    className?: string
}

export function SettingRow({
    label,
    description,
    required,
    error,
    children,
    horizontal = false,
    className = '',
}: SettingRowProps) {
    if (horizontal) {
        return (
            <div
                className={`
          flex flex-col sm:flex-row sm:items-start
          gap-3 sm:gap-6 py-4
          border-b border-[var(--border)] last:border-0
          ${className}
        `}
            >
                {/* Label side */}
                <div className="sm:w-56 flex-shrink-0">
                    <p className="text-sm font-600 text-[var(--text-primary)]">
                        {label}
                        {required && (
                            <span className="text-[var(--danger)] ml-0.5">*</span>
                        )}
                    </p>
                    {description && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Input side */}
                <div className="flex-1 min-w-0">
                    {children}
                    {error && (
                        <p className="input-error-msg mt-1.5">{error}</p>
                    )}
                </div>
            </div>
        )
    }

    // Vertical layout
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className={`input-label ${required ? 'required' : ''}`}>
                {label}
            </label>
            {description && (
                <p className="text-xs text-[var(--text-muted)] -mt-1 mb-1.5">
                    {description}
                </p>
            )}
            {children}
            {error && (
                <p className="input-error-msg">{error}</p>
            )}
        </div>
    )
}

// ── Toggle Row — for boolean settings ──
interface ToggleRowProps {
    label: string
    description?: string
    checked: boolean
    onChange: (val: boolean) => void
    disabled?: boolean
    badge?: string
    className?: string
}

export function ToggleRow({
    label,
    description,
    checked,
    onChange,
    disabled = false,
    badge,
    className = '',
}: ToggleRowProps) {
    return (
        <div
            className={`
        flex items-center justify-between gap-4 py-3
        border-b border-[var(--border)] last:border-0
        ${disabled ? 'opacity-60' : ''}
        ${className}
      `}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-500 text-[var(--text-primary)]">
                        {label}
                    </p>
                    {badge && (
                        <span className="badge badge-brand text-[10px] px-1.5 py-0.5">
                            {badge}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            {/* Toggle Switch */}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`
          relative inline-flex h-5 w-9 flex-shrink-0
          cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus-visible:outline focus-visible:outline-2
          focus-visible:outline-[var(--primary-500)]
          ${checked
                        ? 'bg-[var(--primary-500)]'
                        : 'bg-[var(--border-strong)]'
                    }
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
            >
                <span
                    className={`
            pointer-events-none inline-block h-4 w-4
            transform rounded-full bg-white shadow
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-4' : 'translate-x-0'}
          `}
                />
            </button>
        </div>
    )
}