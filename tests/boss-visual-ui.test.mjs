import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("boss monsters use restrained scale and color hierarchy without a crown", async () => {
  const [game, focusStyles] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/combat-focus.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /monster-\$\{monster\.kind\}/, "monster kind should remain available as a styling hook");
  assert.match(focusStyles, /\.battle-mode \.pack-monster\.monster-leader \.leader-mark \{\s*display: none;/);
  assert.match(focusStyles, /\.battle-mode \.pack-monster\.monster-leader::before \{[\s\S]*?radial-gradient[\s\S]*?bossPresence/);
  assert.match(focusStyles, /\.monster-leader:not\(\.is-struck\):not\(\.is-defeated\) \.pack-monster-art \{[\s\S]*?saturate\([\s\S]*?hue-rotate\([\s\S]*?drop-shadow\(/);

  const bossFrame = focusStyles.match(/\.monster-leader \.pack-monster-art-frame \{[\s\S]*?width: (\d+)px;\s*height: (\d+)px;/);
  const bossShadow = focusStyles.match(/\.monster-leader \.pack-shadow \{[\s\S]*?width: (\d+)px;\s*height: (\d+)px;/);
  assert.ok(bossFrame);
  assert.ok(bossShadow);
  assert.ok(Number(bossFrame[1]) > 108 && Number(bossFrame[1]) <= 132, "boss art should be clearly but moderately larger");
  assert.ok(Number(bossFrame[2]) > 108 && Number(bossFrame[2]) <= 132, "boss art should be clearly but moderately taller");
  assert.ok(Number(bossShadow[1]) > 58 && Number(bossShadow[1]) <= 82, "boss shadow should support the larger silhouette");
  assert.ok(Number(bossShadow[2]) > 15 && Number(bossShadow[2]) <= 22, "boss shadow should stay restrained");
});
