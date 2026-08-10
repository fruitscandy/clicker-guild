import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audioSource = await readFile(new URL("../app/battle-audio.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../app/Game.tsx", import.meta.url), "utf8");

test("growth, combat proc, and rare reward sounds are exported", () => {
  for (const soundName of ["playProgressionSound", "playWeaponCraftSound", "playGuildHallUpgradeSound", "playCombatProcSound", "playRareRewardSound"]) {
    assert.match(audioSource, new RegExp(`export function ${soundName}\\b`));
  }
  for (const kind of ["weapon-craft", "research-unlock", "guild-hall"]) {
    assert.match(audioSource, new RegExp(`\\b${kind}\\b`));
  }
  assert.match(audioSource, /\bfirst-clear\b/);
  assert.doesNotMatch(audioSource, /\bgear\b/);
});

test("dense proc combinations select one priority sound and rate-limit it", () => {
  assert.match(audioSource, /proc\.shockwave\s*\? "shockwave"\s*:\s*proc\.critical\s*\? "critical"/);
  assert.match(audioSource, /start - lastCombatProcAt < 0\.075/);
  assert.match(audioSource, /markEventSound\(`combat:\$\{primary\}`\)/);
});

test("new event sounds share global settings and expose a browser smoke marker", () => {
  assert.match(audioSource, /playWhenAudioIsReady/);
  assert.match(audioSource, /getSfxOutput\(context\)/);
  assert.match(audioSource, /effectiveSfxVolume/);
  assert.match(audioSource, /dataset\.lastEventSfx/);
  assert.match(audioSource, /guild:event-sfx/);
});

test("game event integration only accents meaningful successful states", () => {
  assert.match(gameSource, /playWeaponCraftSound\(nextLevel\)/);
  assert.match(gameSource, /playGuildHallUpgradeSound\(nextHallStage\.level\)/);
  assert.match(gameSource, /playProgressionSound\("research-unlock"/);
  assert.match(gameSource, /if \(targets\.length\) playCombatProcSound/);
  assert.match(gameSource, /if \(firstClear\) playRareRewardSound\("first-clear"\)/);
  assert.doesNotMatch(gameSource, /gearTarget|gotGear|effectiveUpgrades\.loot/);
  assert.doesNotMatch(gameSource, /playProgressionSound\("special-tactic"|"boss-token"|파티 특수 전술|보스 증표/);
  assert.doesNotMatch(audioSource, /special-tactic|boss-token/);
});

test("weapon crafting and guild hall upgrades use dedicated boosted mixes", () => {
  assert.match(audioSource, /const WEAPON_CRAFT_MIX_GAIN = 1\.5/);
  assert.match(audioSource, /const GUILD_HALL_MIX_GAIN = 1\.55/);
  assert.match(audioSource, /kind === "weapon-craft"[\s\S]*createSfxMixBus\(context, WEAPON_CRAFT_MIX_GAIN\)/);
  assert.match(audioSource, /kind === "guild-hall"[\s\S]*createSfxMixBus\(context, GUILD_HALL_MIX_GAIN\)/);
});
