import { describe, expect, it } from "vitest";
import {
  GRADE_BALANCE,
  calculateGrowthMultiplier,
  enhanceCost,
  enhancementCost,
  getGradeBalance,
  nextLevelXp,
} from "../../src/domain/member-growth";

describe("길드원 등급과 성장", () => {
  it("문서의 등급 기본 비용과 공격 배율을 제공한다", () => {
    expect(GRADE_BALANCE).toEqual({
      F: { baseEnhancementCost: 20, attackMultiplier: 1 },
      E: { baseEnhancementCost: 50, attackMultiplier: 1.35 },
      D: { baseEnhancementCost: 120, attackMultiplier: 1.8 },
      C: { baseEnhancementCost: 300, attackMultiplier: 2.45 },
      B: { baseEnhancementCost: 750, attackMultiplier: 3.3 },
      A: { baseEnhancementCost: 1_800, attackMultiplier: 4.5 },
      S: { baseEnhancementCost: 5_000, attackMultiplier: 6.2 },
    });
  });

  it("현재 강화 수치에 따라 다음 강화 비용을 반올림한다", () => {
    expect(enhanceCost("F", 0)).toBe(20);
    expect(enhancementCost("F", 1)).toBe(31);
    expect(enhancementCost("E", 2)).toBe(120);
  });

  it("등급, 레벨, 강화 배율을 곱한다", () => {
    expect(calculateGrowthMultiplier("F", 1, 0)).toBe(1);
    expect(calculateGrowthMultiplier("E", 5, 3)).toBeCloseTo(2.106, 10);
    expect(calculateGrowthMultiplier("A", 20, 10)).toBeCloseTo(17.55, 10);
  });

  it("다음 레벨 경험치 공식을 계산한다", () => {
    expect(nextLevelXp(1)).toBe(10);
    expect(nextLevelXp(2)).toBe(25);
    expect(nextLevelXp(19)).toBe(Math.round(10 * 19 ** 1.35));
  });

  it.each(["G", "f", "", null, 1])("잘못된 등급 %j를 거부한다", (grade) => {
    expect(() => getGradeBalance(grade)).toThrow();
    expect(() => enhancementCost(grade, 0)).toThrow();
    expect(() => calculateGrowthMultiplier(grade, 1, 0)).toThrow();
  });

  it.each([-1, 10, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "비용 계산에서 현재 강화 경계값 %j를 거부한다",
    (enhancement) => {
      expect(() => enhancementCost("F", enhancement)).toThrow();
    },
  );

  it.each([
    [0, 0],
    [21, 0],
    [1, -1],
    [1, 11],
    [1.5, 0],
  ])("성장 배율의 잘못된 값 level=%s enhancement=%s를 거부한다", (level, enhancement) => {
    expect(() => calculateGrowthMultiplier("F", level, enhancement)).toThrow();
  });

  it.each([0, 20, 1.5, Number.NaN])("다음 레벨이 없는 경계값 %j를 거부한다", (level) => {
    expect(() => nextLevelXp(level)).toThrow();
  });
});
