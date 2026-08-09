import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("opens the stage map directly from the hunting ground", async () => {
  const game = await readFile(new URL("../app/Game.tsx", import.meta.url), "utf8");

  assert.match(game, /function openHuntingGround\(\) \{[\s\S]*?setStagePicker\(true\);[\s\S]*?\}/);
  assert.match(game, /<TerritoryHuntingGround[\s\S]*?active=\{stagePicker\}[\s\S]*?onOpen=\{openHuntingGround\}/);
  assert.doesNotMatch(game, /<HuntingGroundPanel|huntingGroundOpen/);
});

test("starts the selected stage without returning to guild management", async () => {
  const [game, stageMap] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/stage-map/StageMap.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(game, /<StageMap[\s\S]*?onSelectStage=\{startStage\}[\s\S]*?onClose=\{\(\) => setStagePicker\(false\)\}/);
  assert.match(game, /function startStage\(stageNumber = stage\.stage\)[\s\S]*?setBattleActive\(true\);[\s\S]*?setStagePicker\(false\);/);
  assert.match(stageMap, /disabled=\{state === "locked"\}/);
});
