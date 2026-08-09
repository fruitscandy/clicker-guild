import assert from "node:assert/strict";
import test from "node:test";

import {
  BOSS_BATTLE_SECONDS,
  NORMAL_BATTLE_SECONDS,
  SHORT_RUN_TARGET_MINUTES,
  onePassCombatSeconds,
  shortRunStageGold,
} from "../app/economy-balance.ts";
import { allStageMaterials, REGION_MATERIAL_REWARDS, weaponMaterialRecipe } from "../app/stage-materials.ts";

test("keeps the 30-wave combat budget below the 20-minute session cap", () => {
  assert.equal(NORMAL_BATTLE_SECONDS, 26);
  assert.equal(BOSS_BATTLE_SECONDS, 36);
  assert.equal(onePassCombatSeconds(), 880);
  assert.ok(onePassCombatSeconds() < SHORT_RUN_TARGET_MINUTES * 60);
  assert.ok(SHORT_RUN_TARGET_MINUTES * 60 - onePassCombatSeconds() >= 300);
});

test("a single regional clear funds every material recipe without repeat farming", () => {
  const regionalSupply = REGION_MATERIAL_REWARDS.reduce((sum, reward) => sum + reward, 0);
  const recipes = Array.from({ length: 14 }, (_, index) => weaponMaterialRecipe(index + 1));
  const demand = new Map();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      demand.set(ingredient.material.id, (demand.get(ingredient.material.id) ?? 0) + ingredient.amount);
    }
  }

  for (const material of allStageMaterials()) {
    assert.ok((demand.get(material.id) ?? 0) > 0, `${material.name} needs a forge use`);
    assert.ok((demand.get(material.id) ?? 0) <= regionalSupply, `${material.name} exceeds one-pass supply`);
  }

  // The final weapon can be forged before stage 30: stages 28 and 29 already
  // provide 7 dragon scales against a six-scale recipe.
  assert.ok(REGION_MATERIAL_REWARDS[0] + REGION_MATERIAL_REWARDS[1] >= demand.get("stage-material-family-010"));
});

test("one clear preserves the compact but generous gold curve", () => {
  const onePassGold = Array.from({ length: 30 }, (_, index) => {
    const stage = index + 1;
    return shortRunStageGold(Math.floor(index / 3), (stage - 1) % 3 + 1);
  }).reduce((sum, gold) => sum + gold, 160);

  assert.equal(onePassGold, 292660);
  assert.ok(onePassGold >= 281255, "one clear should fund all core weapon, research, and hall costs");
  assert.ok(onePassGold < 310000, "gold should still require choices during the run");
});
