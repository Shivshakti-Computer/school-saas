// FILE: scripts/migrate-institution-type.ts
// Safe migration — adds institutionType to existing schools
// Run: npx tsx scripts/migrate-institution-type.ts
// ═══════════════════════════════════════════════════════════

import mongoose from 'mongoose'
import { School } from '../src/models/School'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI || ''

async function migrate() {
  console.log('🔄 Starting migration: Add institutionType field')

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in env')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Update all existing schools to 'school' type
    const result = await School.updateMany(
      { institutionType: { $exists: false } },
      { $set: { institutionType: 'school' } }
    )

    console.log(`✅ Updated ${result.modifiedCount} schools`)
    console.log('✅ Migration completed successfully')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

migrate()