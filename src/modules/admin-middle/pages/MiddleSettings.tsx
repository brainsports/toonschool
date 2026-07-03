import { useState, useEffect } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { supabase } from '../../../shared/lib/supabase'

export default function MiddleSettings() {
  const { user, profile } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (profile) {
      setName(profile.name || (profile as any).full_name || '')
      setEmail(user?.email || '')
      setPhone((profile as any).phone || '')
      setMemo((profile as any).memo || '')
    }
  }, [profile, user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    
    if (password && password !== passwordConfirm) {
      setMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // 1. 프로필 정보 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          full_name: name, // Ensure both are updated if they exist
          phone,
          memo
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      // 2. 비밀번호 업데이트 (입력한 경우만)
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({
          password: password
        })
        if (authError) throw authError
      }

      setMessage({ type: 'success', text: '설정이 성공적으로 저장되었습니다.' })
      setPassword('')
      setPasswordConfirm('')
    } catch (error: any) {
      console.error('Error updating settings:', error)
      setMessage({ type: 'error', text: error.message || '설정 저장 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 0' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>관리자 정보 설정</h2>
      
      <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {message.text && (
          <div style={{ 
            padding: 16, 
            marginBottom: 24, 
            borderRadius: 8, 
            background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: message.type === 'error' ? '#dc2626' : '#166534',
            fontWeight: 600,
            fontSize: 14
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>이메일 (로그인 ID)</label>
            <input 
              type="email" 
              value={email} 
              disabled 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 15 }} 
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>이메일은 변경할 수 없습니다.</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>이름</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="관리자 이름을 입력하세요"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} 
              required
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginTop: 4 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>새 비밀번호 (변경시에만 입력)</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>새 비밀번호 확인</label>
            <input 
              type="password" 
              value={passwordConfirm} 
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} 
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginTop: 4 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>연락처</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="연락처를 입력하세요 (예: 010-1234-5678)"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' }}>메모</label>
            <textarea 
              value={memo} 
              onChange={e => setMemo(e.target.value)}
              placeholder="기타 참고 사항을 입력하세요"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, height: 100, resize: 'vertical' }} 
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: '#7c3aed', 
                color: 'white', 
                border: 'none', 
                borderRadius: 8, 
                fontSize: 16, 
                fontWeight: 700, 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
