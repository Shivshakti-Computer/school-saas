/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/upload/route.ts
   POST → file/image upload to Cloudinary
   ─────────────────────────────────────────────────────────── */
import { authOptions } from '@/lib/auth'
import { uploadFormFile } from '@/lib/storage'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
 
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  const formData = await req.formData()
  const file     = formData.get('file') as File
  const folder   = (formData.get('folder') as string) || 'uploads'
 
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
 
  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }
 
  const url = await uploadFormFile(file, `${session.user.tenantId}/${folder}`)
  return NextResponse.json({ url })
}