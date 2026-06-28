# 툰스쿨 개발 가이드

## 개발 서버 실행 방법

프론트엔드 서버와 이미지 생성을 처리하는 백그라운드 Worker를 동시에 실행하려면 아래 명령어를 사용하세요.

```bash
npm run dev
```

이 명령어는 내부적으로 `concurrently`를 사용하여 다음 두 프로세스를 함께 실행합니다:
1. `vite` (프론트엔드 개발 서버)
2. `tsx src/worker/comicQueueWorker.ts` (만화 이미지 생성 큐 Worker)

### 개별 실행
만약 프론트엔드와 Worker를 별도로 실행하고 싶다면 다음 명령어를 사용하세요.

- 프론트엔드만 실행: `npm run dev:app`
- Worker만 실행: `npm run worker`

## 만화 이미지 생성 디버깅 가이드

만화제작 화면에서 이미지 생성이 `queued` 상태에 멈춰 있거나 `POLL_TIMEOUT` 에러가 발생한다면 다음을 확인하세요.

1. **Worker 실행 상태 확인**
   - 개발 서버 터미널에서 `[Worker] stage=workerStarted` 로그가 찍혀 있는지 확인합니다.
   - 만화제작 화면 상단에 붉은색 경고 메시지("이미지 생성 작업자가 실행되지 않아...")가 표시되는지 확인합니다.
   
2. **Supabase Heartbeat 및 Job 상태 확인**
   - Supabase의 `worker_heartbeats` 테이블에서 `id = 'main_worker'` 레코드의 `last_seen` 시간이 최근 30초 이내로 업데이트되고 있는지 확인합니다.
   - Supabase `generation_jobs` 테이블에서 해당 `project_id`와 `cut_number`의 Job의 `status`가 무엇인지 확인합니다.

3. **만료된 작업(Stale Jobs)**
   - Worker가 오랜 시간 꺼져 있다가 재실행되면 10분 이상 `queued`나 `processing` 상태였던 Job들은 자동으로 `failed` 처리되며, 사용자는 UI를 통해 다시 생성을 시도할 수 있습니다.
