# 툰스쿨 데이터베이스 및 RLS 보안 설계 요약 문서 (toonschool-db-rls-summary)

본 문서는 툰스쿨 전체의 관계형 데이터베이스(Supabase) 테이블 구조 설계와 사용자 역할별 행 단위 보안 정책(RLS, Row Level Security)의 핵심 원칙을 요약합니다.

---

## 1. 관계형 데이터베이스 테이블 설계 구조

툰스쿨의 데이터 스키마는 **계정/기관 관리 그룹**과 **작품/콘텐츠 저장 그룹**으로 이원화하여 구성됩니다.

### 1-1. 계정 및 기관 관리 스키마

#### 1) `organizations` (기관 정보 테이블)
소속 교육 기관, 학교, 방과후 센터 등의 기본 정보 및 구독 플랜 정보를 보관합니다.
*   `id` (uuid, PK): 기관 고유 식별자
*   `organization_name` (varchar): 기관 이름 (예: 한빛초등학교, 서초코딩센터)
*   `organization_type` (varchar): 기관 유형 (school, academy, center 등)
*   `owner_user_id` (uuid): 기관 대표 관리자 계정 ID
*   `phone` (varchar): 대표 연락처
*   `address` (text): 기관 주소
*   `plan` (varchar): 사용 등급 및 구독 플랜 (free, basic, premium 등)
*   `status` (varchar): 기관 상태 (active, suspended)
*   `created_at`, `updated_at` (timestamp with time zone)

#### 2) `profiles` (사용자 프로필 테이블)
Supabase Auth의 `auth.users`와 연동하여 사용자의 직책, 역할 및 소속 기관 정보를 관리합니다.
*   `id` (uuid, PK, References auth.users.id): 사용자 고유 식별자
*   `email` (varchar): 계정 이메일
*   `name` (varchar): 사용자 실명
*   `role` (varchar): 시스템 권한 역할 (`super_admin`, `org_admin`, `teacher`, `student`, `guest`)
*   `organization_id` (uuid, References organizations.id): 소속 기관 ID (외래키)
*   `status` (varchar): 계정 승인 및 활성 상태 (pending, active, blocked)
*   `created_at`, `updated_at` (timestamp with time zone)

#### 3) `students` (소속 학생 상세 테이블)
기관 소속으로 개설된 가상의 학생 로그인 ID 및 정보입니다. (이메일 가입이 제한되는 초등/중학생 환경을 지원하기 위한 내부 간편 계정 스키마)
*   `id` (uuid, PK): 학생 고유 식별자
*   `organization_id` (uuid, References organizations.id): 소속 기관 ID
*   `login_id` (varchar): 학생 로그인용 간편 ID
*   `display_name` (varchar): 학생 표시용 이름 (예: 김동민)
*   `grade_level` (integer): 학년 정보
*   `class_name` (varchar): 학급 명칭 (예: 3학년 2반)
*   `status` (varchar): 활성화 상태 (active, inactive)
*   `created_by` (uuid, References profiles.id): 학생 계정을 생성해준 교사 또는 관리자 ID
*   `created_at`, `updated_at` (timestamp with time zone)

---

### 1-2. 작품 저장 및 학습 스키마

#### 4) `learning_comics` (학습툰 기본 정보 테이블)
학생이 제작한 만화 책(Book)의 상위 메타데이터 정보를 보관합니다.
*   `id` (uuid, PK): 작품 고유 식별자
*   `organization_id` (uuid, References organizations.id): 소속 기관 ID
*   `student_id` (uuid, References students.id): 만화를 작성한 학생의 고유 ID
*   `user_id` (uuid, References profiles.id): 작성자가 프로필 계정(일반 사용자 등)인 경우 연동할 계정 ID
*   `title` (varchar): 학습툰 제목
*   `grade_id`, `subject_id`, `unit_id`, `lesson_id` (varchar): 연계된 교과 DB 매핑 정보 (학년, 과목, 대/중/소단원)
*   `topic` (text): 학습 주제
*   `key_concepts` (text[]): 핵심 개념 키워드 리스트
*   `cut_count` (integer): 컷 개수 (사용자 정책에 따라 6으로 고정)
*   `status` (varchar): 제작 상태 (`draft`, `generated`, `editing`, `published`, `archived`)
*   `visibility` (varchar): 공개 범위 정책 (`private`, `organization`, `public`)
*   `thumbnail_url` (text): 표지 썸네일 이미지 주소
*   `share_slug` (varchar, Unique): 공유용 해시 주소
*   `created_at`, `updated_at`, `published_at` (timestamp with time zone)

