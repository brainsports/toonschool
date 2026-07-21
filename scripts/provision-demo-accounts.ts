/* eslint-disable no-console */
// 공개 체험(데모) 계정/기관/학급/샘플 데이터 1회성 프로비저닝 스크립트.
//
// 운영 Supabase 의 auth.users / profiles / organizations / classes / students 및
// 샘플 콘텐츠(mindmap, 만화, 보상, 평가, 알림)를 데모 전용으로 생성한다.
// service_role 키가 필요하므로 Claude 가 아닌 사용자가 로컬에서 실행한다.
//
// 실행:
//   1) 프로젝트 루트 .env (또는 쉘 환경변수) 에 다음 설정 (값은 절대 Git 에 커밋 금지):
//        SUPABASE_URL=https://<project>.supabase.co
//        SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
//        DEMO_STUDENT_PASSWORD=<강한비밀번호>
//        DEMO_TEACHER_PASSWORD=<강한비밀번호>
//      (이메일은 기본값 사용: demo-student@student.toonschool.local / demo.teacher@toonschool.kr)
//   2) npx tsx scripts/provision-demo-accounts.ts
//
// 안전:
//   - 멱등(재실행 안전). 동일 이메일/이름 이면 기존 레코드 재사용.
//   - 기존 운영 데이터는 건드리지 않는다(is_demo=true 인 데모 전용 행만 생성/갱신).
//   - 샘플 데이터 구성 실패는 해당 섹션만 건너뛰고 로그로 남긴다(스키마 차이 대비).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---- .env 로더(프로젝트에 dotenv 의존성이 없으므로 최소 파서) ----
try {
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const [, k, v] = m
    if (process.env[k] === undefined) {
      process.env[k] = v.replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // .env 가 없으면 이미 쉘 환경변수에 있다고 가정.
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DEMO_STUDENT_EMAIL =
  process.env.DEMO_STUDENT_EMAIL || 'demo-student@student.toonschool.local'
const DEMO_STUDENT_PASSWORD = process.env.DEMO_STUDENT_PASSWORD
const DEMO_TEACHER_EMAIL = process.env.DEMO_TEACHER_EMAIL || 'demo.teacher@toonschool.kr'
const DEMO_TEACHER_PASSWORD = process.env.DEMO_TEACHER_PASSWORD

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[FATAL] SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. (.env 또는 환경변수)')
  process.exit(1)
}
if (!DEMO_STUDENT_PASSWORD || !DEMO_TEACHER_PASSWORD) {
  console.error('[FATAL] DEMO_STUDENT_PASSWORD 와 DEMO_TEACHER_PASSWORD 를 설정하세요. (Git 커밋 금지)')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_ORG_NAME = '툰스쿨 체험기관'
const DEMO_CLASS_NAME = '체험 5학년반'

async function step<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const r = await fn()
    console.log(`[OK] ${label}`)
    return r
  } catch (e) {
    console.error(`[SKIP] ${label} -`, (e as Error).message?.slice(0, 120))
    return null
  }
}

async function getAuthUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return data?.id ?? null
}

