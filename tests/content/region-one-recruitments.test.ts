import { describe, expect, it } from "vitest";
import {
  REGION_ONE_RECRUITMENTS,
  getRegionOneRecruitment,
  parseRegionOneRecruitments,
} from "../../src/content/region-one-recruitments";

describe("1지역 확정 영입표", () => {
  it("문서의 해금 순서와 비용을 그대로 제공한다", () => {
    expect(REGION_ONE_RECRUITMENTS).toEqual([
      {
        memberId: "roan",
        displayName: "견습 전사 로안",
        grade: "F",
        cost: 0,
        automatic: true,
        unlock: { kind: "new-game" },
      },
      {
        memberId: "mia",
        displayName: "떠돌이 궁수 미아",
        grade: "F",
        cost: 60,
        automatic: false,
        unlock: { kind: "first-clear", stageId: "1-2" },
      },
      {
        memberId: "finn",
        displayName: "골목 도적 핀",
        grade: "F",
        cost: 100,
        automatic: false,
        unlock: { kind: "first-clear", stageId: "1-4" },
      },
      {
        memberId: "lulu",
        displayName: "수습 마법사 루루",
        grade: "F",
        cost: 160,
        automatic: false,
        unlock: { kind: "first-clear", stageId: "1-6" },
      },
      {
        memberId: "eli",
        displayName: "신입 사제 엘리",
        grade: "F",
        cost: 240,
        automatic: false,
        unlock: { kind: "first-clear", stageId: "1-8" },
      },
      {
        memberId: "garon",
        displayName: "방패병 가론",
        grade: "E",
        cost: 400,
        automatic: false,
        unlock: { kind: "first-clear", stageId: "1-10" },
      },
    ]);
  });

  it("memberId로 영입 항목을 조회한다", () => {
    expect(getRegionOneRecruitment("mia")?.cost).toBe(60);
    expect(getRegionOneRecruitment("unknown")).toBeUndefined();
    expect(() => getRegionOneRecruitment("Mia")).toThrow();
  });

  it("중복 memberId를 거부한다", () => {
    const duplicate = [REGION_ONE_RECRUITMENTS[0], REGION_ONE_RECRUITMENTS[0]];
    expect(() => parseRegionOneRecruitments(duplicate)).toThrow(/중복 memberId/);
  });

  it("유효하지 않거나 1지역 밖인 해금 스테이지를 거부한다", () => {
    const base = {
      memberId: "mia",
      displayName: "미아",
      grade: "F",
      cost: 60,
      automatic: false,
    };
    const roan = REGION_ONE_RECRUITMENTS[0];

    expect(() =>
      parseRegionOneRecruitments([roan, { ...base, unlock: { kind: "first-clear", stageId: "1-11" } }]),
    ).toThrow();
    expect(() =>
      parseRegionOneRecruitments([roan, { ...base, unlock: { kind: "first-clear", stageId: "2-1" } }]),
    ).toThrow(/1지역/);
  });

  it("새 게임 자동 영입은 정확히 하나이고 무료여야 한다", () => {
    const invalidRoan = {
      ...REGION_ONE_RECRUITMENTS[0],
      cost: 1,
    };
    expect(() => parseRegionOneRecruitments([invalidRoan])).toThrow(/무료/);

    const noNewGame = [REGION_ONE_RECRUITMENTS[1]];
    expect(() => parseRegionOneRecruitments(noNewGame)).toThrow(/정확히 하나/);
  });

  it.each([null, {}, [], [null]])("잘못된 테이블 입력 %j를 거부한다", (value) => {
    expect(() => parseRegionOneRecruitments(value)).toThrow();
  });
});
