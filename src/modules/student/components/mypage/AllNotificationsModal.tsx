import { Bell, Trophy, MessageSquare, Star, Info, X } from 'lucide-react';
import type { StudentNotification } from '../../services/notificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: StudentNotification[];
}

export default function AllNotificationsModal({ isOpen, onClose, notifications }: Props) {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'notice':
        return <Info className="w-4 h-4 text-sky-500" />;
      case 'learning':
        return <Star className="w-4 h-4 text-emerald-500" />;
      case 'event':
        return <Bell className="w-4 h-4 text-purple-500" />;
      case 'mission':
        return <Trophy className="w-4 h-4 text-pink-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'notice': return 'bg-sky-50';
      case 'learning': return 'bg-emerald-50';
      case 'event': return 'bg-purple-50';
      case 'mission': return 'bg-pink-50';
      default: return 'bg-slate-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">알림함</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">최근 도착한 모든 알림이에요.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {notifications.length > 0 ? (
            <div className="flex flex-col gap-4">
              {notifications.map((noti) => (
                <div key={noti.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getCategoryBg(noti.category)}`}>
                    {getCategoryIcon(noti.category)}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800 leading-tight">
                        {noti.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {formatDate(noti.notice_date)}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {noti.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-slate-500 font-bold">아직 도착한 알림이 없어요.</p>
              <p className="text-slate-400 text-sm mt-1">새로운 소식이 생기면 이곳에 알려드릴게요!</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
