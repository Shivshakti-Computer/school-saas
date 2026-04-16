// ═══════════════════════════════════════════════════════════
// HR & Payroll Management Guide
// Complete user documentation in-app
// ═══════════════════════════════════════════════════════════

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { requireModule } from '@/lib/planGuard'
import HRGuideClient from './HRGuideClient'

export const metadata = {
  title: 'HR & Payroll Guide | Admin',
  description: 'Complete management guide for HR & Payroll module',
}

export default async function HRGuidePage() {
  await requireModule('hr')

  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return <HRGuideClient />
}