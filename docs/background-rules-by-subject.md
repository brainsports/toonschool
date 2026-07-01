# 툰스쿨 과목별 만화 배경 생성 룰

> **문서 경로**: `docs/background-rules-by-subject.md`  
> **작성일**: 2026-07-01  
> **적용 파일**: `src/modules/student/services/studentComicService.ts`  
> **관련 예정 파일**: `src/modules/student/services/comicBackgroundRuleService.ts` (신규 예정)

---

## 목차

1. [공통 스타일 룰](#1-공통-스타일-룰)
2. [금지 규칙](#2-금지-규칙)
3. [컷별 장면 변화 원칙](#3-컷별-장면-변화-원칙)
4. [과학 배경 생성 룰](#4-과학-science)
5. [사회 배경 생성 룰](#5-사회-social-studies)
6. [국어 배경 생성 룰](#6-국어-korean-language)
7. [수학 배경 생성 룰](#7-수학-mathematics)
8. [영어 배경 생성 룰](#8-영어-english)
9. [추후 코드 적용 방식](#9-추후-코드-적용-방식)

---

## 5과목 시각 철학 요약

| 과목 | 핵심 시각 철학 | 대표 배경 환경 |
|------|---------------|--------------|
| **과학** | 자연현상 현장 + 과학 교과서 다이어그램 기호 | 강변, 숲, 우주, 지층 |
| **사회** | 일러스트 지도책 스타일 | 한국 지형, 도시/농촌, 역사 공간 |
| **국어** | 따뜻한 동화책 삽화 스타일 | 교실, 공원, 도서관, 가정 |
| **수학** | 실생활 속 수학 개념이 보이는 배경 | 시장, 건물, 퍼즐 공간 |
| **영어** | 글로벌 여행 감성 배경 | 학교, 공항, 시장, 세계 명소 |

---

## 1. 공통 스타일 룰

> 아래 규칙은 **모든 과목·모든 컷**에 반드시 적용됩니다.

```
Art style    : Japanese anime-style educational illustration
Rendering    : Soft cell-shaded 2D. Clean outlines. Flat but layered backgrounds.
Color        : Bright pastel color palette. Vivid but not harsh.
Quality      : NOT photorealistic. NOT 3D render. Hand-drawn 2D illustration feel.
Sky rule     : Sky is always present unless the setting is explicitly indoors.
Output type  : Background only. Full bleed. Ready for character and speech bubble overlay.
```

### 이미지 생성 프롬프트 고정 서두 (모든 과목 공통)

```
A high quality, bright, and colorful educational scene background for elementary school students.
Japanese anime-style educational illustration. Soft cell-shaded 2D art. Clean outlines.
Flat but layered background. Bright pastel colors.
FINAL IMAGE MUST BE A "BACKGROUND ONLY" IMAGE READY FOR CHARACTER AND SPEECH BUBBLE OVERLAYS.
```

---

## 2. 금지 규칙

### 2-1. 절대 금지 (모든 과목 공통)

```
no people
no characters
no human figures
no animals depicted as characters
no text
no words
no letters
no speech bubbles
no comic panels
no comic page layout
no posters
no worksheets
no framed images
no watermarks
no logos
no UI elements
background only
full bleed
```

### 2-2. 과목별 추가 금지

| 과목 | 추가 금지 요소 |
|------|--------------|
| 과학 | 실험실 비커·플라스크 (화학 실험 느낌은 제외, 자연 현상 중심) |
| 사회 | 실제 지명 텍스트가 적힌 지도, 실사 사진 풍 |
| 국어 | 책 표지나 원고지 격자 (배경이 되면 안 됨) |
| 수학 | 수식, 숫자 텍스트 (환경 속 자연스러운 패턴만 허용) |
| 영어 | 영어 텍스트가 보이는 간판, 메뉴판 (반드시 빈 칸 처리) |

---

## 3. 컷별 장면 변화 원칙

> **핵심**: "스타일 유지 ≠ 장소 반복"

### 3-1. 원칙

| 원칙 | 설명 |
|------|------|
| **Cut 1 기준점** | 1컷이 전체 만화의 시각 스타일 기준선(색감·선명도·톤)을 설정한다 |
| **2~6컷 장소 변화** | 스타일은 유지하되 장소·구도·오브젝트는 반드시 달라야 한다 |
| **반복 = 실패** | 2~6컷에서 1컷과 같은 배경을 그리면 반드시 실패로 판정 |
| **교육 개념 시각화** | 각 컷의 배경에 그 컷의 학습 개념을 돕는 시각 단서가 포함되어야 한다 |
| **학습 역할 반영** | 컷 번호별 학습 역할(아래 참조)에 맞는 장면을 구성한다 |

### 3-2. 컷 번호별 학습 역할 → 배경 구성 지침

| 컷 번호 | 학습 역할 | 배경 구성 지침 |
|---------|----------|--------------|
| Cut 1 | 퀘스트 시작 / 문제 상황 제시 | 넓은 배경, 설정을 보여주는 와이드샷 |
| Cut 2 | 기초 개념 및 위치 탐색 | 핵심 개념의 첫 번째 장소·현상 클로즈업 |
| Cut 3 | 핵심 개념 본격 이해 | 개념이 진행되는 과정의 장면, 화살표·기호 허용 |
| Cut 4 | 실생활·환경에 미치는 영향 | 개념의 결과가 보이는 환경 |
| Cut 5 | 오해 바로잡기 / 비교 / 문제 해결 | 비교 또는 전환되는 장면 |
| Cut 6 | 개념 정리 및 학습 마무리 | 전체를 아우르는 파노라마 또는 정리 공간 |

---

## 4. 과학 (Science)

### 시각 철학
> **"자연현상이 일어나는 현장을 과학 교과서 다이어그램처럼 표현한다"**  
> 실제 자연 배경 위에 과학적 기호(화살표, 아이콘)가 자연스럽게 녹아있어야 한다.

### 컬러 팔레트

| 테마 | 주요 색상 | 용도 |
|------|----------|------|
| 하늘/대기 | Sky blue `#87CEEB`, 흰 구름 | 물의 순환, 날씨 |
| 자연/생명 | Soft green `#90EE90`, 연두 `#ADFF2F` | 동식물, 생태계 |
| 물/순환 | 맑은 파랑 `#4FC3F7` | 물의 순환, 강 |
| 에너지/열 | 따뜻한 주황 `#FFB347`, 노랑 `#FFD700` | 에너지, 빛 |
| 우주 | 진한 남색 `#1A237E`, 별빛 흰색 | 우주, 태양계 |
| 지층/화산 | 황토 `#CC7722`, 회색 `#808080` | 지구, 지형 |

### 단원별 배경 룰

#### 물의 순환 / 날씨 / 대기

```
Primary setting : Riverside or lake with open sky
Must include    : Visible sun or clouds, flowing water, nature landscape

Cut 1 → Wide river/lake scene, sunny day, calm water reflecting sky
Cut 2 → Close-up of water surface with rising steam (wavy lines ↑ shown as background element)
Cut 3 → Blue sky with ascending arrows, fluffy white clouds forming
Cut 4 → Cloud with water droplets condensing, small rain drops beginning to form
Cut 5 → Rain falling on landscape, rivers and ground receiving rain
Cut 6 → Wide panorama showing complete water cycle path (sun → water → cloud → rain → river)

Allowed visual symbols:
- Upward arrows (↑) for evaporation
- Wavy water lines
- Cloud with droplets for condensation
- Rain drop icons as background texture
```

#### 동물 / 식물 / 생태계

```
Primary setting : Forest, meadow, or jungle
Must include    : Visible plants, trees, nature environment (NO animals as characters)

Cut 1 → Wide nature setting (forest edge or garden panorama)
Cut 2 → Close detail of plant stems, leaves, or soil environment
Cut 3 → Sunlight filtering through leaves, photosynthesis light rays
Cut 4 → Underground root system visible (cross-section style background)
Cut 5 → Seasonal change represented in landscape
Cut 6 → Full ecosystem panorama

Allowed visual symbols:
- Sun rays, leaf icons
- Growth arrows
- Root diagram lines (cross-section)
```

#### 지구 / 지형 / 화산 / 지진

```
Primary setting : Mountain, volcanic, or geological landscape

Cut 1 → Mountain range with clear geological color layers visible
Cut 2 → Cross-section of Earth's crust (diagram-style layered background)
Cut 3 → Volcanic activity or tectonic movement scene
Cut 4 → Rock formation or soil layer detail
Cut 5 → Earthquake effect on landscape (cracks, surface waves)
Cut 6 → Wide geographical panorama

Allowed visual symbols:
- Geological layer color bands
- Fault line markers
- Eruption arrow indicators
```

#### 우주 / 태양계

```
Primary setting : Deep space with stars and planets
Color override  : Dark navy #1A237E to black, bright stars, planet colors

Cut 1 → Earth from space, blue planet overview
Cut 2 → Solar system arrangement (planets in orbit paths visible)
Cut 3 → Moon surface or phase change diagram background
Cut 4 → Sun with corona rays, solar energy environment
Cut 5 → Constellation patterns in night sky
Cut 6 → Wide galaxy panorama

Allowed visual symbols:
- Orbit lines (thin, glowing)
- Planet size comparison indicators
- Star pattern diagrams
```

#### 빛 / 소리 / 에너지

```
Primary setting : Bright outdoor or illustrated lab-like environment

Cut 1 → Sunny outdoor scene with visible directional light rays
Cut 2 → Prism-like rainbow spectrum dispersion (abstract visual)
Cut 3 → Sound wave concentric circles emanating from empty source
Cut 4 → Electricity or energy flow arrows environment
Cut 5 → Magnetic field arc lines around an object
Cut 6 → Energy conversion environment (sun → warmth → movement)

Allowed visual symbols:
- Wave patterns (sound, light)
- Energy flow arrows
- Spectrum color gradients
```

---

## 5. 사회 (Social Studies)

### 시각 철학
> **"지도, 지형, 사회 환경을 일러스트 지도책처럼 표현한다"**  
> 실제 장소 배경 위에 부드러운 지도·다이어그램 요소가 결합된 스타일.

### 컬러 팔레트

| 테마 | 주요 색상 | 용도 |
|------|----------|------|
| 국토/지형 | 연갈색 `#D2B48C`, 산지 녹색 `#8FBC8F` | 한국 지형, 국토 |
| 도시 | 밝은 회색 `#B0C4DE`, 하늘색 | 도시 환경 |
| 농촌/바다 | 에메랄드 `#50C878`, 코발트블루 `#0047AB` | 농촌, 어촌 |
| 역사 | 황토 `#CC9900`, 따뜻한 갈색 | 역사, 문화유산 |
| 지도 요소 | 크림 `#FFFDD0` | 지도 스타일 배경 |

### 단원별 배경 룰

#### 국토 / 지형 / 우리나라

```
Primary setting : Korean landscape — mountains, rivers, coastline

Cut 1 → Wide Korea map-like overhead illustration with mountains and rivers
Cut 2 → Mountain range (태백산맥 스타일) landscape
Cut 3 → River plain (평야) and farmland
Cut 4 → Coastal village or harbor scene
Cut 5 → Urban vs rural contrast side-by-side background
Cut 6 → Full Korean peninsula illustration from elevated view

Allowed visual symbols:
- Soft topographic contour lines (no text)
- Compass rose (decorative)
- River/coast color distinction
```

#### 기후 / 계절 / 날씨

```
Primary setting : Seasonal Korean outdoor scenes

Cut 1 → Colorful four-seasons split panorama or spring cherry blossom
Cut 2 → Summer: green rice paddy landscape
Cut 3 → Rainy season (장마) — swollen river and grey sky
Cut 4 → Autumn harvest landscape, golden fields
Cut 5 → Winter snow mountain scene
Cut 6 → Stylized weather map background (soft, no text labels)

Allowed visual symbols:
- Season transition arrows
- Temperature gradient indicators
- Cloud formation types
```

#### 도시 / 농촌 / 어촌 / 산촌

```
도시  → Modern city skyline, wide roads, apartment buildings (anime 2D style)
농촌  → Green rice fields, farmhouses, dirt roads
어촌  → Seaside harbor, fishing boats anchored, drying racks
산촌  → Dense forest, mountain path, small stream

Visual symbols:
- Production type icons (grain stalk, fish, timber — as decorative background)
- Community layout distinctions visible in environment
```

#### 교통 / 통신 / 경제

```
Primary setting : Transportation network landscape

Cut 1 → Illustrated map with roads, railways, airports
Cut 2 → Train or subway network environment
Cut 3 → Port and shipping dock scene
Cut 4 → Airport runway environment (no people)
Cut 5 → Market or trade route illustration
Cut 6 → Connected network panorama (nodes and route lines)

Visual symbols:
- Route lines (road, rail, sea)
- Connection node icons
- Vehicle silhouettes (no characters inside)
```

#### 역사 / 문화유산

```
Primary setting : Historical Korean settings
Color override  : Warm earth tones, 오방색 (blue, red, yellow, white, black)

Cut 1 → Traditional Korean village (한옥마을 스타일)
Cut 2 → Royal palace (경복궁 스타일) background
Cut 3 → Ancient artifact site or cultural landscape
Cut 4 → Historical map-like illustrated background
Cut 5 → Traditional seasonal folk scene environment (no people)
Cut 6 → Heritage monument panorama

Visual symbols:
- Traditional architectural details (기와지붕, 단청 patterns)
- Era marker decorative elements
```

---

## 6. 국어 (Korean Language)

### 시각 철학
> **"이야기 속 장면을 동화책 삽화처럼 따뜻하고 감성적으로 표현한다"**  
> 친숙한 생활 환경(교실, 공원, 도서관, 가정)이 배경의 중심.

### 컬러 팔레트

| 테마 | 주요 색상 | 용도 |
|------|----------|------|
| 따뜻한 실내 | 크림 화이트 `#FFF8F0`, 나무색 `#DEB887` | 가정, 교실 |
| 야외 생활 | 부드러운 초록 `#98FB98`, 하늘색 | 공원, 운동장 |
| 감정/표현 | 분홍 `#FFB6C1`, 라벤더 `#E6E6FA` | 감정 표현 단원 |
| 도서관/학교 | 따뜻한 갈색, 파스텔 주황 | 학교, 도서관 |

### 단원별 배경 룰

#### 이야기 / 인물 / 사건

```
Primary setting : Story-appropriate environment matching the narrative tone
                 (adventure = outdoor, emotional = indoor, mystery = dim forest)

Cut 1 → Wide establishing shot of the story's main setting
Cut 2 → Specific location relevant to the first story event
Cut 3 → Environmental change or key story location (mid-point)
Cut 4 → Dramatic or tension setting (if conflict) / calm (if resolution)
Cut 5 → Secondary location or time-of-day change
Cut 6 → Final setting — return to opening or peaceful resolution environment

Visual style: Warm book illustration style, soft diffused shadows
```

#### 대화 / 감정 / 의사소통

```
Primary setting : Intimate, warm environments that convey emotional context

Cut 1 → Welcoming school entrance or warm classroom (empty, golden light)
Cut 2 → Cozy park bench under a cherry blossom tree
Cut 3 → Library interior — bookshelves, soft reading lamp glow
Cut 4 → Home kitchen or living room (warm evening light)
Cut 5 → Outdoor sunny scene (positive resolution atmosphere)
Cut 6 → Peaceful neighborhood garden panorama

Allowed visual symbols:
- Soft heart motifs as background texture
- Warm lighting gradients
- Flower or leaf decorative elements
```

#### 설명문 / 정보글 / 논설

```
Primary setting : Determined by the content topic
If topic is nature → nature background
If topic is city → city background
If topic is science → science-appropriate background

Cut 1 → Wide context-setting environment
Cut 2-5 → Progressively more detailed or zoomed environments
Cut 6 → Full summary panorama

Allowed visual symbols:
- Soft arrow indicators
- Infographic-like elements as background texture (no text)
```

---

## 7. 수학 (Mathematics)

### 시각 철학
> **"수학 개념이 실생활 속에서 발견되는 장면을 표현한다"**  
> 추상적 수학 개념을 실생활 배경 위에 시각적 패턴·기호로 표현.

### 컬러 팔레트

| 테마 | 주요 색상 | 용도 |
|------|----------|------|
| 탐험/모험 | 밝은 하늘색, 초록, 황금색 `#FFD700` | 사칙연산 모험 |
| 퍼즐/게임 | 밝은 보라 `#DDA0DD`, 민트 `#98FF98` | 규칙, 패턴 |
| 도형 | 파스텔 기하학색 (파/빨/노/초 파스텔) | 도형, 측정 |
| 분수/비율 | 따뜻한 베이지, 파이 색상 | 분수, 소수 |

### 단원별 배경 룰

#### 자연수 / 사칙연산

```
Primary setting : Adventure or market scene environment

Cut 1 → Fantasy adventure map landscape (treasure hunt style)
Cut 2 → Colorful market stall environment (goods grouped visually, no people)
Cut 3 → Candy shop / bakery background (items in visible groups)
Cut 4 → Farm with crops in organized rows (visual grouping concept)
Cut 5 → City scene with buildings in numbered blocks
Cut 6 → Treasure chest or celebration panorama

Allowed visual symbols:
- Groups of objects shown in background (clusters, rows)
- Counting grid patterns on ground
- Path with stepping stone intervals
```

#### 도형 / 측정 / 넓이

```
Primary setting : Architecture or geometric landscape

Cut 1 → City background with geometric building shapes
Cut 2 → Tile floor with geometric pattern (top-down view)
Cut 3 → Nature scene with hidden geometry (hexagonal honeycomb, circular pond)
Cut 4 → Blueprint-style illustrated room or building interior
Cut 5 → Rulers, measuring tapes as decorative background elements
Cut 6 → Abstract geometric pattern panorama

Allowed visual symbols:
- Visible geometry outline overlays on environment
- Shape labels (no text, only shape indicators)
- Grid paper texture on surfaces
```

#### 분수 / 소수

```
Primary setting : Bakery, pizza parlor, or garden divided into sections

Cut 1 → Top-view of circular objects divided into equal sections
Cut 2 → Bakery display with pies/cakes clearly cut into equal parts
Cut 3 → Number line as a road or river path in landscape
Cut 4 → Measuring tape or ruler integrated into nature background
Cut 5 → Visual comparison (two gardens of different sizes side by side)
Cut 6 → Summary environment with soft grid on ground

Allowed visual symbols:
- Division lines on circular objects
- Equal-section markers
- Fraction bar as a path divider element
```

#### 규칙 / 패턴

```
Primary setting : Mosaic, textile, or nature pattern background

Cut 1 → Traditional Korean 단청 or mosaic tile background
Cut 2 → Garden path with repeating stepping stones
Cut 3 → Wallpaper-style repeating pattern environment
Cut 4 → Night sky with star arrangement in pattern
Cut 5 → Color blocks in repeating sequence (no text or numbers)
Cut 6 → Full mosaic panorama

Allowed visual symbols:
- Repeating decorative elements
- Pattern highlight markers
- Rhythm indicators (arrows showing repetition)
```

---

## 8. 영어 (English)

### 시각 철학
> **"영어권 문화와 글로벌 장소를 밝고 친근하게 표현한다"**  
> 영어 학습 테마(학교·여행·시장·음식)에 맞는 글로벌 감각의 배경.

### 컬러 팔레트

| 테마 | 주요 색상 | 용도 |
|------|----------|------|
| 글로벌/여행 | 밝은 하늘색, 지중해 파랑 `#0099CC` | 여행, 명소 |
| 학교/교실 | 따뜻한 주황, 크림 화이트 | 학교생활 |
| 음식/마켓 | 과일색 (빨강·노랑·초록) | 음식, 쇼핑 |
| 모험/탐험 | 녹색 정글, 황금 모래 | 동물, 자연 |

### 단원별 배경 룰

#### 자기소개 / 학교생활

```
Primary setting : School or playground environment

Cut 1 → Colorful school exterior (flags/banners, no people, no English text)
Cut 2 → Classroom interior (desks arranged, chalkboard empty)
Cut 3 → School cafeteria or playground scene
Cut 4 → Library or science room environment
Cut 5 → School garden or sports field
Cut 6 → Wide school campus panorama

Allowed visual symbols:
- Directional signs (blank, no text)
- Welcome banner shape (empty)
- Flag decorations (solid color, no writing)
```

#### 여행 / 장소 / 길찾기

```
Primary setting : Landmark or global city environment

Cut 1 → Airport departure hall (no people, all signs blank)
Cut 2 → City street with landmark buildings in background
Cut 3 → Map-like illustrated city overview (no text labels)
Cut 4 → Hotel lobby or tourist attraction environment
Cut 5 → Local market or food street
Cut 6 → Global panorama with multiple landmark silhouettes

Allowed visual symbols:
- Signposts (blank)
- Map icons and destination markers
- Compass rose
```

#### 음식 / 쇼핑 / 일상

```
Primary setting : Market, cafe, or restaurant environment

Cut 1 → Colorful fruit/vegetable market stalls
Cut 2 → Bakery or cafe interior (cozy, warm light)
Cut 3 → Supermarket aisle with colorful goods
Cut 4 → Restaurant setting or outdoor dining area
Cut 5 → Kitchen environment (cooking utensils visible)
Cut 6 → Colorful table setting panorama (no people)

Allowed visual symbols:
- Price tags (blank)
- Menu boards (empty, no text)
- Food item icons as background texture
```

#### 동물 / 자연 / 환경

```
Primary setting : Global nature environments (NOT Korean landscape style)

Cut 1 → Safari or tropical savanna setting
Cut 2 → Ocean underwater environment (coral reef, no character animals)
Cut 3 → Arctic or polar snow landscape
Cut 4 → Rainforest canopy view (green layers)
Cut 5 → Farm with animal habitat structures (barns, pens — no animals as characters)
Cut 6 → World nature panorama (showing multiple biome types)

Allowed visual symbols:
- Habitat type icons
- Nature guide-style illustrated markers
- Biome label positions (blank tags)
```

---

## 9. 추후 코드 적용 방식

> **주의**: 이 섹션은 코드 구현 예정 사양입니다. 현재 코드를 수정하지 마세요.

### 9-1. 신규 파일 예정

```
src/modules/student/services/comicBackgroundRuleService.ts
```

### 9-2. detectBackgroundTheme() — 단원명 → 테마 자동 분류

단원명(topicTitle) 키워드를 분석해 배경 테마를 자동 결정하는 함수.

```typescript
// 예정 코드 (comicBackgroundRuleService.ts)

const THEME_KEYWORDS: Record<string, Record<string, string>> = {
  '과학': {
    '물': 'water_cycle', '순환': 'water_cycle', '증발': 'water_cycle',
    '날씨': 'weather', '구름': 'weather', '비': 'weather', '눈': 'weather',
    '동물': 'ecosystem', '식물': 'ecosystem', '생태': 'ecosystem', '먹이': 'ecosystem',
    '지구': 'geology', '화산': 'geology', '지진': 'geology', '지층': 'geology',
    '우주': 'space', '태양': 'space', '달': 'space', '별': 'space', '행성': 'space',
    '빛': 'energy', '소리': 'energy', '전기': 'energy', '자석': 'energy',
  },
  '사회': {
    '국토': 'korean_geo', '지형': 'korean_geo', '산': 'korean_geo', '강': 'korean_geo',
    '기후': 'climate', '계절': 'climate', '날씨': 'climate',
    '도시': 'urban_rural', '농촌': 'urban_rural', '어촌': 'coastal', '산촌': 'mountain_village',
    '역사': 'history', '문화': 'history', '유산': 'history', '조선': 'history',
    '교통': 'transportation', '통신': 'transportation', '경제': 'transportation',
  },
  '국어': {
    '이야기': 'story', '인물': 'story', '사건': 'story', '감동': 'story',
    '대화': 'communication', '감정': 'communication', '마음': 'communication',
    '설명': 'informational', '논설': 'informational', '주장': 'informational',
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
    '동물': 'nature', '환경': 'nature', '자연': 'nature',
  },
};

export const detectBackgroundTheme = (topicTitle: string, subject: string): string => {
  const subjectKeywords = THEME_KEYWORDS[subject] || {};
  for (const [keyword, theme] of Object.entries(subjectKeywords)) {
    if (topicTitle.includes(keyword)) return theme;
  }
  return 'general';
};
```

### 9-3. getSubjectBackgroundRule() — 과목 + 테마 → 룰 반환

```typescript
// 예정 코드 (comicBackgroundRuleService.ts)

export interface SubjectBackgroundRule {
  artStyle: string;          // 이미지 생성 AI에 전달할 아트 스타일 지침
  colorPalette: string;      // 컬러 팔레트 지침
  cutSceneGuide: string;     // 컷 번호별 장면 지침
  visualSymbols: string;     // 허용 시각 기호 목록
  forbiddenElements: string; // 과목별 추가 금지 요소
}

export const getSubjectBackgroundRule = (
  subject: string,
  topicTitle: string,
  cutNo: number
): SubjectBackgroundRule => {
  const theme = detectBackgroundTheme(topicTitle, subject);
  return SUBJECT_RULES[subject]?.[theme] ?? DEFAULT_SUBJECT_RULES[subject] ?? FALLBACK_RULE;
};
```

### 9-4. buildSingleCutBackgroundPrompt()에 주입하는 방식

현재 파일: `src/modules/student/services/studentComicService.ts`  
적용 함수: `buildSingleCutBackgroundPrompt(params: SingleCutPromptParams): string`

```typescript
// 예정 수정 방식 (현재 코드 수정 금지, 참고용)

const buildSingleCutBackgroundPrompt = (params: SingleCutPromptParams): string => {
  // [신규] 과목별 룰 주입
  const subjectRule = getSubjectBackgroundRule(
    params.subject,
    params.topicTitle,
    params.cutNo
  );

  return `
=== SUBJECT-SPECIFIC STYLE GUIDE ===
Subject: ${params.subject}
Art Style: ${subjectRule.artStyle}
Color Palette: ${subjectRule.colorPalette}
Cut ${params.cutNo} Scene Guide: ${subjectRule.cutSceneGuide}
Allowed Visual Symbols: ${subjectRule.visualSymbols}
Additional Forbidden: ${subjectRule.forbiddenElements}

=== STORY AND LEARNING CONTEXT ===
${기존_프롬프트_내용}

=== HARD NEGATIVE RULES ===
no people, no characters, no human figures, no animals as characters,
no text, no words, no letters, no speech bubbles, no comic panels,
no comic page layout, no posters, no worksheets, no framed images,
background only, full bleed
  `;
};
```

### 9-5. 구현 우선순위

| 우선순위 | 항목 | 기대 효과 |
|----------|------|----------|
| 🔴 1순위 | 공통 아트 스타일 (`anime-style`) 프롬프트 서두 추가 | 가장 큰 품질 향상 |
| 🔴 2순위 | 과목별 컬러 팔레트 주입 | 과목 분위기 통일 |
| 🟡 3순위 | `detectBackgroundTheme()` 구현 | 자동 테마 분류 |
| 🟡 4순위 | 단원별 컷 장면 가이드 주입 | 컷 구성 다양화 |
| 🟢 5순위 | 허용 시각 기호 목록 주입 | 교육적 시각화 강화 |

---

## 버전 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-07-01 | v1.0 | 5과목 × 주요 단원 배경 룰 최초 작성 |
