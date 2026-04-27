// FILE: src/app/(dashboard)/admin/courses/page.tsx
// Courses Dashboard Page
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CourseList } from '@/components/courses/CourseList'
import { Alert } from '@/components/ui'
import { BookOpen } from 'lucide-react'

export default function CoursesPage() {
  const { data: session } = useSession()
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const institutionType = (session?.user as any)?.institutionType || 'academy'

  // Access check
  if (institutionType === 'school') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
          >
            <BookOpen size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Module Not Available
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Courses module is only available for academies and coaching institutes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      <CourseList
        institutionType={institutionType as 'academy' | 'coaching'}
        onSuccess={setSuccessMsg}
        onError={setErrorMsg}
      />
    </div>
  )
}