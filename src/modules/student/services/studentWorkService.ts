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
  profileName,
  limit = 50,
}: {
  profileId?: string | null;
  authUserId?: string | null;
  profileName?: string | null;
  limit?: number;
}): Promise<MyWork[]> {
  // 조회 조건이 하나도 없으면 빈 배열 반환
  if (!profileId && !authUserId && !profileName) {
    return [];
  }

  try {
    const conditions: string[] = [];
    if (profileId) conditions.push(`student_id.eq.${profileId}`);
    if (authUserId) conditions.push(`user_id.eq.${authUserId}`);
    const orCondition = conditions.length > 0 ? conditions.join(',') : null;

    const queries = [];

    // Query 1: toon_projects
    if (orCondition) {
      queries.push(
        supabase
          .from('toon_projects')
          .select('id, user_id, student_id, title, summary, status, thumbnail_url, content, created_at, updated_at')
          .or(orCondition)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(limit)
      );
    } else {
      queries.push(Promise.resolve({ data: [], error: null }));
    }

    // Query 2: shared_comic_books
    if (profileName) {
      queries.push(
        supabase
          .from('shared_comic_books')
          .select('id, project_id, title, slug, thumbnail_url, created_at, grade')
          .eq('student_name', profileName)
          .limit(limit)
      );
    } else {
      queries.push(Promise.resolve({ data: [], error: null }));
    }

    const [projectsResult, sharedResult] = await Promise.all(queries);

    if (projectsResult.error) {
      console.error('[studentWorkService] toon_projects 조회 실패:', projectsResult.error);
    }
    if (sharedResult.error) {
      console.error('[studentWorkService] shared_comic_books 조회 실패:', sharedResult.error);
    }

    const projectsData = projectsResult.data || [];
    const sharedData = sharedResult.data || [];

    const worksMap = new Map<string, MyWork>();

    // Map toon_projects
    projectsData.forEach((project: any) => {
      const content = project.content || {};
      const subject: string = content.subject || '국어';
      const progress: number =
        content.progress !== undefined
          ? content.progress
          : project.status === 'completed' || project.status === 'published' || content.status === 'completed'
          ? 100
          : 50;

      worksMap.set(project.id, {
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
      });
    });

    // Map shared_comic_books and override/add
    sharedData.forEach((shared: any) => {
      // project_id가 있으면 기존 toon_projects와 중복 제거 (shared를 우선하거나 기존 것을 유지)
      // 여기서는 shared_comic_books를 "shared" 상태로 유지
      const workId = shared.project_id || shared.id;
      
      worksMap.set(workId, {
        id: workId,
        subject: '국어', // 공유작은 과목이 명시되지 않은 경우가 많으므로 기본값
        title: shared.title || '공유된 작품',
        progress: 100,
        status: 'shared',
        thumbnailUrl: shared.thumbnail_url || '',
        editorPath: `/book/${shared.slug}`,
        previewPath: `/book/${shared.slug}`,
        shareUrl: `${window.location.origin}/book/${shared.slug}`,
      });
    });

    return Array.from(worksMap.values());
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
