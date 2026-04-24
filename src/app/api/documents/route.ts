// FILE: src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { DocumentTemplate, IssuedDocument } from '@/models/Document'
import { Student } from '@/models/Student'
import { User } from '@/models/User'
import { School } from '@/models/School'
import { logAudit } from '@/lib/audit'
import { uploadBuffer } from '@/lib/storage'
import { updateStorageUsage, checkStorageLimit } from '@/lib/storageAddon'
import type { PlanId } from '@/config/pricing'
import { buildDocumentPdf } from '@/lib/pdf-builder'

// ─────────────────────────────────────────────────────────
// ✅ TRIAL-SAFE MODULE CHECK
// Pattern: Existing working modules se inspired
// ─────────────────────────────────────────────────────────
function isDocumentModuleAllowed(guard: {
    subscriptionStatus: string
    session: any
}): boolean {
    const { subscriptionStatus, session } = guard

    // Trial → All modules allowed (bypass)
    if (subscriptionStatus === 'trial') return true

    // Active/Scheduled → Check session.user.modules (already plan-filtered)
    const modules: string[] = session.user.modules ?? []
    return modules.includes('documents')
}

// ─────────────────────────────────────────────────────────
// GET — Templates + Issued Documents
// ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    // ✅ NO requiredModules in apiGuard
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        rateLimit: 'read',
    })
    if (guard instanceof NextResponse) return guard

    // ✅ Manual module check (trial-safe)
    if (!isDocumentModuleAllowed(guard)) {
        return NextResponse.json(
            {
                error: 'Documents module is not available in your plan',
                code: 'MODULE_BLOCKED',
                upgrade: '/admin/subscription',
            },
            { status: 403 }
        )
    }

    const { session } = guard
    await connectDB()

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'templates'
    const studentId = searchParams.get('studentId')

    try {
        if (type === 'issued') {
            const filter: Record<string, any> = {
                tenantId: session.user.tenantId,
            }
            if (studentId) filter.studentId = studentId

            const issued = await IssuedDocument.find(filter)
                .sort({ createdAt: -1 })
                .limit(100)
                .lean()

            return NextResponse.json({ issued })
        }

        // Default: templates
        const templates = await DocumentTemplate.find({
            tenantId: session.user.tenantId,
        })
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({ templates })
    } catch (err) {
        console.error('[Documents GET]', err)
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        )
    }
}

