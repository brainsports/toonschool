import React, { useState } from 'react'
import type { OrgTeacher } from '../types/orgAdmin'

interface Props {
  isOpen: boolean
  onClose: () => void
  teacher: OrgTeacher | null
  onSubmit: (title: string, content: string) => Promise<void>
}

export default function TeacherNotificationModal({ isOpen, onClose, teacher, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !teacher) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }
    
    setLoading(true)
    try {
      await onSubmit(title, content)
      alert('알림을 보냈습니다.')
      setTitle('')
      setContent('')
      onClose()
    } catch (err: any) {
      alert('오류가 발생했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500, maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' }}>선생님에게 알림 보내기</h2>
        
        <div style={{ marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
          <span style={{ fontWeight: 600, color: '#333' }}>수신자: </span>
          <span style={{ color: '#555' }}>{teacher.name || '이름 없음'} {teacher.email ? `(${teacher.email})` : ''}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#333' }}>알림 제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box', fontSize: 15 }}
              maxLength={100}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14, color: '#333' }}>알림 내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={5}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', resize: 'none', boxSizing: 'border-box', fontSize: 15 }}
              maxLength={1000}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer' }}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#ff2778', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              disabled={loading}
            >
              {loading ? '보내는 중...' : '보내기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
