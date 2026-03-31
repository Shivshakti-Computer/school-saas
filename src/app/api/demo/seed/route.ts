// FILE: src/app/api/demo/seed/route.ts
// POST → Create demo school with all features + sample data
// Protected: only superadmin can create

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { User } from '@/models/User'
import { Subscription } from '@/models/Subscription'
import { DEMO_CONFIG } from '@/lib/plans'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'superadmin') {
            return NextResponse.json({ error: 'Only superadmin can create demo' }, { status: 403 })
        }

        await connectDB()

        // Check if demo already exists
        const existing = await School.findOne({ subdomain: DEMO_CONFIG.schoolCode })
        if (existing) {
            return NextResponse.json({
                error: 'Demo school already exists',
                schoolCode: DEMO_CONFIG.schoolCode,
                loginPhone: DEMO_CONFIG.adminPhone,
            }, { status: 409 })
        }

        // Trial that never expires (100 years)
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + DEMO_CONFIG.trialDays)

        // Create demo school
        const school = await School.create({
            name: DEMO_CONFIG.schoolName,
            subdomain: DEMO_CONFIG.schoolCode,
            address: 'Demo City, India',
            phone: DEMO_CONFIG.adminPhone,
            email: 'demo@skolify.in',
            plan: DEMO_CONFIG.plan,
            trialEndsAt,
            modules: [
                'students', 'teachers', 'attendance', 'notices',
                'website', 'gallery', 'fees', 'exams', 'timetable',
                'homework', 'documents', 'reports', 'communication',
                'library', 'certificates', 'lms',
                'hr', 'transport', 'hostel',
                'inventory', 'visitor', 'health', 'alumni',
            ],
            isActive: true,
            onboardingComplete: true,
        })

        // Create demo admin
        const hashedPwd = await bcrypt.hash(DEMO_CONFIG.adminPassword, 12)
        await User.create({
            tenantId: school._id,
            name: DEMO_CONFIG.adminName,
            phone: DEMO_CONFIG.adminPhone,
            email: 'demo@skolify.in',
            role: 'admin',
            password: hashedPwd,
            isActive: true,
        })

        // Create demo subscription (enterprise, never expires)
        await Subscription.create({
            tenantId: school._id,
            razorpaySubId: `demo_${Date.now()}`,
            razorpayCustomerId: 'demo',
            plan: 'enterprise',
            billingCycle: 'yearly',
            amount: 0,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndsAt,
            isDemo: true,
        })

        // Update school with subscription
        await School.findByIdAndUpdate(school._id, {
            subscriptionId: 'demo',
        })

        // Create sample teacher
        const teacherPwd = await bcrypt.hash('Teacher@123', 12)
        await User.create({
            tenantId: school._id,
            name: 'Demo Teacher',
            phone: '9999999998',
            role: 'teacher',
            password: teacherPwd,
            isActive: true,
            subjects: ['Mathematics', 'Science'],
            class: '10',
        })

        // Create sample parent
        const parentPwd = await bcrypt.hash('Parent@123', 12)
        await User.create({
            tenantId: school._id,
            name: 'Demo Parent',
            phone: '9999999997',
            role: 'parent',
            password: parentPwd,
            isActive: true,
        })

        return NextResponse.json({
            success: true,
            message: 'Demo school created successfully',
            credentials: {
                schoolCode: DEMO_CONFIG.schoolCode,
                admin: { phone: DEMO_CONFIG.adminPhone, password: DEMO_CONFIG.adminPassword },
                teacher: { phone: '9999999998', password: 'Teacher@123' },
                parent: { phone: '9999999997', password: 'Parent@123' },
            },
        })

    } catch (err: any) {
        console.error('Demo seed error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}