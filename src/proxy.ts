// FILE: src/middleware.ts
// FIXED: Added 'staff' role support throughout

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── PUBLIC ROUTES (no auth needed) ──
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/refund',
  '/features',
  '/verify',
  '/modules',
  '/pricing',
  '/security',
  '/faq',
  '/api/auth',
  '/api/schools/register',
  '/api/manifest',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/sw.js',
  '/manifest.json',
]

// ── MODULE → PLAN MAPPING ──
const MODULE_PLAN_MAP: Record<string, string[]> = {
  fees: ['growth', 'pro', 'enterprise'],
  exams: ['growth', 'pro', 'enterprise'],
  timetable: ['growth', 'pro', 'enterprise'],
  homework: ['growth', 'pro', 'enterprise'],
  documents: ['growth', 'pro', 'enterprise'],
  reports: ['growth', 'pro', 'enterprise'],
  communication: ['growth', 'pro', 'enterprise'],
  library: ['pro', 'enterprise'],
  certificates: ['pro', 'enterprise'],
  lms: ['pro', 'enterprise'],
  hr: ['enterprise'],
  transport: ['enterprise'],
  hostel: ['enterprise'],
  inventory: ['enterprise'],
  visitor: ['enterprise'],
  health: ['enterprise'],
  alumni: ['enterprise'],
}

// ── ADMIN PAGE → MODULE MAPPING ──
const ADMIN_MODULE_ROUTES: Record<string, string> = {
  '/admin/fees': 'fees',
  '/admin/exams': 'exams',
  '/admin/timetable': 'timetable',
  '/admin/homework': 'homework',
  '/admin/documents': 'documents',
  '/admin/reports': 'reports',
  '/admin/communication': 'communication',
  '/admin/library': 'library',
  '/admin/certificates': 'certificates',
  '/admin/lms': 'lms',
  '/admin/hr': 'hr',
  '/admin/transport': 'transport',
  '/admin/hostel': 'hostel',
  '/admin/inventory': 'inventory',
  '/admin/visitor': 'visitor',
  '/admin/health': 'health',
  '/admin/alumni': 'alumni',
}

// ── TEACHER PAGE → MODULE MAPPING ──
const TEACHER_MODULE_ROUTES: Record<string, string> = {
  '/teacher/marks': 'exams',
  '/teacher/homework': 'homework',
  '/teacher/lms': 'lms',
  '/teacher/timetable': 'timetable',
}

