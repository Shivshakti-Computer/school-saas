import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { LockedModule } from './LockedModule'
import type { PlanId } from '@/lib/plans'

export function withModuleGuard(
  moduleKey: string,
  ClientPage: React.ComponentType
) {
  return async function GuardedPage() {
    const session = await getServerSession(authOptions)

    // FIX: Not logged in → redirect to login
    if (!session?.user) {
      redirect('/login')
    }

    // FIX: session.user.plan may be undefined if authOptions doesn't set it
    // Fallback to 'starter' so LockedModule renders instead of crashing
    const userPlan = (session.user.plan ?? 'starter') as PlanId

    // FIX: Guard against unknown plan IDs (e.g. stale session after plan rename)
    const planConfig = PLANS[userPlan]
    if (!planConfig) {
      // Unknown plan — redirect to subscription page
      redirect('/admin/subscription')
    }

    const allowedModules = planConfig.modules

    if (!allowedModules.includes(moduleKey)) {
      // FIX: Pass `blocked` query param so subscription page shows banner
      // But first show LockedModule UI — redirect only if you prefer hard redirect
      return (
        <LockedModule
          moduleKey={moduleKey}
          currentPlan={userPlan}
        />
      )
    }

    return <ClientPage />
  }
}

export async function checkModuleAccess(moduleKey: string): Promise<{
  allowed: boolean
  plan: PlanId
  redirect?: string
}> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { allowed: false, plan: 'starter', redirect: '/login' }
  }

  const userPlan = (session.user.plan ?? 'starter') as PlanId
  const planConfig = PLANS[userPlan]

  if (!planConfig) {
    return { allowed: false, plan: userPlan, redirect: '/admin/subscription' }
  }

  const allowed = planConfig.modules.includes(moduleKey)
  return { allowed, plan: userPlan }
}