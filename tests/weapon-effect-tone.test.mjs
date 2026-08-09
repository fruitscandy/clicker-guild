import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const gameSource = await readFile(new URL("../app/Game.tsx", import.meta.url), "utf8");
const effectSource = await readFile(new URL("../app/WeaponAttackEffect.tsx", import.meta.url), "utf8");
const effectStyles = await readFile(new URL("../app/WeaponAttackEffect.module.css", import.meta.url), "utf8");

const assetPaths = [
  "../public/assets/vfx/weapon/steel-slash.webp",
  "../public/assets/vfx/weapon/impact-chips.webp",
  "../public/assets/vfx/weapon/ground-scar.webp",
];

test("the battle field mounts only the restrained weapon effect component", () => {
  assert.match(gameSource, /import \{ WeaponAttackEffect \}/);
  assert.match(gameSource, /<WeaponAttackEffect/);

  for (const retiredMarker of [
    "field-click-fx",
    "fx-vivid-stage",
    "fx-asset-rune",
    "fx-signature-mark",
    "critical-impact-burst",
    "shockwave-screen-impact",
  ]) {
    assert.doesNotMatch(gameSource, new RegExp(retiredMarker));
  }
});

test("all 15 weapon tiers share one material language with clear prestige steps", () => {
  assert.equal(effectSource.match(/\{ primary:/g)?.length, 15);
  assert.match(effectSource, /data-weapon-tier/);
  assert.match(effectSource, /data-effect-grade/);
  assert.match(effectSource, /tier >= 5.*forgeStamp/);
  assert.match(effectSource, /tier >= 10.*masterworkCrest/);
  assert.match(effectSource, /tier >= 13.*legendaryArc/);

  for (const combatState of ["combo", "critical", "execution", "shockwave", "momentum"]) {
    assert.match(effectSource, new RegExp(combatState, "i"));
  }
});

test("the effect uses physical painted assets without the retired neon libraries", () => {
  for (const assetName of ["steel-slash.webp", "impact-chips.webp", "ground-scar.webp"]) {
    assert.match(effectStyles, new RegExp(assetName.replace(".", "\\.")));
  }

  assert.doesNotMatch(effectStyles, /mix-blend-mode:\s*screen/i);
  assert.doesNotMatch(effectStyles, /\/assets\/vfx\/(?:vivid|kenney)\//i);
  assert.match(effectStyles, /mix-blend-mode:\s*multiply/i);
  assert.match(effectStyles, /@media \(max-width: 560px\)/);
  assert.match(effectStyles, /prefers-reduced-motion/);
});

test("the optimized effect textures remain compact WebP assets", async () => {
  for (const relativePath of assetPaths) {
    const url = new URL(relativePath, import.meta.url);
    const [header, metadata] = await Promise.all([
      readFile(url),
      stat(url),
    ]);

    assert.equal(header.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(header.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(metadata.size < 110_000, `${relativePath} should stay below 110 KB`);
  }
});
