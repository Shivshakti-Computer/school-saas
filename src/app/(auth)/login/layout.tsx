// FILE: src/app/login/layout.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — VidyaFlow School Management',
  description: 'Login to your VidyaFlow school portal. Admin, Teacher, Student & Parent — all roles login here.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}