import { Wand2, Loader2 } from 'lucide-react'
import StudentPrimaryActionButton from '../layout/StudentPrimaryActionButton'

// 추가 요청사항 입력 컴포넌트 (주제 만들기 화면에서 사용)
interface ExtraRequestBoxProps {
  value: string
  onChange: (value: string) => void
  onAiRecommend?: () => void
  disabled?: boolean
  loading?: boolean
}

export default function ExtraRequestBox({
  value,
  onChange,
  onAiRecommend,
  disabled = false,
  loading = false,
}: ExtraRequestBoxProps) {
  return (
    <>
      <div className="bg-white border border-[rgba(111,78,190,0.18)] shadow-[0_4px_14px_rgba(69,50,120,0.08)] rounded-[32px] p-8 md:p-10 min-h-[240px] space-y-4 flex flex-col justify-center">
      <h3 className="text-lg md:text-xl font-jua text-[#38314f] flex items-center gap-2 select-none mb-2">
        <span className="text-2xl">✍️</span> 이야기에 넣고 싶은 것이 있나요?
      </h3>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예) 우주 정거장에서 나눗셈을 배우는 이야기로 만들어 주세요"
        rows={3}
        disabled={disabled}
        className="input-game-soft w-full h-24 resize-none text-[#25213b] placeholder:text-[#9993aa] font-bold"
      />

      </div>

      {onAiRecommend && (
        <StudentPrimaryActionButton
          onClick={onAiRecommend}
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="w-8 h-8 mr-3 animate-spin" />
          ) : (
            <Wand2 className="w-8 h-8 mr-3 stroke-[3] animate-bounce-gentle" />
          )}
          <span>{loading ? '만드는 중...' : '새로 만들기 ✨'}</span>
        </StudentPrimaryActionButton>
      )}
    </>
  )
}
