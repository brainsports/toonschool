import StudentPageShell from '../components/layout/StudentPageShell'

export default function StudentTempMyPage() {
  return (
    <StudentPageShell bgVariant="default" maxWidth="lg">
      <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center">
        <div className="text-6xl mb-6">🌌</div>
        <h2 className="text-3xl font-jua text-slate-800 mb-4">내작품</h2>
        <p className="text-xl text-slate-500 font-medium">
          마이페이지 준비 중입니다.
        </p>
      </div>
    </StudentPageShell>
  )
}