export default withAuth(
  function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl
    const token = (req as any).nextauth?.token

    // ══════════════════════════════════════
    // 1. PUBLIC ROUTES — allow without auth
    // ══════════════════════════════════════
    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.next()
    }

    if (pathname.startsWith('/website/')) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = token.role as string
    const plan = token.plan as string
    const subscriptionStatus = (token.subscriptionStatus as string) || 'expired'

    // ══════════════════════════════════════
    // 2. SUPERADMIN — full access
    // ══════════════════════════════════════
    if (role === 'superadmin') {
      if (!pathname.startsWith('/superadmin') && !pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/superadmin', req.url))
      }
      return NextResponse.next()
    }

    // ══════════════════════════════════════
    // 3. ROLE-BASED ROUTING
    //    FIXED: 'staff' added — shares /admin routes with admin
    // ══════════════════════════════════════

    // Define which URL prefix each role is allowed on
    const roleAllowedPrefix: Record<string, string[]> = {
      admin: ['/admin'],
      staff: ['/admin'],       // ← FIXED: staff uses /admin routes
      teacher: ['/teacher'],
      student: ['/student'],
      parent: ['/parent'],
    }

    // Define where to redirect each role if they hit wrong route
    const roleDashboard: Record<string, string> = {
      admin: '/admin',
      staff: '/admin',         // ← FIXED: staff dashboard = /admin
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
    }

    const allowedPrefixes = roleAllowedPrefix[role] || []
    const myDashboard = roleDashboard[role] || '/login'

    // Check if user is accessing a route they shouldn't be on
    const allProtectedPrefixes = ['/admin', '/teacher', '/student', '/parent']

    for (const prefix of allProtectedPrefixes) {
      if (pathname.startsWith(prefix)) {
        // Is this prefix allowed for this role?
        const isAllowed = allowedPrefixes.some(ap => pathname.startsWith(ap))
        if (!isAllowed) {
          // Redirect to their own dashboard
          return NextResponse.redirect(new URL(myDashboard, req.url))
        }
        break
      }
    }

    // ══════════════════════════════════════
    // 4. SUBSCRIPTION STATUS CHECK
    // ══════════════════════════════════════

    const isAuthApi = pathname.startsWith('/api/auth')
    const isSubApi = pathname.startsWith('/api/subscription')
    const isSubPage = pathname.startsWith('/admin/subscription')
    const isStaffApi = pathname.startsWith('/api/staff')

    // ── 4a. EXPIRED ──
    if (subscriptionStatus === 'expired') {
      // Admin can access subscription page to renew
      if (role === 'admin' && (isSubPage || isSubApi || isAuthApi)) {
        return NextResponse.next()
      }

      // API requests → 403
      if (pathname.startsWith('/api/') && !isAuthApi) {
        return NextResponse.json(
          { error: 'Subscription expired. Please ask your school admin to renew.', code: 'EXPIRED' },
          { status: 403 }
        )
      }

      // Admin → subscription page
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/subscription', req.url))
      }

      // Staff/Teacher/Student/Parent → login with message
      return NextResponse.redirect(new URL('/login?expired=1', req.url))
    }

    // ══════════════════════════════════════
    // 5. STAFF — Module access check
    //    Staff can only access their allowedModules
    //    (checked in UI + API layer, middleware just allows /admin/*)
    //    Staff cannot access /admin/teachers (staff management)
    // ══════════════════════════════════════
    if (role === 'staff') {
      // Staff cannot manage teachers/staff (only admin can)
      if (pathname.startsWith('/admin/teachers')) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }

      // Staff cannot access settings or subscription
      if (pathname.startsWith('/admin/settings')) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }

      if (pathname.startsWith('/admin/subscription')) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }

      // Staff module access — check allowedModules from token
      const staffAllowedModules = (token.allowedModules as string[]) || []

      // For /admin/[module] routes — check if staff has access
      for (const [route, moduleKey] of Object.entries(ADMIN_MODULE_ROUTES)) {
        if (pathname.startsWith(route)) {
          if (!staffAllowedModules.includes(moduleKey)) {
            // Staff doesn't have access to this module
            if (pathname.startsWith('/api/')) {
              return NextResponse.json(
                { error: `You don't have access to '${moduleKey}' module.`, code: 'MODULE_ACCESS_DENIED' },
                { status: 403 }
              )
            }
            return NextResponse.redirect(new URL('/admin', req.url))
          }
          break
        }
      }

      // Core modules that staff can access based on allowedModules
      const coreStaffRoutes: Record<string, string> = {
        '/admin/students': 'students',
        '/admin/attendance': 'attendance',
        '/admin/notices': 'notices',
        '/admin/website': 'website',
        '/admin/gallery': 'gallery',
      }

      for (const [route, moduleKey] of Object.entries(coreStaffRoutes)) {
        if (pathname.startsWith(route)) {
          if (!staffAllowedModules.includes(moduleKey)) {
            if (pathname.startsWith('/api/')) {
              return NextResponse.json(
                { error: `You don't have access to '${moduleKey}' module.`, code: 'MODULE_ACCESS_DENIED' },
                { status: 403 }
              )
            }
            return NextResponse.redirect(new URL('/admin', req.url))
          }
          break
        }
      }

      // Allow /admin dashboard itself
      return NextResponse.next()
    }

    // ══════════════════════════════════════
    // 6. ADMIN — Module & Plan checks
    // ══════════════════════════════════════
    if (role === 'admin') {

      // ── TRIAL: Only starter modules ──
      if (subscriptionStatus === 'trial' && !isSubPage) {

        for (const [route, moduleKey] of Object.entries(ADMIN_MODULE_ROUTES)) {
          if (pathname.startsWith(route)) {
            const allowedPlans = MODULE_PLAN_MAP[moduleKey]
            if (allowedPlans && !allowedPlans.includes('starter')) {
              if (pathname.startsWith('/api/')) {
                return NextResponse.json(
                  { error: `'${moduleKey}' is not available in trial. Please subscribe.`, code: 'TRIAL_BLOCKED' },
                  { status: 403 }
                )
              }
              return NextResponse.redirect(
                new URL(`/admin/subscription?blocked=${moduleKey}`, req.url)
              )
            }
            break
          }
        }

        if (pathname.startsWith('/api/') && !isAuthApi && !isSubApi && !isStaffApi) {
          for (const [moduleKey, allowedPlans] of Object.entries(MODULE_PLAN_MAP)) {
            if (pathname.startsWith(`/api/${moduleKey}`)) {
              if (!allowedPlans.includes('starter')) {
                return NextResponse.json(
                  { error: `'${moduleKey}' is not available in trial.`, code: 'TRIAL_BLOCKED' },
                  { status: 403 }
                )
              }
              break
            }
          }
        }
      }

      // ── ACTIVE: Plan-based module access ──
      if (subscriptionStatus === 'active' && !isSubPage) {

        for (const [route, moduleKey] of Object.entries(ADMIN_MODULE_ROUTES)) {
          if (pathname.startsWith(route)) {
            const allowedPlans = MODULE_PLAN_MAP[moduleKey]
            if (allowedPlans && !allowedPlans.includes(plan)) {
              return NextResponse.redirect(
                new URL(`/admin/subscription?blocked=${moduleKey}`, req.url)
              )
            }
            break
          }
        }

        if (pathname.startsWith('/api/') && !isAuthApi && !isSubApi && !isStaffApi) {
          for (const [moduleKey, allowedPlans] of Object.entries(MODULE_PLAN_MAP)) {
            if (pathname.startsWith(`/api/${moduleKey}`)) {
              if (!allowedPlans.includes(plan)) {
                return NextResponse.json(
                  { error: `Module '${moduleKey}' is not available in your plan.`, code: 'MODULE_BLOCKED' },
                  { status: 403 }
                )
              }
              break
            }
          }
        }
      }
    }

    // ══════════════════════════════════════
    // 7. TEACHER — Module check
    // ══════════════════════════════════════
    if (role === 'teacher' && pathname.startsWith('/teacher/')) {
      for (const [route, moduleKey] of Object.entries(TEACHER_MODULE_ROUTES)) {
        if (pathname.startsWith(route)) {
          const allowedPlans = MODULE_PLAN_MAP[moduleKey]
          if (allowedPlans && !allowedPlans.includes(plan)) {
            return NextResponse.redirect(new URL('/teacher', req.url))
          }
          break
        }
      }
    }

    // ══════════════════════════════════════
    // 8. ALL GOOD — proceed
    // ══════════════════════════════════════
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return true
        if (pathname.startsWith('/website/')) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons).*)'],
}