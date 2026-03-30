// FILE: src/app/register/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register Your School — Skolify',
  description: 'Register your school on Skolify. 14-day free trial, no credit card required. Start managing your school in minutes.',
  robots: { index: true, follow: true },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}