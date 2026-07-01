export interface SubjectBackgroundRule {
  artStyle: string;
  colorPalette: string;
  cutSceneGuide: Record<number, string>;
  visualSymbols: string;
  forbiddenElements: string;
}

const THEME_KEYWORDS: Record<string, Record<string, string>> = {
  '과학': {
    '물': 'water_cycle', '순환': 'water_cycle', '증발': 'water_cycle', '응결': 'water_cycle', '강수': 'water_cycle',
    '날씨': 'weather', '구름': 'weather', '비': 'weather', '눈': 'weather', '대기': 'weather',
    '동물': 'ecosystem', '식물': 'ecosystem', '생태': 'ecosystem', '먹이': 'ecosystem', '자연': 'ecosystem',
    '지구': 'geology', '화산': 'geology', '지진': 'geology', '지층': 'geology', '암석': 'geology',
    '우주': 'space', '태양': 'space', '달': 'space', '별': 'space', '행성': 'space', '태양계': 'space',
    '빛': 'energy', '소리': 'energy', '전기': 'energy', '자석': 'energy', '에너지': 'energy',
  },
  '사회': {
    '국토': 'korean_geo', '지형': 'korean_geo', '산': 'korean_geo', '강': 'korean_geo', '우리나라': 'korean_geo',
    '기후': 'climate', '계절': 'climate',
    '도시': 'urban_rural', '농촌': 'urban_rural',
    '어촌': 'coastal',
    '산촌': 'mountain_village',
    '역사': 'history', '문화': 'history', '유산': 'history', '조선': 'history', '고려': 'history',
    '교통': 'transportation', '통신': 'transportation', '경제': 'transportation',
  },
  '국어': {
    '이야기': 'story', '인물': 'story', '사건': 'story', '감동': 'story',
    '대화': 'communication', '감정': 'communication', '마음': 'communication', '표현': 'communication',
    '설명': 'informational', '논설': 'informational', '주장': 'informational', '정보': 'informational',
  },
  '수학': {
    '덧셈': 'arithmetic', '뺄셈': 'arithmetic', '곱셈': 'arithmetic', '나눗셈': 'arithmetic',
    '자연수': 'arithmetic', '계산': 'arithmetic',
    '도형': 'geometry', '측정': 'geometry', '넓이': 'geometry', '각도': 'geometry',
    '분수': 'fraction', '소수': 'fraction', '비율': 'fraction',
    '규칙': 'pattern', '패턴': 'pattern',
  },
  '영어': {
    '학교': 'school', '친구': 'school', '소개': 'school',
    '여행': 'travel', '장소': 'travel', '길': 'travel', '나라': 'travel',
    '음식': 'food', '쇼핑': 'food', '시장': 'food',
    '동물': 'nature', '환경': 'nature',
  },
};

export const detectBackgroundTheme = (topicTitle: string, subject: string): string => {
  const subjectKeywords = THEME_KEYWORDS[subject] || {};
  for (const [keyword, theme] of Object.entries(subjectKeywords)) {
    if (topicTitle.includes(keyword)) return theme;
  }
  return 'general';
};

export const COMMON_ART_STYLE_HEADER = `A high quality, bright, and colorful educational scene background for elementary school students.
Japanese anime-style educational illustration. Soft cell-shaded 2D art. Clean outlines.
Flat but layered background. Bright pastel colors. NOT photorealistic. NOT 3D render. Hand-drawn 2D illustration feel.
FINAL IMAGE MUST BE A "BACKGROUND ONLY" IMAGE READY FOR CHARACTER AND SPEECH BUBBLE OVERLAYS.`;

export const COMMON_NEGATIVE_RULES = `no people, no characters, no human figures, no animals depicted as characters, no text, no words, no letters, no speech bubbles, no comic panels, no comic page layout, no posters, no worksheets, no framed images, no watermarks, no logos, no UI elements, background only, full bleed`;

export const getCutSceneBaseGuide = (cutNo: number): string => {
  const guides: Record<number, string> = {
    1: 'Wide establishing shot of the story\'s main setting. Sets the visual style baseline.',
    2: 'Close-up or focused view of the first key concept or location.',
    3: 'Mid-story scene showing the concept in progress.',
    4: 'Show the effect or result of the concept on the environment.',
    5: 'Comparison, contrast, or resolution scene.',
    6: 'Wide panoramic summary scene.',
  };
  return guides[cutNo] || 'Scene transition. Maintain visual style consistency.';
};

