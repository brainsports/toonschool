import { supabase } from './supabase';

/**
 * 만화 생성 횟수 제한 시스템 클라이언트.
 * - feature flag 가 꺼져 있으면 모든 호출이 no-op 이거나 안전한 기본값을 반환합니다.
 * - 서버(RPC, SECURITY DEFINER)에서만 한도를 검증합니다. 프런트 값은 신뢰하지 않습니다.
 * - 월 한도는 한국 시간(KST) 기준으로 서버에서 lazy 계산합니다.
 */
export const COMIC_QUOTA_ENABLED =
  (import.meta.env.VITE_COMIC_QUOTA_ENABLED ?? 'false') === 'true';

export interface ComicQuotaStatus {
  final_limit: number;
  class_base: number;
  class_extra: number;
  student_extra: number;
  monthly_quota_override: number | null;
  has_class_setting: boolean;
  completed: number;
  reserved: number;
  remaining: number;
  year: number;
  month: number;
}

export interface ClassQuotaSummary {
  base_quota: number;
  extra_quota: number;
  extra_duration: 'this_month' | 'every_month';
  student_count: number;
  per_student_total: number;
  class_total_extra: number;
  class_grand_total: number;
  has_setting: boolean;
}

export type ExtraDuration = 'this_month' | 'every_month';

export interface QuotaError {
  error: true;
  code: string;
  message: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  QUOTA_EXCEEDED: '이번 달에 만화를 만들 수 있는 횟수를 모두 사용했어요. 선생님께 추가 횟수를 요청해 보세요.',
  FORBIDDEN: '이 작업을 수행할 권한이 없어요.',
  INVALID_ARGUMENT: '잘못된 요청이에요. 새로고침 후 다시 시도해 주세요.',
  REASON_REQUIRED: '복원 사유를 입력해 주세요.',
  CLASS_NOT_FOUND: '학급을 찾을 수 없어요.',
  STUDENT_NOT_FOUND: '학생을 찾을 수 없어요.',
  GRADE_REQUIRED: '학년 정보가 필요해요.',
  INVALID_DURATION: '적용 기간이 올바르지 않아요.',
};

function toQuotaError(code: string): QuotaError {
  return {
    error: true,
    code,
    message: ERROR_MESSAGES[code] ?? '일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
  };
}

/** RPC 에러에서 서버가 raise 한 코드를 추출 */
function extractErrorCode(err: unknown): string {
  const msg = (err as { message?: string })?.message ?? '';
  // PostgREST 는 "errorMessage" 형태로 전달. 서버 RAISE EXCEPTION 'CODE' 패턴.
  const m = msg.match(/\b(QUOTA_EXCEEDED|FORBIDDEN|INVALID_ARGUMENT|REASON_REQUIRED|CLASS_NOT_FOUND|STUDENT_NOT_FOUND|GRADE_REQUIRED|INVALID_DURATION|STALE_PROCESSING)\b/);
  return m ? m[1] : 'UNKNOWN';
}

// ---------- 학생 한도 조회 ----------
export async function getStudentQuotaStatus(studentId: string): Promise<ComicQuotaStatus | null> {
  if (!COMIC_QUOTA_ENABLED) return null;
  const { data, error } = await supabase.rpc('get_student_quota_status', { p_student_id: studentId });
  if (error) return null;
  return data as ComicQuotaStatus;
}

