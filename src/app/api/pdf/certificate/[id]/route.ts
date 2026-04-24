// FILE: src/app/api/pdf/certificate/[id]/route.ts
// On-demand certificate PDF generation (no storage)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { IssuedCertificate, CertificateTemplate } from '@/models/Certificate'
import { School } from '@/models/School'
import { buildCertificatePdf } from '@/lib/pdf-builder'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }  // ✅ Promise type
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params  // ✅ await params

    try {
        // Fetch issued certificate
        const issued = await IssuedCertificate.findOne({
            _id: id,
            tenantId: session.user.tenantId,
        }).lean() as any

        if (!issued) {
            return NextResponse.json(
                { error: 'Certificate not found' },
                { status: 404 }
            )
        }

        // Check if revoked
        if (issued.status === 'revoked') {
            return NextResponse.json(
                { error: 'Certificate has been revoked' },
                { status: 403 }
            )
        }

        // Fetch template
        const template = await CertificateTemplate.findById(issued.templateId)
            .lean() as any

        // Fetch school details
        const school = await School.findById(session.user.tenantId)
            .select('name logo')
            .lean() as any

        // Build content
        let content = template?.template || ''

        const variableMap: Record<string, string> = {
            recipientName: issued.recipientName,
            class: issued.class || '',
            section: issued.section || '',
            academicYear: issued.academicYear || '',
            courseName: issued.courseName || '',
            ...issued.customData,
        }

        Object.entries(variableMap).forEach(([key, val]) => {
            content = content.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                String(val)
            )
        })

        // Generate PDF
        const pdfBuffer = await buildCertificatePdf({
            schoolName: school?.name || session.user.schoolName || 'Institution',
            schoolLogo: school?.logo,
            certificateType: issued.certificateType.toUpperCase(),
            certificateNumber: issued.certificateNumber,
            title: issued.title,
            recipientName: issued.recipientName,
            content,
            verificationCode: issued.verificationCode,
            layout: template?.layout || 'modern',
            signatureLabel: template?.signatureLabel || 'Principal',
        })

        // Return PDF
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${issued.certificateNumber}.pdf"`,
                'Cache-Control': 'public, max-age=3600',
            },
        })
    } catch (err: any) {
        console.error('[Certificate PDF]', err)
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: err.message },
            { status: 500 }
        )
    }
}