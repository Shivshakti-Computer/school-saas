// FILE: scripts/migrate-institution-modules.ts
// ═══════════════════════════════════════════════════════════════
// Run via: npx tsx scripts/migrate-institution-modules.ts
// No login required — direct DB access
// ═══════════════════════════════════════════════════════════════

import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load env
dotenv.config({ path: '.env.local' })

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local')
    process.exit(1)
}

// Institution modules config (same as pricing.ts)
const INSTITUTION_MODULES = {
    common: [
        'students', 'teachers', 'attendance', 'notices',
        'website', 'gallery', 'reports', 'communication',
        'documents', 'certificates', 'fees',
    ],
    schoolOnly: [
        'exams', 'timetable', 'homework', 'library', 'lms',
        'hr', 'transport', 'hostel', 'inventory',
        'visitor', 'health', 'alumni',
    ],
    academyCoachingOnly: [
        'courses', 'batches', 'enrollments',
        'franchises', 'assessments', 'assignments',
    ],
}

// ═══════════════════════════════════════════════════════════════
// MONGOOSE MODELS (Minimal — only what we need)
// ═══════════════════════════════════════════════════════════════

const SchoolSchema = new mongoose.Schema({
    name: String,
    subdomain: String,
    institutionType: {
        type: String,
        enum: ['school', 'academy', 'coaching'],
        default: 'school',
    },
    modules: [String],
    plan: { type: String, default: 'starter' },
    subscriptionStatus: {
        type: String,
        enum: ['trial', 'active', 'expired', 'scheduled_cancel'],
        default: 'trial',
    },
    trialEndsAt: Date,
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

const School = mongoose.models.School || mongoose.model('School', SchoolSchema)

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getWrongModules(
    modules: string[],
    institutionType: string
): string[] {
    const wrong: string[] = []

    if (institutionType === 'school') {
        for (const mod of modules) {
            if (INSTITUTION_MODULES.academyCoachingOnly.includes(mod)) {
                wrong.push(mod)
            }
        }
    } else if (institutionType === 'academy' || institutionType === 'coaching') {
        for (const mod of modules) {
            if (INSTITUTION_MODULES.schoolOnly.includes(mod)) {
                wrong.push(mod)
            }
        }
    }

    return wrong
}

function getTrialModulesForInstitution(institutionType: string): string[] {
    const common = [...INSTITUTION_MODULES.common]

    if (institutionType === 'school') {
        return [...common, ...INSTITUTION_MODULES.schoolOnly]
    }

    if (institutionType === 'academy' || institutionType === 'coaching') {
        return [...common, ...INSTITUTION_MODULES.academyCoachingOnly]
    }

    return common
}

function getModulesForInstitution(institutionType: string, plan: string): string[] {
    // Plan-based modules (simplified — same logic as pricing.ts)
    const planModules: Record<string, string[]> = {
        starter: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery', 'courses', 'batches', 'enrollments'],
        growth: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery', 'reports', 'communication', 'documents', 'fees', 'exams', 'timetable', 'homework', 'courses', 'batches', 'enrollments', 'franchises', 'assessments', 'assignments'],
        pro: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery', 'reports', 'communication', 'documents', 'certificates', 'fees', 'exams', 'timetable', 'homework', 'library', 'lms', 'courses', 'batches', 'enrollments', 'franchises', 'assessments', 'assignments'],
        enterprise: ['students', 'teachers', 'attendance', 'notices', 'website', 'gallery', 'reports', 'communication', 'documents', 'certificates', 'fees', 'exams', 'timetable', 'homework', 'library', 'lms', 'hr', 'transport', 'hostel', 'inventory', 'visitor', 'health', 'alumni', 'courses', 'batches', 'enrollments', 'franchises', 'assessments', 'assignments'],
    }

    const allPlanModules = planModules[plan] || planModules.starter

    if (institutionType === 'school') {
        return allPlanModules.filter(
            (m) => !INSTITUTION_MODULES.academyCoachingOnly.includes(m)
        )
    }

    if (institutionType === 'academy' || institutionType === 'coaching') {
        return allPlanModules.filter(
            (m) => !INSTITUTION_MODULES.schoolOnly.includes(m)
        )
    }

    return allPlanModules
}

function computeCorrectModules(
    institutionType: string,
    subscriptionStatus: string,
    plan: string
): string[] {
    if (subscriptionStatus === 'trial') {
        return getTrialModulesForInstitution(institutionType)
    }
    return getModulesForInstitution(institutionType, plan)
}

// ═══════════════════════════════════════════════════════════════
// MAIN MIGRATION
// ═══════════════════════════════════════════════════════════════

async function runMigration() {
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║   Skolify — Institution Modules Migration                    ║')
    console.log('║   Fixes: Wrong modules + coursePayments → fees               ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')

    // Connect to DB
    console.log('📡 Connecting to MongoDB...')
    try {
        await mongoose.connect(MONGODB_URI!)
        console.log('✅ Connected to MongoDB')
    } catch (error: any) {
        console.error('❌ MongoDB connection failed:', error.message)
        process.exit(1)
    }

    // Fetch all active schools
    console.log('📚 Fetching schools...')
    const allSchools = await School.find({ isActive: true })
        .select('_id name institutionType modules subscriptionStatus plan')
        .lean()

    console.log(`📊 Found ${allSchools.length} active schools`)
    console.log('')

    // Analyze
    const stats = {
        total: allSchools.length,
        needsFix: 0,
        alreadyCorrect: 0,
        byType: {
            school: { total: 0, needsFix: 0 },
            academy: { total: 0, needsFix: 0 },
            coaching: { total: 0, needsFix: 0 },
        },
        issues: {
            wrongModules: 0,
            coursePayments: 0,
        },
    }

    const schoolsToFix: any[] = []

    for (const school of allSchools) {
        const institutionType = school.institutionType || 'school'
        const currentModules = school.modules || []

        // Count by type
        if (stats.byType[institutionType as keyof typeof stats.byType]) {
            stats.byType[institutionType as keyof typeof stats.byType].total++
        }

        const wrongModules = getWrongModules(currentModules, institutionType)
        const hasCoursePayments = currentModules.includes('coursePayments')
        const needsFix = wrongModules.length > 0 || hasCoursePayments

        if (wrongModules.length > 0) stats.issues.wrongModules++
        if (hasCoursePayments) stats.issues.coursePayments++

        if (needsFix) {
            stats.needsFix++
            if (stats.byType[institutionType as keyof typeof stats.byType]) {
                stats.byType[institutionType as keyof typeof stats.byType].needsFix++
            }

            const correctModules = computeCorrectModules(
                institutionType,
                school.subscriptionStatus || 'trial',
                school.plan || 'starter'
            )

            schoolsToFix.push({
                id: school._id,
                name: school.name,
                type: institutionType,
                subscriptionStatus: school.subscriptionStatus,
                plan: school.plan,
                wrongModules,
                hasCoursePayments,
                currentModules,
                correctModules,
            })
        } else {
            stats.alreadyCorrect++
        }
    }

    // Show preview
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║   PREVIEW — Schools needing fix                              ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log(`📊 Total schools:        ${stats.total}`)
    console.log(`✅ Already correct:      ${stats.alreadyCorrect}`)
    console.log(`🔧 Need fix:             ${stats.needsFix}`)
    console.log('')
    console.log('By Institution Type:')
    console.log(`   🏫 School:            ${stats.byType.school.needsFix}/${stats.byType.school.total}`)
    console.log(`   🎓 Academy:           ${stats.byType.academy.needsFix}/${stats.byType.academy.total}`)
    console.log(`   📚 Coaching:          ${stats.byType.coaching.needsFix}/${stats.byType.coaching.total}`)
    console.log('')
    console.log('Issues Found:')
    console.log(`   ❌ Wrong modules:     ${stats.issues.wrongModules}`)
    console.log(`   ❌ coursePayments:    ${stats.issues.coursePayments}`)
    console.log('')

    if (schoolsToFix.length === 0) {
        console.log('✨ No schools need fixing!')
        await mongoose.disconnect()
        console.log('👋 Disconnected from MongoDB')
        process.exit(0)
    }

    // Show sample
    console.log('Sample schools to fix:')
    schoolsToFix.slice(0, 3).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (${s.type})`)
        console.log(`      Current: ${s.currentModules.length} modules`)
        console.log(`      After:   ${s.correctModules.length} modules`)
        if (s.wrongModules.length > 0) {
            console.log(`      Remove:  ${s.wrongModules.join(', ')}`)
        }
        if (s.hasCoursePayments) {
            console.log(`      Replace: coursePayments → fees`)
        }
        console.log('')
    })

    if (schoolsToFix.length > 3) {
        console.log(`   ... and ${schoolsToFix.length - 3} more`)
        console.log('')
    }

    // Confirm
    const readline = await import('readline')
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const answer = await new Promise<string>((resolve) => {
        rl.question('🚀 Run migration? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Migration cancelled')
        await mongoose.disconnect()
        console.log('👋 Disconnected from MongoDB')
        process.exit(0)
    }

    // Execute
    console.log('')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║   RUNNING MIGRATION...                                       ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')

    const results = {
        fixed: 0,
        skipped: 0,
        errors: 0,
        details: [] as any[],
    }

    for (const school of schoolsToFix) {
        try {
            await School.findByIdAndUpdate(
                school.id,
                { modules: school.correctModules },
                { new: true }
            )

            results.fixed++
            results.details.push({
                id: school.id,
                name: school.name,
                type: school.type,
                status: 'FIXED',
                before: school.currentModules.length,
                after: school.correctModules.length,
            })

            console.log(`✅ ${school.name} (${school.type}) — ${school.currentModules.length} → ${school.correctModules.length} modules`)

        } catch (error: any) {
            results.errors++
            results.details.push({
                id: school.id,
                name: school.name,
                type: school.type,
                status: 'ERROR',
                error: error.message,
            })
            console.error(`❌ ${school.name} — ${error.message}`)
        }
    }

    // Summary
    console.log('')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║   MIGRATION COMPLETE                                         ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log(`✅ Fixed:    ${results.fixed}`)
    console.log(`⏭️  Skipped:  ${results.skipped}`)
    console.log(`❌ Errors:   ${results.errors}`)
    console.log('')

    // Disconnect
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
    console.log('')
    console.log('⚠️  IMPORTANT: Delete this script or remove execute permissions after use!')
    console.log('')
}

// Run
runMigration().catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
})