import { X } from 'lucide-react';
import WorkCard from './WorkCard';
import type { MyWork } from './WorkCard';

interface AllWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  works: MyWork[];
}

export default function AllWorksModal({ isOpen, onClose, works }: AllWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:px-8 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-slate-800">내 작품 전체 보기</h2>
            <p className="text-sm font-medium text-slate-500">지금까지 만든 모든 작품을 확인해보세요.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {works.map(work => (
              <WorkCard key={work.id} work={work} />
            ))}
            {works.length === 0 && (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-slate-500">
                <p className="font-bold text-lg">아직 만든 작품이 없어요!</p>
                <p className="text-sm mt-1">오늘의 추천 학습을 통해 첫 작품을 만들어보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
