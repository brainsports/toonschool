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
  created_at: string;
  updated_at: string;
}

/**
 * 특정 타겟의 공개된 알림 목록을 최신순으로 조회합니다. (전체 대상 포함)
 */
export async function getNotificationsForTarget(targetKey: string): Promise<StudentNotification[]> {
  if (!targetKey) return [];

  try {
    const { data, error } = await supabase
      .from('student_notifications')
      .select('*')
      .in('target_key', [targetKey, 'all-grades'])
      .eq('is_published', true)
      .order('notice_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[notificationService] getNotificationsForTarget error:', error);
      return [];
    }
    return data as StudentNotification[];
  } catch (err) {
    console.error('[notificationService] getNotificationsForTarget exception:', err);
    return [];
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
