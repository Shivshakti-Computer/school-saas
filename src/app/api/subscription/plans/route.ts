// =============================================================
// FILE: src/app/api/subscription/plans/route.ts
// GET → available plans return karo (public)
// =============================================================
 
import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/plans'
 
export async function GET() {
  return NextResponse.json({ plans: Object.values(PLANS) })
}