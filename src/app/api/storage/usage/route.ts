// FILE: src/app/api/storage/usage/route.ts
// ═══════════════════════════════════════════════════════════
// ✅ FINAL: All folders + Correct structure
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { getStorageStats } from '@/lib/storageAddon'
import { listR2Files } from '@/lib/r2Client'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin'],
        rateLimit: 'api',
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    const tenantId = session.user.tenantId

    try {
        await connectDB()

        const school = await School.findById(tenantId)
            .select('plan storageAddon')
            .lean() as any

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        const stats = await getStorageStats(
            tenantId,
            school.plan,
            school.storageAddon
        )

        // ✅ Complete folder list matching actual R2 structure
        const folders = [
            'logos',
            'documents',
            'homework',
            'homework-submissions',
            'certificates',
            'reports',
            'exports',
            'idcards',
            'admitcards',
            'receipts',
        ]

        const breakdown = await Promise.all(
            folders.map(async (folder) => {
                try {
                    const files = await listR2Files(`schools/${tenantId}/${folder}/`, 1000)
                    const size = files.reduce((sum, f) => sum + f.size, 0)
                    return {
                        folder,
                        size,
                        sizeGB: Math.round((size / (1024 * 1024 * 1024)) * 100) / 100,
                        sizeMB: Math.round((size / (1024 * 1024)) * 100) / 100,
                        fileCount: files.length,
                    }
                } catch (err) {
                    console.warn(`[storage/usage] Error reading folder ${folder}:`, err)
                    return {
                        folder,
                        size: 0,
                        sizeGB: 0,
                        sizeMB: 0,
                        fileCount: 0,
                    }
                }
            })
        )

        const nonEmptyBreakdown = breakdown.filter(f => f.size > 0)

        // ✅ Sort by size (largest first)
        nonEmptyBreakdown.sort((a, b) => b.size - a.size)

        return NextResponse.json({
            success: true,
            data: {
                ...stats,
                breakdown: nonEmptyBreakdown,
            },
        })

    } catch (err: any) {
        console.error('[GET /api/storage/usage]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}