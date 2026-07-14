# 03. 화면 캡처 체크리스트

> 파일명 규칙: `페이지번호-기능명-상태.png` (영문 소문자+하이픈, 공백/한글 금지).
> 저장 위치: `screenshots/originals/` (원본) → `screenshots/selected/` (선정본).
> 캡처 상태: **현재 캡처 불가**(테스트 계정/브라우저 자동화 없음). 코드로 화면 구성 확인 완료. 체크박스는 실제 촬영 시 사용.

## 공통 주의
- Chrome 1920×1080, 확대 100%, 개발자 도구/북마크/알림 닫기.
- 개인정보(이메일·로그인 ID·실제 이름) 노출 금지. 비밀번호 입력 화면 캡처 금지.
- 테스트 계정 외 타 학생/선생님 데이터 노출 금지.
- 번호/화살표를 원본에 합성 금지(PPTX 도형으로 표시).

## 페이지별 캡처 목록

### 1쪽 표지
- [ ] 01-cover-finished.png — 완성 작품 표지(브라우저 UI 없는 깨끗한 이미지)
- 필수 요소: 작품 제목. 숨김: 개인정보. 상태: 테스트 작품 완성 후 촬영.

### 2쪽 소개
- [ ] 02-intro-cover.png
- [ ] 02-intro-comic.png
- [ ] 02-intro-story.png
- [ ] 02-intro-quiz.png
- [ ] 02-intro-backcover.png

### 3쪽 시작하기
- [ ] 03-login.png — `/login?mode=student` (비밀번호 입력 전/마스킹)
- [ ] 03-mypage.png — `/student/mypage` 첫 화면
- [ ] 03-enter-editor.png — 마이페이지 `툰스쿨 에디터 입장` 버튼 강조

### 4쪽 전체 제작 과정
- [ ] 04-flow-sidebar.png — 좌측 `StudentFlowSidebar` 8단계 표시

### 5쪽 학년·학기·과목·단원 선택
- [ ] 05-unit-step1.png — 1단계(학년·학기) 선택 전
- [ ] 05-unit-step1-selected.png — 학년·학기 선택 후
- [ ] 05-unit-step2.png — 2단계(과목·대단원·중단원) 선택 전
- [ ] 05-unit-selected.png — 2단계 선택 완료
- 필수 요소: 학년(초3~초6)·학기·과목·대단원·중단원. 라우트 `/student/select-unit`.

### 6쪽 핵심어 선택
- [ ] 06-keyword-list.png — 키워드 추천 목록(최초 2개)
- [ ] 06-keyword-more.png — `키워드 2개 더 보기 ✨` 후
- [ ] 06-keyword-selected.png — 키워드 선택 상태(최대 4개)
- [ ] 06-keyword-next.png — `이 키워드로 주제 만들기 ✨` 버튼
- 라우트 `/student/topic`(키워드 서브스텝).

### 7쪽 만화 주제 만들기
- [ ] 07-topic-before.png — 주제 생성 전
- [ ] 07-topic-loading.png — 생성 중(“이야기를 만들고 있어요…”)
- [ ] 07-topic-result.png — 생성된 주제 목록(2개)
- [ ] 07-topic-more.png — `+2개 더 보기` 후
- [ ] 07-topic-selected.png — 주제 선택 완료

### 8쪽 6컷 대본 만들기
- [ ] 08-script-before.png — 대본 생성 전
- [ ] 08-script-loading.png — 생성 중(1·2단계 로딩)
- [ ] 08-script-result-01.png — 1~3컷 대본
- [ ] 08-script-result-02.png — 4~6컷 대본
- 라우트 `/student/script`.

### 9쪽 대본 수정하기
- [ ] 09-script-edit-before.png — 수정 전
- [ ] 09-script-cut-edit.png — `컷 편집` 탭
- [ ] 09-script-key-concept.png — `핵심 개념` 탭(3개)
- [ ] 09-script-cover-dialogue.png — `표지 대화` 탭(하나/도윤/서아)
- [ ] 09-script-next.png — `표지만들기` 버튼