async function ensureAuthUser(email: string, password: string, name: string, role: 'student' | 'teacher'): Promise<string> {
  const existing = await getAuthUserIdByEmail(email)
  if (existing) {
    // 기존 사용자 재사용 시 비밀번호를 전달된 값으로 동기화.
    // 프로비저닝 재실행해도 auth 비밀번호와 Supabase Secret(DEMO_*_PASSWORD)이 항상 일치하도록 보장.
    const { error: updErr } = await admin.auth.admin.updateUserById(existing, { password })
    if (updErr) throw new Error(`비밀번호 동기화 실패(${email}): ${updErr.message}`)
    return existing
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (error || !data.user) {
    throw new Error(`createUser 실패(${email}): ${error?.message ?? 'unknown'}`)
  }
  return data.user.id
}

async function main() {
  console.log('== 데모 계정 프로비저닝 시작 ==')

  // 1) 데모 기관
  let orgId: string
  const { data: orgRow } = await admin
    .from('organizations')
    .select('id')
    .eq('name', DEMO_ORG_NAME)
    .eq('is_demo', true)
    .maybeSingle()
  if (orgRow?.id) {
    orgId = orgRow.id
    console.log(`[OK] 데모 기관 재사용: ${orgId}`)
  } else {
    const { data: inserted, error } = await admin
      .from('organizations')
      .insert({ name: DEMO_ORG_NAME, status: 'active', is_demo: true })
      .select('id')
      .single()
    if (error || !inserted) throw new Error(`기관 생성 실패: ${error?.message}`)
    orgId = inserted.id
    console.log(`[OK] 데모 기관 생성: ${orgId}`)
  }

  // 2) 데모 선생님 계정 + profile
  const teacherId = await ensureAuthUser(DEMO_TEACHER_EMAIL, DEMO_TEACHER_PASSWORD!, '체험선생님', 'teacher')
  const { error: teacherProfileErr } = await admin.from('profiles').upsert(
    {
      id: teacherId,
      email: DEMO_TEACHER_EMAIL,
      name: '체험선생님',
      role: 'teacher',
      status: 'active',
      plan_type: 'free',
      monthly_quota: 0,
      monthly_used: 0,
      organization_id: orgId,
      is_demo: true,
    },
    { onConflict: 'id' }
  )
  if (teacherProfileErr) throw new Error(`선생님 profile upsert 실패: ${teacherProfileErr.message}`)
  console.log(`[OK] 데모 선생님 profile: ${teacherId}`)

  // 3) 데모 학급(담당교사=데모선생님)
  let classId: string
  const { data: classRow } = await admin
    .from('classes')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', DEMO_CLASS_NAME)
    .maybeSingle()
  if (classRow?.id) {
    classId = classRow.id
    console.log(`[OK] 데모 학급 재사용: ${classId}`)
  } else {
    const { data: inserted, error } = await admin
      .from('classes')
      .insert({
        name: DEMO_CLASS_NAME,
        grade: 5,
        student_count: 1,
        teacher_id: teacherId,
        organization_id: orgId,
        status: 'active',
        is_demo: true,
      })
      .select('id')
      .single()
    if (error || !inserted) throw new Error(`학급 생성 실패: ${error?.message}`)
    classId = inserted.id
    console.log(`[OK] 데모 학급 생성: ${classId}`)
  }

  // 4) 데모 학생 계정 + profile + students 행
  const studentId = await ensureAuthUser(DEMO_STUDENT_EMAIL, DEMO_STUDENT_PASSWORD!, '체험학생', 'student')
  const { error: studentProfileErr } = await admin.from('profiles').upsert(
    {
      id: studentId,
      email: DEMO_STUDENT_EMAIL,
      name: '체험학생',
      role: 'student',
      status: 'active',
      plan_type: 'free',
      monthly_quota: 3,
      monthly_used: 0,
      organization_id: orgId,
      is_demo: true,
    },
    { onConflict: 'id' }
  )
  if (studentProfileErr) throw new Error(`학생 profile upsert 실패: ${studentProfileErr.message}`)

  const { error: studentRowErr } = await admin.from('students').upsert(
    {
      id: studentId,
      name: '체험학생',
      login_id: 'demo-student',
      class_id: classId,
      grade: '5학년',
      organization_id: orgId,
      created_by: teacherId,
      status: 'active',
      is_demo: true,
    },
    { onConflict: 'id' }
  )
  if (studentRowErr) throw new Error(`students 행 upsert 실패: ${studentRowErr.message}`)
  console.log(`[OK] 데모 학생 profile/students: ${studentId}`)

  // ===== 샘플 데이터(각 섹션 독립, 실패 시 건너뜀) =====
  console.log('== 샘플 데이터 구성 ==')

  // 샘플 1: 툰마인드(완성본)
  await step('샘플 툰마인드', async () => {
    const { data: exist } = await admin
      .from('mindmap_projects')
      .select('id')
      .eq('student_id', studentId)
      .eq('central_topic', '우리 동네에서 찾은 과학')
      .maybeSingle()
    if (exist?.id) return
    const nodes = [
      { id: 'c', text: '우리 동네에서 찾은 과학', type: 'central', x: 400, y: 300 },
      { id: 'b1', text: '모래놀이터의 비커', type: 'branch', parentId: 'c', x: 180, y: 160 },
      { id: 'b2', text: '하수구의 여과', type: 'branch', parentId: 'c', x: 620, y: 160 },
      { id: 'b3', text: '놀이터 그네의 무게', type: 'branch', parentId: 'c', x: 180, y: 460 },
      { id: 'b4', text: '가로등의 빛과 그림자', type: 'branch', parentId: 'c', x: 620, y: 460 },
    ]
    const edges = nodes.filter((n) => n.parentId).map((n) => ({ id: `e-${n.id}`, from: n.parentId, to: n.id }))
    const { error } = await admin.from('mindmap_projects').insert({
      student_id: studentId,
      organization_id: orgId,
      class_id: classId,
      student_name: '체험학생',
      title: '우리 동네 과학 탐험',
      grade: 5,
      grade_name: '5학년',
      subject: '과학',
      semester: 1,
      unit_id: 'demo-unit-1',
      unit_title: '우리 생활 속의 과학',
      central_topic: '우리 동네에서 찾은 과학',
      theme_id: 'pastel',
      layout_type: 'radial',
      status: 'completed',
      nodes,
      edges,
      is_public: false,
    })
    if (error) throw new Error(error.message)
  })

  // 샘플 2: 만화 작품(toon_projects + shared_comic_books)
  let comicId: string | null = null
  await step('샘플 만화', async () => {
    const { data: exist } = await admin
      .from('toon_projects')
      .select('id')
      .eq('student_id', studentId)
      .eq('title', '분수로 피자를 나누어요')
      .maybeSingle()
    if (exist?.id) {
      comicId = exist.id
      return
    }
    const pages = [
      { cutNumber: 1, description: '학교 운동장, 아이들이 피자를 사이에 두고 모여 있다.' },
      { cutNumber: 2, description: '선생님이 분수 모양의 피자 팬을 꺼내 보여 준다.' },
      { cutNumber: 3, description: '아이들이 피자를 1/2, 1/4 로 자르며 나눈다.' },
    ]
    const { data: proj, error: projErr } = await admin.from('toon_projects').insert({
      title: '분수로 피자를 나누어요',
      content: { cuts: pages, subject: '수학', unit: '분수' },
      user_id: studentId,
      student_id: studentId,
      status: 'published',
      is_public: true,
      summary: '운동장에서 피자를 나누며 분수의 원리를 배우는 이야기.',
    }).select('id').single()
    if (projErr || !proj) throw new Error(projErr?.message ?? 'toon_projects insert 실패')
    comicId = proj.id

    const { error: bookErr } = await admin.from('shared_comic_books').upsert({
      slug: `demo-${studentId.slice(0, 8)}`,
      project_id: comicId,
      title: '분수로 피자를 나누어요',
      subject: '수학',
      student_name: '체험학생',
      grade: '5학년',
      pages,
      is_public: true,
    }, { onConflict: 'slug' })
    if (bookErr) throw new Error(bookErr.message)
  })

  // 샘플 3: 보상 로그 + 통계 + 정원 (reward_logs 부분 유니크 인덱스는 onConflict 추론이
  //         어려워 사전 존재 확인 후 insert 하는 패턴 사용)
  await step('샘플 보상/정원', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data: attExist } = await admin.from('reward_logs')
      .select('id').eq('student_id', studentId).eq('reward_type', 'attendance').eq('reward_date', today).maybeSingle()
    if (!attExist?.id) {
      const { error: rl1 } = await admin.from('reward_logs').insert({
        student_id: studentId, reward_type: 'attendance', reward_date: today,
      })
      if (rl1) throw new Error(rl1.message)
    }
    const comicSrc = comicId ?? 'demo-comic'
    const { data: ccExist } = await admin.from('reward_logs')
      .select('id').eq('student_id', studentId).eq('reward_type', 'comic_complete').eq('source_id', comicSrc).maybeSingle()
    if (!ccExist?.id) {
      const { error: rl2 } = await admin.from('reward_logs').insert({
        student_id: studentId, reward_type: 'comic_complete', source_id: comicSrc,
      })
      if (rl2) throw new Error(rl2.message)
    }

    const { error: statErr } = await admin.from('student_reward_stats').upsert({
      student_id: studentId,
      completed_comic_count: 1,
      last_lucky_reward_count: 1,
    }, { onConflict: 'student_id' })
    if (statErr) throw new Error(statErr.message)

    const { error: gardenErr } = await admin.from('student_gardens').upsert({
      student_id: studentId,
      garden_name: '체험학생의 꿈동산',
      level: 2,
      experience: 120,
      background_code: 'default_garden',
    }, { onConflict: 'student_id' })
    if (gardenErr) throw new Error(gardenErr.message)
  })

  // 샘플 4: 득템 아이템(데모 전용 카탈로그 2종 + 보유)
  await step('샘플 득템 아이템', async () => {
    const seeds = [
      { code: 'demo-sprout', name: '체험 새싹', category: 'nature', rarity: 'common' },
      { code: 'demo-star', name: '체험 별', category: 'sky', rarity: 'uncommon' },
    ] as const
    for (const s of seeds) {
      const { data: item } = await admin.from('items').upsert({
        code: s.code, name: s.name, category: s.category, rarity: s.rarity,
        is_placeable: true, is_active: true,
      }, { onConflict: 'code' }).select('id').single()
      if (!item) continue
      const { data: owned } = await admin.from('student_items')
        .select('id')
        .eq('student_id', studentId)
        .eq('item_id', item.id)
        .eq('source_type', 'event')
        .eq('source_id', 'demo-seed')
        .maybeSingle()
      if (owned?.id) continue
      const { error: ownErr } = await admin.from('student_items').insert({
        student_id: studentId,
        item_id: item.id,
        source_type: 'event',
        source_id: 'demo-seed',
        quantity: 1,
        is_new: true,
      })
      if (ownErr) throw new Error(ownErr.message)
    }
  })

  // 샘플 5: AI 성장 평가
  await step('샘플 성장평가', async () => {
    if (!comicId) throw new Error('comic 없음')
    await admin.from('student_growth_evaluations').upsert({
      student_id: studentId,
      comic_id: comicId,
      unit_id: 'demo-unit-math',
      understanding_score: 18,
      summary_score: 16,
      expression_score: 17,
      thinking_score: 15,
      completion_score: 18,
      total_score: 84,
      strength_feedback: '어려운 분수 개념을 피자라는 친근한 예시로 아주 잘 설명했어요!',
      improvement_feedback: '마지막 컷에서 분수가 같아지는 규칙를 한 번 더 강조하면 더 완벽해요.',
    }, { onConflict: 'student_id,comic_id' })
  })

  // 샘플 6: 학생 알림 + 선생님 말씀(사전 존재 확인으로 중복 방지)
  await step('샘플 알림/말씀', async () => {
    const { data: notiExist } = await admin.from('student_notifications')
      .select('id').eq('target_key', 'demo').eq('title', '체험 환영해요!').maybeSingle()
    if (!notiExist?.id) {
      const { error } = await admin.from('student_notifications').insert({
        target_key: 'demo',
        sender_id: teacherId,
        sender_role: 'teacher',
        category: 'notice',
        title: '체험 환영해요!',
        content: '툰스쿨 체험을 시작한 것을 환영합니다. 만들기와 툰마인드를 자유롭게 둘러보세요.',
        notice_date: new Date().toISOString().slice(0, 10),
        is_published: true,
      })
      if (error) throw new Error(error.message)
    }

    const { data: msgExist } = await admin.from('teacher_messages')
      .select('id').eq('class_key', 'demo').eq('title', '체험학생에게').maybeSingle()
    if (!msgExist?.id) {
      const { error } = await admin.from('teacher_messages').insert({
        class_key: 'demo',
        teacher_id: teacherId,
        title: '체험학생에게',
        content: '오늘도 즐거운 학습 만화! 궁금한 점이 있으면 언제든 탐험해 보세요.',
        message_date: new Date().toISOString().slice(0, 10),
        is_published: true,
      })
      if (error) throw new Error(error.message)
    }
  })

  console.log('== 프로비저닝 완료 ==')
  console.log(`데모 기관: ${orgId}`)
  console.log(`데모 학급: ${classId}`)
  console.log(`데모 선생님: ${teacherId} (${DEMO_TEACHER_EMAIL})`)
  console.log(`데모 학생:   ${studentId} (${DEMO_STUDENT_EMAIL})`)
  console.log('\n다음 단계: 동일한 비밀번호를 Supabase Secret 으로 등록해야 demo-login EF 가 동작합니다.')
  console.log('  npx supabase secrets set DEMO_STUDENT_EMAIL=... DEMO_STUDENT_PASSWORD=... \\')
  console.log('    DEMO_TEACHER_EMAIL=... DEMO_TEACHER_PASSWORD=... --project-ref <ref>')
}

main().catch((e) => {
  console.error('[FATAL]', e)
  process.exit(1)
})
