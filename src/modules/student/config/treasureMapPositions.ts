/**
 * 보물지도 인터랙티브 화면 — 레벨 좌표 설정(단일 출처).
 *
 * 모든 좌표는 "지도 이미지 전체 크기 기준 퍼센트(0~100)"다. 픽셀이 아니다.
 * 화면 크기가 바뀌어도 지도 컨테이너 원본 비율(1491×1055) 기준으로 함께 스케일되므로
 * 장소와 클릭 영역이 어긋나지 않는다.
 *
 * 레벨 제목·설명·필요점수·아이템 등의 "데이터"는 여기서 두지 않고
 * 기존 SoT(`dreamProgressionConfig.ts` 의 DREAM_CHAPTERS / LEVEL_ITEM_CATALOG)에서
 * 가져온다(중복 금지). 이 파일은 '위치'만 담당한다.
 *
 * ── 좌표 조정 방법 ──
 * 각 레벨은 중심점(cx, cy)만 지정하면 클릭 영역(hotspot)·마커(marker)·
 * 진행 경로 세그먼트가 모두 자동으로 도출된다. 위치가 어긋나면 해당 cx/cy만 옮기면 된다.
 * 좌표는 DEBUG_TREASURE_MAP_HOTSPOTS=true 로 브라우저에서 시각 확인하며 조정한다.
 */

/** 보물지도 배경 이미지(브라우저 경로). 파일 이동/이름 변경 금지. */
export const TREASURE_MAP_BACKGROUND = '/images/toonschool/dream-garden/treasure-map-bg-v1.png'

/** 원본 이미지 종횡비(1491×1055). 로딩 전에도 지도 영역 비율을 유지하기 위해 사용. */
export const TREASURE_MAP_IMAGE_ASPECT = 1491 / 1055

/**
 * 개발 모드: 핫스팟 클릭 영역과 마커 중심을 화면에 표시해 좌표를 조정한다.
 * 운영 배포 전 반드시 false 로 확인할 것.
 */
export const DEBUG_TREASURE_MAP_HOTSPOTS = false

export interface TreasureMapMarker {
  /** 마커(체크/자물쇠/현재위치 핀) 중심 — 지도 가로 기준 % */
  x: number
  /** 마커 중심 — 지도 세로 기준 % */
  y: number
}

export interface TreasureMapHotspot {
  /** 클릭 영역 왼쪽 위 모서리 — 지도 가로 기준 % */
  x: number
  /** 클릭 영역 왼쪽 위 모서리 — 지도 세로 기준 % */
  y: number
  /** 클릭 영역 너비 — 지도 가로 기준 % */
  width: number
  /** 클릭 영역 높이 — 지도 세로 기준 % */
  height: number
}

export interface TreasureMapLevelPosition {
  level: number
  /** 투명 클릭 영역(장소 그림 전체를 덮음) */
  hotspot: TreasureMapHotspot
  /** 상태 마커 중심(체크·자물쇠·핀) */
  marker: TreasureMapMarker
  /**
   * 배경 이미지에 해당 장소 일러스트가 이미 그려져 있는지.
   * false 면 동적 라벨(양피지 스타일)로 장소를 직접 그린다(레벨 5).
   */
  illustrated: boolean
}

/** 각 레벨의 중심점과 핫스팟 반경(지도 % 기준). 중심점만 옮기면 된다. */
interface RawCenter {
  /** 중심 x% */
  cx: number
  /** 중심 y% */
  cy: number
  /** 클릭 영역 너비의 절반(기본 9 → 18%) */
  hw?: number
  /** 클릭 영역 높이의 절반(기본 9 → 18%) */
  hh?: number
  illustrated?: boolean
}

// 3×3 지그재그 배치 + 바다(레벨5) 동적 오버레이.
// 상단 행: 1·2·3 / 중단 행: 7·6·4 (+바다 5) / 하단 행: 8·9·10
// 경로 순서는 항상 1 → 2 → ... → 10.
const CENTERS: Record<number, RawCenter> = {
  1: { cx: 18, cy: 30 },
  2: { cx: 45, cy: 28 },
  3: { cx: 72, cy: 28 },
  4: { cx: 78, cy: 50 },
  // 5: 배경에 일러스트가 없으므로 오른쪽 바다/섬 영역에 동적 라벨로 배치.
  5: { cx: 87, cy: 38, hw: 8, hh: 9, illustrated: false },
  6: { cx: 45, cy: 52 },
  7: { cx: 18, cy: 52 },
  8: { cx: 18, cy: 74 },
  9: { cx: 45, cy: 74 },
  10: { cx: 76, cy: 74 },
}

function buildPositions(): TreasureMapLevelPosition[] {
  return Array.from({ length: 10 }, (_, i) => {
    const level = i + 1
    const c = CENTERS[level]
    const hw = c.hw ?? 9
    const hh = c.hh ?? 9
    return {
      level,
      hotspot: {
        x: c.cx - hw,
        y: c.cy - hh,
        width: hw * 2,
        height: hh * 2,
      },
      marker: { x: c.cx, y: c.cy },
      illustrated: c.illustrated ?? true,
    }
  })
}

export const TREASURE_MAP_POSITIONS: TreasureMapLevelPosition[] = buildPositions()

/** 레벨 → 위치 빠른 조회. */
export function getTreasureMapPosition(level: number): TreasureMapLevelPosition | undefined {
  return TREASURE_MAP_POSITIONS.find((p) => p.level === level)
}

// ─────────────────────────────────────────────────────────────
// 진행 경로 세그먼트(은은한 금빛 오버레이용).
// 배경의 점선 경로를 지우지 않고, 완료한 구간만 살짝 밝게 강조한다.
// 인접 레벨 중심끼리 연결하는 부드러운 곡선을 중심점에서 자동 생성한다.
// ─────────────────────────────────────────────────────────────
export interface TreasureMapSegment {
  from: number
  to: number
  /** viewBox 0..100 (preserveAspectRatio=none) 기준 path 'd' */
  d: string
}

function centerOf(level: number): { x: number; y: number } {
  const c = CENTERS[level]
  return { x: c.cx, y: c.cy }
}

// 두 점을 잇는 느슨한 이차 곡선(직선보다 자연스러운 느낌, 미세한 곡률).
function segmentPath(from: number, to: number): string {
  const a = centerOf(from)
  const b = centerOf(to)
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  // 직교 방향으로 살짝 치우친 제어점 → 완만한 호.
  const offset = 1.6
  const cx = mx + (-dy / len) * offset
  const cy = my + (dx / len) * offset
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`
}

function buildSegments(): TreasureMapSegment[] {
  const segs: TreasureMapSegment[] = []
  for (let lvl = 1; lvl < 10; lvl++) {
    segs.push({ from: lvl, to: lvl + 1, d: segmentPath(lvl, lvl + 1) })
  }
  return segs
}

export const TREASURE_MAP_SEGMENTS: TreasureMapSegment[] = buildSegments()

/** 모바일에서 핀치/드래그의 기본 배율(지도가 화면보다 넓어 좌우 팬이 필요). */
export const TREASURE_MAP_MOBILE_BASE_SCALE = 1.7
export const TREASURE_MAP_MIN_SCALE = 1
export const TREASURE_MAP_MAX_SCALE = 3
