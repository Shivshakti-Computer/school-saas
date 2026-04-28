// FILE: src/lib/moduleRegistry.ts
// ═══════════════════════════════════════════════════════════
// UPDATED: Institution-aware module filtering + franchise support
// School, Academy, Coaching — each gets relevant modules only
// ✅ FIXED: Fee module unified for all institution types
// ✅ REMOVED: coursePayments module (merged into fees)
// ═══════════════════════════════════════════════════════════

import type { InstitutionType } from './institutionConfig'

export type ModuleKey =
  // ── Common to all ──
  | 'students' | 'teachers' | 'attendance' | 'notices'
  | 'website' | 'gallery' | 'reports' | 'communication'
  | 'documents' | 'certificates'
  // ── School-specific ──
  | 'exams' | 'timetable' | 'homework'
  | 'library' | 'lms' | 'hr' | 'transport'
  | 'hostel' | 'inventory' | 'visitor' | 'health' | 'alumni'
  // ── Academy/Coaching-specific ──
  | 'courses' | 'batches' | 'enrollments' | 'franchises'
  | 'assessments' | 'assignments'
  // ── Multi-tenant (all institution types) ──
  | 'fees'
  // ── Internal ──
  | 'studentAttendance'

export type Plan = 'starter' | 'growth' | 'pro' | 'enterprise'
export type Role = 'admin' | 'teacher' | 'staff' | 'student' | 'parent' | 'superadmin'

export interface ModuleConfig {
  label: string
  description: string
  icon: string
  plans: Plan[]
  roles: Role[]
  institutionTypes: InstitutionType[]
  adminRoute?: string
  teacherRoute?: string
  staffRoute?: string
  apiBase: string
  color: string
  isCore: boolean
  comingSoon?: boolean
  staffAssignable?: boolean
}

