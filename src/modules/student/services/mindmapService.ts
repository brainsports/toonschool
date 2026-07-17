/**
 * 마인드맵 서비스 계층.
 *
 * 영속 전략(운영 마이그레이션 미적용 상태에서도 로컬 검증이 끝까지 동작하도록):
 *  1차: Supabase `mindmap_projects` 테이블(운영 배포 후 정동작).
 *  폴백: 브라우저 localStorage(임시 저장/오프라인 복구 — §13 필수 기능이기도 함).
 *
 *  - 테이블이 없거나 네트워크/RLS 오류 시 자동으로 localStorage 로 전환(세션 캐싱).
 *  - 썸네일/공유 이미지는 Storage 버킷 의존을 피해 data URL 로 행에 인라인 저장.
 *  - 자동 저장은 직렬화(한 번에 한 저장) + 최신 스냅숏 우선으로, 오래된 저장이 최신
 *    내용을 덮어쓰지 않도록 한다.
 *
 *  로컬 전용 모드로 동작 중일 때는 콘솔에 명확히 안내한다(운영 호출 미검증).
 */
import { supabase } from '../../../shared/lib/supabase';
import type {
  MindmapProject,
  MindmapProjectRow,
  MindmapPublicShareRow,
  MindmapNode,
  MindmapEdge,
} from '../types/mindmap';
import {
  type AiFullMindmapResponse,
  type AiPartialMindmapResponse,
  type AiPartialRequest,
} from '../types/mindmapAi';
import { newId, autoLayout } from '../utils/mindmapEngine';
import { BRANCH_COLOR_KEYS } from '../data/mindmapConfig';
import { buildSampleMindmap, buildSamplePartial } from '../utils/mindmapSampleData';

const TABLE = 'mindmap_projects';
const VIEW = 'mindmap_public_shares';
const LS_PROJECT = (id: string) => `ts_mindmap_project_${id}`;
const LS_INDEX = (studentId: string) => `ts_mindmap_index_${studentId}`;
const LS_SHARE = (slug: string) => `ts_mindmap_share_${slug}`;

// 세션 단위 원격 가용성 캐시(한 번 실패 판정되면 로컬 전용으로 동작).
let remoteAvailableCache: boolean | null = null;
let remoteProbePromise: Promise<boolean> | null = null;

function isMissingTableError(err: unknown): boolean {
  const e = err as { message?: string; code?: string } | null;
  if (!e) return false;
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    e.code === 'PGRST106'
  );
}

async function probeRemote(): Promise<boolean> {
  if (remoteAvailableCache !== null) return remoteAvailableCache;
  if (remoteProbePromise) return remoteProbePromise;
  remoteProbePromise = (async () => {
    try {
      const { error } = await supabase.from(TABLE).select('id').limit(1);
      const avail = !error || !isMissingTableError(error);
      remoteAvailableCache = avail;
      if (!avail) {
        console.warn(
          '[mindmap] mindmap_projects 테이블이 없어 로컬(localStorage) 모드로 동작합니다. ' +
            '운영에 마이그레이션(20260719120000) 적용 후 Supabase 경로가 활성화됩니다.'
        );
      }
      return avail;
    } catch {
      remoteAvailableCache = false;
      return false;
    } finally {
      remoteProbePromise = null;
    }
  })();
  return remoteProbePromise;
}