const SCIENCE_RULES: Record<string, SubjectBackgroundRule> = {
  water_cycle: {
    artStyle: 'Nature landscape with open sky. Riverside or lake setting. Anime-style educational scene.',
    colorPalette: 'Sky blue #87CEEB, soft white clouds, clear water blue #4FC3F7, lush green #90EE90. Bright and fresh.',
    cutSceneGuide: {
      1: 'Wide river or lake scene, sunny day, calm water reflecting sky.',
      2: 'Close-up of water surface with rising steam (wavy lines ↑ shown as background element).',
      3: 'Blue sky with ascending arrows, fluffy white clouds forming.',
      4: 'Cloud with water droplets condensing, small rain drops beginning to form.',
      5: 'Rain falling on landscape, rivers and ground receiving rainfall.',
      6: 'Wide panorama showing complete water cycle path (sun → water → cloud → rain → river).',
    },
    visualSymbols: 'Upward arrows (↑) for evaporation, wavy water lines, cloud with droplets for condensation, rain drop icons.',
    forbiddenElements: 'no indoor settings, no city backgrounds, no school buildings',
  },
  weather: {
    artStyle: 'Sky-dominant scene. Dramatic cloud formations. Anime educational illustration.',
    colorPalette: 'Sky blue to grey gradient, white cumulus clouds, sunshine yellow #FFD700, rain silver #B0C4DE.',
    cutSceneGuide: {
      1: 'Bright sunny outdoor panorama. Clear blue sky with fluffy clouds.',
      2: 'Clouds gathering on horizon. Wind direction shown by tree branches bending.',
      3: 'Dark cloud formation. Lightning or strong wind visual cues.',
      4: 'Heavy rain scene. Landscape with rainfall and puddles forming.',
      5: 'Rainbow appearing after rain. Sky transitioning from grey to blue.',
      6: 'Four-season comparison panorama or final clear blue sky.',
    },
    visualSymbols: 'Wind arrows, cloud type labels (visual only, no text), rain streaks, sun rays.',
    forbiddenElements: 'no indoor settings',
  },
  ecosystem: {
    artStyle: 'Lush forest or meadow. Layered nature environment. Warm anime nature illustration.',
    colorPalette: 'Deep forest green #228B22, soft leaf green #90EE90, sunlight yellow, earth brown #8B4513.',
    cutSceneGuide: {
      1: 'Wide nature setting (forest edge or garden panorama).',
      2: 'Close detail of plant stems, leaves, or soil environment.',
      3: 'Sunlight filtering through leaf canopy, photosynthesis light rays.',
      4: 'Underground cross-section view. Root system visible below soil line.',
      5: 'Seasonal change represented in landscape.',
      6: 'Full ecosystem panorama. Sky, canopy, ground, and underground layers.',
    },
    visualSymbols: 'Sun rays, leaf icons, growth upward arrows, root diagram lines (cross-section).',
    forbiddenElements: 'no animals shown as characters, no pets',
  },
  geology: {
    artStyle: 'Mountain or volcanic landscape. Geological cross-section visual. Educational diagram style.',
    colorPalette: 'Rock grey #808080, earth brown #8B4513, magma orange #FF4500, geological layer colors.',
    cutSceneGuide: {
      1: 'Mountain range with clear geological color layers visible.',
      2: 'Cross-section of Earth\'s crust (diagram-style layered background).',
      3: 'Volcanic activity or tectonic movement scene.',
      4: 'Rock formation detail or soil layer close-up.',
      5: 'Earthquake effect on landscape (cracks, surface waves).',
      6: 'Wide geological panorama.',
    },
    visualSymbols: 'Geological layer color bands, fault line markers, eruption arrow indicators.',
    forbiddenElements: 'no city buildings in geological scenes',
  },
  space: {
    artStyle: 'Deep space background. Stars and planets. Anime space illustration.',
    colorPalette: 'Dark navy #1A237E to black, bright stars white, planet colors.',
    cutSceneGuide: {
      1: 'Earth from space, blue planet overview.',
      2: 'Solar system arrangement (planets in orbit paths visible).',
      3: 'Moon surface landscape or Moon phase diagram background.',
      4: 'Sun with corona rays, solar energy environment.',
      5: 'Constellation pattern in night sky.',
      6: 'Wide galaxy panorama.',
    },
    visualSymbols: 'Orbit lines (thin glowing curves), planet size comparison indicators, star pattern diagrams.',
    forbiddenElements: 'no daylight blue sky, no earth ground environments (unless specifically Earth scene)',
  },
  energy: {
    artStyle: 'Bright environment showing energy phenomena. Light rays, wave patterns. Anime educational style.',
    colorPalette: 'Bright white light, spectrum rainbow, electric yellow #FFD700, magnetic field blue #4169E1.',
    cutSceneGuide: {
      1: 'Sunny outdoor scene with visible directional light rays.',
      2: 'Prism-like rainbow spectrum dispersion (abstract visual).',
      3: 'Concentric sound wave circles emanating from an empty source point.',
      4: 'Electricity or energy flow arrows environment.',
      5: 'Magnetic field arc lines around an object.',
      6: 'Energy conversion environment (sun → warmth → movement).',
    },
    visualSymbols: 'Wave patterns (sound/light), energy flow arrows, spectrum color gradients.',
    forbiddenElements: 'no dark or gloomy settings',
  },
};

