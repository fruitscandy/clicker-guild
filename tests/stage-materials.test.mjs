import assert from "node:assert/strict";
import test from "node:test";

import {
  stageMaterialById,
  stageMaterialFor,
} from "../app/stage-materials.ts";

test("defines a unique regional loot contract for all 30 survivor waves", () => {
  const materials = Array.from({ length: 30 }, (_, index) => stageMaterialFor(index + 1));
  assert.equal(new Set(materials.map((material) => material.id)).size, 30);
  assert.equal(new Set(materials.map((material) => material.name)).size, 30);
  assert.equal(materials[0].iconIndex, 0);
  assert.equal(materials[29].iconIndex, 9);
  assert.equal(materials[2].boss, true);
  assert.equal(materials[1].boss, false);
  assert.equal(new Set(materials.map((material) => material.soundProfile)).size, 10);
});

test("round-trips material ids and rejects ids outside the stage range", () => {
  const material = stageMaterialFor(22);
  assert.deepEqual(stageMaterialById(material.id), material);
  assert.equal(stageMaterialById("stage-material-000"), null);
  assert.equal(stageMaterialById("stage-material-031"), null);
  assert.equal(stageMaterialById("gold"), null);
});

test("uses three brisk loot grades per region without weapon recipes", () => {
  const region = [stageMaterialFor(10), stageMaterialFor(11), stageMaterialFor(12)];
  assert.deepEqual(region.map((material) => material.localStage), [1, 2, 3]);
  assert.deepEqual(region.map((material) => material.variant), [0, 1, 2]);
  assert.ok(region[2].rewardAmount > region[1].rewardAmount);
});
