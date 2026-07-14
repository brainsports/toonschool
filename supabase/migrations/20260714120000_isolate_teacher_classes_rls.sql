-- ─────────────────────────────────────────────────────────────────────────────
-- 선생님별 학급·메시지 소유권 RLS 강화 (방어 계층)
-- ─────────────────────────────────────────────────────────────────────────────
-- 목적: 프런트엔드 쿼리 수준의 격리(classService.ts 에서 .eq('teacher_id', ...))에 더해
--       DB RLS 계층에서도 선생님 소유권을 검증하는 방어 정책을 추가한다.
--
-- ★ 중요 — 적용 전 반드시 확인:
--   1) 이 마이그레이션은 supabase db push 등으로 임의 적용하지 않는다(운영 DB 변경 금지).
--      충분한 검토/테스트 후 담당자가 수동 적용한다.
--   2) public.classes 테이블의 기존 RLS 정책은 대시보드에서 out-of-band 생성되어
--      추적 파일에 없다. 따라서 아래 classes 정책은 "추가(ADD)"만 수행하며,
--      기존 광범위 정책(예: authenticated 전체 SELECT)이 존재하면 이 정책들만으로
--      강제가 되지 않을 수 있다. 적용 전 아래 쿼리로 기존 정책을 점검할 것:
--        SELECT polname, cmd, qual FROM pg_policies WHERE tablename = 'classes';
--      필요 시 광범위 선생님 SELECT/UPDATE 정책을 제거한 뒤 아래 정책이 실질 강제하도록 한다.
--   3) RLS 가 classes 에서 비활성화 상태라면 정책은 무시된다. 이 경우 활성화는
--      모든 역할(teacher/org_admin/middle_admin/super_admin) 정책이 갖춰진 뒤에만 수행한다.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) teacher_messages INSERT 정책 강화:
--    기존 "auth.uid() IS NOT NULL" (소유권 미검증) -> "auth.uid() = teacher_id" (본인만 본인 이름으로 작성).
--    한 선생님이 다른 선생님 teacher_id 로 말씀을 몰래 넣는 것을 서버 단에서 차단한다.
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.teacher_messages;
CREATE POLICY "Enable insert access for authenticated users"
ON public.teacher_messages FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- 2) classes 방어 정책(추가):
--    선생님은 본인 소유 학급(teacher_id = auth.uid())만 조회/수정/삭제.
--    get_my_role() 는 20260703070000_add_middle_admin.sql 에서 사용 중인 헬퍼.
--    org_admin/middle_admin/super_admin 은 각각 기존 기관/전체 스코프 정책을 별도로 둬야 한다
--    (이 파일에서는 선생님 소유권 정책만 추가하여 기존 관리자 기능에 영향을 주지 않는다).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'classes'
    ) THEN
        -- 선생님 SELECT: 본인 소유 학급만
        EXECUTE 'CREATE POLICY "teacher select own classes"
            ON public.classes FOR SELECT
            USING (get_my_role() = ''teacher'' AND teacher_id = auth.uid());';

        -- 선생님 UPDATE: 본인 소유 학급만 (소프트 삭제 status 변경 포함)
        EXECUTE 'CREATE POLICY "teacher update own classes"
            ON public.classes FOR UPDATE
            USING (get_my_role() = ''teacher'' AND teacher_id = auth.uid());';

        -- 선생님 DELETE: 본인 소유 학급만
        EXECUTE 'CREATE POLICY "teacher delete own classes"
            ON public.classes FOR DELETE
            USING (get_my_role() = ''teacher'' AND teacher_id = auth.uid());';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 참고: teacher_id 가 NULL 인 레거시 학급 처리(백필 권장, 별도 적용)
--   신규 격리 규칙에서 teacher_id IS NULL 인 학급은 어떤 선생님에게도 보이지 않는다.
--   실제 운영 데이터에 정상 학급이지만 teacher_id 가 비어 있다면 소유 선생님을 백필해야 한다.
--   (아래는 예시이며 실행하지 않는다 — 실제 매핑 확인 후 적용)
--   UPDATE public.classes c
--     SET teacher_id = s.created_by
--     FROM students s
--     WHERE s.class_id = c.id AND c.teacher_id IS NULL AND s.created_by IS NOT NULL;
-- ─────────────────────────────────────────────────────────────────────────────
