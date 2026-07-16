# 꿈의 궁전 성장형 보상 시스템 — 전체 개발 계획서

> 브랜치: `feat/dream-palace-progression`
> 작성일: 2026-07-16
> 핵심 전환: `아이템 개수 수집` → `활동/아이템 획득 → 꿈점수 ↑ → 레벨 ↑ → 새 장면·배경 해제 → 상징 아이템 → 랭킹`

---

## 0. 조사로 확정한 핵심 제약 (설계의 출발점)

1. **프론트는 anon-key 단일 클라이언트** (`src/shared/lib/supabase.ts`). service_role 클라이언트 없음.
2. **`reward_logs` / `student_reward_stats` RLS = `student_id = auth.uid()`** (본인만 읽기/쓰기). 점수 컬럼 없음.
   - 따라서 타 학생/학생의 reward_logs를 클라이언트가 직접 읽을 수 없다.
3. **연속 출석(streak) 로직/컬럼 없음** — `student_attendance_logs`(날짜 로그)에서 계산.
4. **`student_gardens`에 `dream_score` 컬럼 없음**, `level`/`experience`/`background_code` 만 존재.
5. **items 등급 = `rarity`** (common/uncommon/rare/epic/legendary). 별도 점수 컬럼 없음.
6. **reward_logs reward_type CHECK** = (attendance/comic_complete/lucky_reward/hidden_encounter/teacher_reward/event). 새 타입은 마이그레이션 필요.
7. **멱등성 unique 인덱스 2개**(reward_logs):
   - `(student_id, reward_type, source_id) where source_id is not null`
   - `(student_id, reward_type, reward_date) where source_id is null and reward_date is not null`
8. **교사 격리** = 기존 `student-by-teacher` Edge Function(배포됨, service_role 사용)로 학생 목록 스코핑. 새 EF 배포 금지.
9. **운영 URL = `https://toonschool.kr/`**, 배포 마커 = JS 번들 내 `__pwa_auto_reload_at__`.
10. **DB push / migration 적용 / EF 배포 모두 금지**. additive migration 파일만 작성(미적용).

## 0.1 위 제약에서 도출한 아키텍처 (제약 준수 + 최대 기능)

| 기능 영역 | 구현 방식 | 운영(마이그레이션 미적용) 동작 |
|---|---|---|
| 학생 본인 꿈점수·레벨·장면·진행률 | **본인 reward_logs + items join 순수 클라이언트 계산** | ✅ 100% 작동 |
| 보물지도(ㄹ자·구불점선·상태) | config + 클라이언트 계산 결과 | ✅ 100% 작동 |
| 꿈의 궁전(배치/이동/회전/크기 유지 + 상단정보 + 배경전환 + 레벨업 모달) | 기존 서비스 유지 + 추가 | ✅ 100% 작동 |
| 꿈점수 상세 모달(득템/출석 이동) | 본인 데이터 계산 | ✅ 100% 작동 |
| **교사 칭찬(50점, 월3회)** | `teacher_messages`(class_key=`praise:{studentId}`) 교사 작성 → 학생이 읽으면 **본인 reward_logs 자가 기록** | ✅ 작동(마이그레이션 불필요) |
| 5일 연속 출석(100점)·레벨달성보너스(200점) | 본인 reward_logs `event` 행으로 idempotent 기록 | ✅ 작동 |
| 랭킹(동급생 비교) | **additive 마이그레이션**(동급 읽기 RLS + denorm 점수) 적용 시 작동 | ⚠️ 적용 전 graceful fallback(본인 순위만) |
| 교사 대시보드 학생 점수 | additive 마이그레이션(교사 읽기 RLS) 적용 시 작동 | ⚠️ 학생 목록(이름/학년/반)은 항상 표시, 점수는 fallback |

→ **학생 성장 경험(기능의 80%)은 운영에서 완전 작동**. 크로스 사용자 기능(랭킹/교사 점수 조회)은 단일 additive 마이그레이션으로 한 번에 잠금해제.

---

