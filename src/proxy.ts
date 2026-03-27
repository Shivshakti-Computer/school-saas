import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes — no auth needed
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/api/auth',
    '/api/schools/register',
    '/api/manifest',
    '/_next',
    '/favicon.ico',
    '/icons',
    '/sw.js',
    '/manifest.json',
]

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

        // 🔥 SUPERADMIN (STRICT ISOLATION)
        if (role === 'superadmin') {
            if (!pathname.startsWith('/superadmin')) {
                return NextResponse.redirect(new URL('/superadmin', req.url))
            }
            return NextResponse.next()
        }

        // Role-based routing guards
        const roleRoutes: Record<string, string> = {
            admin: '/admin',
            teacher: '/teacher',
            student: '/student',
            parent: '/parent',
        }

        const allowedPrefix = roleRoutes[role]

        // If accessing wrong role's route, redirect to correct one
        if (allowedPrefix && pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(allowedPrefix, req.url))
        }

        // Trial/subscription expiry check (admin routes ke liye)
        if (
            role === 'admin' &&
            !pathname.startsWith('/admin/subscription') &&
            !pathname.startsWith('/api/') &&
            !pathname.startsWith('/_next')
        ) {
            const trialEndsAt = token.trialEndsAt as string | undefined
            const subscriptionId = token.subscriptionId as string | null | undefined

            if (trialEndsAt) {
                const isExpired = !subscriptionId && new Date(trialEndsAt) < new Date()
                if (isExpired) {
                    // Expired page ki jagah directly subscription page pe bhejo
                    return NextResponse.redirect(new URL('/admin/subscription', req.url))
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
            }
        }
    }
)

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|icons).*)'],
}


