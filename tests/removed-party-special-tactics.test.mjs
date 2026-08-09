import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("removes legacy party tactics and boss token resources while preserving special research", async () => {
  const [game, styles, developerResources, developerPanel, forge, forgeStyles, specialResearch] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/developer-resources.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/DeveloperResourcePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of [styles, developerResources, developerPanel, forge, forgeStyles]) {
    assert.doesNotMatch(source, /bossTokens|보스 증표|파티 특수 전술|special-tactic|boss-token/);
  }
  assert.doesNotMatch(game, /specials\.(double|command|auto)|unlockSpecial|specialInfo|보스 증표|파티 특수 전술|special-tactic|boss-token/);
  assert.match(game, /delete loaded\.bossTokens/);
  assert.match(game, /delete loaded\.specials/);
  assert.match(game, /<TavernHall/);
  assert.match(game, /<SpecialResearchPanel/);
  assert.match(specialResearch, /SPECIAL_RESEARCH_NODES/);
});
