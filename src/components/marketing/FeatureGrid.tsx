// FILE: src/components/marketing/FeatureGrid.tsx
// 8 Core Features — with SVG mini-illustrations (NO Math.random — hydration safe)

'use client'

import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { useRevealGroup } from '@/hooks/useReveal'

/* ═══════════════════════════════════════════════════════
   SVG ILLUSTRATIONS — All values FIXED (no randomness)
   ═══════════════════════════════════════════════════════ */

function StudentIllustration() {
    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="20" y="10" width="160" height="100" rx="12" fill="rgba(79,70,229,0.06)" stroke="rgba(79,70,229,0.15)" strokeWidth="1" />
            <circle cx="60" cy="45" r="16" fill="rgba(79,70,229,0.15)" />
            <circle cx="60" cy="40" r="6" fill="rgba(129,140,248,0.6)" />
            <path d="M46 58a14 14 0 0 1 28 0" fill="rgba(129,140,248,0.4)" />
            <rect x="90" y="32" width="70" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
            <rect x="90" y="44" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />
            <rect x="90" y="55" width="60" height="5" rx="2.5" fill="rgba(255,255,255,0.06)" />
            <rect x="30" y="72" width="60" height="28" rx="6" fill="rgba(79,70,229,0.12)" stroke="rgba(79,70,229,0.2)" strokeWidth="0.5" />
            <rect x="38" y="80" width="20" height="3" rx="1.5" fill="rgba(129,140,248,0.5)" />
            <rect x="38" y="87" width="40" height="2.5" rx="1.25" fill="rgba(255,255,255,0.08)" />
            <rect x="38" y="93" width="30" height="2.5" rx="1.25" fill="rgba(255,255,255,0.05)" />
            <circle cx="165" cy="25" r="4" fill="#10B981" opacity="0.7" />
            <rect x="105" y="78" width="30" height="18" rx="5" fill="rgba(16,185,129,0.15)" />
            <rect x="140" y="78" width="30" height="18" rx="5" fill="rgba(79,70,229,0.15)" />
        </svg>
    )
}

function AttendanceIllustration() {
    // Fixed attendance pattern — NO Math.random()
    const pattern = [
        [true, true, true, false, true, true, true],
        [true, true, true, true, true, false, true],
        [true, false, true, true, true, true, true],
        [true, true, true, true, false, true, true],
    ]

    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="20" y="10" width="160" height="100" rx="12" fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.12)" strokeWidth="1" />
            <rect x="20" y="10" width="160" height="24" rx="12" fill="rgba(16,185,129,0.08)" />
            <rect x="65" y="18" width="70" height="5" rx="2.5" fill="rgba(16,185,129,0.4)" />
            {pattern.map((row, rowIdx) =>
                row.map((isPresent, colIdx) => {
                    const x = 30 + colIdx * 21
                    const y = 42 + rowIdx * 17
                    return (
                        <g key={`${rowIdx}-${colIdx}`}>
                            <rect
                                x={x}
                                y={y}
                                width="16"
                                height="12"
                                rx="3"
                                fill={isPresent ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'}
                            />
                            {isPresent ? (
                                <path
                                    d={`M${x + 4} ${y + 6}l3 3 5-5`}
                                    stroke="#10B981"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.7"
                                />
                            ) : (
                                <path
                                    d={`M${x + 5} ${y + 4}l6 6M${x + 11} ${y + 4}l-6 6`}
                                    stroke="#EF4444"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    opacity="0.5"
                                />
                            )}
                        </g>
                    )
                })
            )}
        </svg>
    )
}

function FeesIllustration() {
    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="30" y="8" width="140" height="104" rx="12" fill="rgba(245,158,11,0.04)" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
            <rect x="30" y="8" width="140" height="28" rx="12" fill="rgba(245,158,11,0.08)" />
            <rect x="55" y="16" width="90" height="5" rx="2.5" fill="rgba(245,158,11,0.4)" />
            <rect x="70" y="25" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <text x="100" y="58" textAnchor="middle" fill="rgba(245,158,11,0.7)" fontSize="16" fontWeight="bold" fontFamily="monospace">₹2,500</text>
            <rect x="45" y="68" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
            <rect x="120" y="68" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <rect x="45" y="78" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
            <rect x="120" y="78" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <line x1="45" y1="88" x2="155" y2="88" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 2" />
            <rect x="45" y="93" width="30" height="4" rx="2" fill="rgba(245,158,11,0.3)" />
            <rect x="115" y="93" width="40" height="4" rx="2" fill="rgba(245,158,11,0.3)" />
            <rect x="65" y="102" width="70" height="7" rx="3.5" fill="rgba(16,185,129,0.12)" />
            <rect x="75" y="104" width="50" height="3" rx="1.5" fill="rgba(16,185,129,0.3)" />
        </svg>
    )
}

