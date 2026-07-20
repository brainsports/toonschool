# 만화 생성 횟수 제한 + 학년별 기본학급 — 운영 적용 및 통합 가이드

이 문서는 `feat/comic-quota-system` 브랜치에 추가된 만화 생성 횟수 제한 시스템과 학년별 기본학급 기능의 **운영 적용 절차**와 **기존 화면 통합 체크리스트**를 다룹니다.

## 0. 현재 구현 상태

이미 main에 병합된 부분(인프라 + 독립 컴포넌트):
- `supabase/migrations/20260720120000_create_comic_quota_system.sql` — DB 스키마 + RLS + RPC(모두 additive/idempotent)
- `src/shared/lib/comicQuota.ts` — RPC 클라이언트 래퍼 + 타입 + feature flag
- `src/modules/admin-lms/components/ClassGenerationSettingModal.tsx` — 학급 만화생성 설정 모달

아직 통합되지 않은 부분(아래 체크리스트):
- 만화 생성 화면의 예약/완료/해제 연동
- 학급관리/학생관리/개별등록/대량업로드 UI 진입점

**안전성**: 모든 신규 동작은 `VITE_COMIC_QUOTA_ENABLED` feature flag 뒤에 있고 기본값이 `false`입니다. 운영에 반영해도 flag가 꺼져 있으면 기존 동작이 100% 유지됩니다.

## 1. 운영 적용 절차 (사용자 직접 수행)

이 환경에는 Supabase CLI 자격증명이 없어 자동 적용이 불가합니다. 아래 순서로 적용합니다.

### 1-1. DB 마이그레이션 적용
```bash
# Supabase CLI 사용 시
npx supabase db push --project-ref vcxqutyuwsiiwdrwbrwx

# 또는 Supabase Dashboard → SQL Editor 에서
# supabase/migrations/20260720120000_create_comic_quota_system.sql 파일 내용을 그대로 실행.
```
- 모든 구문이 `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `CREATE OR REPLACE` 이므로 재실행해도 안전합니다.
- 적용 전 `classes`/`students`/`profiles` 테이블이 운영에 존재하는지 먼저 확인(대시보드).

### 1-2. feature flag 활성화 (Vercel)
Vercel 프로젝트 환경변수에 추가:
```
VITE_COMIC_QUOTA_ENABLED=true
```
재배포 후에만 반영됩니다. flag가 없거나 `false`면 신규 기능이 모두 비활성 상태로 기존 동작을 유지합니다.

### 1-3. 검증
1. Supabase Dashboard → SQL Editor:
   ```sql
   SELECT public.get_student_quota_status('<student-uuid>');
   ```
   `final_limit`, `completed`, `reserved`, `remaining` 이 JSON으로 반환되면 정상.
2. `classes` 테이블에 `is_default`, `default_grade` 컬럼이 추가되었는지 확인.

## 2. 기존 미배정 학생 backfill (선택, 적용 전 검토)

학급이 배정되지 않은 기존 학생을 학년 기준 기본학급으로 이동합니다. **학년 정보가 없는 학생은 제외**하고 별도 검토 대상으로 남깁니다.

```sql
-- 검토용(읽기 전용): backfill 대상과 제외 대상 미리 보기
SELECT id, name, login_id, grade, class_id, created_by
FROM public.students
WHERE (class_id IS NULL OR class_id NOT IN (SELECT id FROM public.classes))
  AND status = 'active';

-- 학년이 정상("N학년" 형식)인 학생만 기본학급으로 배정
-- (반드시 위 검토 쿼리로 확인한 뒤 수동 실행)
DO $$
DECLARE r RECORD; v_grade int; v_class uuid;
BEGIN
  FOR r IN SELECT id, grade, created_by FROM public.students
           WHERE (class_id IS NULL) AND status = 'active' LOOP
    BEGIN
      v_grade := substring(r.grade from '([0-9]+)')::int;
      IF v_grade BETWEEN 1 AND 6 AND r.created_by IS NOT NULL THEN
        SELECT public.get_or_create_default_class(r.created_by, v_grade) ->> 'class_id' INTO v_class;
        IF v_class IS NOT NULL THEN
          UPDATE public.students SET class_id = v_class::uuid WHERE id = r.id;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- 학년 파싱 실패 등: 임의 배정하지 않고 건너뜀(검토 대상 유지)
      NULL;
    END;
  END LOOP;
