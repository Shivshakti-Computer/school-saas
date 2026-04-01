// FILE: src/lib/moduleRegistry.ts
// COMPLETE — Staff role support + staffRoute + staffAssignable

export type ModuleKey =
  | 'students' | 'teachers' | 'attendance' | 'fees' | 'exams'
  | 'notices' | 'website' | 'library' | 'hr'
  | 'transport' | 'hostel' | 'lms' | 'reports'
  | 'gallery' | 'timetable' | 'homework' | 'documents'
  | 'certificates' | 'communication'
  | 'inventory' | 'visitor' | 'health' | 'alumni'
  | 'studentAttendance'

export type Plan = 'starter' | 'growth' | 'pro' | 'enterprise'
export type Role = 'admin' | 'teacher' | 'staff' | 'student' | 'parent' | 'superadmin'

export interface ModuleConfig {
  label: string
  description: string
  icon: string
  plans: Plan[]
  roles: Role[]
  adminRoute?: string
  teacherRoute?: string
  staffRoute?: string          // ← ADDED
  apiBase: string
  color: string
  isCore: boolean
  comingSoon?: boolean
  staffAssignable?: boolean    // ← Can admin assign this module to staff?
}

export const MODULE_REGISTRY: Record<ModuleKey, ModuleConfig> = {

  // ─── CORE (all plans) ───
  students: {
    label: 'Student Management',
    description: 'Admission, profiles, ID cards, bulk import',
    icon: 'Users',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/students',
    staffRoute: '/admin/students',
    apiBase: '/api/students',
    color: '#534AB7',
    isCore: true,
    staffAssignable: true,
  },
  teachers: {
    label: 'Teachers & Staff',
    description: 'Manage teachers, assign subjects and classes',
    icon: 'UserCheck',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin'],
    adminRoute: '/admin/teachers',
    apiBase: '/api/staff',
    color: '#2563EB',
    isCore: true,
    staffAssignable: false,
  },
  attendance: {
    label: 'Attendance',
    description: 'Daily attendance, reports, parent SMS',
    icon: 'CheckSquare',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
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
    description: 'Notices, circulars, SMS blast',
    icon: 'Bell',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    adminRoute: '/admin/notices',
    staffRoute: '/admin/notices',
    apiBase: '/api/notices',
    color: '#185FA5',
    isCore: true,
    staffAssignable: true,
  },
  website: {
    label: 'School Website',
    description: 'Build your school\'s public website',
    icon: 'Globe',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/website',
    staffRoute: '/admin/website',
    apiBase: '/api/website',
    color: '#3B6D11',
    isCore: false,
    staffAssignable: true,
  },

  // ─── STARTER+ ───
  gallery: {
    label: 'Gallery & Events',
    description: 'Photo gallery, event management',
    icon: 'Image',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/gallery',
    staffRoute: '/admin/gallery',
    apiBase: '/api/gallery',
    color: '#E11D48',
    isCore: false,
    staffAssignable: true,
  },

  // ─── GROWTH+ ───
  fees: {
    label: 'Fee Management',
    description: 'Online payments, receipts, reminders',
    icon: 'CreditCard',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/fees',
    staffRoute: '/admin/fees',
    apiBase: '/api/fees',
    color: '#EF9F27',
    isCore: false,
    staffAssignable: true,
  },
  exams: {
    label: 'Exam & Results',
    description: 'Schedules, marks entry, grade cards',
    icon: 'BookOpen',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
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
    adminRoute: '/admin/timetable',
    staffRoute: '/admin/timetable',
    apiBase: '/api/timetable',
    color: '#0891B2',
    isCore: false,
    staffAssignable: true,
  },
  homework: {
    label: 'Homework & Assignments',
    description: 'Assign, submit, grade homework',
    icon: 'FileText',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'teacher', 'staff'],
    adminRoute: '/admin/homework',
    teacherRoute: '/teacher/homework',
    staffRoute: '/admin/homework',
    apiBase: '/api/homework',
    color: '#6366F1',
    isCore: false,
    staffAssignable: true,
  },
  documents: {
    label: 'Documents',
    description: 'TC, CC, Bonafide, custom documents',
    icon: 'FileCheck',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/documents',
    staffRoute: '/admin/documents',
    apiBase: '/api/documents',
    color: '#475569',
    isCore: false,
    staffAssignable: true,
  },
  reports: {
    label: 'Reports',
    description: 'Attendance, fee, exam reports & analytics',
    icon: 'BarChart2',
    plans: ['growth', 'pro', 'enterprise'],
    roles: ['admin', 'staff'],
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
    adminRoute: '/admin/communication',
    staffRoute: '/admin/communication',
    apiBase: '/api/communication',
    color: '#10B981',
    isCore: false,
    staffAssignable: true,
  },

  // ─── PRO+ ───
  library: {
    label: 'Library',
    description: 'Book catalogue and issue management',
    icon: 'Library',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/library',
    staffRoute: '/admin/library',
    apiBase: '/api/library',
    color: '#FB923C',
    isCore: false,
    staffAssignable: true,
  },
  certificates: {
    label: 'Certificates',
    description: 'Custom certificates, merit awards',
    icon: 'Award',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/certificates',
    staffRoute: '/admin/certificates',
    apiBase: '/api/certificates',
    color: '#F59E0B',
    isCore: false,
    staffAssignable: true,
  },
  lms: {
    label: 'Online Learning',
    description: 'Video lessons, assignments, quizzes',
    icon: 'PlayCircle',
    plans: ['pro', 'enterprise'],
    roles: ['admin', 'teacher', 'student', 'staff'],
    adminRoute: '/admin/lms',
    teacherRoute: '/teacher/lms',
    staffRoute: '/admin/lms',
    apiBase: '/api/lms',
    color: '#993556',
    isCore: false,
    staffAssignable: true,
  },

  // ─── ENTERPRISE ONLY ───
  hr: {
    label: 'HR & Payroll',
    description: 'Staff salary, leaves, payslips',
    icon: 'Briefcase',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/hr',
    staffRoute: '/admin/hr',
    apiBase: '/api/hr',
    color: '#F87171',
    isCore: false,
    staffAssignable: true,
  },
  transport: {
    label: 'Transport',
    description: 'Bus routes, GPS tracking, alerts',
    icon: 'Bus',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/transport',
    staffRoute: '/admin/transport',
    apiBase: '/api/transport',
    color: '#185FA5',
    isCore: false,
    staffAssignable: true,
  },
  hostel: {
    label: 'Hostel',
    description: 'Room allotment, mess, warden portal',
    icon: 'Building',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/hostel',
    staffRoute: '/admin/hostel',
    apiBase: '/api/hostel',
    color: '#5F5E5A',
    isCore: false,
    staffAssignable: true,
  },
  inventory: {
    label: 'Inventory',
    description: 'School assets, supplies tracking',
    icon: 'Package',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/inventory',
    staffRoute: '/admin/inventory',
    apiBase: '/api/inventory',
    color: '#78716C',
    isCore: false,
    staffAssignable: true,
  },
  visitor: {
    label: 'Visitor Management',
    description: 'Gate pass, visitor logs, approvals',
    icon: 'UserPlus',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/visitor',
    staffRoute: '/admin/visitor',
    apiBase: '/api/visitor',
    color: '#0EA5E9',
    isCore: false,
    staffAssignable: true,
  },
  health: {
    label: 'Health Records',
    description: 'Student health tracking, medical history',
    icon: 'Heart',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/health',
    staffRoute: '/admin/health',
    apiBase: '/api/health',
    color: '#EF4444',
    isCore: false,
    staffAssignable: true,
  },
  alumni: {
    label: 'Alumni Network',
    description: 'Alumni directory, events, donations',
    icon: 'GraduationCap',
    plans: ['enterprise'],
    roles: ['admin', 'staff'],
    adminRoute: '/admin/alumni',
    staffRoute: '/admin/alumni',
    apiBase: '/api/alumni',
    color: '#8B5CF6',
    isCore: false,
    staffAssignable: true,
  },

  // ─── Student-specific (internal) ───
  studentAttendance: {
    label: 'Attendance',
    description: 'Apni attendance dekho',
    icon: 'CheckSquare',
    plans: ['starter', 'growth', 'pro', 'enterprise'],
    roles: ['student'],
    apiBase: '/api/student/attendance',
    color: '#059669',
    isCore: true,
    staffAssignable: false,
  },
}

