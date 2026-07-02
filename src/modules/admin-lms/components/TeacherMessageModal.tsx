import { useState } from 'react';
import type { ClassRoom } from '../types';
import { createTeacherMessage } from '../../student/services/teacherMessageService';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Props {
  classRoom: ClassRoom;
  onClose: () => void;
  onSaved: () => void;
}

export default function TeacherMessageModal({ classRoom, onClose, onSaved }: Props) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [messageDate, setMessageDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createTeacherMessage({
        class_key: classRoom.id, // e.g. cls-1
        content: content.trim(),
        message_date: messageDate,
        is_published: isPublished,
        teacher_id: user?.id,
        center_id: profile?.center_id,
        title: '선생님 말씀'
      });
      onSaved();
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
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
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>선생님 말씀 작성</h3>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#666' }}>{classRoom.grade}학년 {classRoom.name}</p>
        </div>
        
        <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && <div style={{ color: '#ef4444', fontSize: 13, background: '#fee2e2', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>날짜</label>
            <input 
              type="date" 
              value={messageDate} 
              onChange={e => setMessageDate(e.target.value)}
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
              placeholder="학생들에게 전할 말씀을 입력하세요."
              rows={5}
              style={{
                padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, fontFamily: 'inherit', resize: 'vertical', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              id="publish-toggle"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="publish-toggle" style={{ fontSize: 14, fontWeight: 600, color: '#333', cursor: 'pointer' }}>
              공개 (체크 시 학생들에게 노출됩니다)
            </label>
          </div>
        </div>

        <div style={{
          padding: '20px 30px', background: '#fafafa', borderTop: '1px solid #f0f0f0',
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
          display: 'flex', justifyContent: 'flex-end', gap: 10
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
              background: '#ff2778', color: 'white', border: 'none', cursor: isSaving ? 'wait' : 'pointer'
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
