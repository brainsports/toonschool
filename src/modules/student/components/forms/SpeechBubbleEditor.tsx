// 말풍선 대사 편집 컴포넌트 (컷 화면에서 사용)
interface SpeechBubbleEditorProps {
  text: string
  onChange: (text: string) => void
  cutNumber: number
}

export default function SpeechBubbleEditor({
  text,
  onChange,
  cutNumber,
}: SpeechBubbleEditorProps) {
  return (
    <div className="card-glass p-8 md:p-10 min-h-[240px] space-y-4 flex flex-col justify-center">
      <h3 className="text-lg md:text-xl font-jua text-purple-200 flex items-center gap-2 select-none mb-2">
        <span className="text-2xl">💬</span> {cutNumber}번 컷 대사 변경하기
      </h3>

      {/* 대사 수정 입력칸 */}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="주인공이 할 대사를 직접 고쳐보세요!"
        rows={3}
        className="input-glass-soft w-full h-24 resize-none text-white placeholder:text-slate-400 font-bold"
      />
    </div>
  )
}
