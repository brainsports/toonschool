-- garden_placements 에 회전 각도(rotation) 컬럼을 추가한다.
-- 목적: 꿈의 정원 아이템별 회전값(도)을 DB에 저장해 새로고침 후에도 유지.
--
-- 안전성:
--  - add column if not exists / drop constraint if exists 로 멱등(여러 번 실행해도 안전).
--  - 기존 데이터는 기본값 0 으로 채워지므로 호환성 유지.
--  - x, y, scale 은 이미 운용 중이므로 건드리지 않는다.
--  - 회전값은 앱에서 -180~180 도로 정규화하므로 CHECK [-360,360] 내에 항상 만족.

alter table public.garden_placements
  add column if not exists rotation numeric not null default 0;

alter table public.garden_placements
  drop constraint if exists garden_placements_rotation_check;
alter table public.garden_placements
  add constraint garden_placements_rotation_check check (rotation >= -360 and rotation <= 360);

-- 검증용(선택 실행): 컬럼이 추가되었는지 확인.
-- select column_name, data_type, column_default, is_nullable
-- from information_schema.columns
-- where table_schema='public' and table_name='garden_placements'
-- order by ordinal_position;