// ---------------------------------------------------------------------------
// 행 ↔ 프로젝트 변환
// ---------------------------------------------------------------------------
export function rowToProject(row: MindmapProjectRow): MindmapProject {
  return {
    id: row.id,
    studentId: row.student_id,
    organizationId: row.organization_id,
    classId: row.class_id,
    studentName: row.student_name,
    title: row.title,
    grade: row.grade,
    gradeName: row.grade_name ?? undefined,
    subject: row.subject,
    subjectCode: row.subject_code ?? undefined,
    semester: row.semester,
    unitId: row.unit_id,
    unitTitle: row.unit_title,
    centralTopic: row.central_topic,
    themeId: row.theme_id,
    layoutType: row.layout_type,
    status: row.status,
    nodes: (row.nodes ?? []) as MindmapNode[],
    edges: (row.edges ?? []) as MindmapEdge[],
    thumbnailUrl: row.thumbnail_url,
    shareSlug: row.share_slug,
    isPublic: row.is_public,
    sharedAt: row.shared_at,
    shareRevokedAt: row.share_revoked_at,
    shareThumbnailUrl: row.share_thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

export function projectToRow(p: MindmapProject): MindmapProjectRow {
  return {
    id: p.id,
    student_id: p.studentId,
    organization_id: p.organizationId,
    class_id: p.classId,
    student_name: p.studentName,
    title: p.title,
    grade: p.grade,
    grade_name: p.gradeName ?? null,
    subject: p.subject,
    subject_code: p.subjectCode ?? null,
    semester: p.semester,
    unit_id: p.unitId,
    unit_title: p.unitTitle,
    central_topic: p.centralTopic,
    theme_id: p.themeId,
    layout_type: p.layoutType,
    status: p.status,
    nodes: p.nodes,
    edges: p.edges,
    thumbnail_url: p.thumbnailUrl,
    share_slug: p.shareSlug,
    is_public: p.isPublic,
    shared_at: p.sharedAt,
    share_revoked_at: p.shareRevokedAt,
    share_thumbnail_url: p.shareThumbnailUrl,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    version: p.version,
  };
}

// ---------------------------------------------------------------------------
// localStorage 헬퍼
// ---------------------------------------------------------------------------
function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    // 용량 초과 등: 썸네일이 너무 큰 경우 썸네일만 빼고 재시도.
    if (val && typeof val === 'object') {
      try {
        const stripped = { ...(val as Record<string, unknown>) };
        stripped.thumbnailUrl = null;
        stripped.shareThumbnailUrl = null;
        localStorage.setItem(key, JSON.stringify(stripped));
      } catch {
        /* give up silently */
      }
    }
    console.warn('[mindmap] localStorage 저장 실패', e);
  }
}

function lsSaveProject(p: MindmapProject) {
  const now = new Date().toISOString();
  const next = { ...p, updatedAt: now };
  lsSet(LS_PROJECT(p.id), next);
  // 인덱스 갱신(최신 정렬용 메타만).
  const idxKey = LS_INDEX(p.studentId);
  const idx = lsGet<Array<{ id: string; updatedAt: string; title: string; status: string; isPublic: boolean; shareSlug: string | null }>>(idxKey) || [];
  const without = idx.filter((x) => x.id !== p.id);
  without.unshift({ id: p.id, updatedAt: now, title: p.title, status: p.status, isPublic: p.isPublic, shareSlug: p.shareSlug });
  lsSet(idxKey, without.slice(0, 100));
  if (p.isPublic && p.shareSlug) {
    lsSet(LS_SHARE(p.shareSlug), toPublicShareRow(next));
  }
  return next;
}

function lsDeleteProject(id: string, studentId: string) {
  try {
    const p = lsGet<MindmapProject>(LS_PROJECT(id));
    localStorage.removeItem(LS_PROJECT(id));
    if (p?.shareSlug) localStorage.removeItem(LS_SHARE(p.shareSlug));
    const idxKey = LS_INDEX(studentId);
    const idx = lsGet<Array<{ id: string }>>(idxKey) || [];
    lsSet(idxKey, idx.filter((x) => x.id !== id));
  } catch {
    /* ignore */
  }
}