const SOCIAL_RULES: Record<string, SubjectBackgroundRule> = {
  korean_geo: {
    artStyle: 'Korean landscape illustration. Map-book style. Anime 2D illustration.',
    colorPalette: 'Mountain green #8FBC8F, river blue #4FC3F7, earth tan #D2B48C, coastal blue #0047AB.',
    cutSceneGuide: {
      1: 'Wide Korea map-like overhead illustration with mountains and rivers.',
      2: 'Mountain range (태백산맥 style) landscape.',
      3: 'River plain (평야) and farmland.',
      4: 'Coastal village or harbor scene.',
      5: 'Urban vs rural contrast side-by-side background.',
      6: 'Full Korean peninsula illustration from elevated view.',
    },
    visualSymbols: 'Soft topographic contour lines (no text), compass rose (decorative), river/coast color distinction. Focus on place and props.',
    forbiddenElements: 'no text labels on maps, no realistic photo style',
  },
  climate: {
    artStyle: 'Seasonal Korean outdoor scenes. Warm illustration style.',
    colorPalette: 'Spring pink #FFB6C1, summer green #228B22, autumn gold #FFD700, winter white #F0F8FF.',
    cutSceneGuide: {
      1: 'Colorful four-seasons split panorama or spring cherry blossom.',
      2: 'Summer: lush green rice paddy landscape.',
      3: 'Rainy season (장마): swollen river, grey rain sky.',
      4: 'Autumn: golden harvest fields, red and orange leaves.',
      5: 'Winter: snow-covered mountain or village.',
      6: 'Stylized weather map background (soft, no text labels).',
    },
    visualSymbols: 'Season transition arrows, temperature gradient indicators, cloud formation types. Focus on place and props.',
    forbiddenElements: 'no foreign landscapes, Korean environments only',
  },
  urban_rural: {
    artStyle: 'Contrasting community environments. Clear visual distinction. Anime 2D style.',
    colorPalette: 'Urban: grey-blue #B0C4DE. Rural: green #90EE90, earthy brown.',
    cutSceneGuide: {
      1: 'Wide establishing shot of either city skyline or farmland.',
      2: 'Urban detail: apartment buildings, wide roads.',
      3: 'Rural detail: rice fields, farmhouse.',
      4: 'Community infrastructure visible (markets, roads).',
      5: 'Comparison or contrast scene between two environments.',
      6: 'Panorama of the full community environment.',
    },
    visualSymbols: 'Production type icons (grain stalk, truck), community layout visible. Focus on place and props.',
    forbiddenElements: 'no signs with readable text',
  },
  coastal: {
    artStyle: 'Seaside fishing village. Warm coastal atmosphere. Anime illustration.',
    colorPalette: 'Ocean blue #0099CC, sandy beige, fishing boat red/white, seafood orange.',
    cutSceneGuide: {
      1: 'Wide harbor panorama. Fishing boats anchored, calm sea.',
      2: 'Docking area with fish-drying racks (empty of characters).',
      3: 'Open sea horizon. Waves and sky.',
      4: 'Tidal flat (갯벌) environment.',
      5: 'Market stall arrangement by the harbor.',
      6: 'Full coastal village panorama from elevated view.',
    },
    visualSymbols: 'Wave patterns, boat silhouettes (no characters), net hanging as decoration. Focus on place and props.',
    forbiddenElements: 'no animals as characters, no fishing characters',
  },
  history: {
    artStyle: 'Historical Korean architecture. Traditional aesthetic. Warm earth-tone anime illustration.',
    colorPalette: '오방색 (blue, red, yellow, white, black). Warm earth tones.',
    cutSceneGuide: {
      1: 'Traditional Korean village (한옥마을). Tiled roofs (기와지붕) visible.',
      2: 'Royal palace (경복궁 style) background.',
      3: 'Ancient artifact site or cultural landscape.',
      4: 'Historical illustrated map background.',
      5: 'Traditional seasonal folk scene environment (no people).',
      6: 'Heritage monument panorama.',
    },
    visualSymbols: 'Traditional 단청 patterns, era marker decorative elements, 기와 roof details. Focus on place and props.',
    forbiddenElements: 'no modern buildings, no contemporary elements',
  },
  transportation: {
    artStyle: 'Transportation network illustration. Map-diagram style. Bright anime style.',
    colorPalette: 'Road grey, railway blue #1565C0, sea blue, sky blue. Bright node colors.',
    cutSceneGuide: {
      1: 'Illustrated map with roads, railways, airports.',
      2: 'Train or subway station environment.',
      3: 'Port and shipping dock scene.',
      4: 'Airport runway environment (no people).',
      5: 'Market or trade route illustration.',
      6: 'Full connected network panorama (nodes and route lines).',
    },
    visualSymbols: 'Route lines (road/rail/sea), connection node icons, vehicle silhouettes (no characters). Focus on place and props.',
    forbiddenElements: 'no characters in vehicles',
  },
};

