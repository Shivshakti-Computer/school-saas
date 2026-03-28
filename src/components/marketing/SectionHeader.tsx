// FILE: src/components/marketing/SectionHeader.tsx

'use client'

import { useReveal } from '@/hooks/useReveal'

interface SectionHeaderProps {
    eyebrow: string
    title: string
    subtitle?: string
    align?: 'center' | 'left'
}

export function SectionHeader({
    eyebrow,
    title,
    subtitle,
    align = 'center',
}: SectionHeaderProps) {
    const ref = useReveal<HTMLDivElement>()

    return (
        <div
            ref={ref}
            className={`reveal max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''
                }`}
        >
            <div className={`badge-brand mb-4 ${align === 'center' ? 'mx-auto' : ''}`}>
                {eyebrow}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="mt-4 text-base text-slate-400 leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    )
}