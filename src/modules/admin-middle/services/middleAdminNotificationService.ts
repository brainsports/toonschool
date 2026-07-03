import { supabase } from '../../../shared/lib/supabase'

export interface MiddleAdminNotification {
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

export const middleAdminNotificationService = {
  /**
   * 중간관리자 수신 알림 목록 조회
   */
  async getNotifications(middleAdminId: string): Promise<MiddleAdminNotification[]> {
    const query = supabase
      .from('org_notifications')
      .select('id, title, message, sender_role, sender_id, priority, category, notice_date, created_at, target_type, target_user_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const { data: notifications, error: notiError } = await query

    if (notiError) {
      console.error('Error fetching middle_admin notifications:', notiError)
      return []
    }

    // Filter notifications for this middle admin
    const relevantNotis = (notifications || []).filter(n => {
      if (n.target_type === 'manager' || n.target_type === 'middle_admin' || n.target_type === 'all_middle_admins') return true
      if (n.target_type === 'specific_middle_admin' && n.target_user_id === middleAdminId) return true
      return false
    })

    if (relevantNotis.length === 0) return []

    // Fetch sender names
    const senderIds = Array.from(new Set(relevantNotis.map(n => n.sender_id)))
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', senderIds)
    
    const senderMap = new Map(senders?.map(s => [s.id, s.name]) || [])

    // Fetch read status using org_notification_reads (since it has user_id)
    const notiIds = relevantNotis.map(n => n.id)
    const { data: statuses, error: statusError } = await supabase
      .from('org_notification_reads')
      .select('notification_id')
      .eq('user_id', middleAdminId)
      .in('notification_id', notiIds)

    if (statusError) {
      console.error('Error fetching org_notification_reads:', statusError)
    }

    const readSet = new Set(statuses?.map(s => s.notification_id) || [])

    // Check localStorage for hidden notifications
    let hiddenSet = new Set<string>()
    try {
      const hiddenStr = localStorage.getItem(`hidden_notis_${middleAdminId}`) || '[]'
      hiddenSet = new Set(JSON.parse(hiddenStr))
    } catch (e) {}

    const results: MiddleAdminNotification[] = []
    
    for (const n of relevantNotis) {
      if (hiddenSet.has(n.id)) continue // skip hidden

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
        is_read: readSet.has(n.id)
      })
    }

    return results
  },

  /**
   * 알림 읽음 처리
   */
  async markAsRead(middleAdminId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('org_notification_reads')
      .insert({
        user_id: middleAdminId,
        notification_id: notificationId,
      })

    if (error && error.code !== '23505') { // Ignore unique constraint violation
      console.error('Error marking as read:', error)
      throw error
    }
  },

  /**
   * 알림 숨김(삭제) 처리
   */
  async hideNotification(middleAdminId: string, notificationId: string): Promise<void> {
    try {
      const hiddenStr = localStorage.getItem(`hidden_notis_${middleAdminId}`) || '[]'
      const hidden = JSON.parse(hiddenStr)
      if (!hidden.includes(notificationId)) {
        hidden.push(notificationId)
        localStorage.setItem(`hidden_notis_${middleAdminId}`, JSON.stringify(hidden))
      }
    } catch (err) {
      console.error('Failed to hide notification:', err)
    }
  }
}
