import assert from "node:assert/strict";
import test from "node:test";

import {
  allStageMaterials,
  canAffordWeaponRecipe,
  consumeWeaponRecipe,
  migrateMaterialInventory,
  stageMaterialById,
  stageMaterialFor,
  weaponMaterialRecipe,
  weaponTiersUsingMaterial,
} from "../app/stage-materials.ts";

test("compresses 30 waves into 10 memorable regional materials", () => {
  const waves = Array.from({ length: 30 }, (_, index) => stageMaterialFor(index + 1));
  assert.equal(new Set(waves.map((material) => material.id)).size, 10);
  assert.equal(new Set(waves.map((material) => material.name)).size, 10);
  assert.equal(new Set(waves.map((material) => material.soundProfile)).size, 10);
  assert.equal(allStageMaterials().length, 10);

  for (let region = 0; region < 10; region += 1) {
    const localWaves = waves.slice(region * 3, region * 3 + 3);
    assert.equal(new Set(localWaves.map((material) => material.id)).size, 1);
    assert.deepEqual(localWaves.map((material) => material.rewardAmount), [3, 4, 7]);
    assert.deepEqual(localWaves.map((material) => material.localStage), [1, 2, 3]);
    assert.equal(localWaves[2].boss, true);
  }
});

test("round-trips family ids and folds legacy 30-wave saves without loss", () => {
  const material = stageMaterialFor(22);
  assert.deepEqual(stageMaterialById(material.id), material);
  assert.equal(stageMaterialById("stage-material-family-000"), null);
  assert.equal(stageMaterialById("stage-material-family-011"), null);
  assert.equal(stageMaterialById("gold"), null);

  const migrated = migrateMaterialInventory({
    "stage-material-001": 2,
    "stage-material-002": 5,
    "stage-material-003": 7,
    "stage-material-family-001": 3,
    "stage-material-031": 99,
    gold: 999,
  });
  assert.deepEqual(migrated, { "stage-material-family-001": 17 });
});

test("uses every material in the 14-step forge and consumes multi-material recipes atomically", () => {
  const recipes = Array.from({ length: 14 }, (_, index) => weaponMaterialRecipe(index + 1));
  const usedIds = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.material.id)));
  assert.equal(recipes.filter(Boolean).length, 14);
  assert.equal(usedIds.size, 10);
  assert.ok(allStageMaterials().every((material) => weaponTiersUsingMaterial(material.id).length > 0));
  assert.equal(weaponMaterialRecipe(15), null);

  const finalRecipe = recipes[13];
  assert.deepEqual(finalRecipe.ingredients.map((ingredient) => ingredient.material.familyName), ["마혈 흑요석", "고룡 비늘"]);
  const exactInventory = Object.fromEntries(finalRecipe.ingredients.map((ingredient) => [ingredient.material.id, ingredient.amount]));
  assert.equal(canAffordWeaponRecipe(exactInventory, finalRecipe), true);
  assert.deepEqual(consumeWeaponRecipe(exactInventory, finalRecipe), {
    "stage-material-family-009": 0,
    "stage-material-family-010": 0,
  });

  const shortInventory = { ...exactInventory, "stage-material-family-010": 5 };
  assert.equal(canAffordWeaponRecipe(shortInventory, finalRecipe), false);
  assert.equal(consumeWeaponRecipe(shortInventory, finalRecipe), null);
});
