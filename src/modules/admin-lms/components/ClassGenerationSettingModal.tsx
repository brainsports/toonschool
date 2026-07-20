import { useEffect, useMemo, useState } from 'react';
import {
  COMIC_QUOTA_ENABLED,
  getClassQuotaSummary,
  saveClassGenerationSetting,
  isQuotaError,
  type ClassQuotaSummary,
  type ExtraDuration,
} from '../../../shared/lib/comicQuota';

interface Props {
  open: boolean;
  classId: string;
  className: string;
  grade: number;
  onClose: () => void;
  onSaved?: () => void;
}

const BASE_PRESETS = [
  { key: 'weekly1', label: '주 1회 수업', base: 4 },
  { key: 'weekly2', label: '주 2회 수업', base: 8 },
];

const EXTRA_PRESETS = [0, 1, 2, 3, 5];

export default function ClassGenerationSettingModal({ open, classId, className, grade, onClose, onSaved }: Props) {
  const [baseQuota, setBaseQuota] = useState<number>(4);
  const [extraQuota, setExtraQuota] = useState<number>(0);
  const [extraDuration, setExtraDuration] = useState<ExtraDuration>('this_month');
  const [customExtra, setCustomExtra] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [summary, setSummary] = useState<ClassQuotaSummary | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    if (!open || !COMIC_QUOTA_ENABLED) return;
    setErr('');
    setSaving(false);
    getClassQuotaSummary(classId).then((s) => {
      if (s) {
        setSummary(s);
        setBaseQuota(s.has_setting ? s.base_quota : 4);
        setExtraQuota(s.has_setting ? s.extra_quota : 0);
        setExtraDuration(s.extra_duration);
        if (![0, 1, 2, 3, 5].includes(s.extra_quota) && s.extra_quota > 0) {
          setIsCustom(true);
          setCustomExtra(String(s.extra_quota));
        }
      }
    });
  }, [open, classId]);

  const effectiveExtra = isCustom ? Math.max(0, parseInt(customExtra || '0', 10) || 0) : extraQuota;

  const decExtra = () => {
    const cur = parseInt(customExtra || '0', 10) || 0;
    setCustomExtra(String(Math.max(0, cur - 1)));
  };
  const incExtra = () => {
    const cur = parseInt(customExtra || '0', 10) || 0;
    setCustomExtra(String(cur + 1));
  };
  const perStudentTotal = baseQuota + effectiveExtra;
  const studentCount = summary?.student_count ?? 0;
  const classTotalExtra = effectiveExtra * studentCount;
  const classGrandTotal = baseQuota * studentCount + classTotalExtra;

  const saveBtnText = useMemo(() => `학생 1명당 월 ${perStudentTotal}회로 설정하기`, [perStudentTotal]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    const res = await saveClassGenerationSetting({
      classId,
      baseQuota,
      extraQuota: effectiveExtra,
      extraDuration,
    });
    setSaving(false);
    if (isQuotaError(res)) {
      setErr(res.message);
      return;
    }
    onSaved?.();
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #ffc6de', fontSize: 14, outline: 'none',
  };
  const cardStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
    border: active ? '2px solid #ff2778' : '1px solid #e5e7eb',
    background: active ? '#fff0f6' : '#fff', fontSize: 13, fontWeight: active ? 700 : 500,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: 460, maxWidth: '92vw', maxHeight: '90vh',
          overflow: 'auto', padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>만화 생성 설정</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          {grade}학년 · {className}
        </div>

        {!COMIC_QUOTA_ENABLED && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 12, color: '#9a3412' }}>
            이 기능은 현재 비활성화되어 있어요. 운영 DB 마이그레이션과 환경변수(VITE_COMIC_QUOTA_ENABLED=true) 적용 후 사용할 수 있어요.
          </div>
        )}

        {/* 기본 횟수 */}
        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, color: '#374151' }}>기본 횟수</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {BASE_PRESETS.map((p) => (
            <div key={p.key} style={cardStyle(baseQuota === p.base)} onClick={() => setBaseQuota(p.base)}>
              <div>{p.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>월 {p.base}회</div>
            </div>
          ))}
        </div>

        {/* 추가 횟수 */}
        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, color: '#374151' }}>
          추가 횟수 <span style={{ color: '#ff2778', fontSize: 12 }}>· 학생 1명당</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {EXTRA_PRESETS.map((n) => (
            <div
              key={n}
              style={cardStyle(!isCustom && extraQuota === n)}
              onClick={() => { setIsCustom(false); setExtraQuota(n); }}
            >
              {n === 0 ? '추가 없음' : `+${n}회`}
            </div>
          ))}
          <div
            style={cardStyle(isCustom)}
            onClick={() => setIsCustom(true)}
          >
            직접 입력
          </div>
        </div>
        {isCustom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #ffc6de', background: '#fff', fontSize: 16, cursor: 'pointer' }}
              onClick={decExtra}
            >−</button>
            <input
              style={inputStyle}
              type="number"
              min={0}
              value={customExtra}
              onChange={(e) => setCustomExtra(e.target.value)}
              placeholder="추가 횟수"
            />
            <button
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #ffc6de', background: '#fff', fontSize: 16, cursor: 'pointer' }}
              onClick={incExtra}
            >+</button>
          </div>
        )}

        {/* 적용 기간 */}
        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, color: '#374151' }}>추가 횟수 적용 기간</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div style={cardStyle(extraDuration === 'this_month')} onClick={() => setExtraDuration('this_month')}>
            이번 달만 적용
          </div>
          <div style={cardStyle(extraDuration === 'every_month')} onClick={() => setExtraDuration('every_month')}>
            매월 계속 적용
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
          기본 횟수는 매월 유지돼요. 추가 횟수는 선택한 기간에만 적용돼요.
        </div>

        {/* 결과 요약 */}
        <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: '#fff0f6', border: '1px solid #ffc6de' }}>
          <Row label="기본 횟수" value={`월 ${baseQuota}회`} />
          <Row label="학생 1명당 추가" value={`+${effectiveExtra}회`} />
          <Row label="학생 1명당 총 횟수" value={`월 ${perStudentTotal}회`} bold />
          <Row label="현재 학생 수" value={`${studentCount}명`} />
          <Row label="학급 전체 추가 생성량" value={`+${classTotalExtra}회`} />
          <div style={{ borderTop: '1px dashed #ffc6de', margin: '8px 0' }} />
          <Row label="학급 전체 총 생성량" value={`월 ${classGrandTotal}회`} bold />
        </div>

        {err && <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444' }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >취소</button>
          <button
            onClick={handleSave}
            disabled={saving || !COMIC_QUOTA_ENABLED}
            style={{
              flex: 1.6, padding: '12px 0', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, color: '#fff',
              background: 'linear-gradient(90deg, #ff2778, #ff6baf)',
              boxShadow: '0 4px 12px rgba(255,39,120,0.3)', cursor: 'pointer',
              opacity: saving || !COMIC_QUOTA_ENABLED ? 0.6 : 1,
            }}
          >{saving ? '저장 중...' : saveBtnText}</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13, color: '#374151' }}>
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: bold ? '#ff2778' : '#1f2937' }}>{value}</span>
    </div>
  );
}
