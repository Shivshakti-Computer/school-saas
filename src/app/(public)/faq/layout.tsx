// FILE: src/app/(public)/faq/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'FAQ — Frequently Asked Questions',
    description:
        'Frequently asked questions about Skolify — pricing, features, trial, data security, multi-tenant support, PWA app, and more.',
    alternates: {
        canonical: '/faq',
    },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}