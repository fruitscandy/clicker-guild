import { describe, expect, it, vi } from "vitest";

import {
  BattleResultIdempotencyGuard,
  FakeBattleController,
  type BattleEvent,
  type BattleStartInput,
} from "../../../src/integration/combat/index.ts";

const createInput = (battleId = "battle-001"): BattleStartInput => ({
  battleId,
  stageId: "stage-01-01",
  monster: {
    monsterId: "small-green-slime",
    maxHp: 100,
    attack: 2,
    attackIntervalMs: 2_000,
    rewardGold: 15,
  },
  party: [
    {
      memberId: "roan",
      growth: {
        level: 3,
        rankId: "F",
        attack: 12,
        maxHp: 80,
        attackIntervalMs: 1_200,
      },
      skillIds: ["heavy-strike"],
    },
  ],
  player: { clickDamage: 10 },
  settings: {
    seed: 42,
    speedMultiplier: 1,
    autoUseSkills: true,
    reducedMotion: false,
    muted: true,
  },
});

const collectEvents = (controller: FakeBattleController): BattleEvent[] => {
  const events: BattleEvent[] = [];
  controller.subscribe((event) => events.push(event));
  return events;
};

describe("FakeBattleController terminal results", () => {
  it("emits a deterministic victory in contract order", () => {
    const controller = new FakeBattleController();
    const events = collectEvents(controller);

    controller.start(createInput());
    controller.advanceBy(750);
    controller.triggerSkill("roan", "heavy-strike", 40);
    const result = controller.resolveVictory();

    expect(result).toEqual({
      type: "victory",
      battleId: "battle-001",
      stageId: "stage-01-01",
      elapsedMs: 750,
      rewardGold: 15,
    });
    expect(events.map((event) => event.type)).toEqual([
      "started",
      "skillTriggered",
      "damageApplied",
      "damageApplied",
      "ended",
    ]);
    expect(controller.status).toBe("completed");
  });

  it("emits defeat before its terminal result", () => {
    const controller = new FakeBattleController();
    const events = collectEvents(controller);

    controller.start(createInput("battle-defeat"));
    controller.advanceBy(2_000);
    const result = controller.resolveDefeat("time-limit");

    expect(result.type).toBe("defeat");
    expect(result).toMatchObject({
      battleId: "battle-defeat",
      elapsedMs: 2_000,
      reason: "time-limit",
    });
    expect(events.map((event) => event.type)).toEqual([
      "started",
      "partyDefeated",
      "ended",
    ]);
  });

  it("emits an aborted terminal result without a victory or defeat event", () => {
    const controller = new FakeBattleController();
    const events = collectEvents(controller);

    controller.start(createInput("battle-aborted"));
    controller.advanceBy(125);
    controller.abort("superseded");

    expect(events.map((event) => event.type)).toEqual(["started", "ended"]);
    expect(events.at(-1)).toEqual({
      type: "ended",
      result: {
        type: "aborted",
        battleId: "battle-aborted",
        stageId: "stage-01-01",
        elapsedMs: 125,
        reason: "superseded",
      },
    });
  });
});

describe("event lifecycle", () => {
  it("unsubscribes a listener idempotently", () => {
    const controller = new FakeBattleController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    unsubscribe();
    unsubscribe();
    controller.start(createInput());

    expect(listener).not.toHaveBeenCalled();
    expect(controller.subscriberCount).toBe(0);
  });

  it("aborts an active battle and clears every listener on dispose", () => {
    const controller = new FakeBattleController();
    const events = collectEvents(controller);
    controller.start(createInput("battle-disposed"));

    controller.dispose();

    expect(events.map((event) => event.type)).toEqual(["started", "ended"]);
    expect(events.at(-1)).toMatchObject({
      type: "ended",
      result: { type: "aborted", reason: "disposed" },
    });
    expect(controller.status).toBe("disposed");
    expect(controller.subscriberCount).toBe(0);
    expect(() => controller.start(createInput("next"))).toThrow("disposed");
    expect(() => controller.subscribe(() => undefined)).toThrow("disposed");
  });
});

describe("BattleResultIdempotencyGuard", () => {
  it("handles only the first terminal result for a battleId", () => {
    const guard = new BattleResultIdempotencyGuard();
    const handler = vi.fn();
    const result = {
      type: "victory" as const,
      battleId: "battle-duplicate",
      stageId: "stage-01-01",
      elapsedMs: 500,
      rewardGold: 15,
    };

    expect(guard.runOnce(result, handler)).toBe(true);
    expect(guard.runOnce(result, handler)).toBe(false);
    expect(
      guard.runOnce(
        {
          type: "aborted",
          battleId: result.battleId,
          stageId: result.stageId,
          elapsedMs: 501,
          reason: "superseded",
        },
        handler,
      ),
    ).toBe(false);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(guard.hasProcessed(result.battleId)).toBe(true);
  });

  it("allows a retry when the first handler fails", () => {
    const guard = new BattleResultIdempotencyGuard();
    const result = {
      type: "defeat" as const,
      battleId: "battle-retry",
      stageId: "stage-01-01",
      elapsedMs: 900,
      reason: "party-defeated" as const,
    };

    expect(() =>
      guard.runOnce(result, () => {
        throw new Error("temporary save failure");
      }),
    ).toThrow("temporary save failure");
    expect(guard.hasProcessed(result.battleId)).toBe(false);
    expect(guard.runOnce(result, () => undefined)).toBe(true);
  });
});
