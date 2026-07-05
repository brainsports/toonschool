import { supabase } from '../../../shared/lib/supabase'

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
    return data
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