export const MODULE_REGISTRY: Record<ModuleKey, ModuleConfig> = {

  // ═══════════════════════════════════════════════════════════
  // COMMON MODULES (All Institution Types)
  // ═══════════════════════════════════════════════════════════

  students: {
    label: 'Student Management',
    description: 'Admission, profiles, ID cards, bulk import',
    icon: 'Users',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/students',
    staffRoute: '/admin/students',
    apiBase: '/api/students',
    color: '#534AB7',
    isCore: true,
    staffAssignable: true,
  },

  teachers: {
    label: 'Teachers & Staff',
    description: 'Manage faculty, assign subjects/courses',
    icon: 'UserCheck',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/teachers',
    apiBase: '/api/staff',
    color: '#2563EB',
    isCore: true,
    staffAssignable: false,
  },

  attendance: {
    label: 'Attendance',
    description: 'Daily attendance, reports, SMS alerts',
    icon: 'CheckSquare',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/attendance',
    teacherRoute: '/teacher/attendance',
    staffRoute: '/admin/attendance',
    apiBase: '/api/attendance',
    color: '#1D9E75',
    isCore: true,
    staffAssignable: true,
  },

  notices: {
    label: 'Notice Board',
    description: 'Announcements, circulars, SMS blast',
    icon: 'Bell',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/notices',
    teacherRoute: '/teacher/notices',
    staffRoute: '/admin/notices',
    apiBase: '/api/notices',
    color: '#185FA5',
    isCore: true,
    staffAssignable: true,
  },

  website: {
    label: 'Public Website',
    description: 'Build institution website',
    icon: 'Globe',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/website',
    staffRoute: '/admin/website',
    apiBase: '/api/website',
    color: '#3B6D11',
    isCore: false,
    staffAssignable: true,
  },

  gallery: {
    label: 'Gallery & Events',
    description: 'Photo gallery, event management',
    icon: 'Image',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/gallery',
    staffRoute: '/admin/gallery',
    apiBase: '/api/gallery',
    color: '#E11D48',
    isCore: false,
    staffAssignable: true,
  },

  reports: {
    label: 'Reports & Analytics',
    description: 'Attendance, fee, performance reports',
    icon: 'BarChart2',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/reports',
    staffRoute: '/admin/reports',
    apiBase: '/api/reports',
    color: '#34D399',
    isCore: false,
    staffAssignable: true,
  },

  communication: {
    label: 'Communication',
    description: 'Bulk SMS, WhatsApp, email campaigns',
    icon: 'MessageSquare',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/communication',
    staffRoute: '/admin/communication',
    apiBase: '/api/communication',
    color: '#10B981',
    isCore: false,
    staffAssignable: true,
  },

  documents: {
    label: 'Documents',
    description: 'TC, CC, Bonafide, certificates',
    icon: 'FileCheck',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/documents',
    staffRoute: '/admin/documents',
    apiBase: '/api/documents',
    color: '#475569',
    isCore: false,
    staffAssignable: true,
  },

  certificates: {
    label: 'Certificates',
    description: 'Course completion, merit certificates',
    icon: 'Award',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'],
    adminRoute: '/admin/certificates',
    staffRoute: '/admin/certificates',
    apiBase: '/api/certificates',
    color: '#F59E0B',
    isCore: false,
    staffAssignable: true,
  },

  // ═══════════════════════════════════════════════════════════
  // FEE MANAGEMENT — MULTI-TENANT (All Institution Types)
  // School: Fee Management | Academy/Coaching: Course Payments
  // ═══════════════════════════════════════════════════════════

  fees: {
    label: 'Fee Management', // Dynamic in getSidebarNav
    description: 'Fee structure, online payments, receipts',
    icon: 'CreditCard',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school', 'academy', 'coaching'], // ✅ All types
    adminRoute: '/admin/fees',
    staffRoute: '/admin/fees',
    apiBase: '/api/fees',
    color: '#EF9F27',
    isCore: false,
    staffAssignable: true,
  },

  // ═══════════════════════════════════════════════════════════
  // SCHOOL-ONLY MODULES
  // ═══════════════════════════════════════════════════════════

  exams: {
    label: 'Exam & Results',
    description: 'Exam schedules, marks entry, report cards',
    icon: 'BookOpen',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/exams',
    teacherRoute: '/teacher/marks',
    staffRoute: '/admin/exams',
    apiBase: '/api/exams',
    color: '#D85A30',
    isCore: false,
    staffAssignable: true,
  },

  timetable: {
    label: 'Timetable',
    description: 'Class schedules, period management',
    icon: 'Clock',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/timetable',
    teacherRoute: '/teacher/timetable',
    staffRoute: '/admin/timetable',
    apiBase: '/api/timetable',
    color: '#0891B2',
    isCore: false,
    staffAssignable: true,
  },

  homework: {
    label: 'Homework',
    description: 'Assign, submit, grade homework',
    icon: 'FileText',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff', 'student', 'parent'],
    institutionTypes: ['school'],
    adminRoute: '/admin/homework',
    teacherRoute: '/teacher/homework',
    staffRoute: '/admin/homework',
    apiBase: '/api/homework',
    color: '#6366F1',
    isCore: false,
    staffAssignable: true,
  },

  library: {
    label: 'Library',
    description: 'Book management, issue tracking',
    icon: 'Library',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/library',
    staffRoute: '/admin/library',
    apiBase: '/api/library',
    color: '#FB923C',
    isCore: false,
    staffAssignable: true,
  },

  lms: {
    label: 'Online Learning',
    description: 'Video lessons, online classes',
    icon: 'PlayCircle',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'teacher', 'student', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/lms',
    teacherRoute: '/teacher/lms',
    staffRoute: '/admin/lms',
    apiBase: '/api/lms',
    color: '#993556',
    isCore: false,
    staffAssignable: true,
  },

  hr: {
    label: 'HR & Payroll',
    description: 'Staff salary, leaves, payslips',
    icon: 'Briefcase',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/hr',
    staffRoute: '/admin/hr',
    apiBase: '/api/hr',
    color: '#F87171',
    isCore: false,
    staffAssignable: true,
  },

  transport: {
    label: 'Transport',
    description: 'Bus routes, GPS tracking',
    icon: 'Bus',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/transport',
    staffRoute: '/admin/transport',
    apiBase: '/api/transport',
    color: '#185FA5',
    isCore: false,
    staffAssignable: true,
  },

  hostel: {
    label: 'Hostel',
    description: 'Room allotment, mess management',
    icon: 'Building',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/hostel',
    staffRoute: '/admin/hostel',
    apiBase: '/api/hostel',
    color: '#5F5E5A',
    isCore: false,
    staffAssignable: true,
  },

  inventory: {
    label: 'Inventory',
    description: 'Assets, supplies tracking',
    icon: 'Package',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/inventory',
    staffRoute: '/admin/inventory',
    apiBase: '/api/inventory',
    color: '#78716C',
    isCore: false,
    staffAssignable: true,
  },

  visitor: {
    label: 'Visitor Management',
    description: 'Gate pass, visitor logs',
    icon: 'UserPlus',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/visitor',
    staffRoute: '/admin/visitor',
    apiBase: '/api/visitor',
    color: '#0EA5E9',
    isCore: false,
    staffAssignable: true,
  },

  health: {
    label: 'Health Records',
    description: 'Student medical history',
    icon: 'Heart',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/health',
    staffRoute: '/admin/health',
    apiBase: '/api/health',
    color: '#EF4444',
    isCore: false,
    staffAssignable: true,
  },

  alumni: {
    label: 'Alumni Network',
    description: 'Alumni directory, events',
    icon: 'GraduationCap',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['school'],
    adminRoute: '/admin/alumni',
    staffRoute: '/admin/alumni',
    apiBase: '/api/alumni',
    color: '#8B5CF6',
    isCore: false,
    staffAssignable: true,
  },

  // ═══════════════════════════════════════════════════════════
  // ACADEMY/COACHING-ONLY MODULES
  // ═══════════════════════════════════════════════════════════

  courses: {
    label: 'Courses',
    description: 'Course catalog, syllabus, pricing',
    icon: 'BookOpen',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['academy', 'coaching'],
    adminRoute: '/admin/courses',
    staffRoute: '/admin/courses',
    apiBase: '/api/courses',
    color: '#3B82F6',
    isCore: true,
    staffAssignable: true,
  },

  batches: {
    label: 'Batches',
    description: 'Batch scheduling, instructor assignment',
    icon: 'Users',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['academy', 'coaching'],
    adminRoute: '/admin/batches',
    staffRoute: '/admin/batches',
    apiBase: '/api/batches',
    color: '#8B5CF6',
    isCore: true,
    staffAssignable: true,
  },

  enrollments: {
    label: 'Enrollments',
    description: 'Student course enrollments, progress tracking',
    icon: 'UserCheck',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    institutionTypes: ['academy', 'coaching'],
    adminRoute: '/admin/enrollments',
    staffRoute: '/admin/enrollments',
    apiBase: '/api/enrollments',
    color: '#10B981',
    isCore: true,
    staffAssignable: true,
  },

  franchises: {
    label: 'Franchises',
    description: 'Franchise network, location management',
    icon: 'MapPin',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin'],
    institutionTypes: ['academy', 'coaching'],
    adminRoute: '/admin/franchises',
    apiBase: '/api/franchises',
    color: '#F59E0B',
    isCore: false,
    staffAssignable: false,
  },

  assessments: {
    label: 'Assessments',
    description: 'Tests, quizzes, mock exams',
    icon: 'FileText',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    institutionTypes: ['academy', 'coaching'],
    adminRoute: '/admin/assessments',
    teacherRoute: '/teacher/assessments',
    staffRoute: '/admin/assessments',
    apiBase: '/api/assessments',
    color: '#EF4444',
    isCore: false,
    staffAssignable: true,
  },

  assignments: {
    label: 'Assignments',
    description: 'Homework, practice tasks',
    icon: 'Edit',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff', 'student', 'parent'],
    institutionTypes: ['academy', 'coaching'],
    adminRoute: '/admin/assignments',
    teacherRoute: '/teacher/assignments',
    staffRoute: '/admin/assignments',
    apiBase: '/api/assignments',
    color: '#6366F1',
    isCore: false,
    staffAssignable: true,
  },

  // ─── Internal ───
  studentAttendance: {
    label: 'Attendance',
    description: 'View my attendance',
    icon: 'CheckSquare',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['student'],
    institutionTypes: ['school', 'academy', 'coaching'],
    apiBase: '/api/student/attendance',
    color: '#059669',
    isCore: true,
    staffAssignable: false,
  },
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — UPDATED
// ═══════════════════════════════════════════════════════════

/**
 * Check if module is valid for institution type
 */
export function isModuleValidForInstitution(
  moduleKey: ModuleKey,
  institutionType: InstitutionType
): boolean {
  const mod = MODULE_REGISTRY[moduleKey]
  if (!mod) return false
  return mod.institutionTypes.includes(institutionType)
}

/**
 * Filter enabled modules by institution type
 * Runtime safety: DB mein galat modules hain to unhe filter karo
 */
export function filterModulesByInstitution(
  enabledModules: string[],
  institutionType: InstitutionType
): string[] {
  return enabledModules.filter(key => {
    const mod = MODULE_REGISTRY[key as ModuleKey]
    if (!mod) return false
    return mod.institutionTypes.includes(institutionType)
  })
}

/**
 * Get modules for user with institution type filtering
 */
export function getModulesForUser(
  enabledModules: ModuleKey[],
  plan: Plan,
  role: Role,
  institutionType: InstitutionType
): Array<{ key: ModuleKey } & ModuleConfig> {
  return Object.entries(MODULE_REGISTRY)
    .filter(([key, mod]) => {
      const k = key as ModuleKey
      return (
        (enabledModules.includes(k) || mod.isCore) &&
        mod.plans.includes(plan) &&
        mod.roles.includes(role) &&
        mod.institutionTypes.includes(institutionType)
      )
    })
    .map(([key, mod]) => ({ key: key as ModuleKey, ...mod }))
}

/**
 * Get staff assignable modules for institution type
 */
export function getStaffAssignableModules(
  enabledModules: string[],
  plan: string,
  institutionType: InstitutionType
): Array<{ key: ModuleKey; label: string; icon: string; description: string; color: string }> {
  return Object.entries(MODULE_REGISTRY)
    .filter(([key, mod]) => {
      return (
        mod.staffAssignable &&
        (enabledModules.includes(key) || mod.isCore) &&
        mod.plans.includes(plan as Plan) &&
        mod.institutionTypes.includes(institutionType) &&
        !mod.comingSoon
      )
    })
    .map(([key, mod]) => {
      // Dynamic label for fees module
      let label = mod.label
      if (key === 'fees') {
        label = institutionType === 'school' ? 'Fee Management' : 'Course Payments'
      }

      return {
        key: key as ModuleKey,
        label,
        icon: mod.icon,
        description: mod.description,
        color: mod.color,
      }
    })
}

/**
 * Get sidebar navigation with dynamic labels
 * ✅ UPDATED: Dynamic label for fees module based on institution type
 */
export function getSidebarNav(
  enabledModules: string[],
  plan: string,
  role: string,
  institutionType: InstitutionType,
  staffAllowedModules?: string[],
  isTrial: boolean = false
) {
  // Runtime safety: DB mein galat modules hain to filter karo
  const safeEnabledModules = filterModulesByInstitution(
    enabledModules,
    institutionType
  )

  if (role === 'admin') {
    return Object.entries(MODULE_REGISTRY)
      .filter(([key, mod]) => {
        if (!mod.institutionTypes.includes(institutionType)) return false
        if (!mod.roles.includes('admin')) return false
        if (mod.comingSoon) return false

        if (isTrial) {
          return safeEnabledModules.includes(key) || mod.isCore
        }

        return (
          (safeEnabledModules.includes(key) || mod.isCore) &&
          mod.plans.includes(plan as Plan)
        )
      })
      .map(([key, mod]) => {
        // ✅ Dynamic label for fees module
        let label = mod.label
        if (key === 'fees') {
          label = institutionType === 'school' ? 'Fee Management' : 'Course Payments'
        }

        return {
          key,
          label,
          icon: mod.icon,
          href: mod.adminRoute,
          color: mod.color,
        }
      })
      .filter(item => item.href)
  }

  if (role === 'staff') {
    const allowed = (staffAllowedModules || []).filter(m => {
      const mod = MODULE_REGISTRY[m as ModuleKey]
      return mod?.institutionTypes.includes(institutionType)
    })

    if (allowed.length === 0) return []

    return Object.entries(MODULE_REGISTRY)
      .filter(([key, mod]) => {
        if (!mod.institutionTypes.includes(institutionType)) return false
        if (!mod.roles.includes('staff')) return false
        if (mod.comingSoon) return false
        if (!allowed.includes(key)) return false

        if (isTrial) {
          return safeEnabledModules.includes(key) || mod.isCore
        }

        return (
          (safeEnabledModules.includes(key) || mod.isCore) &&
          mod.plans.includes(plan as Plan)
        )
      })
      .map(([key, mod]) => {
        // ✅ Dynamic label for fees module
        let label = mod.label
        if (key === 'fees') {
          label = institutionType === 'school' ? 'Fee Management' : 'Course Payments'
        }

        return {
          key,
          label,
          icon: mod.icon,
          href: mod.staffRoute || mod.adminRoute,
          color: mod.color,
        }
      })
      .filter(item => item.href)
  }

  if (role === 'teacher') {
    return Object.entries(MODULE_REGISTRY)
      .filter(([key, mod]) => {
        if (!mod.institutionTypes.includes(institutionType)) return false
        if (!mod.roles.includes('teacher')) return false
        if (mod.comingSoon) return false

        if (isTrial) {
          return safeEnabledModules.includes(key) || mod.isCore
        }

        return (
          (safeEnabledModules.includes(key) || mod.isCore) &&
          mod.plans.includes(plan as Plan)
        )
      })
      .map(([key, mod]) => ({
        key,
        label: mod.label,
        icon: mod.icon,
        href: mod.teacherRoute || mod.adminRoute,
        color: mod.color,
      }))
      .filter(item => item.href)
  }

  // Student
  if (role === 'student') {
    if (institutionType === 'school') {
      const baseItems = [
        { key: 'attendance', label: 'Attendance', icon: 'CheckSquare', href: '/student/attendance', color: '#059669' },
        { key: 'admitcard', label: 'Admit Card', icon: 'BookOpen', href: '/student/exams', color: '#ba0f0c' },
        { key: 'results', label: 'Exam Results', icon: 'BarChart2', href: '/student/results', color: '#2563EB' },
        { key: 'fees', label: 'Fees', icon: 'CreditCard', href: '/student/fees', color: '#D97706' },
        { key: 'notices', label: 'Notices', icon: 'Bell', href: '/student/notices', color: '#7C3AED' },
      ]

      const homeworkAllowed = isTrial
        ? safeEnabledModules.includes('homework')
        : MODULE_REGISTRY.homework.plans.includes(plan as Plan) && safeEnabledModules.includes('homework')

      if (homeworkAllowed) {
        baseItems.splice(3, 0, {
          key: 'homework', label: 'Homework', icon: 'FileText', href: '/student/homework', color: '#6366F1',
        })
      }

      baseItems.push({
        key: 'profile', label: 'My Profile', icon: 'User', href: '/student/profile', color: '#6B7280',
      })

      return baseItems
    }

    // Academy/Coaching student
    if (institutionType === 'academy' || institutionType === 'coaching') {
      return [
        { key: 'attendance', label: 'Attendance', icon: 'CheckSquare', href: '/student/attendance', color: '#059669' },
        { key: 'courses', label: 'My Courses', icon: 'BookOpen', href: '/student/courses', color: '#3B82F6' },
        { key: 'batch', label: 'My Batch', icon: 'Users', href: '/student/batch', color: '#8B5CF6' },
        { key: 'fees', label: 'Course Fees', icon: 'CreditCard', href: '/student/fees', color: '#F97316' },
        { key: 'notices', label: 'Notices', icon: 'Bell', href: '/student/notices', color: '#7C3AED' },
        { key: 'profile', label: 'My Profile', icon: 'User', href: '/student/profile', color: '#6B7280' },
      ]
    }
  }

  // Parent
  if (role === 'parent') {
    if (institutionType === 'school') {
      const baseItems = [
        { key: 'attendance', label: 'Attendance', icon: 'CheckSquare', href: '/parent/attendance', color: '#059669' },
        { key: 'admitcard', label: 'Admit Card', icon: 'BookOpen', href: '/parent/exams', color: '#ba0f0c' },
        { key: 'fees', label: 'Fee Payment', icon: 'CreditCard', href: '/parent/fees', color: '#D97706' },
        { key: 'results', label: 'Results', icon: 'BarChart2', href: '/parent/results', color: '#2563EB' },
      ]

      const homeworkAllowed = isTrial
        ? safeEnabledModules.includes('homework')
        : MODULE_REGISTRY.homework.plans.includes(plan as Plan) && safeEnabledModules.includes('homework')

      if (homeworkAllowed) {
        baseItems.splice(4, 0, {
          key: 'homework', label: 'Homework', icon: 'FileText', href: '/parent/homework', color: '#6366F1',
        })
      }

      baseItems.push({
        key: 'notices', label: 'Notices', icon: 'Bell', href: '/parent/notices', color: '#7C3AED',
      })

      return baseItems
    }

    // Academy/Coaching parent
    if (institutionType === 'academy' || institutionType === 'coaching') {
      return [
        { key: 'attendance', label: 'Attendance', icon: 'CheckSquare', href: '/parent/attendance', color: '#059669' },
        { key: 'fees', label: 'Fee Payment', icon: 'CreditCard', href: '/parent/fees', color: '#F97316' },
        { key: 'notices', label: 'Notices', icon: 'Bell', href: '/parent/notices', color: '#7C3AED' },
      ]
    }
  }

  return []
}