function toPublicShareRow(p: MindmapProject): MindmapPublicShareRow {
  return {
    id: p.id,
    title: p.title,
    subject: p.subject,
    unit_title: p.unitTitle,
    central_topic: p.centralTopic,
    theme_id: p.themeId,
    layout_type: p.layoutType,
    student_name: p.studentName,
    nodes: p.nodes,
    edges: p.edges,
    share_thumbnail_url: p.shareThumbnailUrl,
    created_at: p.createdAt,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
export interface CreateMindmapInput {
  studentId: string;
  organizationId?: string | null;
  classId?: string | null;
  studentName?: string | null;
  grade: number;
  gradeName?: string;
  subject: string;
  subjectCode?: string;
  semester: number;
  unitId: string;
  unitTitle: string;
  centralTopic: string;
  themeId?: string;
  title?: string;
}

export function createBlankProject(input: CreateMindmapInput): MindmapProject {
  const now = new Date().toISOString();
  const centralId = newId('central');
  const central: MindmapNode = {
    id: centralId,
    parentId: null,
    type: 'central',
    title: input.centralTopic || input.unitTitle || '중심 주제',
    description: '',
    icon: 'idea',
    shape: 'oval',
    colorKey: 'central',
    position: { x: 0, y: 0 },
    order: 0,
    collapsed: false,
    createdBy: 'student',
  };
  return {
    id: newId('proj').replace('proj_', ''),
    studentId: input.studentId,
    organizationId: input.organizationId ?? null,
    classId: input.classId ?? null,
    studentName: input.studentName ?? null,
    title: input.title || `${input.centralTopic || input.unitTitle || '마인드맵'}`,
    grade: input.grade,
    gradeName: input.gradeName,
    subject: input.subject,
    subjectCode: input.subjectCode,
    semester: input.semester,
    unitId: input.unitId,
    unitTitle: input.unitTitle,
    centralTopic: input.centralTopic,
    themeId: input.themeId || 'pastel',
    layoutType: 'radial',
    status: 'draft',
    nodes: [central],
    edges: [],
    thumbnailUrl: null,
    shareSlug: null,
    isPublic: false,
    sharedAt: null,
    shareRevokedAt: null,
    shareThumbnailUrl: null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export async function createMindmap(input: CreateMindmapInput): Promise<MindmapProject> {
  const project = createBlankProject(input);
  const remote = await probeRemote();
  if (remote) {
    try {
      const row = projectToRow(project);
      const { data, error } = await supabase.from(TABLE).insert(row).select().single();
      if (!error && data) return rowToProject(data as MindmapProjectRow);
      if (error && isMissingTableError(error)) remoteAvailableCache = false;
    } catch {
      /* fall through to local */
    }
  }
  return lsSaveProject(project);
}

export async function getMindmap(id: string): Promise<MindmapProject | null> {
  const remote = await probeRemote();
  if (remote) {
    try {
      const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
      if (!error && data) return rowToProject(data as MindmapProjectRow);
      if (error && isMissingTableError(error)) remoteAvailableCache = false;
    } catch {
      /* fall through */
    }
  }
  return lsGet<MindmapProject>(LS_PROJECT(id));
}

// 저장 직렬화: 동시에 여러 저장이 겹치지 않게.
let saveChain: Promise<MindmapProject | null> = Promise.resolve(null);

/** 최신 스냅숏을 우선 저장. 직렬화 + 버전 갱신으로 stale 덮어쓰기 방지. */
export function saveMindmap(project: MindmapProject): Promise<MindmapProject | null> {
  const run = async (): Promise<MindmapProject | null> => {
    const remote = await probeRemote();
    if (remote) {
      try {
        const row = projectToRow(project);
        const { data, error } = await supabase.from(TABLE).upsert(row).select().single();
        if (!error && data) {
          const saved = rowToProject(data as MindmapProjectRow);
          // 로컬 버퍼에도 최신본 보관(오프라인 복구).
          lsSaveProject(saved);
          return saved;
        }
        if (error && isMissingTableError(error)) remoteAvailableCache = false;
      } catch {
        /* fall through */
      }
    }
    return lsSaveProject(project);
  };
  // 체인으로 직렬화: 이전 저장이 끝난 뒤에 다음 저장 실행(최신 project 로).
  const next = saveChain.then(() => run()).catch(() => run());
  saveChain = next.catch(() => null);
  return next;
}

export interface MindmapListItem {
  id: string;
  title: string;
  subject: string;
  unitTitle: string;
  grade: number;
  status: 'draft' | 'completed';
  isPublic: boolean;
  shareSlug: string | null;
  thumbnailUrl: string | null;
  updatedAt: string;
}

export async function listMyMindmaps(studentId: string): Promise<MindmapListItem[]> {
  const remote = await probeRemote();
  const remoteItems: MindmapListItem[] = [];
  if (remote) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id,title,subject,unit_title,grade,status,is_public,share_slug,thumbnail_url,updated_at')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false });
      if (!error && data) {
        for (const r of data as Array<{
          id: string; title: string; subject: string; unit_title: string;
          grade: number; status: 'draft' | 'completed'; is_public: boolean;
          share_slug: string | null; thumbnail_url: string | null; updated_at: string;
        }>) {
          remoteItems.push({
            id: r.id, title: r.title, subject: r.subject, unitTitle: r.unit_title,
            grade: r.grade, status: r.status, isPublic: r.is_public,
            shareSlug: r.share_slug, thumbnailUrl: r.thumbnail_url, updatedAt: r.updated_at,
          });
        }
      } else if (error && isMissingTableError(error)) {
        remoteAvailableCache = false;
      }
    } catch {
      /* fall through */
    }
  }

  // 로컬 인덱스 + 상세 병합(중복 id 면 원격 우선).
  const localIdx = lsGet<Array<{ id: string; updatedAt: string; title: string; status: string; isPublic: boolean; shareSlug: string | null }>>(LS_INDEX(studentId)) || [];
  const seen = new Set(remoteItems.map((i) => i.id));
  const localItems: MindmapListItem[] = [];
  for (const meta of localIdx) {
    if (seen.has(meta.id)) continue;
    const p = lsGet<MindmapProject>(LS_PROJECT(meta.id));
    if (!p) continue;
    localItems.push({
      id: p.id, title: p.title, subject: p.subject, unitTitle: p.unitTitle, grade: p.grade,
      status: p.status, isPublic: p.isPublic, shareSlug: p.shareSlug, thumbnailUrl: p.thumbnailUrl,
      updatedAt: p.updatedAt,
    });
  }
  const merged = [...remoteItems, ...localItems];
  merged.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return merged;
}

export async function deleteMindmap(id: string, studentId: string): Promise<void> {
  const remote = await probeRemote();
  if (remote) {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error && isMissingTableError(error)) remoteAvailableCache = false;
    } catch {
      /* ignore */
    }
  }
  lsDeleteProject(id, studentId);
}

