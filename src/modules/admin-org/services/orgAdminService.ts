import { supabase } from '../../../shared/lib/supabase'
import type {
  OrgNotification,
  OrgTeacher,
  OrgDashboardStats
} from '../types/orgAdmin'

const extractOrgFunctionError = async (error: any) => {
  let errorMessage = error?.message || '요청 처리 중 오류가 발생했습니다.'

  if (error?.context) {
    try {
      if (typeof error.context.clone === 'function') {
        const errBody = await error.context.clone().json()
        errorMessage = errBody?.message || errBody?.error || errorMessage
      } else {
        errorMessage = error.context.message || error.context.error || errorMessage
      }
    } catch {
      // Keep the original client error message when the function body cannot be parsed.
    }
  }

  if (errorMessage === 'Edge Function returned a non-2xx status code') {
    return '선생님 계정 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }

  return errorMessage
}

type OrgLmsOverview = {
  organization: {
    id: string
    name: string
    total_licenses: number
    stored_used_licenses?: number
    license_start_date?: string | null
    license_end_date?: string | null
  }
  teachers: OrgTeacher[]
  totals: {
    teacher_count: number
    student_count: number
    total_licenses: number
    allocated_licenses: number
    used_licenses: number
    remaining_licenses: number
  }
  error?: string
}
export const orgAdminService = {
  // --- Shared organization LMS overview ---
  async getOrgLmsOverview(orgId?: string): Promise<OrgLmsOverview> {
    const { data, error } = await supabase.rpc('get_org_lms_overview')

    if (error) {
      console.error('[OrgAdminService] getOrgLmsOverview failed', {
        code: error.code,
        message: error.message,
        orgId,
        stage: 'rpc'
      })
      throw error
    }

    if (data?.error) {
      console.error('[OrgAdminService] getOrgLmsOverview logical error', {
        message: data.error,
        orgId,
        stage: 'auth-or-scope'
      })
      throw new Error(data.error)
    }

    const overview = data as OrgLmsOverview
    if (orgId && overview.organization?.id !== orgId) {
      console.error('[OrgAdminService] getOrgLmsOverview org mismatch', {
        orgId,
        stage: 'scope-check'
      })
      throw new Error('????????뚯??? ?癲ル슢???ъ쒜???癲ル슢캉???????????ㅿ폍??????딅젩.')
    }

    return overview
  },

  // --- Dashboard ---
  async getOrgAdminDashboard(orgId: string): Promise<OrgDashboardStats> {
    const overview = await this.getOrgLmsOverview(orgId)
    const orgData = overview.organization
    const totals = overview.totals

    const { data: notifications, error: notificationError } = await supabase
      .from('org_notifications')
      .select('target_type, created_at')
      .eq('organization_id', orgId)
      .is('deleted_at', null)

    if (notificationError) {
      console.error('[OrgAdminService] getOrgAdminDashboard notifications failed', {
        code: notificationError.code,
        message: notificationError.message,
        orgId,
        stage: 'notifications'
      })
    }

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

    return {
      orgName: orgData.name,
      totalLicenses: totals.total_licenses,
      allocatedLicenses: totals.allocated_licenses,
      usedLicenses: totals.used_licenses,
      remainingLicenses: totals.remaining_licenses,
      teacherCount: totals.teacher_count,
      studentCount: totals.student_count,
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
    const overview = await this.getOrgLmsOverview(orgId)

    return (overview.teachers || []).map((teacher) => ({
      ...teacher,
      allocated_licenses: teacher.allocated_licenses || 0,
      used_licenses: teacher.used_licenses || 0,
      remaining_licenses: teacher.remaining_licenses || 0,
      student_count: teacher.student_count || 0,
      status: teacher.status || 'active',
      assigned_class: teacher.assigned_class || teacher.center_id || undefined,
      license_start_date: teacher.license_start_date,
      license_end_date: teacher.license_end_date
    }))
  },
  async getOrgStudents(orgId: string): Promise<any[]> {
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('center_id')
      .eq('organization_id', orgId)
      .eq('role', 'teacher')
      .not('center_id', 'is', null)

    if (teachersError) throw teachersError
    if (!teachers || teachers.length === 0) return []

    const centerIds = Array.from(new Set(teachers.map(t => t.center_id).filter(Boolean)))
    if (centerIds.length === 0) return []

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, login_id, name, grade, center_id, status')
      .in('center_id', centerIds)
      .order('grade', { ascending: true })
      .order('name', { ascending: true })

    if (studentsError) throw studentsError

    return students ? Array.from(new Map(students.map(s => [s.id, s])).values()) : []
  },


  async createTeacherForOrg(orgId: string, _adminId: string, data: { name: string; email: string; tempPassword?: string; password?: string; assigned_class: string; initial_licenses: number; memo: string; license_start_date?: string; license_end_date?: string }): Promise<void> {
    // Check organization license dates first
    const orgStats = await this.getOrgAdminDashboard(orgId)
    if (data.license_end_date && orgStats.licenseEndDate) {
      if (new Date(data.license_end_date) > new Date(orgStats.licenseEndDate)) {
        throw new Error(`이용권 종료일은 기관 종료일(${orgStats.licenseEndDate.split('T')[0]})보다 늦을 수 없습니다.`)
      }
    }

    const cleanEmail = data.email.trim().toLowerCase()
    const password = data.tempPassword || data.password || ''

    const { data: result, error } = await supabase.functions.invoke('create-teacher', {
      body: {
        name: data.name,
        email: cleanEmail,
        password,
        organization_id: orgId,
        license_count: data.initial_licenses,
        licenseTotal: data.initial_licenses,
        license_start_date: data.license_start_date,
        license_end_date: data.license_end_date,
        licenseStart: data.license_start_date,
        licenseEnd: data.license_end_date
      }
    })

    if (error) {
      console.error('[OrgAdminService] createTeacherForOrg Edge Function failed', error)
      throw new Error(await extractOrgFunctionError(error))
    }

    if (result?.error || result?.message) {
      throw new Error(result.message || result.error)
    }
  },

  async updateOrgTeacher(orgId: string, teacherId: string, updates: { name: string; assigned_class: string; status: string; memo: string; license_start_date?: string; license_end_date?: string }): Promise<void> {
    // Check organization license dates first
    if (updates.license_end_date) {
      const orgStats = await this.getOrgAdminDashboard(orgId)
      if (orgStats.licenseEndDate) {
        if (new Date(updates.license_end_date) > new Date(orgStats.licenseEndDate)) {
          throw new Error(`????◈類좊닱??????ㅼ굡獒뺣떼??????띻샴癲??? ???뚯??? ????ㅼ굡獒뺣떼??????띻샴癲??${orgStats.licenseEndDate.split('T')[0]})??????볥궙????????ㅿ폍??????딅젩.`)
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
      throw new Error("Not enough remaining licenses.")
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

    if (!existing) throw new Error("No license allocation found.")

    const remaining = existing.quantity - existing.used_quantity
    if (remaining < quantity) {
      throw new Error("Used student licenses cannot be revoked.")
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
      category?: string
      noticeDate?: string
      isPublic?: boolean
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
      priority: data.priority,
      category: data.category || 'notice',
      notice_date: data.noticeDate || new Date().toISOString().split('T')[0],
      is_public: data.isPublic !== undefined ? data.isPublic : true
    })

    if (error) throw error
  },

  async getSentOrgNotifications(orgId: string, adminId: string): Promise<OrgNotification[]> {
    const { data, error } = await supabase
      .from('org_notifications')
      .select('*')
      .eq('organization_id', orgId)
      .eq('sender_id', adminId)
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
