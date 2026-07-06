import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'

interface MiddleAdminCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function MiddleAdminCreateModal({ isOpen, onClose, onSuccess }: MiddleAdminCreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'active'
  })
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [allOrgs, setAllOrgs] = useState<any[]>([])
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadOrgs()
    } else {
      setFormData({ name: '', email: '', password: '', phone: '', status: 'active' })
      setSelectedOrgs([])
    }
  }, [isOpen])

  const loadOrgs = async () => {
    try {
      const orgs = await superAdminService.getAllOrganizations()
      setAllOrgs(orgs || [])
    } catch (err: any) {
      console.error(err)
    }
  }

  if (!isOpen) return null

  const handleOrgToggle = (orgId: string) => {
    if (selectedOrgs.includes(orgId)) {
      setSelectedOrgs(p => p.filter(id => id !== orgId))
    } else {
      setSelectedOrgs(p => [...p, orgId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      alert('이름, 이메일, 비밀번호를 모두 입력해 주세요.')
      return
    }

    // 이미 다른 중간관리자에게 배정된 기관인지 확인
    const assignedToOthers = selectedOrgs.filter(orgId => {
      const org = allOrgs.find(o => o.id === orgId)
      return org && org.middle_admin_id !== null
    })

    if (assignedToOthers.length > 0) {
      const orgNames = assignedToOthers.map(id => allOrgs.find(o => o.id === id)?.name).join(', ')
      if (!window.confirm(`선택한 기관 중 일부(${orgNames})는 이미 다른 관리자에게 배정되어 있습니다. 배정을 변경하시겠습니까?`)) {
        return
      }
    }

    try {
      setLoading(true)
      await superAdminService.createMiddleAdmin(formData, selectedOrgs)
      alert('신규 중간관리자가 성공적으로 추가되었습니다.')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    marginBottom: 16,
    fontSize: 14
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>중간관리자 계정 추가</h2>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>이름 *</label>
          <input 
            style={inputStyle}
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="홍길동"
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>이메일(아이디) *</label>
          <input 
            style={inputStyle}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
            placeholder="manager@example.com"
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>초기 비밀번호 *</label>
          <input 
            style={inputStyle}
            type="text"
            value={formData.password}
            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
            placeholder="비밀번호 입력 (최소 6자)"
            minLength={6}
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>연락처</label>
          <input 
            style={inputStyle}
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
            placeholder="010-0000-0000"
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>상태</label>
          <select 
            style={inputStyle}
            value={formData.status}
            onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
          >
            <option value="active">정상 (활성)</option>
            <option value="suspended">사용정지</option>
          </select>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>테스트기관 배정</label>
          <div style={{ 
            border: '1px solid #ddd', borderRadius: 8, padding: 12, maxHeight: 150, overflowY: 'auto', marginBottom: 24, fontSize: 14 
          }}>
            {allOrgs.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: '10px 0' }}>기관 목록이 없습니다.</div>
            ) : (
              allOrgs.map(org => (
                <label key={org.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedOrgs.includes(org.id)}
                    onChange={() => handleOrgToggle(org.id)}
                    style={{ marginRight: 8 }}
                  />
                  <span>
                    {org.name} 
                    {org.middle_admin_id ? <span style={{ color: '#ff2778', fontSize: 12, marginLeft: 4 }}>(배정됨)</span> : ''}
                  </span>
                </label>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 8, background: '#eee', color: '#555', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: 8, background: loading ? '#ccc' : '#0056b3', color: 'white', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '생성 중...' : '계정 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