function ExamsIllustration() {
    // Fixed scores — NO Math.random()
    const subjects = [
        { score: 85 },
        { score: 72 },
        { score: 91 },
        { score: 68 },
        { score: 78 },
    ]

    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="25" y="8" width="150" height="104" rx="12" fill="rgba(244,63,94,0.04)" stroke="rgba(244,63,94,0.12)" strokeWidth="1" />
            <rect x="25" y="8" width="150" height="24" rx="12" fill="rgba(244,63,94,0.08)" />
            <rect x="60" y="15" width="80" height="5" rx="2.5" fill="rgba(244,63,94,0.4)" />
            {subjects.map((sub, i) => {
                const y = 40 + i * 13
                const barWidth = sub.score * 0.7
                const fillColor =
                    sub.score > 80
                        ? 'rgba(16,185,129,0.3)'
                        : sub.score > 60
                            ? 'rgba(245,158,11,0.3)'
                            : 'rgba(239,68,68,0.3)'
                return (
                    <g key={i}>
                        <rect x="35" y={y} width="35" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
                        <rect x="78" y={y - 1} width={barWidth} height="6" rx="3" fill={fillColor} />
                        <text x="155" y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="monospace">
                            {sub.score}%
                        </text>
                    </g>
                )
            })}
            <circle cx="155" cy="98" r="10" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
            <text x="155" y="101" textAnchor="middle" fill="rgba(16,185,129,0.7)" fontSize="8" fontWeight="bold">A+</text>
        </svg>
    )
}

function NoticesIllustration() {
    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="35" y="20" width="130" height="30" rx="8" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.12)" strokeWidth="0.5" transform="rotate(-2 100 35)" />
            <rect x="30" y="35" width="140" height="35" rx="10" fill="rgba(56,189,248,0.04)" stroke="rgba(56,189,248,0.1)" strokeWidth="1" />
            <rect x="25" y="50" width="150" height="55" rx="12" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
            <circle cx="48" cy="72" r="10" fill="rgba(56,189,248,0.12)" />
            <path d="M44 72a4 4 0 0 1 8 0c0 4 2 5 2 5H42s2-1 2-5" stroke="rgba(56,189,248,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <circle cx="48" cy="78.5" r="1" fill="rgba(56,189,248,0.4)" />
            <rect x="65" y="66" width="90" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
            <rect x="65" y="74" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <rect x="65" y="82" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.04)" />
            <rect x="130" y="88" width="35" height="12" rx="6" fill="rgba(16,185,129,0.12)" />
            <text x="147" y="96" textAnchor="middle" fill="rgba(16,185,129,0.5)" fontSize="6" fontWeight="600">SMS ✓</text>
            <circle cx="167" cy="58" r="4" fill="rgba(239,68,68,0.5)" />
            <text x="167" y="60" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">3</text>
        </svg>
    )
}

function WebsiteIllustration() {
    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="15" y="8" width="170" height="104" rx="10" fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.12)" strokeWidth="1" />
            <rect x="15" y="8" width="170" height="18" rx="10" fill="rgba(16,185,129,0.08)" />
            <circle cx="28" cy="17" r="2.5" fill="rgba(239,68,68,0.4)" />
            <circle cx="36" cy="17" r="2.5" fill="rgba(245,158,11,0.4)" />
            <circle cx="44" cy="17" r="2.5" fill="rgba(16,185,129,0.4)" />
            <rect x="55" y="13" width="80" height="8" rx="4" fill="rgba(255,255,255,0.04)" />
            <rect x="22" y="30" width="156" height="30" rx="4" fill="rgba(79,70,229,0.08)" />
            <rect x="50" y="38" width="100" height="5" rx="2.5" fill="rgba(79,70,229,0.2)" />
            <rect x="65" y="47" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <rect x="22" y="65" width="48" height="38" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="76" y="65" width="48" height="38" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="130" y="65" width="48" height="38" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <rect x="28" y="72" width="36" height="14" rx="3" fill="rgba(79,70,229,0.08)" />
            <rect x="28" y="90" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <rect x="82" y="72" width="36" height="14" rx="3" fill="rgba(16,185,129,0.08)" />
            <rect x="82" y="90" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
            <rect x="136" y="72" width="36" height="14" rx="3" fill="rgba(245,158,11,0.08)" />
            <rect x="136" y="90" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.06)" />
        </svg>
    )
}

