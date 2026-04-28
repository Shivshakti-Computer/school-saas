'use client'

import Link from 'next/link'
import { PLANS } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

// Module display info
const MODULE_INFO: Record<string, {
    name: string
    icon: string
    desc: string
    features: string[]
}> = {
    students: {
        name: 'Student Management',
        icon: '👨‍🎓',
        desc: 'Complete student profiles, ID cards, and admission management in one place.',
        features: ['Student profiles with photos', 'Auto admission numbers', 'ID card PDF download', 'Excel import/export'],
    },
    attendance: {
        name: 'Attendance',
        icon: '📋',
        desc: 'Daily attendance tracking with automatic parent SMS notifications.',
        features: ['Class-wise attendance', 'Absent alerts to parents', 'Monthly reports', 'Teacher portal access'],
    },
    fees: {
        name: 'Fee Management',
        icon: '💳',
        desc: 'Online fee collection, receipts, late fines — fully automated.',
        features: ['Online payments (UPI, Card, NetBanking)', 'Auto receipt PDF generation', 'Late fine calculator', 'SMS reminders to parents', 'Class-wise fee structure'],
    },
    exams: {
        name: 'Exam & Results',
        icon: '📝',
        desc: 'Exam scheduling, marks entry, and result card PDF generation.',
        features: ['Exam scheduling', 'Subject-wise marks entry', 'Report card PDF', 'Result SMS to parents', 'Class topper reports'],
    },
    library: {
        name: 'Library Management',
        icon: '📚',
        desc: 'Book catalog, issue/return tracking, and overdue management.',
        features: ['Book catalog management', 'Issue & return tracking', 'Overdue alerts', 'Borrowing history'],
    },
    hr: {
        name: 'HR & Payroll',
        icon: '💼',
        desc: 'Staff salary, attendance, and leave management.',
        features: ['Salary slip PDF generation', 'Staff attendance tracking', 'Leave management', 'PF/ESI calculation'],
    },
    transport: {
        name: 'Transport Tracking',
        icon: '🚌',
        desc: 'Route management, GPS tracking, and transport fees.',
        features: ['Route & stop management', 'GPS live tracking', 'Transport fee collection', 'Parent notifications'],
    },
    website: {
        name: 'School Website',
        icon: '🌐',
        desc: 'Create your school website with 3 professional templates.',
        features: ['3 premium templates', 'Online admission form', 'Gallery & news section', 'Mobile-friendly design'],
    },
    notices: {
        name: 'Notice Board',
        icon: '📢',
        desc: 'Share school notices and announcements with everyone.',
        features: ['Post notices', 'SMS blast to parents', 'Role-based notices', 'Notice history'],
    },
    teachers: {
        name: 'Teacher Portal',
        icon: '👨‍🏫',
        desc: 'Teacher login, attendance marking, and marks entry.',
        features: ['Teacher dashboard', 'Class attendance marking', 'Marks entry', 'Notice posting'],
    },
    reports: {
        name: 'Advanced Reports',
        icon: '📊',
        desc: 'Detailed analytics with Excel/PDF export.',
        features: ['Fee collection reports', 'Attendance analytics', 'Result analysis', 'Excel & PDF export'],
    },
    certificates: {
        name: 'Certificates',
        icon: '🏆',
        desc: 'Issue digital certificates with unique verification codes.',
        features: ['Custom certificate templates', 'Bulk issue', 'QR code verification', 'Download & print'],
    },
    homework: {
        name: 'Homework',
        icon: '📝',
        desc: 'Assign, submit, and grade homework online.',
        features: ['Online assignments', 'File submissions', 'Grading & feedback', 'Parent notifications'],
    },
}

function findUnlockPlan(moduleKey: string): PlanId {
    const order: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
    for (const planId of order) {
        if (PLANS[planId].modules.includes(moduleKey)) return planId
    }
    return 'enterprise'
}

function getUpgradePlans(currentPlan: string): PlanId[] {
    const order: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
    const idx = order.indexOf(currentPlan as PlanId)
    return order.slice(idx + 1)
}

interface Props {
    moduleKey: string
    currentPlan: string
}

