import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { superAdminService } from '../services/superAdminService'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import {
  UserCog,
  Search,
  Users,
  UserCheck,
  ShieldCheck,
  Building2,
  GraduationCap,
  Ban,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// ---- 역할/상태 라벨 & 배지 (DB 실제 값 기준) ----
const ROLE_LABELS: Record<string, string> = {
  free_user: '일반회원',
  middle_admin: '중간관리자',
  org_admin: '기관관리자',
  teacher: '선생님',
  student: '학생',
  super_admin: '슈퍼관리자',
}

const ROLE_BADGE: Record<string, string> = {
  free_user: 'bg-gray-100 text-gray-700',
  middle_admin: 'bg-purple-100 text-purple-700',
  org_admin: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  student: 'bg-amber-100 text-amber-700',
  super_admin: 'bg-rose-100 text-rose-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  pending: '승인대기',
  suspended: '이용정지',
  inactive: '비활성',
  deleted: '삭제됨',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-600',
  deleted: 'bg-gray-200 text-gray-500',
}

// 역할 변경 UI에서 선택 가능한 역할 (super_admin 제외)
const CHANGEABLE_ROLES = ['free_user', 'middle_admin', 'org_admin', 'teacher', 'student']

interface MemberRow {
  id: string
  email: string | null
  name: string | null
  role: string
  status: string
  organization_id: string | null
  organization_name: string | null
  plan_type?: string
  monthly_quota?: number
  monthly_used?: number
  created_at: string | null
  last_sign_in_at: string | null
  email_confirmed_at?: string | null
  center_id?: string | null
  updated_at?: string | null
}

const PAGE_SIZE = 20

const formatDate = (v: string | null | undefined) => {
  if (!v) return '없음'
  try {
    return new Date(v).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '없음'
  }
}

export default function MemberManagement() {
  const { profile, user } = useAuth()

  const [members, setMembers] = useState<MemberRow[]>([])
  const [counts, setCounts] = useState({
    all: 0, free_user: 0, middle_admin: 0, org_admin: 0, teacher: 0, student: 0, suspended: 0,
  })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)

  // 모달 상태
  const [detailMember, setDetailMember] = useState<MemberRow | null>(null)
  const [roleTarget, setRoleTarget] = useState<MemberRow | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ member: MemberRow; newStatus: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null)

  const [selectedRole, setSelectedRole] = useState('free_user')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
  const [deleteEmailInput, setDeleteEmailInput] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3500)
  }

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await superAdminService.getMembers({
        search, role: roleFilter, status: statusFilter, sort, page, pageSize: PAGE_SIZE,
      })
      setMembers(data?.members ?? [])
      setTotal(data?.total ?? 0)
      if (data?.counts) setCounts(data.counts)
    } catch (err) {
      console.error('[회원관리] 목록 조회 실패:', err)
      showToast('error', err instanceof Error ? err.message : '회원 목록을 불러오지 못했습니다.')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter, sort, page])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // 기관 목록은 역할 변경 모달에서만 필요
  useEffect(() => {
    superAdminService.getOrganizationsForSelect().then(setOrganizations).catch(() => {})
  }, [])

  // 권한 가드: super_admin 만 접근 (서버 RPC 가 최종 보증, 여기는 2차 방어)
  if (profile && profile.role !== 'super_admin') {
    return <Navigate to="/admin/super/dashboard" replace />
  }
  if (!profile) {
    return <div className="p-8 text-gray-500">권한을 확인하는 중...</div>
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setRoleFilter('')
    setStatusFilter('')
    setSort('recent')
    setPage(1)
  }

  // ---- 역할 변경 ----
  const openRoleModal = (m: MemberRow) => {
    setRoleTarget(m)
    setSelectedRole(m.role === 'super_admin' ? 'free_user' : m.role)
    setSelectedOrgId(m.organization_id ?? '')
  }

  const handleConfirmRoleChange = async () => {
    if (!roleTarget) return
    if (['org_admin', 'teacher'].includes(selectedRole) && !selectedOrgId) {
      showToast('error', '해당 역할은 소속 기관을 선택해야 합니다.')
      return
    }
    setActionLoading(true)
    try {
      await superAdminService.updateMemberRole(
        roleTarget.id,
        selectedRole,
        ['org_admin', 'teacher'].includes(selectedRole) ? selectedOrgId : null
      )
      showToast('success', `${roleTarget.name || roleTarget.email || '회원'}님의 역할이 변경되었습니다.`)
      setRoleTarget(null)
      fetchMembers()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '역할 변경에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  // ---- 상태 변경 ----
  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return
    setActionLoading(true)
    try {
      await superAdminService.updateMemberStatus(statusTarget.member.id, statusTarget.newStatus)
      showToast('success', '상태가 변경되었습니다.')
      setStatusTarget(null)
      fetchMembers()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '상태 변경에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  // ---- 삭제 ----
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await superAdminService.deleteMember(deleteTarget.id, deleteEmailInput)
      showToast('success', '회원이 삭제되었습니다.')
      setDeleteTarget(null)
      setDeleteEmailInput('')
      fetchMembers()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setActionLoading(false)
    }
  }

  const summaryCards = [
    { label: '전체 회원', value: counts.all, icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: '일반회원', value: counts.free_user, icon: UserCheck, color: 'bg-gray-100 text-gray-600' },
    { label: '중간관리자', value: counts.middle_admin, icon: ShieldCheck, color: 'bg-purple-100 text-purple-600' },
    { label: '기관관리자', value: counts.org_admin, icon: Building2, color: 'bg-blue-100 text-blue-600' },
    { label: '선생님', value: counts.teacher, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
    { label: '학생', value: counts.student, icon: GraduationCap, color: 'bg-amber-100 text-amber-600' },
    { label: '정지 회원', value: counts.suspended, icon: Ban, color: 'bg-red-100 text-red-600' },
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog className="w-7 h-7 text-[#6B4EFE]" />
          회원 관리
        </h1>
        <p className="text-sm text-gray-500 mt-1">회원가입한 사용자의 계정, 역할, 상태를 관리합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          )
        })}
      </div>

      {/* 검색/필터/정렬 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="이름, 이메일, UID, 기관명 검색"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-[#6B4EFE] focus:ring-1 focus:ring-[#6B4EFE] outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#6B4EFE] hover:bg-[#5839F6] text-white text-sm font-medium"
          >
            검색
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="">역할 전체</option>
            <option value="free_user">일반회원</option>
            <option value="middle_admin">중간관리자</option>
            <option value="org_admin">기관관리자</option>
            <option value="teacher">선생님</option>
            <option value="student">학생</option>
            <option value="super_admin">슈퍼관리자</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="">상태 전체</option>
            <option value="active">활성</option>
            <option value="pending">승인대기</option>
            <option value="suspended">이용정지</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="recent">최근 가입순</option>
            <option value="oldest">오래된 가입순</option>
            <option value="recent_login">최근 로그인순</option>
            <option value="name">이름순</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
          >
            초기화
          </button>

          <div className="ml-auto text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{total}</span>명
          </div>
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-4 py-3 font-semibold">이메일</th>
                <th className="px-4 py-3 font-semibold">역할</th>
                <th className="px-4 py-3 font-semibold">소속 기관</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">가입일</th>
                <th className="px-4 py-3 font-semibold">최근 로그인</th>
                <th className="px-4 py-3 font-semibold text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">불러오는 중...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">조회된 회원이 없습니다.</td>
                </tr>
              ) : (
                members.map((m) => {
                  const isSelf = user?.id === m.id
                  const isSuperAdmin = m.role === 'super_admin'
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {m.name || '-'}
                        {isSelf && <span className="ml-2 text-xs text-[#6B4EFE]">(나)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[m.role] || 'bg-gray-100 text-gray-700'}`}>
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.organization_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[m.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[m.status] || m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.last_sign_in_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailMember(m)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="상세"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRoleModal(m)}
                            disabled={isSelf || isSuperAdmin}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6B4EFE] hover:bg-[#F4F2FF] disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? '자기 자신은 변경할 수 없습니다' : isSuperAdmin ? '슈퍼관리자 역할은 변경할 수 없습니다' : '역할 변경'}
                          >
                            역할
                          </button>
                          <button
                            onClick={() => setStatusTarget({ member: m, newStatus: m.status === 'suspended' ? 'active' : 'suspended' })}
                            disabled={isSelf || isSuperAdmin}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? '자기 자신은 변경할 수 없습니다' : '상태 변경'}
                          >
                            {m.status === 'suspended' ? '활성화' : '정지'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(m)}
                            disabled={isSelf || isSuperAdmin}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isSelf ? '자기 자신은 삭제할 수 없습니다' : isSuperAdmin ? '슈퍼관리자는 삭제할 수 없습니다' : '삭제'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} / ${total}명` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {detailMember && (
        <Modal onClose={() => setDetailMember(null)} title="회원 상세정보">
          <DetailGrid member={detailMember} />
          <div className="mt-6 flex justify-end">
            <button onClick={() => setDetailMember(null)} className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700">닫기</button>
          </div>
        </Modal>
      )}

      {/* 역할 변경 모달 */}
      {roleTarget && (
        <Modal onClose={() => !actionLoading && setRoleTarget(null)} title="역할 변경">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div><span className="text-gray-500">회원:</span> <span className="font-medium text-gray-900">{roleTarget.name || '-'}</span></div>
              <div className="text-gray-500">{roleTarget.email}</div>
              <div className="mt-1"><span className="text-gray-500">현재 역할:</span> <span className="font-medium text-gray-900">{ROLE_LABELS[roleTarget.role] || roleTarget.role}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">변경할 역할</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={actionLoading}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white"
              >
                {CHANGEABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            {['org_admin', 'teacher'].includes(selectedRole) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">소속 기관 <span className="text-red-500">*</span></label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  disabled={actionLoading}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white"
                >
                  <option value="">기관을 선택하세요</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedRole === 'student' && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                학생 전환은 학번/학급/학년 정보가 필요하여 학생 관리 메뉴에서 별도 생성해야 합니다.
              </div>
            )}

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
              역할 변경 시 기존 기관·이용권 등 관련 데이터는 즉시 삭제되지 않습니다.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRoleTarget(null)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmRoleChange}
                disabled={actionLoading || selectedRole === 'student'}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#6B4EFE] hover:bg-[#5839F6] rounded-xl disabled:opacity-50"
              >
                {actionLoading ? '처리 중...' : '역할 변경'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 상태 변경 모달 */}
      <ConfirmModal
        open={!!statusTarget}
        title={statusTarget?.newStatus === 'suspended' ? '회원 이용 정지' : '회원 활성화'}
        description={
          statusTarget?.newStatus === 'suspended'
            ? `${statusTarget?.member.name || statusTarget?.member.email || '해당 회원'}을 이용 정지합니다. 정지된 계정은 로그인할 수 없습니다.`
            : `${statusTarget?.member.name || statusTarget?.member.email || '해당 회원'}을 활성화합니다.`
        }
        confirmText={statusTarget?.newStatus === 'suspended' ? '이용 정지' : '활성화'}
        variant={statusTarget?.newStatus === 'suspended' ? 'danger' : 'default'}
        loading={actionLoading}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => !actionLoading && setStatusTarget(null)}
      />

      {/* 삭제 모달 */}
      {deleteTarget && (
        <Modal onClose={() => !actionLoading && (setDeleteTarget(null), setDeleteEmailInput(''))} title="회원 삭제">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <div className="font-medium">{deleteTarget.name || '-'} ({deleteTarget.email})</div>
              <div className="mt-1">삭제하면 로그인 계정과 회원 정보가 함께 삭제되며 <strong>복구할 수 없습니다.</strong></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                확인을 위해 대상 이메일을 정확히 입력하세요
              </label>
              <input
                type="text"
                value={deleteEmailInput}
                onChange={(e) => setDeleteEmailInput(e.target.value)}
                placeholder={deleteTarget.email || ''}
                disabled={actionLoading}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteEmailInput('') }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading || deleteEmailInput.trim().toLowerCase() !== (deleteTarget.email || '').toLowerCase()}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50"
              >
                {actionLoading ? '처리 중...' : '영구 삭제'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-[#6B4EFE]' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// ---- 보조 컴포넌트 ----
function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function DetailGrid({ member }: { member: MemberRow }) {
  const rows = useMemo(() => [
    ['이름', member.name],
    ['이메일', member.email],
    ['UID', member.id],
    ['역할', ROLE_LABELS[member.role] || member.role],
    ['상태', STATUS_LABELS[member.status] || member.status],
    ['요금제', member.plan_type || '-'],
    ['월간 생성 한도', `${member.monthly_used ?? 0} / ${member.monthly_quota ?? 0}`],
    ['소속 기관', member.organization_name || '-'],
    ['가입일', formatDate(member.created_at)],
    ['최근 로그인', formatDate(member.last_sign_in_at)],
    ['이메일 확인 일시', formatDate(member.email_confirmed_at)],
  ], [member])

  return (
    <div className="divide-y divide-gray-100">
      {rows.map(([label, value]) => (
        <div key={label} className="flex py-2.5 gap-4 text-sm">
          <div className="w-32 shrink-0 text-gray-500">{label}</div>
          <div className="flex-1 text-gray-900 font-medium break-all">{value || '없음'}</div>
        </div>
      ))}
    </div>
  )
}