// ─────────────────────────────────────────────────────────
// POST — Create Template / Generate Document / Save PDF
// ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody<any>(req, {
        allowedRoles: ['admin', 'staff'],
        rateLimit: 'mutation',
        auditAction: 'CREATE',
        auditResource: 'Document',
    })
    if (guard instanceof NextResponse) return guard

    if (!isDocumentModuleAllowed(guard)) {
        return NextResponse.json(
            {
                error: 'Documents module is not available in your plan',
                code: 'MODULE_BLOCKED',
            },
            { status: 403 }
        )
    }

    const { session, body, clientInfo } = guard
    await connectDB()

    const action = body.action

    // ──────────────────────────────────────────────────────
    // ACTION: create_template
    // ──────────────────────────────────────────────────────
    if (action === 'create_template') {
        const { name, type, content } = body

        if (!name?.trim() || !type || !content?.trim()) {
            return NextResponse.json(
                { error: 'Name, type aur content required hain' },
                { status: 400 }
            )
        }

        const validTypes = ['tc', 'cc', 'bonafide', 'custom']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid document type' },
                { status: 400 }
            )
        }

        const variables = (content.match(/\{\{(\w+)\}\}/g) || [])
            .map((v: string) => v.replace(/\{\{|\}\}/g, ''))

        const template = await DocumentTemplate.create({
            tenantId: session.user.tenantId,
            name: name.trim(),
            type,
            content: content.trim(),
            variables,
            isDefault: false,
            createdBy: session.user.id,
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Document',
            resourceId: template._id.toString(),
            description: `Document template created: ${name} (${type})`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({ template }, { status: 201 })
    }

    // ──────────────────────────────────────────────────────
    // ACTION: generate
    // ──────────────────────────────────────────────────────
    if (action === 'generate') {
        const { templateId, studentId, customData } = body

        if (!templateId || !studentId) {
            return NextResponse.json(
                { error: 'templateId aur studentId required hain' },
                { status: 400 }
            )
        }

        const template = await DocumentTemplate.findOne({
            _id: templateId,
            tenantId: session.user.tenantId,
        }).lean() as any

        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            )
        }

        const student = await Student.findOne({
            _id: studentId,
            tenantId: session.user.tenantId,
        }).lean() as any

        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            )
        }

        const userDoc = await User.findById(student.userId)
            .select('name email phone')
            .lean() as any

        // Serial number
        const year = new Date().getFullYear()
        const prefix = template.type.toUpperCase()
        const count = await IssuedDocument.countDocuments({
            tenantId: session.user.tenantId,
            documentType: template.type,
        })
        const serialNo = `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`

        const dob = student.dateOfBirth
            ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            })
            : ''

        const todayFormatted = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })

        const variableMap: Record<string, string> = {
            studentName: userDoc?.name || '',
            fatherName: student.fatherName || '',
            motherName: student.motherName || '',
            class: student.class || '',
            section: student.section || '',
            admissionNo: student.admissionNo || '',
            rollNo: student.rollNo || '',
            academicYear: student.academicYear || '',
            session: student.academicYear || '',
            dob,
            gender: student.gender || '',
            address: student.address || '',
            phone: student.parentPhone || '',
            character: customData?.character || 'good',
            fromDate: customData?.fromDate || todayFormatted,
            toDate: todayFormatted,
            content: '',
            serialNo,
            ...(customData || {}),
        }

        let generatedContent = template.content
        Object.entries(variableMap).forEach(([key, val]) => {
            generatedContent = generatedContent.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                String(val)
            )
        })

        // ✅ Create IssuedDocument record (WITHOUT PDF initially)
        const issued = await IssuedDocument.create({
            tenantId: session.user.tenantId,
            templateId: template._id,
            studentId: student._id,
            studentName: userDoc?.name || '',
            studentAdmissionNo: student.admissionNo || '',
            documentType: template.type,
            serialNo,
            issuedBy: session.user.id,
            issuedByName: session.user.name || 'Unknown',
            status: 'issued',
            savedToStorage: false, // ✅ Initially not saved
        })

        await logAudit({
            tenantId: session.user.tenantId,
            userId: session.user.id,
            userName: session.user.name || 'Unknown',
            userRole: session.user.role,
            action: 'CREATE',
            resource: 'Document',
            resourceId: issued._id.toString(),
            description: `${template.type.toUpperCase()} generated for ${userDoc?.name} (${serialNo})`,
            ipAddress: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            status: 'SUCCESS',
        })

        return NextResponse.json({
            issued,
            generatedContent,
            serialNo,
            studentName: userDoc?.name || '',
        })
    }

    // ──────────────────────────────────────────────────────
    // ✅ ACTION: save_pdf — CORRECTED
    // ──────────────────────────────────────────────────────
    if (action === 'save_pdf') {
        const { issuedDocId, htmlContent, schoolName } = body

        if (!issuedDocId || !htmlContent) {
            return NextResponse.json(
                { error: 'issuedDocId aur htmlContent required hain' },
                { status: 400 }
            )
        }

        // Fetch issued document
        const issued = await IssuedDocument.findOne({
            _id: issuedDocId,
            tenantId: session.user.tenantId,
        }) as any

        if (!issued) {
            return NextResponse.json(
                { error: 'Issued document not found' },
                { status: 404 }
            )
        }

        // Already saved?
        if (issued.savedToStorage && issued.pdfUrl) {
            return NextResponse.json({
                pdfUrl: issued.pdfUrl,
                message: 'Already saved',
            })
        }

        // ✅ Storage limit check
        const school = await School.findById(session.user.tenantId)
            .select('plan addonLimits')
            .lean() as any

        const estimatedPdfSize = 80 * 1024 // ~80KB typical

        const storageCheck = await checkStorageLimit(
            session.user.tenantId,
            (school?.plan ?? 'starter') as PlanId,
            estimatedPdfSize,
            school?.addonLimits
        )

        if (!storageCheck.canUpload) {
            return NextResponse.json(
                {
                    error:
                        storageCheck.message ??
                        'Storage limit exceeded. Upgrade your plan or purchase storage addon.',
                    code: 'STORAGE_LIMIT',
                    upgrade: '/admin/subscription',
                },
                { status: 413 }
            )
        }

        try {
            // Extract content from HTML
            const contentMatch = htmlContent.match(/<div class="content">([\s\S]*?)<\/div>/)
            let content = contentMatch?.[1] || htmlContent

            // Clean HTML tags
            content = content
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<p>/gi, '')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .trim()

            // Extract metadata
            const serialMatch = htmlContent.match(/Serial No:\s*(\S+)/)
            const serialNo = serialMatch?.[1]?.trim() || issued.serialNo

            const docTypeMatch = htmlContent.match(/<div class="doc-title">([\s\S]*?)<\/div>/)
            const docType = docTypeMatch?.[1]?.trim() || issued.documentType.toUpperCase()

            // ✅ Generate PDF using buildDocumentPdf
            const pdfBuffer = await buildDocumentPdf({
                schoolName: schoolName || session.user.schoolName || 'Institution',
                documentType: docType,
                serialNo: serialNo,
                content: content,
            })

            // ✅ Upload to R2
            const filename = `${issued.serialNo}_${issued.studentName.replace(/\s+/g, '_')}.pdf`
            const pdfUrl = await uploadBuffer(
                pdfBuffer,
                filename,
                'pdf',
                session.user.tenantId
            )

            // ✅ Update storage usage
            await updateStorageUsage(
                session.user.tenantId,
                pdfBuffer.length
            )

            // ✅ Update IssuedDocument record
            issued.pdfUrl = pdfUrl
            issued.savedToStorage = true
            await issued.save()

            await logAudit({
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userName: session.user.name || 'Unknown',
                userRole: session.user.role,
                action: 'UPDATE',
                resource: 'Document',
                resourceId: issued._id.toString(),
                description: `PDF saved to storage: ${issued.serialNo} (${(pdfBuffer.length / 1024).toFixed(1)}KB)`,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                status: 'SUCCESS',
            })

            return NextResponse.json({
                pdfUrl,
                size: pdfBuffer.length,
                message: 'PDF saved successfully',
            })
        } catch (err: any) {
            console.error('[Documents save_pdf]', err)
            return NextResponse.json(
                { error: 'Failed to generate PDF', details: err.message },
                { status: 500 }
            )
        }
    }

    return NextResponse.json(
        { error: 'Invalid action. Use create_template, generate, or save_pdf' },
        { status: 400 }
    )
}

// ─────────────────────────────────────────────────────────
// DELETE — Template delete
// ─────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'mutation',
        auditAction: 'DELETE',
        auditResource: 'Document',
    })
    if (guard instanceof NextResponse) return guard

    if (!isDocumentModuleAllowed(guard)) {
        return NextResponse.json(
            { error: 'Documents module not available', code: 'MODULE_BLOCKED' },
            { status: 403 }
        )
    }

    const { session, clientInfo } = guard
    await connectDB()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json(
            { error: 'Template ID required' },
            { status: 400 }
        )
    }

    const template = await DocumentTemplate.findOneAndDelete({
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
        resource: 'Document',
        resourceId: id,
        description: `Document template deleted: ${template.name}`,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        status: 'SUCCESS',
    })

    return NextResponse.json({ success: true })
}