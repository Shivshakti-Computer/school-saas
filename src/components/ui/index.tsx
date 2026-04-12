// FILE: src/components/ui/index.tsx
// COMPLETE UPDATED VERSION with style prop support

'use client'

import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from 'react'
import { clsx } from 'clsx'

/* ─────────────────────────────────────────────────────────────
   BUTTON
   ───────────────────────────────────────────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type BtnSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold font-display ' +
      'rounded-[var(--radius-md)] transition-all duration-150 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed select-none ' +
      'active:scale-[.98]'

    const variants: Record<BtnVariant, string> = {
      primary:
        'text-white shadow-sm ' +
        '[background:linear-gradient(135deg,var(--primary-500),var(--primary-600))] ' +
        'hover:[background:linear-gradient(135deg,var(--primary-600),var(--primary-700))] ' +
        'hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
      secondary:
        '[background:var(--bg-card)] [color:var(--primary-600)] ' +
        '[border:1.5px_solid_var(--primary-200)] ' +
        'hover:[background:var(--primary-50)] ' +
        'hover:[border-color:var(--primary-300)]',
      ghost: '[color:var(--text-secondary)] hover:[background:var(--bg-muted)] hover:[color:var(--text-primary)]',
      danger:
        '[background:var(--danger-light)] [color:var(--danger-dark)] ' +
        '[border:1.5px_solid_rgba(239,68,68,0.2)] ' +
        'hover:[background:#fee2e2]',
      accent:
        'text-white ' +
        '[background:linear-gradient(135deg,var(--accent-400),var(--accent-500))] ' +
        'hover:[background:linear-gradient(135deg,var(--accent-500),var(--accent-600))] ' +
        'hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)]',
    }

    const sizes: Record<BtnSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

/* ─────────────────────────────────────────────────────────────
   INPUT
   ───────────────────────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold font-display text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <input ref={ref} className={clsx('input-clean', error && 'input-error', className)} {...props} />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      {helper && !error && <p className="text-xs text-[var(--text-muted)]">{helper}</p>}
    </div>
  )
)
Input.displayName = 'Input'

/* ─────────────────────────────────────────────────────────────
   SELECT
   ───────────────────────────────────────────────────────────── */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold font-display text-[var(--text-primary)]">{label}</label>}
      <select
        className={clsx(
          'h-10 px-3 text-sm rounded-[var(--radius-md)] cursor-pointer transition-all duration-150 font-body border-[1.5px] focus:outline-none',
          error
            ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
          className
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   BADGE
   ───────────────────────────────────────────────────────────── */

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  const styles: Record<BadgeVariant, string> = {
    default: 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)]',
    success: 'bg-[var(--success-light)] text-[var(--success-dark)] border-[rgba(16,185,129,0.2)]',
    warning: 'bg-[var(--warning-light)] text-[var(--warning-dark)] border-[rgba(245,158,11,0.2)]',
    danger: 'bg-[var(--danger-light)] text-[var(--danger-dark)] border-[rgba(239,68,68,0.2)]',
    info: 'bg-[var(--info-light)] text-[var(--info-dark)] border-[rgba(59,130,246,0.2)]',
    primary: 'bg-[var(--primary-50)] text-[var(--primary-600)] border-[var(--primary-200)]',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-display border',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   CARD
   ───────────────────────────────────────────────────────────── */

export function Card({
  children,
  className,
  padding = true,
  hover = false,
}: {
  children: React.ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
}) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-lg)] transition-all duration-200 bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow-sm)]',
        hover && 'cursor-pointer',
        padding && 'p-5',
        className
      )}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD
   ───────────────────────────────────────────────────────────── */

type StatColor = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'primary',
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  color?: StatColor
}) {
  const colorMap: Record<StatColor, { bg: string; icon: string }> = {
    primary: { bg: 'var(--primary-50)', icon: 'var(--primary-500)' },
    success: { bg: 'var(--success-light)', icon: 'var(--success)' },
    warning: { bg: 'var(--warning-light)', icon: 'var(--warning)' },
    danger: { bg: 'var(--danger-light)', icon: 'var(--danger)' },
    info: { bg: 'var(--info-light)', icon: 'var(--info)' },
  }

  const c = colorMap[color]

  return (
    <div className="flex items-start gap-4 p-5 rounded-[var(--radius-lg)] transition-all duration-200 portal-stat-card">
      <div
        className="p-2.5 rounded-[var(--radius-md)] flex-shrink-0 stat-icon"
        style={{ background: c.bg, color: c.icon }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium font-body stat-label text-[var(--text-muted)]">{label}</p>
        <p className="stat-value mt-0.5">{value}</p>
        {trend && <p className="text-xs font-body mt-1 text-[var(--text-muted)]">{trend}</p>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SPINNER
   ───────────────────────────────────────────────────────────── */

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }
  return (
    <svg
      className={clsx('animate-spin', sizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   MODAL
   ───────────────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(30,27,75,0.45)] backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative w-full rounded-[var(--radius-xl)] overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] shadow-[var(--shadow-xl)]',
          sizes[size]
        )}
        style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-base font-bold font-display text-[var(--text-primary)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] transition-colors duration-150 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
   ───────────────────────────────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="portal-empty">
      <div className="portal-empty-icon">{icon}</div>
      <p className="portal-empty-title">{title}</p>
      {description && <p className="portal-empty-text">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TABLE PRIMITIVES
   ───────────────────────────────────────────────────────────── */

export function Table({
  headers,
  children,
  className,
}: {
  headers: string[]
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="portal-table">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>
}

// ✅ UPDATED: Added style prop support
export function Td({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <td className={clsx('px-4 py-3', className)} style={{ color: 'var(--text-secondary)', ...style }}>
      {children}
    </td>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE HEADER
   ───────────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="portal-page-header">
      <div>
        <h1 className="portal-page-title">{title}</h1>
        {subtitle && <p className="portal-page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   ALERT
   ───────────────────────────────────────────────────────────── */

type AlertType = 'success' | 'error' | 'warning' | 'info'

export function Alert({
  type = 'info',
  message,
  onClose,
}: {
  type?: AlertType
  message: string
  onClose?: () => void
}) {
  const styleMap: Record<AlertType, string> = {
    success: 'bg-[var(--success-light)] text-[var(--success-dark)] border-[rgba(16,185,129,0.25)]',
    error: 'bg-[var(--danger-light)] text-[var(--danger-dark)] border-[rgba(239,68,68,0.25)]',
    warning: 'bg-[var(--warning-light)] text-[var(--warning-dark)] border-[rgba(245,158,11,0.25)]',
    info: 'bg-[var(--info-light)] text-[var(--info-dark)] border-[rgba(59,130,246,0.25)]',
  }

  return (
    <div className={clsx('flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] text-sm font-body border', styleMap[type])}>
      <p className="flex-1 leading-relaxed">{message}</p>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  )
}