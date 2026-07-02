import { supabase } from '../../../shared/lib/supabase';

export interface TeacherMessage {
  id: string;
  center_id: string | null;
  class_key: string;
  teacher_id: string | null;
  title: string | null;
  content: string;
  message_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 학생의 정보를 기반으로 class_key를 반환합니다.
 * TODO: 향후 classes 테이블과 students.class_id가 생기면 이 임시 매핑 로직을 제거하고 실제 class_id를 사용하도록 수정.
 */
export function resolveStudentClassKey(profile: any, studentProfile?: any): string {
  // 현재는 임시로 무조건 'cls-1'을 반환하여 mock 데이터와 연동 (또는 필요한 로직 추가 가능)
  // 예: 김민준 -> cls-2 등 조건부 분기 가능
  if (profile?.name === '김학생' || studentProfile?.name === '김학생') {
    return 'cls-1';
  }
  // 기본 fallback
  return 'cls-1';
}

/**
 * 특정 학급의 가장 최근 공개된 선생님 말씀 1개를 조회합니다.
 */
export async function getLatestTeacherMessageForClass(classKey: string): Promise<TeacherMessage | null> {
  if (!classKey) return null;

  try {
    const { data, error } = await supabase
      .from('teacher_messages')
      .select('*')
      .eq('class_key', classKey)
      .eq('is_published', true)
      .order('message_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // no rows found
        console.error('[teacherMessageService] getLatestTeacherMessageForClass error:', error);
      }
      return null;
    }
    return data as TeacherMessage;
  } catch (err) {
    console.error('[teacherMessageService] getLatestTeacherMessageForClass exception:', err);
    return null;
  }
}

/**
 * 특정 학급의 모든 공개된 선생님 말씀 목록을 최신순으로 조회합니다.
 */
export async function getTeacherMessagesForClass(classKey: string): Promise<TeacherMessage[]> {
  if (!classKey) return [];

  try {
    const { data, error } = await supabase
      .from('teacher_messages')
      .select('*')
      .eq('class_key', classKey)
      .eq('is_published', true)
      .order('message_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[teacherMessageService] getTeacherMessagesForClass error:', error);
      return [];
    }
    return data as TeacherMessage[];
  } catch (err) {
    console.error('[teacherMessageService] getTeacherMessagesForClass exception:', err);
    return [];
  }
}

/**
 * 관리자/선생님 기능: 새로운 선생님 말씀을 생성합니다.
 */
export async function createTeacherMessage(payload: Partial<TeacherMessage>): Promise<TeacherMessage | null> {
  try {
    const { data, error } = await supabase
      .from('teacher_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[teacherMessageService] createTeacherMessage error:', error);
      throw error;
    }
    return data as TeacherMessage;
  } catch (err) {
    console.error('[teacherMessageService] createTeacherMessage exception:', err);
    throw err;
  }
}