const KOREAN_RULES: Record<string, SubjectBackgroundRule> = {
  story: {
    artStyle: 'Warm storybook illustration style. Narrative environment. Soft anime 2D art.',
    colorPalette: 'Cream white #FFF8F0, warm wood brown #DEB887, soft green #98FB98, sky blue. Warm diffused light.',
    cutSceneGuide: {
      1: 'Wide establishing shot of the story\'s main setting.',
      2: 'Specific location relevant to the first story event.',
      3: 'Environmental change or key story location (mid-point).',
      4: 'Dramatic or tension environment (if conflict), calm (if resolution).',
      5: 'Secondary location or time-of-day change.',
      6: 'Final setting — return to opening or peaceful resolution environment.',
    },
    visualSymbols: 'Soft diffused shadows, flower or leaf decorative elements. No learning concept symbols, focus on location and props.',
    forbiddenElements: 'no harsh or scary environments, no dark settings',
  },
  communication: {
    artStyle: 'Intimate warm environments. Emotional context through color temperature. Soft anime style.',
    colorPalette: 'Pink #FFB6C1, lavender #E6E6FA, warm orange, cream white. Always warm color temperature.',
    cutSceneGuide: {
      1: 'Welcoming school entrance or warm classroom (empty, golden light).',
      2: 'Cozy park bench under a cherry blossom tree.',
      3: 'Library interior: bookshelves, soft reading lamp glow.',
      4: 'Home kitchen or living room (warm evening light).',
      5: 'Outdoor sunny scene (positive resolution atmosphere).',
      6: 'Peaceful neighborhood garden panorama.',
    },
    visualSymbols: 'Soft heart motifs as background texture, warm lighting gradients. Focus on location and props.',
    forbiddenElements: 'no cold or industrial settings, no harsh contrast lighting',
  },
  informational: {
    artStyle: 'Topic-appropriate environment with soft infographic overlay elements. Anime educational style.',
    colorPalette: 'Determined by the text topic. Default: soft blue-green informational palette.',
    cutSceneGuide: {
      1: 'Wide context-setting environment matching the text topic.',
      2: 'First key subject or environment detail.',
      3: 'Main concept environment (most important visual).',
      4: 'Supporting evidence environment or example location.',
      5: 'Contrast or comparison environment.',
      6: 'Full summary panorama of the topic environment.',
    },
    visualSymbols: 'Soft arrow indicators, infographic-like elements as background texture (no text). Focus on place and props.',
    forbiddenElements: 'no text or words in environment',
  },
};