// ---------------------------------------------------------------------------
// 공유
// ---------------------------------------------------------------------------
function newShareSlug(): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(9);
    g.crypto.getRandomValues(bytes);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (const b of bytes) s += alphabet[b % alphabet.length];
    return s;
  }
  return Math.random().toString(36).slice(2, 11);
}

export async function enableShare(project: MindmapProject, shareThumbnailUrl?: string | null): Promise<MindmapProject> {
  const slug = project.shareSlug || newShareSlug();
  const now = new Date().toISOString();
  const updated: MindmapProject = {
    ...project,
    shareSlug: slug,
    isPublic: true,
    sharedAt: project.sharedAt || now,
    shareRevokedAt: null,
    shareThumbnailUrl: shareThumbnailUrl ?? project.shareThumbnailUrl ?? project.thumbnailUrl,
  };
  await saveMindmap(updated);
  return updated;
}

export async function revokeShare(project: MindmapProject): Promise<MindmapProject> {
  const now = new Date().toISOString();
  const updated: MindmapProject = {
    ...project,
    isPublic: false,
    shareRevokedAt: now,
  };
  await saveMindmap(updated);
  // 로컬 공유 사본 즉시 제거(기존 링크 차단).
  if (project.shareSlug) {
    try { localStorage.removeItem(LS_SHARE(project.shareSlug)); } catch { /* ignore */ }
  }
  return updated;
}

export async function getPublicMindmapBySlug(slug: string): Promise<MindmapPublicShareRow | null> {
  if (!slug) return null;
  const remote = await probeRemote();
  if (remote) {
    try {
      const { data, error } = await supabase
        .from(VIEW)
        .select('*')
        .eq('share_slug', slug)
        .maybeSingle();
      if (!error && data) return data as MindmapPublicShareRow;
      if (error && isMissingTableError(error)) remoteAvailableCache = false;
    } catch {
      /* fall through */
    }
  }
  // 로컬 테스트용: 내가 만든 공유 사본.
  const local = lsGet<MindmapPublicShareRow>(LS_SHARE(slug));
  return local;
}

export function buildShareUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://toonschool.kr';
  return `${origin}/mindmap/share/${slug}`;
}

