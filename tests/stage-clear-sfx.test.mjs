import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audioSource = await readFile(new URL("../app/battle-audio.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../app/Game.tsx", import.meta.url), "utf8");
const victoryHandler = gameSource.match(/const finalizeVictory = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[/)?.[1] ?? "";

test("stage clear fanfare exports normal and boss variants", () => {
  assert.match(audioSource, /export function playStageClearSound\(boss = false\)/);
  assert.match(audioSource, /stage-clear:\$\{boss \? "boss" : "normal"\}/);
  assert.match(audioSource, /const melody = boss \? \[294, 370, 440, 587\] : \[392, 494, 587, 784\]/);
  assert.match(audioSource, /\[root, root \* 1\.25, root \* 1\.5\]/);
});

test("every finalized victory plays exactly one stage clear sound", () => {
  assert.match(victoryHandler, /if \(rewardLock\.current\) return;[\s\S]*rewardLock\.current = true;/);
  assert.match(victoryHandler, /setVictory\(true\);\s*playStageClearSound\(stage\.boss\);\s*if \(developerMode\)/);
  assert.equal(victoryHandler.match(/playStageClearSound\(/g)?.length, 1);
});

test("stage clear sound shares the global SFX output and smoke marker", () => {
  const implementation = audioSource.match(/export function playStageClearSound[\s\S]*?\n}\n\nexport function playMonsterHitSound/)?.[0] ?? "";
  assert.match(implementation, /playWhenAudioIsReady/);
  assert.match(implementation, /markEventSound/);
  assert.match(implementation, /noiseBurst/);
  assert.match(implementation, /tone/);
});
