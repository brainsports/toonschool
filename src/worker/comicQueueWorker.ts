import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 환경변수 로드 로직 (개발 환경용)
function loadEnv(filename: string) {
  const envPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.replace(/\\n/gm, '\n').replace(/^"|"$/g, '');
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.replace(/^'|'$/g, '');
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv('.env');
loadEnv('.env.local');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

import { FALLBACK_IMAGE_GENERATION_MODEL } from '../config/models';
if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error('❌ 필수 환경변수가 없습니다. .env.local 파일을 확인해 주세요.');
  console.error(`  VITE_SUPABASE_URL: ${SUPABASE_URL ? '있음' : '없음'}`);
  console.error(`  VITE_SUPABASE_ANON_KEY: ${SUPABASE_KEY ? '있음' : '없음'}`);
  console.error(`  GEMINI_API_KEY: ${GEMINI_API_KEY ? '있음' : '없음'}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 동시에 처리할 이미지 job 수.
// 6컷 "모든 배경 생성"이 프론트에서 동시성 제한(3)으로 enqueue되므로, 워커도 3개까지 병렬 처리.
// 429(rate limit) 발생 시 이 값을 2로 내려 조정하세요. atomic status update(.eq('status','queued'))로 다중 픽업 race는 이미 방어됨.
const MAX_CONCURRENT_IMAGE_JOBS = 3;
const RETRY_DELAYS = [10000, 20000, 40000]; // 10초, 20초, 40초

let currentJobs = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Stage 로그 (API 키 / 전체 URL 절대 미출력)
// ─────────────────────────────────────────────────────────────────────────────

type WorkerStage =
  | 'workerStarted'
  | 'jobPickup'
  | 'imageApiRequest'
  | 'imageApiSuccess'
  | 'imageApiFailed'
  | 'saveImageResult';

type WorkerStatus = 'start' | 'success' | 'error' | 'retry' | 'fallback';

function wLog(params: {
  stage: WorkerStage;
  status: WorkerStatus;
  jobId?: string;
  cutNumber?: number;
  model?: string;
  attempt?: number;
  elapsedMs?: number;
  httpStatus?: number;
  errorCode?: string;
  note?: string;
}) {
  const { stage, status, jobId, cutNumber, model, attempt, elapsedMs, httpStatus, errorCode, note } = params;
  const icons: Record<WorkerStatus, string> = {
    start: '⏳', success: '✅', error: '❌', retry: '🔁', fallback: '🔄'
  };
  const icon = icons[status];
  const parts: string[] = ['[Worker]', icon, `stage=${stage}`, `status=${status}`];
  if (jobId)       parts.push(`jobId=${jobId.substring(0, 8)}...`);  // jobId 앞 8자리만
  if (cutNumber !== undefined) parts.push(`cut=${cutNumber}`);
  if (model)       parts.push(`model=${model}`);
  if (attempt !== undefined)   parts.push(`attempt=${attempt}`);
  if (elapsedMs !== undefined) parts.push(`elapsed=${elapsedMs}ms`);
  if (httpStatus !== undefined) parts.push(`http=${httpStatus}`);
  if (errorCode)   parts.push(`errorCode=${errorCode}`);
  if (note)        parts.push(`note=${note}`);

  const msg = parts.join(' | ');
  if (status === 'error') {
    console.error(msg);
  } else if (status === 'retry' || status === 'fallback') {
    console.warn(msg);
  } else {
    console.log(msg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 이미지 생성 함수
// ─────────────────────────────────────────────────────────────────────────────

async function generateImageWithModel(prompt: string, model: string, jobId: string): Promise<string> {
  // URL에 키 포함되므로 절대 로그에 출력 안 함
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] }
  };

  const startMs = Date.now();
  wLog({ stage: 'imageApiRequest', status: 'start', jobId, model });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const elapsedMs = Date.now() - startMs;

  if (!response.ok) {
    const httpStatus = response.status;
    let errorCode = `HTTP_${httpStatus}`;
    if (httpStatus === 503) errorCode = 'IMAGE_503';
    else if (httpStatus === 429) errorCode = 'IMAGE_429';
    else if (httpStatus === 401 || httpStatus === 403) errorCode = 'IMAGE_AUTH';

    wLog({ stage: 'imageApiFailed', status: 'error', jobId, model, elapsedMs, httpStatus, errorCode });
    throw new Error(`Status ${httpStatus}: ${errorCode}`);
  }

  const data = await response.json();
  const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (base64Data) {
    wLog({ stage: 'imageApiSuccess', status: 'success', jobId, model, elapsedMs });
    return `data:image/jpeg;base64,${base64Data}`;
  } else {
    wLog({ stage: 'imageApiFailed', status: 'error', jobId, model, elapsedMs, errorCode: 'UNEXPECTED_FORMAT' });
    throw new Error('Unexpected response format — no inlineData');
  }
}

async function generateImage(prompt: string, jobId: string, cutNumber: number, attempt = 0): Promise<string> {
  try {
    return await generateImageWithModel(prompt, FALLBACK_IMAGE_GENERATION_MODEL, jobId);
  } catch (error: any) {
    const isRetryable =
      error.message.includes('Status 503') ||
      error.message.includes('Status 500') ||
      error.message.includes('Status 502') ||
      error.message.includes('Status 504') ||
      error.message.includes('Status 429') ||
      error.message.includes('fetch');

    if (isRetryable && attempt < 1) { // 1회 재시도 (Flash만 사용)
      wLog({
        stage: 'imageApiFailed', status: 'fallback', jobId, cutNumber,
        note: `primary(${FALLBACK_IMAGE_GENERATION_MODEL}) failed. trying fallback(${FALLBACK_IMAGE_GENERATION_MODEL})`
      });

      const delay = RETRY_DELAYS[attempt] || 10000;
      wLog({
        stage: 'imageApiFailed', status: 'retry', jobId, cutNumber,
        attempt, note: `retry after ${delay}ms`
      });
      await new Promise(r => setTimeout(r, delay));
      return generateImage(prompt, jobId, cutNumber, attempt + 1);
    }

    if (isRetryable) {
      wLog({ stage: 'imageApiFailed', status: 'error', jobId, cutNumber, errorCode: 'ALL_MODELS_FAILED' });
    }

    // 재시도 불필요 에러 (401/403/404) 거나 횟수 초과
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job 처리
// ─────────────────────────────────────────────────────────────────────────────

async function processJob(job: any) {
  const jobId = job.id as string;
  const cutNumber = job.cut_number as number;
  const startMs = Date.now();

  try {
    wLog({ stage: 'jobPickup', status: 'start', jobId, cutNumber });

    // 상태 → processing
    const startedAt = new Date().toISOString();
    await supabase.from('generation_jobs').update({ 
      status: 'processing',
      started_at: startedAt
    }).eq('id', jobId);

    const { prompt } = job.prompt_data;
    if (!prompt) {
      throw new Error('prompt_data.prompt가 없습니다.');
    }

    // 이미지 생성
    const base64Image = await generateImage(prompt, jobId, cutNumber);

    // Supabase Storage에 저장
    wLog({ stage: 'saveImageResult', status: 'start', jobId, cutNumber });
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `cuts/${job.project_id}/${cutNumber}_${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('comic_assets')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('comic_assets').getPublicUrl(fileName);

    const totalElapsed = Date.now() - startMs;
    const completedAt = new Date().toISOString();

    await supabase.from('generation_jobs').update({
      status: 'completed',
      result_url: publicUrlData.publicUrl,
      completed_at: completedAt,
      elapsed_ms: totalElapsed
    }).eq('id', jobId);

    wLog({ stage: 'saveImageResult', status: 'success', jobId, cutNumber, elapsedMs: totalElapsed });

  } catch (error: any) {
    const totalElapsed = Date.now() - startMs;
    // error.message에 Status 코드가 있으면 추출 (URL/키 제외)
    const safeMsg = error.message?.replace(/key=[^&\s]+/g, 'key=***') || '알 수 없는 오류';
    wLog({ stage: 'imageApiFailed', status: 'error', jobId, cutNumber, elapsedMs: totalElapsed, note: safeMsg });

    const completedAt = new Date().toISOString();
    await supabase.from('generation_jobs').update({
      status: 'failed',
      error_message: safeMsg,
      completed_at: completedAt,
      elapsed_ms: totalElapsed
    }).eq('id', jobId);
  } finally {
    currentJobs--;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue polling
// ─────────────────────────────────────────────────────────────────────────────

async function pollQueue() {
  if (currentJobs >= MAX_CONCURRENT_IMAGE_JOBS) {
    setTimeout(pollQueue, 2000);
    return;
  }

  const { data: jobs, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('[Worker] DB 조회 오류:', error.message);
    setTimeout(pollQueue, 5000);
    return;
  }

  if (jobs && jobs.length > 0) {
    const job = jobs[0];

    // 원자적 상태 변경으로 race condition 방지
    const { data: updateData, error: updateError } = await supabase
      .from('generation_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id)
      .eq('status', 'queued')
      .select();

    if (updateError || !updateData || updateData.length === 0) {
      setTimeout(pollQueue, 1000);
      return;
    }

    currentJobs++;
    processJob(job);
  }

  setTimeout(pollQueue, 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 상태 관리 (Heartbeat) 및 오래된 작업 초기화
// ─────────────────────────────────────────────────────────────────────────────

async function startHeartbeat() {
  const updateHeartbeat = async () => {
    try {
      await supabase.from('worker_heartbeats').upsert(
        { id: 'main_worker', last_seen: new Date().toISOString() },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.error('[Worker] Heartbeat 업데이트 실패:', err);
    }
  };

  // 시작 시 바로 1번 실행 후 30초마다 갱신
  await updateHeartbeat();
  setInterval(updateHeartbeat, 30000);
}

async function cleanupStaleJobs() {
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    // 10분 이상 queued 또는 processing 상태로 멈춘 job 실패 처리
    const { data: staleJobs, error } = await supabase
      .from('generation_jobs')
      .select('id')
      .in('status', ['queued', 'processing'])
      .lt('created_at', tenMinsAgo);

    if (error) {
      console.error('[Worker] 오래된 작업 조회 실패:', error.message);
      return;
    }

    if (staleJobs && staleJobs.length > 0) {
      wLog({ stage: 'workerStarted', status: 'fallback', note: `오래된 작업 ${staleJobs.length}건 정리 시작...` });
      for (const job of staleJobs) {
        await supabase.from('generation_jobs').update({
          status: 'failed',
          error_message: 'Worker 미실행 또는 처리 지연으로 인한 만료',
          completed_at: new Date().toISOString()
        }).eq('id', job.id);
      }
      wLog({ stage: 'workerStarted', status: 'success', note: `오래된 작업 정리 완료` });
    }
  } catch (err) {
    console.error('[Worker] 오래된 작업 정리 중 예외 발생:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 시작
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  wLog({ stage: 'workerStarted', status: 'start', note: `maxConcurrent=${MAX_CONCURRENT_IMAGE_JOBS}` });
  console.log(`[Worker] primaryImageModel=${FALLBACK_IMAGE_GENERATION_MODEL}`);
  console.log(`[Worker] fallbackImageModel=${FALLBACK_IMAGE_GENERATION_MODEL}`);
  
  await cleanupStaleJobs();
  await startHeartbeat();
  
  pollQueue();
}

main();
