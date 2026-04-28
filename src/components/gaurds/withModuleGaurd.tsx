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

    if (!session?.user) {
      redirect('/login')
    }

    const userPlan = (session.user.plan ?? 'starter') as PlanId
    const planConfig = PLANS[userPlan]

    if (!planConfig) {
      redirect('/admin/subscription')
    }

    // ✅ FIX: Trial mein sab modules unlocked
    const subscriptionStatus = (session.user as any).subscriptionStatus || 'trial'
    const isTrial = subscriptionStatus === 'trial'

    // ✅ Trial mein direct render — guard bypass
    if (isTrial) {
      return <ClientPage />
    }

    // ✅ Paid plan — normal module check
    const allowedModules = planConfig.modules

    if (!allowedModules.includes(moduleKey)) {
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

  // ✅ FIX: Trial mein sab allowed
  const subscriptionStatus = (session.user as any).subscriptionStatus || 'trial'
  const isTrial = subscriptionStatus === 'trial'

  if (isTrial) {
    return { allowed: true, plan: userPlan }
  }

  const allowed = planConfig.modules.includes(moduleKey)
  return { allowed, plan: userPlan }
}