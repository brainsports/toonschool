-- 2026-07-18: 김학생(dedf44a0-...)에게 잘못 일괄 지급된 레벨3 아이템 정리.
-- 원인: ensureLevelItems(레벨 도달 시 해당 레벨 아이템 전체 일괄 지급)가 김학생 LV.3 도달 시
--       레벨3 아이템 10개를 한꺼번에 student_items 에 넣고 자동 배치까지 만듦.
--       → 아이템은 보상 조건 달성 시 하나씩만 지급되어야 하므로 이 벌크 지급은 폐지(코드 제거 완료).
-- 정리 대상: 오직 김학생의 레벨3 'event' 지급 기록(source_id 'dream:item:3:%') 10행 + 그 배치.
-- 보존: 레벨1(무작위 보상 45), 레벨2(이벤트 10) 및 다른 학생/다른 레벨 데이터는 전혀 변경 안 함.
-- garden_placements.student_item_id 는 ON DELETE CASCADE 이므로 student_items 삭제 시 배치도 자동 삭제.
-- 안전장치: 트랜잭션 + 학생ID 고정 + source_type/source_id 정확 매칭.
BEGIN;

DELETE FROM public.student_items
WHERE student_id = 'dedf44a0-b9d5-4eb2-998f-e2b14208c05c'
  AND source_type = 'event'
  AND source_id LIKE 'dream:item:3:%';

COMMIT;
