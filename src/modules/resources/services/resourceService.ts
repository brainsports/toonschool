import { supabase } from '../../../shared/lib/supabase'

export interface InboxResource {
  id: string
  title: string
  description: string | null
  file_path: string
  file_name: string | null
  file_size: number | null
  file_type: string | null
  file_url?: string | null
  target_role: string
  status: string
  importance: string
  created_at: string
}

export const resourceService = {
  async getInboxResources(role: string): Promise<InboxResource[]> {
    try {
      const { data, error } = await supabase
        .from('admin_resources')
        .select('*')
        .eq('status', 'published')
        .is('deleted_at', null)
        .in('target_role', ['all', role])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching inbox resources:', error)
        throw error
      }

      return data as InboxResource[]
    } catch (error) {
      console.error('getInboxResources failed:', error)
      throw error
    }
  },

  async getResourceDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('admin-resources')
      .createSignedUrl(filePath, 3600) // 1시간 유효

    if (!error && data?.signedUrl) {
      return data.signedUrl
    }

    // signed URL 생성이 안 될 경우 public URL로 폴백
    const { data: publicData } = supabase.storage
      .from('admin-resources')
      .getPublicUrl(filePath)

    if (publicData?.publicUrl) {
      return publicData.publicUrl
    }

    throw new Error('다운로드 링크를 생성할 수 없습니다.')
  }
}
