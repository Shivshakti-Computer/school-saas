// FILE: src/lib/r2Client.ts
// Cloudflare R2 client — AWS S3-compatible API use karta hai
// ─────────────────────────────────────────────────────────

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ── R2 Client Singleton ──
let _r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 credentials missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env'
    )
  }

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return _r2Client
}

const BUCKET = process.env.R2_BUCKET_NAME || 'skolify-storage'
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────
// UPLOAD FILE TO R2
// ─────────────────────────────────────────────────────────

export interface R2UploadResult {
  url: string       // Public URL
  key: string       // R2 object key (for delete)
  size: number      // Bytes
  contentType: string
}

// ─────────────────────────────────────────────────────────
// UPLOAD FILE TO R2
// ─────────────────────────────────────────────────────────

export interface R2UploadResult {
  url: string
  key: string
  size: number
  contentType: string
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<R2UploadResult> {
  const client = getR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
      Metadata: metadata,
      // ✅ FIX: Make object publicly readable
      ACL: 'public-read',
    })
  )

  // ✅ FIX: Proper URL construction (no double slashes)
  const url = PUBLIC_URL
    ? `${PUBLIC_URL}/${key}`
    : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${key}`

  return {
    url,
    key,
    size: buffer.length,
    contentType,
  }
}

// ─────────────────────────────────────────────────────────
// DELETE FILE FROM R2
// ─────────────────────────────────────────────────────────

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client()

  await client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

// ─────────────────────────────────────────────────────────
// GET FILE SIZE (HEAD request — no download)
// ─────────────────────────────────────────────────────────

export async function getR2FileSize(key: string): Promise<number> {
  const client = getR2Client()

  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
    return response.ContentLength ?? 0
  } catch {
    return 0
  }
}

// ─────────────────────────────────────────────────────────
// GET SIGNED URL (private files ke liye — future use)
// ─────────────────────────────────────────────────────────

export async function getR2SignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = getR2Client()

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

// ─────────────────────────────────────────────────────────
// LIST FILES BY PREFIX (school ke saare files)
// Usage tracking ke liye
// ─────────────────────────────────────────────────────────

export interface R2FileInfo {
  key: string
  size: number
  lastModified: Date
}

export async function listR2Files(
  prefix: string,
  maxFiles = 1000
): Promise<R2FileInfo[]> {
  const client = getR2Client()
  const files: R2FileInfo[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        MaxKeys: Math.min(maxFiles - files.length, 1000),
        ContinuationToken: continuationToken,
      })
    )

    for (const obj of response.Contents ?? []) {
      files.push({
        key: obj.Key ?? '',
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? new Date(),
      })
    }

    continuationToken = response.NextContinuationToken
    if (files.length >= maxFiles) break
  } while (continuationToken)

  return files
}

// ─────────────────────────────────────────────────────────
// CALCULATE SCHOOL STORAGE USAGE
// R2 mein school ka total storage use karo
// ─────────────────────────────────────────────────────────

export async function calculateSchoolStorageBytes(
  tenantId: string
): Promise<number> {
  const files = await listR2Files(`schools/${tenantId}/`)
  return files.reduce((total, file) => total + file.size, 0)
}

// ─────────────────────────────────────────────────────────
// KEY GENERATOR — Consistent R2 key format
// ─────────────────────────────────────────────────────────

export function generateR2Key(
  tenantId: string,
  folder: string,
  filename: string
): string {
  // ✅ FIX: Format: schools/{tenantId}/{folder}/{timestamp}_{filename}
  // NOT: schools/{tenantId}/{tenantId}/{folder}/...
  const timestamp = Date.now()
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()
  
  // ✅ FIX: Clean folder path — remove any leading/trailing slashes
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '')
  
  return `schools/${tenantId}/${cleanFolder}/${timestamp}_${sanitizedFilename}`
}

// ─────────────────────────────────────────────────────────
// EXTRACT KEY FROM URL
// Cloudinary URL → public_id
// R2 URL → key
// ─────────────────────────────────────────────────────────

export function extractR2KeyFromUrl(url: string): string | null {
  if (!PUBLIC_URL || !url.startsWith(PUBLIC_URL)) return null
  return url.slice(PUBLIC_URL.length + 1) // Remove PUBLIC_URL + '/'
}

// ─────────────────────────────────────────────────────────
// CONTENT TYPE DETECTOR
// ─────────────────────────────────────────────────────────

export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    txt: 'text/plain',
    csv: 'text/csv',
    // Archives
    zip: 'application/zip',
  }

  return mimeTypes[ext] ?? 'application/octet-stream'
}