import { supabase } from '../../../shared/lib/supabase';

export type StudentNotificationSourceType = 'student_notification' | 'org_notification';

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
  source_type?: StudentNotificationSourceType;
}

async function getHiddenNotificationIds(studentId?: string | null): Promise<Record<StudentNotificationSourceType, Set<string>>> {
  const result: Record<StudentNotificationSourceType, Set<string>> = {
    student_notification: new Set(),
    org_notification: new Set(),
  };

  if (!studentId) return result;

  const { data, error } = await supabase
    .from('student_hidden_messages')
    .select('message_id, message_type')
    .eq('student_id', studentId)
    .in('message_type', ['student_notification', 'org_notification']);

  if (error) {
    console.error('[notificationService] getHiddenNotificationIds error:', error);
    return result;
  }

  (data ?? []).forEach((row: any) => {
    if (row.message_type === 'student_notification' || row.message_type === 'org_notification') {
      const sourceType = row.message_type as StudentNotificationSourceType;
      result[sourceType].add(row.message_id);
    }
  });

  return result;
}

// 기관 알림(org_notifications) 조회 + 매핑. 학생이 숨긴 항목은 제외.
// getNotificationsForTarget / getNotificationsForStudent 양쪽에서 공유(중복 방지).
async function fetchOrgNotifications(
  profile: any,
  hiddenIds: Record<StudentNotificationSourceType, Set<string>>,
): Promise<StudentNotification[]> {
  if (!profile?.organization_id) return [];

  const { data: orgData, error: orgError } = await supabase
    .from('org_notifications')
    .select('*, organizations(name)')
    .eq('organization_id', profile.organization_id)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('notice_date', { ascending: false });

  if (orgError || !orgData) return [];

  const filteredOrgData = orgData.filter((noti: any) => {
    if (noti.target_type === 'all_students' || noti.target_type === 'student' || noti.target_type === 'all') return true;
    if (noti.target_type === 'specific_class' && profile.center_id && noti.target_teacher_id === profile.center_id) return true;
    if (noti.target_type === 'specific_student' && noti.target_user_id === profile.id) return true;
    return false;
  });

  return filteredOrgData
    .filter((noti: any) => !hiddenIds.org_notification.has(noti.id))
    .map((noti: any) => {
      const orgName = noti.organizations?.name || '기관관리자';
      const senderName = noti.sender_role === 'org_admin' ? `${orgName} / 기관관리자` : '기관관리자';
      return {
        id: noti.id,
        target_key: noti.target_type,
        sender_id: noti.sender_id,
        sender_role: senderName,
        category: noti.category || 'notice',
        title: noti.title,
        content: noti.message,
        notice_date: noti.notice_date || noti.created_at,
        is_published: noti.is_public,
        priority: noti.priority,
        created_at: noti.created_at,
        updated_at: noti.created_at,
        source_type: 'org_notification' as const,
      };
    });
}

/**
 * 특정 대상의 공개 알림 목록을 최신순으로 조회합니다. 현재 학생이 숨긴 알림은 제외합니다.
 */
export async function getNotificationsForTarget(targetKey: string, profile?: any): Promise<StudentNotification[]> {
  if (!targetKey) return [];

  try {
    const hiddenIds = await getHiddenNotificationIds(profile?.id);
    let allNotis: StudentNotification[] = [];

    const { data: studentData, error: studentError } = await supabase
      .from('student_notifications')
      .select('*')
      .in('target_key', [targetKey, 'all-grades', profile?.id].filter(Boolean))
      .eq('is_published', true)
      .order('notice_date', { ascending: false });

    if (!studentError && studentData) {
      allNotis = [
        ...allNotis,
        ...(studentData as StudentNotification[])
          .filter((noti) => !hiddenIds.student_notification.has(noti.id))
          .map((noti) => ({ ...noti, source_type: 'student_notification' as const })),
      ];
    }

    allNotis = [...allNotis, ...(await fetchOrgNotifications(profile, hiddenIds))];

    allNotis.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allNotis;
  } catch (err) {
    console.error('[notificationService] getNotificationsForTarget exception:', err);
    return [];
  }
}

