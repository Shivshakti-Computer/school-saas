// FILE: scripts/seed-demo.ts
// Run: npx tsx scripts/seed-demo.ts

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

async function seedDemo() {
  console.log('🔄 Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI!)

  const db = mongoose.connection.db!

  // Check if demo exists
  const existing = await db.collection('schools').findOne({ subdomain: 'demo_school' })
  if (existing) {
    console.log('⚠️  Demo school already exists!')
    console.log('📋 Credentials:')
    console.log('   School Code: demo_school')
    console.log('   Admin Phone: 9999999999')
    console.log('   Password:    Demo@123')
    await mongoose.disconnect()
    return
  }

  // Trial that never expires
  const trialEndsAt = new Date()
  trialEndsAt.setFullYear(trialEndsAt.getFullYear() + 100)

  const allModules = [
    'students', 'teachers', 'attendance', 'notices',
    'website', 'gallery', 'fees', 'exams', 'timetable',
    'homework', 'documents', 'reports', 'communication',
    'library', 'certificates', 'lms',
    'hr', 'transport', 'hostel',
    'inventory', 'visitor', 'health', 'alumni',
  ]

  // 1. Create School
  console.log('🏫 Creating demo school...')
  const schoolResult = await db.collection('schools').insertOne({
    name: 'Demo School - Skolify',
    subdomain: 'demo_school',
    address: 'Demo City, India',
    phone: '9999999999',
    email: 'demo@skolify.in',
    plan: 'enterprise',
    trialEndsAt,
    subscriptionId: 'demo',
    modules: allModules,
    isActive: true,
    onboardingComplete: true,
    theme: { primary: '#534AB7', secondary: '#1D9E75' },
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const schoolId = schoolResult.insertedId

  // 2. Create Admin
  console.log('👤 Creating admin user...')
  const adminPwd = await bcrypt.hash('Demo@123', 12)
  await db.collection('users').insertOne({
    tenantId: schoolId,
    name: 'Demo Admin',
    phone: '9999999999',
    email: 'demo@skolify.in',
    role: 'admin',
    password: adminPwd,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 3. Create Subscription
  console.log('💳 Creating subscription...')
  await db.collection('subscriptions').insertOne({
    tenantId: schoolId,
    razorpaySubId: `demo_${Date.now()}`,
    razorpayCustomerId: 'demo',
    plan: 'enterprise',
    billingCycle: 'yearly',
    amount: 0,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: trialEndsAt,
    isDemo: true,
    paymentHistory: [],
    refundHistory: [],
    invoiceCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 4. Create Teacher
  console.log('👩‍🏫 Creating demo teacher...')
  const teacherPwd = await bcrypt.hash('Teacher@123', 12)
  await db.collection('users').insertOne({
    tenantId: schoolId,
    name: 'Demo Teacher',
    phone: '9999999998',
    role: 'teacher',
    password: teacherPwd,
    isActive: true,
    subjects: ['Mathematics', 'Science'],
    class: '10',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // 5. Create Sample Students
  console.log('👨‍🎓 Creating sample students...')
  const studentPwd = await bcrypt.hash('Student@123', 10)
  const parentPwd = await bcrypt.hash('Parent@123', 10)

  const students = [
    { name: 'Rahul Kumar', cls: '10', sec: 'A', father: 'Ram Kumar', ph: '9100000001', pph: '9200000001', g: 'male' },
    { name: 'Priya Sharma', cls: '10', sec: 'A', father: 'Suresh Sharma', ph: '9100000002', pph: '9200000002', g: 'female' },
    { name: 'Amit Singh', cls: '9', sec: 'A', father: 'Rajesh Singh', ph: '9100000003', pph: '9200000003', g: 'male' },
    { name: 'Neha Gupta', cls: '9', sec: 'B', father: 'Manoj Gupta', ph: '9100000004', pph: '9200000004', g: 'female' },
    { name: 'Vikash Yadav', cls: '8', sec: 'A', father: 'Sunil Yadav', ph: '9100000005', pph: '9200000005', g: 'male' },
  ]

  for (let i = 0; i < students.length; i++) {
    const s = students[i]

    // Student user
    const stuResult = await db.collection('users').insertOne({
      tenantId: schoolId,
      name: s.name,
      phone: s.ph,
      role: 'student',
      password: studentPwd,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Student record
    await db.collection('students').insertOne({
      tenantId: schoolId,
      userId: stuResult.insertedId,
      admissionNo: `DEMO2025${String(i + 1).padStart(4, '0')}`,
      rollNo: String(i + 1),
      class: s.cls,
      section: s.sec,
      fatherName: s.father,
      parentPhone: s.pph,
      gender: s.g,
      address: 'Demo Address, Demo City',
      dateOfBirth: new Date(2012, i, (i + 1) * 5),
      admissionDate: new Date(2024, 3, 1),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Parent user
    await db.collection('users').insertOne({
      tenantId: schoolId,
      name: `${s.father} (Parent)`,
      phone: s.pph,
      role: 'parent',
      password: parentPwd,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  console.log('')
  console.log('✅ Demo school created successfully!')
  console.log('')
  console.log('┌──────────────────────────────────────────┐')
  console.log('│         DEMO LOGIN CREDENTIALS           │')
  console.log('├──────────┬───────────────┬────────────────┤')
  console.log('│ Role     │ Phone         │ Password       │')
  console.log('├──────────┼───────────────┼────────────────┤')
  console.log('│ Admin    │ 9999999999    │ Demo@123       │')
  console.log('│ Teacher  │ 9999999998    │ Teacher@123    │')
  console.log('│ Student  │ 9100000001    │ Student@123    │')
  console.log('│ Parent   │ 9200000001    │ Parent@123     │')
  console.log('├──────────┴───────────────┴────────────────┤')
  console.log('│ School Code: demo_school                  │')
  console.log('│ Plan: Enterprise (never expires)          │')
  console.log('└──────────────────────────────────────────┘')

  await mongoose.disconnect()
}

seedDemo().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})