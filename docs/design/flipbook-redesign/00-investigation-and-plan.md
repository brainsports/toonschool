# 툰스쿨뷰 플립북 디자인 개선 — 조사 및 개선 계획(구현 전)

> 본 문서는 **구현 전** 조사·계획서입니다. 서비스 코드 수정 전, 예상 결과 이미지와 함께
> 승인을 받기 위한 참고 자료입니다. 승인 전까지 코드/빌드/Git/배포 변경 없음.

## 0. 참고
- 요청에 언급된 “툰스쿨뷰 플립북 디자인 개선안” **이미지가 실제로 수신되지 않았습니다.**
  본 조사는 코드 + 공개 화면(`https://toonschool.kr/book/9zm7bn`) 기준입니다. 이미지 재전송 시 반영.

---

## 1. 아키텍처 핵심 (가장 중요한 발견)

**공개 페이지(`/book/:slug`)는 페이지를 “그림(이미지)”으로 보여줍니다.**

- `SharedComicViewerPage.tsx` 의 `renderPage()`는 사실상 `<img src={page.imageUrl}>` 한 줄입니다.
- 그 이미지는 학생이 **공유(자랑하기)할 때** `StudentComicViewerPage.tsx`의 `handleShare()`가
  숨겨진 캡처 컨테이너(`renderPdfPage`)를 `html2canvas`로 찍어 Supabase Storage 에 업로드한 결과입니다.
- 저장 데이터: `shared_comic_books.pages = [{ pageNumber, type, imageUrl }]` (본문 텍스트/요소 정보는 저장되지 않음).

**의미:**
- 공개 화면에서 보이는 “내부 페이지 빈 공간 / 콘텐츠가 위에만” 문제는 **이미지 안에 이미 굽어져(baked) 있는 상태**.
- 따라서 페이지 내용물(만화 확대, 핵심 카드, 스토리·OX 재구성)을 바꾸려면 **이미지 생성부(`renderPdfPage`/`renderPage`)**를 고쳐야 하며, **새로 공유되는 책부터 반영**됩니다.
- 반면, **외부 회색 여백 / 책 크기 / 줌 / 반응형 / 컨트롤바**는 공개 뷰어에서 즉시 개선 가능 → **기존 책(9zm7bn 포함)에도 즉시 적용**.

## 2. 페이지 넘김 / A4 비율 / 줌 구현 위치

| 항목 | 위치 / 값 |
|---|---|
| 페이지 넘김 | 외부 라이브러리 **없음**. CSS 3D(`rotateY` + `perspective:2400px` + `pageCurl*` keyframes) 자체 구현 |
| PDF/이미지 생성 | `html2canvas` + `jspdf` (의존성 존재) |
| A4 비율(양면) | `BASE_WIDTH=1000`, `BASE_HEIGHT=707` → 반쪽 `500×707` = 1:√2(A4) |
| A4 비율(단면 캔버스) | `PageWrapper` 내부 `1400×1980` (=A4). PDF `794×1123`(A4@96dpi) |
| 화면맞춤 fit | `SCROLL_PADDING=80` 양쪽 예약 → **외부 회색 여백의 직접 원인**. 기본 줌 90% |
| 줌/전체화면 | `zoomPercent` 상태, `Ctrl+wheel`, 하단 `…`메뉴 + `StudentZoomControl`(우하단). 전체화면=Fullscreen API |
| 반응형 | `SharedComicViewerPage`에 **미디어쿼리/단일 페이지 전환 없음** → 모바일도 항상 양면(`w-1/2`) = “반쪽 크기” 문제의 원인 |

## 3. 빈 공간의 직접 원인 (수치)

`renderPdfPage`(공유 이미지 생성부) 기준:
- **만화(comic-cut)**: 프레임 높이 = `frameWidth × (44/67) ≈ 0.657`(가로형). 상단 패딩(57px)+제목+프레임(≈462px) ≈ 600px만 사용 → **1123px 중 약 480px(≈43%) 하단 공백**, 핵심 카드 없음.
- **세상 속 이야기(story-*)**: chip + 제목 + 짧은 본문만 상단 정렬, `flex` 미사용 → 하단 대량 공백.
- **OX 퀴즈**: 카드 자체는 `flex-1`이나 내용 밀도 낮음(“아래 영역을 확인해보세요!” + 정답 한 줄).
- **외부 회색**: `SCROLL_PADDING 80` + 컨테이너 `pt-8/pb-10/px-4 md:px-10` + 기본 줌 90%.

