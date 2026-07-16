-- 레벨 2~10 꿈의 정원 아이템 시드(additive, 멱등).
-- src/modules/student/config/dreamProgressionConfig.ts 의 LEVEL_ITEM_CATALOG 와 동일한
-- code/name/category/rarity/image_url 를 갖는다. 레벨 달성 시 dreamLevelItemService 가
-- 이 아이템들을 code 로 조회해 학생에게 지급한다.
--
-- 안전 규칙:
--  - INSERT ... ON CONFLICT (code) DO UPDATE (additive, 파괴 아님).
--  - 기존 30개 레벨1 아이템은 건드리지 않는다(code 가 lv{N}_ 접두어로 겹치지 않음).
--  - category/rarity 는 기존 CHECK 제약 준수.
--  - 이 마이그레이션은 적용 전이라도 클라이언트는 안전하게 동작한다(아이템이 DB 에 없으면
--    레벨 아이템 지급을 조용히 건너뛴다). 배경/레벨/점수는 DB 와 무관하게 동작한다.

insert into public.items (code, name, category, rarity, description, image_url, is_placeable, is_active, sort_order)
values
  -- Level 2 — 별빛 정원
  ('lv2_small_flower_seed', '별빛 씨앗', 'nature', 'common', '별빛 정원에 처음 심는 씨앗이에요.', '/images/toonschool/dream-garden/items/level-2/small-flower-seed.png', true, true, 201),
  ('lv2_sparkling_grass', '반짝 별풀', 'nature', 'common', '별빛을 머금고 반짝이는 풀이에요.', '/images/toonschool/dream-garden/items/level-2/sparkling-grass.png', true, true, 202),
  ('lv2_pink_flower', '별빛 꽃', 'nature', 'common', '별빛 아래 피어난 분홍 꽃이에요.', '/images/toonschool/dream-garden/items/level-2/pink-flower.png', true, true, 203),
  ('lv2_small_star_piece', '작은 별조각', 'sky', 'common', '밤하늘에서 떨어진 별조각이에요.', '/images/toonschool/dream-garden/items/level-2/small-star-piece.png', true, true, 204),
  ('lv2_yellow_butterfly', '별빛 나비', 'animal', 'common', '별빛을 따라 날아다니는 나비예요.', '/images/toonschool/dream-garden/items/level-2/yellow-butterfly.png', true, true, 205),
  ('lv2_flower_path', '별빛 꽃길', 'decor', 'uncommon', '정원을 예쁘게 이어 주는 꽃길이에요.', '/images/toonschool/dream-garden/items/level-2/flower-path.png', true, true, 206),
  ('lv2_moonlight_mushroom', '달빛 버섯', 'nature', 'uncommon', '달빛을 머금고 빛나는 버섯이에요.', '/images/toonschool/dream-garden/items/level-2/moonlight-mushroom.png', true, true, 207),
  ('lv2_firefly', '반딧불', 'animal', 'uncommon', '어둠을 밝혀 주는 반딧불이에요.', '/images/toonschool/dream-garden/items/level-2/firefly.png', true, true, 208),
  ('lv2_waterdrop_spirit', '물방울 정령', 'spirit', 'rare', '맑은 물방울에서 태어난 정령이에요.', '/images/toonschool/dream-garden/items/level-2/waterdrop-spirit.png', true, true, 209),
  ('lv2_aurora_tree', '오로라 나무', 'nature', 'epic', '하늘빛 오로라를 품은 특별한 나무예요.', '/images/toonschool/dream-garden/items/level-2/aurora-tree.png', true, true, 210),
  -- Level 3 — 구름 도서관
  ('lv3_tiny_telescope', '작은 망원경', 'decor', 'common', '멀리 있는 것을 보게 해 주는 망원경이에요.', '/images/toonschool/dream-garden/items/level-3/tiny-telescope.png', true, true, 301),
  ('lv3_feather_quill', '깃펜', 'decor', 'common', '이야기를 적을 때 쓰는 깃펜이에요.', '/images/toonschool/dream-garden/items/level-3/feather-quill.png', true, true, 302),
  ('lv3_cloud_desk', '구름 책상', 'decor', 'common', '구름으로 만든 포근한 책상이에요.', '/images/toonschool/dream-garden/items/level-3/cloud-desk.png', true, true, 303),
  ('lv3_cloud_bookshelf', '구름 책장', 'decor', 'uncommon', '책을 가득 담은 구름 책장이에요.', '/images/toonschool/dream-garden/items/level-3/cloud-bookshelf.png', true, true, 304),
  ('lv3_magic_magnifier', '마법 돋보기', 'decor', 'uncommon', '숨겨진 것을 찾아주는 돋보기예요.', '/images/toonschool/dream-garden/items/level-3/magic-magnifier.png', true, true, 305),
  ('lv3_sky_globe', '하늘 지구본', 'sky', 'uncommon', '하늘의 모양을 담은 지구본이에요.', '/images/toonschool/dream-garden/items/level-3/sky-globe.png', true, true, 306),
  ('lv3_wisdom_bookmark', '지혜의 책갈피', 'decor', 'rare', '읽던 자리를 기억하는 책갈피예요.', '/images/toonschool/dream-garden/items/level-3/wisdom-bookmark.png', true, true, 307),
  ('lv3_flying_book', '날아다니는 책', 'spirit', 'rare', '스스로 날아다니는 신비한 책이에요.', '/images/toonschool/dream-garden/items/level-3/flying-book.png', true, true, 308),
  ('lv3_sentence_fragments', '사라진 문장', 'spirit', 'epic', '도서관에서 잃어버린 문장 조각이에요.', '/images/toonschool/dream-garden/items/level-3/sentence-fragments.png', true, true, 309),
  ('lv3_golden_book', '황금책', 'legend', 'legendary', '모든 지혜를 담은 전설의 책이에요.', '/images/toonschool/dream-garden/items/level-3/golden-book.png', true, true, 310),
  -- Level 4 — 마법숲
  ('lv4_tiny_treehouse', '작은 나무집', 'decor', 'common', '나무 위에 지은 아담한 집이에요.', '/images/toonschool/dream-garden/items/level-4/tiny-treehouse.png', true, true, 401),
  ('lv4_mushroom_lamp', '버섯 램프', 'decor', 'common', '버섯 모양의 포근한 램프예요.', '/images/toonschool/dream-garden/items/level-4/mushroom-lamp.png', true, true, 402),
  ('lv4_helping_leaf', '도움의 나뭇잎', 'nature', 'common', '친구를 돕고 싶게 만드는 나뭇잎이에요.', '/images/toonschool/dream-garden/items/level-4/helping-leaf.png', true, true, 403),
  ('lv4_flower_bridge', '꽃다리', 'decor', 'uncommon', '꽃으로 만든 예쁜 다리예요.', '/images/toonschool/dream-garden/items/level-4/flower-bridge.png', true, true, 404),
  ('lv4_forest_mailbox', '숲 우체통', 'decor', 'uncommon', '숲 친구들에게 편지를 받는 우체통이에요.', '/images/toonschool/dream-garden/items/level-4/forest-mailbox.png', true, true, 405),
  ('lv4_crystal_pond', '수정 연못', 'nature', 'uncommon', '맑은 수정빛 연못이에요.', '/images/toonschool/dream-garden/items/level-4/crystal-pond.png', true, true, 406),
  ('lv4_glowing_stone', '빛나는 돌', 'nature', 'rare', '어둠 속에서도 빛나는 돌이에요.', '/images/toonschool/dream-garden/items/level-4/glowing-stone.png', true, true, 407),
  ('lv4_fox_spirit', '여우 정령', 'spirit', 'rare', '숲을 지켜 주는 여우 정령이에요.', '/images/toonschool/dream-garden/items/level-4/fox-spirit.png', true, true, 408),
  ('lv4_wisdom_tree', '지혜의 나무', 'nature', 'epic', '오래된 지혜를 품은 나무예요.', '/images/toonschool/dream-garden/items/level-4/wisdom-tree.png', true, true, 409),
  ('lv4_golden_deer', '황금 사슴', 'animal', 'legendary', '숲 깊은 곳의 전설의 사슴이에요.', '/images/toonschool/dream-garden/items/level-4/golden-deer.png', true, true, 410),
  -- Level 5 — 바다 탐험섬
  ('lv5_sandcastle', '모래성', 'decor', 'common', '해변에 쌓은 멋진 모래성이에요.', '/images/toonschool/dream-garden/items/level-5/sandcastle.png', true, true, 501),
  ('lv5_palm_tree', '야자수', 'nature', 'common', '바닷가에 서 있는 야자수예요.', '/images/toonschool/dream-garden/items/level-5/palm-tree.png', true, true, 502),
  ('lv5_lifebuoy', '구명튜브', 'decor', 'common', '안전을 지켜 주는 구명튜브예요.', '/images/toonschool/dream-garden/items/level-5/lifebuoy.png', true, true, 503),
  ('lv5_small_lighthouse', '작은 등대', 'decor', 'uncommon', '배 길을 밝혀 주는 등대예요.', '/images/toonschool/dream-garden/items/level-5/small-lighthouse.png', true, true, 504),
  ('lv5_sea_map', '바다 지도', 'decor', 'uncommon', '보물을 찾아주는 바다 지도예요.', '/images/toonschool/dream-garden/items/level-5/sea-map.png', true, true, 505),
  ('lv5_whale_fountain', '고래 분수', 'animal', 'uncommon', '물을 뿜어 올리는 고래 분수예요.', '/images/toonschool/dream-garden/items/level-5/whale-fountain.png', true, true, 506),
  ('lv5_explorer_compass', '탐험가 나침반', 'decor', 'rare', '길을 잃지 않게 해 주는 나침반이에요.', '/images/toonschool/dream-garden/items/level-5/explorer-compass.png', true, true, 507),
  ('lv5_adventure_ship', '탐험선', 'decor', 'epic', '넓은 바다를 누비는 탐험선이에요.', '/images/toonschool/dream-garden/items/level-5/adventure-ship.png', true, true, 508),
  ('lv5_golden_anchor', '황금 닻', 'legend', 'legendary', '어떤 폭풍도 견디는 전설의 닻이에요.', '/images/toonschool/dream-garden/items/level-5/golden-anchor.png', true, true, 509),
  ('lv5_treasure_chest', '보물상자', 'legend', 'legendary', '비밀 지도 끝의 보물상자예요.', '/images/toonschool/dream-garden/items/level-5/treasure-chest.png', true, true, 510),
  -- Level 6 — 시간여행 박물관
  ('lv6_clock_fragment', '시계 조각', 'decor', 'common', '멈춘 시계에서 떨어진 조각이에요.', '/images/toonschool/dream-garden/items/level-6/clock-fragment.png', true, true, 601),
  ('lv6_time_key', '시간의 열쇠', 'decor', 'common', '시간의 문을 여는 열쇠예요.', '/images/toonschool/dream-garden/items/level-6/time-key.png', true, true, 602),
  ('lv6_museum_lantern', '박물관 등불', 'decor', 'common', '박물관을 밝히는 오래된 등불이에요.', '/images/toonschool/dream-garden/items/level-6/museum-lantern.png', true, true, 603),
  ('lv6_memory_frame', '추억 액자', 'decor', 'uncommon', '소중한 추억을 담는 액자예요.', '/images/toonschool/dream-garden/items/level-6/memory-frame.png', true, true, 604),
  ('lv6_hourglass_bottle', '모래시계 병', 'decor', 'uncommon', '시간이 담긴 신비한 병이에요.', '/images/toonschool/dream-garden/items/level-6/hourglass-bottle.png', true, true, 605),
  ('lv6_time_bell', '시간의 종', 'decor', 'uncommon', '시간을 알려 주는 종이에요.', '/images/toonschool/dream-garden/items/level-6/time-bell.png', true, true, 606),
  ('lv6_crystal_pendulum', '수정 진자', 'spirit', 'rare', '시간의 흐름을 보여 주는 수정이에요.', '/images/toonschool/dream-garden/items/level-6/crystal-pendulum.png', true, true, 607),
  ('lv6_golden_gear', '황금 톱니바퀴', 'decor', 'rare', '오래도록 굴러가는 황금 톱니예요.', '/images/toonschool/dream-garden/items/level-6/golden-gear.png', true, true, 608),
  ('lv6_mini_clock_tower', '미니 시계탑', 'decor', 'epic', '박물관 한가운데의 시계탑이에요.', '/images/toonschool/dream-garden/items/level-6/mini-clock-tower.png', true, true, 609),
  ('lv6_time_crown', '시간의 왕관', 'legend', 'legendary', '시간을 다스리는 전설의 왕관이에요.', '/images/toonschool/dream-garden/items/level-6/time-crown.png', true, true, 610),
  -- Level 7 — 별들 사이의 약속
  ('lv7_star_lantern', '별빛 등불', 'sky', 'common', '별빛을 모은 등불이에요.', '/images/toonschool/dream-garden/items/level-7/star-lantern.png', true, true, 701),
  ('lv7_moon_ribbon', '달빛 리본', 'decor', 'common', '달빛으로 짠 부드러운 리본이에요.', '/images/toonschool/dream-garden/items/level-7/moon-ribbon.png', true, true, 702),
  ('lv7_stardust_bottle', '별가루 병', 'decor', 'common', '별가루를 담은 반짝이는 병이에요.', '/images/toonschool/dream-garden/items/level-7/stardust-bottle.png', true, true, 703),
  ('lv7_promise_star', '약속의 별', 'sky', 'uncommon', '약속을 기억하게 해 주는 별이에요.', '/images/toonschool/dream-garden/items/level-7/promise-star.png', true, true, 704),
  ('lv7_moon_cradle', '달 요람', 'decor', 'uncommon', '달빛 아래 포근한 요람이에요.', '/images/toonschool/dream-garden/items/level-7/moon-cradle.png', true, true, 705),
  ('lv7_constellation_ring', '별자리 반지', 'decor', 'uncommon', '별자리 무늬의 반지예요.', '/images/toonschool/dream-garden/items/level-7/constellation-ring.png', true, true, 706),
  ('lv7_nebula_orb', '성운 구슬', 'sky', 'rare', '우주의 성운을 담은 구슬이에요.', '/images/toonschool/dream-garden/items/level-7/nebula-orb.png', true, true, 707),
  ('lv7_galaxy_swing', '은하 그네', 'decor', 'rare', '은하 속에서 높이 뜨는 그네예요.', '/images/toonschool/dream-garden/items/level-7/galaxy-swing.png', true, true, 708),
  ('lv7_comet_bridge', '혜성 다리', 'sky', 'epic', '혜성이 만들어 낸 반짝이는 다리예요.', '/images/toonschool/dream-garden/items/level-7/comet-bridge.png', true, true, 709),
  ('lv7_promise_crown', '약속의 왕관', 'legend', 'legendary', '별들 사이의 약속을 새긴 왕관이에요.', '/images/toonschool/dream-garden/items/level-7/promise-crown.png', true, true, 710),
  -- Level 8 — 발명도시
  ('lv8_spring_chair', '스프링 의자', 'decor', 'common', '통통 튀어 오르는 의자예요.', '/images/toonschool/dream-garden/items/level-8/spring-chair.png', true, true, 801),
  ('lv8_windmill_cart', '풍차 수레', 'decor', 'common', '바람으로 움직이는 수레예요.', '/images/toonschool/dream-garden/items/level-8/windmill-cart.png', true, true, 802),
  ('lv8_gear_flower', '톱니바퀴 꽃', 'nature', 'common', '톱니바퀴로 피어난 꽃이에요.', '/images/toonschool/dream-garden/items/level-8/gear-flower.png', true, true, 803),
  ('lv8_idea_bulb', '아이디어 전구', 'decor', 'uncommon', '반짝 떠오른 생각을 담은 전구예요.', '/images/toonschool/dream-garden/items/level-8/idea-bulb.png', true, true, 804),
  ('lv8_mini_robot', '미니 로봇', 'decor', 'uncommon', '도움을 주는 작은 로봇이에요.', '/images/toonschool/dream-garden/items/level-8/mini-robot.png', true, true, 805),
  ('lv8_inventor_toolbox', '발명가 도구상자', 'decor', 'uncommon', '온갖 도구가 든 상자예요.', '/images/toonschool/dream-garden/items/level-8/inventor-toolbox.png', true, true, 806),
  ('lv8_steam_fountain', '증기 분수', 'decor', 'rare', '증기를 뿜어 올리는 분수예요.', '/images/toonschool/dream-garden/items/level-8/steam-fountain.png', true, true, 807),
  ('lv8_moving_bridge', '움직이는 다리', 'decor', 'rare', '스스로 열리고 닫히는 다리예요.', '/images/toonschool/dream-garden/items/level-8/moving-bridge.png', true, true, 808),
  ('lv8_tiny_airship', '작은 비행선', 'sky', 'epic', '하늘을 나는 멋진 비행선이에요.', '/images/toonschool/dream-garden/items/level-8/tiny-airship.png', true, true, 809),
  ('lv8_invention_core', '발명의 핵심', 'legend', 'legendary', '도시를 움직이는 전설의 동력이에요.', '/images/toonschool/dream-garden/items/level-8/invention-core.png', true, true, 810),
  -- Level 9 — 하늘성
  ('lv9_door_lantern', '문 등불', 'decor', 'common', '큰 문을 밝히는 등불이에요.', '/images/toonschool/dream-garden/items/level-9/door-lantern.png', true, true, 901),
  ('lv9_cloud_pillar', '구름 기둥', 'decor', 'common', '하늘성을 떠받치는 기둥이에요.', '/images/toonschool/dream-garden/items/level-9/cloud-pillar.png', true, true, 902),
  ('lv9_sky_crystal', '하늘 수정', 'sky', 'common', '투명하게 빛나는 하늘 수정이에요.', '/images/toonschool/dream-garden/items/level-9/sky-crystal.png', true, true, 903),
  ('lv9_crystal_banner', '수정 깃발', 'decor', 'uncommon', '빛으로 수놓은 깃발이에요.', '/images/toonschool/dream-garden/items/level-9/crystal-banner.png', true, true, 904),
  ('lv9_guardian_bell', '수호의 종', 'decor', 'uncommon', '성을 지키는 종이에요.', '/images/toonschool/dream-garden/items/level-9/guardian-bell.png', true, true, 905),
  ('lv9_floating_stair', '떠다니는 계단', 'decor', 'uncommon', '공중에 떠 있는 신비한 계단이에요.', '/images/toonschool/dream-garden/items/level-9/floating-stair.png', true, true, 906),
  ('lv9_light_shield', '빛의 방패', 'decor', 'rare', '빛으로 만든 든든한 방패예요.', '/images/toonschool/dream-garden/items/level-9/light-shield.png', true, true, 907),
  ('lv9_royal_emblem', '왕가의 문장', 'decor', 'rare', '하늘성 왕가의 문장이에요.', '/images/toonschool/dream-garden/items/level-9/royal-emblem.png', true, true, 908),
  ('lv9_sky_key', '하늘의 열쇠', 'decor', 'epic', '마지막 문을 여는 열쇠예요.', '/images/toonschool/dream-garden/items/level-9/sky-key.png', true, true, 909),
  ('lv9_final_lock', '마지막 자물쇠', 'legend', 'legendary', '용기 있는 자만 여는 자물쇠예요.', '/images/toonschool/dream-garden/items/level-9/final-lock.png', true, true, 910),
  -- Level 10 — 꿈의 책 세계
  ('lv10_magic_page', '마법의 페이지', 'decor', 'uncommon', '스스로 글자가 써지는 페이지예요.', '/images/toonschool/dream-garden/items/level-10/magic-page.png', true, true, 1001),
  ('lv10_memory_feather', '추억의 깃털', 'animal', 'uncommon', '소중한 기억을 담은 깃털이에요.', '/images/toonschool/dream-garden/items/level-10/memory-feather.png', true, true, 1002),
  ('lv10_story_lamp', '이야기 등불', 'decor', 'uncommon', '이야기를 비추는 따뜻한 등불이에요.', '/images/toonschool/dream-garden/items/level-10/story-lamp.png', true, true, 1003),
  ('lv10_golden_bookmark', '황금 책갈피', 'decor', 'rare', '완성된 책의 황금 책갈피예요.', '/images/toonschool/dream-garden/items/level-10/golden-bookmark.png', true, true, 1004),
  ('lv10_star_seal', '별의 인장', 'decor', 'rare', '완성된 이야기를 인증하는 인장이에요.', '/images/toonschool/dream-garden/items/level-10/star-seal.png', true, true, 1005),
  ('lv10_dream_orb', '꿈의 구슬', 'spirit', 'rare', '모든 꿈이 담긴 반짝이는 구슬이에요.', '/images/toonschool/dream-garden/items/level-10/dream-orb.png', true, true, 1006),
  ('lv10_book_garden', '책 정원', 'nature', 'epic', '책 속에서 피어난 정원이에요.', '/images/toonschool/dream-garden/items/level-10/book-garden.png', true, true, 1007),
  ('lv10_final_star_tree', '마지막 별나무', 'nature', 'epic', '별빛을 가득 머금은 나무예요.', '/images/toonschool/dream-garden/items/level-10/final-star-tree.png', true, true, 1008),
  ('lv10_story_crown', '이야기의 왕관', 'legend', 'legendary', '완성된 이야기책의 왕관이에요.', '/images/toonschool/dream-garden/items/level-10/story-crown.png', true, true, 1009),
  ('lv10_dream_book', '꿈의 책', 'legend', 'legendary', '모든 꿈이 하나로 묶인 전설의 책이에요.', '/images/toonschool/dream-garden/items/level-10/dream-book.png', true, true, 1010)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  rarity = excluded.rarity,
  description = excluded.description,
  image_url = excluded.image_url,
  is_placeable = excluded.is_placeable,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 레벨 달성 아이템의 중복 지급 방지용 부분 unique 인덱스(additive).
-- dreamLevelItemService 가 source_id='dream:item:{level}:{code}' 로 student_items 에 기록할 때
-- 동일 (student_id, source_id) 가 두 번 들어가지 않도록 DB 단에서 막는다.
-- 마이그레이션 미적용 시엔 클라이언트 사전 조회로 멱등을 보장한다(이 인덱스가 없어도 동작).
create unique index if not exists idx_student_items_level_event_unique
on public.student_items(student_id, source_type, source_id)
where source_type = 'event' and source_id like 'dream:item:%';

-- 검증: 레벨 아이템이 정상적으로 들어갔는지 확인.
-- select count(*) from public.items where code like 'lv%';  -- 기대값 90
