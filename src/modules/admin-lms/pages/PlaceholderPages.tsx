

export function MiddleAdminDashboard() {
  return (
    <div style={{ padding: 40, background: 'white', borderRadius: 16, border: '1px solid #eee' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: '#1a1a2e' }}>중간관리자 대시보드</h1>
      <p style={{ color: '#666' }}>담당 기관들의 이용 현황과 기관별 관리를 위한 화면입니다. (개발 예정)</p>
    </div>
  );
}

export function SuperAdminDashboardPlaceholder() {
  return (
    <div style={{ padding: 40, background: 'white', borderRadius: 16, border: '1px solid #eee' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: '#1a1a2e' }}>슈퍼관리자 대시보드</h1>
      <p style={{ color: '#666' }}>전체 기관 및 사용량 관리를 위한 화면입니다. 기존 /super-admin 과 연동할 예정입니다.</p>
    </div>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 40, background: 'white', borderRadius: 16, border: '1px solid #eee' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: '#1a1a2e' }}>{title}</h1>
      <p style={{ color: '#666' }}>이 화면은 현재 개발 예정입니다.</p>
    </div>
  );
}
