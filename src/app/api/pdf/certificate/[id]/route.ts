// FILE: src/app/api/pdf/certificate/[id]/route.ts
// UPDATED: On-demand certificate PDF generation with franchise support
// Uses enhanced PDF builder with multi-logo support
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { IssuedCertificate, CertificateTemplate } from '@/models/Certificate'
import { School } from '@/models/School'
import { Franchise } from '@/models/Franchise'
import { buildCertificatePdfEnhanced } from '@/lib/pdf-builder-enhanced'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { id } = await params

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
            .select('name logo address phone email accreditations certificateSettings')
            .lean() as any

        // ✅ NEW: Fetch franchise data if applicable
        let franchise: any = null
        if (issued.franchiseId) {
            franchise = await Franchise.findById(issued.franchiseId)
                .select('franchiseName franchiseLogo franchiseAddress city state accreditations certificateSettings')
                .lean() as any
        }

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

        // ✅ NEW: Generate PDF using enhanced builder
        const pdfBuffer = await buildCertificatePdfEnhanced({
            branding: {
                schoolName: school?.name || session.user.schoolName || 'Institution',
                schoolLogo: school?.logo,
                schoolAddress: school?.address,
                schoolPhone: school?.phone,
                schoolEmail: school?.email,
                franchiseName: franchise?.franchiseName,
                franchiseLogo: franchise?.franchiseLogo,
                franchiseAddress: franchise?.franchiseAddress,
                franchiseCity: franchise?.city,
                franchiseState: franchise?.state,
                showParentBranding: franchise?.certificateSettings?.showParentBranding ?? true,
                showFranchiseBranding: franchise?.certificateSettings?.enableOwnBranding ?? true,
            },
            accreditations: {
                parentAffiliations: school?.accreditations?.affiliations || [],
                parentRecognitions: school?.accreditations?.recognitions || [],
                parentRegistrations: school?.accreditations?.registrations || [],
                parentPartnerships: school?.accreditations?.partnerships || [],
                franchiseRegistrations: franchise?.accreditations?.registrations || [],
                franchisePartnerships: franchise?.accreditations?.partnerships || [],
                franchiseAwards: franchise?.accreditations?.awards || [],
                inheritParentAccreditations: franchise?.certificateSettings?.inheritParentAccreditations ?? true,
                showFranchiseAccreditations: franchise?.certificateSettings?.allowIndependentAccreditations ?? true,
            },
            content: {
                certificateType: issued.certificateType.toUpperCase(),
                certificateNumber: issued.certificateNumber,
                title: issued.title,
                recipientName: issued.recipientName,
                content,
                issuedDate: new Date(issued.issuedDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
            },
            verification: {
                verificationCode: issued.verificationCode,
                verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${issued.verificationCode}`,
                enableQRCode: franchise?.certificateSettings?.enableQRCode ?? 
                              school?.certificateSettings?.enableQRCode ?? 
                              true,
                qrCodePosition: franchise?.certificateSettings?.qrCodePosition ?? 
                                school?.certificateSettings?.qrCodePosition ?? 
                                'bottom-right',
                showVerificationURL: school?.certificateSettings?.showVerificationURL ?? true,
            },
            customization: {
                layout: template?.layout || 
                        school?.certificateSettings?.defaultLayout || 
                        'modern',
                signatureLabel: template?.signatureLabel || 'Principal',
                signatureName: franchise?.certificateSettings?.signatureName ?? 
                               school?.certificateSettings?.signatureName,
                signatureDesignation: franchise?.certificateSettings?.signatureDesignation ?? 
                                      school?.certificateSettings?.signatureDesignation ?? 
                                      'Principal',
                signatureImage: franchise?.certificateSettings?.digitalSignatureUrl ?? 
                                school?.certificateSettings?.digitalSignatureUrl,
                enableDigitalSignature: franchise?.certificateSettings?.enableDigitalSignature ?? 
                                        school?.certificateSettings?.enableDigitalSignature ?? 
                                        false,
                watermarkText: school?.certificateSettings?.watermarkText,
                enableWatermark: school?.certificateSettings?.enableWatermark ?? false,
                borderStyle: template?.borderStyle,
            },
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