function ReportsIllustration() {
    // Fixed bar heights — NO Math.random()
    const barHeights = [40, 65, 45, 80, 55, 72, 90, 60, 75, 85]

    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <rect x="20" y="10" width="160" height="100" rx="12" fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.12)" strokeWidth="1" />
            <rect x="30" y="25" width="140" height="60" rx="6" fill="rgba(139,92,246,0.04)" />
            {[0, 1, 2, 3].map(i => (
                <line key={i} x1="30" y1={35 + i * 13} x2="170" y2={35 + i * 13} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            ))}
            {barHeights.map((h, i) => (
                <rect
                    key={i}
                    x={38 + i * 13}
                    y={85 - h * 0.55}
                    width="8"
                    height={h * 0.55}
                    rx="2"
                    fill={`rgba(139,92,246,${0.2 + h / 200})`}
                />
            ))}
            <rect x="35" y="92" width="6" height="6" rx="1.5" fill="rgba(139,92,246,0.3)" />
            <rect x="45" y="93" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
            <rect x="85" y="92" width="6" height="6" rx="1.5" fill="rgba(16,185,129,0.3)" />
            <rect x="95" y="93" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
            <rect x="135" y="92" width="30" height="10" rx="5" fill="rgba(139,92,246,0.12)" />
            <text x="150" y="99" textAnchor="middle" fill="rgba(139,92,246,0.5)" fontSize="5" fontWeight="600">PDF ↓</text>
        </svg>
    )
}

function SecurityIllustration() {
    return (
        <svg viewBox="0 0 200 120" fill="none" className="w-full h-auto">
            <path
                d="M100 15l55 20v35c0 25-22 40-55 45-33-5-55-20-55-45V35l55-20z"
                fill="rgba(100,116,139,0.06)"
                stroke="rgba(100,116,139,0.15)"
                strokeWidth="1"
            />
            <path
                d="M100 28l38 14v24c0 17-15 28-38 32-23-4-38-15-38-32V42l38-14z"
                fill="rgba(100,116,139,0.04)"
            />
            <rect x="90" y="52" width="20" height="16" rx="3" fill="rgba(100,116,139,0.2)" />
            <path d="M95 52v-6a5 5 0 0 1 10 0v6" stroke="rgba(100,116,139,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="100" cy="60" r="2" fill="rgba(100,116,139,0.4)" />
            <line x1="100" y1="61" x2="100" y2="64" stroke="rgba(100,116,139,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="20" y="85" width="38" height="14" rx="7" fill="rgba(79,70,229,0.1)" stroke="rgba(79,70,229,0.15)" strokeWidth="0.5" />
            <text x="39" y="94" textAnchor="middle" fill="rgba(129,140,248,0.6)" fontSize="6" fontWeight="600">Admin</text>
            <rect x="64" y="85" width="42" height="14" rx="7" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.15)" strokeWidth="0.5" />
            <text x="85" y="94" textAnchor="middle" fill="rgba(16,185,129,0.6)" fontSize="6" fontWeight="600">Teacher</text>
            <rect x="112" y="85" width="42" height="14" rx="7" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.15)" strokeWidth="0.5" />
            <text x="133" y="94" textAnchor="middle" fill="rgba(245,158,11,0.6)" fontSize="6" fontWeight="600">Student</text>
            <rect x="160" y="85" width="30" height="14" rx="7" fill="rgba(244,63,94,0.1)" stroke="rgba(244,63,94,0.15)" strokeWidth="0.5" />
            <text x="175" y="94" textAnchor="middle" fill="rgba(244,63,94,0.6)" fontSize="6" fontWeight="600">Parent</text>
        </svg>
    )
}

/* ═══════════════════════════════════════════════════════
   FEATURES DATA
   ═══════════════════════════════════════════════════════ */
