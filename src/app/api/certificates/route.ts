// FILE: src/app/api/certificates/route.ts
// PRODUCTION READY — Certificate templates + issue + bulk issue
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { CertificateTemplate, IssuedCertificate } from '@/models/Certificate'
import { Student } from '@/models/Student'
import { Staff } from '@/models/Staff'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { logAudit } from '@/lib/audit'
import { uploadBuffer } from '@/lib/storage'
import { updateStorageUsage, checkStorageLimit } from '@/lib/storageAddon'
import { buildCertificatePdf } from '@/lib/pdf-builder'
import type { PlanId } from '@/config/pricing'
import {
    createTemplateSchema,
    updateTemplateSchema,
    issueCertificateSchema,
    bulkIssueCertificateSchema,
    savePdfSchema,
    certificateFilterSchema,
} from '@/lib/validators/certificate'
import { SchoolSettings } from '@/models/SchoolSettings'

// ─────────────────────────────────────────────────────────
// ✅ TRIAL-SAFE MODULE CHECK
// ─────────────────────────────────────────────────────────
function isCertificateModuleAllowed(guard: {
    subscriptionStatus: string
    session: any
}): boolean {
    const { subscriptionStatus, session } = guard

    if (subscriptionStatus === 'trial') return true

    const modules: string[] = session.user.modules ?? []
    return modules.includes('certificates')
}

// ─────────────────────────────────────────────────────────
// Helper: Generate unique certificate number
// ─────────────────────────────────────────────────────────
async function generateCertificateNumber(
    tenantId: string,
    certType: string
): Promise<string> {
    const year = new Date().getFullYear()
    const typeCode = certType.toUpperCase().slice(0, 4) // MERI, PART, ACHI, etc.

    // Fetch prefix from settings
    const settings = await SchoolSettings.findOne({ tenantId })
        .select('modules.certificates')
        .lean() as any

    let prefix = ''

    if (settings?.modules?.certificates?.autoGeneratePrefix) {
        // Auto-generate from subdomain
        const school = await School.findById(tenantId)
            .select('subdomain')
            .lean() as any
        prefix = school?.subdomain?.slice(0, 4).toUpperCase() || 'INST'
    } else {
        // Use custom prefix
        prefix = settings?.modules?.certificates?.prefix?.toUpperCase() || 'INST'
    }

    // Ensure prefix is clean (alphanumeric only)
    prefix = prefix.replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'INST'

    // Get sequence number
    const count = await IssuedCertificate.countDocuments({
        tenantId,
        certificateType: certType,
    })

    return `${prefix}-${typeCode}-${year}-${String(count + 1).padStart(4, '0')}`
}


// ─────────────────────────────────────────────────────────
// Helper: Generate verification code with prefix
// ─────────────────────────────────────────────────────────
async function generateVerificationCode(tenantId: string): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let randomPart = ''

    for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Fetch prefix from settings (same logic as certificate number)
    const settings = await SchoolSettings.findOne({ tenantId })
        .select('modules.certificates')
        .lean() as any

    let prefix = ''

    if (settings?.modules?.certificates?.autoGeneratePrefix) {
        const school = await School.findById(tenantId)
            .select('subdomain')
            .lean() as any
        prefix = school?.subdomain?.slice(0, 4).toUpperCase() || 'INST'
    } else {
        prefix = settings?.modules?.certificates?.prefix?.toUpperCase() || 'INST'
    }

    // Clean prefix
    prefix = prefix.replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'INST'

    // Return branded verification code
    return `${prefix}-CERT-${randomPart}`
}

