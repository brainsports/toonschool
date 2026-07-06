import { supabase } from '../../../shared/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export interface SuperDashboardStats {
  middle_admins: { total: number; active: number }
  org_admins: { total: number; pending: number }
  teachers: { total: number; pending: number }
  licenses: { total: number; used: number; remaining: number }
  notifications: { recent_count: number }
  resources: { total: number }
}

export const superAdminService = {
  async getDashboardStats(): Promise<SuperDashboardStats> {
    const { data, error } = await supabase.rpc('get_super_dashboard_stats')
    if (error) throw error
    return data as SuperDashboardStats
  },

  async getMiddleAdmins() {
    const { data, error } = await supabase
      .from('middle_admins')
      .select('*, profiles:profile_id(name, email)')
      .order('created_at', { ascending: false })
    if (error) throw error
    
    return data.map((admin: any) => {
      const profile = Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles;
      return {
        ...admin,
        profiles: profile || {}
      };
    });
  },

  async assignUserRole(userId: string, role: string, orgId?: string | null, middleAdminId?: string | null) {
    const { data, error } = await supabase.rpc('assign_user_role', {
      p_user_id: userId,
      p_role: role,
      p_organization_id: orgId || null,
      p_middle_admin_id: middleAdminId || null
    })
    if (error) throw error
    return data
  },

  async updateMiddleAdminLicense(middleAdminId: string, licenseTotal: number, start: string, end: string, status: string = 'active') {
    const { data, error } = await supabase.rpc('update_super_middle_admin', {
      p_middle_admin_id: middleAdminId,
      p_license_total: licenseTotal,
      p_license_start: start,
      p_license_end: end,
      p_status: status
    })
    if (error) throw error
    return data
  },

  async createMiddleAdmin(adminData: any) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error("Supabase 환경 변수가 없습니다.")

    const tempClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: adminData.email,
      password: adminData.password,
      options: {
        data: {
          name: adminData.name,
          role: 'middle_admin'
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("계정 생성 실패")

    const userId = authData.user.id

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: adminData.name,
        role: 'middle_admin',
        status: adminData.status || 'active'
      })
      .eq('id', userId)

    if (profileError) {
      await supabase.from('profiles').insert({
        id: userId,
        email: adminData.email,
        name: adminData.name,
        role: 'middle_admin',
        status: adminData.status || 'active',
        plan_type: 'free',
        monthly_quota: 0
      })
    }

    await supabase.rpc('update_super_middle_admin', {
      p_middle_admin_id: userId,
      p_license_total: adminData.licenseTotal || 0,
      p_license_start: adminData.licenseStart || new Date().toISOString(),
      p_license_end: adminData.licenseEnd || new Date().toISOString(),
      p_status: adminData.status || 'active'
    })
  },

  async getTeachers() {
    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('id, name, email, status, organization_id, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!teachers || teachers.length === 0) return []

    const orgIds = teachers.map(t => t.organization_id).filter(id => id)
    let orgs: any[] = []
    
    if (orgIds.length > 0) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, middle_admin_id')
        .in('id', orgIds)
      
      orgs = orgData || []
      
      const middleAdminIds = orgs.map(o => o.middle_admin_id).filter(id => id)
      if (middleAdminIds.length > 0) {
         const { data: adminData } = await supabase
           .from('profiles')
           .select('id, name')
           .in('id', middleAdminIds)
           
         const adminMap = new Map(adminData?.map(a => [a.id, a.name]))
         orgs = orgs.map(o => ({
           ...o,
           middle_admin_name: adminMap.get(o.middle_admin_id) || '미정'
         }))
      }
    }

    const orgMap = new Map(orgs.map(o => [o.id, o]))

    return teachers.map(teacher => {
      const org = teacher.organization_id ? orgMap.get(teacher.organization_id) : null
      return {
        ...teacher,
        organization: org || null
      }
    })
  },

  async createTeacher(teacherData: any) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error("Supabase 환경 변수가 없습니다.")

    const tempClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: teacherData.email,
      password: teacherData.password,
      options: {
        data: {
          name: teacherData.name,
          role: 'teacher'
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("계정 생성 실패")

    const userId = authData.user.id

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: teacherData.name,
        role: 'teacher',
        status: teacherData.status || 'active',
        organization_id: teacherData.organization_id
      })
      .eq('id', userId)

    if (profileError) {
      await supabase.from('profiles').insert({
        id: userId,
        email: teacherData.email,
        name: teacherData.name,
        role: 'teacher',
        status: teacherData.status || 'active',
        organization_id: teacherData.organization_id,
        plan_type: 'free',
        monthly_quota: 0
      })
    }
  },

  async updateTeacherStatus(teacherId: string, status: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', teacherId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getPendingUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getAllOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select('*, profiles:middle_admin_id(name, email)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async createOrganization(orgData: { name: string; middle_admin_id: string; total_licenses: number; license_start_date: string; license_end_date: string }) {
    const { data, error } = await supabase
      .from('organizations')
      .insert([orgData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async sendNotification(notificationData: { title: string; content: string; target_role: string; priority: string }) {
    const { data, error } = await supabase.rpc('create_org_notification', {
      p_org_id: null,
      p_sender_id: null,
      p_target_type: notificationData.target_role,
      p_title: notificationData.title,
      p_content: notificationData.content,
      p_priority: notificationData.priority
    })
    if (error) throw error
    return data
  },
  
  async getNotifications() {
    const { data, error } = await supabase
      .from('org_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data
  },

  async getResources() {
    const { data, error } = await supabase
      .from('admin_resources')
      .select('*, profiles:created_by(name, email)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async createResource(resourceData: { title: string; description: string; target_role: string; file_path: string }) {
    // In a real app, we would upload to storage first and get file_path, 
    // but here we just simulate it by saving to DB.
    const { data, error } = await supabase
      .from('admin_resources')
      .insert([{
        ...resourceData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async softDeleteResource(resourceId: string) {
    const { data, error } = await supabase
      .from('admin_resources')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', resourceId)
      .select()
      .single()
    
    if (error) throw error

    // Log deletion
    await supabase.from('audit_logs').insert([{
      actor_id: (await supabase.auth.getUser()).data.user?.id,
      action: 'DELETE_RESOURCE',
      target_table: 'admin_resources',
      target_id: resourceId
    }])

    return data
  },

  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles:actor_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data
  }
}