const features = [
    {
        illustration: <StudentIllustration />,
        title: 'Student & Staff Management',
        desc: 'Complete admission workflow, student profiles, ID card generation, bulk import via Excel & staff records.',
        points: ['Bulk import/export', 'ID cards PDF', 'Parent linking', 'Profile photos'],
        gradient: 'from-brand to-purple-500',
        glowColor: 'rgba(79,70,229,0.08)',
    },
    {
        illustration: <AttendanceIllustration />,
        title: 'Attendance Tracking',
        desc: 'Daily class-wise attendance with auto absent SMS to parents. Visual reports & monthly analytics.',
        points: ['Auto SMS to parents', 'Monthly reports', 'Class-wise view', 'Holiday calendar'],
        gradient: 'from-emerald-400 to-teal-500',
        glowColor: 'rgba(16,185,129,0.08)',
    },
    {
        illustration: <FeesIllustration />,
        title: 'Online Fee Collection',
        desc: 'Collect fees via Razorpay. Auto late-fine, SMS reminders, PDF receipts & detailed fee reports.',
        points: ['Razorpay payments', 'Auto reminders', 'Late fine rules', 'PDF receipts'],
        gradient: 'from-amber-400 to-orange-500',
        glowColor: 'rgba(245,158,11,0.08)',
    },
    {
        illustration: <ExamsIllustration />,
        title: 'Exams & Results',
        desc: 'Schedule exams, teacher marks entry, auto grade calculation, report cards & result SMS to parents.',
        points: ['Grade cards PDF', 'Result SMS', 'Subject analytics', 'Rank generation'],
        gradient: 'from-rose-400 to-pink-500',
        glowColor: 'rgba(244,63,94,0.08)',
    },
    {
        illustration: <NoticesIllustration />,
        title: 'Notices & Communication',
        desc: 'Publish circulars, send SMS blasts, WhatsApp messages. Keep parents & students always informed.',
        points: ['SMS blast', 'WhatsApp ready', 'Class-wise targeting', 'Read receipts'],
        gradient: 'from-sky-400 to-blue-500',
        glowColor: 'rgba(56,189,248,0.08)',
    },
    {
        illustration: <WebsiteIllustration />,
        title: 'School Website Builder',
        desc: 'Professional templates, drag-to-reorder sections, photo gallery, events, contact forms — no coding needed.',
        points: ['3 templates', 'Gallery & events', 'SEO optimized', 'Mobile responsive'],
        gradient: 'from-green-400 to-emerald-500',
        glowColor: 'rgba(16,185,129,0.08)',
    },
    {
        illustration: <ReportsIllustration />,
        title: 'Reports & Analytics',
        desc: 'Class-wise analytics, attendance trends, fee collection reports. Export everything to PDF & Excel.',
        points: ['PDF & Excel export', 'Visual charts', 'Trend analysis', 'Custom filters'],
        gradient: 'from-violet-400 to-purple-500',
        glowColor: 'rgba(139,92,246,0.08)',
    },
    {
        illustration: <SecurityIllustration />,
        title: 'Security & Access Control',
        desc: 'Role-based access (Admin, Teacher, Student, Parent). Plan-based module locks & tenant data isolation.',
        points: ['4 user roles', 'Module locking', 'Data encryption', 'Tenant isolation'],
        gradient: 'from-slate-400 to-slate-500',
        glowColor: 'rgba(100,116,139,0.08)',
    },
]

/* ═══════════════════════════════════════════════════════
   FEATURE GRID COMPONENT
   ═══════════════════════════════════════════════════════ */
export function FeatureGrid() {
    const gridRef = useRevealGroup()

    return (
        <section id="features" className="section-padding relative">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-brand/[0.03] blur-[150px] rounded-full" />
            </div>

            <Container>
                <SectionTitle
                    eyebrow="✦ Core Features"
                    title="Everything your school needs, in one connected system"
                    subtitle="No more juggling multiple apps. One login, one subscription — a clean experience for admin, teachers, parents & students."
                    center
                />

                <div ref={gridRef} className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {features.map((feature) => (
                        <div key={feature.title} className="group card-dark overflow-hidden">
                            <div className="flex flex-col sm:flex-row">
                                <div
                                    className="sm:w-[45%] p-4 flex items-center justify-center"
                                    style={{ background: feature.glowColor }}
                                >
                                    <div className="w-full max-w-[200px]">{feature.illustration}</div>
                                </div>

                                <div className="flex-1 p-5">
                                    <div className={`w-10 h-1 rounded-full bg-gradient-to-r ${feature.gradient} mb-3`} />
                                    <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-[13px] text-slate-400 leading-relaxed mb-3">{feature.desc}</p>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                        {feature.points.map(point => (
                                            <span key={point} className="flex items-center gap-1.5 text-[12px] text-slate-500">
                                                <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${feature.gradient} flex-shrink-0`} />
                                                {point}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="h-[2px] bg-white/[0.03]">
                                <div className={`h-full bg-gradient-to-r ${feature.gradient} w-0 group-hover:w-full transition-all duration-700 ease-out`} />
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}