import { describe, expect, it } from "vitest";
import {
  createStageId,
  isBossStage,
  isStageId,
  parseStageId,
  toOverallStageIndex,
} from "../../src/domain/stage";

describe("StageId", () => {
  it.each([
    ["1-1", 1, false],
    ["1-10", 10, true],
    ["10-10", 100, true],
  ] as const)("%s를 전체 인덱스와 보스 여부로 변환한다", (stageId, overallIndex, boss) => {
    expect(toOverallStageIndex(stageId)).toBe(overallIndex);
    expect(isBossStage(stageId)).toBe(boss);
    expect(parseStageId(stageId)).toMatchObject({ id: stageId, overallIndex, isBoss: boss });
  });

  it("지역과 지역 내 스테이지로 안전한 ID를 만든다", () => {
    expect(createStageId(2, 7)).toBe("2-7");
  });

  it.each(["", "0-1", "1-0", "11-1", "1-11", "01-1", "1-01", "1.5-2", "1 -1", null, 11])(
    "잘못된 입력 %j를 거부한다",
    (value) => {
      expect(isStageId(value)).toBe(false);
      expect(() => parseStageId(value)).toThrow();
    },
  );

  it.each([
    [0, 1],
    [11, 1],
    [1, 0],
    [1, 11],
    [1.5, 1],
    [Number.POSITIVE_INFINITY, 1],
  ])("범위를 벗어난 좌표 (%s, %s)를 거부한다", (region, stage) => {
    expect(() => createStageId(region, stage)).toThrow();
  });
});