### 10쪽 표지 만들기
- [ ] 10-cover-editor.png — 표지 캔버스 편집 화면
- [ ] 10-cover-complete.png — `표지 만들기` 완성 상태
- [ ] 10-cover-next.png — `만화 만들기` 버튼
- 라우트 `/student/front-cover`.

### 11쪽 만화 제작 화면 알아보기
- [ ] 11-comic-full.png — 만화제작 전체 화면(2×3 그리드)
- 필수 요소: 세로 도구바(선택/캐릭터/대사/말풍선/배경/레이어), 캔버스, 줌 컨트롤. 라우트 `/student/comic/full`.

### 12쪽 배경과 장면 만들기
- [ ] 12-bg-before.png — 배경 생성 전(빈 컷)
- [ ] 12-bg-generating.png — `배경 모두 생성` 진행 중
- [ ] 12-bg-done.png — 6컷 배경 완료
- [ ] 12-bg-edit.png — `수정한 설명으로 다시 만들기`(컷당 1회)

### 13쪽 등장인물 넣기
- [ ] 13-char-panel.png — `캐릭터` 도구 패널
- [ ] 13-char-placed.png — 캐릭터 배치/선택 상태
- [ ] 13-char-resize.png — 위치·크기 조절

### 14쪽 말풍선과 글 넣기
- [ ] 14-bubble-panel.png — `말풍선` 도구
- [ ] 14-bubble-added.png — 말풍선 추가 + 대사 입력
- [ ] 14-bubble-resize.png — 위치·크기 조절
- [ ] 14-dialogue-gen.png — `대사 생성` 결과(선택)

### 15쪽 6컷 만화 완성하기
- [ ] 15-comic-6cuts.png — 6컷 전체 완성 화면
- [ ] 15-comic-next.png — `단원 정리 →` 버튼
- 필수: `${completedCount}/6 완료` 표시.

### 16쪽 세상 속 이야기 만들기
- [ ] 16-story-before.png — 세상 속 이야기 생성 전
- [ ] 16-story-loading.png — 생성 중
- [ ] 16-story-result.png — 결과(역사/최신/생활연결 탭)
- [ ] 16-story-life-tab.png — `생활 연결` 탭
- [ ] 16-story-complete.png — `세상 속 이야기 완료`
- 라우트 `/student/unit-summary`.

### 17쪽 OX 퀴즈 만들기
- [ ] 17-ox-before.png — `OX 문제 만들기` 전
- [ ] 17-ox-generated.png — 5문제 생성 결과
- [ ] 17-ox-edit.png — 문제 텍스트 편집 + O/X 정답 토글
- [ ] 17-ox-complete.png — `OX 문제 완료`

### 18쪽 뒤표지와 작품 완성
- [ ] 18-backcover-form.png — 뒤표지 설정(지은이/학년반/과목/단원/주제/만든 날짜)
- [ ] 18-backcover-color.png — 과목별 배경색 + 투명도
- [ ] 18-backcover-next.png — `만화 보기 🖼️` 버튼
- 라우트 `/student/back-cover`.

### 19쪽 작품 보기·공유·문제 해결
- [ ] 19-viewer-start.png — 만화보기 `책 펼치기` 오버레이
- [ ] 19-viewer-flip.png — 플립북 넘기기 화면
- [ ] 19-share-button.png — `친구에게 자랑하기` 버튼
- [ ] 19-share-modal.png — 공유 링크 모달(`링크 복사하기`)
- [ ] 19-mypage-works.png — 마이페이지 작품 목록
- [ ] 19-shared-book.png — `/book/:slug` 공유 열람 화면
- 라우트 `/student/comic/read`, `/student/mypage`, `/book/:slug`.

### 20쪽 마지막 페이지
- [ ] 20-final-cover.png — 완성 작품 표지
- [ ] 20-final-flip.png — 플립북 펼침 화면

## 촬영 가능 여부 요약
- 전체: **현재 캡처 불가**(테스트 계정·브라우저 자동화 부재). 코드로 화면 요소 확인 완료.
- 실제 촬영 시 `04-browser-capture-procedure.md` 절차 따를 것.
