// FILE: src/app/(dashboard)/admin/security/page.tsx
// UPDATED: Redirect to Settings tab for backward compatibility
// Old bookmarks/links will still work
// ═══════════════════════════════════════════════════════════

import { redirect } from 'next/navigation'

export default function SecurityPageRedirect() {
  redirect('/admin/settings?tab=security')
}