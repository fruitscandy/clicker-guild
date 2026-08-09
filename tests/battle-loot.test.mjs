import assert from "node:assert/strict";
import test from "node:test";

import {
  createBattleLootPlan,
  createGoldDropPlan,
  createMaterialDropPlan,
  goldDropFormForStage,
  goldLootStaggerMs,
  goldLootSweepDuration,
  revealedGoldDrops,
} from "../app/battle-loot.ts";
import { stageMaterialFor } from "../app/stage-materials.ts";

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
  assert.ok(plan.every((drop) => drop.form === "coins" && drop.soundProfile === "coin"));
});

test("upgrades gold visuals and sounds from coins to pouches and cash bundles", () => {
  assert.equal(goldDropFormForStage(1), "coins");
  assert.equal(goldDropFormForStage(10), "coins");
  assert.equal(goldDropFormForStage(11), "coin-pouch");
  assert.equal(goldDropFormForStage(20), "coin-pouch");
  assert.equal(goldDropFormForStage(21), "cash-bundle");
  assert.equal(goldDropFormForStage(30), "cash-bundle");

  const pouchPlan = createGoldDropPlan(monsters, 500, 11);
  const bundlePlan = createGoldDropPlan(monsters, 2_000, 21);
  assert.ok(pouchPlan.every((drop) => drop.soundProfile === "coin-pouch" && drop.variant >= 4 && drop.variant <= 7));
  assert.ok(bundlePlan.every((drop) => drop.soundProfile === "cash-bundle" && drop.variant >= 8 && drop.variant <= 11));
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
  assert.equal(goldLootStaggerMs(88), 42);
  assert.ok(goldLootSweepDuration(88) < 5_000);
});

test("adds a stage material without changing the complete gold reward", () => {
  const material = stageMaterialFor(17);
  const materialPlan = createMaterialDropPlan(monsters, material);
  const fullPlan = createBattleLootPlan(monsters, 137, material);
  assert.equal(materialPlan.reduce((sum, drop) => sum + drop.amount, 0), material.rewardAmount);
  assert.equal(fullPlan.filter((drop) => drop.kind === "gold").reduce((sum, drop) => sum + drop.amount, 0), 137);
  assert.equal(fullPlan.filter((drop) => drop.kind === "material").reduce((sum, drop) => sum + drop.amount, 0), material.rewardAmount);
  assert.ok(materialPlan.every((drop) => drop.resourceId === material.id));
  assert.ok(fullPlan.filter((drop) => drop.kind === "gold").every((drop) => drop.form === "coin-pouch"));
});
