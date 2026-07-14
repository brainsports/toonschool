# 만화 배경 생성 Edge Function 전환 — 작업 인계 문서

> 작성일: 2026-07-14 · 브랜치: `feat/comic-background-edge-function` (main 미병합)
> 상태: **코드 구현 완료 + 정적 검증 통과 + EF 핵심 로직 실검증(PASS). 배포/운영E2E 미완료(자격증명 부재로 블록됨).**

이 문서는 사용량 한계로 다음 세션에서 이어 작업하기 위한 정확한 인계입니다. **main 병합·운영 배포는 아직 하지 않았습니다.**

---

## 1. 목표 요약

로컬 `comicQueueWorker.ts` 수동 실행 없이, **Vercel(프런트) + Supabase(Edge Function)만으로** 학생이 만화 6컷 배경을 생성하도록 전환. (승인받은 권장안 A: 프런트에서 컷별 EF 직접 호출, 프런트 동시성 3)

## 2. 완료한 작업

- 신규 Edge Function `generate-comic-background` 구현 (한 호출 = 한 컷).
- EF용 공유 모듈 `_shared/comicCache.ts` (캐시 키/경로, 프런트와 동일 알고리즘).
- `generation_jobs` 정식 마이그레이션 (**ADDITIVE**, 기존 테이블/데이터 보존).
- 프런트 기능 플래그 `VITE_USE_COMIC_EF` + EF 직접 호출 경로(기존 워커 경로는 보존, 롤백용).
- 동시성을 환경변수로 조정 가능(`VITE_COMIC_CONCURRENCY`, 기본 3).
- 정적 검증(tsc+vite build) 통과. **EF 핵심 로직 실검증 PASS**(prod Supabase + 실제 Gemini).
- `comicQueueWorker.ts`는 삭제하지 않고 롤백/비교용 보존.

## 3. 수정/신규 파일

| 파일 | 구분 | 내용 |
|---|---|---|
| `supabase/functions/generate-comic-background/index.ts` | 신규 | 한 컷 생성 EF(JWT 인증→캐시조회→진행중가드→Gemini이미지→캐시버킷업로드→캐싱→job completed). HTTP 200+본문 `{success,code,message}` 규약. |
| `supabase/functions/_shared/comicCache.ts` | 신규 | `normalizeBackgroundPrompt`, `createComicBackgroundCacheKey`, `createCacheStoragePath`, `base64ToBytes` (Deno, 프런트와 동일 알고리즘). |
| `supabase/migrations/20260714180000_generation_jobs.sql` | 신규 | ADDITIVE: `CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS user_id/cache_key/request_id/style_key` + 인덱스 + `worker_heartbeats` 정식화. 삭제/변경 없음. |
| `supabase/config.toml` | 수정 | `[functions.generate-comic-background] enabled=true, verify_jwt=true` 추가. |
| `src/shared/lib/comicEdge.ts` | 신규 | `invokeGenerateComicBackground()` — 한 컷 호출, 지수 백오프(1/2/4s, 최대3회), `data.success`/`code` 처리. |
| `src/shared/lib/geminiLogger.ts` | 수정 | `GenerationStage` 에 `'comicEdgeCall'` 추가. |
| `src/modules/student/services/studentComicService.ts` | 수정 | `USE_COMIC_EF` 플래그 + `doGenerateSingleComicCut` 내 EF 직접 호출 분기(기존 enqueue+폴링은 `false`시 보존). |
| `src/modules/student/pages/StudentComicFullViewPage.tsx` | 수정 | `COMIC_GENERATE_ALL_CONCURRENCY`를 `VITE_COMIC_CONCURRENCY`로 조정 가능(기본3). 동시성3 풀은 기존 유지. |

> `src/worker/comicQueueWorker.ts` 는 **삭제하지 않음**(운영 검증 전 롤백/비교용).
> 테스트 스크립트(`scratch_ef_logic.mjs` 등)는 커밋에서 제외(untracked).

