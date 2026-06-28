

interface SNSBackCoverPreviewProps {
  studentName: string
  gradeClass: string
  completionDate: string
  subject: string
  unit?: string
  topic?: string
  backgroundColor?: string
}

export default function SNSBackCoverPreview({
  studentName,
  gradeClass,
  completionDate,
  subject,
  unit,
  topic,
  backgroundColor = 'transparent'
}: SNSBackCoverPreviewProps) {
  const infoParts = [
    studentName && `지은이 : ${studentName}`,
    gradeClass && `학년 : ${gradeClass}`,
    subject && `과목 : ${subject}`,
    unit && `단원 : ${unit}`,
    topic && `주제 : ${topic}`,
    completionDate && `발행일 : ${completionDate}`
  ].filter(Boolean);
  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-transparent shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
      style={{ aspectRatio: '1483 / 2048', padding: 0, border: 'none', lineHeight: 0 }}
    >
      {/* Background Color Layer (Bottom) */}
      <div 
        className="absolute inset-0 w-full h-full z-0 transition-colors duration-300"
        style={{ backgroundColor: backgroundColor }}
      />

      {/* Inner wrapper to provide padding/margin around the template */}
      <div className="absolute inset-0 w-full h-full z-10 scale-[0.95] origin-center">
        {/* Template Image */}
        <div className="absolute inset-0 w-full h-full leading-[0] p-0 m-0 border-none bg-transparent z-10">
          <img 
            src="/images/toonschool/back-covers/back-cover-sns-default.webp" 
            alt="Back Cover Template"
            className="w-full h-full object-cover object-center block pointer-events-none m-0 p-0 border-none bg-transparent"
          />
        </div>
        
        {/* Dynamic Data Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* 작품 정보 영역 (구분선 제거) */}
          <div className="absolute left-[4%] right-[4%] bottom-[calc(11%+9.2px)] z-20 flex justify-center items-center">
             <div className="text-[7px] sm:text-[8px] text-slate-800 font-medium text-center leading-normal whitespace-nowrap tracking-tight overflow-hidden text-ellipsis w-full px-2">
                {infoParts.join(' | ')}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

