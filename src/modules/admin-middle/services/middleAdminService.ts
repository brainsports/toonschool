import { supabase } from '../../../shared/lib/supabase'
import type {
  MiddleDashboardStats,
  MiddleOrganization,
} from '../types/middleAdmin'

export const middleAdminService = {
  async getDashboardStats(middleAdminId: string): Promise<MiddleDashboardStats> {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, total_licenses, used_licenses')
      .eq('middle_admin_id', middleAdminId)

    if (error) throw error

    let totalOrgs = 0
    let totalLicenses = 0
    let usedLicenses = 0
    let totalTeachers = 0
    let totalStudents = 0
    let totalClasses = 0

    if (orgs) {
      totalOrgs = orgs.length
      totalLicenses = orgs.reduce((sum, org) => sum + org.total_licenses, 0)
      usedLicenses = orgs.reduce((sum, org) => sum + org.used_licenses, 0)

      const orgIds = orgs.map(org => org.id)
      
      if (orgIds.length > 0) {
        const { count: teacherCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('organization_id', orgIds)
          .eq('role', 'teacher')
          
        totalTeachers = teacherCount || 0

        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .in('organization_id', orgIds)

        totalStudents = studentCount || 0
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
      const { count: teacherCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .eq('role', 'teacher')

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)

      return {
        ...org,
        status: org.status || 'active',
        teacher_count: teacherCount || 0,
        student_count: studentCount || 0,
        class_count: 0
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

    const { count: teacherCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'teacher')

    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    return {
      ...org,
      status: org.status || 'active',
      teacher_count: teacherCount || 0,
      student_count: studentCount || 0,
      class_count: 0
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
    
    const { data: students, error } = await supabase
      .from('students')
      .select('id, login_id, display_name, grade_level, class_name, organization_id, status, created_by')
      .in('organization_id', orgIds)

    if (error) throw error

    return students.map(s => {
      const org = orgs.find(o => o.id === s.organization_id)
      return {
        ...s,
        org_name: org?.name || '알 수 없음',
        teacher_name: '-', // fetch teacher name by created_by
      }
    })
  }
}
