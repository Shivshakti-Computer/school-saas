// FILE: src/app/api/pdf/reportcard/[resultId]/route.ts
// Report Card PDF generate karo aur return karo
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { generateReportCard } from '@/lib/pdf'

type Params = { params: Promise<{ resultId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { resultId } = await params

  const guard = await apiGuard(req, {
    allowedRoles:    ['admin', 'teacher', 'student', 'parent'],
    rateLimit:       'api',
    requiredModules: ['exams'],
  })
  if (guard instanceof NextResponse) return guard

  try {
    const pdfUrl = await generateReportCard(resultId)

    // Redirect to Cloudinary URL
    return NextResponse.redirect(pdfUrl)

  } catch (err: any) {
    console.error('[REPORT CARD PDF]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate report card' },
      { status: 500 }
    )
  }
}