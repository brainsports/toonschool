import { useState, useEffect } from 'react'
import type { MiddleOrganization } from '../types/middleAdmin'

interface OrgLicenseManageModalProps {
  org: MiddleOrganization | null
  isOpen: boolean
  onClose: () => void
  onSave: (orgId: string, data: { total_licenses: number, start_date: string, end_date: string, memo: string }) => Promise<void>
}

export default function OrgLicenseManageModal({ org, isOpen, onClose, onSave }: OrgLicenseManageModalProps) {
  const [totalLicenses, setTotalLicenses] = useState<number>(0)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (org && isOpen) {
      setTotalLicenses(org.total_licenses || 0)
      setStartDate(org.license_start_date || '')
      setEndDate(org.license_end_date || '')
      setMemo(org.license_memo || '')
      setErrorMsg('')
    }
  }, [org, isOpen])

  if (!isOpen || !org) return null

  const handleSave = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      
      if (!startDate) {
        setErrorMsg('이용 시작일을 선택해주세요.')
        setLoading(false)
        return
      }
      
      if (!endDate) {
        setErrorMsg('이용 종료일을 선택해주세요.')
        setLoading(false)
        return
      }

      if (new Date(startDate) > new Date(endDate)) {
        setErrorMsg('종료일이 시작일보다 빠를 수 없습니다.')
        setLoading(false)
        return
      }

      await onSave(org.id, {
        total_licenses: totalLicenses,
        start_date: startDate,
        end_date: endDate,
        memo
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 480,
        overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
            소속기관 이용권 관리
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#64748b' }}>
            {org.name}
          </p>
        </div>

        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {errorMsg && (
            <div style={{ padding: 12, backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 14 }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              배정 이용권 수
            </label>
            <input
              type="number"
              value={totalLicenses}
              onChange={e => setTotalLicenses(parseInt(e.target.value) || 0)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 15,
                outline: 'none', transition: 'all 0.2s'
              }}
              min={org.used_licenses}
            />
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
              현재 사용 중: {org.used_licenses}개 (사용한 수량 미만으로 회수 불가)
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                이용 시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: 15,
                  outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                이용 종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8,
                  border: '1px solid #e2e8f0', fontSize: 15,
                  outline: 'none', transition: 'all 0.2s'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              메모
            </label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 15, resize: 'none',
                outline: 'none', transition: 'all 0.2s'
              }}
              placeholder="메모를 입력하세요"
            />
          </div>
        </div>

        <div style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              color: '#64748b', background: 'white', border: '1px solid #e2e8f0',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '12px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              color: 'white', background: '#7c3aed', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