## 4. 현재 브랜치 / 커밋

- 브랜치: `feat/comic-background-edge-function` (main에서 분기, base=`eea7606`).
- 커밋: 이 브랜치에 구현 커밋 예정(아래 9절 순서). **main 병합/원격 main push는 아직 안 함.**

## 5. 실행한 테스트와 결과

| 테스트 | 결과 |
|---|---|
| `npm run build` (tsc -b + vite build) | ✅ PASS (2852 모듈, TS 에러 0) |
| ESLint (변경 프런트 파일) | ✅ 신규 코드에서 새 에러 0 (기존 `no-explicit-any` 부채는 기존과 동일) |
| EF 핵심 로직 실검증 (`scratch_ef_logic.mjs`, prod Supabase+실제 Gemini) | ✅ **PASS**: call1 MISS→Gemini 10084ms→업로드→캐시저장(총 12030ms); call2 **HIT(Gemini 미호출)→25ms** 동일 URL 재사용 |
| 캐시 `normalized_prompt` NOT NULL 버그 | ✅ 발견+수정 (EF가 정규화 프롬프트 계산 저장) |
| 재생성 시 구 이미지 잘못 재사용 버그 | ✅ 발견+수정 (project+cut 재사용 분기 제거, 콘텐츠 키 기반만 사용) |

## 6. 실패/미완료 테스트 (블록커)

| 항목 | 상태 | 원인 |
|---|---|---|
| Supabase 마이그레이션 적용 | ❌ 미적용 | 이 환경에 Supabase CLI 인증/액세스 토큰 없음. (probe로 `generation_jobs.cache_key` 컬럼 부재 확인 → EF 배포 전 마이그레이션 선행 필수) |
| EF 배포(`supabase functions deploy`) | ❌ 미배포 | 동일(자격증명 부재). Deno 로컬 미설치로 `supabase functions serve`도 불가. |
| Secret 등록(`GEMINI_API_KEY`) | ❌ 미등록 | 동일 |
| Vercel 배포(main 병합/push) | ❌ 미수행 | 의도적 보류(기능 미검증). `VITE_USE_COMIC_EF` 기본 `false`라 main에 병합해도 동작 변화 없으나, 섣부른 병합 지양. |
| 운영 URL 브라우저 6컷 E2E(EF 경로) | ❌ 미실행 | EF 미배포. EF 경로 풀 브라우저 측정(첫 컷/3컷/6컷/동시성/HIT/실패 격리)은 배포 후 가능. |

> 참고(이전 세션): 로컬 **워커** 경로 동시성3 E2E는 6컷 46.9초/최대동시3/중복0/429-0 으로 검증된 바 있음. EF 경로는 위 로직 테스트로 동등한 단계가 검증됨.

## 7. 다음 세션에서 실행할 정확한 순서와 명령

> prod Supabase project-ref = `vcxqutyuwsiiwdrwbrwx` (`.env`의 `VITE_SUPABASE_URL`에서 추출). 운영 ref 추측 금지, 실제 연결 설정으로 재확인.
> `GEMINI_API_KEY` 값은 `.env.local`에 있음(보고서/로그에 출력 금지).

