import { Link } from 'react-router-dom';

// ── 섹션 1: 메인 히어로 이미지 ──────────────────────────────
function HeroMindmap() {
  return (
    <div className="relative w-full max-w-[560px]">
      <img
        src="/images/toonmind/hero-mindmap.jpg"
        alt="인권 존중과 정의로운 사회 마인드맵 예시 - 툰마인드 편집기 화면"
        className="w-full h-auto object-contain rounded-2xl"
        style={{ maxHeight: 520, minHeight: 280 }}
        loading="eager"
      />
    </div>
  );
}

// ── 섹션 3: 학년·과목 선택 UI ────────────────────────
function SubjectSelector() {
  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 w-full max-w-sm">
      <div className="flex gap-2 mb-4 text-xs font-bold">
        <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">단원 선택</button>
        <button className="px-3 py-1.5 rounded-full bg-primary text-white">주제 만들기</button>
        <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">내로 만들기</button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 font-bold mb-1 block">학년</label>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
            <option>5학년</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-bold mb-1 block">과목</label>
          <div className="flex gap-2 flex-wrap">
            {['국어','사회','수학','과학'].map(s => (
              <button
                key={s}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${s === '사회' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-bold mb-1 block">단원</label>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
            <option>2. 인권 존중과 정의로운 사회</option>
          </select>
        </div>
      </div>
      <button className="mt-4 w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-pink-600 transition-all text-sm">
        선택하기
      </button>
    </div>
  );
}

// ── 섹션 6: 편집기 예시 이미지 ──────────────────────────────
function EditMindmap() {
  return (
    <div className="relative w-full max-w-[520px]">
      <img
        src="/images/toonmind/edit-mindmap.jpg"
        alt="기후 변화와 우리 생활 마인드맵 편집 화면 예시"
        className="w-full h-auto object-contain rounded-2xl"
        style={{ maxHeight: 480, minHeight: 260 }}
        loading="lazy"
      />
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────
export default function ToonMindPage() {
  return (
    <main className="w-full flex flex-col">
      {/* ── 섹션 1: 히어로 ── */}
      <section
        className="pt-24 md:pt-28 pb-16 md:pb-20 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f0f9ff 50%, #faf5ff 100%)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* 좌측 텍스트 */}
          <div className="flex-1 space-y-6 z-10">
            <span className="inline-block text-sm font-bold text-primary tracking-wide">
              AI로 생각을 정리하는 새로운 공부법
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-on-surface">
              교과서 속 생각이<br />
              한눈에 보이는<br />
              <span className="text-primary">툰마인드</span>가 됩니다.
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              복잡한 교과 내용을 중심 주제와 가지로 연결해 보세요.<br className="hidden sm:inline" />
              AI의 도움을 받아 쉽고 재미있는 마인드맵을 만들 수 있습니다.
            </p>
            {/* 특징 배지 */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '교과서 핵심 정리', color: 'bg-pink-50 text-primary border-pink-100' },
                { label: 'AI 가지 만들기', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                { label: '직접 편집 가능', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: '무제한 마인드맵 제작', color: 'bg-green-50 text-green-700 border-green-100' },
              ].map(b => (
                <span key={b.label} className={`px-4 py-1.5 text-sm font-bold rounded-full border ${b.color}`}>{b.label}</span>
              ))}
            </div>
            {/* 버튼 */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/student/mindmap"
                className="px-8 py-4 rounded-full bg-primary text-white font-bold text-base md:text-lg hover:bg-pink-600 transition-all shadow-md hover:shadow-lg min-h-[48px] flex items-center"
              >
                툰마인드 시작하기
              </Link>
              <Link
                to="/student/mindmaps"
                className="px-8 py-4 rounded-full border-2 border-primary text-primary font-bold text-base md:text-lg hover:bg-pink-50 transition-all shadow-md min-h-[48px] flex items-center"
              >
                작품 둘러보기
              </Link>
            </div>
          </div>
          {/* 우측 마인드맵 예시 */}
          <div className="flex-1 w-full flex justify-center items-center">
            <HeroMindmap />
          </div>
        </div>
      </section>

      {/* ── 섹션 2: 툰마인드 특징 4가지 ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-on-surface mb-4">
            생각을 연결하면 공부가 쉬워집니다
          </h2>
          <p className="text-center text-on-surface-variant mb-12 text-base md:text-lg">마인드맵으로 교과 내용을 시각화해 보세요</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎯', title: '중심 주제 찾기', desc: '교과 내용의 핵심이 되는 중심 주제를 찾을 수 있어요.' },
              { icon: '🌿', title: '생각 가지 만들기', desc: '핵심 내용을 여러 가지로 나누어 연결할 수 있어요.' },
              { icon: '🖼️', title: '그림으로 이해하기', desc: '이미지와 아이콘으로 내용들을 쉽고 재미있게 이해해요.' },
              { icon: '✏️', title: '내 생각 더하기', desc: '나만의 생각과 아이디어를 마인드맵에 완성해요.' },
            ].map(card => (
              <div
                key={card.title}
                className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-bold text-on-surface mb-2">{card.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 섹션 3: 학년·과목 선택 ── */}
      <section className="py-20" style={{ background: '#f8f4ff' }}>
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* 좌측 설명 */}
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
              학년과 과목만 선택하면<br />준비 완료
            </h2>
            <div className="space-y-4">
              {[
                { num: '1', label: '학년 선택', color: 'text-primary' },
                { num: '2', label: '과목 선택', color: 'text-primary' },
                { num: '3', label: '단원 선택', color: 'text-primary' },
                { num: '4', label: '중심 주제 선택', color: 'text-primary' },
              ].map(step => (
                <div key={step.num} className="flex items-center gap-3">
                  <span className={`text-lg font-extrabold ${step.color}`}>{step.num}.</span>
                  <span className="text-base font-bold text-on-surface">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 우측 선택 UI */}
          <div className="flex-1 flex justify-center">
            <SubjectSelector />
          </div>
        </div>
      </section>

      {/* ── 섹션 4: 직접·AI 제작 ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-on-surface mb-12">
            직접 만들거나, AI와 함께 만들어요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 직접 만들기 */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center text-2xl">✏️</div>
                <h3 className="text-xl font-extrabold text-on-surface">직접 만들기</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                중심 주제에서 어이지는 내용을 직접 가지로 추가하고 자유롭게 배치하세요.
              </p>
            </div>
            {/* AI로 만들기 */}
            <div className="rounded-2xl border-2 border-primary p-8 hover:shadow-md transition-all" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #faf5ff 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white shadow flex items-center justify-center text-2xl">🤖</div>
                <h3 className="text-xl font-extrabold text-primary">AI로 만들기</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                AI가 교과 내용을 갖는 핵심 가지 형태로 빠르게 내용을 채운 뒤 시작할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 섹션 5: 제작 과정 5단계 ── */}
      <section className="py-20 bg-surface-dim">
        <div className="max-w-[1280px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-on-surface mb-12">
            툰마인드 제작 과정
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-center">
            {[
              { step: 1, label: '중심 주제\n정하기' },
              { step: 2, label: '큰 가지\n만들기' },
              { step: 3, label: '세부 가지\n연결하기' },
              { step: 4, label: '디자인\n꾸미기' },
              { step: 5, label: '저장하고\n제출하기' },
            ].map((item, idx) => (
              <div key={item.step} className="flex flex-row md:flex-col items-center gap-3 md:gap-2 flex-1">
                <div className="flex flex-row md:flex-col items-center gap-2 md:gap-3 w-full">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl md:text-2xl font-extrabold shadow-md flex-shrink-0">
                    {item.step}.
                  </div>
                  <p className="text-sm font-bold text-on-surface text-left md:text-center whitespace-pre-line leading-snug">{item.label}</p>
                </div>
                {idx < 4 && (
                  <div className="hidden md:flex text-gray-300 text-3xl self-center mx-1">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 섹션 6: 편집 기능 ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* 좌측 */}
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
              자유롭게 움직이고<br />수정하는 편집 기능
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '➕', label: '가지 추가' },
                { icon: '🖱️', label: '드래그 이동' },
                { icon: '📝', label: '내용 수정' },
                { icon: '🎨', label: '색상 변경' },
                { icon: '🔍', label: '확대와 축소' },
                { icon: '💾', label: '자동 저장' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2 py-2">
                  <span className="text-primary font-bold text-lg">✓</span>
                  <span className="text-sm font-bold text-on-surface">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 우측 편집기 예시 */}
          <div className="flex-1 flex justify-center">
            <EditMindmap />
          </div>
        </div>
      </section>

      {/* ── 섹션 7: 과목별 활용 ── */}
      <section className="py-20 bg-surface-dim">
        <div className="max-w-[1280px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-on-surface mb-12">
            여러 과목에서 활용할 수 있어요
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: '📚', subject: '국어', desc: '인물과 사건 정리', color: 'bg-pink-50 border-pink-100' },
              { icon: '🔤', subject: '영어', desc: '단어와 표현 연결', color: 'bg-blue-50 border-blue-100' },
              { icon: '📐', subject: '수학', desc: '개념과 풀이 정리', color: 'bg-yellow-50 border-yellow-100' },
              { icon: '🌍', subject: '사회', desc: '원인과 결과 연결', color: 'bg-green-50 border-green-100' },
              { icon: '🔬', subject: '과학', desc: '과학 개념과 실험 정리', color: 'bg-purple-50 border-purple-100' },
            ].map(s => (
              <div key={s.subject} className={`${s.color} border rounded-2xl p-5 text-center hover:shadow-md hover:-translate-y-1 transition-all`}>
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-base font-extrabold text-on-surface mb-1">{s.subject}</div>
                <div className="text-xs text-on-surface-variant leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 섹션 8: 저장·제출·평가 ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* 좌측 */}
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
              만들고, 제출하고,<br />선생님의 의견을 확인해요
            </h2>
            <div className="space-y-3">
              {[
                { icon: '💾', label: '내 작품함 저장' },
                { icon: '📂', label: '다시 열기' },
                { icon: '📤', label: '선생님께 제출하기' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bold text-on-surface text-sm">{item.label}</span>
                </div>
              ))}
              <div className="flex gap-2 flex-wrap pt-2">
                <span className="px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">저장 완료</span>
                <span className="px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">제출 완료</span>
                <span className="px-4 py-2 bg-pink-100 text-primary text-xs font-bold rounded-full border border-pink-200">평가 확인</span>
              </div>
            </div>
          </div>
          {/* 우측: 교사 의견 카드 */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-md p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">선</div>
                <div>
                  <div className="font-bold text-on-surface text-sm">선생님 의견</div>
                  <div className="text-xs text-gray-400">방금 전</div>
                </div>
              </div>
              <p className="text-sm text-on-surface leading-relaxed bg-pink-50 border border-pink-100 rounded-xl p-4 font-medium">
                "핵심 가지를 잘 정리했어요!<br />그림과 색상을 활용해서 이해가 쉬워요."
              </p>
              <div className="flex gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-4/5 h-full bg-primary rounded-full" />
                </div>
                <span className="text-xs text-gray-400 font-bold">80점</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 섹션 9: 하단 CTA ── */}
      <section className="py-24 text-center" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #fdf2f8 50%, #faf5ff 100%)' }}>
        <div className="max-w-[1280px] mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface">
            AI와 함께 만드는 초등 생각 정리
          </h2>
          <p className="text-on-surface-variant text-base md:text-lg">툰마인드로 교과서 내용을 마인드맵으로 정리해 보세요</p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-primary text-white font-bold text-lg hover:bg-pink-600 transition-all shadow-lg hover:shadow-xl min-h-[52px]"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
