# 공개 체험(데모) 계정 설정 가이드

홈페이지 "학생으로 바로 체험하기 / 선생님으로 바로 체험하기" 버튼이 동작하려면
아래 순서대로 운영 Supabase/Vercel 설정을 사용자가 직접 진행해야 합니다.
(서비스 롤 키가 필요한 작업이라 코드만으로는 완료되지 않습니다.)

> 비밀번호·서비스 롤 키는 절대 Git 커밋·최종 보고·로그에 남기지 마세요.

## 0. 사전 준비
- Supabase project-ref: `vcxqutyuwsiiwdrwbrwx`
- 로컬에 `.env` 파일(이미 Vite 용으로 존재)에 다음을 **추가** (Git 에는 이미 `.env*` 가 ignore 됨):
  ```env
  SUPABASE_URL=https://vcxqutyuwsiiwdrwbrwx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드 - Settings - API - service_role>
  DEMO_STUDENT_PASSWORD=<임의의 강한 비밀번호>
  DEMO_TEACHER_PASSWORD=<임의의 강한 비밀번호>
  ```
  이메일은 기본값 사용(`demo-student@student.toonschool.local`, `demo.teacher@toonschool.kr`). 다른 값을 쓰려면 `DEMO_STUDENT_EMAIL` / `DEMO_TEACHER_EMAIL` 도 추가.

## 1. DB 마이그레이션 적용
데모 구분 컬럼(`is_demo`)·요청제한/사용량한도 테이블·`increment_demo_usage` RPC 를 만든다.
```bash
npx supabase db push --project-ref vcxqutyuwsiiwdrwbrwx
```
또는 Supabase 대시보드 SQL Editor 에서 `supabase/migrations/20260722000000_create_demo_accounts_system.sql` 내용 실행.
(멱등이라 재실행해도 안전합니다.)

## 2. 데모 계정 + 샘플 데이터 생성
```bash
npx tsx scripts/provision-demo-accounts.ts
```
- 데모 기관(툰스쿨 체험기관) · 데모 학급(체험 5학년반) · 데모 선생님/학생 계정 · 샘플 툰마인드/만화/보상/평가/알림 생성.
- 멱등: 이미 있으면 재사용. 재실행 안전.

## 3. demo-login Edge Function 용 Secret 등록
**1단계에서 지정한 비밀번호와 동일한 값**을 Supabase Secret 으로 등록해야 demo-login EF 가 로그인할 수 있습니다.
```bash
npx supabase secrets set \
  DEMO_STUDENT_EMAIL=demo-student@student.toonschool.local \
  DEMO_STUDENT_PASSWORD=<1단계와동일> \
  DEMO_TEACHER_EMAIL=demo.teacher@toonschool.kr \
  DEMO_TEACHER_PASSWORD=<1단계와동일> \
  --project-ref vcxqutyuwsiiwdrwbrwx
```
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` 는 EF 에 자동 주입됩니다.)

## 4. Edge Function 배포
```bash
npx supabase functions deploy demo-login --project-ref vcxqutyuwsiiwdrwbrwx
# 데모 한도 분기가 추가되었으므로 두 AI EF 도 재배포
npx supabase functions deploy generate-mindmap --project-ref vcxqutyuwsiiwdrwbrwx
npx supabase functions deploy generate-comic-background --project-ref vcxqutyuwsiiwdrwbrwx
```

## 5. Vercel 환경변수 + 배포
Vercel Project Settings - Environment Variables 에 추가(Production):
```env
VITE_DEMO_LOGIN_ENABLED=true
```
(기존 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 는 그대로 유지.)
이후 main 병합/배포. Production 빌드가 최신 커밋을 가리키는지 확인.

## 6. 동작 확인
- 홈페이지(`/`) → "학생으로 바로 체험하기" 클릭 → 학생 마이페이지로 이동 + 상단 데모 배너 + 체험 시작 안내.
- "선생님으로 바로 체험하기" → 교사 대시보드(`/admin/lms/classes`) + 데모 배너.
- 역할 전환(체험 종료 후 다른 역할 버튼) 정상.
- 데모 계정으로 툰마인드/만화 생성 → 일일 한도(툰마인드 2회/이미지 6회) 도달 시 안내 메시지.

## 롤백 / 제거
- 데모 계정만 비활성화하려면: Supabase Auth 에서 해당 사용자 비활성화, 또는 `profiles.is_demo` 행의 status 를 inactive 로 변경(운영 데이터는 영향 없음).
- 데모 데이터 삭제: `where is_demo is true` 조건으로 데모 기관/학급/계정/샘플만 선택적 삭제 가능.
- 코드 롤백: 이 브랜치 커밋을 revert. 마이그레이션은 컬럼 추가만 하므로 운영 데이터 손상 없음.
