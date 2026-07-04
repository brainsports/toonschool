import { supabase } from '../../../shared/lib/supabase';

export interface StudentNotification {
  id: string;
  target_key: string;
  sender_id: string | null;
  sender_role: string | null;
  category: string;
  title: string;
  content: string;
  notice_date: string;
  is_published: boolean;
  priority?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 특정 타겟의 공개된 알림 목록을 최신순으로 조회합니다. (전체 대상 포함)
 */
export async function getNotificationsForTarget(targetKey: string, profile?: any): Promise<StudentNotification[]> {
  if (!targetKey) return [];

  try {
    let allNotis: StudentNotification[] = [];

    // 1. Get from student_notifications
    const { data: studentData, error: studentError } = await supabase
      .from('student_notifications')
      .select('*')
      .in('target_key', [targetKey, 'all-grades'])
      .eq('is_published', true)
      .order('notice_date', { ascending: false });

    if (!studentError && studentData) {
      allNotis = [...studentData as StudentNotification[]];
    }

    // 2. Get from org_notifications if profile has organization_id
    if (profile?.organization_id) {
      const { data: orgData, error: orgError } = await supabase
        .from('org_notifications')
        .select('*, organizations(name)')
        .eq('organization_id', profile.organization_id)
        .eq('is_public', true)
        .is('deleted_at', null)
        .order('notice_date', { ascending: false });

      if (!orgError && orgData) {
        // filter by target manually in case RLS allows more or we need specific logic
        let filteredOrgData = orgData.filter(n => {
          if (n.target_type === 'all_students' || n.target_type === 'student' || n.target_type === 'all') return true;
          if (n.target_type === 'specific_class' && profile.center_id && n.target_teacher_id === profile.center_id) return true;
          if (n.target_type === 'specific_student' && n.target_user_id === profile.id) return true;
          return false;
        });

        // Get hidden notifications
        const { data: hiddenData } = await supabase
          .from('student_notification_hidden')
          .select('notification_id')
          .eq('student_id', profile.id);

        const hiddenSet = new Set(hiddenData?.map(h => h.notification_id) || []);

        const orgMapped = filteredOrgData
          .filter(n => !hiddenSet.has(n.id))
          .map(n => {
            const orgName = n.organizations?.name || '기관관리자';
            const senderName = n.sender_role === 'org_admin' ? `${orgName} / 기관관리자` : '기관관리자';
            return {
              id: n.id,
              target_key: n.target_type,
              sender_id: n.sender_id,
              sender_role: senderName, // We reuse sender_role to display the formatted sender string
              category: n.category || 'notice',
              title: n.title,
              content: n.message,
              notice_date: n.notice_date || n.created_at,
              is_published: n.is_public,
              priority: n.priority,
              created_at: n.created_at,
              updated_at: n.created_at
            };
          });
        allNotis = [...allNotis, ...orgMapped];
      }
    }

    // Sort combined notifications by notice_date desc
    allNotis.sort((a, b) => new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime());

    return allNotis;
  } catch (err) {
    console.error('[notificationService] getNotificationsForTarget exception:', err);
    return [];
  }
}

/**
 * 학생: 기관 알림 숨김 처리
 */
export async function hideOrgNotification(studentId: string, notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_notification_hidden')
      .insert({
        student_id: studentId,
        notification_id: notificationId
      });

    if (error) {
      console.error('[notificationService] hideOrgNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notificationService] hideOrgNotification exception:', err);
    return false;
  }
}

/**
 * 관리자/선생님 기능: 자신이 보낸 알림 목록을 최신순으로 조회합니다.
 * (간소화를 위해 현재는 특정 classKey에 보낸 알림만 조회합니다)
 */
export async function getSentNotifications(classKey: string): Promise<StudentNotification[]> {
  if (!classKey) return [];

  try {
    const { data, error } = await supabase
      .from('student_notifications')
      .select('*')
      .in('target_key', [classKey, 'all-grades'])
      .order('notice_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[notificationService] getSentNotifications error:', error);
      return [];
    }
    return data as StudentNotification[];
  } catch (err) {
    console.error('[notificationService] getSentNotifications exception:', err);
    return [];
  }
}

/**
 * 관리자/선생님 기능: 새로운 알림을 생성합니다.
 */
export async function createNotification(payload: Partial<StudentNotification>): Promise<StudentNotification | null> {
  try {
    const { data, error } = await supabase
      .from('student_notifications')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[notificationService] createNotification error:', error);
      throw error;
    }
    return data as StudentNotification;
  } catch (err) {
    console.error('[notificationService] createNotification exception:', err);
    throw err;
  }
}

/**
 * 관리자/선생님 기능: 알림을 삭제합니다.
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[notificationService] deleteNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notificationService] deleteNotification exception:', err);
    return false;
  }
}
