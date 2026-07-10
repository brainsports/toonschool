-- Update image URLs for 30 Dream Garden items using a CASE statement
UPDATE public.items
SET image_url = CASE code
    WHEN 'small_flower_seed' THEN '/images/toonschool/dream-garden/items/small-flower-seed.png'
    WHEN 'sparkling_grass' THEN '/images/toonschool/dream-garden/items/sparkling-grass.png'
    WHEN 'pink_flower' THEN '/images/toonschool/dream-garden/items/pink-flower.png'
    WHEN 'yellow_flower' THEN '/images/toonschool/dream-garden/items/yellow-flower.png'
    WHEN 'small_star_piece' THEN '/images/toonschool/dream-garden/items/small-star-piece.png'
    WHEN 'white_cloud' THEN '/images/toonschool/dream-garden/items/white-cloud.png'
    WHEN 'small_mushroom' THEN '/images/toonschool/dream-garden/items/small-mushroom.png'
    WHEN 'firefly' THEN '/images/toonschool/dream-garden/items/firefly.png'
    WHEN 'yellow_butterfly' THEN '/images/toonschool/dream-garden/items/yellow-butterfly.png'
    WHEN 'blue_butterfly' THEN '/images/toonschool/dream-garden/items/blue-butterfly.png'
    WHEN 'flower_path' THEN '/images/toonschool/dream-garden/items/flower-path.png'
    WHEN 'small_pond' THEN '/images/toonschool/dream-garden/items/small-pond.png'
    WHEN 'cloud_lamp' THEN '/images/toonschool/dream-garden/items/cloud-lamp.png'
    WHEN 'jelly_fruit' THEN '/images/toonschool/dream-garden/items/jelly-fruit.png'
    WHEN 'dream_mailbox' THEN '/images/toonschool/dream-garden/items/dream-mailbox.png'
    WHEN 'moonlight_mushroom' THEN '/images/toonschool/dream-garden/items/moonlight-mushroom.png'
    WHEN 'starlight_chair' THEN '/images/toonschool/dream-garden/items/starlight-chair.png'
    WHEN 'rainbow_piece' THEN '/images/toonschool/dream-garden/items/rainbow-piece.png'
    WHEN 'cloud_rabbit' THEN '/images/toonschool/dream-garden/items/cloud-rabbit.png'
    WHEN 'starlight_cat' THEN '/images/toonschool/dream-garden/items/starlight-cat.png'
    WHEN 'petal_spirit' THEN '/images/toonschool/dream-garden/items/petal-spirit.png'
    WHEN 'waterdrop_spirit' THEN '/images/toonschool/dream-garden/items/waterdrop-spirit.png'
    WHEN 'rainbow_bridge' THEN '/images/toonschool/dream-garden/items/rainbow-bridge.png'
    WHEN 'tiny_fairy_house' THEN '/images/toonschool/dream-garden/items/tiny-fairy-house.png'
    WHEN 'fox_spirit' THEN '/images/toonschool/dream-garden/items/fox-spirit.png'
    WHEN 'moonlight_deer' THEN '/images/toonschool/dream-garden/items/moonlight-deer.png'
    WHEN 'aurora_tree' THEN '/images/toonschool/dream-garden/items/aurora-tree.png'
    WHEN 'tiny_sky_island' THEN '/images/toonschool/dream-garden/items/tiny-sky-island.png'
    WHEN 'galaxy_whale' THEN '/images/toonschool/dream-garden/items/galaxy-whale.png'
    WHEN 'rainbow_unicorn' THEN '/images/toonschool/dream-garden/items/rainbow-unicorn.png'
    ELSE image_url
END
WHERE code IN (
    'small_flower_seed',
    'sparkling_grass',
    'pink_flower',
    'yellow_flower',
    'small_star_piece',
    'white_cloud',
    'small_mushroom',
    'firefly',
    'yellow_butterfly',
    'blue_butterfly',
    'flower_path',
    'small_pond',
    'cloud_lamp',
    'jelly_fruit',
    'dream_mailbox',
    'moonlight_mushroom',
    'starlight_chair',
    'rainbow_piece',
    'cloud_rabbit',
    'starlight_cat',
    'petal_spirit',
    'waterdrop_spirit',
    'rainbow_bridge',
    'tiny_fairy_house',
    'fox_spirit',
    'moonlight_deer',
    'aurora_tree',
    'tiny_sky_island',
    'galaxy_whale',
    'rainbow_unicorn'
);

-- Validation SELECT query
SELECT code, name, image_url
FROM public.items
WHERE image_url LIKE '/images/toonschool/dream-garden/items/%';
