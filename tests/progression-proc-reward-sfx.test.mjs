import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audioSource = await readFile(new URL("../app/battle-audio.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../app/Game.tsx", import.meta.url), "utf8");

test("growth, combat proc, and rare reward sounds are exported", () => {
  for (const soundName of ["playProgressionSound", "playCombatProcSound", "playRareRewardSound"]) {
    assert.match(audioSource, new RegExp(`export function ${soundName}\\b`));
  }
  for (const kind of ["weapon-craft", "research-unlock", "guild-hall", "special-tactic"]) {
    assert.match(audioSource, new RegExp(`\\b${kind}\\b`));
  }
  for (const kind of ["gear", "first-clear", "boss-token"]) {
    assert.match(audioSource, new RegExp(`\\b${kind}\\b`));
  }
});

test("dense proc combinations select one priority sound and rate-limit it", () => {
  assert.match(audioSource, /proc\.execution[\s\S]*proc\.shockwave[\s\S]*proc\.critical[\s\S]*proc\.combo[\s\S]*proc\.momentumMaxed/);
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
  for (const kind of ["weapon-craft", "guild-hall", "research-unlock", "special-tactic"]) {
    assert.match(gameSource, new RegExp(`playProgressionSound\\("${kind}"`));
  }
  assert.match(gameSource, /if \(!automatic && targets\.length\) \{\s*playCombatProcSound/);
  assert.match(gameSource, /stage\.boss && firstClear[\s\S]*\? "boss-token"[\s\S]*\? "gear"[\s\S]*\? "first-clear"/);
  assert.match(gameSource, /if \(rareReward\) playRareRewardSound\(rareReward\)/);
});
