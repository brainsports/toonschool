import { supabase } from '../../../shared/lib/supabase'
import type {
  MiddleDashboardStats,
  MiddleOrganization,
} from '../types/middleAdmin'

// TODO: 나중에 중간관리자 프로필에 전체 이용권 컬럼이 생기면 동적으로 조회하도록 변경
const MIDDLE_ADMIN_TOTAL_LICENSES = 500;

export const middleAdminService = {
  async getDashboardStats(middleAdminId: string): Promise<MiddleDashboardStats> {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, total_licenses, used_licenses')
      .eq('middle_admin_id', middleAdminId)

    if (error) throw error

    let totalOrgs = 0
    let totalLicenses = MIDDLE_ADMIN_TOTAL_LICENSES
    let usedLicenses = 0
    let totalTeachers = 0
    let totalStudents = 0
    let totalClasses = 0

    if (orgs) {
      totalOrgs = orgs.length
      // 중간관리자가 사용한 이용권 = 하위 기관에 배정한 이용권의 합
      usedLicenses = orgs.reduce((sum, org) => sum + (org.total_licenses || 0), 0)

      const orgIds = orgs.map(org => org.id)
      
      if (orgIds.length > 0) {
        const { data: teachersData } = await supabase
          .from('profiles')
          .select('id, center_id')
          .in('organization_id', orgIds)
          .eq('role', 'teacher')
          
        totalTeachers = teachersData?.length || 0

        const centerIds = Array.from(new Set(teachersData?.map(t => t.center_id).filter(Boolean)))
        
        if (centerIds.length > 0) {
          const { data: studentsData } = await supabase
            .from('students')
            .select('id, center_id')
            .in('center_id', centerIds)

          const uniqueStudentIds = new Set(studentsData?.map(s => s.id))
          totalStudents = uniqueStudentIds.size
          
          const uniqueStudentCenters = new Set(studentsData?.map(s => s.center_id))
          totalClasses = uniqueStudentCenters.size
        }
      }
    }

    return {
      totalOrgs,
      totalLicenses,
      usedLicenses,
      remainingLicenses: totalLicenses - usedLicenses,
      totalTeachers,
      totalStudents,
      totalClasses,
    }
  },

  async getOrganizations(middleAdminId: string): Promise<MiddleOrganization[]> {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('middle_admin_id', middleAdminId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch stats per org
    const orgsWithStats = await Promise.all(orgs.map(async (org) => {
      const { data: teachersData } = await supabase
        .from('profiles')
        .select('id, center_id')
        .eq('organization_id', org.id)
        .eq('role', 'teacher')

      const centerIds = Array.from(new Set(teachersData?.map(t => t.center_id).filter(Boolean)))
      
      let studentCount = 0
      let classCount = 0
      
      if (centerIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, center_id')
          .in('center_id', centerIds)
          
        const uniqueStudentIds = new Set(studentsData?.map(s => s.id))
        studentCount = uniqueStudentIds.size

        const uniqueStudentCenters = new Set(studentsData?.map(s => s.center_id))
        classCount = uniqueStudentCenters.size
      }

      // 기관관리자 대시보드와 동일하게 사용 이용권(allocatedLicenses) 계산
      const { data: allocations } = await supabase
        .from('license_allocations')
        .select('quantity')
        .eq('organization_id', org.id)

      const allocatedLicenses = allocations?.reduce((acc, curr) => acc + curr.quantity, 0) || 0

      return {
        ...org,
        status: org.status || 'active',
        teacher_count: teachersData?.length || 0,
        student_count: studentCount,
        class_count: classCount,
        used_licenses: allocatedLicenses
      }
    }))

    return orgsWithStats
  },

  async getOrganizationDetail(orgId: string): Promise<MiddleOrganization> {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) throw error

    const { data: teachersData } = await supabase
      .from('profiles')
      .select('id, center_id')
      .eq('organization_id', orgId)
      .eq('role', 'teacher')

    const centerIds = Array.from(new Set(teachersData?.map(t => t.center_id).filter(Boolean)))
    
    let studentCount = 0
    let classCount = 0
    
    if (centerIds.length > 0) {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, center_id')
        .in('center_id', centerIds)
        
      const uniqueStudentIds = new Set(studentsData?.map(s => s.id))
      studentCount = uniqueStudentIds.size

      const uniqueStudentCenters = new Set(studentsData?.map(s => s.center_id))
      classCount = uniqueStudentCenters.size
    }
    
    // Fetch org admin info (for the manager_name and email)
    const { data: orgAdminData } = await supabase
      .from('profiles')
      .select('name, email, phone')
      .eq('organization_id', orgId)
      .eq('role', 'org_admin')
      .single()

    return {
      ...org,
      status: org.status || 'active',
      teacher_count: teachersData?.length || 0,
      student_count: studentCount,
      class_count: classCount,
      manager_name: orgAdminData?.name || orgAdminData?.email || '미지정',
      manager_email: orgAdminData?.email,
      phone: orgAdminData?.phone || '-'
    }
  },

  async createOrganization(middleAdminId: string, orgData: any) {
    const { data, error } = await supabase
      .from('organizations')
      .insert([
        { 
          name: orgData.name, 
          middle_admin_id: middleAdminId,
          total_licenses: orgData.total_licenses || 0,
          used_licenses: 0,
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateOrganization(orgId: string, orgData: any) {
    // Cannot reduce total_licenses below used_licenses
    if (orgData.total_licenses !== undefined) {
      const { data: currentOrg } = await supabase.from('organizations').select('used_licenses').eq('id', orgId).single()
      if (currentOrg && orgData.total_licenses < currentOrg.used_licenses) {
        throw new Error('이미 사용한 이용권 수보다 적게 설정할 수 없습니다.')
      }
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(orgData)
      .eq('id', orgId)
      .select()
      .single()

    if (error) throw error
    return data
  },
  
  async deleteOrganization(orgId: string) {
    // Instead of actual delete, maybe just set status to inactive if table supports it, else actual delete
    // Check if table has status column, if not, delete
    // For safety, let's try actual delete, but if it fails due to FK, it will throw.
    // However, the instructions mentioned: "가능하면 실제 삭제보다 비활성 처리 방식이 더 안전합니다."
    // Since organizations schema didn't have status, we assume we might need to add it or do a soft delete.
    // For now, let's do a hard delete or return an error if there are associated profiles.
    
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId)
    if (users && users > 0) {
      throw new Error('이 기관에 소속된 사용자가 있어 삭제할 수 없습니다. 대신 비활성화를 권장합니다.')
    }
    
    const { error } = await supabase.from('organizations').delete().eq('id', orgId)
    if (error) throw error
  },

  async getTeachers(middleAdminId: string): Promise<any[]> {
    const orgs = await this.getOrganizations(middleAdminId)
    if (orgs.length === 0) return []
    const orgIds = orgs.map(o => o.id)
    
    const { data: teachers, error } = await supabase
      .from('profiles')
      .select('id, name, email, organization_id, created_at, status')
      .in('organization_id', orgIds)
      .eq('role', 'teacher')

    if (error) throw error

    return teachers.map(t => {
      const org = orgs.find(o => o.id === t.organization_id)
      return {
        ...t,
        org_name: org?.name || '알 수 없음',
        class_name: '-', // To be implemented
        student_count: 0,
        used_licenses: 0,
        last_active: t.created_at,
        status: t.status || 'active'
      }
    })
  },

  async getStudents(middleAdminId: string): Promise<any[]> {
    const orgs = await this.getOrganizations(middleAdminId)
    if (orgs.length === 0) return []
    const orgIds = orgs.map(o => o.id)
    
    const { data: teachersData } = await supabase
      .from('profiles')
      .select('id, name, center_id, organization_id')
      .in('organization_id', orgIds)
      .eq('role', 'teacher')
      
    const centerIds = Array.from(new Set(teachersData?.map(t => t.center_id).filter(Boolean)))
    
    if (centerIds.length === 0) return []

    const { data: students, error } = await supabase
      .from('students')
      .select('id, login_id, name, grade, center_id, status')
      .in('center_id', centerIds)

    if (error) throw error

    return students.map(s => {
      const teacher = teachersData?.find(t => t.center_id === s.center_id)
      const org = orgs.find(o => o.id === teacher?.organization_id)
      return {
        ...s,
        display_name: s.name,
        grade_level: s.grade,
        org_name: org?.name || '알 수 없음',
        teacher_name: teacher?.name || '선생님 미지정',
      }
    })
  }
}
