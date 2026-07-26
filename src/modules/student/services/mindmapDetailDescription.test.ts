/**
 * 4차(detail) 가지 설명 길이 제한(49자 이하) 회귀 테스트.
 *
 * - cleanDetailDescription: 어떤 입력에도 49자 이하를 보장(문장/공백 경계 축약, 중간 단어 절단 금지).
 * - buildSampleMindmap(로컬 폴백)의 모든 detail 설명이 49자 이하.
 */
import { describe, it, expect } from 'vitest';
import { cleanDetailDescription } from './mindmapService';
import { buildSampleMindmap } from '../utils/mindmapSampleData';
import { MINDMAP_LIMITS } from '../data/mindmapConfig';

const MAX = MINDMAP_LIMITS.maxDetailDescriptionLength; // 49
const MIN = MINDMAP_LIMITS.minDetailDescriptionLength; // 10

describe('cleanDetailDescription (4차 가지 설명 49자 제한)', () => {
  it('49자 이하 입력은 그대로 반환한다', () => {
    const s = '물은 온도가 낮아지면 얼음으로 굳어요.'; // 21자
    expect(cleanDetailDescription(s)).toBe(s);
  });

  it('50자 이상 입력은 49자 이하로 축약된다', () => {
    const long = '물은 온도가 낮아지면 얼음으로 굳어지고, 온도가 높아지면 수증기가 되어 공기 중으로 사라지는 세 가지 모습으로 변해요.';
    const out = cleanDetailDescription(long);
    expect(out.length).toBeLessThanOrEqual(MAX);
  });

  it('축약 시 단어 중간에서 끊기지 않는다(공백 경계)', () => {
    const long = '색깔과 크기와 모습과 무게와 냄새와 촉감과 온도를 관찰하면 특징을 알 수 있어요 정말로요';
    const out = cleanDetailDescription(long);
    expect(out.length).toBeLessThanOrEqual(MAX);
    // 마지막 글자가 공백이 아니고, 원본의 49자 위치가 공백이 아니라면 직전 공백에서 잘린다.
    expect(out.endsWith(' ')).toBe(false);
  });

  it('문장 부호 경계가 있으면 그 위치에서 자연스럽게 끝난다', () => {
    const long = '물은 얼면 얼음이 돼요. 그리고 더워지면 수증기가 되어 공중으로 날아가요.';
    const out = cleanDetailDescription(long);
    expect(out.length).toBeLessThanOrEqual(MAX);
    expect(out.endsWith('.')).toBe(true);
  });

  it('JSON 잔재/태그를 제거한다', () => {
    const dirty = '<p>"description": 물은 얼면 굳어요</p>';
    expect(cleanDetailDescription(dirty)).toBe('물은 얼면 굳어요');
  });

  it('빈/undefined 입력은 빈 문자열', () => {
    expect(cleanDetailDescription(undefined)).toBe('');
    expect(cleanDetailDescription('')).toBe('');
  });

  it('축약 결과가 최소 길이(MIN) 이상 유지되도록 한다(가능한 범위)', () => {
    const long = '가'.repeat(120);
    const out = cleanDetailDescription(long);
    expect(out.length).toBeLessThanOrEqual(MAX);
    expect(out.length).toBeGreaterThanOrEqual(MIN);
  });
});

describe('buildSampleMindmap detail 설명 길이', () => {
  it('모든 detail 설명이 49자 이하이다', () => {
    const res = buildSampleMindmap({ centralTopic: '물의 상태 변화', subject: '과학', unitTitle: '물의 상태 변화' });
    for (const b of res.branches) {
      for (const c of b.children) {
        for (const d of c.details || []) {
          expect((d.description || '').length).toBeLessThanOrEqual(MAX);
        }
      }
    }
  });

  it('모든 detail 설명이 최소 길이(10자) 이상이다', () => {
    const res = buildSampleMindmap({ centralTopic: '우리 생활', unitTitle: '우리 생활' });
    for (const b of res.branches) {
      for (const c of b.children) {
        for (const d of c.details || []) {
          expect((d.description || '').trim().length).toBeGreaterThanOrEqual(MIN);
        }
      }
    }
  });
});