export function LockedModule({ moduleKey, currentPlan }: Props) {
    const info = MODULE_INFO[moduleKey] ?? {
        name: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
        icon: '🔒',
        desc: 'This module is not available in your current plan.',
        features: [],
    }

    const requiredPlanId = findUnlockPlan(moduleKey)
    const requiredPlan = PLANS[requiredPlanId]
    const upgradePlans = getUpgradePlans(currentPlan)
    const currentPlanData = PLANS[currentPlan as PlanId]

    return (
        <div style={{
            minHeight: '72vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
        }}>
            <div style={{ maxWidth: 580, width: '100%' }}>

                {/* Main locked card */}
                <div style={{
                    background: 'var(--color-background-secondary)',
                    border: '1.5px solid var(--color-border-primary)',
                    borderRadius: 20,
                    padding: '40px 36px',
                    textAlign: 'center',
                    marginBottom: 16,
                }}>

                    {/* Lock badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#FEF3C7', border: '1px solid #FDE68A',
                        borderRadius: 99, padding: '4px 12px',
                        fontSize: 12, color: '#92400E', fontWeight: 500,
                        marginBottom: 20,
                    }}>
                        🔒 Not available in your plan
                    </div>

                    {/* Module icon */}
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: `${requiredPlan.color}15`,
                        border: `2px solid ${requiredPlan.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', fontSize: 36,
                    }}>
                        {info.icon}
                    </div>

                    {/* Heading */}
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
                        {info.name}
                    </h2>
                    <p style={{
                        color: 'var(--color-text-secondary)', fontSize: 15,
                        lineHeight: 1.6, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px',
                    }}>
                        {info.desc}
                    </p>

                    {/* Features list */}
                    {info.features.length > 0 && (
                        <div style={{
                            background: 'var(--color-background-primary)',
                            borderRadius: 12, padding: '18px 20px',
                            textAlign: 'left', marginBottom: 24,
                            border: '1px solid var(--color-border-tertiary)',
                        }}>
                            <p style={{
                                fontSize: 11, fontWeight: 600, letterSpacing: '0.6px',
                                color: 'var(--color-text-secondary)', marginBottom: 14,
                                textTransform: 'uppercase',
                            }}>
                                What you'll get:
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                                {info.features.map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        <span style={{
                                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                            background: `${requiredPlan.color}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, color: requiredPlan.color, fontWeight: 700,
                                        }}>✓</span>
                                        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Required plan pill */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: `${requiredPlan.color}10`,
                        border: `1px solid ${requiredPlan.color}30`,
                        borderRadius: 99, padding: '8px 16px',
                        marginBottom: 24, fontSize: 13,
                    }}>
                        <span style={{ fontSize: 16 }}>⚡</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                            Unlocks in {requiredPlan.name} plan
                        </span>
                        <span style={{
                            fontWeight: 700, color: requiredPlan.color,
                            background: `${requiredPlan.color}15`,
                            padding: '2px 8px', borderRadius: 6, fontSize: 12,
                        }}>
                            ₹{requiredPlan.monthlyPrice.toLocaleString('en-IN')}/mo
                        </span>
                    </div>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                            href={`/admin/subscription?highlight=${requiredPlanId}`}
                            style={{
                                padding: '12px 28px', borderRadius: 10,
                                background: requiredPlan.color, color: '#fff',
                                fontWeight: 600, fontSize: 15, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            Upgrade to {requiredPlan.name} →
                        </Link>
                        <Link
                            href="/admin/dashboard"
                            style={{
                                padding: '12px 20px', borderRadius: 10,
                                border: '1.5px solid var(--color-border-primary)',
                                color: 'var(--color-text-secondary)',
                                fontSize: 15, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Current plan info */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--color-background-secondary)',
                    borderRadius: 10, border: '1px solid var(--color-border-tertiary)',
                }}>
                    <div style={{ fontSize: 13 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Current plan: </span>
                        <span style={{
                            fontWeight: 600, color: currentPlanData?.color ?? 'var(--color-text-primary)',
                            textTransform: 'capitalize',
                        }}>
                            {currentPlanData?.name ?? currentPlan}
                        </span>
                        {currentPlanData && (
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                                {' '}· ₹{currentPlanData.monthlyPrice.toLocaleString('en-IN')}/mo
                            </span>
                        )}
                    </div>
                    <Link href="/admin/subscription" style={{
                        fontSize: 13, color: '#4F46E5', textDecoration: 'none', fontWeight: 500,
                    }}>
                        View all plans →
                    </Link>
                </div>

                {/* Upgrade path */}
                {upgradePlans.length > 1 && (
                    <div style={{
                        marginTop: 12, padding: '10px 16px', borderRadius: 10,
                        background: 'var(--color-background-secondary)',
                        border: '1px solid var(--color-border-tertiary)',
                        fontSize: 12, color: 'var(--color-text-secondary)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span>💡</span>
                        <span>
                            Upgrade path:{' '}
                            {[currentPlan, ...upgradePlans].map((p, i, arr) => (
                                <span key={p}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: PLANS[p as PlanId]?.color ?? 'var(--color-text-primary)',
                                        textTransform: 'capitalize',
                                    }}>
                                        {PLANS[p as PlanId]?.name ?? p}
                                    </span>
                                    {i < arr.length - 1 && <span style={{ margin: '0 4px' }}>→</span>}
                                </span>
                            ))}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}