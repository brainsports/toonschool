import { supabase } from '../../../shared/lib/supabase'

export interface TeacherNotification {
  id: string // teacher_notification_status.id
  notification_id: string
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

export const teacherNotificationService = {
  /**
   * 선생님 수신 알림 목록 조회 (teacher_notification_status 기준)
   */
  async getNotifications(teacherId: string, _orgId: string): Promise<TeacherNotification[]> {
    // 1. Fetch from teacher_notification_status
    const { data: statuses, error: statusError } = await supabase
      .from('teacher_notification_status')
      .select('*')
      .eq('teacher_id', teacherId)
      .is('hidden_at', null)
      .order('created_at', { ascending: false })

    if (statusError) throw statusError
    if (!statuses || statuses.length === 0) return []

    const notificationIds = statuses.map(s => s.notification_id)

    // 2. Fetch notifications
    const { data: notifications, error: notifError } = await supabase
      .from('org_notifications')
      .select('*')
      .in('id', notificationIds)

    if (notifError) throw notifError
    
    // Create a map for quick lookup
    const notifMap = new Map((notifications || []).map(n => [n.id, n]))

    // 3. Fetch sender names
    const senderIds = Array.from(new Set((notifications || []).map(n => n.sender_id).filter(Boolean)))
    
    let senderMap = new Map()
    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', senderIds)
      
      senderMap = new Map(senders?.map(s => [s.id, s.name]) || [])
    }

    // 4. Map to TeacherNotification and Sort
    const results: TeacherNotification[] = statuses.map((status: any) => {
      const n = notifMap.get(status.notification_id)
      if (!n) return null
      
      return {
        id: status.id, // Use status ID for updates
        notification_id: status.notification_id,
        title: n.title,
        message: n.message,
        sender_role: n.sender_role,
        sender_name: senderMap.get(n.sender_id) || '관리자',
        priority: n.priority as 'normal' | 'high',
        category: n.category || '기타',
        notice_date: n.notice_date || n.created_at.split('T')[0],
        created_at: n.created_at,
        is_read: status.is_read || false
      }
    }).filter(Boolean) as TeacherNotification[]

    // Sort by created_at DESC
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return results
  },

  /**
   * 알림 읽음 처리 (teacher_notification_status.id 기준)
   */
  async markAsRead(teacherId: string, statusId: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_notification_status')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', statusId)
      .eq('teacher_id', teacherId)

    if (error) throw error
  },

  /**
   * 알림 숨김(삭제) 처리 (teacher_notification_status.id 기준)
   */
  async hideNotification(teacherId: string, statusId: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_notification_status')
      .update({
        hidden_at: new Date().toISOString()
      })
      .eq('id', statusId)
      .eq('teacher_id', teacherId)

    if (error) throw error
  }
}
