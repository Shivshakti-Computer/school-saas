// FILE: src/components/marketing/SectionHeader.tsx
// FULLY CONVERTED TO LOCKED DESIGN PATTERN
// ═══════════════════════════════════════════════════════════

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
      {/* Eyebrow Badge */}
      <div
        className={`badge badge-brand inline-flex items-center gap-1.5 mb-4 ${align === 'center' ? 'mx-auto' : ''
          }`}
      >
        {eyebrow}
      </div>

      {/* Title */}
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary tracking-tight leading-tight">
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-secondary leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}