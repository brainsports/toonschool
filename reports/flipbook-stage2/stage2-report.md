# Stage 2 완료 보고 — 16:9 파스텔 프레임·배경·표지 기반

> 브랜치: `feat/flipbook-landscape-pastel-16-9` / 시작 커밋: `24f7611`(Stage 1) / 작성일: 2026-07-15
> 검증 화면/측정 산출물은 이 디렉터리(`reports/flipbook-stage2/`)에 PNG/JSON 형태로 보관(대용량 임시 캡처라 Git 미커밋).

## 1. 현재 브랜치와 시작 커밋
- 브랜치 `feat/flipbook-landscape-pastel-16-9` 유지. Stage 1(`24f7611`) 위에서 누적.
- main 병합·push·배포 없음. 기존 작업/참고 이미지 보존.

## 2. 참고 이미지 확인 결과
- `docs/design/flipbook-landscape-pastel/reference/0[1-6]-*.png` 6개 보존(본 커밋에 포함).
- 이미지 분석 결과 `01-background-reference.png`는 **텍스트/UI가 없는 깨끽한 자연 배경**(하늘·구름·초록 언덕·데이지·나비)으로 확인 → 그대로 공통 배경 에셋으로 사용 가능. 첫 분석에서 "제목/리본/콘텐츠 박스"가 보인 것은 유도 질문에 의한 환각.
- `02-cover-reference.png` 레이아웃(리본/큰제목/컬러 부제/좌 정보카드 4필드/우 히어로 카드/하단 3tab)을 DOM으로 재현.

## 3. 신규·수정 파일
신규:
- `src/assets/flipbook/pastel-landscape-background.png` (참고 배경을 프로젝트 에셋으로 복사, 1.2MB)
- `src/modules/student/styles/flipbook-landscape-pastel.css` (토큰 `--flp-*` + 프레임/배경/카드/표지, `.flp-*` 네임스페이스로 기존 `--fb-*`와 충돌 없음)
- `src/modules/student/components/viewer/FlipbookBackground.tsx`
- `src/modules/student/components/viewer/FlipbookContentCard.tsx`
- `src/modules/student/components/viewer/FlipbookPageFrame.tsx` (`FLIPBOOK_LANDSCAPE_WIDTH/HEIGHT=1600/900` export)
- `src/modules/student/components/viewer/pages/FlipCoverPagePastel.tsx`
- `src/modules/student/pages/FlipbookLandscapePreviewPage.tsx` (검증용 공개 라우트)
수정:
- `src/app/router.tsx` (공개 미리보기 라우트 `/flipbook/preview` 1줄 + import 1줄)

미수정(보호): 기존 `FlipCoverPage.tsx`, `StudentComicViewerPage.tsx`, `flipbook.css`, 라이브 뷰어 일체. 기존 표지(코믹 매거진)는 Stage 5 뷰어 통합 시 `FlipCoverPagePastel`로 교체.

## 4. 1600×900 페이지 프레임 구현 내용
- `FlipbookPageFrame`: 논리 캔버스 항상 1600×900. 화면 모드에선 `useLayoutEffect` + `ResizeObserver`로 **부모 컨테이너에 맞춰 scale 1회만 계산**(`min(parentW/1600, parentH/900)`). `captureMode` 시 1600×900 고정(scale 1)로 html2canvas/PDF 캡처용 렌더.
- 측정 전 초기 scale=0 → 첫 paint 전 `useLayoutEffect`가 실제 scale로 덮어쓰기 → 1600×900 오버플로우 점프 없음.
- 이중/삼중 scale 구조(구 currentZoom→PageWrapper→페이지 내부)를 대체하는 단일 scale 기반 마련.

## 5. 공통 배경 에셋 적용 방식
- 인라인 SVG 재해석 금지(사용자 지시). 확정 에셋 PNG를 Vite 에셋으로 import(`import bgUrl from '...png'`).
- `FlipbookBackground`: `.flp-bg` absolute inset0, `background-size:cover/center`, `pointer-events:none`, `role=img`. `variant`(default/cover/content/quiet)로 콘텐츠 밀도에 따른 살짝 화이트 워시 오버레이. 로딩 전/실패 시 `var(--flp-sky)` 먼저 표시(깜빡임/빈 화면 방지).

## 6. 디자인 토큰
- `--flp-*` 네임스페이스로 §6 권장값 적용(`--flp-sky:#dff4ff`, `--flp-blue:#4d94e8`, `--flp-green:#79bf55`, `--flp-pink:#f6a4c2`, `--flp-card:rgba(255,255,255,.94)`, `--flp-radius-lg:32px`, `--flp-shadow` 등) + 보조(`--flp-title-blue`, `--flp-card-border`).
- 폰트: 타이틀/리본 `var(--font-game-title)`(SeoulAlim), 본문 Pretendard(앱 전역 제공값 재사용).

