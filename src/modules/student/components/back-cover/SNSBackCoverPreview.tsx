import { QrCode } from 'lucide-react'

interface SNSBackCoverPreviewProps {
  studentName: string
  gradeClass: string
  email: string
  completionDate: string
  subject: string
  unit: string
  onShareFriend?: () => void
  onShareFamily?: () => void
  onReplay?: () => void
}

export default function SNSBackCoverPreview({
  studentName,
  gradeClass,
  email,
  completionDate,
  subject,
  unit,
  onShareFriend,
  onShareFamily,
  onReplay
}: SNSBackCoverPreviewProps) {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-md bg-white">
      {/* Template Image */}
      <img 
        src="/images/toonschool/back-covers/back-cover-sns-default.webp" 
        alt="Back Cover Template"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
        {/* Dynamic Data Overlay */}
        <div className="absolute inset-0 z-10">
          
          {/* 작품 정보 (Work Info) - Left Bottom */}
          {/* Positioned approximately based on the typical A4 layout for this design. */}
          <div className="absolute left-[11%] bottom-[8.5%] w-[35%] flex flex-col gap-[1.6%] h-[16%] justify-between text-[11px] sm:text-sm md:text-base font-bold text-slate-800">
            {/* The values are aligned to the right or left next to the labels. Assuming labels are on the image, we just overlay values, but since we can't be sure of exact label widths, rendering both or just aligning values from a fixed left offset. Let's render the fields with fixed widths for labels just in case they aren't on the image, but the prompt says "오버레이 대상: 지은이...". We'll include the label but make it invisible if needed, or just render both nicely. If the image has them, we should just position the values. Let's render both to be safe, with transparent background. */}
            <div className="flex items-center"><span className="w-16 sm:w-20 md:w-24 text-slate-800 shrink-0">지은이</span> <span className="truncate">{studentName}</span></div>
            <div className="flex items-center"><span className="w-16 sm:w-20 md:w-24 text-slate-800 shrink-0">학년/반</span> <span className="truncate">{gradeClass}</span></div>
            <div className="flex items-center"><span className="w-16 sm:w-20 md:w-24 text-slate-800 shrink-0">이메일</span> <span className="truncate">{email}</span></div>
            <div className="flex items-center"><span className="w-16 sm:w-20 md:w-24 text-slate-800 shrink-0">발행일</span> <span className="truncate">{completionDate}</span></div>
            <div className="flex items-center"><span className="w-16 sm:w-20 md:w-24 text-slate-800 shrink-0">과목</span> <span className="truncate">{subject}</span></div>
            <div className="flex items-center"><span className="w-16 sm:w-20 md:w-24 text-slate-800 shrink-0">단원</span> <span className="truncate">{unit}</span></div>
          </div>

          {/* QR Code - Right Bottom (Above buttons) */}
          <div className="absolute right-[11%] bottom-[13%] w-[20%] aspect-square bg-white p-1 md:p-2 rounded-lg flex items-center justify-center shadow-sm">
            <QrCode className="w-full h-full text-black" strokeWidth={1.5} />
          </div>

          {/* Share Buttons - Right Bottom */}
          <div className="absolute right-[8%] bottom-[8.5%] w-[42%] flex justify-between gap-1 md:gap-2">
            <button 
              onClick={onShareFriend}
              className="flex-1 bg-[#FFD600] hover:bg-[#FACC15] text-slate-900 font-jua py-1.5 md:py-2 px-1 rounded-md md:rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 text-[9px] sm:text-[11px] md:text-sm text-center leading-tight whitespace-nowrap"
            >
              친구에게<br/>공유하기
            </button>
            <button 
              onClick={onShareFamily}
              className="flex-1 bg-[#4ADE80] hover:bg-[#22C55E] text-slate-900 font-jua py-1.5 md:py-2 px-1 rounded-md md:rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 text-[9px] sm:text-[11px] md:text-sm text-center leading-tight whitespace-nowrap"
            >
              가족에게<br/>보여주기
            </button>
            <button 
              onClick={onReplay}
              className="flex-1 bg-[#60A5FA] hover:bg-[#3B82F6] text-white font-jua py-1.5 md:py-2 px-1 rounded-md md:rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 text-[9px] sm:text-[11px] md:text-sm text-center leading-tight whitespace-nowrap"
            >
              다시<br/>보기
            </button>
          </div>
          
        </div>
    </div>
  )
}