// ─────────────────────────────────────────────────────────
// GET — Fetch Templates or Issued Certificates
// ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        rateLimit: 'read',
    })
    if (guard instanceof NextResponse) return guard

    if (!isCertificateModuleAllowed(guard)) {
        return NextResponse.json(
            {
                error: 'Certificates module is not available in your plan',
                code: 'MODULE_BLOCKED',
                upgrade: '/admin/subscription',
            },
            { status: 403 }
        )
    }

    const { session } = guard
    await connectDB()

    const { searchParams } = new URL(req.url)

    try {
        const filters = certificateFilterSchema.parse({
            type: searchParams.get('type') || 'templates',
            recipientType: searchParams.get('recipientType'),
            recipientId: searchParams.get('recipientId'),
            certificateType: searchParams.get('certificateType'),
            status: searchParams.get('status'),
            search: searchParams.get('search'),
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
            sortBy: searchParams.get('sortBy'),
            sortOrder: searchParams.get('sortOrder'),
        })

        // ── TEMPLATES ──
        if (filters.type === 'templates') {
            const query: Record<string, any> = {
                tenantId: session.user.tenantId,
            }

            if (filters.search) {
                query.$or = [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { type: { $regex: filters.search, $options: 'i' } },
                ]
            }

            if (filters.certificateType) {
                query.type = filters.certificateType
            }

            const templates = await CertificateTemplate.find(query)
                .sort({ [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 })
                .skip((filters.page - 1) * filters.limit)
                .limit(filters.limit)
                .lean()

            const total = await CertificateTemplate.countDocuments(query)

            return NextResponse.json({
                templates,
                pagination: {
                    total,
                    page: filters.page,
                    limit: filters.limit,
                    totalPages: Math.ceil(total / filters.limit),
                },
            })
        }

        // ── ISSUED CERTIFICATES ──
        const query: Record<string, any> = {
            tenantId: session.user.tenantId,
        }

        if (filters.recipientType) query.recipientType = filters.recipientType
        if (filters.recipientId) query.recipientId = filters.recipientId
        if (filters.certificateType) query.certificateType = filters.certificateType
        if (filters.status) query.status = filters.status

        if (filters.search) {
            query.$or = [
                { recipientName: { $regex: filters.search, $options: 'i' } },
                { certificateNumber: { $regex: filters.search, $options: 'i' } },
                { title: { $regex: filters.search, $options: 'i' } },
            ]
        }

        const issued = await IssuedCertificate.find(query)
            .sort({ [filters.sortBy]: filters.sortOrder === 'asc' ? 1 : -1 })
            .skip((filters.page - 1) * filters.limit)
            .limit(filters.limit)
            .lean()

        const total = await IssuedCertificate.countDocuments(query)

        return NextResponse.json({
            issued,
            pagination: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
            },
        })
    } catch (err: any) {
        console.error('[Certificates GET]', err)

        if (err.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Invalid request parameters', details: err.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to fetch certificates' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────
// POST — Create Template / Issue / Bulk Issue / Save PDF
// ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<any>(req, {
        allowedRoles: ['admin', 'staff'],
        rateLimit: 'mutation',
        auditAction: 'CREATE',
        auditResource: 'Certificate',
    })
    if (guard instanceof NextResponse) return guard

    if (!isCertificateModuleAllowed(guard)) {
        return NextResponse.json(
            {
                error: 'Certificates module is not available in your plan',
                code: 'MODULE_BLOCKED',
            },
            { status: 403 }
        )
    }

    const { session, body, clientInfo } = guard
    await connectDB()

    const action = body.action

    try {
        // ══════════════════════════════════════════════════════════
        // ACTION: create_template
        // ══════════════════════════════════════════════════════════
        if (action === 'create_template') {
            const validated = createTemplateSchema.parse(body)

            const school = await School.findById(session.user.tenantId)
                .select('institutionType')
                .lean() as any

            const template = await CertificateTemplate.create({
                ...validated,
                tenantId: session.user.tenantId,
                institutionType: school?.institutionType || 'school',
                createdBy: session.user.id,
            })

            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: session.user.role,
                action: 'CREATE',
                resource: 'Certificate',
                resourceId: template._id.toString(),
                description: `Certificate template created: ${validated.name}`,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                status: 'SUCCESS',
            })

            return NextResponse.json({ template }, { status: 201 })
        }

        // ══════════════════════════════════════════════════════════
        // ACTION: issue (Single Certificate)
        // ══════════════════════════════════════════════════════════
        if (action === 'issue') {
            const validated = issueCertificateSchema.parse(body)

            // Fetch template
            const template = await CertificateTemplate.findOne({
                _id: validated.templateId,
                tenantId: session.user.tenantId,
                isActive: true,
            }).lean() as any

            if (!template) {
                return NextResponse.json(
                    { error: 'Template not found or inactive' },
                    { status: 404 }
                )
            }

            // Fetch recipient
            let recipient: any
            let recipientName = ''
            let recipientIdentifier = ''

            if (validated.recipientType === 'student') {
                const student = await Student.findOne({
                    _id: validated.recipientId,
                    tenantId: session.user.tenantId,
                    status: 'active',
                }).lean() as any

                if (!student) {
                    return NextResponse.json(
                        { error: 'Student not found' },
                        { status: 404 }
                    )
                }

                const user = await User.findById(student.userId)
                    .select('name')
                    .lean() as any

                recipient = student
                recipientName = user?.name || ''
                recipientIdentifier = student.admissionNo
            } else {
                // Staff
                const staff = await Staff.findOne({
                    _id: validated.recipientId,
                    tenantId: session.user.tenantId,
                    status: 'active',
                }).lean() as any

                if (!staff) {
                    return NextResponse.json(
                        { error: 'Staff member not found' },
                        { status: 404 }
                    )
                }

                recipient = staff
                recipientName = staff.fullName
                recipientIdentifier = staff.employeeId
            }

            // Generate certificate number & verification code
            const certificateNumber = await generateCertificateNumber(
                session.user.tenantId,
                template.type
            )
            const verificationCode = await generateVerificationCode(session.user.tenantId)

            // Create issued certificate record
            const issued = await IssuedCertificate.create({
                tenantId: session.user.tenantId,
                templateId: template._id,
                recipientType: validated.recipientType,
                recipientId: validated.recipientId,
                recipientName,
                recipientIdentifier,
                certificateType: template.type,
                certificateNumber,
                title: validated.title,
                courseId: validated.courseId,
                courseName: validated.courseName,
                batchId: validated.batchId,
                class: validated.class,
                section: validated.section,
                academicYear: validated.academicYear,
                customData: validated.customData,
                issuedBy: session.user.id,
                issuedByName: session.user.name || 'Unknown',
                verificationCode,
                status: 'issued',
            })

            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: session.user.role,
                action: 'CREATE',
                resource: 'Certificate',
                resourceId: issued._id.toString(),
                description: `Certificate issued: ${certificateNumber} to ${recipientName}`,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                status: 'SUCCESS',
            })

            return NextResponse.json({
                issued,
                certificateNumber,
                verificationCode,
            }, { status: 201 })
        }

        // ══════════════════════════════════════════════════════════
        // ACTION: bulk_issue
        // ══════════════════════════════════════════════════════════
        if (action === 'bulk_issue') {
            const validated = bulkIssueCertificateSchema.parse(body)

            const template = await CertificateTemplate.findOne({
                _id: validated.templateId,
                tenantId: session.user.tenantId,
                isActive: true,
            }).lean() as any

            if (!template) {
                return NextResponse.json(
                    { error: 'Template not found' },
                    { status: 404 }
                )
            }

            let recipients: any[] = []

            // Build recipient query
            if (validated.recipientType === 'student') {
                const query: Record<string, any> = {
                    tenantId: session.user.tenantId,
                    status: 'active',
                }

                if (validated.recipientIds?.length) {
                    query._id = { $in: validated.recipientIds }
                } else {
                    if (validated.class) query.class = validated.class
                    if (validated.section) query.section = validated.section
                }

                recipients = await Student.find(query).lean() as any[]
            } else {
                // Staff
                const query: Record<string, any> = {
                    tenantId: session.user.tenantId,
                    status: 'active',
                }

                if (validated.recipientIds?.length) {
                    query._id = { $in: validated.recipientIds }
                }

                recipients = await Staff.find(query).lean() as any[]
            }

            if (recipients.length === 0) {
                return NextResponse.json(
                    { error: 'No recipients found matching criteria' },
                    { status: 400 }
                )
            }

            // Issue certificates in bulk
            const issued: any[] = []

            for (const recipient of recipients) {
                let recipientName = ''
                let recipientIdentifier = ''

                if (validated.recipientType === 'student') {
                    const user = await User.findById(recipient.userId)
                        .select('name')
                        .lean() as any
                    recipientName = user?.name || ''
                    recipientIdentifier = recipient.admissionNo
                } else {
                    recipientName = recipient.fullName
                    recipientIdentifier = recipient.employeeId
                }

                const certificateNumber = await generateCertificateNumber(
                    session.user.tenantId,
                    template.type
                )
                const verificationCode = await generateVerificationCode(session.user.tenantId)

                // Replace {{recipientName}} in title template
                const title = validated.titleTemplate.replace(
                    /\{\{recipientName\}\}/g,
                    recipientName
                )

                const cert = await IssuedCertificate.create({
                    tenantId: session.user.tenantId,
                    templateId: template._id,
                    recipientType: validated.recipientType,
                    recipientId: recipient._id,
                    recipientName,
                    recipientIdentifier,
                    certificateType: template.type,
                    certificateNumber,
                    title,
                    class: recipient.class,
                    section: recipient.section,
                    academicYear: recipient.academicYear,
                    customData: validated.commonData,
                    issuedBy: session.user.id,
                    issuedByName: session.user.name || 'Unknown',
                    verificationCode,
                    status: 'issued',
                })

                issued.push(cert)
            }

            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: session.user.role,
                action: 'CREATE',
                resource: 'Certificate',
                description: `Bulk certificate issue: ${issued.length} certificates issued`,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                status: 'SUCCESS',
            })

            return NextResponse.json({
                count: issued.length,
                certificates: issued,
            }, { status: 201 })
        }

        // ══════════════════════════════════════════════════════════
        // ACTION: save_pdf
        // ══════════════════════════════════════════════════════════
        if (action === 'save_pdf') {
            const validated = savePdfSchema.parse(body)

            const issued = await IssuedCertificate.findOne({
                _id: validated.issuedCertId,
                tenantId: session.user.tenantId,
            }) as any

            if (!issued) {
                return NextResponse.json(
                    { error: 'Certificate not found' },
                    { status: 404 }
                )
            }

            if (issued.savedToStorage && issued.pdfUrl) {
                return NextResponse.json({
                    pdfUrl: issued.pdfUrl,
                    message: 'Already saved',
                })
            }

            // Storage limit check
            const school = await School.findById(session.user.tenantId)
                .select('plan storageAddon')
                .lean() as any

            const estimatedPdfSize = 120 * 1024 // ~120KB

            const storageCheck = await checkStorageLimit(
                session.user.tenantId,
                (school?.plan ?? 'starter') as PlanId,
                estimatedPdfSize,
                school?.storageAddon
            )

            if (!storageCheck.canUpload) {
                return NextResponse.json(
                    {
                        error: storageCheck.message ?? 'Storage limit exceeded',
                        code: 'STORAGE_LIMIT',
                        upgrade: '/admin/subscription',
                    },
                    { status: 413 }
                )
            }

            // Fetch template & school details
            const template = await CertificateTemplate.findById(issued.templateId)
                .lean() as any

            const schoolData = await School.findById(session.user.tenantId)
                .select('name logo')
                .lean() as any

            // Build content from template
            let content = template?.template || ''

            // Replace variables
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
                schoolName: schoolData?.name || session.user.schoolName || 'Institution',
                schoolLogo: schoolData?.logo,
                certificateType: issued.certificateType.toUpperCase(),
                certificateNumber: issued.certificateNumber,
                title: issued.title,
                recipientName: issued.recipientName,
                content,
                verificationCode: issued.verificationCode,
                layout: template?.layout || 'modern',
                signatureLabel: template?.signatureLabel || 'Principal',
            })

            // Upload to R2
            const filename = `${issued.certificateNumber}_${issued.recipientName.replace(/\s+/g, '_')}.pdf`
            const pdfUrl = await uploadBuffer(
                pdfBuffer,
                filename,
                'pdf',
                session.user.tenantId
            )

            // Update storage usage
            await updateStorageUsage(session.user.tenantId, pdfBuffer.length)

            // Update certificate record
            issued.pdfUrl = pdfUrl
            issued.savedToStorage = true
            await issued.save()

            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: session.user.role,
                action: 'UPDATE',
                resource: 'Certificate',
                resourceId: issued._id.toString(),
                description: `Certificate PDF saved: ${issued.certificateNumber} (${(pdfBuffer.length / 1024).toFixed(1)}KB)`,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                status: 'SUCCESS',
            })

            return NextResponse.json({
                pdfUrl,
                size: pdfBuffer.length,
                message: 'PDF saved successfully',
            })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
    } catch (err: any) {
        console.error('[Certificates POST]', err)

        if (err.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: err.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to process request', details: err.message },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────
// PATCH — Update Template
// ─────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
    const guard = await apiGuardWithBody<any>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'UPDATE',
        auditResource: 'Certificate',
    })
    if (guard instanceof NextResponse) return guard

    if (!isCertificateModuleAllowed(guard)) {
        return NextResponse.json(
            { error: 'Module not available', code: 'MODULE_BLOCKED' },
            { status: 403 }
        )
    }

    const { session, body, clientInfo } = guard
    await connectDB()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json(
            { error: 'Template ID required' },
            { status: 400 }
        )
    }

    try {
        const validated = updateTemplateSchema.parse(body)

        const template = await CertificateTemplate.findOneAndUpdate(
            {
                _id: id,
                tenantId: session.user.tenantId,
            },
            { $set: validated },
            { new: true }
        )

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            )
        }

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Certificate',
            resourceId: id,
            description: `Certificate template updated: ${template.name}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ template })
    } catch (err: any) {
        console.error('[Certificates PATCH]', err)

        if (err.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: err.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────
// DELETE — Delete Template or Revoke Certificate
// ─────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const guard = await apiGuardWithBody<any>(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'DELETE',
        auditResource: 'Certificate',
    })
    if (guard instanceof NextResponse) return guard

    if (!isCertificateModuleAllowed(guard)) {
        return NextResponse.json(
            { error: 'Module not available' },
            { status: 403 }
        )
    }

    const { session, body, clientInfo } = guard
    await connectDB()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') || 'template'

    if (!id) {
        return NextResponse.json(
            { error: 'ID required' },
            { status: 400 }
        )
    }

    try {
        if (type === 'template') {
            const template = await CertificateTemplate.findOneAndDelete({
                _id: id,
                tenantId: session.user.tenantId,
            })

            if (!template) {
                return NextResponse.json(
                    { error: 'Template not found' },
                    { status: 404 }
                )
            }

            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: session.user.role,
                action: 'DELETE',
                resource: 'Certificate',
                resourceId: id,
                description: `Certificate template deleted: ${template.name}`,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                status: 'SUCCESS',
            })

            return NextResponse.json({ success: true })
        }

        // Revoke certificate
        const { reason } = body

        if (!reason?.trim()) {
            return NextResponse.json(
                { error: 'Revocation reason required' },
                { status: 400 }
            )
        }

        const cert = await IssuedCertificate.findOneAndUpdate(
            {
                _id: id,
                tenantId: session.user.tenantId,
            },
            {
                $set: {
                    status: 'revoked',
                    revokedAt: new Date(),
                    revokedReason: reason,
                },
            },
            { new: true }
        )

        if (!cert) {
            return NextResponse.json(
                { error: 'Certificate not found' },
                { status: 404 }
            )
        }

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'UPDATE',
            resource: 'Certificate',
            resourceId: id,
            description: `Certificate revoked: ${cert.certificateNumber} - ${reason}`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ success: true, certificate: cert })
    } catch (err: any) {
        console.error('[Certificates DELETE]', err)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}