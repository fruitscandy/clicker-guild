import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships a save-isolated standalone bullet-hell preview route", async () => {
  const [page, harness] = await Promise.all([
    readFile(new URL("../app/bullet-hell/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/bullet-hell/FinaleDevHarness.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import FinaleDevHarness from "\.\.\/FinaleDevHarness"/);
  assert.match(page, /import BgmController from "\.\.\/\.\.\/bgm\/BgmController"/);
  assert.match(page, /return <BgmController><FinaleDevHarness \/><\/BgmController>/);
  assert.match(harness, /^"use client";/);
  assert.match(harness, /maximumFinaleLoadout/);
  assert.match(harness, /mode="preview"/);
  assert.match(harness, /seed=\{sessionSeed\}/);
  assert.match(harness, /onExit=/);
  assert.match(harness, /onVictory=/);
  assert.doesNotMatch(harness, /localStorage|sessionStorage/);
});

test("exposes complete upgrade, progression, preset, and seeded restart controls", async () => {
  const harness = await readFile(new URL("../app/bullet-hell/FinaleDevHarness.tsx", import.meta.url), "utf8");

  for (const key of ["range", "critical", "combo", "execution", "shockwave", "momentum", "time", "scout", "guild", "gold", "tavern", "loot"]) {
    assert.match(harness, new RegExp(`${key}:`), `missing ${key} upgrade label/control`);
  }

  assert.match(harness, /UPGRADE_KEYS\.map/);
  assert.match(harness, /data-upgrade-key=\{key\}/);
  assert.match(harness, /0 프리셋 · 최소 성장/);
  assert.match(harness, /MAX 프리셋 · 모두 최대/);
  assert.match(harness, /const WEAPON_MIN = 0/);
  assert.match(harness, /const WEAPON_MAX = 14/);
  assert.match(harness, /const HALL_MIN = 1/);
  assert.match(harness, /const HALL_MAX = 6/);
  assert.match(harness, /const PARTY_MIN = 1/);
  assert.match(harness, /const PARTY_MAX = 4/);
  assert.match(harness, /data-loadout-control="weapon"/);
  assert.match(harness, /data-loadout-control="hall"/);
  assert.match(harness, /data-loadout-control="party"/);
  assert.match(harness, /data-loadout-control="seed"/);
  assert.match(harness, /새 시드로 재시작/);
  assert.match(harness, /key=\{`bullet-hell-preview-\$\{sessionSeed\}-\$\{sessionVersion\}`\}/);
});