// ─── UTILITY FUNCTIONS ───

export function getModulesForUser(
  enabledModules: ModuleKey[],
  plan: Plan,
  role: Role
): Array<{ key: ModuleKey } & ModuleConfig> {
  return Object.entries(MODULE_REGISTRY)
    .filter(([key, mod]) => {
      const k = key as ModuleKey
      return (
        (enabledModules.includes(k) || mod.isCore) &&
        mod.plans.includes(plan) &&
        mod.roles.includes(role)
      )
    })
    .map(([key, mod]) => ({ key: key as ModuleKey, ...mod }))
}

// ── Get modules assignable to staff ──
export function getStaffAssignableModules(
  enabledModules: string[],
  plan: string
): Array<{ key: ModuleKey; label: string; icon: string; description: string; color: string }> {
  return Object.entries(MODULE_REGISTRY)
    .filter(([key, mod]) => {
      return (
        mod.staffAssignable &&
        (enabledModules.includes(key) || mod.isCore) &&
        mod.plans.includes(plan as Plan) &&
        !mod.comingSoon
      )
    })
    .map(([key, mod]) => ({
      key: key as ModuleKey,
      label: mod.label,
      icon: mod.icon,
      description: mod.description,
      color: mod.color,
    }))
}

// ── getSidebarNav — handles admin, staff, teacher, student, parent ──
export function getSidebarNav(
  enabledModules: string[],
  plan: string,
  role: string,
  staffAllowedModules?: string[]
) {
  if (role === 'admin') {
    return Object.entries(MODULE_REGISTRY)
      .filter(([key, mod]) => {
        return (
          (enabledModules.includes(key) || mod.isCore) &&
          mod.plans.includes(plan as Plan) &&
          mod.roles.includes('admin') &&
          !mod.comingSoon
        )
      })
      .map(([key, mod]) => ({
        key,
        label: mod.label,
        icon: mod.icon,
        href: mod.adminRoute,
        color: mod.color,
      }))
      .filter(item => item.href)
  }

  // ── Staff role — only show allowed modules ──
  if (role === 'staff') {
    const allowed = staffAllowedModules || []

    if (allowed.length === 0) {
      return []
    }

    return Object.entries(MODULE_REGISTRY)
      .filter(([key, mod]) => {
        return (
          allowed.includes(key) &&
          (enabledModules.includes(key) || mod.isCore) &&
          mod.plans.includes(plan as Plan) &&
          mod.roles.includes('staff') &&
          !mod.comingSoon
        )
      })
      .map(([key, mod]) => ({
        key,
        label: mod.label,
        icon: mod.icon,
        href: mod.staffRoute || mod.adminRoute,
        color: mod.color,
      }))
      .filter(item => item.href)
  }

  if (role === 'teacher') {
    return Object.entries(MODULE_REGISTRY)
      .filter(([key, mod]) => {
        return (
          (enabledModules.includes(key) || mod.isCore) &&
          mod.plans.includes(plan as Plan) &&
          mod.roles.includes('teacher') &&
          !mod.comingSoon
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

  if (role === 'student') {
    return [
      { key: 'attendance', label: 'Attendance', icon: 'CheckSquare', href: '/student/attendance', color: '#059669' },
      { key: 'results', label: 'Exam Results', icon: 'BookOpen', href: '/student/results', color: '#2563EB' },
      { key: 'fees', label: 'Fees', icon: 'CreditCard', href: '/student/fees', color: '#D97706' },
      { key: 'notices', label: 'Notices', icon: 'Bell', href: '/student/notices', color: '#7C3AED' },
      { key: 'profile', label: 'My Profile', icon: 'User', href: '/student/profile', color: '#6B7280' },
    ]
  }

  if (role === 'parent') {
    return [
      { key: 'attendance', label: 'Attendance', icon: 'CheckSquare', href: '/parent/attendance', color: '#059669' },
      { key: 'fees', label: 'Fee Payment', icon: 'CreditCard', href: '/parent/fees', color: '#D97706' },
      { key: 'results', label: 'Results', icon: 'BookOpen', href: '/parent/results', color: '#2563EB' },
      { key: 'notices', label: 'Notices', icon: 'Bell', href: '/parent/notices', color: '#7C3AED' },
    ]
  }

  return []
}