// FILE: src/app/api/certificates/verify/[code]/route.ts
// PUBLIC API — No auth required
// UPDATED: Returns franchise details for public verification
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { IssuedCertificate } from '@/models/Certificate'
import { School } from '@/models/School'
import { Franchise } from '@/models/Franchise'
import { verifyCertificateSchema } from '@/lib/validators/certificate'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    await connectDB()

    const { code } = await params

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
        // Fetch certificate with tenant info
        const cert = await IssuedCertificate.findOne({
            verificationCode: code,
        })
            .select(
                'tenantId franchiseId certificateNumber certificateType title recipientName recipientType issuedDate status revokedAt revokedReason verificationCode class section academicYear courseName'
            )
            .lean() as any

        if (!cert) {
            return NextResponse.json(
                { error: 'Certificate not found', code: 'NOT_FOUND' },
                { status: 404 }
            )
        }

        // Check if certificate is revoked
        if (cert.status === 'revoked') {
            return NextResponse.json(
                {
                    error: 'Certificate has been revoked',
                    code: 'REVOKED',
                    revokedAt: cert.revokedAt,
                    revokedReason: cert.revokedReason,
                    certificate: {
                        number: cert.certificateNumber,
                        type: cert.certificateType,
                        title: cert.title,
                        recipientName: cert.recipientName,
                        issuedDate: cert.issuedDate,
                    },
                },
                { status: 403 }
            )
        }

        // Fetch school details
        const school = await School.findById(cert.tenantId)
            .select('name subdomain logo institutionType website address phone email accreditations')
            .lean() as any

        if (!school) {
            return NextResponse.json(
                { error: 'Institution not found' },
                { status: 404 }
            )
        }

        // ✅ NEW: Fetch franchise details if applicable
        let franchise: any = null
        if (cert.franchiseId) {
            franchise = await Franchise.findById(cert.franchiseId)
                .select('franchiseName franchiseLogo franchiseAddress city state accreditations')
                .lean() as any
        }

        // ✅ UPDATED: Build comprehensive accreditations list
        const accreditations: any = {
            affiliations: [],
            recognitions: [],
            registrations: [],
            partnerships: [],
        }

        // Add school accreditations
        if (school.accreditations) {
            accreditations.affiliations = school.accreditations.affiliations || []
            accreditations.recognitions = school.accreditations.recognitions || []
            accreditations.registrations = school.accreditations.registrations || []
            accreditations.partnerships = school.accreditations.partnerships || []
        }

        // Add franchise accreditations (if any)
        if (franchise?.accreditations) {
            if (franchise.accreditations.registrations?.length > 0) {
                accreditations.registrations = [
                    ...accreditations.registrations,
                    ...franchise.accreditations.registrations.map((r: any) => ({
                        ...r,
                        source: 'franchise'
                    }))
                ]
            }
            if (franchise.accreditations.partnerships?.length > 0) {
                accreditations.partnerships = [
                    ...accreditations.partnerships,
                    ...franchise.accreditations.partnerships.map((p: any) => ({
                        ...p,
                        source: 'franchise'
                    }))
                ]
            }
            if (franchise.accreditations.awards?.length > 0) {
                accreditations.awards = franchise.accreditations.awards
            }
        }

        // Build response (public-safe data only)
        const response = {
            verified: true,
            certificate: {
                number: cert.certificateNumber,
                type: cert.certificateType,
                title: cert.title,
                recipientName: cert.recipientName,
                recipientType: cert.recipientType,
                issuedDate: cert.issuedDate,
                status: cert.status,
                verificationCode: cert.verificationCode,
                class: cert.class || undefined,
                section: cert.section || undefined,
                academicYear: cert.academicYear || undefined,
                courseName: cert.courseName || undefined,
            },
            institution: {
                name: school.name,
                subdomain: school.subdomain,
                logo: school.logo || undefined,
                institutionType: school.institutionType || 'school',
                address: school.address || undefined,
                phone: school.phone || undefined,
                email: school.email || undefined,
                accreditations,
            },
            // ✅ NEW: Franchise details (if applicable)
            franchise: franchise ? {
                name: franchise.franchiseName,
                logo: franchise.franchiseLogo || undefined,
                address: franchise.franchiseAddress,
                city: franchise.city,
                state: franchise.state,
            } : undefined,
            verifiedAt: new Date().toISOString(),
        }

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=600',
                'Access-Control-Allow-Origin': '*',
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