import React from 'react'
import { ImageIcon, X } from 'lucide-react'
import type { CoverState } from '../../types/cover'

interface CoverStylePanelProps {
  cover: CoverState
  onChangeCover: (field: keyof CoverState, value: any) => void
  fileRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function CoverStylePanel({
  cover,
  onChangeCover,
  fileRef,
  onFileChange
}: CoverStylePanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
      <details className="group" open>
        <summary className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between cursor-pointer list-none focus:outline-none">
          <span className="text-[11.5px] font-extrabold text-[#475569] uppercase">🎨 표지 스타일</span>
          <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={() => onChangeCover('bgType', 'gradient')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-colors ${cover.bgType === 'gradient' ? 'bg-[#EEF2FF] border-[#4F6AF0] text-[#4F6AF0]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              그라디언트형
            </button>
            <button 
              onClick={() => onChangeCover('bgType', 'image')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-colors ${cover.bgType === 'image' ? 'bg-[#EEF2FF] border-[#4F6AF0] text-[#4F6AF0]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              이미지 삽입형
            </button>
          </div>

          {cover.bgType === 'image' && (
            <div className="space-y-2">
              <input 
                type="file" 
                ref={fileRef} 
                onChange={onFileChange} 
                accept="image/*"
                className="hidden" 
              />
              <button 
                onClick={() => fileRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-[12.5px] font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-4 h-4"/> 표지 이미지 업로드
              </button>
              {cover.bgImageUrl && (
                <div className="relative aspect-[21/15] rounded-xl overflow-hidden border border-slate-200">
                  <img src={cover.bgImageUrl} alt="Cover Preview" className="w-full h-full object-cover"/>
                  <button 
                    onClick={() => onChangeCover('bgImageUrl', null)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5"/>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
