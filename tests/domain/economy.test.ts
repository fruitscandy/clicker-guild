import { describe, expect, it } from "vitest";
import {
  bossFirstClearBonus,
  bossGold,
  bossHp,
  bossXp,
  firstClearBonus,
  getStageBalance,
  normalGold,
  normalFirstClearBonus,
  normalHp,
  normalXp,
} from "../../src/domain/economy";

describe("스테이지 밸런스 공식", () => {
  it.each([
    ["1-1", 1, false, 30, 8, 4, 40],
    ["1-2", 2, false, 35, 9, 4, 45],
    ["1-5", 5, false, 58, 14, 6, 70],
    ["1-9", 9, false, 113, 24, 9, 120],
    ["1-10", 10, true, 665, 84, 45, 420],
  ] as const)(
    "문서 예시 %s를 계산한다",
    (stageId, overallIndex, isBoss, hp, gold, xp, firstClear) => {
      expect(getStageBalance(stageId)).toEqual({
        stageId,
        overallIndex,
        isBoss,
        hp,
        gold,
        xp,
        firstClearBonus: firstClear,
      });
    },
  );

  it("보스 공식은 같은 인덱스의 일반 수치에 배율을 적용한다", () => {
    expect(bossHp(10)).toBe(normalHp(10) * 5);
    expect(bossGold(10)).toBe(normalGold(10) * 3);
    expect(bossXp(10)).toBe(normalXp(10) * 5);
    expect(firstClearBonus(10, false)).toBe(normalGold(10) * 5);
    expect(firstClearBonus(10, true)).toBe(normalGold(10) * 15);
    expect(normalFirstClearBonus(10)).toBe(normalGold(10) * 5);
    expect(bossFirstClearBonus(10)).toBe(normalGold(10) * 15);
  });

  it.each([0, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "1"])(
    "잘못된 전체 인덱스 %j를 모든 공식에서 거부한다",
    (stageIndex) => {
      expect(() => normalHp(stageIndex)).toThrow();
      expect(() => normalGold(stageIndex)).toThrow();
      expect(() => normalXp(stageIndex)).toThrow();
    },
  );

  it("최대 스테이지에서도 유한한 양의 정수를 반환한다", () => {
    const balance = getStageBalance("10-10");
    expect(Number.isSafeInteger(balance.hp)).toBe(true);
    expect(Number.isSafeInteger(balance.gold)).toBe(true);
    expect(Number.isSafeInteger(balance.xp)).toBe(true);
    expect(balance.hp).toBeGreaterThan(0);
  });
});
