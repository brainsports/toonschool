import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2 } from 'lucide-react';

export interface MyWork {
  id: string;
  subject: string;
  title: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'shared';
  thumbnailUrl: string;
  editorPath: string;
  previewPath: string;
  shareUrl: string;
}

const getSubjectDefaultThumbnail = (subject: string) => {
  switch (subject) {
    case '국어': return '/images/toonschool/thumbnails/subjects/korean-default.png';
    case '수학': return '/images/toonschool/thumbnails/subjects/math-default.png';
    case '과학': return '/images/toonschool/thumbnails/subjects/science-default.png';
    case '사회': return '/images/toonschool/thumbnails/subjects/social-default.png';
    case '영어': return '/images/toonschool/thumbnails/subjects/english-default.png';
    case '미술': return '/images/toonschool/thumbnails/subjects/art-default.png';
    default: return '/images/toonschool/thumbnails/subjects/korean-default.png';
  }
};

const getSubjectColorClasses = (subject: string) => {
  switch (subject) {
    case '국어': return { bg: 'bg-pink-500', fallback: 'bg-pink-400', border: 'hover:border-pink-300' };
    case '과학': return { bg: 'bg-sky-500', fallback: 'bg-sky-400', border: 'hover:border-sky-300' };
    case '사회': return { bg: 'bg-amber-500', fallback: 'bg-amber-400', border: 'hover:border-amber-300' };
    case '영어': return { bg: 'bg-emerald-500', fallback: 'bg-emerald-400', border: 'hover:border-emerald-300' };
    case '수학': return { bg: 'bg-indigo-500', fallback: 'bg-indigo-400', border: 'hover:border-indigo-300' };
    default: return { bg: 'bg-slate-500', fallback: 'bg-slate-400', border: 'hover:border-slate-300' };
  }
}

export default function WorkCard({ work }: { work: MyWork }) {
  const navigate = useNavigate();

  const defaultThumbnail = getSubjectDefaultThumbnail(work.subject);
  const [imgSrc, setImgSrc] = useState(work.thumbnailUrl?.trim() ? work.thumbnailUrl : defaultThumbnail);
  const colors = getSubjectColorClasses(work.subject);

  const handleClick = () => {
    if (work.status === 'shared') {
      navigate(work.previewPath);
    } else {
      navigate(work.editorPath || '/student/select-unit');
    }
  };

  const handleShare = () => {
    const url = work.shareUrl || `${window.location.origin}/book/${work.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("공유링크를 복사했어요.");
    }).catch(() => {
      alert("공유링크 복사에 실패했어요. 다시 시도해 주세요.");
    });
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <div
        className={`aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer ${colors.border} transition-colors relative group`}
        onClick={handleClick}
      >
        <img
          src={imgSrc}
          alt={work.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onError={() => { if (imgSrc !== defaultThumbnail) setImgSrc(defaultThumbnail); }}
        />
        
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
          <button
             onClick={(e) => {
               e.stopPropagation();
               handleShare();
             }}
             className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm backdrop-blur-sm transition-colors group/share"
             title="공유링크 복사"
          >
            <Share2 className="w-4 h-4 text-slate-700 group-hover/share:text-indigo-600" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold text-white ${colors.bg} px-1.5 py-0.5 rounded`}>{work.subject}</span>
        <span className="text-xs font-bold text-slate-700 truncate">{work.title}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${colors.bg} rounded-full`} style={{ width: `${work.progress}%` }}></div>
        </div>
        <span className="text-[10px] font-bold text-slate-400">{work.progress}%</span>
      </div>
    </div>
  );
}
