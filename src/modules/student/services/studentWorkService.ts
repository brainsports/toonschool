import { supabase } from '../../../shared/lib/supabase';
import type { MyWork } from '../components/mypage/WorkCard';

export async function getStudentWorksByStudentId(profileId: string, authUserId: string): Promise<MyWork[]> {
  try {
    // Attempt query by student_id or user_id
    const { data, error } = await supabase
      .from('toon_projects')
      .select('*')
      .or(`student_id.eq.${profileId},user_id.eq.${authUserId}`)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch student works:', error);
      return [];
    }

    if (!data) return [];

    return data.map((project: any): MyWork => {
      const content = project.content || {};
      const subject = content.subject || '국어';
      // Basic progress estimation
      const progress = content.progress !== undefined ? content.progress : (project.status === 'completed' || content.status === 'completed' ? 100 : 50);
      
      return {
        id: project.id,
        subject: subject,
        title: project.title || '제목 없는 작품',
        progress: progress,
        status: project.status === 'completed' || content.status === 'completed' ? 'completed' : 'in-progress',
        thumbnailUrl: content.thumbnailUrl || content.coverImage || '',
        editorPath: `/student/select-unit?projectId=${project.id}`,
        previewPath: `/student/comic/read?projectId=${project.id}`,
        shareUrl: `${window.location.origin}/student/comic/read?projectId=${project.id}`
      };
    });
  } catch (err) {
    console.error('Exception fetching student works:', err);
    return [];
  }
}
