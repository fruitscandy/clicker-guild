import assert from "node:assert/strict";
import test from "node:test";

import {
  createGoldDropPlan,
  goldLootStaggerMs,
  goldLootSweepDuration,
  revealedGoldDrops,
} from "../app/battle-loot.ts";

const monsters = [
  { id: "swarm-a", x: 30, y: 25, kind: "swarm" },
  { id: "mystic-a", x: 55, y: 48, kind: "mystic" },
  { id: "brute-a", x: 78, y: 67, kind: "brute" },
  { id: "leader-a", x: 92, y: 88, kind: "leader" },
];

test("distributes the complete stage reward across monster drops", () => {
  const plan = createGoldDropPlan(monsters, 137);
  assert.equal(plan.reduce((sum, drop) => sum + drop.amount, 0), 137);
  assert.ok(plan[3].amount > plan[2].amount);
  assert.ok(plan[2].amount > plan[0].amount);
  assert.ok(plan.every((drop) => drop.x >= 7 && drop.x <= 93));
  assert.ok(plan.every((drop) => drop.y >= 14 && drop.y <= 90));
});

test("reveals drops in kill order and keeps their defeat time", () => {
  const plan = createGoldDropPlan(monsters, 80);
  const revealed = revealedGoldDrops(plan, new Map([
    ["leader-a", 300],
    ["swarm-a", 100],
    ["brute-a", 200],
  ]));
  assert.deepEqual(revealed.map((drop) => drop.monsterId), ["swarm-a", "brute-a", "leader-a"]);
  assert.deepEqual(revealed.map((drop) => drop.droppedAt), [100, 200, 300]);
});

test("keeps a brisk but bounded collection cadence for large packs", () => {
  assert.equal(goldLootStaggerMs(1), 0);
  assert.equal(goldLootStaggerMs(24), 42);
  assert.ok(goldLootSweepDuration(24) < 2_100);
});
