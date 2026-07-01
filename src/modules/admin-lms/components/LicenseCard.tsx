// ──────────────────────────────────────────────
// 이용권 요약 카드 컴포넌트
// ──────────────────────────────────────────────
import type { LicenseInfo } from '../types'

interface Props {
  license: LicenseInfo
}

export default function LicenseCard({ license }: Props) {
  const available = license.totalSlots - license.usedSlots
  const usedPercent = Math.round((license.usedSlots / license.totalSlots) * 100)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff0f6 0%, #fdf4ff 100%)',
      border: '1.5px solid #ffc6de',
      borderRadius: 16,
      padding: '20px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      flexWrap: 'wrap',
      boxShadow: '0 2px 12px rgba(255,39,120,0.08)',
    }}>
      {/* 배지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          background: '#ff2778', color: 'white', borderRadius: 10,
          padding: '6px 14px', fontSize: 13, fontWeight: 700,
        }}>이용권 정보</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#d63384' }}>{license.plan}</span>
      </div>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* 이용기간 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 500, marginBottom: 2 }}>이용기간</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>
            {license.startDate} ~ {license.endDate}
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: '#ffc6de' }} />

        {/* 이용 현황 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 500, marginBottom: 2 }}>이용 현황</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>
            <span style={{ color: '#ff2778', fontSize: 18 }}>{license.usedSlots}</span>
            <span style={{ color: '#bbb', margin: '0 4px' }}>/</span>
            {license.totalSlots}개
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: '#ffc6de' }} />

        {/* 사용가능 개수 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 500, marginBottom: 2 }}>사용가능 개수</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>
            {available}개
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div style={{ minWidth: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: '#999' }}>
            <span>사용률</span>
            <span style={{ fontWeight: 700, color: '#ff2778' }}>{usedPercent}%</span>
          </div>
          <div style={{ height: 8, background: '#ffe0ef', borderRadius: 99 }}>
            <div style={{
              height: '100%', width: `${usedPercent}%`,
              background: 'linear-gradient(90deg, #ff2778, #ff6baf)',
              borderRadius: 99, transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
