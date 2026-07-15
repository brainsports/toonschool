# Stage 3 완료 보고 — 만화 6컷 파스텔 템플릿

> 브랜치 `feat/flipbook-landscape-pastel-16-9` / Stage1 `24f7611` / Stage2 `8cae4b8` / 2026-07-15
> 검증 산출물은 `reports/flipbook-stage3/`(PNG/JSON, 대용량이라 미커밋).

## 1. 현재 브랜치와 시작 커밋
- 기능 브랜치 유지. Stage 2 위에서 누적. main 병합·push·배포 없음.

## 2. 참고 이미지 확인
- `01`(배경, Stage 2 재사용) · `03`(만화 레이아웃: 좌 30% 가이드 / 우 70% 만화). 6종 보존.

## 3. 신규·수정 파일
신규: `flipbookComicCoords.ts`(좌표 유틸), `pages/FlipComicPagePastel.tsx`, `pages/flipbookStageSampleData.ts`(미리보기 전용 임시), `src/assets/flipbook/sample-comic-scene.jpg`(미리보기 전용 임시).
수정: `FlipbookLandscapePreviewPage.tsx`(cover+만화1-6 탭, `?page=`, 측정+캡처), `flipbook-landscape-pastel.css`(`.flp-comic*` 추가).
미수정(보호): `FlipComicPage.tsx`(운영), 라이브 뷰어, DB.

## 4. 만화 1컷 우선 구현 결과
- 좌측 가이드(도입+🦋+단계설명 / 대화 내용 도윤·하나 / 핵심체크) + 우측(`1컷. 도입` 헤더 / 만화 프레임(씬 bg+캐릭터2+말풍선2) / 캡션+컷점). 시각 검증 통과.

## 5. 만화 2~6컷 확장 결과
- 동일 템플릿으로 6컷 렌더·캡처 정상.

## 6. 6단계 데이터 매핑 결과
- `cutNumber→stage` 매퍼 결과 그대로 사용(컴포넌트 내 하드코딩 없음). stage/stageDescription/sceneDescription/대사/keyPoint/caption 연동.

## 7. 기존 캐릭터·말풍선 DOM 연동
- `ComicCutElement` 1400×1025 좌표계 보존. 캐릭터 `<img object-contain>`, 말풍선 DOM(빈 말풍선 숨김, style 색/글자크기 보존, bubbleType 변형). 이미지로 굽지 않음.

## 8. 좌표 변환 방식
- `flipbookComicCoords.ts`: `SOURCE 1400×1025`, `computeComicFrameWidth=min(sw,sh·1400/1025)`, `computeComicScale=(frameW-20)/1400`. 운영 `FlipComicPage`와 동일 기준 → 요소 배치 동일. 렌더링 단에서만 변환(데이터 미수정). crop은 운영과 동일(미적용).

## 9. 이미지 누락·긴 대사 폴백
- bg 없음→placeholder. keyPoint 없음→단계별 폴백(cut5 학습목표 누락 검증). 긴 대사(cut2) 말풍선 4줄 clamp, 좌 대화 2줄 clamp. 대화 4개(cut3)·3캐릭터(cut4)·회전(cut5)·반전(cut6) 검증.

## 10. 반응형 화면 검증
- 1920/1440/1024/390 캡처 정상. 비율 유지·넘침 없음. 모바일(390)은 390×219로 축소(허용 범위).

## 11. scale 및 요소 위치 변화 검증
측정값(`.flp-page` + 첫 캐릭터/말풍선 getBoundingClientRect). **모든 시점(t0/100ms/1000ms/imgLoaded) 동일 → 변화 없음.**

| viewport | page(최초=최종) | scale | char(t0→1000ms) | bubble(t0→1000ms) | 변화 |
|---|---|---|---|---|---|
| 1920×1080 | 1920×1080 | 1.200 | (988,610)→(988,610) | (911,352)→(911,352) | 없음 |
| 1440×900 | 1440×810 | 0.900 | (741,503)→(741,503) | (683,309)→(683,309) | 없음 |
| 1024×768 | 1024×576 | 0.640 | (527,421)→(527,421) | (486,284)→(486,284) | 없음 |
| 390×844 | 390×219 | 0.244 | (201,436)→(201,436) | (185,384)→(185,384) | 없음 |

## 12. html2canvas 캡처 결과
- cut1~6 + cut1@3뷰포트 = 9종 전부 `ok=true`, 1600×900. cut1·cut6 포함. 배경/씬/캐릭터/말풍선/폰트/반투명카드 정상, CORS 오류 없음.

## 13. 참고 이미지와 구현 결과 차이
- 정합: 좌 30%/우 70% 구조, 파란 점선 프레임, 파스텔 카드, 말풍선. 차이: 실제 데이터/씬, 말풍선 테두리는 가독성 위해 짙게, 컷 진행점 추가.

## 14. 빌드·타입·린트 결과
- `tsc -b` / `eslint` / `npm run build` 전부 exit 0.

## 15. 남은 문제
- crop 렌더 미적용(운영 동일). WebP 최적화. 운영 뷰어 미교체(Stage 5). 미리보기/샘플데이터/씬은 임시(Stage 5 제거). 모바일 단일모드는 Stage 5.

## 16. 로컬 커밋 해시
- 본 Stage 3 커밋(`git log -1` 확인).

## 17. 최종 Git 상태
- 기능 브랜치 로컬만.

## 18. Stage 4 권장 작업
- 세상 속 이야기·OX 퀴즈·뒤표지 파스텔 컴포넌트(FlipStory/Quiz/BackCoverPagePastel) + 미리보기 확장.
