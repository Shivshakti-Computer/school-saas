// FILE: src/lib/storage.ts
// UPDATED: Cloudinary → R2 migration with adapter pattern
// ✅ ZERO BREAKING CHANGES — existing callers same rahenge
// ✅ Dual provider support — env var se switch
// ─────────────────────────────────────────────────────────

import {
  uploadToR2,
  deleteFromR2,
  generateR2Key,
  extractR2KeyFromUrl,
  getContentType,
  type R2UploadResult,
} from './r2Client'

// Storage provider env se decide hoga
// STORAGE_PROVIDER=r2 → R2 use hoga
// STORAGE_PROVIDER=cloudinary (default) → Cloudinary use hoga
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER ?? 'cloudinary'

// ─────────────────────────────────────────────────────────
// CLOUDINARY ADAPTER (existing logic — unchanged)
// ─────────────────────────────────────────────────────────

async function cloudinaryUploadFromUrl(
  url: string,
  folder: string
): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  })
  const result = await cloudinary.uploader.upload(url, {
    folder: `school-saas/${folder}`,
    resource_type: 'auto',
  })
  return result.secure_url
}

async function cloudinaryUploadBuffer(
  buffer: Buffer,
  filename: string,
  type: 'pdf' | 'image' = 'image'
): Promise<string> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  })
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `school-saas/${type}s`,
        public_id: filename.replace(/\//g, '_'),
        resource_type: type === 'pdf' ? 'raw' : 'image',
      },
      (err, result) => {
        if (err) reject(err)
        else resolve(result!.secure_url)
      }
    )
    stream.end(buffer)
  })
}

async function cloudinaryDeleteFile(publicId: string): Promise<void> {
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  })
  await cloudinary.uploader.destroy(publicId)
}

// ─────────────────────────────────────────────────────────
// R2 ADAPTER
// ─────────────────────────────────────────────────────────

async function r2UploadFromUrl(
  url: string,
  folder: string,
  tenantId?: string
): Promise<string> {
  // URL se buffer download karo
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch URL: ${url}`)

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const urlParts = url.split('/')
  const filename = urlParts[urlParts.length - 1] || `file_${Date.now()}`
  const contentType =
    response.headers.get('content-type') || getContentType(filename)

  const key = tenantId
    ? generateR2Key(tenantId, folder, filename)
    : `school-saas/${folder}/${Date.now()}_${filename}`

  const result = await uploadToR2(buffer, key, contentType)
  return result.url
}

async function r2UploadBuffer(
  buffer: Buffer,
  filename: string,
  type: 'pdf' | 'image' = 'image',
  tenantId?: string
): Promise<string> {
  const contentType =
    type === 'pdf' ? 'application/pdf' : getContentType(filename)

  const folder = type === 'pdf' ? 'pdfs' : 'images'
  const key = tenantId
    ? generateR2Key(tenantId, folder, filename)
    : `school-saas/${folder}/${Date.now()}_${filename.replace(/\//g, '_')}`

  const result = await uploadToR2(buffer, key, contentType)
  return result.url
}

async function r2DeleteFile(urlOrKey: string): Promise<void> {
  // R2 URL se key extract karo
  const key = extractR2KeyFromUrl(urlOrKey) ?? urlOrKey
  await deleteFromR2(key)
}

// ─────────────────────────────────────────────────────────
// PUBLIC API — SAME AS BEFORE (zero breaking changes)
// ─────────────────────────────────────────────────────────

/**
 * Upload from URL (images ke liye)
 * @param url Source URL
 * @param folder Destination folder
 * @param tenantId School ID (R2 ke liye recommended)
 */
export async function uploadFromUrl(
  url: string,
  folder: string,
  tenantId?: string
): Promise<string> {
  if (STORAGE_PROVIDER === 'r2') {
    return r2UploadFromUrl(url, folder, tenantId)
  }
  return cloudinaryUploadFromUrl(url, folder)
}

/**
 * Upload buffer (PDFs, generated files)
 * @param buffer File buffer
 * @param filename File name
 * @param type 'pdf' | 'image'
 * @param tenantId School ID (R2 ke liye recommended)
 */
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  type: 'pdf' | 'image' = 'image',
  tenantId?: string
): Promise<string> {
  if (STORAGE_PROVIDER === 'r2') {
    return r2UploadBuffer(buffer, filename, type, tenantId)
  }
  return cloudinaryUploadBuffer(buffer, filename, type)
}

/**
 * Upload from multipart form data (Next.js)
 * @param file File object
 * @param folder Destination folder
 * @param tenantId School ID (R2 ke liye recommended)
 */
export async function uploadFormFile(
  file: File,
  folder: string,
  tenantId?: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (STORAGE_PROVIDER === 'r2') {
    const contentType = file.type || getContentType(file.name)
    const key = tenantId
      ? generateR2Key(tenantId, folder, file.name)
      : `school-saas/${folder}/${Date.now()}_${file.name}`

    const result = await uploadToR2(buffer, key, contentType)
    return result.url
  }

  return cloudinaryUploadBuffer(
    buffer,
    `${folder}/${Date.now()}_${file.name}`
  )
}

/**
 * Upload form file aur R2 result return karo
 * (storage tracking ke liye — size chahiye)
 */
export async function uploadFormFileWithMeta(
  file: File,
  folder: string,
  tenantId: string
): Promise<R2UploadResult & { url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || getContentType(file.name)
  const key = generateR2Key(tenantId, folder, file.name)

  if (STORAGE_PROVIDER === 'r2') {
    return uploadToR2(buffer, key, contentType)
  }

  // Cloudinary fallback — size mock karo
  const url = await cloudinaryUploadBuffer(
    buffer,
    `${folder}/${Date.now()}_${file.name}`
  )
  return { url, key: url, size: buffer.length, contentType }
}

/**
 * Delete file
 * @param publicIdOrUrl Cloudinary public_id ya R2 URL/key
 */
export async function deleteFile(publicIdOrUrl: string): Promise<void> {
  if (STORAGE_PROVIDER === 'r2') {
    return r2DeleteFile(publicIdOrUrl)
  }
  return cloudinaryDeleteFile(publicIdOrUrl)
}

/**
 * Check current storage provider
 */
export function getStorageProvider(): 'r2' | 'cloudinary' {
  return STORAGE_PROVIDER as 'r2' | 'cloudinary'
}

/**
 * Is R2 active?
 */
export function isR2Active(): boolean {
  return STORAGE_PROVIDER === 'r2'
}