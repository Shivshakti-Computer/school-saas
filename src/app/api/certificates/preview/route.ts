// FILE: src/app/api/certificates/preview/route.ts
// Generate preview certificate PDF (no database save)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildCertificatePdfEnhanced } from '@/lib/pdf-builder-enhanced'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.branding || !body.content || !body.verification || !body.customization) {
      return NextResponse.json(
        { error: 'Missing required preview data' },
        { status: 400 }
      )
    }

    // Generate preview PDF (no verification URL generation)
    const pdfBuffer = await buildCertificatePdfEnhanced({
      branding: {
        ...body.branding,
        showParentBranding: body.branding.showParentBranding ?? true,
        showFranchiseBranding: body.branding.showFranchiseBranding ?? false,
      },
      accreditations: {
        ...body.accreditations,
        inheritParentAccreditations:
          body.accreditations?.inheritParentAccreditations ?? true,
        showFranchiseAccreditations:
          body.accreditations?.showFranchiseAccreditations ?? false,
      },
      content: body.content,
      verification: {
        ...body.verification,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${body.verification.verificationCode}`,
      },
      customization: {
        ...body.customization,
        borderStyle: body.customization.borderStyle || 'decorative',
      },
    })

    // Return PDF with cache headers for preview
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="certificate-preview.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error('[Certificate Preview API]', err)
    return NextResponse.json(
      { error: 'Failed to generate preview', details: err.message },
      { status: 500 }
    )
  }
}