import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audioSource = await readFile(new URL("../app/battle-audio.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../app/Game.tsx", import.meta.url), "utf8");

const expectedEventSounds = [
  "playExpeditionFailSound",
  "playExpeditionStartSound",
  "playGuildMemberHireSound",
  "playMenuTabSound",
  "playMonsterHitSound",
];

test("requested UI and combat event sounds are exported and wired into the game", () => {
  for (const soundName of expectedEventSounds) {
    assert.match(audioSource, new RegExp(`export function ${soundName}\\b`));
    assert.match(gameSource, new RegExp(`${soundName}\\(`));
  }
});

test("monster hit sound limits dense hit spam and reacts to impact size", () => {
  assert.match(audioSource, /start - lastMonsterHitAt < 0\.035/);
  assert.match(audioSource, /Math\.min\(4, impactTier\)/);
  assert.match(audioSource, /targetCount >= 4/);
  assert.match(gameSource, /playMonsterHitSound\(impactTier, targetIds\.length\)/);
});

test("event sounds share the global SFX output path", () => {
  assert.match(audioSource, /function playWhenAudioIsReady/);
  assert.match(audioSource, /getSfxOutput\(context\)/);
  assert.match(audioSource, /effectiveSfxVolume/);
});