// ---------- 예약 (생성 시작) ----------
export async function reserveComicGeneration(args: {
  studentId: string;
  comicId: string;
  classId?: string | null;
  teacherId?: string | null;
}): Promise<{ ok: boolean; id?: string; status?: string; dedupe?: boolean } | QuotaError> {
  if (!COMIC_QUOTA_ENABLED) return { ok: true, dedupe: false, status: 'reserved' };
  const { data, error } = await supabase.rpc('reserve_comic_generation', {
    p_student_id: args.studentId,
    p_comic_id: args.comicId,
    p_class_id: args.classId ?? null,
    p_teacher_id: args.teacherId ?? null,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean; id?: string; status?: string; dedupe?: boolean };
}

// ---------- 완료 확정 (완성 만화책 저장 시점) ----------
export async function confirmComicCompletion(args: {
  studentId: string;
  comicId: string;
}): Promise<{ ok: boolean; updated: number } | QuotaError> {
  if (!COMIC_QUOTA_ENABLED) return { ok: true, updated: 0 };
  const { data, error } = await supabase.rpc('confirm_comic_completion', {
    p_student_id: args.studentId,
    p_comic_id: args.comicId,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean; updated: number };
}

// ---------- 예약 해제 (실패/취소) ----------
export async function releaseComicReservation(args: {
  studentId: string;
  comicId: string;
  reason?: string;
}): Promise<{ ok: boolean; updated: number } | QuotaError> {
  if (!COMIC_QUOTA_ENABLED) return { ok: true, updated: 0 };
  const { data, error } = await supabase.rpc('release_comic_reservation', {
    p_student_id: args.studentId,
    p_comic_id: args.comicId,
    p_reason: args.reason ?? null,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean; updated: number };
}

// ---------- 횟수 복원 (교사/관리자) ----------
export async function restoreComicQuota(args: {
  studentId: string;
  comicId: string;
  reason: string;
}): Promise<{ ok: boolean; restored_id?: string } | QuotaError> {
  const { data, error } = await supabase.rpc('restore_comic_quota', {
    p_student_id: args.studentId,
    p_comic_id: args.comicId,
    p_reason: args.reason,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean; restored_id?: string };
}

// ---------- 오래된 예약 해제 ----------
export async function releaseStaleReservations(args?: {
  studentId?: string;
  olderThanDays?: number;
}): Promise<{ ok: boolean; released: number } | QuotaError> {
  const { data, error } = await supabase.rpc('release_stale_reservations', {
    p_student_id: args?.studentId ?? null,
    p_older_than_days: args?.olderThanDays ?? 1,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean; released: number };
}

// ---------- 학급 만화생성 설정 저장 ----------
export async function saveClassGenerationSetting(args: {
  classId: string;
  baseQuota: number;
  extraQuota: number;
  extraDuration: ExtraDuration;
}): Promise<{ ok: boolean } | QuotaError> {
  const { data, error } = await supabase.rpc('save_class_generation_setting', {
    p_class_id: args.classId,
    p_base_quota: args.baseQuota,
    p_extra_quota: args.extraQuota,
    p_extra_duration: args.extraDuration,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean };
}

// ---------- 학급 설정 요약 조회 ----------
export async function getClassQuotaSummary(classId: string): Promise<ClassQuotaSummary | null> {
  const { data, error } = await supabase.rpc('get_class_quota_summary', { p_class_id: classId });
  if (error || !data) return null;
  return data as ClassQuotaSummary;
}

// ---------- 학생 개별 추가 횟수 저장 ----------
export async function saveStudentQuotaOverride(args: {
  studentId: string;
  extraQuota: number;
  extraDuration: ExtraDuration;
  reason?: string;
}): Promise<{ ok: boolean } | QuotaError> {
  const { data, error } = await supabase.rpc('save_student_quota_override', {
    p_student_id: args.studentId,
    p_extra_quota: args.extraQuota,
    p_extra_duration: args.extraDuration,
    p_reason: args.reason ?? null,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  return data as { ok: boolean };
}

// ---------- 기본학급 조회/생성 ----------
export async function getOrCreateDefaultClass(args: {
  teacherId: string;
  grade: number;
}): Promise<{ classId: string; created: boolean } | QuotaError> {
  const { data, error } = await supabase.rpc('get_or_create_default_class', {
    p_teacher_id: args.teacherId,
    p_grade: args.grade,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  const d = data as { ok: boolean; class_id: string; created: boolean };
  return { classId: d.class_id, created: d.created };
}

// ---------- 학생을 학년 기본학급에 배정 ----------
export async function assignStudentToDefaultClass(args: {
  studentId: string;
  grade: number;
}): Promise<{ classId: string } | QuotaError> {
  const { data, error } = await supabase.rpc('assign_student_to_default_class', {
    p_student_id: args.studentId,
    p_grade: args.grade,
  });
  if (error) return toQuotaError(extractErrorCode(error));
  const d = data as { ok: boolean; class_id: string };
  return { classId: d.class_id };
}

/** QuotaError 타입가드 */
export function isQuotaError(v: unknown): v is QuotaError {
  return typeof v === 'object' && v !== null && (v as QuotaError).error === true;
}

// ---------- 사용 기록 조회 (담당 교사만 — RLS 로 서버 검증) ----------
export interface UsageRecord {
  id: string;
  comic_id: string;
  generation_job_id: string | null;
  status: string;
  usage_year: number;
  usage_month: number;
  reserved_at: string | null;
  completed_at: string | null;
  released_at: string | null;
  release_reason: string | null;
  created_at: string;
  title?: string | null;
}

export async function getStudentUsageRecords(studentId: string): Promise<UsageRecord[]> {
  if (!COMIC_QUOTA_ENABLED) return [];
  const { data, error } = await supabase
    .from('comic_usage_records')
    .select('id,comic_id,generation_job_id,status,usage_year,usage_month,reserved_at,completed_at,released_at,release_reason,created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  const records = data as UsageRecord[];

  // 작품명 보강(shared_comic_books.project_id 기준, 공개 작품만)
  const comicIds = Array.from(new Set(records.map((r) => r.comic_id))).filter(Boolean);
  if (comicIds.length > 0) {
    const { data: books } = await supabase
      .from('shared_comic_books')
      .select('project_id,title')
      .in('project_id', comicIds);
    const titleMap: Record<string, string> = {};
    (books || []).forEach((b: { project_id: string; title: string }) => {
      titleMap[b.project_id] = b.title;
    });
    return records.map((r) => ({ ...r, title: titleMap[r.comic_id] || null }));
  }
  return records;
}
