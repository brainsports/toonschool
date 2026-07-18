import { describe, it, expect } from 'vitest';
import {
  averageAreas,
  areasTotal,
  comicEvalToAreas,
  toonmindEvalToAreas,
  GROWTH_AREA_KEYS,
} from './growthAreas';

describe('comicEvalToAreas — 만화 평가 5항목 → 5대 영역(1:1)', () => {
  it('5개 점수를 대응 영역으로 옮긴다', () => {
    const areas = comicEvalToAreas({
      understanding_score: 18,
      summary_score: 17,
      expression_score: 16,
      thinking_score: 19,
      completion_score: 20,
    });
    expect(areas.understanding).toBe(18);
    expect(areas.summarizing).toBe(17);
    expect(areas.expression).toBe(16);
    expect(areas.problemSolving).toBe(19);
    expect(areas.sharing).toBe(20);
  });

  it('null 입력은 모든 영역 null', () => {
    const areas = comicEvalToAreas(null);
    for (const key of GROWTH_AREA_KEYS) expect(areas[key]).toBeNull();
  });
});

describe('toonmindEvalToAreas — 툰마인드 평가 → 5대 영역(매핑 + 평균)', () => {
  it('핵심내용이해 + 내용정확성 은 understanding 영역으로 평균된다', () => {
    const areas = toonmindEvalToAreas({
      understandingScore: 20,
      connectionScore: 10,
      detailScore: 10,
      accuracyScore: 16,
      presentationScore: 10,
    });
    // understanding = mean(20, 16) = 18
    expect(areas.understanding).toBe(18);
    expect(areas.summarizing).toBe(10); // 중심주제와 가지 연결 → 핵심 정리
    expect(areas.expression).toBe(10); // 표현과 구성 → 창의적 표현
    expect(areas.problemSolving).toBe(10); // 내용의 구체성 → 생각 확장
    expect(areas.sharing).toBeNull(); // 툰마인드 항목과 직접 대응 없음
  });

  it('understanding 항목만 있고 accuracy 가 없으면 understanding 값을 그대로 쓴다', () => {
    const areas = toonmindEvalToAreas({
      understandingScore: 15,
      connectionScore: 0,
      detailScore: 0,
      accuracyScore: null,
      presentationScore: 0,
    });
    expect(areas.understanding).toBe(15);
  });

  it('accuracy 항목만 있으면 그 값이 understanding 영역이 된다', () => {
    const areas = toonmindEvalToAreas({
      understandingScore: null,
      connectionScore: 0,
      detailScore: 0,
      accuracyScore: 14,
      presentationScore: 0,
    });
    expect(areas.understanding).toBe(14);
  });
});

describe('averageAreas — 통합 집계(영역별 평균, 단순 합산 아님)', () => {
  it('두 출처 모두 값이 있으면 평균, 한쪽만 있으면 그 값', () => {
    const comic = comicEvalToAreas({ understanding_score: 20, summary_score: 10, expression_score: 10, thinking_score: 10, completion_score: 12 });
    const toonmind = toonmindEvalToAreas({ understandingScore: 16, connectionScore: 14, detailScore: 10, accuracyScore: 20, presentationScore: 12 });
    // toonmind.understanding = mean(16,20)=18
    const unified = averageAreas(comic, toonmind);
    expect(unified.understanding).toBe(19); // mean(20, 18) = 19
    expect(unified.summarizing).toBe(12); // mean(10, 14)
    expect(unified.expression).toBe(11); // mean(10, 12)
    expect(unified.problemSolving).toBe(10); // mean(10, 10)
    expect(unified.sharing).toBe(12); // toonmind.sharing=null → comic 12 만
  });

  it('모든 출처가 null 이면 null', () => {
    const unified = averageAreas(comicEvalToAreas(null), toonmindEvalToAreas(null));
    for (const key of GROWTH_AREA_KEYS) expect(unified[key]).toBeNull();
  });

  it('한 출처라도 값이 있으면 해당 영역은 null 이 아니다', () => {
    const unified = averageAreas(null, toonmindEvalToAreas({ understandingScore: 10, connectionScore: 10, detailScore: 10, accuracyScore: 10, presentationScore: 10 }));
    expect(unified.understanding).toBe(10);
    expect(unified.sharing).toBeNull(); // 툰마인드는 sharing 미제공
  });
});

describe('areasTotal', () => {
  it('null 영역은 0으로 간주해 합산(0~100)', () => {
    const areas = toonmindEvalToAreas({ understandingScore: 20, connectionScore: 10, detailScore: 10, accuracyScore: 20, presentationScore: 10 });
    // understanding=20, summarizing=10, expression=10, problemSolving=10, sharing=null→0 = 50
    expect(areasTotal(areas)).toBe(50);
  });
  it('모두 null 이면 null', () => {
    expect(areasTotal(comicEvalToAreas(null))).toBeNull();
  });
});
