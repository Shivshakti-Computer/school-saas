/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/users/change-password/route.ts
   PUT → any user can change their own password
   ─────────────────────────────────────────────────────────── */

import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { User } from "@/models"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 
  await connectDB()
  const { currentPassword, newPassword } = await req.json()
 
  const user = await User.findById(session.user.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
 
  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) return NextResponse.json({ error: 'Current password wrong' }, { status: 400 })
 
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }
 
  await User.findByIdAndUpdate(user._id, {
    password: await bcrypt.hash(newPassword, 10)
  })
 
  return NextResponse.json({ success: true })
}