# 꿈의 궁전 1~10레벨 통합 — 구현 계획서

> 작성일: 2026-07-17 · 브랜치: `feat/dream-palace-levels-1-10`

## 1. 배경

꿈의 궁전(성장형 보상) 시스템은 2026-07-16에 도입되어 **레벨/점수/보물지도/정원 배치/교사 칭찬**이
이미 구축되어 있다. 단, **레벨 6~10 배경이 폴백(레벨1 webp) 상태**였고, **레벨 2~10 아이템
이미지 90개**가 디스크에만 있고 DB/코드에 연결되지 않았다.

이번 작업은 "이미 만들어진 1~10레벨 이미지를 실제 기능에 연결"하는 것이 목적이다.

## 2. 조사 결과(기존 구조)

- **스택**: Vite + React Router SPA, Supabase 단일 anon-key 클라이언트(프런트 서비스 롤 없음).
- **단일 설정(SoT)**: `src/modules/student/config/dreamProgressionConfig.ts`
  - `DREAM_CHAPTERS`(10장면), `ACTIVITY_SCORE_PER_LEVEL=1000`, `levelFromActivityScore`, `GARDEN_BACKGROUND_BY_LEVEL`.
- **점수**: `reward_logs`(+items rarity join)의 순수 클라이언트 계산(`utils/dreamScore.ts`).
  - activityScore(레벨 판정) 와 bonusScore(레벨보너스 200) 분리 → 연쇄 레벨업 방지.
- **레벨 보너스/심볼**: idempotent, `reward_logs(reward_type='event', source_id='dream:level:N' / 'dream:symbol:N')`.
- **정원**: `student_gardens` / `garden_placements`(x,y,scale,rotation,z_index) / `student_items`.
- **아이템 지급(기존)**: 출석/만화/행운 보상이 `items`(30개 레벨1) 중 가중 무작위 지급.
  - **레벨 달성 아이템 자동 지급은 없었음** → 이번에 추가.
- **이미지**: 10개 배경(`public/images/level-N-*.png`), 90개 아이템(`items/level-{2..10}/`) 모두 존재. 파일명 깨끗함(배포 안전).
- **교사 화면**: `/admin/lms/dream-growth`(DreamGrowthPage)에 레벨/점수/장면/칭찬 표시. 단 additive 마이그레이션(20260716120000) 미적용 시 RLS로 `-` 폴백.

## 3. 변경 요약

### 3.1 배경 6~10 연결 (Tier 1 — DB 불필요, 즉시 동작)
- `dreamProgressionConfig.ts`의 `GARDEN_BACKGROUND_BY_LEVEL`에 level 6~10 실제 이미지 경로 추가.
- `useGardenBackgroundUrl` 이 preload 후 404 시 레벨1 webp로 폴백(기존 로직 유지).

### 3.2 레벨별 아이템 카탈로그 + 시드
- `LEVEL_ITEM_CATALOG`(레벨 2~10, 각 10개)를 동일 설정 파일에 추가. 단일 관리 지점 유지.
  - code: `lv{N}_{slug}`(레벨1 코드와 충돌 회피), category/rarity는 DB CHECK 준수.
- additive 시드 마이그레이션 `supabase/migrations/20260717000000_seed_dream_garden_level_items.sql`
  - `INSERT ... ON CONFLICT (code) DO UPDATE` + `idx_student_items_level_event_unique`(부분 unique).
  - **작성 전용(미적용)**: 적용 전엔 아이템이 DB 에 없어 조용히 스킵. 적용하면 자동 지급.

### 3.3 레벨업 아이템 지급 로직 (신규)
- `src/modules/student/services/dreamLevelItemService.ts` — `ensureLevelItems(studentId, newLevels)`.
  - 새 레벨의 아이템을 code 로 DB 조회 후 `student_items` 에 멱등 삽입.
  - source_id=`dream:item:{level}:{code}` (사전 조회 + unique 인덱스 이중 멱등).
  - **점수 0**(reward_logs 미사용) → 점수 왜곡/연쇄 레벨업 없음. 자가 복구(실패 시 다음 호출 재시도).
  - DB 미존재 아이템은 graceful skip.
- `dreamScoreService.computeDreamProgress`에서 `ensureLevelBonuses` 후 호출.
  - 지급 성공 시 `studentLootItemsChanged` 이벤트 → 정원/마이페이지 즉시 갱신.

### 3.4 학생 대시보드
- `DreamPalaceDashboardCard` 신규 컴포넌트 → `StudentMyPage` 상단에 추가.
  - 현재 레벨 / 누적 꿈점수 / 다음 레벨까지 / 진행 막대 / 현재 장소 / 꿈의 궁전 바로가기.

### 3.5 교사 대시보드
- 기존 `DreamGrowthPage`가 이름/레벨/점수/장면/남은점수/월간칭찬/필터/정렬/칭찬 지급을 이미 지원.
  - RLS 미적용 시 안내 배너로 폴백(마이그레이션 적용 후 표시).

### 3.6 버그 수정
- `dreamGardenService.grantAttendanceReward` 메시지 mojibake 수정.

## 4. 레벨 계산 기준
- `ACTIVITY_SCORE_PER_LEVEL = 1000` (0~999→L1, …, 9000+→L10). 기존 기준 그대로.
- `levelFromActivityScore` 한 곳에서 관리. `LEVEL_THRESHOLDS` 흩어진 하드코딩 없음.
- `DREAM_CHAPTERS.minActivityScore/maxActivityScore`로 레벨별 구간 표시.

## 5. 자동 해금/지급 방식
- 배경: 학생 실제 레벨(dream.level) 하나로 자동 선택(수동 선택기 없음, 기존 정책 유지).
- 아이템: 레벨 달성 시 `ensureLevelItems`가 해당 레벨 전체 아이템 지급. 중복은 source_id 멱등키 방어.
- 레벨 보너스(200점)는 최고 기록 레벨 기준 idempotent(점수 일시 변동으로 잠기지 않음).

## 6. DB 변경
- 신규 additive 마이그레이션 1건(시드 + 부분 unique 인덱스). 파괴적 변경 없음.
- 기존 `20260716120000_dream_progression.sql`(교사/랭킹 읽기 RLS)은 작성만 된 상태 유지.
- **적용은 별도**: 클라이언트는 마이그레이션 미적용 상태에서도 안전 동작(graceful fallback).

## 7. 검증 계획
- `tsc --noEmit`, ESLint, 프로덕션 빌드.
- 브라우저 테스트(학생 student@test.com): 대시보드 카드 / 정원 배경 1~10 / 잠금 / 아이템 배치·이동·크기·회전 / 새로고침 유지 / 반응형(PC·태블릿·모바일) / 콘솔·404 확인.
- 교사 화면: 담당 학생만 노출(RLS), 폴백 안내.

## 8. 제약 준수
- 마이그레이션 additive only, 기존 컬럼명 변경 금지, RLS 우회 금지, 서비스 롤 프런트 노출 금지, 새 EF 미생성.
- 기존 정원 기능(드래그/크기/회전/선택/저장/꽃비) 손상 없음.
