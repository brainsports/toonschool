import { supabase } from '../../../shared/lib/supabase';
import type { MyWork } from '../components/mypage/WorkCard';

/**
 * 현재 로그인한 학생의 작품을 조회합니다.
 *
 * toon_projects 구조:
 * - user_id: auth.user.id (선생님 계정으로 저장한 경우)
 * - student_id: students.id = profiles.id = auth.user.id (학생 계정으로 저장한 경우)
 *
 * 두 경우를 모두 OR 조건으로 조회하여 어떤 학생 계정에도 적용됩니다.
 * 특정 학생 id는 절대 하드코딩하지 않습니다.
 *
 * @param profileId  현재 로그인한 사용자의 profiles.id (= students.id = auth.user.id)
 * @param authUserId 현재 로그인한 사용자의 auth.user.id (profileId와 동일하나 null-safe 보조)
 * @param limit      조회할 최대 건수 (기본 50)
 */
export async function getStudentWorks({
  profileId,
  authUserId,
  limit = 50,
}: {
  profileId?: string | null;
  authUserId?: string | null;
  limit?: number;
}): Promise<MyWork[]> {
  // 조회 조건이 하나도 없으면 빈 배열 반환
  if (!profileId && !authUserId) {
    return [];
  }

  try {
    // OR 조건 구성: 유효한 id만 포함
    const conditions: string[] = [];
    if (profileId) conditions.push(`student_id.eq.${profileId}`);
    if (authUserId) conditions.push(`user_id.eq.${authUserId}`);

    const orCondition = conditions.join(',');

    const { data, error } = await supabase
      .from('toon_projects')
      .select(
        'id, user_id, student_id, title, summary, status, thumbnail_url, content, created_at, updated_at'
      )
      .or(orCondition)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[studentWorkService] 작품 조회 실패:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((project: any): MyWork => {
      const content = project.content || {};
      // subject: content 내부 또는 기본값
      const subject: string = content.subject || '국어';
      // progress: content 내부 값 또는 status 기반 추산
      const progress: number =
        content.progress !== undefined
          ? content.progress
          : project.status === 'completed' || project.status === 'published' || content.status === 'completed'
          ? 100
          : 50;

      return {
        id: project.id,
        subject,
        title: project.title || '제목 없는 작품',
        progress,
        status:
          project.status === 'completed' ||
          project.status === 'published' ||
          content.status === 'completed'
            ? 'completed'
            : 'in-progress',
        thumbnailUrl: project.thumbnail_url || content.thumbnailUrl || content.coverImage || '',
        editorPath: `/student/select-unit?projectId=${project.id}`,
        previewPath: `/student/comic/read?projectId=${project.id}`,
        shareUrl: `${window.location.origin}/student/comic/read?projectId=${project.id}`,
      };
    });
  } catch (err) {
    console.error('[studentWorkService] 예외 발생:', err);
    return [];
  }
}

/**
 * @deprecated getStudentWorks를 사용하세요.
 * 하위 호환성을 위해 유지합니다.
 */
export async function getStudentWorksByStudentId(
  profileId: string,
  authUserId: string
): Promise<MyWork[]> {
  return getStudentWorks({ profileId, authUserId });
}
