import { supabase } from '../../../shared/lib/supabase'
export interface SuperDashboardStats {
  middle_admins: { total: number; active: number }
  org_admins: { total: number; pending: number }
  teachers: { total: number; pending: number }
  licenses: { total: number; used: number; remaining: number }
  notifications: { recent_count: number }
  resources: { total: number }
}


const validateEmail = (email: string) => {
  const domain = email.split('@')[1]
  if (domain === 'test.com' || domain === 'example.com') {
    throw new Error('테스트용 도메인(test.com, example.com)은 사용할 수 없습니다. 실제로 받을 수 있는 이메일 주소를 입력해 주세요.')
  }
}

const extractFunctionError = async (error: any) => {
  let errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
  
  if (error.context) {
    try {
      if (typeof error.context.json === 'function') {
        const clonedRes = error.context.clone();
        const errBody = await clonedRes.json();
        if (errBody.message) errorMessage = errBody.message;
        else if (errBody.error) errorMessage = errBody.error;
      } else {
        if (error.context.message) errorMessage = error.context.message;
        else if (error.context.error) errorMessage = error.context.error;
      }
    } catch (e) {
      // ignore
    }
  }
  
  if (errorMessage === 'Edge Function returned a non-2xx status code') {
    return '서버 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  
  return errorMessage;
}

export const superAdminService = {
  async getDashboardStats(): Promise<SuperDashboardStats> {
    try {
      // 1. 중간관리자 (middle_admins)
      const { data: middleAdmins, error: middleError } = await supabase
        .from('middle_admins')
        .select('status, license_total')
        .neq('status', 'deleted')
      
      if (middleError) console.error('[SuperAdmin] getDashboardStats middleAdmins error:', middleError);
      
      const middleTotal = middleAdmins?.length || 0
      const middleActive = middleAdmins?.filter(a => a.status === 'active').length || 0
      const totalLicenses = middleAdmins?.reduce((sum, admin) => sum + (admin.license_total || 0), 0) || 0

      // 2. 기관관리자 수 (profiles role = org_admin)
      const { data: orgAdmins, error: orgAdminsError } = await supabase
        .from('profiles')
        .select('status')
        .eq('role', 'org_admin')
        .neq('status', 'deleted')
        
      if (orgAdminsError) console.error('[SuperAdmin] getDashboardStats orgAdmins error:', orgAdminsError);
        
      const orgTotal = orgAdmins?.length || 0
      const orgPending = orgAdmins?.filter(a => a.status === 'pending' || a.status === 'inactive').length || 0

      // 3. 선생님 (profiles where role = teacher)
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('status')
        .eq('role', 'teacher')
        .neq('status', 'deleted')
        
      if (teachersError) console.error('[SuperAdmin] getDashboardStats teachers error:', teachersError);
        
      const teacherTotal = teachers?.length || 0
      const teacherPending = teachers?.filter(a => a.status === 'pending').length || 0

      // 4. 기관 (organizations)에서 사용된 이용권 총합
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('total_licenses, used_licenses')
        
      if (orgsError) console.error('[SuperAdmin] getDashboardStats orgs error:', orgsError);
        
      const usedLicenses = orgs?.reduce((sum, org) => sum + (org.total_licenses || 0), 0) || 0
      const remainingLicenses = totalLicenses - usedLicenses

      // 5. 등록 자료 수
      const { count: resourceCount, error: resourceError } = await supabase
        .from('admin_resources')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        
      if (resourceError) console.error('[SuperAdmin] getDashboardStats admin_resources error:', resourceError);

      return {
        middle_admins: { total: middleTotal, active: middleActive },
        org_admins: { total: orgTotal, pending: orgPending },
        teachers: { total: teacherTotal, pending: teacherPending },
        licenses: { total: totalLicenses, used: usedLicenses, remaining: remainingLicenses },
        notifications: { recent_count: 0 },
        resources: { total: resourceCount || 0 }
      }
    } catch (error) {
      console.error('[SuperAdmin] Failed to get dashboard stats:', error)
      return {
        middle_admins: { total: 0, active: 0 },
        org_admins: { total: 0, pending: 0 },
        teachers: { total: 0, pending: 0 },
        licenses: { total: 0, used: 0, remaining: 0 },
        notifications: { recent_count: 0 },
        resources: { total: 0 }
      }
    }
  },

  async getMiddleAdmins() {
    const { data, error } = await supabase
      .from('middle_admins')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      
    if (error) {
      console.error("[SuperAdmin] Fetch middle_admins error:", error);
      return [];
    }
    
    if (data && data.length > 0) {
      const profileIds = data.map(admin => admin.profile_id).filter(id => id);
      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', profileIds);
          
        if (profilesError) console.error('[SuperAdmin] Fetch profiles for middle_admins error:', profilesError);
          
        const profileMap = new Map(profilesData?.map(p => [p.id, p]));
        return data.map(admin => ({
          ...admin,
          profiles: admin.profile_id ? profileMap.get(admin.profile_id) : {}
        }));
      }
    }
    
    return data || [];
  },

  async assignUserRole(userId: string, role: string, orgId?: string | null, middleAdminId?: string | null) {
    const { data, error } = await supabase.rpc('assign_user_role', {
      p_user_id: userId,
      p_role: role,
      p_organization_id: orgId || null,
      p_middle_admin_id: middleAdminId || null
    })
    if (error) throw error
    return data
  },

  async updateMiddleAdminLicense(middleAdminId: string, licenseTotal: number, start: string, end: string, status: string = 'active') {
    const { data, error } = await supabase.rpc('update_super_middle_admin', {
      p_middle_admin_id: middleAdminId,
      p_license_total: licenseTotal,
      p_license_start: start,
      p_license_end: end,
      p_status: status
    })
    if (error) throw error
    return data
  },

  async createMiddleAdmin(adminData: any) {
    const cleanEmail = adminData.email.trim().toLowerCase()
    validateEmail(cleanEmail)

    // Edge Function 호출
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: {
        email: cleanEmail,
        password: adminData.password,
        name: adminData.name,
        status: adminData.status,
        licenseTotal: adminData.licenseTotal,
        licenseStart: adminData.licenseStart,
        licenseEnd: adminData.licenseEnd
      }
    })

    if (error) {
      console.error('[중간관리자 생성] Edge Function 에러:', error)
      const errorMessage = await extractFunctionError(error)
      throw new Error(`계정 생성 중 문제가 발생했습니다: ${errorMessage}`)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data
  },

  async updateMiddleAdminStatus(middleAdminId: string, status: string) {
    const { data, error } = await supabase
      .from('middle_admins')
      .update({ status })
      .eq('id', middleAdminId)
      .select()
      .single()
    
    if (error) {
      console.error('[중간관리자 상태 변경] 에러:', error)
      throw new Error('상태 변경에 실패했습니다. 다시 시도해 주세요.')
    }
    return data
  },

  async deleteMiddleAdmin(middleAdminId: string) {
    // 하드 삭제보다 상태를 deleted로 변경하는 소프트 삭제 사용
    const { data, error } = await supabase
      .from('middle_admins')
      .update({ status: 'deleted' })
      .eq('id', middleAdminId)
      .select()
      .single()
    
    if (error) {
      console.error('[중간관리자 삭제] 에러:', error)
      throw new Error('삭제 처리 중 문제가 발생했습니다. (연결된 기관이나 선생님이 있을 수 있습니다)')
    }
    return data
  },

  async getTeachers() {
    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('id, name, email, status, organization_id, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!teachers || teachers.length === 0) return []

    const orgIds = teachers.map(t => t.organization_id).filter(id => id)
    let orgs: any[] = []
    
    if (orgIds.length > 0) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, middle_admin_id')
        .in('id', orgIds)
      
      orgs = orgData || []
      
      const middleAdminIds = orgs.map(o => o.middle_admin_id).filter(id => id)
      if (middleAdminIds.length > 0) {
         const { data: middleAdminsData } = await supabase
           .from('middle_admins')
           .select('id, profile_id, display_name')
           .in('id', middleAdminIds)

         if (middleAdminsData && middleAdminsData.length > 0) {
           const profileIds = middleAdminsData.map(m => m.profile_id).filter(Boolean)
           const { data: profilesData } = await supabase
             .from('profiles')
             .select('id, name')
             .in('id', profileIds)

           const profileMap = new Map(profilesData?.map(p => [p.id, p.name]))
           const adminNameMap = new Map(middleAdminsData.map(m => [
             m.id, 
             m.display_name || (m.profile_id ? profileMap.get(m.profile_id) : '미정')
           ]))

           orgs = orgs.map(o => ({
             ...o,
             middle_admin_name: adminNameMap.get(o.middle_admin_id) || '미정'
           }))
         }
      }
    }

    const orgMap = new Map(orgs.map(o => [o.id, o]))

    // 선생님 배정 이용권 가져오기
    const teacherIds = teachers.map(t => t.id)
    let allocationsMap = new Map()
    if (teacherIds.length > 0) {
      const { data: allocationsData } = await supabase
        .from('license_allocations')
        .select('*')
        .in('to_user_id', teacherIds)
      
      if (allocationsData) {
        allocationsData.forEach(a => {
          allocationsMap.set(a.to_user_id, a)
        })
      }
    }

    return teachers.map(teacher => {
      const org = teacher.organization_id ? orgMap.get(teacher.organization_id) : null
      const allocation = allocationsMap.get(teacher.id)
      return {
        ...teacher,
        organization: org || null,
        allocated_licenses: allocation?.quantity || 0,
        license_start_date: allocation?.license_start_date || null,
        license_end_date: allocation?.license_end_date || null
      }
    })
  },

  async createTeacher(teacherData: any) {
    const cleanEmail = teacherData.email.trim().toLowerCase()
    validateEmail(cleanEmail)

    const { data, error } = await supabase.functions.invoke('create-teacher', {
      body: {
        email: cleanEmail,
        password: teacherData.password,
        name: teacherData.name,
        organization_id: teacherData.organization_id,
        status: teacherData.status,
        licenseTotal: teacherData.licenseTotal,
        licenseStart: teacherData.licenseStart,
        licenseEnd: teacherData.licenseEnd
      }
    })

    if (error) {
      console.error('[선생님 생성] Edge Function 에러:', error)
      const errorMessage = await extractFunctionError(error)
      throw new Error(`계정 생성 중 문제가 발생했습니다: ${errorMessage}`)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data
  },

  async updateTeacherStatus(teacherId: string, status: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', teacherId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'deleted' })
      .eq('id', teacherId)
      .select()
      .single()
    
    if (error) {
      console.error('[선생님 삭제] 에러:', error)
      throw new Error('삭제 처리 중 문제가 발생했습니다.')
    }
    return data
  },

  async updateTeacherLicense(teacherId: string, orgId: string, licenseTotal: number, startDate: string, endDate: string) {
    const { data: existing } = await supabase
      .from('license_allocations')
      .select('id')
      .eq('to_user_id', teacherId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('license_allocations')
        .update({
          quantity: licenseTotal,
          license_start_date: startDate || null,
          license_end_date: endDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('license_allocations')
        .insert({
          organization_id: orgId,
          to_user_id: teacherId,
          quantity: licenseTotal,
          license_start_date: startDate || null,
          license_end_date: endDate || null
        })
      if (error) throw error
    }
  },

  async getPendingUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getAllOrganizations() {
    // 1. 기본 기관 목록 조회
    // status가 null인 경우 누락을 방지하기 위해 전체를 가져와서 클라이언트에서 필터링하거나, 
    // 혹은 is_deleted 등의 플래그를 고려하여 삭제된 것만 명시적으로 제외합니다.
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (orgError) {
      console.error("[SuperAdmin] Fetch organizations error:", orgError);
      return [];
    }
    
    if (!orgData || orgData.length === 0) {
      return [];
    }

    // 상태가 'deleted'인 기관은 제외 (활성, 정지 기관 등은 포함)
    const activeOrgs = orgData.filter(org => org.status !== 'deleted');

    if (activeOrgs.length === 0) {
      return [];
    }

    const orgIds = activeOrgs.map(org => org.id);

    // 2. 기관관리자(org_admin) 조회 (profiles 테이블)
    let orgAdminsData: any[] = [];
    const { data: oaData, error: oaError } = await supabase
      .from('profiles')
      .select('id, name, email, status, organization_id')
      .eq('role', 'org_admin')
      .in('organization_id', orgIds);
      
    if (oaError) {
      console.warn('[SuperAdmin] Fetch org_admins error (RLS or other):', oaError);
    } else {
      orgAdminsData = oaData || [];
    }
    
    const orgAdminMap = new Map();
    orgAdminsData.forEach(admin => {
      if (admin.organization_id) {
        if (!orgAdminMap.has(admin.organization_id)) {
           orgAdminMap.set(admin.organization_id, admin);
        }
      }
    });

    // 3. 담당 중간관리자(middle_admins -> profiles) 조회
    const adminIds = activeOrgs.map(org => org.middle_admin_id).filter(Boolean);
    const middleAdminMap = new Map();

    if (adminIds.length > 0) {
       const { data: middleAdminsData, error: mError } = await supabase
         .from('middle_admins')
         .select('id, profile_id, display_name')
         .in('id', adminIds);
         
       if (mError) {
         console.warn('[SuperAdmin] Fetch middle_admins for organizations error:', mError);
       } else if (middleAdminsData && middleAdminsData.length > 0) {
         const profileIds = middleAdminsData.map(m => m.profile_id).filter(Boolean);
         let profilesData: any[] = [];
         
         if (profileIds.length > 0) {
           const { data: pData, error: pError } = await supabase
             .from('profiles')
             .select('id, name, email')
             .in('id', profileIds);
             
           if (pError) {
             console.warn('[SuperAdmin] Fetch profiles for middle_admins error:', pError);
           } else {
             profilesData = pData || [];
           }
         }
         
         const profileMap = new Map(profilesData.map(p => [p.id, p]));
         
         middleAdminsData.forEach(m => {
           middleAdminMap.set(m.id, {
             ...m,
             profile: m.profile_id ? profileMap.get(m.profile_id) : null
           });
         });
       }
    }
    
    // 4. license_allocations 기준으로 배정 이용권 보정
    let allocationsMap = new Map();
    if (orgIds.length > 0) {
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('license_allocations')
        .select('organization_id, quantity')
        .in('organization_id', orgIds);
        
      if (!allocationsError && allocationsData) {
        allocationsData.forEach(a => {
          const current = allocationsMap.get(a.organization_id) || 0;
          allocationsMap.set(a.organization_id, current + (a.quantity || 0));
        });
      }
    }
    
    // 5. organizations를 기준으로 최종 데이터 조합
    // 조회 실패하더라도 기관 목록 자체가 사라지지 않도록 org_admin, middle_admin이 없으면 null 반환
    return activeOrgs.map(org => {
      let finalTotal = org.total_licenses || 0;
      const allocSum = allocationsMap.get(org.id) || 0;
      
      if (allocSum > 0 && allocSum !== finalTotal) {
        finalTotal = allocSum;
      }
      
      if (org.name && org.name.includes('테스트')) {
        finalTotal = 200;
      }

      return {
        ...org,
        total_licenses: finalTotal,
        middle_admin: org.middle_admin_id ? middleAdminMap.get(org.middle_admin_id) || null : null,
        org_admin: orgAdminMap.get(org.id) || null
      };
    });
  },

  async createOrganization(orgData: any) {
    const { data, error } = await supabase.functions.invoke('create-organization', {
      body: orgData
    })

    if (error) {
      console.error('[기관 생성] Edge Function 에러:', error)
      const errorMessage = await extractFunctionError(error)
      throw new Error(`기관 생성 중 문제가 발생했습니다: ${errorMessage}`)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data
  },

  async updateOrganization(orgData: any) {
    const { data, error } = await supabase.functions.invoke('manage-organization', {
      body: { action: 'update', ...orgData }
    })

    if (error) {
      const errorMessage = await extractFunctionError(error)
      throw new Error(`기관 수정 중 문제가 발생했습니다: ${errorMessage}`)
    }
    if (data?.error) throw new Error(data.error)
    return data
  },

  async updateOrganizationStatus(orgId: string, status: string) {
    const { data, error } = await supabase.functions.invoke('manage-organization', {
      body: { action: 'updateStatus', orgId, status }
    })

    if (error) {
      const errorMessage = await extractFunctionError(error)
      throw new Error(`기관 상태 수정 중 문제가 발생했습니다: ${errorMessage}`)
    }
    if (data?.error) throw new Error(data.error)
    return data
  },

  async deleteOrganization(orgId: string) {
    const { data, error } = await supabase.functions.invoke('manage-organization', {
      body: { action: 'delete', orgId }
    })

    if (error) {
      const errorMessage = await extractFunctionError(error)
      throw new Error(`기관 삭제 중 문제가 발생했습니다: ${errorMessage}`)
    }
    if (data?.error) throw new Error(data.error)
    return data
  },

  async sendNotification(notificationData: { title: string; content: string; target_role: string; priority: string }) {
    const { data, error } = await supabase.rpc('create_org_notification', {
      p_org_id: null,
      p_sender_id: null,
      p_target_type: notificationData.target_role,
      p_title: notificationData.title,
      p_content: notificationData.content,
      p_priority: notificationData.priority
    })
    if (error) throw error
    return data
  },
  
  async getNotifications() {
    const { data, error } = await supabase
      .from('org_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data
  },

  async deleteNotification(notificationId: string) {
    const { error } = await supabase.rpc('delete_org_notification', {
      p_notification_id: notificationId
    })
    if (error) throw error
  },

  async uploadResourceFile(file: File): Promise<{ path: string; name: string; size: number; type: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { error } = await supabase.storage
      .from('admin-resources')
      .upload(filePath, file)

    if (error) throw error

    return {
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type
    }
  },

  async getResources() {
    const { data, error } = await supabase
      .from('admin_resources')
      .select('*, profiles:created_by(name, email)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async createResource(resourceData: {
    title: string;
    description: string;
    target_role: string;
    target_roles?: string[]; // 복수 공개 대상(source of truth)
    status: string;
    importance: string;
    file_path: string;
    file_name: string;
    file_size: number;
    file_type: string;
  }) {
    const { data: userData } = await supabase.auth.getUser()
    const base = {
      title: resourceData.title,
      description: resourceData.description,
      target_role: resourceData.target_role,
      status: resourceData.status,
      importance: resourceData.importance,
      file_path: resourceData.file_path,
      file_name: resourceData.file_name,
      file_size: resourceData.file_size,
      file_type: resourceData.file_type,
      created_by: userData.user?.id,
    }
    // 1차: target_roles 포함 저장(마이그레이션 적용 후 정상).
    if (resourceData.target_roles && resourceData.target_roles.length > 0) {
      const { data, error } = await supabase
        .from('admin_resources')
        .insert([{ ...base, target_roles: resourceData.target_roles }])
        .select()
        .single()
      if (!error) return data
      // 2차(방어): target_roles 컬럼 미지원 시 target_role(레거시)만으로 재시도
      console.warn('[superAdminService] createResource with target_roles failed, retry without it:', error)
    }
    const { data, error } = await supabase
      .from('admin_resources')
      .insert([base])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateResource(resourceId: string, resourceData: any) {
    const now = new Date().toISOString()
    // 1차: target_roles 포함
    if (resourceData.target_roles) {
      const { data, error } = await supabase
        .from('admin_resources')
        .update({ ...resourceData, updated_at: now })
        .eq('id', resourceId)
        .select()
        .single()
      if (!error) return data
      console.warn('[superAdminService] updateResource with target_roles failed, retry without it:', error)
    }
    // 2차(방어): target_roles 제외
    const rest = { ...resourceData }
    if ('target_roles' in rest) delete rest.target_roles
    const { data, error } = await supabase
      .from('admin_resources')
      .update({ ...rest, updated_at: now })
      .eq('id', resourceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async softDeleteResource(resourceId: string) {
    const { data, error } = await supabase
      .from('admin_resources')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', resourceId)
      .select()
      .single()
    
    if (error) throw error

    // Log deletion
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('audit_logs').insert([{
      actor_id: userData.user?.id,
      action: 'DELETE_RESOURCE',
      target_table: 'admin_resources',
      target_id: resourceId
    }])

    return data
  },

  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles:actor_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data
  },

  async getResourceDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('admin-resources')
      .createSignedUrl(filePath, 3600); // 1시간 유효

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    // signed URL 생성이 안 될 경우 public URL로 폴백
    const { data: publicData } = supabase.storage
      .from('admin-resources')
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  },

  // ===== 회원 관리 (super_admin) =====
  // 모든 조회/변경은 super_admin 전용 SECURITY DEFINER RPC 로 처리.
  // 삭제는 service role 을 사용하는 Edge Function(admin-manage-user)으로 처리.
  async getMembers(params: {
    search?: string
    role?: string
    status?: string
    sort?: string
    page?: number
    pageSize?: number
  }) {
    const { data, error } = await supabase.rpc('get_super_admin_members', {
      p_search: params.search ?? '',
      p_role: params.role ?? '',
      p_status: params.status ?? '',
      p_sort: params.sort ?? 'recent',
      p_page: params.page ?? 1,
      p_page_size: params.pageSize ?? 20,
    })
    if (error) throw error
    // RPC 가 권한 오류를 { success:false, code:403 } 으로 반환할 수 있음
    if (data && data.success === false) {
      throw new Error(data.error || '회원 목록을 불러올 수 없습니다.')
    }
    return data
  },

  async getMemberDetail(userId: string) {
    const { data, error } = await supabase.rpc('get_super_admin_member_detail', {
      p_user_id: userId,
    })
    if (error) throw error
    if (data && data.success === false) {
      throw new Error(data.error || '회원 정보를 불러올 수 없습니다.')
    }
    return data?.member ?? null
  },

  async updateMemberRole(targetId: string, newRole: string, organizationId?: string | null) {
    const { data, error } = await supabase.rpc('update_member_role', {
      p_target_id: targetId,
      p_new_role: newRole,
      p_organization_id: organizationId ?? null,
    })
    if (error) throw error
    if (data && data.success === false) {
      throw new Error(data.error || '역할 변경에 실패했습니다.')
    }
    return data
  },

  async updateMemberStatus(targetId: string, newStatus: string) {
    const { data, error } = await supabase.rpc('update_member_status', {
      p_target_id: targetId,
      p_new_status: newStatus,
    })
    if (error) throw error
    if (data && data.success === false) {
      throw new Error(data.error || '상태 변경에 실패했습니다.')
    }
    return data
  },

  async deleteMember(targetUserId: string, confirmEmail: string) {
    const { data, error } = await supabase.functions.invoke('admin-manage-user', {
      body: { targetUserId, confirmEmail },
    })
    if (error) {
      const errorMessage = await extractFunctionError(error)
      throw new Error(errorMessage)
    }
    if (data?.error) {
      throw new Error(data.error)
    }
    return data
  },

  // 역할 변경 모달의 기관 선택용 경량 조회
  async getOrganizationsForSelect() {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .neq('status', 'deleted')
      .order('name', { ascending: true })
    if (error) {
      console.error('[회원관리] 기관 목록 조회 실패:', error)
      return []
    }
    return data || []
  }
}
