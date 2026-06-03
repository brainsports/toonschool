import { useState } from 'react'
import { ShieldCheck, Award, MessageSquareCode, Save, Sparkles, User } from 'lucide-react'

interface StudentEvaluation {
  id: string
  name: string
  loginId: string
  scores: {
    vocabulary: number
    expression: number
    story: number
    creativity: number
    focus: number
  }
  aiFeedback: string
  teacherOpinion: string
}

export default function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([
    {
      id: '1',
      name: '김철수',
      loginId: 'happy001',
      scores: { vocabulary: 85, expression: 90, story: 75, creativity: 80, focus: 95 },
      aiFeedback: '해당 학생은 기승전결 만화 컷 구성 능력이 탁월하며 특히 우주 비행사 철수 시나리오에서 논리적 흐름이 뛰어납니다. 다만 어휘 완성도가 우수함에 비해 후반부 툰 결말부 스토리 긴장감이 조금 약화되는 양상이 보입니다.',
      teacherOpinion: '스토리 후반부에 반전을 추가하는 방법을 함께 지도했습니다. 전반적인 과제 집착력과 집중도가 대단히 우수합니다.'
    },
    {
      id: '2',
      name: '이영희',
      loginId: 'happy002',
      scores: { vocabulary: 95, expression: 95, story: 90, creativity: 95, focus: 90 },
      aiFeedback: '모든 영역에서 최상위 발달 상태를 증명하고 있습니다. 특히 캐릭터의 대사를 기발한 반전 유머로 채우는 어휘 활용 능력이 탁월하며, 컷 레이아웃에 맞춰 문제를 출제하는 능력이 정밀합니다.',
      teacherOpinion: '스스로 학습 단계 완성도가 매우 높고 독창적입니다. 주도적인 창작 능력이 우수하여 친구들의 멘토로 활약하고 있습니다.'
    },
    {
      id: '3',
      name: '박재민',
      loginId: 'happy003',
      scores: { vocabulary: 60, expression: 70, story: 50, creativity: 85, focus: 65 },
      aiFeedback: '창의성 스코어가 대단히 높은 반면, 스토리의 개연성과 어휘 기초 구성 단계에 미흡한 부분이 관찰됩니다. 콘티 작성을 먼저 마무리한 후 레이아웃 생성 단계로 가도록 유도해 주세요.',
      teacherOpinion: '아이디어는 좋으나 작성을 조기에 마무리하는 습관이 있어, 끝까지 스토리를 적도록 격려가 필요합니다.'
    }
  ])

  const [selectedId, setSelectedId] = useState('1')
  const [notification, setNotification] = useState<string | null>(null)

  const activeEval = evaluations.find(e => e.id === selectedId) || evaluations[0]

  const updateTeacherOpinion = (val: string) => {
    setEvaluations(prev =>
      prev.map(e => (e.id === selectedId ? { ...e, teacherOpinion: val } : e))
    )
  }

  const handleSave = () => {
    setNotification(`${activeEval.name} 학생의 학업 성취 평가가 성공적으로 업데이트되었습니다!`)
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header and alerts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
            <span>AI 자동 학습 분석 및 성취 평정</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">인공지능이 채점한 5대 역량 평가지표를 기반으로 교사 종합 의견을 부여합니다.</p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-450 text-xs flex items-center gap-2">
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selector menu */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2 border-b border-slate-850 pb-2.5">
            <User className="h-4 w-4 text-amber-400" />
            <span>수강생 목록 선택</span>
          </h3>
          <div className="flex flex-col gap-2.5">
            {evaluations.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  selectedId === e.id
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-950/50 hover:bg-slate-950 text-slate-400'
                }`}
              >
                <div>
                  <p className="text-xs font-bold">{e.name}</p>
                  <span className={`text-[9px] font-mono ${selectedId === e.id ? 'text-white/80' : 'text-slate-500'}`}>{e.loginId}</span>
                </div>
                <Award className={`h-4.5 w-4.5 ${selectedId === e.id ? 'text-white' : 'text-slate-500'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Evaluation Board Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-bold text-slate-200 text-sm">
              {activeEval.name} 학생의 역량 레포트
            </h3>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xxs transition-all cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>평가 피드백 저장</span>
            </button>
          </div>

          {/* 5 Skills Scores meters */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">5대 AI 평가 평정 지표</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(activeEval.scores).map(([skill, score]) => {
                const skillLabels: { [key: string]: string } = {
                  vocabulary: '어휘 완성도 (Vocabulary)',
                  expression: '표현 기법 (Expression)',
                  story: '이야기 개연성 (Storytelling)',
                  creativity: '창의성 구성 (Creativity)',
                  focus: '과제 집중도 (Focus)'
                }
                return (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-xxs font-semibold">
                      <span className="text-slate-400">{skillLabels[skill] || skill}</span>
                      <span className="text-amber-400 font-bold">{score}점</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Auto Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
            <h4 className="text-xxs font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>AI 종합 자동 평가 총평</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {activeEval.aiFeedback}
            </p>
          </div>

          {/* Teacher comment editor */}
          <div className="space-y-2">
            <h4 className="text-xxs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide">
              <MessageSquareCode className="h-3.5 w-3.5 text-amber-500" />
              <span>교사 종합 평정 및 지도 의견</span>
            </h4>
            <textarea
              value={activeEval.teacherOpinion}
              onChange={(e) => updateTeacherOpinion(e.target.value)}
              placeholder="여기에 교사의 정성적 학업 피드백을 기록하세요..."
              className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-850 focus:border-amber-600 outline-none text-xs text-slate-200 placeholder-slate-650 resize-none font-medium leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
