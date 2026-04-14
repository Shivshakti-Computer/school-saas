// FILE: src/components/settings/shared/SaveButton.tsx
// Save button with loading, success, error states

'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Save, AlertCircle } from 'lucide-react'

interface SaveButtonProps {
    onSave: () => Promise<void>
    disabled?: boolean
    isDirty?: boolean
    label?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

type SaveState = 'idle' | 'saving' | 'success' | 'error'

export function SaveButton({
    onSave,
    disabled = false,
    isDirty = true,
    label = 'Save Changes',
    className = '',
    size = 'md',
}: SaveButtonProps) {
    const [state, setState] = useState<SaveState>('idle')

    // Auto reset success/error after 3s
    useEffect(() => {
        if (state === 'success' || state === 'error') {
            const timer = setTimeout(() => setState('idle'), 3000)
            return () => clearTimeout(timer)
        }
    }, [state])

    const handleClick = async () => {
        if (state === 'saving' || disabled || !isDirty) return
        setState('saving')
        try {
            await onSave()
            setState('success')
        } catch {
            setState('error')
        }
    }

    const sizeClasses = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    }

    const isDisabled =
        disabled || !isDirty || state === 'saving'

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isDisabled}
            className={`
        btn-primary ${sizeClasses[size]}
        ${state === 'success' ? '!bg-[var(--success)]' : ''}
        ${state === 'error' ? '!bg-[var(--danger)]' : ''}
        ${className}
      `}
        >
            {state === 'saving' && (
                <Loader2 size={15} className="animate-spin" />
            )}
            {state === 'success' && <Check size={15} />}
            {state === 'error' && <AlertCircle size={15} />}
            {state === 'idle' && <Save size={15} />}

            <span>
                {state === 'saving' ? 'Saving...' : ''}
                {state === 'success' ? 'Saved!' : ''}
                {state === 'error' ? 'Failed' : ''}
                {state === 'idle' ? label : ''}
            </span>
        </button>
    )
}

// ── Inline save bar — fixed bottom on mobile ──
interface SaveBarProps {
    isDirty: boolean
    onSave: () => Promise<void>
    onDiscard: () => void
    saving?: boolean
}

export function SaveBar({ isDirty, onSave, onDiscard, saving }: SaveBarProps) {
    if (!isDirty) return null

    return (
        <div
            className="
        fixed bottom-0 left-0 right-0
        z-[var(--z-sticky)]
        border-t border-[var(--border)]
        bg-[var(--bg-card)]
        px-4 py-3
        flex items-center justify-between gap-3
        shadow-lg
        md:relative md:bottom-auto md:left-auto md:right-auto
        md:border-t md:shadow-none
        md:bg-transparent md:px-0 md:py-0 md:mt-4
      "
        >
            <p className="text-sm text-[var(--text-muted)] hidden md:block">
                You have unsaved changes
            </p>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                    type="button"
                    onClick={onDiscard}
                    disabled={saving}
                    className="btn-ghost btn-sm flex-1 md:flex-none"
                >
                    Discard
                </button>
                <SaveButton
                    onSave={onSave}
                    isDirty={isDirty}
                    disabled={saving}
                    className="flex-1 md:flex-none"
                />
            </div>
        </div>
    )
}