## 4. 파일 분류

### 수정 필요
- `src/modules/student/pages/SharedComicViewerPage.tsx` — 공개 뷰어. **여백·책크기·줌·반응형(단일/양면)·컨트롤바**. (기존 책에 즉시 적용)
- `src/modules/student/pages/StudentComicViewerPage.tsx` — 페이지 **내용물 레이아웃**(`renderPdfPage`/`renderPage` 동기화). (새 공유 책부터)

### 옵션/경미
- `src/modules/student/components/layout/StudentZoomControl.tsx` — 필요 시 라벨/한계치만.

### 수정 금지(유지)
- `src/modules/student/components/back-cover/SNSBackCoverPreview.tsx` (뒤표지)
- `src/modules/student/data/coverTemplates.ts` (표지 템플릿)
- `src/modules/student/services/studentUnitSummaryService.ts` (WorldStory/OXQuestion 타입 — 데이터 호환성)
- `src/app/router.tsx` (`/book/:slug` 라우트 유지)
- DB 스키마 / 마이그레이션 / RLS / Storage 경로

## 5. 위험 요소
1. `renderPdfPage`/`renderPage` 변경 시 향후 공유·PDF 이미지 외관 변화(기존 이미지와 상이). 단, **데이터 구조·링크는 동일**.
2. **A4 비율 고정값(`794×1123`, `1400×1980`) 절대 변경 금지** → 표지·뒤표지·PDF 일관성.
3. `html2canvas` 캡처 순서/히든 컨테이너 동작 유지.
4. `getSpreads`(16페이지 구성, 표지 1 + 만화 6 + 스토리 3 + OX 5 + 뒤표지 1) 로직 변경 시 넘김/번호 어긋남 위험 → **페이지 수·순서 유지**.
5. 반응형 단일/양면 전환 추가 시 flip 애니메이션·클릭 영역 재점검.

## 6. 가장 안전한 개선(2-track)
- **Track A (외관, 즉시·모든 책):** `SharedComicViewerPage`에서 `SCROLL_PADDING`↓, 컨테이너 패딩↓, 기본 줌/fit 상향, 미디어쿼리로 **태블릿 세로·모바일은 단일 페이지 / 가로는 양면 유지**, 컨트롤바(목차·줌%·화면맞춤 등) 개선. 데이터 무변경.
- **Track B (내용물, 신규 공유 책):** `StudentComicViewerPage`의 `renderPdfPage`+`renderPage`에서 만화 프레임을 flex로 페이지 높이의 **65~75%** 확대 + **“이번 장면 핵심”** 카드; 세상 속 이야기(제목·본문·관련 이미지·생각해 보기); OX(큰 문제·O/X 선택·정답·해설) 재구성. `renderPage`(실시간 미리보기)와 `renderPdfPage`(이미지) **동일 레이아웃** 유지 필수.

> 기존 책 9zm7bn 은 이미지가 Storage 에 있으므로 **Track A 만 즉시 적용**되고, 내용물 개선(Track B)은 **재공유 시** 반영됩니다. 이는 요구사항(기존 데이터/링크 유지)과 양립.

## 7. 예상 결과 이미지(목업)
`docs/design/flipbook-redesign/`
- `01-desktop-flipbook-preview.png` — PC 양면(여백 축소·책 최대화·컨트롤바)
- `02-comic-page-preview.png` — 만화(프레임 65~75% + 핵심 카드)
- `03-world-story-page-preview.png` — 세상 속 이야기(제목·본문·관련 이미지·생각해 보기)
- `04-ox-quiz-page-preview.png` — OX(큰 문제·O/X 선택·정답·해설)
- `05-mobile-single-page-preview.png` — 모바일 단일 페이지(큰 글씨·간결 바)
- 목업 소스: `mock-assets/styles.css`, `0[1-5]-*.html` (서비스 코드와 분리)
