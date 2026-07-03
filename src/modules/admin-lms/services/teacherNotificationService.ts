import { supabase } from '../../../shared/lib/supabase'

export interface TeacherNotification {
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

export const teacherNotificationService = {
  /**
   * 선생님 수신 알림 목록 조회
   */
  async getNotifications(teacherId: string, orgId: string): Promise<TeacherNotification[]> {
    // 1. Fetch targeted notifications
    const { data: notifications, error: notiError } = await supabase
      .from('org_notifications')
      .select('id, title, message, sender_role, sender_id, priority, category, notice_date, created_at, target_type, target_teacher_id, target_user_id')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (notiError) throw notiError

    // Filter notifications for this teacher
    const relevantNotis = (notifications || []).filter(n => {
      if (n.target_type === 'all_teachers') return true
      if (n.target_type === 'specific_teacher' && n.target_teacher_id === teacherId) return true
      if (n.target_type === 'specific_student' && n.target_user_id === teacherId) return true // just in case target_user_id was used
      if (n.target_type === 'teacher' && (n.target_teacher_id === teacherId || n.target_user_id === teacherId)) return true
      if (n.target_type === 'center_teachers') return true
      return false
    })

    if (relevantNotis.length === 0) return []

    // 2. Fetch sender names (since sender_id is there)
    const senderIds = Array.from(new Set(relevantNotis.map(n => n.sender_id)))
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', senderIds)
    
    const senderMap = new Map(senders?.map(s => [s.id, s.name]) || [])

    // 3. Fetch status
    const notiIds = relevantNotis.map(n => n.id)
    const { data: statuses, error: statusError } = await supabase
      .from('teacher_notification_status')
      .select('notification_id, is_read, hidden_at')
      .eq('teacher_id', teacherId)
      .in('notification_id', notiIds)

    if (statusError) throw statusError

    const statusMap = new Map(statuses?.map(s => [s.notification_id, s]) || [])

    // 4. Map and filter out hidden
    const results: TeacherNotification[] = []
    
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
  async markAsRead(teacherId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_notification_status')
      .upsert(
        {
          teacher_id: teacherId,
          notification_id: notificationId,
          is_read: true,
          read_at: new Date().toISOString()
        },
        { onConflict: 'teacher_id,notification_id' }
      )

    if (error) throw error
  },

  /**
   * 알림 숨김(삭제) 처리
   */
  async hideNotification(teacherId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('teacher_notification_status')
      .upsert(
        {
          teacher_id: teacherId,
          notification_id: notificationId,
          hidden_at: new Date().toISOString()
        },
        { onConflict: 'teacher_id,notification_id' }
      )

    if (error) throw error
  }
}
