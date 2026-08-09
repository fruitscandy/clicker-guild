import assert from "node:assert/strict";
import test from "node:test";

import {
  canAffordWeaponRecipe,
  consumeWeaponRecipe,
  stageMaterialById,
  stageMaterialFor,
  weaponMaterialRecipe,
} from "../app/stage-materials.ts";

test("defines a unique material contract for all 100 stages", () => {
  const materials = Array.from({ length: 100 }, (_, index) => stageMaterialFor(index + 1));
  assert.equal(new Set(materials.map((material) => material.id)).size, 100);
  assert.equal(new Set(materials.map((material) => material.name)).size, 100);
  assert.equal(materials[0].iconIndex, 0);
  assert.equal(materials[99].iconIndex, 9);
  assert.equal(materials[9].boss, true);
  assert.equal(materials[8].boss, false);
  assert.equal(new Set(materials.map((material) => material.soundProfile)).size, 10);
});

test("round-trips material ids and rejects ids outside the stage range", () => {
  const material = stageMaterialFor(42);
  assert.deepEqual(stageMaterialById(material.id), material);
  assert.equal(stageMaterialById("stage-material-000"), null);
  assert.equal(stageMaterialById("gold"), null);
});

test("weapon recipes consume their exact stage material and preserve other inventory", () => {
  const recipe = weaponMaterialRecipe(4);
  assert.ok(recipe);
  const inventory = { [recipe.material.id]: recipe.amount + 2, "stage-material-001": 99 };
  assert.equal(canAffordWeaponRecipe(inventory, recipe), true);
  const consumed = consumeWeaponRecipe(inventory, recipe);
  assert.equal(consumed[recipe.material.id], 2);
  assert.equal(consumed["stage-material-001"], 99);
  assert.equal(consumeWeaponRecipe({}, recipe), null);
});
