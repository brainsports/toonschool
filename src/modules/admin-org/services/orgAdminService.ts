import { supabase } from '../../../shared/lib/supabase'
import type {
  OrgNotification,
  OrgTeacher,
  OrgDashboardStats
} from '../types/orgAdmin'

export const orgAdminService = {
  // --- Dashboard ---
  async getOrgAdminDashboard(orgId: string): Promise<OrgDashboardStats> {
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError) throw orgError

    const { count: teacherCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'teacher')

    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'student')

    const { data: notifications } = await supabase
      .from('org_notifications')
      .select('target_type, created_at')
      .eq('organization_id', orgId)
      .is('deleted_at', null)

    let teacherNotis = 0
    let studentNotis = 0
    let lastDate: string | null = null

    if (notifications) {
      notifications.forEach(n => {
        if (['all', 'specific_teacher', 'all_teachers'].includes(n.target_type)) {
          teacherNotis++
        } else {
          studentNotis++
        }
        if (!lastDate || new Date(n.created_at) > new Date(lastDate)) {
          lastDate = n.created_at
        }
      })
    }

    // 배정된 전체 이용권 수는 license_allocations에서 합산 (간이 구현)
    const { data: allocations } = await supabase
      .from('license_allocations')
      .select('quantity, used_quantity')
      .eq('organization_id', orgId)

    const allocatedLicenses = allocations?.reduce((acc, curr) => acc + curr.quantity, 0) || 0
    const usedLicenses = allocations?.reduce((acc, curr) => acc + curr.used_quantity, 0) || 0

    return {
      orgName: orgData.name,
      totalLicenses: orgData.total_licenses,
      allocatedLicenses,
      usedLicenses,
      remainingLicenses: orgData.total_licenses - allocatedLicenses,
      teacherCount: teacherCount || 0,
      studentCount: studentCount || 0,
      recentNotificationCount: (teacherNotis + studentNotis),
      teacherNotificationCount: teacherNotis,
      studentNotificationCount: studentNotis,
      totalNotificationCount: (teacherNotis + studentNotis),
      lastNotificationDate: lastDate,
      licenseStartDate: orgData.license_start_date,
      licenseEndDate: orgData.license_end_date
    }
  },

  // --- Teachers ---
  async getOrgTeachers(orgId: string): Promise<OrgTeacher[]> {
    // 1. Get teachers
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', orgId)
      .eq('role', 'teacher')

    if (profilesError) throw profilesError

    // 2. Get allocations for these teachers
    const { data: allocations } = await supabase
      .from('license_allocations')
      .select('*')
      .eq('organization_id', orgId)

    return profiles.map((p) => {
      const allocation = allocations?.find((a) => a.to_user_id === p.id)
      return {
        ...p,
        allocated_licenses: allocation?.quantity || 0,
        used_licenses: allocation?.used_quantity || 0,
        remaining_licenses: (allocation?.quantity || 0) - (allocation?.used_quantity || 0),
        status: 'active', // TODO: Get actual status if added to profiles
        assigned_class: p.center_id, // temporarily use center_id for class or similar mapping if exist
        license_start_date: allocation?.license_start_date,
        license_end_date: allocation?.license_end_date
      } as OrgTeacher
    })
  },

  async createTeacherForOrg(orgId: string, adminId: string, data: { name: string; email: string; assigned_class: string; initial_licenses: number; memo: string; license_start_date?: string; license_end_date?: string }): Promise<void> {
    // Check organization license dates first
    const orgStats = await this.getOrgAdminDashboard(orgId)
    if (data.license_end_date && orgStats.licenseEndDate) {
      if (new Date(data.license_end_date) > new Date(orgStats.licenseEndDate)) {
        throw new Error(`선생님 이용권 종료일은 기관 이용권 종료일(${orgStats.licenseEndDate.split('T')[0]})을 넘을 수 없습니다.`)
      }
    }
    
    // 1. Create User via Auth Admin (Note: In actual app, we need backend edge function to create user)
    // Here we'll simulate creating profile directly or use an edge function
    // Assuming backend handles auth creation, for MVP we just insert to profiles and simulate auth
    const fakeId = crypto.randomUUID()
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: fakeId,
        email: data.email,
        name: data.name,
        role: 'teacher',
        organization_id: orgId,
        plan_type: 'free',
        monthly_quota: 0
      })

    if (profileError) throw profileError

    if (data.initial_licenses > 0 || data.license_start_date || data.license_end_date) {
      await this.allocateTeacherLicense(orgId, adminId, fakeId, data.initial_licenses, data.memo, data.license_start_date, data.license_end_date)
    }
  },

  async updateOrgTeacher(orgId: string, teacherId: string, updates: { name: string; assigned_class: string; status: string; memo: string; license_start_date?: string; license_end_date?: string }): Promise<void> {
    // Check organization license dates first
    if (updates.license_end_date) {
      const orgStats = await this.getOrgAdminDashboard(orgId)
      if (orgStats.licenseEndDate) {
        if (new Date(updates.license_end_date) > new Date(orgStats.licenseEndDate)) {
          throw new Error(`선생님 이용권 종료일은 기관 이용권 종료일(${orgStats.licenseEndDate.split('T')[0]})을 넘을 수 없습니다.`)
        }
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ name: updates.name }) // center_id as assigned_class could be mapped
      .eq('id', teacherId)
      .eq('organization_id', orgId)

    if (error) throw error
    
    // Update license dates if provided
    if (updates.license_start_date || updates.license_end_date) {
      await supabase
        .from('license_allocations')
        .update({
          license_start_date: updates.license_start_date,
          license_end_date: updates.license_end_date,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', orgId)
        .eq('to_user_id', teacherId)
    }
  },

  async suspendOrgTeacher(orgId: string, teacherId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', teacherId)
      .eq('organization_id', orgId)

    if (error) throw error
  },

  // --- Licenses ---
  async allocateTeacherLicense(orgId: string, adminId: string, teacherId: string, quantity: number, memo: string, startDate?: string, endDate?: string): Promise<void> {
    // 1. Check org remaining
    const orgStats = await this.getOrgAdminDashboard(orgId)
    if (orgStats.remainingLicenses < quantity) {
      throw new Error("남은 이용권보다 많이 나눠줄 수 없어요.")
    }

    // 2. Insert or update allocation
    const { data: existing } = await supabase
      .from('license_allocations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('to_user_id', teacherId)
      .single()

    let beforeQuantity = 0
    let afterQuantity = quantity

    if (existing) {
      beforeQuantity = existing.quantity
      afterQuantity = existing.quantity + quantity
      const updateData: any = { quantity: afterQuantity, updated_at: new Date().toISOString() }
      if (startDate) updateData.license_start_date = startDate
      if (endDate) updateData.license_end_date = endDate
      
      await supabase
        .from('license_allocations')
        .update(updateData)
        .eq('id', existing.id)
    } else {
      await supabase
        .from('license_allocations')
        .insert({
          organization_id: orgId,
          from_user_id: adminId,
          to_user_id: teacherId,
          quantity: quantity,
          license_start_date: startDate || orgStats.licenseStartDate,
          license_end_date: endDate || orgStats.licenseEndDate
        })
    }

    // 3. Log
    await supabase.from('license_logs').insert({
      organization_id: orgId,
      actor_id: adminId,
      target_id: teacherId,
      action: 'grant_teacher_license',
      quantity_before: beforeQuantity,
      quantity_after: afterQuantity,
      changed_quantity: quantity,
      memo
    })
  },

  async revokeTeacherLicense(orgId: string, adminId: string, teacherId: string, quantity: number, memo: string): Promise<void> {
    const { data: existing } = await supabase
      .from('license_allocations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('to_user_id', teacherId)
      .single()

    if (!existing) throw new Error("배정된 이용권이 없습니다.")

    const remaining = existing.quantity - existing.used_quantity
    if (remaining < quantity) {
      throw new Error("이미 학생에게 사용된 이용권은 회수할 수 없어요.")
    }

    const afterQuantity = existing.quantity - quantity

    await supabase
      .from('license_allocations')
      .update({ quantity: afterQuantity, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    // Log
    await supabase.from('license_logs').insert({
      organization_id: orgId,
      actor_id: adminId,
      target_id: teacherId,
      action: 'revoke_teacher_license',
      quantity_before: existing.quantity,
      quantity_after: afterQuantity,
      changed_quantity: -quantity,
      memo
    })
  },

  // --- Notifications ---
  async sendOrgNotification(
    orgId: string,
    adminId: string,
    data: {
      targetType: 'all_teachers' | 'all_students' | 'specific_teacher' | 'specific_student' | 'specific_class'
      targetUserId?: string
      targetTeacherId?: string
      title: string
      message: string
      priority: 'normal' | 'high'
    }
  ): Promise<void> {
    const { error } = await supabase.from('org_notifications').insert({
      organization_id: orgId,
      sender_id: adminId,
      sender_role: 'org_admin',
      target_type: data.targetType,
      target_user_id: data.targetUserId,
      target_teacher_id: data.targetTeacherId,
      title: data.title,
      message: data.message,
      priority: data.priority
    })

    if (error) throw error
  },

  async getSentOrgNotifications(orgId: string): Promise<OrgNotification[]> {
    const { data, error } = await supabase
      .from('org_notifications')
      .select('*')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as OrgNotification[]
  },

  async deleteOrgNotification(orgId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('org_notifications')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('organization_id', orgId)

    if (error) throw error
  }
}
