// FILE: src/components/settings/tabs/SubscriptionTab.tsx
// ✅ DIRECT RENDER - NO REDIRECT
// ═══════════════════════════════════════════════════════════

'use client'

import dynamic from 'next/dynamic'

// Dynamic import with SSR disabled (subscription page has client components)
const SubscriptionContent = dynamic(
  () => import('@/app/(dashboard)/admin/subscription/page').then(mod => mod.SubscriptionContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--primary-200)] border-t-[var(--primary-600)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading subscription...</p>
        </div>
      </div>
    )
  }
)

/**
 * Subscription Tab Component
 * Direct render - NO REDIRECT
 * Like SecurityTab
 */
export function SubscriptionTab() {
    return <SubscriptionContent />
}