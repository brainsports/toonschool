import type { Profile } from '../../../shared/contexts/AuthContext'

export interface Organization {
  id: string
  name: string
  total_licenses: number
  used_licenses: number
  created_at: string
  license_start_date?: string | null
  license_end_date?: string | null
}

export interface LicenseAllocation {
  id: string
  organization_id: string
  from_user_id: string
  to_user_id: string
  quantity: number
  used_quantity: number
  remaining_quantity: number
  status: string
  created_at: string
  updated_at: string
  license_start_date?: string | null
  license_end_date?: string | null
}

export interface LicenseLog {
  id: string
  organization_id: string
  actor_id: string
  target_id: string
  action: string
  quantity_before: number
  quantity_after: number
  changed_quantity: number
  memo: string | null
  created_at: string
}

export interface OrgNotification {
  id: string
  organization_id: string
  sender_id: string
  sender_role: string
  target_type: 'all' | 'specific_teacher' | 'all_students' | 'specific_class' | 'specific_student'
  target_user_id: string | null
  target_teacher_id: string | null
  title: string
  message: string
  priority: 'normal' | 'high'
  created_at: string
  deleted_at?: string | null
}

export interface OrgNotificationRead {
  id: string
  notification_id: string
  user_id: string
  read_at: string
}

export interface OrgTeacher extends Profile {
  allocated_licenses: number
  used_licenses: number
  remaining_licenses: number
  stored_used_licenses?: number
  student_count?: number
  last_login_at?: string
  status: 'active' | 'suspended' | 'inactive'
  assigned_class?: string
  memo?: string
  license_start_date?: string | null
  license_end_date?: string | null
}

export interface OrgDashboardStats {
  orgName: string
  totalLicenses: number
  allocatedLicenses: number
  usedLicenses: number
  remainingLicenses: number
  teacherCount: number
  studentCount: number
  recentNotificationCount: number // (keep for backwards compat if needed, or remove. I will replace it)
  teacherNotificationCount: number
  studentNotificationCount: number
  totalNotificationCount: number
  lastNotificationDate: string | null
  licenseStartDate?: string | null
  licenseEndDate?: string | null
}