const MATH_RULES: Record<string, SubjectBackgroundRule> = {
  arithmetic: {
    artStyle: 'Adventure or market scene. Fun and colorful. Bright anime illustration.',
    colorPalette: 'Bright sky blue, gold #FFD700, fresh green, warm orange.',
    cutSceneGuide: {
      1: 'Fantasy adventure map landscape (treasure hunt style).',
      2: 'Colorful market stall environment (goods grouped visually, no people).',
      3: 'Candy shop or bakery background (items arranged in groups).',
      4: 'Farm with crops in organized rows (visual grouping concept).',
      5: 'City scene with buildings arranged in blocks.',
      6: 'Treasure chest or celebration reward panorama.',
    },
    visualSymbols: 'Groups of objects in background (clusters, rows), counting grid patterns on ground, path with stepping stone intervals.',
    forbiddenElements: 'no numbers as text, no math symbols written on surfaces',
  },
  geometry: {
    artStyle: 'Architecture or geometric landscape. Blueprint and pattern elements. Clean anime style.',
    colorPalette: 'Blueprint blue #4169E1, pastel geometric colors, clean white.',
    cutSceneGuide: {
      1: 'City background with geometric building shapes.',
      2: 'Tile floor with geometric pattern (top-down view).',
      3: 'Nature scene with hidden geometry (hexagonal honeycomb, circular pond).',
      4: 'Blueprint-style illustrated room or building interior.',
      5: 'Rulers and measuring tools as decorative background elements.',
      6: 'Abstract geometric pattern panorama.',
    },
    visualSymbols: 'Visible geometry outline overlays, shape indicator marks, grid paper texture on surfaces.',
    forbiddenElements: 'no text numbers on shapes, no measurement values written',
  },
  fraction: {
    artStyle: 'Bakery, pizza parlor, or divided garden scene. Warm and appetizing. Anime style.',
    colorPalette: 'Warm bakery tones: golden #FFD700, cream, chocolate brown. Garden green.',
    cutSceneGuide: {
      1: 'Top-view of circular objects (pies/gardens) divided into equal sections.',
      2: 'Bakery display with pies/cakes clearly cut into equal parts.',
      3: 'Number line as a road or river path in landscape.',
      4: 'Measuring tape or ruler integrated into nature background.',
      5: 'Two gardens of different sizes side by side for comparison.',
      6: 'Summary environment with soft grid pattern on ground.',
    },
    visualSymbols: 'Division lines on circular objects, equal-section markers, fraction bar as path divider.',
    forbiddenElements: 'no written fractions or numbers',
  },
  pattern: {
    artStyle: 'Mosaic, textile, or nature pattern background. Decorative and rhythmic. Anime style.',
    colorPalette: 'Vibrant but harmonious pattern colors. Traditional Korean 단청 palette or bright mosaic.',
    cutSceneGuide: {
      1: 'Traditional Korean 단청 or mosaic tile pattern background.',
      2: 'Garden path with repeating stepping stones.',
      3: 'Wallpaper-style repeating pattern environment.',
      4: 'Night sky with star arrangement in recognizable pattern.',
      5: 'Color blocks in repeating sequence (no text).',
      6: 'Full mosaic panorama.',
    },
    visualSymbols: 'Repeating decorative elements, pattern highlight markers, rhythm arrows.',
    forbiddenElements: 'no random non-repeating arrangements',
  },
};