## 1. 현재 학생 대시보드 구조
- 실제 홈/역할별 진입점 = `/student/mypage` → `src/modules/student/pages/StudentMyPage.tsx`.
- `/student` → `StudentDashboard.tsx` (mock, 사실상 미사용).
- 모든 학생 페이지는 공유 셸 `src/modules/student/components/layout/StudentPageShell.tsx` 로 감싸짐. **"득템 개수/출석보상 개수"는 이 셸의 헤더(우측)에 있음**(아래 #10).

## 2. 현재 꿈의 궁전 페이지·컴포넌트
- 라우트 `/student/dream-garden` → `src/modules/student/pages/StudentDreamGardenPage.tsx` (router.tsx:135).
- 보조: `components/dream-garden/DreamGardenPetals.tsx`, 스타일 `styles/student-ui.css`(`.dg-*`, `.dream-garden-*`).
- 서비스: `services/dreamGardenService.ts`, `services/itemRewardService.ts`.

## 3. 기존 아이템 획득·배치·이동·회전·크기·저장 구조
- 획득: `grantRandomItem`(reward_logs 멱등) → `grantAttendanceReward`/`grantComicCompleteReward`/`grantLuckyRewardIfNeeded`/`grantHiddenEncounterReward`.
- 배치/자동배치: `saveGardenPlacement` + `getAutoGardenPlacement`(카테고리별 좌표 영역).
- 이동/회전/크기/저장: `updateGardenPlacement({x,y,scale,rotation,zIndex,isVisible})`. 좌표는 정원 캔버스 비율(0~100).
- 테이블: `student_items`, `student_gardens`, `garden_placements`(rotation ∈ [-360,360], unique garden_id+student_item_id).

## 4. 출석·만화제작·작품완성·보상 데이터 흐름
- 출석: `ensureTodayAttendance`(student_attendance_logs) + `grantAttendanceReward`(reward_logs attendance + 아이템).
- 만화 완성: `StudentBackCoverPage.grantCompletionRewardAfterBackCoverSave` → `grantComicCompleteReward(studentId, projectId)`(120점 상당 아이템 + completed_comic_count+1) + `grantLuckyRewardIfNeeded`(3편마다 행운 아이템).
- 히든 조우: `components/reward/HiddenItemEncounter.tsx`(만화 제작 중 15~30초 후 등장) → `grantHiddenEncounterReward`.

## 5. 현재 학생 점수·보상 통계 데이터 구조
- 점수 컬럼 **없음**. 보상 = 아이템 단위. 통계 = `student_reward_stats`(completed_comic_count, last_lucky_reward_count, last_attendance_reward_date).
- 별개 평가 점수 = `student_growth_evaluations`(만화 평가, 본 기능과 무관).

## 6. 교사 대시보드·학생 목록 구조
- 교사 기능 = `src/modules/admin-lms/` 모듈 통합. 라우트 `/admin/lms/*`. 교사 홈 → `/admin/lms/classes` 리다이렉트.
- 학생 관리: `/admin/lms/students` → `pages/StudentManagementPage.tsx`. `AssessmentPage.tsx`에 (mock) 점수/성장단계 표시 선례 존재.

## 7. 교사별 학급·학생 데이터 격리
- 학급: `classes.teacher_id` 소유권. `classService.ts`에서 `.eq('teacher_id', teacherId)` + RLS 방어(`20260714120000`).
- 학생: `students.created_by` OR `students.class_id ∈ 본인 학급`. **서버 EF `student-by-teacher`(service_role)로 스코핑**. 절대 완화 금지.

## 8. 현재 랭킹/통계 기능 존재 여부
- **없음**. 교사 AssessmentPage 점수는 전부 mock.

## 9. 사용할 기존 Supabase 테이블/서비스
- 테이블: items, student_items, student_gardens, garden_placements, reward_logs, student_reward_stats, student_attendance_logs, teacher_messages, students, classes, profiles.
- 서비스: dreamGardenService, itemRewardService, studentAttendanceService, teacherMessageService, classService, studentService(EF).

## 10. 수정/신규 파일 목록
**신규(학생 공통/서비스/컴포넌트)**
- `src/modules/student/config/dreamProgressionConfig.ts` — 10장면·레벨임계·등급점수·멱등키 단일 설정
- `src/modules/student/utils/dreamScore.ts` — 점수/레벨 계산 순수 함수(activityScore/bonusScore/dreamScore 분리)
- `src/modules/student/services/dreamScoreService.ts` — 점수 조회·5일연속·레벨달성보너스·심볼 idempotent 기록 + denorm 동기화
- `src/modules/student/services/teacherPraiseService.ts` — 칭찬(teacher_messages 채널) + 월3회 제한 + 학생 자가기록
- `src/modules/student/components/dream/TreasureMapPage.tsx` — 보물지도(ㄹ자/구불점선/상태)
- `src/modules/student/components/dream/DreamScoreDetailModal.tsx` — 점수 상세 모달
- `src/modules/student/components/dream/LevelUpModal.tsx` — 레벨업 연출
- `src/modules/student/components/dream/DreamRankingModal.tsx` — 랭킹
- `src/modules/student/components/dream/useDreamProgress.ts` — 진행 상태 훅(셸/궁전/대시보드 공유)
- `src/modules/student/styles/dream-progression.css` — 보물지도/모달 스타일

**수정**
- `src/modules/student/components/layout/StudentPageShell.tsx` — 헤더 우측을 레벨/꿈점수/장면/순위/보물지도로 개편, 득템·출석보상은 상세 모달로 이동
- `src/modules/student/pages/StudentDreamGardenPage.tsx` — 상단 정보·배경해제/전환·레벨업 연달기
- `src/app/router.tsx` — `/student/treasure-map`, `/student/dream-ranking` 라우트 추가
- `src/modules/admin-lms/pages/StudentManagementPage.tsx`(또는 신규 탭) — 학생 성장 현황 컬럼 + 칭찬 버튼 + 상세 모달
- `src/modules/admin-lms/services/dreamTeacherService.ts`(신규) — 교사용 학생 점수 조회(best-effort + fallback)

**additive 마이그레이션(작성만, 미적용)**
- `supabase/migrations/20260716120000_dream_progression.sql`

## 11. 기능별 구현 순서
1. `dreamProgressionConfig.ts`(설정 단일화)
2. `dreamScore.ts`(순수 계산 함수)
3. `dreamScoreService.ts`(조회·기록·idempotent·denorm)
4. `useDreamProgress.ts`(공유 훅)
5. `StudentPageShell.tsx` 헤더 개편 + 점수 상세 모달
6. 보물지도 페이지 + 라우트
7. 꿈의 궁전 개편(상단정보·배경전환·레벨업 모달)
8. 랭킹 모달( fallback )
9. 교사 칭찬 서비스 + 교사 대시보드 성장 현황
10. additive 마이그레이션 작성
11. 빌드·브라우저 검증·커밋·main 병합·Vercel·운영 검증

## 12. 점수 중복 지급 방지
- 모든 기록은 reward_logs unique 인덱스로 멱등:
  - 출석: `(student,reward_date)` + `getExistingAttendanceRewardLog`
  - 5일연속: reward_type=`event`, source_id=`dream:streak5:{streakEnd}`
  - 작품완성: 기존 `comic_complete` + comicId
  - 아이템: 기존 source_id
  - 칭찬: reward_type=`teacher_reward`, source_id=`praise:{messageId}`(메시지 ID=자연 멱등키)
  - 레벨달성: `event` source_id=`dream:level:{n}`
  - 레벨심볼: `event` source_id=`dream:symbol:{n}`
- 클라이언트 재요청/새로고침 시에도 unique 인덱스 + 사전 존재 조회로 1회 보장.

## 13. 레벨 판정·달성 보너스 처리
- **activityScore**(레벨 판정용) = 출석(50) + 5일연속(100) + 아이템(등급) + 작품완성(120) + 칭찬(50) + 특별미션(200).
- **bonusScore**(레벨달성 200점) = activityScore에서 **제외**.
- **dreamScore**(표시) = activityScore + bonusScore.
- 레벨 = `levelFromActivityScore(activityScore)`. 임계값: L1=0~, L2=1000~, ... L10=9000~ (config 한 곳).
- 레벨업: newLevel > oldLevel(이미 기록된 최고 레벨) → 루프로 L(old+1)..L(new) 각 200점+심볼 idempotent 기록. 보너스는 activityScore에 넣지 않으므로 **연쇄 레벨업 없음**.

## 14. 기존 학생 데이터 보호
- 기존 student_items/garden_placements 전혀 삭제/초기화 안 함.
- 점수 데이터 없으면 0점/레벨1 fallback.
- garden_placements 위치·회전·크기 그대로 유지(기존 페이지 로직 보존).
- 교사 격리 조건 유지.

## 15. 반응형
- 보물지도: 데스크톱 전체 가로형, 모바일 가로 스크롤 + 현재 위치 자동 스크롤.
- 꿈의 궁전: 정보패널/배치면 겹침 방지(기존 오버레이 폭 로직 유지), 모바일 아이템 목록 하단 서랍.
- 교사 대시보드: 표가 잘리지 않게 카드/가로스크롤, 필터 사용성.
- Tailwind breakpoint + 기존 `dg-*` 반응 규칙 준수.

## 16. 테스트 시나리오
- 학생: 로그인→헤더 레벨/점수→상세모달(득템/출석 이동 확인)→꿈의궁전(배치유지)→보물지도(ㄹ자/구불점선/상태/남은점수)→레벨업 보너스→새로고침 중복無→연쇄 无→반응형→콘솔/네트워크 오류 无.
- 교사: 로그인→담당 학생만 노출→성장 현황→칭찬(50점/월3회/중복방지/타학생 차단)→반응형.
- 테스트 계정: 학생 `student@test.com`/`Test1234!`(신규 생성 금지). 교사는 기존 계정 확인 후 사용.

## 17. Git 계획
- 브랜치 `feat/dream-palace-progression`(생성 완료).
- 기능 단위 커밋 → 원격 push → 원격 main 최신 반영 → main 병합(no-ff) → 충돌 해결 → main 빌드 재검증 → 원격 main push.
- 기존 미완료 변경( reports/ scratch)은 건드리지 않고 내 기능 파일만 스테이징.

## 18. Vercel 배포·운영 검증
- main push 후 Vercel 자동 배포 확인(`https://toonschool.kr/`, JS 번들 `__pwa_auto_reload_at__` 마커).
- 운영에서 학생 헤더/보물지도/꿈의궁전/칭찬(교사) 핵심 흐름 재검증.

## 19. 예상 위험·대응
- **RLS로 크로스 사용자 데이터 차단** → 랭킹/교사 점수는 graceful fallback + additive 마이그레이션으로 잠금해스(#0.1).
- **denorm 컬럼 부재** → student_reward_stats 업데이트 시 컬럼 미존재 에러 catch 후 스킵(본인 계산값이 디스플레이 소스).
- **reward_type CHECK** → 새 타입 대신 기존 `event`+source_id prefix 인코딩 사용(운영 바로 동작).
- **레벨 연쇄** → 보너스를 activityScore에서 제외해 단절.
- **기존 데이터 훼손** → 모든 신규 기록은 append-only, 기존 행/배치 미변경.
- **빌드 타입 에러** → tsc strict 준수, any 최소화, 빌드 게이트 통과 필수.

---

## 꿈점수 계산 요약표 (config 반영)

| 활동/보상 | 점수 | activityScore 포함 | 멱등키 |
|---|---:|---|---|
| 일일 출석 | 50 | O | reward_date(attendance) |
| 5일 연속 출석 | 100 | O | `dream:streak5:{end}` |
| 만화 중 우연 아이템 | 등급별 | O | item source_id |
| 작품 완성 | 120 | O | comicId(comic_complete) |
| 선생님 칭찬 | 50 | O | `praise:{messageId}` |
| 레벨 달성 보너스 | 200 | **X**(bonus) | `dream:level:{n}` |
| 특별 미션 | 200 | O | `dream:special:{id}` |
| 레벨 상징 아이템 | 0 | - | `dream:symbol:{n}` |

등급 점수: common 50 / uncommon 80 / rare 120 / epic 200 / legendary 300 / symbol 0. 동일 아이템 첫 획득 100%, 이후 25%.
