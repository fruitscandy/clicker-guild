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

test("rapid clicks keep independent weapon effects alive until their own animation ends", () => {
  assert.match(gameSource, /const \[activeHitFxs, setActiveHitFxs\] = useState<ClickAttackFx\[\]>\(\[\]\)/);
  assert.match(gameSource, /activeHitFxs\.map\(\(effect\) => <WeaponAttackEffect/);
  assert.match(gameSource, /current\.filter\(\(effect\) => effect\.id !== effectId\)/);
  assert.match(gameSource, /MAX_SIMULTANEOUS_CLICK_FX = 48/);
});

test("all 15 weapons select one unique effect motif without tier accumulation", () => {
  const motifNames = [...effectSource.matchAll(/motif: "(motif[A-Za-z]+)"/g)].map((match) => match[1]);

  assert.equal(effectSource.match(/\{ key:/g)?.length, 15);
  assert.equal(motifNames.length, 15);
  assert.equal(new Set(motifNames).size, 15);
  assert.match(effectSource, /data-weapon-tier/);
  assert.match(effectSource, /data-effect-motif/);
  assert.match(effectSource, /styles\[weaponEffect\.motif\]/);
  assert.doesNotMatch(effectSource, /tier\s*>=/);
  assert.doesNotMatch(effectSource, /masterworkCrest|legendaryArc|forgeStamp/);

  for (const motifName of motifNames) {
    assert.match(effectStyles, new RegExp(`\\.${motifName}\\b`));
  }

  for (const combatState of ["critical", "shockwave"]) {
    assert.match(effectSource, new RegExp(combatState, "i"));
  }
  assert.doesNotMatch(effectSource, /combo|execution|momentum/i);
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
