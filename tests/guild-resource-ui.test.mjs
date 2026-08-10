import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("guild screens share one resource HUD and keep forge actions focused", async () => {
  const [game, globalStyles, inventoryStyles, forge, forgeStyles] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/MaterialInventory.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /<GameNoticeDialog notice=\{notice\}/);
  assert.doesNotMatch(game, /setToast|className="toast"/);
  assert.doesNotMatch(globalStyles, /\.toast(?:\s|,|\{)/);
  assert.doesNotMatch(game, /첫 몬스터를 눌러 길드의 모험을 시작하세요/);

  assert.match(globalStyles, /\.resources \{[\s\S]*?background: linear-gradient[\s\S]*?border: 1px solid #3f4d44;/);
  assert.match(inventoryStyles, /\.trigger \{[\s\S]*?background: transparent;[\s\S]*?border: 0;[\s\S]*?box-shadow: none;/);
  assert.match(inventoryStyles, /\.iconStack i \{[\s\S]*?border: 0;[\s\S]*?box-shadow: none;/);
  assert.match(inventoryStyles, /\.iconStack i::after \{ display: none; \}/);
  assert.match(inventoryStyles, /\.materialIcon \{[\s\S]*?background-color: transparent;[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?box-shadow: none;/);
  assert.match(inventoryStyles, /\.materialIcon::after \{ display: none; \}/);
  assert.match(globalStyles, /\.stage-material-icon \{[\s\S]*?background-color: transparent;[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?box-shadow: none;/);
  assert.match(globalStyles, /\.stage-material-icon::after \{ display: none; \}/);

  assert.doesNotMatch(forge, /styles\.(?:resources|recipeResource|equippedSummary|materialVault)/);
  assert.doesNotMatch(forge, /10종 강화 소재|다음 제작 재료|PLAYER WEAPON · CURRENT/);
  const details = forge.slice(forge.indexOf(`<aside className={styles.weaponDetails}>`), forge.indexOf("</aside>") + 8);
  assert.match(details, /styles\.costPanel/);
  assert.match(details, /styles\.craftButton/);
  assert.ok(details.indexOf("styles.craftButton") > details.indexOf("</dl>"));
  assert.match(forgeStyles, /\.craftButton,.masterwork \{[\s\S]*?linear-gradient[\s\S]*?box-shadow:/);
  assert.match(forgeStyles, /\.costMaterialIcon \{[\s\S]*?background-color: transparent;[\s\S]*?border: 0;[\s\S]*?box-shadow: none;/);
  assert.match(forgeStyles, /\.costMaterialIcon::after \{ display: none; \}/);
});
