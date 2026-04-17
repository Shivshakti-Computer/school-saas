// FILE: src/app/not-found.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import {
  Home, ArrowLeft, Compass, LayoutDashboard,
  Users, BookOpen, GraduationCap, CreditCard,
  FileText, Bell, RefreshCw,
} from 'lucide-react'

// ── Role → dashboard path ──
const DASH_PATHS: Record<string, string> = {
  superadmin: '/superadmin',
  admin:      '/admin',
  teacher:    '/teacher',
  staff:      '/admin',
  student:    '/student',
  parent:     '/parent',
}

// ── Role → quick links ──
function getQuickLinks(role: string) {
  switch (role) {
    case 'admin':
    case 'staff':
      return [
        { label: 'Students',    href: '/admin/students',    Icon: Users },
        { label: 'Attendance',  href: '/admin/attendance',  Icon: BookOpen },
        { label: 'Fees',        href: '/admin/fees',        Icon: CreditCard },
        { label: 'Notices',     href: '/admin/notices',     Icon: Bell },
      ]
    case 'teacher':
      return [
        { label: 'Attendance',  href: '/teacher/attendance', Icon: BookOpen },
        { label: 'Homework',    href: '/teacher/homework',   Icon: FileText },
        { label: 'Notices',     href: '/teacher/notices',    Icon: Bell },
      ]
    case 'student':
      return [
        { label: 'Attendance',  href: '/student/attendance', Icon: BookOpen },
        { label: 'Results',     href: '/student/results',    Icon: GraduationCap },
        { label: 'Homework',    href: '/student/homework',   Icon: FileText },
        { label: 'Fees',        href: '/student/fees',       Icon: CreditCard },
      ]
    case 'parent':
      return [
        { label: 'Attendance',  href: '/parent/attendance',  Icon: BookOpen },
        { label: 'Fees',        href: '/parent/fees',        Icon: CreditCard },
        { label: 'Results',     href: '/parent/results',     Icon: GraduationCap },
        { label: 'Notices',     href: '/parent/notices',     Icon: Bell },
      ]
    default:
      return []
  }
}

// ── Animated counter ring ──
function CountdownRing({
  count,
  total = 10,
  loading = false,
}: {
  count: number
  total?: number
  loading?: boolean
}) {
  const size     = 48
  const stroke   = 3
  const r        = (size - stroke * 2) / 2
  const circ     = 2 * Math.PI * r
  const progress = loading ? circ : circ - (count / total) * circ

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--primary-100)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--primary-500)"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
      </svg>
      {/* Number in center */}
      <div style={{
        position:   'absolute',
        inset:      0,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize:   '0.875rem',
        fontWeight: 700,
        color:      'var(--primary-600)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {loading ? (
          <RefreshCw size={13} style={{ color: 'var(--primary-400)', animation: 'spin 1.2s linear infinite' }} />
        ) : count}
      </div>
    </div>
  )
}

// ── Quick link pill ──
function QuickLink({
  href, label, Icon,
}: {
  href: string
  label: string
  Icon: React.ComponentType<{ size: number }>
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '0.375rem',
        padding:        '0.4375rem 0.875rem',
        borderRadius:   'var(--radius-md)',
        fontSize:       '0.8125rem',
        fontWeight:     500,
        color:          hovered ? 'var(--primary-600)'   : 'var(--text-secondary)',
        background:     hovered ? 'var(--primary-50)'    : 'var(--bg-muted)',
        border:         `1px solid ${hovered ? 'var(--primary-200)' : 'var(--border)'}`,
        textDecoration: 'none',
        transition:     'all 150ms ease',
        fontFamily:     'var(--font-body)',
      }}
    >
      <Icon size={13} />
      {label}
    </Link>
  )
}

// ── Floating particle ──
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        position:      'absolute',
        borderRadius:  '50%',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

