// FILE: src/app/(public)/features/page.tsx

import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { ModulesShowcase } from '@/components/marketing/ModulesShowcase'
import { CTA } from '@/components/marketing/CTA'
import { Container } from '@/components/marketing/Container'
import type { Metadata } from 'next'
import { PlatformFeatures } from '@/components/marketing/PlatformFeatures'

export const metadata: Metadata = {
    title: 'Features — All-in-One School Management Platform',
    description:
        'Explore 22+ modules — student management, attendance, online fees, exams, website builder, PWA app, parent portal & more. Built for Indian schools by Shivshakti Computer Academy.',
    alternates: {
        canonical: '/features',
    },
}

export default function FeaturesPage() {
    return (
        <>
            {/* ─── Page Hero (different from FeatureGrid's internal title) ─── */}
            <section className="relative pt-24 pb-10 overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-brand/[0.05] blur-[120px] rounded-full" />
                    <div className="absolute inset-0 dot-pattern opacity-30" />
                </div>

                <Container>
                    <div className="relative text-center max-w-3xl mx-auto">
                        <div className="badge-brand mx-auto mb-5">
                            ✦ Complete Platform Overview
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            Built for{' '}
                            <span className="gradient-text">real school workflows</span>
                        </h1>
                        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                            Fast admin operations, clean teacher tools, simple parent & student
                            experience. 22+ modules, 4 user roles, one connected platform.
                        </p>

                        {/* Quick stats */}
                        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
                            {[
                                { value: '22+', label: 'Modules' },
                                { value: '4', label: 'User Roles' },
                                { value: '₹499', label: 'Starting/mo' },
                                { value: '0', label: 'Coding Needed' },
                            ].map(stat => (
                                <div key={stat.label} className="flex items-center gap-2">
                                    <span className="text-lg font-extrabold text-white">{stat.value}</span>
                                    <span className="text-slate-500">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </section>

            {/* ─── Core Features ─── */}
            <FeatureGrid />

            {/* ─── All Modules ─── */}
            <ModulesShowcase />

            {/* ─── Website Builder + PWA + Roles ─── */}
            <PlatformFeatures />

            {/* ─── CTA ─── */}
            <CTA />
        </>
    )
}