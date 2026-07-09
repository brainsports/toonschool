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

async function getHiddenTeacherMessageIds(studentId?: string | null): Promise<Set<string>> {
  if (!studentId) return new Set();

  const { data, error } = await supabase
    .from('student_hidden_messages')
    .select('message_id')
    .eq('student_id', studentId)
    .eq('message_type', 'teacher_message');

  if (error) {
    console.error('[teacherMessageService] getHiddenTeacherMessageIds error:', error);
    return new Set();
  }

  return new Set((data ?? []).map((row: any) => row.message_id));
}

function filterHiddenMessages(messages: TeacherMessage[], hiddenIds: Set<string>) {
  if (hiddenIds.size === 0) return messages;
  return messages.filter((message) => !hiddenIds.has(message.id));
}

/**
 * 학생의 정보를 기반으로 class_key를 반환합니다.
 * TODO: 향후 classes 테이블과 students.class_id가 생기면 임시 매핑 로직을 제거하고 실제 class_id를 사용하도록 수정.
 */
export function resolveStudentClassKey(profile: any, studentProfile?: any): string {
  if (profile?.name === '김학생' || studentProfile?.name === '김학생') {
    return 'class-5';
  }
  return 'class-5';
}

/**
 * 특정 학급에 가장 최근 공개된 선생님 말씀 1개를 조회합니다. 학생이 숨긴 항목은 제외합니다.
 */
export async function getLatestTeacherMessageForClass(classKey: string, studentId?: string | null): Promise<TeacherMessage | null> {
  if (!classKey) return null;

  try {
    const messages = await getTeacherMessagesForClass(classKey, studentId);
    return messages[0] ?? null;
  } catch (err) {
    console.error('[teacherMessageService] getLatestTeacherMessageForClass exception:', err);
    return null;
  }
}

/**
 * 특정 학급의 모든 공개된 선생님 말씀 목록을 최신순으로 조회합니다. 학생이 숨긴 항목은 제외합니다.
 */
export async function getTeacherMessagesForClass(classKey: string, studentId?: string | null): Promise<TeacherMessage[]> {
  if (!classKey) return [];

  try {
    const { data, error } = await supabase
      .from('teacher_messages')
      .select('*')
      .in('class_key', [classKey, 'all-grades'])
      .eq('is_published', true)
      .order('message_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[teacherMessageService] getTeacherMessagesForClass error:', error);
      return [];
    }

    const hiddenIds = await getHiddenTeacherMessageIds(studentId);
    return filterHiddenMessages((data ?? []) as TeacherMessage[], hiddenIds);
  } catch (err) {
    console.error('[teacherMessageService] getTeacherMessagesForClass exception:', err);
    return [];
  }
}

export async function hideTeacherMessageForStudent(studentId: string, messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_hidden_messages')
      .upsert(
        {
          student_id: studentId,
          message_id: messageId,
          message_type: 'teacher_message',
        },
        { onConflict: 'student_id,message_id,message_type' }
      );

    if (error) {
      console.error('[teacherMessageService] hideTeacherMessageForStudent error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[teacherMessageService] hideTeacherMessageForStudent exception:', err);
    return false;
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

/**
 * 관리자/선생님 기능: 기존 선생님 말씀 원본을 삭제합니다. 학생 화면에서는 사용하지 마세요.
 */
export async function deleteTeacherMessage(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('teacher_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('[teacherMessageService] deleteTeacherMessage error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[teacherMessageService] deleteTeacherMessage exception:', err);
    return false;
  }
}