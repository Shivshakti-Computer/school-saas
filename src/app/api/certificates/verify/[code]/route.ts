// FILE: src/app/api/certificates/verify/[code]/route.ts
// PUBLIC API — No auth required
// Returns certificate details for public verification
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { IssuedCertificate } from '@/models/Certificate'
import { School } from '@/models/School'
import { verifyCertificateSchema } from '@/lib/validators/certificate'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }  // ✅ Promise type
) {
    await connectDB()

    const { code } = await params  // ✅ await params

    // Validate code format
    try {
        verifyCertificateSchema.parse({ code })
    } catch {
        return NextResponse.json(
            { error: 'Invalid verification code format' },
            { status: 400 }
        )
    }

    try {
        // Fetch certificate
        const cert = await IssuedCertificate.findOne({
            verificationCode: code,
        }).lean() as any

        if (!cert) {
            return NextResponse.json(
                { error: 'Certificate not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Fetch school details
        const school = await School.findById(cert.tenantId)
            .select('name subdomain logo accreditations institutionType')
            .lean() as any

        if (!school) {
            return NextResponse.json(
                { error: 'Institution not found' },
                { status: 404 }
            )
        }

        // Build response (public-safe data only)
        const response = {
            certificate: {
                number: cert.certificateNumber,
                type: cert.certificateType,
                title: cert.title,
                recipientName: cert.recipientName,
                recipientType: cert.recipientType,
                issuedDate: cert.issuedDate,
                status: cert.status,
                revokedAt: cert.revokedAt,
                revokedReason: cert.revokedReason,
                verificationCode: cert.verificationCode,
                class: cert.class,
                section: cert.section,
                academicYear: cert.academicYear,
                courseName: cert.courseName,
            },
            institution: {
                name: school.name,
                subdomain: school.subdomain,
                logo: school.logo,
                institutionType: school.institutionType,
                accreditations: school.accreditations || {
                    affiliations: [],
                    registrations: [],
                    recognitions: [],
                },
            },
            verifiedAt: new Date().toISOString(),
        }

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=600',
            },
        })
    } catch (err: any) {
        console.error('[Certificate Verify]', err)
        return NextResponse.json(
            { error: 'Verification failed', details: err.message },
            { status: 500 }
        )
    }
}