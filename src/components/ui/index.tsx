/* ============================================================
   FILE: src/components/ui/index.tsx
   Shared UI primitives — Button, Input, Badge, Card, Spinner
   ============================================================ */

'use client'
import { type ButtonHTMLAttributes, type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

/* ── Button ── */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type BtnSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: BtnVariant
    size?: BtnSize
    loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
        const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none'

        const variants: Record<BtnVariant, string> = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[.98] shadow-sm',
            secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-[.98]',
            ghost: 'text-slate-600 hover:bg-slate-100 active:scale-[.98]',
            danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[.98]',
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


/* ── Input ── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helper, className, ...props }, ref) => (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-xs font-medium text-slate-600">{label}</label>
            )}
            <input
                ref={ref}
                className={clsx(
                    'h-9 px-3 text-sm rounded-lg border bg-white transition-colors',
                    'placeholder:text-slate-400',
                    error
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            {helper && !error && <p className="text-xs text-slate-400">{helper}</p>}
        </div>
    )
)
Input.displayName = 'Input'


/* ── Select ── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
            <select
                className={clsx(
                    'h-9 px-3 text-sm rounded-lg border bg-white transition-colors cursor-pointer',
                    error
                        ? 'border-red-400'
                        : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50',
                    className
                )}
                {...props}
            >
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}


/* ── Badge ── */
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

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
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        purple: 'bg-indigo-100 text-indigo-700',
    }
    return (
        <span className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
            styles[variant], className
        )}>
            {children}
        </span>
    )
}


/* ── Card ── */
export function Card({
    children,
    className,
    padding = true,
}: {
    children: React.ReactNode
    className?: string
    padding?: boolean
}) {
    return (
        <div className={clsx(
            'bg-white rounded-xl border border-slate-200 shadow-sm',
            padding && 'p-5',
            className
        )}>
            {children}
        </div>
    )
}


/* ── Stat Card ── */
export function StatCard({
    label,
    value,
    icon,
    trend,
    color = 'indigo',
}: {
    label: string
    value: string | number
    icon: React.ReactNode
    trend?: string
    color?: 'indigo' | 'emerald' | 'amber' | 'red' | 'blue'
}) {
    const colors = {
        indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', val: 'text-indigo-700' },
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600', val: 'text-amber-700' },
        red: { bg: 'bg-red-50', icon: 'text-red-600', val: 'text-red-700' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', val: 'text-blue-700' },
    }
    const c = colors[color]
    return (
        <Card className="flex items-start gap-4">
            <div className={clsx('p-2.5 rounded-lg', c.bg)}>
                <span className={clsx('w-5 h-5 block', c.icon)}>{icon}</span>
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={clsx('text-2xl font-semibold mt-0.5', c.val)}>{value}</p>
                {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
            </div>
        </Card>
    )
}


/* ── Spinner ── */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-8 h-8' }
    return (
        <svg
            className={clsx('animate-spin text-current', sizes[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    )
}


/* ── Modal ── */
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

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={clsx(
                'relative bg-white rounded-2xl shadow-xl w-full',
                sizes[size]
            )}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    )
}


/* ── Empty State ── */
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                {icon}
            </div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            {description && <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}


/* ── Table ── */
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
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100">
                        {headers.map(h => (
                            <th
                                key={h}
                                className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">{children}</tbody>
            </table>
        </div>
    )
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <tr className={clsx('hover:bg-slate-50/60 transition-colors', className)}>
            {children}
        </tr>
    )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <td className={clsx('px-4 py-3 text-slate-700', className)}>
            {children}
        </td>
    )
}


/* ── Page Header ── */
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
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}


/* ── Alert ── */
export function Alert({
    type = 'info',
    message,
    onClose,
}: {
    type?: 'success' | 'error' | 'warning' | 'info'
    message: string
    onClose?: () => void
}) {
    const styles = {
        success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200',
    }
    return (
        <div className={clsx(
            'flex items-start gap-3 px-4 py-3 rounded-lg border text-sm',
            styles[type]
        )}>
            <p className="flex-1">{message}</p>
            {onClose && (
                <button onClick={onClose} className="opacity-60 hover:opacity-100">✕</button>
            )}
        </div>
    )
}
