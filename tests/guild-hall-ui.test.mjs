import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("guild territory art and hall upgrade UI share the game tone", async () => {
  const [hub, styles, huntingStyles, game, backdrop, hallSprites] = await Promise.all([
    readFile(new URL("../app/guild-hub/GuildBuildingHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/HuntingGround.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/assets/guild/guild-territory-backdrop-v1.png", import.meta.url)),
    readFile(new URL("../public/assets/guild/guild-growth-sprites-v1.png", import.meta.url)),
  ]);

  assert.match(styles, /url\("\/assets\/guild\/guild-territory-backdrop-v1\.png"\)/);
  assert.doesNotMatch(hub, /styles\.(?:sky|mountain|road)/);
  assert.doesNotMatch(hub, /styles\.sceneHint/);
  assert.match(styles, /\.buildingLabel \{[\s\S]*?opacity: 0;[\s\S]*?visibility: hidden;/);
  assert.match(styles, /\.mainHall:hover \.buildingLabel,[\s\S]*?\.facility:focus-visible \.buildingLabel \{[\s\S]*?opacity: 1;[\s\S]*?visibility: visible;/);
  assert.match(huntingStyles, /\.gateLabel \{[\s\S]*?opacity: 0;[\s\S]*?visibility: hidden;/);
  assert.match(huntingStyles, /\.gate:hover \.gateLabel,[\s\S]*?\.gate:focus-visible \.gateLabel \{[\s\S]*?opacity: 1;[\s\S]*?visibility: visible;/);
  assert.match(game, /<h3>시설 해금 현황<\/h3>/, "the legacy panel remains isolated in read-only Game markup");
  assert.match(styles, /:global\(\.facility-hall \.guild-hall-management > \.upgrade-panel\) \{\s*display: none;/);
  assert.match(styles, /:global\(\.facility-hall \.guild-hall-management\) \{\s*grid-template-columns: 1fr;/);
  assert.match(styles, /:global\(\.facility-hall \.hall-upgrade-panel\) \{[\s\S]*?linear-gradient[\s\S]*?border-top: 2px solid #a66a37;/);
  assert.match(styles, /:global\(\.facility-hall \.hall-upgrade-button\) \{[\s\S]*?background: linear-gradient/);
  assert.match(hub, /HALL_SETTLED_SPRITES = \[0, 2, 4, 5\]/, "four hall levels should settle on sprites 1, 3, 5, and 6");
  assert.match(hub, /HALL_TRANSITION_SPRITES = \[0, 1, 3, 4\]/, "upgrade animation should reuse the skipped sprites");
  assert.deepEqual(
    [...new Set([0, 2, 4, 5, 0, 1, 3, 4])].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5],
    "settled and transition states should cover all six commissioned hall sprites",
  );
  assert.match(styles, /background-position: var\(--hub-transition-x\) var\(--hub-transition-y\)/);
  assert.match(styles, /\.level-chip\) \{\s*display: none;/, "the retired six-level label should not be exposed");
  assert.doesNotMatch(styles, /\.panel-title::after\)|MAX LV\.4/, "the redundant hall level cap should stay hidden");

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(backdrop.subarray(0, 8).equals(pngSignature));
  assert.ok(backdrop.readUInt32BE(16) >= 1600, "territory backdrop should be wide enough for desktop cover rendering");
  assert.ok(backdrop.readUInt32BE(20) >= 900, "territory backdrop should retain enough vertical detail");
  assert.ok(hallSprites.subarray(0, 8).equals(pngSignature));
  assert.equal(hallSprites.readUInt32BE(16) * 2, hallSprites.readUInt32BE(20) * 3, "hall sprites should remain a 3x2 square-cell sheet");
});
