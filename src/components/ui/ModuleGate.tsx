'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { isModuleAllowed } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

interface Props {
  moduleKey:  string
  children:   React.ReactNode
  fallback?:  React.ReactNode
}

export function ModuleGate({ moduleKey, children, fallback }: Props) {
  const { data: session } = useSession()

  if (!session) return null

  const plan    = session.user.plan as PlanId
  const allowed = isModuleAllowed(plan, moduleKey)

  if (allowed)  return <>{children}</>
  if (fallback) return <>{fallback}</>

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Lock icon */}
      <div
        className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center
                   justify-center mb-5"
        style={{
          background: 'var(--bg-muted)',
          border:     '1px solid var(--border)',
        }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25
               2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25
               2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>

      {/* Text */}
      <p
        className="text-base font-bold font-display mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        Yeh module aapke plan mein nahi hai
      </p>
      <p
        className="text-sm font-body mb-6 max-w-xs leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}
          className="capitalize font-semibold"
        >
          {moduleKey}
        </strong>{' '}
        module ke liye plan upgrade karo
      </p>

      {/* CTA */}
      <Link
        href="/admin/subscription"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)]
                   text-sm font-semibold text-white font-display
                   transition-all duration-150"
        style={{
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          boxShadow:  '0 2px 8px rgba(99,102,241,0.3)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'linear-gradient(135deg, var(--primary-600), var(--primary-700))'
          el.style.boxShadow  = '0 4px 12px rgba(99,102,241,0.4)'
          el.style.transform  = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
          el.style.boxShadow  = '0 2px 8px rgba(99,102,241,0.3)'
          el.style.transform  = 'translateY(0)'
        }}
      >
        View Plans & Upgrade →
      </Link>

      <p
        className="text-xs font-body mt-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Current plan:{' '}
        <strong
          className="capitalize font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {plan}
        </strong>
      </p>
    </div>
  )
}