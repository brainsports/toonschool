# Stage 4 완료 보고 — 세상 속 이야기·OX 퀴즈·뒤표지 파스텔

> 브랜치 `feat/flipbook-landscape-pastel-16-9` / Stage1 `24f7611` / Stage2 `8cae4b8` / Stage3 `f957a13` / 2026-07-15
> 검증 산출물 `reports/flipbook-stage4/`(PNG/JSON, 대용량이라 미커밋). 조사: `stage4-research.md`.

## 1. 기존 운영 데이터 구조 (stage4-research.md 요약)
- 스토리: `WorldStory{type:'history'|'latest'|'life', title, content}`. 이미지 필드 없음, 본문 단일 문자열. 저장 `toonschool:summary` stories.
- 퀴즈: `OXQuestion{id, answer:'O'|'X', question}`. 5문항, 힌트/해설 필드 없음(해설은 빌더 프리셋). 저장 `toonschool:summary` questions.
- 뒤표지 객체: `{authorName, gradeClassInfo, subjectName, unitName, topicTitle, createdDate, ...}`. 핵심3/낱말/다짐/선생님한마디/다음학습 필드 없음.
- 퀴즈 정답 노출 정책(운영 FlipQuizPage): `selectedAnswer` 있어야 정답/해설 노출(선택 후 공개). pastel 동일.
- 매퍼: Stage 1 `flipbookPageMapper.ts`의 mapStory/mapQuiz/mapBackCover 재사용(중복 생성 안 함).

## 2·3. 신규·수정 파일
신규: `flipbookOxQuiz.ts`(normalizeOxAnswer), `pages/FlipStoryPagePastel.tsx`, `pages/FlipQuizPagePastel.tsx`, `pages/FlipBackCoverPagePastel.tsx`.
수정: `flipbookPageMapper.ts`(mapQuiz 정답 정규화 적용), `flipbook-landscape-pastel.css`(.flp-story/.flp-quiz/.flp-back 추가), `flipbookStageSampleData.ts`(스토리3/퀴즈5/뒤표지 샘플), `FlipbookLandscapePreviewPage.tsx`(전체 탭+?page=+?reveal=1+퀴즈 상태).
미수정(보호): `FlipStoryPage.tsx`/`FlipQuizPage.tsx`/`FlipBackCoverPage.tsx`(운영), 라이브 뷰어, DB.

## 4. 스토리 매핑
`WorldStory` → `FlipbookStoryPage{category,categoryLabel,title,body,facts,reflection,...}`. category→3종 표시, facts=본문 문장 분할(최대3), reflection=프리셋. 좌측(배지/3종/목적/안내) + 우측(제목/이미지폴백/본문/사실1-3/생각한줄).

## 5. 퀴즈 매핑
`OXQuestion` → `FlipbookQuizPage{quizNumber,question,answer,explanation}`. answer=`normalizeOxAnswer`(소문자/빈값→O 안전). explanation=프리셋 풀이. 정답은 선택 후 노출(운영 동일). O/X 큰 버튼, 색+문자+모양으로 구분.

## 6. 뒤표지 실제 데이터 항목
workTitle/topicTitle, studentName/authorName, className/gradeClassInfo, subject/subjectName, unit/unitName, createdAt/createdDate, keyPoints/keywords(coreConcepts). pledge/teacherMessage/nextLearning=데이터 없음→안내 placeholder(가짜값 아님). **QR·공유버튼·가짜URL 없음**(§5-4).

## 7. 빈·긴 데이터 처리
스토리: 긴 본문(story2 3문장→facts3), 이미지 없음(CSS 폴백). 퀴즈: 긴 문제(quiz2), 빈 문제(quiz4→"문제 준비 중"), 정답 소문자(quiz3 'o'→O)/빈(quiz5 ''→O) 정규화 검증. 뒤표지: 일부 정보 없으면 해당 행 숨김/placeholder.

## 8·9. 반응형 scale·위치 안정성
모든 캡처(18종)에서 t0=imgLoaded=100ms=1000ms 가 page/scale/markX/markY 완전 동일 → 크기 튐·요소 이동 없음.

| viewport | page(최초=최종) | scale |
|---|---|---|
| 1920×1080 | 1920×1080 | 1.200 |
| 1440×900 | 1440×810 | 0.900 |
| 1024×768 | 1024×576 | 0.640 |
| 390×844 | 390×219 | 0.244 |

## 10. html2canvas 1600×900
스토리1-3·퀴즈1-5·뒤표지(9) + 긴본문/긴문제/뒤표지 4뷰포트(9) = 18종 전부 `ok=true`, 1600×900.

## 11. CORS·폰트·이미지
`document.fonts.ready` 대기 후 캡처, useCORS+allowTaint. CORS 오류 없음. 스토리 이미지는 CSS 폴백(외부 URL 의존 없음). 빈 캡처 없음.

## 12. tsc·lint·build
`tsc -b` / `eslint`(신규+수정) / `npm run build` 전부 exit 0. 기존 경고(INEFFECTIVE_DYNAMIC_IMPORT, 청크 500kB)는 본 변경 무관.

## 13. 운영 플립북 미수정 확인
기존 FlipStoryPage/FlipQuizPage/FlipBackCoverPage, StudentComicViewerPage, SharedComicViewerPage, flipbook.css, DB/RLS/Storage/EF 일체 미수정.

## 14. Stage 5 정리 대상(임시)
`FlipbookLandscapePreviewPage.tsx`, `flipbookStageSampleData.ts`, `src/assets/flipbook/sample-comic-scene.jpg`, `/flipbook/preview` 라우트(router.tsx). 보고서/캡처는 reports/ 미커밋.

## 15. 남은 과제
- 라이브 뷰어(학생/공유) 신규 컴포넌트로 교체(Stage 5). PDF 16:9 전환(승인됨).
- 공유 뷰어는 이미지 베이크 → 새 디자인은 새 공유 책부터.
- 스토리 imageUrl·뒤표지 pledge/teacherMessage/nextLearning 데이터 부재(2~3차).
- crop 렌더 미적용(운영 동일), WebP 최적화.
