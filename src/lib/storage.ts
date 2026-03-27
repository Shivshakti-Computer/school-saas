/* ─────────────────────────────────────────────────────────────
   FILE: src/lib/storage.ts
   Cloudinary upload helper
   ─────────────────────────────────────────────────────────── */
import { v2 as cloudinary } from 'cloudinary'
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})
 
// Upload a file from URL (for images)
export async function uploadFromUrl(url: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(url, {
    folder: `school-saas/${folder}`,
    resource_type: 'auto',
  })
  return result.secure_url
}
 
// Upload buffer (for PDFs, generated files)
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  type: 'pdf' | 'image' = 'image'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        `school-saas/${type}s`,
        public_id:     filename.replace(/\//g, '_'),
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
 
// Upload from multipart form data (Next.js)
export async function uploadFormFile(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return uploadBuffer(buffer, `${folder}/${Date.now()}_${file.name}`)
}
 
// Delete file
export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}