## 7. 표지 데이터 연동 결과
- 미리보기 페이지가 샘플 `ViewerPageLike[]` + `FlipbookMapContext`로 `mapViewerPages()` 호출 → `FlipbookCoverPage` 생성 → `FlipCoverPagePastel` 렌더. Stage 1 매퍼가 표지에 실제 연결됨.
- 렌더 확인: 과목=사회, 단원=2. 산지와 하천(subUnit), 주제=강줄기가 만드는 우리나라 땅 모양, 학습목표=「강줄기」 등 핵심 개념 학습(learningGoal 없음 → keywords 폴백), 이름=김도현, 학급=5학년 2반, 날짜=2026.07.15.
- §9 폴백 동작: learningGoal 없음→키워드 폴백, 학급/이름/날짜 기본값, 대표 이미지 없음→placeholder.

## 8. scale 통합 및 크기 튐 검증
측정값(`.flp-page` getBoundingClientRect, 시각 크기). **모든 뷰포트에서 t0=100ms=1000ms=imgLoaded 동일 → 크기 변화 없음.**

| viewport | 논리 크기 | 최초 표시(t0) | 최종 표시(1000ms) | scale | 크기 변화 |
|---|---|---|---|---|---|
| 1920×1080 | 1600×900 | 1920×1080 | 1920×1080 | 1.200 | 없음 |
| 1440×900 | 1600×900 | 1440×810 | 1440×810 | 0.900 | 없음 |
| 1024×768 | 1600×900 | 1024×576 | 1024×576 | 0.640 | 없음 |
| 390×844 | 1600×900 | 390×219 | 390×219 | 0.244 | 없음 |

## 9. html2canvas 캡처 결과
- 4개 뷰포트 모두 `ok=true`, 캡처 캔버스 1600×900. 배경 이미지·폰트(`document.fonts.ready` 대기)·반투명 카드·placeholder 정상 출력, CORS 오류 없음.

## 10. 화면별 캡처 파일 (이 디렉터리, 미커밋)
- `01-cover-1920x1080.png`, `02-cover-1440x900.png`, `03-cover-1024x768.png`, `04-cover-390x844.png`, `05-cover-reference-comparison.png`(참고 vs 구현), `_measure.json`(측정 원본).

## 11. 참고 이미지와 구현 결과 차이
- 정합: 배경 톤, 리본/큰제목/컬러 부제, 좌 정보카드 4필드, 우 placeholder, 하단 3tab 배치, 16:9 비율.
- 차이: (1) 라이브 데이터 기반 표지이므로 값이 샘플(김도현/사회/강줄기). (2) 학습목표는 실제 저장값이 없어 키워드 폴백 표시. (3) 배경은 단일 PNG 에셋(참고의 손그림 느낌은 에셋에 의존). (4) 우측 히어로는 placeholder(실제 만화 이미지 주입은 Stage 5). (5) 라이브 뷰어 연결 전(미리보기 라우트로 검증).

## 12. 빌드·타입·린트 결과
- `npx tsc -b` ✅ exit 0 / `npx eslint`(신규+router) ✅ exit 0 / `npm run build`(tsc -b && vite build) ✅ exit 0(2.47s). 에셋 번들 확인. 기존 경로(INEFFECTIVE_DYNAMIC_IMPORT, 청크 500kB)는 본 변경 무관.

## 13. 남은 문제
- 배경 에셋 1.2MB PNG(WebP 변환 도구 없음) → WebP 최적화/압축은 후속(별도 도구 또는 sharp 도입 시).
- 라이브 뷰어(`StudentComicViewerPage`/`SharedComicViewerPage`)는 여전히 구 1400×990 → Stage 5에서 신규 프레임/표지로 전면 교체 및 구 이중 scale 제거.
- `/flipbook/preview` 라우트는 검증용 임시 → Stage 5 이후 제거 또는 dev 게이트.

## 14. 로컬 커밋 해시
- 본 Stage 2 커밋(해시는 `git log -1` 확인). 아래 최종 보고에도 명시.

## 15. 최종 Git 상태
- 기능 브랜치 로컬 커밋만. push·main 병합·배포 없음.

## 16. Stage 3 권장 작업
- 만화 컷 페이지(`FlipComicPage` 파스텔화): 말풍선/캐릭터 DOM 오버레이 유지, 16:9 프레임 적용, `FlipbookComicPage` 모델 연결. 이어서 스토리/퀴즈/뒤표지 순.