export default function NotFound() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mounted,  setMounted]  = useState(false)
  const [count,    setCount]    = useState(10)
  const [redirecting, setRedirecting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLoading  = status === 'loading'
  const isAuthed   = status === 'authenticated'
  const role       = session?.user?.role ?? 'admin'
  const dashHref   = DASH_PATHS[role] ?? '/admin'
  const targetHref = isAuthed ? dashHref : '/login'
  const quickLinks = getQuickLinks(role)

  // mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  // countdown — wait for session to settle
  useEffect(() => {
    if (isLoading || !mounted) return
    if (count <= 0) {
      setRedirecting(true)
      router.push(targetHref)
      return
    }
    timerRef.current = setTimeout(() => setCount(c => c - 1), 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [count, mounted, isLoading, targetHref, router])

  // stop timer on manual nav
  const stopTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCount(0)
  }

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '1.25rem',
      position:        'relative',
      overflow:        'hidden',
      backgroundColor: 'var(--bg-base)',
      fontFamily:      'var(--font-body)',
    }}>

      {/* ── Ambient blobs ── */}
      <div style={{
        position: 'absolute', top: '-12%', left: '-6%',
        width: '42vw', height: '42vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 70%)',
        filter: 'blur(56px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-6%',
        width: '36vw', height: '36vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 70%)',
        filter: 'blur(56px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '42%', right: '14%',
        width: '20vw', height: '20vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* ── Subtle dot grid ── */}
      <div className="dot-pattern" style={{
        position: 'absolute', inset: 0,
        opacity: 0.45, pointerEvents: 'none',
      }} />

      {/* ── Decorative floating particles ── */}
      <Particle style={{
        top: '18%', left: '12%',
        width: '6px', height: '6px',
        background: 'var(--primary-300)',
        opacity: 0.5,
        animation: 'float 7s ease-in-out infinite',
      }} />
      <Particle style={{
        top: '72%', left: '8%',
        width: '4px', height: '4px',
        background: 'var(--accent-400)',
        opacity: 0.4,
        animation: 'float 9s ease-in-out infinite 1s',
      }} />
      <Particle style={{
        top: '28%', right: '10%',
        width: '8px', height: '8px',
        background: 'var(--primary-200)',
        opacity: 0.5,
        animation: 'float 6s ease-in-out infinite 0.5s',
      }} />
      <Particle style={{
        bottom: '22%', right: '16%',
        width: '5px', height: '5px',
        background: 'var(--accent-300)',
        opacity: 0.4,
        animation: 'float 8s ease-in-out infinite 2s',
      }} />

      {/* ════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════ */}
      <div style={{
        position:   'relative',
        zIndex:     10,
        width:      '100%',
        maxWidth:   '500px',
        opacity:    mounted ? 1 : 0,
        transform:  mounted ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
        transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* ── Giant 404 with icon ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>

          {/* Decorative top label */}
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.375rem',
            padding:        '0.3125rem 0.875rem',
            borderRadius:   'var(--radius-full)',
            background:     'var(--primary-50)',
            border:         '1px solid var(--primary-200)',
            marginBottom:   '0.875rem',
          }}>
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: 'var(--primary-500)',
              display: 'inline-block',
              animation: 'pulseSoft 2.5s ease-in-out infinite',
            }} />
            <span style={{
              fontSize:   '0.6875rem',
              fontWeight: 600,
              color:      'var(--primary-600)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Error 404
            </span>
          </div>

          {/* 404 number */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <p style={{
              fontFamily:  'var(--font-display)',
              fontSize:    'clamp(5.5rem, 18vw, 8.5rem)',
              fontWeight:  900,
              letterSpacing: '-0.05em',
              lineHeight:  1,
              margin:      0,
              background:  'linear-gradient(135deg, var(--primary-200) 0%, var(--primary-400) 45%, var(--accent-300) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              userSelect:  'none',
            }}>
              404
            </p>

            {/* Floating compass icon */}
            <div style={{
              position:       'absolute',
              inset:          0,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              animation:      'float 5s ease-in-out infinite',
            }}>
              <div style={{
                width:        '3.375rem',
                height:       '3.375rem',
                borderRadius: 'var(--radius-xl)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                background:   'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                boxShadow:    '0 8px 32px rgba(99,102,241,0.40), 0 2px 8px rgba(99,102,241,0.2)',
              }}>
                <Compass size={26} color="#ffffff" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="portal-card"
          style={{ borderRadius: 'var(--radius-2xl)', overflow: 'visible' }}
        >
          <div style={{ padding: '2rem 2rem 1.75rem' }}>

            {/* Heading */}
            <h1 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '1.5625rem',
              fontWeight:    800,
              color:         'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight:    1.2,
              margin:        '0 0 0.625rem',
              textAlign:     'center',
            }}>
              Page Not Found
            </h1>

            <p style={{
              fontSize:    '0.9375rem',
              color:       'var(--text-muted)',
              lineHeight:  1.65,
              margin:      '0 0 1.75rem',
              textAlign:   'center',
            }}>
              The page you're looking for doesn't exist, has been
              moved, or you don't have permission to access it.
            </p>

            {/* ── Countdown row ── */}
            <div style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '0.875rem',
              padding:         '0.875rem 1.125rem',
              borderRadius:    'var(--radius-xl)',
              background:      'var(--bg-subtle)',
              border:          '1px solid var(--border)',
              marginBottom:    '1.25rem',
            }}>
              <CountdownRing
                count={count}
                total={10}
                loading={isLoading || redirecting}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize:   '0.8125rem',
                  fontWeight: 600,
                  color:      'var(--text-primary)',
                  margin:     '0 0 0.1875rem',
                  fontFamily: 'var(--font-display)',
                }}>
                  {redirecting
                    ? 'Redirecting…'
                    : isLoading
                      ? 'Checking session…'
                      : `Redirecting in ${count}s`
                  }
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color:    'var(--text-muted)',
                  margin:   0,
                  lineHeight: 1.4,
                }}>
                  {isLoading
                    ? 'Please wait while we verify your session.'
                    : isAuthed
                      ? `You'll be taken to your dashboard automatically.`
                      : `You'll be redirected to the login page.`
                  }
                </p>
              </div>
            </div>

            {/* ── Primary CTA ── */}
            <Link
              href={targetHref}
              onClick={stopTimer}
              className="btn-primary"
              style={{
                width:          '100%',
                justifyContent: 'center',
                borderRadius:   'var(--radius-lg)',
                fontSize:       '0.9375rem',
                marginBottom:   '0.625rem',
                gap:            '0.5rem',
              }}
            >
              <Home size={15} />
              {isAuthed ? 'Go to Dashboard' : 'Go to Login'}
            </Link>

            {/* ── Secondary CTA ── */}
            <button
              onClick={() => { stopTimer(); router.back() }}
              className="btn-ghost"
              style={{
                width:          '100%',
                justifyContent: 'center',
                borderRadius:   'var(--radius-lg)',
                fontSize:       '0.9375rem',
                gap:            '0.5rem',
              }}
            >
              <ArrowLeft size={15} />
              Go Back
            </button>

            {/* ── Quick links — only when authenticated ── */}
            {isAuthed && (
              <>
                {/* Divider */}
                <div style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '0.75rem',
                  margin:      '1.5rem 0 1.125rem',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{
                    fontSize:      '0.6875rem',
                    fontWeight:    700,
                    color:         'var(--text-light)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily:    'var(--font-display)',
                    whiteSpace:    'nowrap',
                  }}>
                    Quick Navigation
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Links grid */}
                <div style={{
                  display:        'flex',
                  flexWrap:       'wrap',
                  gap:            '0.5rem',
                  justifyContent: 'center',
                }}>
                  <QuickLink
                    href={dashHref}
                    label="Dashboard"
                    Icon={LayoutDashboard}
                  />
                  {quickLinks.map(link => (
                    <QuickLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      Icon={link.Icon}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Card footer ── */}
          <div style={{
            padding:       '0.875rem 2rem',
            borderTop:     '1px solid var(--border)',
            background:    'var(--bg-subtle)',
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'space-between',
            gap:           '0.75rem',
            flexWrap:      'wrap',
          }}>
            <p style={{
              fontSize:   '0.75rem',
              color:      'var(--text-muted)',
              margin:     0,
              lineHeight: 1.4,
            }}>
              If you believe this is a mistake,{' '}
              <Link
                href="/contact"
                style={{
                  color:          'var(--primary-500)',
                  textDecoration: 'none',
                  fontWeight:     500,
                }}
              >
                contact support
              </Link>
              .
            </p>
            {session?.user?.schoolName && (
              <span style={{
                fontSize:      '0.6875rem',
                color:         'var(--text-light)',
                fontFamily:    'var(--font-display)',
                fontWeight:    500,
                whiteSpace:    'nowrap',
                padding:       '0.1875rem 0.625rem',
                borderRadius:  'var(--radius-full)',
                background:    'var(--bg-muted)',
                border:        '1px solid var(--border)',
              }}>
                {session.user.schoolName}
              </span>
            )}
          </div>
        </div>

        {/* ── Bottom branding ── */}
        <p style={{
          textAlign:   'center',
          marginTop:   '1.25rem',
          fontSize:    '0.75rem',
          color:       'var(--text-light)',
          fontFamily:  'var(--font-display)',
          fontWeight:  500,
          letterSpacing: '0.01em',
        }}>
          Powered by{' '}
          <span style={{ color: 'var(--primary-400)' }}>Skolify</span>
        </p>
      </div>
    </div>
  )
}