#### 5) `comic_panels` (6컷 장면 상세 테이블)
학습툰 한 권에 종속되는 6가지 컷의 배치 구성 정보입니다.
*   `id` (uuid, PK): 컷 고유 식별자
*   `comic_id` (uuid, References learning_comics.id, ON DELETE CASCADE): 부모 만화 ID
*   `panel_no` (integer): 1컷부터 6컷까지의 순서 번호 (1~6)
*   `scene_description` (text): 컷별 배경 및 연출 설명
*   `background_description` (text): 배경 묘사 텍스트
*   `background_image_url` (text): AI가 생성하여 스토리지에 저장한 컷별 배경 이미지 경로
*   `characters` (jsonb): 등장 캐릭터 목록 및 배치 정보 (좌표, 감정 상태 등)
*   `dialogue` (text): 컷 단위 대화 모음 (요약본)
*   `key_point` (text): 컷별 학습 요점
*   `narration` (text): 상하단 설명 나레이션 텍스트
*   `created_at`, `updated_at` (timestamp with time zone)

> [!NOTE]
> **만화 6컷 구성 가이드라인**
> *   1컷: 호기심 유발 및 일상적 문제 상황 제시
> *   2컷: 교과 핵심 개념의 자연스러운 첫 등장
> *   3컷: 핵심 개념에 대한 쉬운 설명 및 원리 이해
> *   4컷: 개념이 적용되는 실생활 예시, 실험, 탐구 상황 제시
> *   5컷: 오개념 체크 또는 확장 개념 적용
> *   6컷: 단원 요점 정리와 함께 마무리 인사

#### 6) `comic_dialogues` (컷별 대화 및 말풍선 테이블)
각 컷 내부의 인물 대화 및 말풍선 상세 위치 정보입니다.
*   `id` (uuid, PK): 말풍선 고유 ID
*   `panel_id` (uuid, References comic_panels.id, ON DELETE CASCADE): 소속 컷 ID
*   `character_id` (varchar): 등장인물 캐릭터 식별자
*   `speaker_name` (varchar): 화자 이름
*   `dialogue_text` (text): 대사 내용
*   `bubble_order` (integer): 한 컷 내부에서 말풍선이 나타나는 순서
*   `emotion` (varchar): 캐릭터의 표정 및 감정 상태
*   `created_at` (timestamp with time zone)

#### 7) `comic_quizzes` (단원 개념 퀴즈 테이블)
작품 감상 완료 후 개념 평가를 위해 AI가 자동으로 구성해주는 학습 평가 퀴즈입니다.
*   `id` (uuid, PK): 퀴즈 고유 ID
*   `comic_id` (uuid, References learning_comics.id, ON DELETE CASCADE): 연계된 만화 ID
*   `quiz_no` (integer): 퀴즈 번호 (기본 1~5)
*   `question` (text): 문제 내용
*   `quiz_type` (varchar): 문제 유형 (ox, multiple_choice, short_answer 등)
*   `options` (jsonb): 보기 리스트 (객관식인 경우 제공)
*   `answer` (text): 정답 텍스트
*   `explanation` (text): 정답 해설 및 피드백 내용
*   `difficulty` (varchar): 퀴즈 난이도 (easy, medium, hard)
*   `created_at` (timestamp with time zone)