const ENGLISH_RULES: Record<string, SubjectBackgroundRule> = {
  school: {
    artStyle: 'Colorful international school environment. Friendly and welcoming. Bright anime style.',
    colorPalette: 'Warm orange #FFA500, cream white, sky blue, school-flag primary colors.',
    cutSceneGuide: {
      1: 'Colorful school exterior. Flags and banners (solid color, no text).',
      2: 'Classroom interior. Desks arranged, chalkboard empty.',
      3: 'School cafeteria or playground.',
      4: 'Library or science room environment.',
      5: 'School garden or sports field.',
      6: 'Wide school campus panorama.',
    },
    visualSymbols: 'Blank directional signs, empty welcome banners, flag decorations (no writing). Focus on place and props.',
    forbiddenElements: 'no English text visible anywhere, no written words on any surfaces',
  },
  travel: {
    artStyle: 'Global landmark environment. Travel poster style. Bright anime illustration.',
    colorPalette: 'Mediterranean blue #0099CC, sky blue, landmark warm tones, world flag colors.',
    cutSceneGuide: {
      1: 'Airport departure hall (no people, all signs blank).',
      2: 'City street with landmark buildings in background.',
      3: 'Map-like illustrated city overview (no text labels).',
      4: 'Hotel lobby or tourist attraction environment.',
      5: 'Local market or food street.',
      6: 'Global panorama with multiple landmark silhouettes.',
    },
    visualSymbols: 'Blank signposts, map icons, destination markers (no text), compass rose. Focus on location and props.',
    forbiddenElements: 'no English text on signs, no country name labels',
  },
  food: {
    artStyle: 'Colorful market, cafe, or restaurant environment. Appetizing and warm. Anime style.',
    colorPalette: 'Fruit colors (red, yellow, green), warm bakery tones, market stall orange.',
    cutSceneGuide: {
      1: 'Colorful fruit and vegetable market stalls.',
      2: 'Bakery or cafe interior (cozy, warm light).',
      3: 'Supermarket aisle with colorful goods.',
      4: 'Restaurant setting or outdoor dining area.',
      5: 'Kitchen environment (cooking utensils visible).',
      6: 'Colorful table setting panorama (no people).',
    },
    visualSymbols: 'Blank price tags, empty menu boards, food item icons as background texture. Focus on location and props.',
    forbiddenElements: 'no English text on menus or price tags',
  },
  nature: {
    artStyle: 'Global nature environments. Exotic and vibrant. Bright anime nature illustration.',
    colorPalette: 'Tropical green, safari gold, arctic white, ocean blue. Vivid nature colors.',
    cutSceneGuide: {
      1: 'Safari or tropical savanna setting.',
      2: 'Ocean underwater environment (coral reef, no character animals).',
      3: 'Arctic or polar snow landscape.',
      4: 'Rainforest canopy view (green layers).',
      5: 'Farm with animal habitat structures (barns, pens — no character animals).',
      6: 'World nature panorama showing multiple biome types.',
    },
    visualSymbols: 'Habitat type icons, nature guide-style illustrated markers, biome label positions (blank tags). Focus on place and props.',
    forbiddenElements: 'no animals depicted as characters, no text labels',
  },
};

const FALLBACK_RULE: SubjectBackgroundRule = {
  artStyle: 'Japanese anime-style educational illustration. Soft cell-shaded 2D art. Clean outlines. Bright pastel colors.',
  colorPalette: 'Bright, cheerful pastel palette appropriate for elementary school students.',
  cutSceneGuide: {
    1: 'Wide establishing shot. Bright and welcoming environment.',
    2: 'Focused view of the main topic element.',
    3: 'Mid-story environment showing concept in progress.',
    4: 'Environment showing the effect or result of the concept.',
    5: 'Comparison or resolution environment.',
    6: 'Wide summary panorama.',
  },
  visualSymbols: 'Focus on location and props. Educational visual cues if applicable.',
  forbiddenElements: '',
};

const SUBJECT_ALL_RULES: Record<string, Record<string, SubjectBackgroundRule>> = {
  '과학': SCIENCE_RULES,
  '사회': SOCIAL_RULES,
  '국어': KOREAN_RULES,
  '수학': MATH_RULES,
  '영어': ENGLISH_RULES,
};

export const getSubjectBackgroundRule = (
  subject: string,
  topicTitle: string
): SubjectBackgroundRule => {
  const theme = detectBackgroundTheme(topicTitle, subject);
  const subjectRules = SUBJECT_ALL_RULES[subject];
  if (subjectRules && subjectRules[theme]) {
    return subjectRules[theme];
  }
  if (subjectRules && subjectRules['general']) {
    return subjectRules['general'];
  }
  return FALLBACK_RULE;
};

export const getCutSceneGuide = (
  rule: SubjectBackgroundRule,
  cutNo: number
): string => {
  return rule.cutSceneGuide[cutNo] ?? getCutSceneBaseGuide(cutNo);
};