```bash
# 0) 사전 확인
git checkout feat/comic-background-edge-function
git log --oneline -3
npm run build          # 정상 빌드 확인
# CLI 인증 (대화형: 사용자가 직접, 또는 토큰 환경변수 SUPABASE_ACCESS_TOKEN)
npx supabase login     # 또는 export SUPABASE_ACCESS_TOKEN=...

# 1) 마이그레이션 적용 (EF 배포보다 선행 — cache_key 등 컬럼 필요)
npx supabase db push --project-ref vcxqutyuwsiiwdrwbrwx
#   또는 대시보드 > SQL Editor 에 20260714180000_generation_jobs.sql 붙여넣기 실행(ADDITIVE라 안전)

# 2) Secret 등록
npx supabase secrets set GEMINI_API_KEY=<.env.local 의 값> --project-ref vcxqutyuwsiiwdrwbrwx
# (이미지 모델 변경 시) npx supabase secrets set GEMINI_IMAGE_MODEL=gemini-3.1-flash-image --project-ref ...

# 3) EF 배포
npx supabase functions deploy generate-comic-background --project-ref vcxqutyuwsiiwdrwbrwx
# 로그 확인: npx supabase functions logs generate-comic-background --project-ref ...

# 4) 단위 호출 스모크 (EF 정상 응답 확인) — 학생 JWT 필요
#    (브라우저 콘솔에서 supabase.functions.invoke 1회, 또는 curl with Bearer)

# 5) Vercel 환경변수 설정: VITE_USE_COMIC_EF=true (필수), VITE_COMIC_CONCURRENCY=3 (권장)
#    Vercel 대시보드 > Project > Settings > Environment Variables

# 6) 운영 브라우저 E2E (Puppeteer/실제 학생 화면):
#    - 6컷 생성: 첫 컷 ~15s / 3컷 ~25s / 6컷 ~50s / 최대동시 3 / 중복 0 / 429 0 / failed 0
#    - 캐시 HIT 재클릭 시즉시 반환, 새로고침 후 유지, 단일 컷 재생성, 일부 실패 시 나머지 계속
#    - EF 로그 + generation_jobs 상태 전이(processing→completed) 확인

# 7) 검증 통과 시 main 병합 + 원격 push (Vercel 자동 배포)
git checkout main && git merge --no-ff feat/comic-background-edge-function && git push origin main
```

## 8. 롤백 방법

- **즉시 롤백(운영)**: Vercel 환경변수 `VITE_USE_COMIC_EF=false`(또는 제거) → 프런트가 기존 워커 경로로 복귀. 기본값이 `false`이므로 플래그를 안 켰다면 현재 main은 영향 없음.
- EF 롤백: `npx supabase functions deploy` 이전 버전, 또는 `supabase/config.toml`의 `enabled=false`.
- 마이그레이션은 ADDITIVE 전용(컬럼/인덱스 추가만) → 롤백 시 되돌릴 것 없이 플래그만으로 복귀. 삭제 마이그레이션 작성 금지.
- 기존 이미지/`result_url`/캐시/작품 데이터는 전부 보존됨.

## 9. 보안 / 주의

- ✅ EF는 `SUPABASE_SERVICE_ROLE_KEY`·`GEMINI_API_KEY`를 Deno.env(Secret)에서만 사용. 프런트 비노출.
- ⚠️ **별도 후속 필요**: `src/shared/lib/gemini.ts`의 텍스트 생성용 `VITE_GEMINI_API_KEY`가 여전히 브라우저 번들에 포함됨(sceneBible 프롬프트 생성용). 본 만화 이미지 작업과 분리된 기존 노출. 텍스트 생성까지 EF로 이전하는 별도 작업 권장(주제/대본 생성 등 다수 기능이 해당 키 사용).
- EF 로그는 requestId/jobId/cut/단계별 소요만 출력(키·토큰·프롬프트 전문·개인정보 제외).
- 운영 DB/Storage/캐시 삭제 금지(본 작업은 additive만).

## 10. 미해결/확인 필요

- 운영 Supabase 요금제·Gemini tier(=전역 동시성 상한) 미확인 → 다수 학생 동시 시 429 가능. 429/실패율 증가 시 `VITE_COMIC_CONCURRENCY=2`(프런트)로 조정. 글로벌 한도는 EF가 Gemini 429를 `RATE_LIMITED`로 반환·프런트 백오프로 자가 조절.
- 테스트가 prod에 남긴 잔여(additive): `test-e2f-*` projectId 캐시 행/이미지, `e2e-parallel-*` job/이미지. 삭제 원하면 명시적 요청 시에만(자동 삭제 금지).
