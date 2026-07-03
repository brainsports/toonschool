import type { Profile } from '../../../shared/contexts/AuthContext'

export interface Organization {
  id: string
  name: string
  total_licenses: number
  used_licenses: number
  created_at: string
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
  last_login_at?: string
  status: 'active' | 'suspended' | 'inactive'
  assigned_class?: string
  memo?: string
}

export interface OrgDashboardStats {
  orgName: string
  totalLicenses: number
  allocatedLicenses: number
  usedLicenses: number
  remainingLicenses: number
  teacherCount: number
  studentCount: number
  recentNotificationCount: number
}