END $$;
```

## 3. 월 변경 처리 (cron 불필요)

- 완료/예약 집계는 `get_student_quota_status` RPC가 호출 시점 한국 시간(KST) 연/월로 lazy 계산합니다.
- 새 달이 되면 자동으로 0부터 집계됩니다. `pg_cron`이 필요하지 않습니다.
- `this_month` 추가 횟수는 `extra_applied_year/month`와 현재 월을 비교해 자동 만료됩니다.
- 이전 달에 `reserved`로 남은 작업은 `release_stale_reservations()` RPC(관리자/교사 호출)로 정리합니다. 학생관리 "예약 해제" 버튼에서 호출(통합 체크리스트 4-F 참조).

## 4. 기존 화면 통합 체크리스트 (각 파일 수정 지점 + 스니펫)

> feature flag 게이트를 각 진입점에 두어, flag가 꺼져 있으면 기존 동작을 유지합니다.

### 4-A. 만화 생성 시작 — 예약 (`src/modules/student/pages/StudentComicFullViewPage.tsx`)

`handleGenerateAll`(약 line 647) 시작 부분, 6컷 생성을 시작하기 **전**에 예약.

```tsx
import { reserveComicGeneration, isQuotaError, COMIC_QUOTA_ENABLED } from '../../../shared/lib/comicQuota';

// handleGenerateAll 맨 앞
if (COMIC_QUOTA_ENABLED) {
  const r = await reserveComicGeneration({
    studentId: user.id,            // 현재 로그인 학생 id
    comicId: projectData.projectId,
    classId: /* 현재 class_id */,
    teacherId: /* created_by */,
  });
  if (isQuotaError(r)) {
    alert(r.message);              // "이번 달 횟수를 모두 사용했어요..."
    return;
  }
}
```
- 안내 문구(섹션 9): 생성 버튼 근처에 `이번 달 {completed}회 사용 · 생성 중 {reserved}회 · {remaining}회 남음` 표시(`getStudentQuotaStatus`).
- 버튼 라벨: `6컷 만화 만들기 · 1회 사용 예정`.
- 안내: `6컷 만화가 공유 가능한 완성 만화책으로 저장되면 생성 횟수 1회가 사용돼요.`

### 4-B. 완성 만화책 저장 — 완료 확정 (`src/modules/student/pages/StudentBackCoverPage.tsx`)

`saveBackCoverData(true)` 호출 뒤(만화보기 이동 직전), `grantCompletionRewardAfterBackCoverSave` 근처에:

```tsx
import { confirmComicCompletion, COMIC_QUOTA_ENABLED } from '../../../shared/lib/comicQuota';

if (COMIC_QUOTA_ENABLED) {
  await confirmComicCompletion({ studentId: user.id, comicId: projectId });
}
```
- 완료 판정 기준(섹션 10): 6컷 이미지·대사 + 작품 레코드 + 만화보기 페이지 데이터가 모두 갖춰진 뒤표지 저장 시점이므로 이 지점이 정책상 "1회 사용 확정" 시점.
- 성공 안내: `공유 가능한 만화책이 완성되어 1회가 사용되었어요. 이번 달 N회 남았어요.`

### 4-C. 생성 실패 — 예약 해제

`handleGenerateAll`의 catch / 6컷 일부 실패 분기에서:
```tsx
if (COMIC_QUOTA_ENABLED) {
  await releaseComicReservation({ studentId: user.id, comicId: projectId, reason: 'generation_failed' });
  alert('만화책이 정상 완성되지 않아 생성 횟수는 사용되지 않았어요.');
}
```
- 정책(섹션 1): 중간 단계 실패 시 예약 해제, 차감 없음.

### 4-D. 학급관리 — 설정 모달 진입점 (`src/modules/admin-lms/pages/ClassManagementPage.tsx`)

학급 행의 관리 버튼 영역(현재 "단원 설정"/"학급 삭제" 버튼이 있는 위치, 약 line 257)에 "만화 생성 설정" 버튼 추가:
```tsx
import ClassGenerationSettingModal from '../components/ClassGenerationSettingModal';

