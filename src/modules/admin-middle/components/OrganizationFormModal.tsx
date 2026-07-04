import { useState, useEffect } from 'react'
import { middleAdminService } from '../services/middleAdminService'
import type { MiddleOrganization } from '../types/middleAdmin'

interface OrganizationFormModalProps {
  middleAdminId: string
  existingOrg?: MiddleOrganization
  onClose: () => void
  onSuccess: () => void
}

export default function OrganizationFormModal({ middleAdminId, existingOrg, onClose, onSuccess }: OrganizationFormModalProps) {
  const [name, setName] = useState('')
  const [totalLicenses, setTotalLicenses] = useState(0)
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (existingOrg) {
      setName(existingOrg.name)
      setTotalLicenses(existingOrg.total_licenses || 0)
      setStatus(existingOrg.status || 'active')
    }
  }, [existingOrg])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('기관명을 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      if (existingOrg) {
        await middleAdminService.updateOrganization(existingOrg.id, {
          name,
          total_licenses: totalLicenses,
          status,
        })
        alert('소속기관이 수정되었습니다.')
      } else {
        await middleAdminService.createOrganization(middleAdminId, {
          name,
          total_licenses: totalLicenses,
          status,
        })
        alert('소속기관이 추가되었습니다.')
      }
      onSuccess()
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>
          {existingOrg ? '소속기관 수정' : '소속기관 추가'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              기관명
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 서울한빛초등학교"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              전체 이용권 수
            </label>
            <input
              type="number"
              min={existingOrg ? existingOrg.used_licenses : 0}
              value={totalLicenses}
              onChange={(e) => setTotalLicenses(Number(e.target.value))}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}
            />
            {existingOrg && (
              <p style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>
                * 이미 사용한 이용권({existingOrg.used_licenses}개)보다 적게 설정할 수 없습니다.
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              상태
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}
            >
              <option value="active">사용중</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ flex: 1, padding: 14, background: '#f1f5f9', color: '#475569', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ flex: 1, padding: 14, background: '#7c3aed', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
