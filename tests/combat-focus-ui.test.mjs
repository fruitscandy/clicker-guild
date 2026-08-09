import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("combat focus mode keeps a minimal stage, timer, and resource HUD", async () => {
  const [page, focusStyles, weaponStyles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/combat-focus.css", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/WeaponArt.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import "\.\/combat-focus\.css";/);

  for (const selector of [
    ".battle-mode .battle-sidebar",
    ".battle-mode .swarm-hud",
    ".battle-mode .member-weapon-fx > small",
    ".battle-mode .loot-drop > em",
  ]) {
    assert.ok(focusStyles.includes(selector), `${selector} must be hidden during combat`);
  }
  assert.match(focusStyles, /\.battle-mode > \.topbar \{[\s\S]*?display: flex;/);
  assert.match(focusStyles, /\.battle-mode > \.topbar \.resources \{[\s\S]*?justify-content: flex-end;/, "resource HUD should use the existing resource row");
  assert.match(focusStyles, /\.battle-mode \.field-toolbar \{[\s\S]*?position: relative;/);
  assert.match(focusStyles, /\.battle-mode \.battle-timer \{[\s\S]*?min-width:/);
  assert.doesNotMatch(focusStyles, /\.battle-mode \.loot-tally,[\s\S]*?display: none;/);
  assert.match(focusStyles, /\.battle-mode \.battle-layout \{\s*display: block;/);
  assert.match(focusStyles, /\.battle-mode \.arena \{[\s\S]*?min-height: max\(560px, calc\(100svh - 114px\)\);/);

  const baseCursor = weaponStyles.match(/\.cursor \{[\s\S]*?width: (\d+)px;\s*height: (\d+)px;/);
  const largestCursor = weaponStyles.match(/\.cursorTier4 \{ width: (\d+)px; height: (\d+)px; \}/);
  assert.ok(baseCursor);
  assert.ok(largestCursor);
  assert.ok(Number(baseCursor[1]) < 88 && Number(baseCursor[2]) < 128);
  assert.ok(Number(largestCursor[1]) < 112 && Number(largestCursor[2]) < 160);
});
