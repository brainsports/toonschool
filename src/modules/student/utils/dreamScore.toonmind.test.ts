/**
 * 툰마인드 보상 → 통합 총점/레벨 통합 회귀 테스트 (요구사항 #14, #15, #18).
 *
 * 핵심 불변량:
 *  1. 툰마인드 평가 점수(예: 85점)가 통합 총점에 직접 더해지지 않는다.
 *     오직 reward_logs 에 기록된 보상(mindmap:evaluated +20 등)만 합산된다.
 *  2. 만화 보상과 툰마인드 보상이 같은 통합 총점에 함께 합산된다.
 *  3. 레벨은 통합 총점(dreamScore) 기준으로만 결정되며, 툰마인드 보상이 기존
 *     학생의 점수/레벨을 초기화하거나 내리지 않는다.
 *
 * 중복 지급 방지(멱등)는 DB 부분 유니크 인덱스 + RPC 의 ON CONFLICT DO NOTHING
 * 가 담당하므로, 여기서는 "동일 source_id 행이 1개만 존재(정상 결과)"를 전제로
 * 점수 계산이 정확한지만 검증한다.
 */
import { describe, it, expect } from 'vitest';
import { computeDreamScore, type RewardLogRow } from './dreamScore';
import { levelFromScore, ACTIVITY_SCORE_PER_LEVEL, MAX_LEVEL } from '../config/dreamProgressionConfig';

const NOW = new Date('2026-07-18T12:00:00Z');

function row(partial: Partial<RewardLogRow>): RewardLogRow {
  return {
    id: 'r',
    reward_type: 'event',
    source_id: null,
    reward_date: null,
    item_id: null,
    created_at: '2026-07-18T10:00:00Z',
    ...partial,
  };
}

describe('computeDreamScore — 툰마인드 보상 통합', () => {
  it('툰마인드 평가 완료 보상(mindmap:evaluated, points=20)이 총점에 더해진다', () => {
    const score = computeDreamScore([row({ source_id: 'mindmap:evaluated:m1', points: 20 })], NOW);
    expect(score.specialMissionPoints).toBe(20);
    expect(score.activityScore).toBe(20);
    expect(score.dreamScore).toBe(20);
  });

  it('평가 점수(85점)가 통합 총점에 직접 더해지지 않는다 — 오직 +20 보상만', () => {
    // 학생이 85점 평가를 받아도, reward_logs 에는 mindmap:evaluated 20점만 기록된다.
    // 85점 어디에도 등장하지 않는다.
    const score = computeDreamScore([row({ source_id: 'mindmap:evaluated:m1', points: 20 })], NOW);
    expect(score.dreamScore).toBe(20); // 85가 아님
    expect(score.activityScore).toBe(20);
    // 85점이 어떤 구성 요소에도 더해지지 않았는지(합이 85가 아님) 확인
    expect(score.activityScore + score.bonusScore).toBe(20);
  });

  it('만화 보상(comic_complete 120)과 툰마인드 보상(20)이 함께 합산된다', () => {
    const score = computeDreamScore([
      row({ reward_type: 'comic_complete', source_id: 'comic-1' }),
      row({ source_id: 'mindmap:evaluated:m1', points: 20 }),
    ], NOW);
    expect(score.comicCompletePoints).toBe(120);
    expect(score.specialMissionPoints).toBe(20);
    expect(score.activityScore).toBe(140);
    expect(score.dreamScore).toBe(140);
  });

  it('단원 최초 완성(80) · 재제출(20) · 우수 칭찬(30) 보상이 points 컬럼만큼 정확히 더해진다', () => {
    const score = computeDreamScore([
      row({ source_id: 'mindmap:first-unit:u5', points: 80 }),
      row({ source_id: 'mindmap:resubmit:m1', points: 20 }),
      row({ source_id: 'mindmap:excellent:m1', points: 30 }),
    ], NOW);
    expect(score.specialMissionPoints).toBe(130);
    expect(score.activityScore).toBe(130);
  });

  it('툰마인드 보상은 기존 점수/레벨을 초기화하지 않고 올리기만 한다(회귀)', () => {
    // 만화만으로 LV.2(1000점 이상)인 학생: 9개 만화 = 1080점
    const comics = Array.from({ length: 9 }, (_, i) => row({ reward_type: 'comic_complete', source_id: `comic-${i}`, id: `c${i}` }));
    const before = computeDreamScore(comics, NOW);
    expect(before.level).toBe(2); // 1080 → LV.2

    const after = computeDreamScore([...comics, row({ source_id: 'mindmap:evaluated:m1', points: 20 })], NOW);
    expect(after.dreamScore).toBe(before.dreamScore + 20);
    expect(after.comicCompletePoints).toBe(1080); // 만화 점수 보존(초기화 X)
    expect(after.level).toBeGreaterThanOrEqual(before.level); // 레벨이 내리지 않음
    expect(after.level).toBe(levelFromScore(after.dreamScore)); // 총점 기준 단일 레벨
  });

  it('levelFromScore 는 통합 총점 기준 단일 공식을 그대로 사용한다(레벨 척도 불변)', () => {
    // 0점부터 9500점까지 250점 간격으로 공식과 일치하는지 확인(기존 학생 레벨 변동 없음)
    for (let s = 0; s <= 9500; s += 250) {
      const expected = Math.max(1, Math.min(MAX_LEVEL, Math.floor(s / ACTIVITY_SCORE_PER_LEVEL) + 1));
      expect(levelFromScore(s)).toBe(expected);
    }
    expect(levelFromScore(0)).toBe(1);
    expect(levelFromScore(999)).toBe(1);
    expect(levelFromScore(1000)).toBe(2);
    expect(levelFromScore(9000)).toBe(10);
    expect(levelFromScore(100000)).toBe(MAX_LEVEL); // 상한 캡
  });

  it('툰마인드 전용 레벨/점수 필드는 존재하지 않는다(단일 총점/레벨 원칙)', () => {
    const score = computeDreamScore([row({ source_id: 'mindmap:evaluated:m1', points: 20 })], NOW);
    // 결과 객체에 toonmind/comic 전용 레벨 필드가 없는지 확인
    expect((score as unknown as Record<string, unknown>).toonmindLevel).toBeUndefined();
    expect((score as unknown as Record<string, unknown>).comicLevel).toBeUndefined();
    expect((score as unknown as Record<string, unknown>).toonmindScore).toBeUndefined();
    expect((score as unknown as Record<string, unknown>).comicScore).toBeUndefined();
  });
});
