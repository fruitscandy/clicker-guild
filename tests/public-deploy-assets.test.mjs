import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("upgrade artwork bypasses the unsupported hosted image optimizer", async () => {
  const [game, researchMap, developerPanel] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/DeveloperUpgradePanel.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of [game, researchMap, developerPanel]) {
    const upgradeImages = source.match(/<Image[^>]+(?:UPGRADE_ICON_BY_KEY|src=\{icon\})[^>]*\/>/g) ?? [];
    assert.ok(upgradeImages.length > 0, "expected at least one upgrade image");
    for (const image of upgradeImages) assert.match(image, /\bunoptimized\b/);
  }
});
