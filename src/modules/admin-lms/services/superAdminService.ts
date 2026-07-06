import { supabase } from '../../../shared/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// 슈퍼관리자 전용 서비스 (주로 중간관리자 계정 생성 등 권한 관리에 사용)

const translateError = (error: any): string => {
  const msg = error?.message || String(error)
  if (msg.includes('Email address is invalid')) {
    return '이 이메일은 사용할 수 없습니다. 실제로 받을 수 있는 이메일 주소를 입력해 주세요.'
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return '이미 등록된 이메일 주소입니다. 다른 이메일을 사용해 주세요.'
  }
  if (msg.includes('Password should be at least')) {
    return '비밀번호는 최소 6자 이상이어야 합니다.'
  }
  return `오류가 발생했습니다: ${msg}`
}

const validateEmail = (email: string) => {
  const domain = email.split('@')[1]
  if (domain === 'test.com' || domain === 'example.com') {
    throw new Error('테스트용 도메인(test.com, example.com)은 사용할 수 없습니다. 실제로 받을 수 있는 이메일 주소를 입력해 주세요.')
  }
}

export const superAdminService = {
  /**
   * 중간관리자 목록 조회
   */
  async getMiddleAdmins() {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, name, email, status, created_at')
      .eq('role', 'middle_admin')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 각 중간관리자별로 배정된 기관 목록 조회
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, middle_admin_id')
      .not('middle_admin_id', 'is', null)

    return admins.map(admin => {
      const assignedOrgs = orgs?.filter(org => org.middle_admin_id === admin.id) || []
      return {
        ...admin,
        assigned_orgs: assignedOrgs
      }
    })
  },

  /**
   * 전체 테스트기관 목록 (기관 할당을 위해 필요)
   */
  async getAllOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, middle_admin_id')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * 중간관리자 계정 생성 및 기관 배정
   * - persistSession: false 인스턴스를 통해 생성(슈퍼관리자 세션 유지)
   */
  async createMiddleAdmin(adminData: any, assignedOrgIds: string[]) {
    // 1. 별도 클라이언트(관리자 세션에 영향 주지 않는)
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error("Supabase 환경 변수가 없습니다.")

    const cleanEmail = adminData.email.trim().toLowerCase()
    validateEmail(cleanEmail)

    const tempClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // 2. Auth 계정 생성 (signUp)
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: cleanEmail,
      password: adminData.password,
      options: {
        data: {
          name: adminData.name,
          role: 'middle_admin' // custom claims in raw_app_meta data if possible
        }
      }
    })

    if (authError) throw new Error(translateError(authError))
    if (!authData.user) throw new Error("계정 생성에 실패했습니다. 다시 시도해 주세요.")

    const userId = authData.user.id

    // 3. profiles 레코드 업데이트 (트리거로 생성되었을 수 있으므로 upsert 또는 update)
    // signUp 시 trigger가 profiles에 레코드를 만들었다고 가정하고 update
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: adminData.name,
        role: 'middle_admin',
        status: adminData.status || 'active'
      })
      .eq('id', userId)

    // 만약 trigger가 없어서 에러가 나면 insert
    if (profileError) {
      await supabase.from('profiles').insert({
        id: userId,
        email: cleanEmail,
        name: adminData.name,
        role: 'middle_admin',
        status: adminData.status || 'active',
        plan_type: 'free',
        monthly_quota: 0
      })
    }

    // 4. 테스트기관 배정
    if (assignedOrgIds.length > 0) {
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ middle_admin_id: userId })
        .in('id', assignedOrgIds)

      if (orgError) throw orgError
    }
  },

  /**
   * 기존 중간관리자 정보 수정 및 기관 재배정
   */
  async updateMiddleAdmin(adminId: string, updates: any, assignedOrgIds: string[]) {
    // 1. Profile 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        status: updates.status
      })
      .eq('id', adminId)

    if (profileError) throw profileError

    // 2. 기존 기관 배정 해제
    await supabase
      .from('organizations')
      .update({ middle_admin_id: null })
      .eq('middle_admin_id', adminId)

    // 3. 새 기관 배정
    if (assignedOrgIds.length > 0) {
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ middle_admin_id: adminId })
        .in('id', assignedOrgIds)

      if (orgError) throw orgError
    }
  }
}