// 학년 문자열('5학년') 또는 숫자(5) -> 발송 키 'grade-5'.
function gradeToKey(grade: string | number | null | undefined): string | null {
  const n =
    typeof grade === 'number'
      ? grade
      : Number.parseInt(String(grade ?? '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? `grade-${n}` : null;
}

// 학생 본인의 students 행에서 수신 스코핑 문맥(class_id, grade, created_by) 조회.
async function fetchStudentNotiContext(studentId: string): Promise<{
  class_id: string | null;
  grade: string | null;
  created_by: string | null;
} | null> {
  const { data, error } = await supabase
    .from('students')
    .select('class_id, grade, created_by')
    .eq('id', studentId)
    .maybeSingle();

  if (error) {
    console.error('[notificationService] fetchStudentNotiContext error:', error);
    return null;
  }
  return data as { class_id: string | null; grade: string | null; created_by: string | null } | null;
}

/**
 * 학생용: 본인 담당 선생님(created_by)이 보낸 알림 + 기관 알림을 조회.
 * 학생 알림은 sender_id = 학생의 created_by 로 스코핑하여 타 선생님 알림이 노출되지 않는다.
 * 수신 키: 본인 학급(class_id), 전체('all-grades'), 본인 학년('grade-N'), 본인 개인(studentId).
 * 기관 알림(org_notifications)은 기존 기준 유지(기관 단위广播).
 */
export async function getNotificationsForStudent(
  studentId: string | null | undefined,
  profile?: any,
): Promise<StudentNotification[]> {
  if (!studentId) return [];

  try {
    const hiddenIds = await getHiddenNotificationIds(profile?.id);
    let allNotis: StudentNotification[] = [];

    const ctx = await fetchStudentNotiContext(studentId);
    if (ctx?.created_by) {
      const gradeKey = gradeToKey(ctx.grade);
      const keys = ['all-grades', ctx.class_id, gradeKey, studentId].filter(Boolean) as string[];

      const { data: studentData, error: studentError } = await supabase
        .from('student_notifications')
        .select('*')
        .eq('sender_id', ctx.created_by)
        .in('target_key', keys)
        .eq('is_published', true)
        .order('notice_date', { ascending: false });

      if (!studentError && studentData) {
        allNotis = [
          ...allNotis,
          ...(studentData as StudentNotification[])
            .filter((noti) => !hiddenIds.student_notification.has(noti.id))
            .map((noti) => ({ ...noti, source_type: 'student_notification' as const })),
        ];
      }
    }

    if (profile?.organization_id) {
      allNotis = [...allNotis, ...(await fetchOrgNotifications(profile, hiddenIds))];
    }

    allNotis.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allNotis;
  } catch (err) {
    console.error('[notificationService] getNotificationsForStudent exception:', err);
    return [];
  }
}

export async function hideStudentNotification(
  studentId: string,
  notificationId: string,
  sourceType: StudentNotificationSourceType = 'student_notification'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_hidden_messages')
      .upsert(
        {
          student_id: studentId,
          message_id: notificationId,
          message_type: sourceType,
        },
        { onConflict: 'student_id,message_id,message_type' }
      );

    if (error) {
      console.error('[notificationService] hideStudentNotification error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[notificationService] hideStudentNotification exception:', err);
    return false;
  }
}

/**
 * @deprecated 기존 org_notifications 전용 숨김 함수입니다. 학생 화면에서는 hideStudentNotification을 사용하세요.
 */
export async function hideOrgNotification(studentId: string, notificationId: string): Promise<boolean> {
  return hideStudentNotification(studentId, notificationId, 'org_notification');
}

/**
 * 관리자/선생님 기능: 자신이 보낸 알림 목록을 최신순으로 조회합니다.
 * senderId 를 넘기면 본인이 보낸 알림만 조회(타 선생님 'all-grades' 알림 격리).
 */
export async function getSentNotifications(
  classKey: string,
  senderId?: string | null,
): Promise<StudentNotification[]> {
  if (!classKey) return [];

  try {
    let query = supabase
      .from('student_notifications')
      .select('*')
      .eq('target_key', classKey);

    if (senderId) {
      query = query.eq('sender_id', senderId);
    }

    const { data, error } = await query
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
 * 관리자/선생님 기능: 알림 원본을 삭제합니다. 학생 화면에서는 사용하지 마세요.
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