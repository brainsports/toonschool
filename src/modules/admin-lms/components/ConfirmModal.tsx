// ──────────────────────────────────────────────
// 확인 모달 (삭제 등 위험 작업 전 확인)
// ──────────────────────────────────────────────

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}

export default function ConfirmModal({
  title, message, confirmLabel = '확인', cancelLabel = '취소',
  onConfirm, onClose, danger = false,
}: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>
          {danger ? '⚠️' : '❓'}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', margin: '0 0 10px', textAlign: 'center' }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb',
            background: 'white', color: '#555', fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}>{cancelLabel}</button>
          <button onClick={() => { onConfirm(); onClose() }} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
            background: danger ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #ff2778, #ff6baf)',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: danger ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(255,39,120,0.3)',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
