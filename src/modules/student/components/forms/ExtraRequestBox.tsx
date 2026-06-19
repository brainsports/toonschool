// 추가 요청사항 입력 컴포넌트 (주제 만들기 화면에서 사용)
interface ExtraRequestBoxProps {
  value: string
  onChange: (value: string) => void
  onAiRecommend?: () => void
}

export default function ExtraRequestBox({
  value,
  onChange,
  onAiRecommend,
}: ExtraRequestBoxProps) {
  return (
    <div className="card-glass p-6 space-y-4">
      <h3 className="text-base font-jua text-purple-200 flex items-center gap-2 select-none">
        <span className="text-xl">✍️</span> 이야기에 넣고 싶은 것이 있나요?
      </h3>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예) 우주 정거장에서 나눗셈을 배우는 이야기로 만들어 주세요"
        rows={3}
        className="input-glass-soft w-full h-24 resize-none text-white placeholder:text-slate-400 font-bold"
      />

      {onAiRecommend && (
        <button
          type="button"
          onClick={onAiRecommend}
          className="w-full card-glass card-glass-interactive py-3 text-purple-300 font-jua text-sm"
        >
          <span>✨ 예시 아이디어 채우기</span>
        </button>
      )}
    </div>
  )
}