// ---------------------------------------------------------------------------
// AI 생성
// ---------------------------------------------------------------------------
export interface AiCallResult<T> {
  data: T | null;
  /** true 면 실제 Edge Function 호출 성공. false 면 로컬 폴백(운영 미배포 상태). */
  live: boolean;
  code?: string;
  message?: string;
}

async function invokeEf<T>(body: unknown): Promise<AiCallResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-mindmap', {
      body: body as Record<string, unknown>,
    });
    if (error) {
      return { data: null, live: false, code: 'EF_ERROR', message: 'AI 호출 중 오류가 발생했어요.' };
    }
    const env = data as { success?: boolean; code?: string; message?: string; data?: T };
    if (!env || env.success === false) {
      return { data: null, live: false, code: env?.code || 'EF_FAILED', message: env?.message || 'AI 가 응답하지 못했어요.' };
    }
    return { data: env.data ?? null, live: true };
  } catch {
    return { data: null, live: false, code: 'EF_UNREACHABLE', message: 'AI 서버에 연결하지 못했어요.' };
  }
}

export async function generateMindmapFull(params: {
  grade?: number;
  subject?: string;
  semester?: number;
  unitTitle?: string;
  centralTopic: string;
}): Promise<AiCallResult<AiFullMindmapResponse>> {
  const res = await invokeEf<AiFullMindmapResponse>({ mode: 'full', ...params });
  if (res.data) return res;
  // 로컬 폴백: 운영 EF 미배포/도달불가. 샘플로 UI/파이프라인 검증.
  console.warn('[mindmap] generate-mindmap EF unreachable → 로컬 샘플 폴백 사용(운영 배포 후 실제 AI 적용).', res.code);
  return { data: buildSampleMindmap(params), live: false, code: res.code, message: res.message };
}

export async function generateMindmapPartial(
  req: AiPartialRequest
): Promise<AiCallResult<AiPartialMindmapResponse>> {
  const res = await invokeEf<AiPartialMindmapResponse>({ mode: 'partial', ...req });
  if (res.data) return res;
  console.warn('[mindmap] generate-mindmap EF unreachable → 로컬 샘플 폴백 사용.', res.code);
  return { data: buildSamplePartial(req), live: false, code: res.code, message: res.message };
}

// ---------------------------------------------------------------------------
// AI 응답 → 노드 변환(자동 배치 포함)
// ---------------------------------------------------------------------------
/** AI 전체 응답을 노드로 변환. central 은 기존 것 재사용 권장(있을 때). */
export function aiResponseToNodes(
  resp: AiFullMindmapResponse,
  existingCentral?: MindmapNode
): MindmapNode[] {
  const central =
    existingCentral && existingCentral.type === 'central'
      ? { ...existingCentral, title: resp.centralTopic || existingCentral.title }
      : {
          id: newId('central'),
          parentId: null,
          type: 'central' as const,
          title: resp.centralTopic || '중심 주제',
          description: '',
          icon: 'idea',
          shape: 'oval' as const,
          colorKey: 'central',
          position: { x: 0, y: 0 },
          order: 0,
          collapsed: false,
          createdBy: 'ai' as const,
        };

  const nodes: MindmapNode[] = [central];
  resp.branches.forEach((b, i) => {
    const colorKey = BRANCH_COLOR_KEYS[i % BRANCH_COLOR_KEYS.length];
    const mainId = newId('main');
    nodes.push({
      id: mainId,
      parentId: central.id,
      type: 'main',
      title: b.title,
      description: b.description,
      icon: b.icon,
      shape: 'rounded',
      colorKey,
      position: { x: 0, y: 0 },
      order: i,
      collapsed: false,
      createdBy: 'ai',
    });
    (b.children || []).forEach((c, j) => {
      nodes.push({
        id: newId('sub'),
        parentId: mainId,
        type: 'sub',
        title: c.title,
        description: c.description,
        icon: c.icon,
        shape: 'rounded',
        colorKey,
        position: { x: 0, y: 0 },
        order: j,
        collapsed: false,
        createdBy: 'ai',
      });
    });
  });

  return autoLayout(nodes);
}

