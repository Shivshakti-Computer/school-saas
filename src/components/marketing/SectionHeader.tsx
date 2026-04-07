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
      className={`reveal max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
    >
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700 mb-3 ${
          align === 'center' ? 'mx-auto' : ''
        }`}
      >
        {eyebrow}
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}