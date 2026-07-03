export interface MiddleDashboardStats {
  totalOrgs: number
  totalLicenses: number
  usedLicenses: number
  remainingLicenses: number
  totalTeachers: number
  totalStudents: number
  totalClasses: number
}

export interface MiddleOrganization {
  id: string
  name: string
  total_licenses: number
  used_licenses: number
  created_at: string
  manager_name?: string
  phone?: string
  status: 'active' | 'inactive'
  
  // Computed fields
  teacher_count: number
  student_count: number
  class_count: number
}

export interface MiddleLicenseAllocation {
  id: string
  organization_id: string
  org_name: string
  quantity: number
  used_quantity: number
  remaining_quantity: number
}

export interface MiddleClass {
  id: string
  organization_id: string
  org_name: string
  grade_level: number
  class_name: string
  teacher_name: string
  student_count: number
  used_licenses: number
  remaining_licenses: number
}

export interface MiddleTeacher {
  id: string
  organization_id: string
  org_name: string
  name: string
  email: string
  class_name: string
  student_count: number
  used_licenses: number
  last_active: string
  status: string
}

export interface MiddleStudent {
  id: string
  organization_id: string
  org_name: string
  name: string
  grade_level: number
  class_name: string
  teacher_name: string
  login_id: string
  status: string
}
