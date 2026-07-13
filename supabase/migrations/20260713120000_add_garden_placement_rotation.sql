-- Add rotation column to garden_placements
-- 꿈의 정원 아이템별 회전 각도(도) 저장. 기존 데이터는 0도(기본값)로 채워지므로 호환성 유지.
-- x, y 컬럼은 이미 정원 캔버스 기준 비율 좌표(0~100)로 운용되고 있어 별도 변경 없음.

alter table public.garden_placements
  add column if not exists rotation numeric not null default 0;

-- 회전값은 -360 ~ 360 도 범위로 제한(앱에서 15도 단위로 조절).
alter table public.garden_placements
  drop constraint if exists garden_placements_rotation_check;
alter table public.garden_placements
  add constraint garden_placements_rotation_check check (rotation >= -360 and rotation <= 360);

-- 크기(scale)는 0.5(50%) ~ 2.0(200%) 범위 권장. 기존 check(scale > 0)를 범위 제한으로 강화.
-- 단, 기존 데이터 호환을 위해 위반 행이 있으면 제약 생성이 실패하므로 먼저 범위 밖 값을 보정한다.
update public.garden_placements
  set scale = case
    when scale < 0.5 then 0.5
    when scale > 2.0 then 2.0
    else scale
  end
  where scale < 0.5 or scale > 2.0;

alter table public.garden_placements
  drop constraint if exists garden_placements_scale_range_check;
alter table public.garden_placements
  add constraint garden_placements_scale_range_check check (scale >= 0.5 and scale <= 2.0);
