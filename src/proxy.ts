import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/api/auth',
    '/api/schools/register',
    '/api/manifest',
    '/_next',
    '/favicon.ico',
    '/icons',
    '/sw.js',
    '/manifest.json',
]

// Module → required plan mapping (synced with plans.ts)
// This runs in Edge Runtime — can't import plans.ts directly
// Keep this in sync manually when plans change
const MODULE_PLAN_MAP: Record<string, string[]> = {
    fees:           ['growth', 'pro', 'enterprise'],
    exams:          ['growth', 'pro', 'enterprise'],
    timetable:      ['growth', 'pro', 'enterprise'],
    homework:       ['growth', 'pro', 'enterprise'],
    documents:      ['growth', 'pro', 'enterprise'],
    reports:        ['growth', 'pro', 'enterprise'],
    communication:  ['growth', 'pro', 'enterprise'],
    library:        ['pro', 'enterprise'],
    certificates:   ['pro', 'enterprise'],
    lms:            ['pro', 'enterprise'],
    hr:             ['enterprise'],
    transport:      ['enterprise'],
    hostel:         ['enterprise'],
    inventory:      ['enterprise'],
    visitor:        ['enterprise'],
    health:         ['enterprise'],
    alumni:         ['enterprise'],
}

// Admin routes that map to modules
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

export default withAuth(
    function proxy(req: NextRequest) {
        const { pathname } = req.nextUrl
        const token = (req as any).nextauth?.token

        // Allow public routes
        if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
            return NextResponse.next()
        }

        // Allow public school websites
        if (pathname.startsWith('/website/')) {
            return NextResponse.next()
        }

        if (!token) {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        const role = token.role as string
        const plan = token.plan as string

        // ── SUPERADMIN ──
        if (role === 'superadmin') {
            if (!pathname.startsWith('/superadmin') && !pathname.startsWith('/api/')) {
                return NextResponse.redirect(new URL('/superadmin', req.url))
            }
            return NextResponse.next()
        }

        // ── ROLE ROUTING ──
        const roleRoutes: Record<string, string> = {
            admin: '/admin',
            teacher: '/teacher',
            student: '/student',
            parent: '/parent',
        }

        const allowedPrefix = roleRoutes[role]
        if (allowedPrefix) {
            // Prevent accessing other roles' routes
            for (const [r, prefix] of Object.entries(roleRoutes)) {
                if (r !== role && pathname.startsWith(prefix)) {
                    return NextResponse.redirect(new URL(allowedPrefix, req.url))
                }
            }
        }

        // ── SUBSCRIPTION EXPIRY CHECK (admin only) ──
        if (
            role === 'admin' &&
            !pathname.startsWith('/admin/subscription') &&
            !pathname.startsWith('/api/')
        ) {
            const trialEndsAt = token.trialEndsAt as string | undefined
            const subscriptionId = token.subscriptionId as string | null | undefined

            if (trialEndsAt && !subscriptionId) {
                const isExpired = new Date(trialEndsAt) < new Date()
                if (isExpired) {
                    return NextResponse.redirect(
                        new URL('/admin/subscription', req.url)
                    )
                }
            }
        }

        // ── MODULE ACCESS CHECK (admin routes) ──
        if (role === 'admin' && pathname.startsWith('/admin/')) {
            for (const [route, moduleKey] of Object.entries(ADMIN_MODULE_ROUTES)) {
                if (pathname.startsWith(route)) {
                    const allowedPlans = MODULE_PLAN_MAP[moduleKey]
                    if (allowedPlans && !allowedPlans.includes(plan)) {
                        // Redirect to subscription page with blocked module info
                        return NextResponse.redirect(
                            new URL(
                                `/admin/subscription?blocked=${moduleKey}`,
                                req.url
                            )
                        )
                    }
                    break
                }
            }
        }

        // ── MODULE ACCESS CHECK (teacher routes) ──
        if (role === 'teacher' && pathname.startsWith('/teacher/')) {
            const teacherModuleRoutes: Record<string, string> = {
                '/teacher/marks':    'exams',
                '/teacher/homework': 'homework',
                '/teacher/lms':      'lms',
            }
            for (const [route, moduleKey] of Object.entries(teacherModuleRoutes)) {
                if (pathname.startsWith(route)) {
                    const allowedPlans = MODULE_PLAN_MAP[moduleKey]
                    if (allowedPlans && !allowedPlans.includes(plan)) {
                        return NextResponse.redirect(
                            new URL('/teacher', req.url)
                        )
                    }
                    break
                }
            }
        }

        // ── API MODULE CHECK ──
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
            for (const [moduleKey, allowedPlans] of Object.entries(MODULE_PLAN_MAP)) {
                if (pathname.startsWith(`/api/${moduleKey}`)) {
                    if (!allowedPlans.includes(plan)) {
                        return NextResponse.json(
                            {
                                error: `Module '${moduleKey}' is not available in your current plan.`,
                                code: 'MODULE_BLOCKED',
                                upgrade: '/admin/subscription',
                            },
                            { status: 403 }
                        )
                    }
                    break
                }
            }
        }

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