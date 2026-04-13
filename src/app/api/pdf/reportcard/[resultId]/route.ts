// src/app/api/pdf/reportcard/[resultId]/route.ts
// REPLACED: No Cloudinary, direct buffer stream
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { generateReportCardBuffer } from '@/lib/pdf'

type Params = { params: Promise<{ resultId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { resultId } = await params

  const guard = await apiGuard(req, {
    allowedRoles: ['admin', 'teacher', 'student', 'parent'],
    rateLimit: 'api',
    requiredModules: ['exams'],
  })
  if (guard instanceof NextResponse) return guard

  try {
    const buffer = await generateReportCardBuffer(resultId)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="report-card-${resultId}.pdf"`,
        'Content-Length': String(buffer.length),
        // 5 min cache — same result ke liye dobara generate na ho
        'Cache-Control': 'private, max-age=300',
      },
    })

  } catch (err: any) {
    console.error('[REPORT CARD PDF]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate report card' },
      { status: 500 }
    )
  }
}