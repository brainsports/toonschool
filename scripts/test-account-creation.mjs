// ============================================================================
// 계정 생성 Edge Function E2E 테스트 스크립트 (섹션 12 검증용)
// ----------------------------------------------------------------------------
// 실제 운영 계정/학생을 사용하지 않고 고유한 테스트 아이디/이메일로 4개 흐름을 검증.
// 사전 조건: 각 역할(선생님/기관관리자/수퍼관리자)의 유효한 Supabase access token 필요.
//
// 사용 예:
//   # 선생님 토큰으로 학생 1명 생성 테스트
//   ACCESS_TOKEN=eyJ... ROLE=teacher node scripts/test-account-creation.mjs
//
//   # 기관관리자 토큰으로 선생님 생성 테스트
//   ACCESS_TOKEN=eyJ... ROLE=org_admin node scripts/test-account-creation.mjs
//
//   # 수퍼관리자 토큰으로 (중간관리자/기관+기관관리자/선생님) 생성 테스트
//   ACCESS_TOKEN=eyJ... ROLE=super_admin node scripts/test-account-creation.mjs
//
// ACCESS_TOKEN 은 브라우저에서 로그인 후 개발자도구 > Application > LocalStorage 의
// sb-<project>-auth-token 에서 access_token 값을 복사해 사용한다.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'

const envFile = fs.readFileSync(path.resolve('.env'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const TOKEN = process.env.ACCESS_TOKEN
const ROLE = (process.env.ROLE || '').toLowerCase()

if (!URL || !ANON) {
  console.error('.env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 필요합니다.')
  process.exit(1)
}
if (!TOKEN || !ROLE) {
  console.error('ACCESS_TOKEN 과 ROLE 환경변수가 필요합니다. (ROLE: teacher | org_admin | super_admin)')
  process.exit(1)
}

// 실행 시각 기반 고유값(분 단위). 동일 테스트를 반복해도 중복 409 가 나지 않도록.
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)

async function callEF(name, body) {
  const res = await fetch(`${URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  })
  let parsed = null
  try { parsed = await res.json() } catch { /* non-json */ }
  return { status: res.status, body: parsed }
}

function report(title, r, expectStatus) {
  const ok = r.status === expectStatus
  console.log(`${ok ? '✅' : '❌'} [${title}] HTTP ${r.status} (기대 ${expectStatus})`)
  console.log('   본문:', JSON.stringify(r.body))
  return ok
}

async function testStudentCreation() {
  // 주의: 실제 classId/organizationId 는 호출자 토큰의 소속으로 서버가 결정한다.
  const loginId = `student-e2e-${stamp}`
  const r = await callEF('create-student', {
    loginId, name: 'E2E학생', password: '1234', grade: 3, number: 1,
  })
  report('선생님→학생 생성', r, 200)

  // 중복 아이디 409 확인(동일 loginId 재시도)
  const dup = await callEF('create-student', {
    loginId, name: 'E2E학생', password: '1234', grade: 3, number: 1,
  })
  report('학생 중복 아이디 차단(409)', dup, 409)
}

async function testTeacherCreation() {
  const email = `teacher-e2e-${stamp}@example.com`
  // example.com 은 FE validateEmail 에서 차단하지만 EF는 차단하지 않으므로 테스트 가능.
  // 실제 테스트에서는 받을 수 있는 도메인 사용 권장.
  const r = await callEF('create-teacher', {
    name: 'E2E선생님', email, password: 'test1234', license_count: 0,
  })
  report('기관관리자→선생님 생성', r, 200)

  const dup = await callEF('create-teacher', {
    name: 'E2E선생님', email, password: 'test1234', license_count: 0,
  })
  report('선생님 중복 이메일 차단(409)', dup, 409)
}

async function testMiddleAdminCreation() {
  const email = `middle-e2e-${stamp}@example.com`
  const r = await callEF('create-admin-user', {
    email, password: 'test1234', name: 'E2E중간관리자', status: 'active',
    licenseTotal: 0,
  })
  report('수퍼관리자→중간관리자 생성', r, 200)
}

async function testOrganizationCreation() {
  const email = `orgadmin-e2e-${stamp}@example.com`
  const r = await callEF('create-organization', {
    name: `E2E기관-${stamp}`,
    adminName: 'E2E기관관리자',
    adminEmail: email,
    adminPassword: 'test1234',
    totalLicenses: 0,
  })
  report('수퍼관리자→기관+기관관리자 생성', r, 200)
}

;(async () => {
  console.log(`\n=== 계정 생성 E2E 테스트 (role=${ROLE}, stamp=${stamp}) ===\n`)
  if (ROLE === 'teacher' || ROLE === 'org_admin') {
    await testStudentCreation()
  }
  if (ROLE === 'org_admin' || ROLE === 'super_admin') {
    await testTeacherCreation()
  }
  if (ROLE === 'super_admin') {
    await testMiddleAdminCreation()
    await testOrganizationCreation()
  }
  console.log('\n=== 완료. 생성된 테스트 계정은 사용자 승인 후 별도 삭제하세요. ===\n')
})().catch(e => { console.error(e); process.exit(1) })
