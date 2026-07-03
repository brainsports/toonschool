import { supabase } from '../../../shared/lib/supabase'

export interface OrgAdminNotification {
  id: string
  title: string
  message: string
  sender_role: string
  sender_name?: string
  priority: 'normal' | 'high'
  category: string
  notice_date: string
  created_at: string
  is_read: boolean
}

export const orgAdminNotificationService = {
  /**
   * 기관관리자 수신 알림 목록 조회
   */
  async getNotifications(orgAdminId: string, orgId: string | null): Promise<OrgAdminNotification[]> {
    // 1. Fetch targeted notifications
    // RLS will ensure we only get notifications targeted to us, but we can also filter here.
    let query = supabase
      .from('org_notifications')
      .select('id, title, message, sender_role, sender_id, priority, category, notice_date, created_at, target_type, target_teacher_id, target_user_id, organization_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const { data: notifications, error: notiError } = await query

    if (notiError) {
      console.error('Error fetching org_admin notifications:', notiError)
      throw notiError
    }

    // Filter notifications for this org admin
    const relevantNotis = (notifications || []).filter(n => {
      if (n.target_type === 'all_org_admins') return true
      if (n.target_type === 'all_organizations') return true
      if (n.target_type === 'specific_org_admin' && n.target_user_id === orgAdminId) return true
      // Also include notifications targeted to the organization generally, if needed
      if (n.organization_id === orgId && (n.target_type === 'specific_org' || !n.target_type || n.target_type === 'org_admin')) return true
      return false
    })

    if (relevantNotis.length === 0) return []

    // 2. Fetch sender names
    const senderIds = Array.from(new Set(relevantNotis.map(n => n.sender_id)))
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', senderIds)
    
    const senderMap = new Map(senders?.map(s => [s.id, s.name]) || [])

    // 3. Fetch status
    const notiIds = relevantNotis.map(n => n.id)
    const { data: statuses, error: statusError } = await supabase
      .from('org_admin_notification_status')
      .select('notification_id, is_read, hidden_at')
      .eq('org_admin_id', orgAdminId)
      .in('notification_id', notiIds)

    if (statusError) {
      console.error('Error fetching org_admin_notification_status:', statusError)
      throw statusError
    }

    const statusMap = new Map(statuses?.map(s => [s.notification_id, s]) || [])

    // 4. Map and filter out hidden
    const results: OrgAdminNotification[] = []
    
    for (const n of relevantNotis) {
      const status = statusMap.get(n.id)
      if (status?.hidden_at) continue // skip hidden

      results.push({
        id: n.id,
        title: n.title,
        message: n.message,
        sender_role: n.sender_role,
        sender_name: senderMap.get(n.sender_id) || '관리자',
        priority: n.priority as 'normal' | 'high',
        category: n.category || '기타',
        notice_date: n.notice_date || n.created_at.split('T')[0],
        created_at: n.created_at,
        is_read: status?.is_read || false
      })
    }

    return results
  },

  /**
   * 알림 읽음 처리
   */
  async markAsRead(orgAdminId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('org_admin_notification_status')
      .upsert(
        {
          org_admin_id: orgAdminId,
          notification_id: notificationId,
          is_read: true,
          read_at: new Date().toISOString()
        },
        { onConflict: 'org_admin_id,notification_id' }
      )

    if (error) {
      console.error('Error marking as read:', error)
      throw error
    }
  },

  /**
   * 알림 숨김(삭제) 처리
   */
  async hideNotification(orgAdminId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('org_admin_notification_status')
      .upsert(
        {
          org_admin_id: orgAdminId,
          notification_id: notificationId,
          hidden_at: new Date().toISOString()
        },
        { onConflict: 'org_admin_id,notification_id' }
      )

    if (error) {
      console.error('Error hiding notification:', error)
      throw error
    }
  }
}