// state
const [quotaClass, setQuotaClass] = useState<{id:string;name:string;grade:number}|null>(null);

// 버튼(기본학급 행에도 표시, 삭제 버튼은 기본학급이면 숨김)
<button onClick={() => setQuotaClass({ id: cls.id, name: cls.name, grade: cls.grade })}>
  만화 생성 설정
</button>
{cls.isDefault && <span style={{...}}>기본학급 · 삭제 불가</span>}
{!cls.isDefault && <button onClick={() => handleDelete(cls.id)}>학급 삭제</button>}

// 모달
{quotaClass && (
  <ClassGenerationSettingModal
    open classId={quotaClass.id} className={quotaClass.name} grade={quotaClass.grade}
    onClose={() => setQuotaClass(null)} onSaved={reload} />
)}
```
- 학급 목록 행에 설정 요약 배지(예 `주 2회 · 월 8회`) 표시: `getClassQuotaSummary(classId)`.
- `classService.fetchClassesByTeacher` 반환에 `is_default` 포함하도록 select 에 `is_default,default_grade` 추가.

### 4-E. 개별 학생 등록 — 학년 필수 + 학급 안내 (`src/modules/admin-lms/components/CreateStudentModal.tsx`)

- 학년 select를 **필수**로 변경(현재는 학급에서 자동 유도).
- 학급 미선택 시 안내: `학급을 선택하지 않으면 {grade}학년 기본학급에 자동 배정됩니다.`
- 저장 시 classId가 비어 있으면 `assignStudentToDefaultClass({ studentId, grade })` 호출(생성 직후).

### 4-F. 학생관리 — 사용량/복구 (`src/modules/admin-lms/pages/StudentManagementPage.tsx`)

목록 컬럼(현재 번호/이름/아이디/비밀번호/관리)에 추가(feature flag 시):
- 학년 · 현재 학급 · 학급 기본 한도 · 학급 추가 · 학생 개별 추가 · 이번 달 완료 · 생성 중 예약 · 남은 · 상태
- 관리 기능: 학급 이동(실제 DB update — 현재 MOCK이므로 `UPDATE students SET class_id` 적용), 학생별 추가 횟수(`saveStudentQuotaOverride`), 예약 해제(`releaseStaleReservations`), 횟수 1회 복원(`restoreComicQuota`, 사유 필수).

### 4-G. 대량 업로드 — 학급명 매칭 + 기본학급 (`src/modules/admin-lms/pages/StudentManagementPage.tsx`)

`handleFileUpload`/`handleBulkUpload` 확장:
- 필수 열: 학생명, 학년, 아이디, 비밀번호(현재 비밀번호 1234 고정 → 양식에 비밀번호 열 추가 권장).
- 선택 열: 학급명.
- 학급명 빈칸 → 해당 학년 기본학급 자동 배정(`getOrCreateDefaultClass` + `assignStudentToDefaultClass`).
- 기존 학급명 입력 → 해당 학급 배정(교사 소유 학급만).
- 존재하지 않는 학급명 / 학년-학급 학년 불일치 → 오류 행.
- 미리보기 상태: 정상 등록 / 기본학급 자동 배정 / 존재하지 않는 학급 / 필수값 누락 / 아이디 중복 / 학년 불일치.
- 학년 없는 행은 임의 배정하지 않고 오류(검토 대상).

## 5. 오류 복구와 감사(섹션 11)

- 상태는 `comic_usage_records.status`(`reserved/completed/released/restored`)로 추적.
- 복구 액션은 모두 `quota_audit_logs`에 기록(대상 학생, 작품, before/after, 처리자, 시각, 사유).
- 선생님 화면에서 상태 배지 + "예약 해제 / 횟수 복원 / 공유 상태 복구" 버튼(통합 체크리스트 4-F).

## 6. 롤백

- Vercel 환경변수 `VITE_COMIC_QUOTA_ENABLED=false` → 기존 동작 즉시 복구(코드/DB는 그대로 두어도 무해).
- DB는 additive만 사용했으므로 롤백 마이그레이션 불필요. 테이블 삭제가 필요하면 명시적 DROP 필요(운영 데이터 백업 후).
