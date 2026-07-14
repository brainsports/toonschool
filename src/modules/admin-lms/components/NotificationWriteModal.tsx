import { useState, useEffect } from 'react';
import { createNotification, getSentNotifications, deleteNotification, type StudentNotification } from '../../student/services/notificationService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import type { Recipient } from './TeacherRecipientSelector';

interface Props {
  recipient: Recipient;
  onClose: () => void;
  onSaved: () => void;
}

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NotificationWriteModal({ recipient, onClose, onSaved }: Props) {
  const { user } = useAuth();

  const [category, setCategory] = useState('notice');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeDate, setNoticeDate] = useState(getLocalDateString());
  const [isPublished, setIsPublished] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    // 선택한 발송 범위(targetKey)와 정확히 일치하는 본인 발송분만 조회.
    const notis = await getSentNotifications(recipient.targetKey, user?.id);
    setNotifications(notis);
    setIsLoadingNotifications(false);
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient.targetKey]);

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const success = await deleteNotification(pendingDeleteId);
    setPendingDeleteId(null);
    if (success) {
      await loadNotifications();
    } else {
      setError('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createNotification({
        // 선택한 발송 범위 키: 'all-grades' | 'grade-N' | class_id
        target_key: recipient.targetKey,
        category,
        title: title.trim(),
        content: content.trim(),
        notice_date: noticeDate,
        is_published: isPublished,
        sender_id: user?.id, // 본인 이름으로 저장 -> 학생 읽기에서 sender_id 로 격리
        sender_role: 'teacher',
      });
      onSaved();
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'notice': return '공지';
      case 'learning': return '학습 안내';
      case 'event': return '행사 안내';
      case 'mission': return '미션';
      default: return '기타';
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 20, width: 500, maxWidth: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>알림함 쓰기</h3>
          {/* 발송 대상 (읽기 전용) — 본문에서 선택한 결과를 그대로 표시 */}
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#666' }}>
            발송 대상: <span style={{ fontWeight: 700, color: '#8b5cf6' }}>{recipient.label}</span> · {recipient.count}명
          </p>
        </div>

        <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {error && <div style={{ color: '#ef4444', fontSize: 13, background: '#fee2e2', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>알림 종류</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, fontFamily: 'inherit', outline: 'none', background: 'white'
              }}
            >
              <option value="notice">공지</option>
              <option value="learning">학습 안내</option>
              <option value="event">행사 안내</option>
              <option value="mission">미션</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, fontFamily: 'inherit', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요."
              rows={4}
              style={{
                padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, fontFamily: 'inherit', resize: 'vertical', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>날짜</label>
            <input
              type="date"
              value={noticeDate}
              onChange={e => setNoticeDate(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, fontFamily: 'inherit', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="publish-toggle-noti"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="publish-toggle-noti" style={{ fontSize: 14, fontWeight: 600, color: '#333', cursor: 'pointer' }}>
              공개 (체크 시 학생들에게 노출됩니다)
            </label>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid #f0f0f0', margin: '10px 0' }} />

          {/* 기존 알림 목록 (선택한 발송 범위의 본인 발송분) */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 12 }}>최근 보낸 알림</h4>
            {isLoadingNotifications ? (
              <p style={{ fontSize: 14, color: '#999' }}>불러오는 중...</p>
            ) : notifications.length === 0 ? (
              <p style={{ fontSize: 14, color: '#999' }}>아직 보낸 알림이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.slice(0, 5).map(noti => (
                  <div key={noti.id} style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{noti.notice_date}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', background: '#f5f3ff', padding: '2px 6px', borderRadius: 4 }}>
                          {recipient.label}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: 4 }}>
                          {getCategoryLabel(noti.category)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: noti.is_published ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {noti.is_published ? '공개' : '비공개'}
                        </span>
                        <button
                          onClick={() => setPendingDeleteId(noti.id)}
                          style={{
                            background: 'none', border: '1px solid #ffccd5', color: '#ef4444',
                            borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                      {noti.title}
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {noti.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '20px 30px', background: '#fafafa', borderTop: '1px solid #f0f0f0',
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0
        }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'white', color: '#666', border: '1px solid #ddd', cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: '#8b5cf6', color: 'white', border: 'none', cursor: isSaving ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={!!pendingDeleteId}
        title="알림 삭제"
        description="이 알림을 삭제할까요? 삭제한 알림은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
