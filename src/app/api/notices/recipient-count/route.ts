// FILE: src/app/api/notices/recipient-count/route.ts
// FIXED:
//   Bug 1 → Channel-specific count (sms=phone, email=email, whatsapp=phone)
//   Bug 2 → Per-channel breakdown return karo
//   Backward compatible — existing fields same hain

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Student } from '@/models/Student'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'teacher', 'staff'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard
    const { session } = guard

    try {
        await connectDB()

        const url = new URL(req.url)
        const targetRole = url.searchParams.get('targetRole') || 'all'
        const academicYear = url.searchParams.get('academicYear')
        const classesParam = url.searchParams.get('classes')
        const targetClasses = classesParam ? classesParam.split(',') : []

        // ── Per-channel counts ──────────────────────────────
        // Notice form sends multiple channels — each has own count
        let totalUsers = 0
        let withPhone = 0   // sms + whatsapp
        let withEmail = 0   // email only

        // ── Students / Parents / All ────────────────────────
        if (
            targetRole === 'student' ||
            targetRole === 'parent' ||
            targetRole === 'all'
        ) {
            if (!academicYear) {
                return NextResponse.json(
                    { error: 'Academic year required' },
                    { status: 400 }
                )
            }

            const studentFilter: any = {
                tenantId: session.user.tenantId,
                academicYear,
                status: 'active',
            }

            if (targetClasses.length > 0) {
                studentFilter.class = { $in: targetClasses }
            }

            const students = await Student.find(studentFilter)
                .select('_id parentPhone parentEmail userId')
                .populate('userId', 'phone email')
                .lean()

            totalUsers = students.length

            if (targetRole === 'student') {
                // Student ka phone / email
                withPhone = students.filter(s => {
                    const u = s.userId as any
                    return u?.phone && u.phone.trim() !== ''
                }).length

                withEmail = students.filter(s => {
                    const u = s.userId as any
                    return u?.email && u.email.trim() !== ''
                }).length

            } else if (targetRole === 'parent') {
                // Parent ka parentPhone / parentEmail
                withPhone = students.filter(s =>
                    s.parentPhone && s.parentPhone.trim() !== ''
                ).length

                withEmail = students.filter(s =>
                    s.parentEmail && s.parentEmail.trim() !== ''
                ).length

            } else {
                // 'all' — students + parents + teachers + staff
                // Students (phone)
                const studentPhone = students.filter(s => {
                    const u = s.userId as any
                    return u?.phone && u.phone.trim() !== ''
                }).length

                // Parents (parentPhone)
                const parentPhone = students.filter(s =>
                    s.parentPhone && s.parentPhone.trim() !== ''
                ).length

                // Students (email)
                const studentEmail = students.filter(s => {
                    const u = s.userId as any
                    return u?.email && u.email.trim() !== ''
                }).length

                // Parents (parentEmail)
                const parentEmail = students.filter(s =>
                    s.parentEmail && s.parentEmail.trim() !== ''
                ).length

                // Teachers + Staff
                const staffUsers = await User.find({
                    tenantId: session.user.tenantId,
                    isActive: true,
                    role: { $in: ['teacher', 'staff'] },
                }).select('phone email').lean()

                const staffPhone = staffUsers.filter(
                    u => u.phone && u.phone.trim() !== ''
                ).length

                const staffEmail = staffUsers.filter(
                    u => u.email && u.email.trim() !== ''
                ).length

                withPhone = studentPhone + parentPhone + staffPhone
                withEmail = studentEmail + parentEmail + staffEmail
                totalUsers = students.length + staffUsers.length
            }

        } else {
            // ── Teacher / Staff only ──────────────────────────
            const userQuery: any = {
                tenantId: session.user.tenantId,
                isActive: true,
                role: targetRole,
            }

            const users = await User.find(userQuery)
                .select('phone email')
                .lean()

            totalUsers = users.length

            withPhone = users.filter(
                u => u.phone && u.phone.trim() !== ''
            ).length

            withEmail = users.filter(
                u => u.email && u.email.trim() !== ''
            ).length
        }

        // ── Bug 1 Fix: validContacts = max(withPhone, withEmail) ──
        // Form mein dono show hote hain, lekin per-channel alag hai
        // Frontend pe channel-specific use karna chahiye
        // Backward compat: validContacts = withPhone (SMS default)
        const validContacts = Math.max(withPhone, withEmail)

        return NextResponse.json({
            success: true,
            total: totalUsers,
            validContacts,          // backward compat (max of both)
            estimated: validContacts,

            // ✅ NEW: Per-channel breakdown
            // NoticeForm isme se channel-specific pick karega
            channels: {
                sms: { validContacts: withPhone },
                whatsapp: { validContacts: withPhone },
                email: { validContacts: withEmail },
            },
        })

    } catch (err: any) {
        console.error('Recipient count error:', err)
        return NextResponse.json(
            { error: err.message },
            { status: 500 }
        )
    }
}