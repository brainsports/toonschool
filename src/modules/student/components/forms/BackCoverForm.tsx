// 뒤표지 작성 폼 컴포넌트
import StudentWideCard from '../layout/StudentWideCard'
import StudentInnerPanel from '../layout/StudentInnerPanel'
interface BackCoverFormProps {
  studentName: string
  completionDate: string
  learnedPoints: string
  onChangeLearnedPoints: (value: string) => void
  impression: string
  onChangeImpression: (value: string) => void
}

export default function BackCoverForm({
  studentName,
  completionDate,
  learnedPoints,
  onChangeLearnedPoints,
  impression,
  onChangeImpression,
}: BackCoverFormProps) {
  return (
    <StudentWideCard>
      
      {/* 책의 뒤표지 책등(Spine) 및 메타정보 카드 */}
      <div className="bg-gradient-to-r from-purple-500/50 to-indigo-500/50 border border-white/20 text-white shadow-sm rounded-[2rem] p-6 md:p-8 backdrop-blur-md">
        <div className="flex justify-between items-center select-none">
          <div>
            <span className="text-[11px] font-jua text-purple-200 block tracking-wider">CREATOR</span>
            <span className="text-xl md:text-2xl font-jua text-purple-100 drop-shadow-sm">{studentName} 대원</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-jua text-purple-200 block tracking-wider">COMPLETED ON</span>
            <span className="text-sm font-jua text-purple-100">{completionDate}</span>
          </div>
        </div>
      </div>

      {/* 오늘 배운 점 */}
      <StudentInnerPanel className="!items-start !justify-start !text-left">
        <h3 className="text-lg md:text-xl font-jua text-purple-200 flex items-center gap-2 select-none mb-4">
          <span className="text-2xl">📝</span> 오늘 공부해서 알게 된 비결
        </h3>
        <textarea
          value={learnedPoints}
          onChange={(e) => onChangeLearnedPoints(e.target.value)}
          placeholder="분수 계산을 행성 모험에서 어떻게 풀었나요? 핵심 비결을 적어주세요!"
          rows={3}
          className="input-glass-soft w-full resize-none text-white placeholder:text-slate-400 font-bold bg-white/5"
        />
      </StudentInnerPanel>

      {/* 나의 한 줄 소감 */}
      <StudentInnerPanel className="!items-start !justify-start !text-left">
        <h3 className="text-lg md:text-xl font-jua text-purple-200 flex items-center gap-2 select-none mb-4">
          <span className="text-2xl">💭</span> 내 소감 한 줄평
        </h3>
        <input
          type="text"
          value={impression}
          onChange={(e) => onChangeImpression(e.target.value)}
          placeholder="예) 통분을 하고 더하니까 분수 덧셈 마스터가 됐어요!"
          maxLength={50}
          className="input-glass-soft w-full text-white placeholder:text-slate-400 font-bold bg-white/5"
        />
        <p className="text-xs text-slate-400 font-bold text-right mt-1 w-full">{impression.length} / 50자</p>
      </StudentInnerPanel>

      {/* AI 칭찬 메시지 */}
      <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 shadow-sm rounded-[2rem] p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-3xl select-none shrink-0 animate-bounce-gentle shadow-sm">
            🤖
          </div>
          <div>
            <h5 className="text-sm font-jua text-emerald-300">AI 네비게이터의 칭찬 수신</h5>
            <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed mt-1">
              "정말 명품 만화책을 탄생시켰습니다! 분수 덧셈 수식을 스토리텔링으로 녹여내다니, 민준 대원의 연산 조작력과 만화적 상상력이 결합되어 최고의 학습툰이 만들어졌어요! 보상 획득 기지인 완료 화면으로 가볼까요?"
            </p>
          </div>
        </div>
      </div>

    </StudentWideCard>
  )
}
