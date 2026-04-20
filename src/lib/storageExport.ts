// FILE: src/lib/storageExport.ts
// Data portability — download all files as ZIP
// ═══════════════════════════════════════════════════════════

import { listR2Files } from './r2Client'
import { connectDB } from './db'
import { School } from '@/models/School'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sendMessage } from './message'

// ══════════════════════════════════════════════════════════
// CREATE DOWNLOAD ARCHIVE (Background Job)
// Returns signed URL valid for 7 days
// ══════════════════════════════════════════════════════════

export interface ExportResult {
    success: boolean
    downloadUrl?: string
    fileCount?: number
    totalSizeBytes?: number
    expiresAt?: Date
    error?: string
}

export async function createStorageExport(
    tenantId: string,
    schoolName: string,
    schoolEmail: string
): Promise<ExportResult> {
    try {
        await connectDB()

        // ── Get all school files from R2 ──
        const files = await listR2Files(`schools/${tenantId}/`)

        if (files.length === 0) {
            return {
                success: false,
                error: 'No files found to export',
            }
        }

        const totalSize = files.reduce((sum, f) => sum + f.size, 0)

        // ── Option A: Generate ZIP on-demand (small files) ──
        // For schools with < 500 MB data
        if (totalSize < 500 * 1024 * 1024) {
            // TODO: Implement ZIP creation + upload to R2
            // const zipKey = `exports/${tenantId}_${Date.now()}.zip`
            // const zipUrl = await createZipAndUpload(files, zipKey)
            // return { success: true, downloadUrl: zipUrl, ... }
        }

        // ── Option B: Pre-signed URLs list (large files) ──
        // For schools with 500 MB+ data — give individual file links
        const downloadLinks = await Promise.all(
            files.map(async (file) => {
                const client = new S3Client({
                    region: 'auto',
                    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                    credentials: {
                        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
                    },
                })

                const command = new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME!,
                    Key: file.key,
                })

                const url = await getSignedUrl(client, command, {
                    expiresIn: 7 * 24 * 60 * 60, // 7 days
                })

                return {
                    filename: file.key.split('/').pop() ?? file.key,
                    url,
                    size: file.size,
                }
            })
        )

        // ── Store download manifest in DB ──
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await School.findByIdAndUpdate(tenantId, {
            $set: {
                'storageAddon.downloadLinkSentAt': new Date(),
            },
        })

        // ── Send email with download links ──
        await sendMessage({
            tenantId,
            channel: 'email',
            purpose: 'custom',
            recipient: schoolEmail,
            subject: `Skolify — Your Data Export is Ready`,
            message: `Your storage data export for ${schoolName} is ready. Download links have been sent to this email. Links expire in 7 days.`,  // ✅ ADDED
            html: generateDownloadEmail(schoolName, downloadLinks, expiresAt),
            skipCreditCheck: true,
        })

        return {
            success: true,
            downloadUrl: 'Email sent with download links',
            fileCount: files.length,
            totalSizeBytes: totalSize,
            expiresAt,
        }

    } catch (err: any) {
        console.error('[createStorageExport] Error:', err)
        return {
            success: false,
            error: err.message,
        }
    }
}

// ══════════════════════════════════════════════════════════
// EMAIL TEMPLATE — Download Links
// ══════════════════════════════════════════════════════════

function generateDownloadEmail(
    schoolName: string,
    files: Array<{ filename: string; url: string; size: number }>,
    expiresAt: Date
): string {
    const totalSizeMB = (
        files.reduce((sum, f) => sum + f.size, 0) /
        (1024 * 1024)
    ).toFixed(2)

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .file-list { margin: 20px 0; }
        .file-item { padding: 12px; background: #f1f5f9; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .file-name { font-weight: 600; color: #334155; font-size: 14px; }
        .file-size { color: #64748b; font-size: 12px; }
        .download-btn { background: #4f46e5; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 6px; }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Data Export is Ready</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${schoolName}</strong>,</p>
          <p>Your storage data export has been generated. Download all files below:</p>

          <div class="warning">
            ⏰ <strong>Download links expire on ${expiresAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
          </div>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>Total Files:</strong> ${files.length}<br>
            <strong>Total Size:</strong> ${totalSizeMB} MB
          </div>

          <div class="file-list">
            ${files.map(f => `
              <div class="file-item">
                <div>
                  <div class="file-name">${f.filename}</div>
                  <div class="file-size">${(f.size / 1024).toFixed(1)} KB</div>
                </div>
                <a href="${f.url}" class="download-btn">Download</a>
              </div>
            `).join('')}
          </div>

          <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
            💡 <strong>Tip:</strong> Right-click on "Download" and select "Save link as" to save files directly.
          </p>
        </div>
        <div class="footer">
          Skolify — School Management System<br>
          This is an automated email. Do not reply.
        </div>
      </div>
    </body>
    </html>
  `
}

// ══════════════════════════════════════════════════════════
// CANCEL STORAGE ADDON (with grace period)
// ══════════════════════════════════════════════════════════

export async function cancelStorageAddon(
    tenantId: string,
    downloadCompleted: boolean = false
): Promise<{ success: boolean; gracePeriodEndsAt?: Date; error?: string }> {
    await connectDB()

    const school = await School.findById(tenantId)
        .select('storageAddon')
        .lean() as any

    if (!school?.storageAddon?.extraStorageGB) {
        return { success: false, error: 'No active storage addon' }
    }

    if (!school.storageAddon.autoRenew) {
        return { success: false, error: 'Already canceled' }
    }

    // ── Calculate grace period ──
    const validUntil = new Date(school.storageAddon.validUntil || new Date())
    const gracePeriodEndsAt = new Date(validUntil)
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 30) // 30 days grace

    // ── Update school ──
    await School.findByIdAndUpdate(tenantId, {
        $set: {
            'storageAddon.autoRenew': false,
            'storageAddon.canceledAt': new Date(),
            'storageAddon.gracePeriodEndsAt': gracePeriodEndsAt,
            'storageAddon.downloadCompleted': downloadCompleted,
        },
    })

    return {
        success: true,
        gracePeriodEndsAt,
    }
}