# Stage 5A 완료 보고 — 학생 라이브 뷰어 양면 펼침(파스텔) 연결

> 브랜치 `feat/flipbook-landscape-pastel-16-9` / Stage1~4 선행 / 2026-07-15

## 1. Git
- 작업 전 최신: `de24a8e`(Stage 4). 추적 diff 작업 전 깨끗. push·main 병합·배포 없음.

## 2. 기존 뷰어 조사 (stage5a-research.md)
- 라우트 `/student/comic/read`(`router.tsx:130`), `RequireStudent`(useAuth/Supabase 세션) 뒤.
- 작품 로드: `localStorage`(LZString) — `loadComicProjectData`/`projectStorage.load*`/`loadComicCutData`. projectId = state||topic.id||`localStorage.currentProjectId`(새로고침 복구).
- 기존 조립: `ViewerPage[]`(가변 길이, 데이터 유무별 조건부 push).
- **기존 spread = 단일 페이지**(`getSpreads`→`[pageIndex,null]`). → 5A에서 **양면 북 스프레드로 전환**(사용자 확정).
- 확대: `currentZoom`(zoomPercent ?? fit). 플립: 단일 페이지 rotateY(1100ms, 앞=현재/뒤=다음, backface hidden). 키보드 ←/→.
- 캡처 결합: `renderPdfPage`·`handleShare`가 `renderFlipPage`(구 1400×990)에 의존 → 5A 미수정 영역.

## 3. 구현 결과
- **양면 스프레드**: `getSpreads(16)` → 9스프레드. 표지 `[null,0]`(우측 단독) → 본문 2면 `[1,2]…[13,14]` → 뒤표지 `[15,null]`(좌측 단독). (알고리즘 검증 완료)
- **실제 책 넘김(북 턴)**: next → 우측 페이지가 좌측으로 rotateY -180(앞면=현재 우, 뒷면=다음 좌, 책등 origin). prev → 좌측이 우측으로 +180. `flipNextAnim/flipPrevAnim` 재사용, backface-hidden, z-index 30, 중앙 책등 섀도우. 입력 잠금(isFlipping) 유지.
- **단일 scale**: 펼침 전체(3200×900) 기준 `spreadScale=fit(viewport,3200×900)`×(userZoom). 좌·우 두 페이지 동일 scale(`FlipbookPageFrame fitMode="fixed"` 1600×900 고정). 페이지 내부 추가 scale 없음(만화 씬 `computeComicScale`은 레이아웃 내부만).
- **데이터 연결**: `mapViewerPage`(`flipbookPageMapper`)로 `ViewerPage[]`→`FlipbookPage` 1:1 변환(원본 불변). `renderPageSlot`→`FlipCoverPagePastel/Comic/Story/Quiz/BackCoverPagePastel`. 누락 데이터 → 파스텔 폴백/빈 면.
- 수정: `StudentComicViewerPage.tsx`(getSpreads 양면·pastelCtx/pastelPages useMemo·renderPageSlot/renderPastelModel·spread scale·북 턴 JSX·인디케이터 2면), `FlipbookPageFrame.tsx`(`fitMode:'fixed'` 추가), `flipbook-landscape-pastel.css`(`.flp-spine/.flp-blank-page/.flp-turn-face`).
- **원본 데이터 불변** ✅ (렌더 단 변환만).
- 기존 기능 보존: 이전/다음/처음/마지막, 현재 페이지(2면 범위 표시), 확대/축소/화면맞춤, 키보드, 자동넘김, 음악, 전체화면, 뒤로가기, **공유/PDF 버튼 유지**(캡처는 기존 renderFlipPage 경로 그대로).

## 4. 미수정 영역 (5A)
`SharedComicViewerPage`, 공유 저장 구조, `shared_comic_books`, PDF 생성(`renderPdfPage`/`handleDownloadPdf`), `handleShare`(캡처 흐름), Supabase DB/Storage/Edge Function — 일체 미수정. 화면만 파스텔 16:9 양면으로 교체.

## 5. 검증
- `tsc -b` ✅ exit 0 / `npm run build`(tsc+vite) ✅ exit 0.
- `getSpreads(16)` 알고리즘 ✅ (9스프레드, 표지/뒤표지 단독 확인).
- **ESLint**: `StudentComicViewerPage.tsx`에 **기존 오류 5건**(main 원본에 동일 존재 — ViewerPage `any`×2, refs-in-render×2, setState-in-effect×1). **Stage 5A로 새로 발생한 오류 0건**. (기존 오류는 별도 정리 권장.)
- **브라우저 자동 검증 제한**: 라이브 뷰어가 `RequireStudent`(Supabase 세션) 뒤라 puppeteer로 인증 불가 → 실제 학생 세션으로 수동 테스트 필요.

## 6. 수동 테스트 체크리스트 (권장)
1. 로그인 학생이 에디터/마이페이지에서 만화보기 진입 → 파스텔 양면 표지(우측) 표시.
2. 다음 버튼 → 우측 페이지가 좌측으로 넘어가며 다음 펼침(만화 1·2) 표시. 반복해 2·3 / 5·6 등.
3. 이전 버튼 → 반대로 자연스럽게 되돌아감. 처음/마지막에서 정지.
4. 빠른 연속 클릭 → 페이지 순서 꼬임 없음(입력 잠금).
5. 확대/축소/화면맞춤 → 양면이 함께 동일 비율로 확대/축소.
6. 새로고침 → 같은 작품 복구.
7. 모바일(390/430)에서도 양면 책 구조 유지(확대로 가독 확보).
8. 공유/PDF 버튼 → 기존대로 동작(캡처는 기존 디자인).
9. 데이터 일부 누락 작품 → 흰 화면 없이 폴백 표시.
10. ⚠️ **플립 3D 렌더맒**(perspective/transform 중첩) 을 실제 화면에서 확인 — 표준 붅 턴 기하로 구현했으나 자동 검증 불가.

## 7. Stage 5B 인계
- 공유 캡처: 현재 `renderPdfPage`/`handleShare`는 구 `renderFlipPage`(1400×990) 사용. 5B에서 신규 파스텔 1600×900 캡처로 전환 시 `renderPdfPage`·캡처 컨테이너·PDF 포맷(1600×900, 승인됨) 함께 갱신.
- 기존 공유 책: 이미지 베이크 → 불변. 신규 공유 책부터 파스텔.
- 임시 파일 정리(5B/6): `FlipbookLandscapePreviewPage`, `flipbookStageSampleData`, `sample-comic-scene.jpg`, `/flipbook/preview` 라우트.
- 기존 lint 오류 5건 정리(별도).
- 플립 3D 시안 최종 확인 후 perspective/책등/그림자 미세 조정 가능.
