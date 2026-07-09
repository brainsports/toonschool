import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { TeacherMessage } from '../../services/teacherMessageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  messages: TeacherMessage[];
}

export default function TeacherMessageModal({ isOpen, onClose, messages }: Props) {
  const [visibleMessages, setVisibleMessages] = useState<TeacherMessage[]>(messages);

  useEffect(() => {
    setVisibleMessages(messages);
  }, [messages]);

  if (!isOpen) return null;

  const handleHideMessage = (messageId: string) => {
    if (!window.confirm('이 말씀을 내 화면에서 삭제할까요?')) return;

    // TODO: 학생별 선생님 말씀 숨김 테이블이 준비되면 DB 숨김 처리로 교체합니다.
    setVisibleMessages((current) => current.filter((message) => message.id !== messageId));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800">선생님 말씀 모아보기</h2>
            <span className="text-2xl">💌</span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-4">💬</span>
              <p className="text-slate-500 font-medium text-sm">아직 선생님 말씀이 없어요.</p>
            </div>
          ) : (
            visibleMessages.map((msg) => (
              <div key={msg.id} className="flex gap-4 group relative">
                <div className="w-12 h-12 bg-pink-50 rounded-full overflow-hidden shrink-0">
                  <img src="/images/toonschool/characters/v2/hana-master/hana-v2-front.png" alt="Teacher" className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex flex-col gap-1.5 pt-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {msg.title || '선생님 말씀'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        msg.class_key === 'all-grades' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-sky-100 text-sky-600'
                      }`}>
                        {msg.class_key === 'all-grades' ? '전체 학년' : '5학년 전체'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(msg.message_date).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleHideMessage(msg.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                        aria-label="선생님 말씀 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
