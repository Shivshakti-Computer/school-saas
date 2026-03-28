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
  fees:          ['growth', 'pro', 'enterprise'],
  exams:         ['growth', 'pro', 'enterprise'],
  timetable:     ['growth', 'pro', 'enterprise'],
  homework:      ['growth', 'pro', 'enterprise'],
  documents:     ['growth', 'pro', 'enterprise'],
  reports:       ['growth', 'pro', 'enterprise'],
  communication: ['growth', 'pro', 'enterprise'],
  library:       ['pro', 'enterprise'],
  certificates:  ['pro', 'enterprise'],
  lms:           ['pro', 'enterprise'],
  hr:            ['enterprise'],
  transport:     ['enterprise'],
  hostel:        ['enterprise'],
  inventory:     ['enterprise'],
  visitor:       ['enterprise'],
  health:        ['enterprise'],
  alumni:        ['enterprise'],
}

// ── ADMIN PAGE → MODULE MAPPING ──
const ADMIN_MODULE_ROUTES: Record<string, string> = {
  '/admin/fees':          'fees',
  '/admin/exams':         'exams',
  '/admin/timetable':     'timetable',
  '/admin/homework':      'homework',
  '/admin/documents':     'documents',
  '/admin/reports':       'reports',
  '/admin/communication': 'communication',
  '/admin/library':       'library',
  '/admin/certificates':  'certificates',
  '/admin/lms':           'lms',
  '/admin/hr':            'hr',
  '/admin/transport':     'transport',
  '/admin/hostel':        'hostel',
  '/admin/inventory':     'inventory',
  '/admin/visitor':       'visitor',
  '/admin/health':        'health',
  '/admin/alumni':        'alumni',
}

// ── TEACHER PAGE → MODULE MAPPING ──
const TEACHER_MODULE_ROUTES: Record<string, string> = {
  '/teacher/marks':     'exams',
  '/teacher/homework':  'homework',
  '/teacher/lms':       'lms',
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

    // School public websites
    if (pathname.startsWith('/website/')) {
      return NextResponse.next()
    }

    // No token = not logged in
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = token.role as string
    const plan = token.plan as string
    const subscriptionStatus = (token.subscriptionStatus as string) || 'expired'

    // ══════════════════════════════════════
    // 2. SUPERADMIN — full access, locked to /superadmin
    // ══════════════════════════════════════
    if (role === 'superadmin') {
      if (!pathname.startsWith('/superadmin') && !pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/superadmin', req.url))
      }
      return NextResponse.next()
    }

    // ══════════════════════════════════════
    // 3. ROLE-BASED ROUTING
    //    Each role can only access their own prefix
    //    /admin → admin, /teacher → teacher, etc.
    // ══════════════════════════════════════
    const roleRoutes: Record<string, string> = {
      admin:   '/admin',
      teacher: '/teacher',
      student: '/student',
      parent:  '/parent',
    }

    const allowedPrefix = roleRoutes[role]

    // If user hits wrong role's route, redirect to their own dashboard
    if (allowedPrefix) {
      for (const [r, prefix] of Object.entries(roleRoutes)) {
        if (r !== role && pathname.startsWith(prefix)) {
          return NextResponse.redirect(new URL(allowedPrefix, req.url))
        }
      }
    }

    // ══════════════════════════════════════
    // 4. SUBSCRIPTION STATUS CHECK
    //    Applies to ALL school roles (admin, teacher, student, parent)
    //    Expired school = nobody can use anything
    // ══════════════════════════════════════

    const isAuthApi = pathname.startsWith('/api/auth')
    const isSubApi = pathname.startsWith('/api/subscription')
    const isSubPage = pathname.startsWith('/admin/subscription')

    // ── 4a. EXPIRED: Block ALL school users ──
    if (subscriptionStatus === 'expired') {
      // Admin can access subscription page to renew
      if (role === 'admin' && (isSubPage || isSubApi || isAuthApi)) {
        return NextResponse.next()
      }

      // API requests → 403 JSON
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

      // Teacher/Student/Parent → login with message
      return NextResponse.redirect(new URL('/login?expired=1', req.url))
    }

    // ══════════════════════════════════════
    // 5. ADMIN-SPECIFIC MODULE CHECKS
    // ══════════════════════════════════════
    if (role === 'admin') {

      // ── 5a. TRIAL: Only starter modules ──
      if (subscriptionStatus === 'trial' && !isSubPage) {

        // Check admin page routes
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

        // Check API routes
        if (pathname.startsWith('/api/') && !isAuthApi && !isSubApi) {
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

      // ── 5b. ACTIVE: Check plan-based module access ──
      if (subscriptionStatus === 'active' && !isSubPage) {

        // Check admin page routes
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

        // Check API routes
        if (pathname.startsWith('/api/') && !isAuthApi && !isSubApi) {
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
    // 6. TEACHER MODULE CHECK
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
    // 7. ALL GOOD — proceed
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