#### 8) `comic_summaries` (요점 정리 테이블)
만화 내용을 총망라하여 정리한 요약 리포트 영역입니다.
*   `id` (uuid, PK): 요약 고유 ID
*   `comic_id` (uuid, References learning_comics.id, ON DELETE CASCADE): 연계된 만화 ID
*   `summary_text` (text): AI가 추출하고 학생이 다듬은 개념 요약글
*   `key_terms` (text[]): 핵심 용어집
*   `learning_goal` (text): 이번 차시의 최종 학습 목표 성취 기준
*   `review_note` (text): 학생이 직접 입력하는 배움 공책/느낀 점
*   `created_at` (timestamp with time zone)

#### 9) `comic_evaluations` (AI 종합 진단 평가 테이블)
발행된 작품을 기반으로 AI가 5가지 핵심 항목을 평가하여 저장하는 테이블입니다.
*   `id` (uuid, PK): 평가 고유 ID
*   `comic_id` (uuid, References learning_comics.id, ON DELETE CASCADE): 평가 대상 만화 ID
*   `student_id` (uuid, References students.id): 평가 대상 학생 ID
*   `organization_id` (uuid, References organizations.id): 소속 기관 ID
*   `understanding_score` (integer): **학습 이해도** (만점 20점)
*   `expression_score` (integer): **표현력** (만점 20점)
*   `creativity_score` (integer): **창의성** (만점 20점)
*   `completion_score` (integer): **완성도** (만점 20점)
*   `self_directed_score` (integer): **자기주도성** (만점 20점)
*   `total_score` (integer): 종합 점수 (5개 영역 총합, 만점 100점)
*   `feedback_text` (text): AI 종합 성장 피드백 코멘트
*   `evaluated_at` (timestamp with time zone)

#### 10) `comic_share_logs` (작품 공유 기록 테이블)
공유 링크를 통한 조회수 및 다운로드 횟수를 분석하기 위한 메트릭 테이블입니다.
*   `id` (uuid, PK): 로그 고유 ID
*   `comic_id` (uuid, References learning_comics.id): 공유된 만화 ID
*   `student_id` (uuid, References students.id): 공유한 주체인 학생 ID
*   `share_url` (text): 발급된 공유 경로 URL
*   `view_count` (integer): 누적 조회수
*   `pdf_download_count` (integer): 누적 PDF 다운로드 횟수
*   `last_viewed_at` (timestamp with time zone): 마지막 방문 시간
*   `created_at` (timestamp with time zone)

---

## 2. 행 단위 보안 정책 (RLS) 및 역할별 접근 통제 기준

Supabase의 RLS를 활성화하고, 다음과 같은 보안 정책(Policy)을 테이블 전체에 바인딩합니다.

### 2-1. RLS 기본 검증 컬럼 기준
모든 데이터 격리는 `organization_id`, `student_id`, `user_id`를 기반으로 세션의 역할(`role`) 값을 판별하여 적용합니다.

### 2-2. 역할별 데이터 제어 매핑

```text
1. student
   - SELECT/INSERT/UPDATE: 본인 student_id 또는 user_id와 일치하는 레코드만 허용.
   - DELETE: 오직 미발행(status = 'draft')된 본인 작품만 삭제 허용.

2. teacher
   - SELECT: 본인 소속 기관(organization_id)의 모든 학생 데이터, 작품 데이터, AI 평가 데이터를 열람 가능.
   - INSERT/UPDATE: 본인 소속 기관의 클래스 정보 및 과제 정보(assignments)에만 수정 권한 부여. 학생의 개별 만화 컷이나 평가 수치는 수정 불가 (단, 피드백 코멘트 필드는 가능).

3. org_admin
   - SELECT/INSERT/UPDATE/DELETE: 자기 기관(organization_id) 내부의 모든 테이블 데이터를 관리할 권한 부여.

4. super_admin
   - ALL (bypass RLS): RLS 검증을 우회하거나 모든 조건이 참(true)인 전역 권한을 가집니다.

5. guest
   - SELECT: 다음 조건식을 엄격하게 충족하는 'learning_comics' 및 하위 컷 정보만 열람(Read-Only)을 허용하며, 수정/삭제 시도는 즉시 차단합니다.
     (visibility = 'public' AND status = 'published')
```
