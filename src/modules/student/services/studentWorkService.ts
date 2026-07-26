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
          .select('*')
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

    // ISO/Date -> 타임스탬프. 없으면 0(정렬 시 맨 뒤).
    const ts = (v: any): number => {
      if (!v) return 0;
      const t = typeof v === 'string' ? Date.parse(v) : v instanceof Date ? v.getTime() : NaN;
      return Number.isFinite(t) ? t : 0;
    };

    type WorkEntry = { work: MyWork; primary: number; secondary: number };
    const worksMap = new Map<string, WorkEntry>();

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

      const primary = ts(project.created_at) || ts(project.updated_at);
      const secondary = ts(project.updated_at) || ts(project.created_at);

      worksMap.set(project.id, {
        primary,
        secondary,
        work: {
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
        },
      });
    });

    // Map shared_comic_books and override/add
    sharedData.forEach((shared: any) => {
      const workId = shared.project_id || shared.id;

      const existingProject = projectsData.find((p: any) => p.id === shared.project_id);

      let subject = shared.subject;
      if (!subject && existingProject?.content) {
        subject = existingProject.content.subject || existingProject.content.curriculum?.subject || existingProject.content.curriculum?.subjectName;
      }
      if (!subject) {
        const textToSearch = `${shared.title || ''} ${shared.summary || ''} ${existingProject?.title || ''} ${existingProject?.summary || ''} ${existingProject?.content?.title || ''} ${existingProject?.content?.topicTitle || ''} ${existingProject?.content?.selectedTopic?.title || ''}`;
        if (textToSearch.includes('사회') || textToSearch.includes('강줄기') || textToSearch.includes('급식') || textToSearch.includes('우리나라') || textToSearch.includes('국토') || textToSearch.includes('산지') || textToSearch.includes('지도')) subject = '사회';
        else if (textToSearch.includes('과학')) subject = '과학';
        else if (textToSearch.includes('수학')) subject = '수학';
        else if (textToSearch.includes('영어')) subject = '영어';
        else if (textToSearch.includes('미술')) subject = '미술';
        else if (textToSearch.includes('국어')) subject = '국어';
        else subject = '기타';
      }

      const possibleTitles = [
        existingProject?.title,
        existingProject?.content?.topicTitle,
        existingProject?.content?.selectedTopic?.title,
        existingProject?.content?.title,
        shared.title
      ];
      let title = possibleTitles.find(t => t && typeof t === 'string' && t.trim() !== '' && t !== '툰스쿨 만화' && t !== '제목 없는 작품') || '제목 없는 작품';

      const primary = ts(shared.created_at) || ts(shared.updated_at);
      const secondary = ts(shared.updated_at) || ts(shared.created_at);

      worksMap.set(workId, {
        primary,
        secondary,
        work: {
          id: workId,
          subject,
          title,
          progress: 100,
          status: 'shared',
          // 공유 작품은 실제 표지 썸네일을 사용(없으면 WorkCard에서 과목 기본값 폴백)
          thumbnailUrl: shared.thumbnail_url || '',
          editorPath: `/book/${shared.slug}`,
          previewPath: `/book/${shared.slug}`,
          shareUrl: `https://toonschool.kr/book/${shared.slug}`,
        },
      });
    });

    // 최신순 정렬: 1) 생성/공유일 내림차순, 2) 동일일 경우 수정일 내림차순.
    // 날짜가 없는 작품은 0이 되어 자연스럽게 맨 뒤로(stable).
    const entries = Array.from(worksMap.values());
    entries.sort((a, b) => {
      if (a.primary !== b.primary) return b.primary - a.primary;
      if (a.secondary !== b.secondary) return b.secondary - a.secondary;
      return 0;
    });
    return entries.map((entry) => entry.work);
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

/**
 * 완성된 작품을 '내 작품' 목록에 즉시 노출하기 위해 shared_comic_books 에
 * 비공개(is_public=false) 드래프트 row를 만든다(또는 이미 있으면 아무 것도 하지 않는다).
 *
 * 배경: 학생 신규 플로우는 완성 시점에 DB 에 작품을 기록하지 않고, 오직
 * '친구에게 자랑하기'(handleShare)에서만 shared_comic_books 에 insert 했다.
 * 그래서 자랑하기를 누르지 않으면 '내 작품'에 영영 노출되지 않는 문제가 있었다.
 * 드래프트 row를 먼저 만들어 두면 getStudentWorks(공개 여부 미필터)에 잡혀 즉시 노출된다.
 *
 * student_name 은 조회 키(profile.name)와 일치하도록 profile.name 을 사용한다.
 * (기존 handleShare 의 authorName 불일치 누락 방지)
 *
 * 주의: shared_comic_books 스키마가 로컬 마이그레이션에 없어 컬럼 제약을 코드만으로
 * 단정할 수 없다. insert 실패 시 콘솔에 로깅만 하고 흐름은 깨지 않는다.
 * 스키마 제약(NOT NULL 등)으로 계속 실패하면 컬럼/기본값 추가 범위를 별도 보고한다.
 */
export async function ensureStudentWorkDraft(params: {
  projectId: string;
  studentName: string;
  title: string;
  subject: string;
  thumbnailUrl?: string;
  grade?: string;
}): Promise<void> {
  const { projectId, studentName, title, subject, thumbnailUrl, grade } = params;
  if (!projectId || !studentName) return;
  try {
    // 이미 row(드래프트/공개)가 있으면 중복 생성 금지.
    const { data: existing } = await supabase
      .from('shared_comic_books')
      .select('project_id')
      .eq('project_id', projectId)
      .maybeSingle();
    if (existing) return;

    const slug = Math.random().toString(36).substring(2, 8);
    const { error } = await supabase.from('shared_comic_books').insert({
      slug,
      project_id: projectId,
      title: title || '툰스쿨 만화',
      subject: subject || '기타',
      student_name: studentName,
      grade: grade || '',
      thumbnail_url: thumbnailUrl || '',
      pages: [],
      is_public: false,
    });
    if (error) {
      // 스키마 제약 등 실패 — 흐름은 유지하고 로깅.
      console.error('[ensureStudentWorkDraft] insert 실패:', error);
    }
  } catch (e) {
    console.error('[ensureStudentWorkDraft] 예외:', e);
  }
}
