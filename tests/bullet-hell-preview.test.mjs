import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships a save-isolated standalone ending-event preview route", async () => {
  const [page, harness] = await Promise.all([
    readFile(new URL("../app/bullet-hell/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/bullet-hell/FinaleDevHarness.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /import FinaleDevHarness from "\.\.\/FinaleDevHarness"/);
  assert.match(page, /import BgmController from "\.\.\/\.\.\/bgm\/BgmController"/);
  assert.match(page, /return <BgmController><FinaleDevHarness \/><\/BgmController>/);
  assert.match(harness, /^"use client";/);
  assert.match(harness, /mode="preview"/);
  assert.match(harness, /seed=\{sessionSeed\}/);
  assert.match(harness, /onExit=/);
  assert.match(harness, /onVictory=/);
  assert.doesNotMatch(harness, /localStorage|sessionStorage/);
});

test("exposes only hall level and deterministic seed as finale inputs", async () => {
  const harness = await readFile(new URL("../app/bullet-hell/FinaleDevHarness.tsx", import.meta.url), "utf8");

  assert.match(harness, /const HALL_MIN = 1/);
  assert.match(harness, /const HALL_MAX = 6/);
  assert.match(harness, /useMemo<FinaleLoadout>\(\(\) => \(\{ hallLevel \}\)/);
  assert.match(harness, /data-finale-control="hall"/);
  assert.match(harness, /data-finale-control="seed"/);
  assert.match(harness, /Lv\.1 최소 본관/);
  assert.match(harness, /Lv\.6 최대 본관/);
  assert.match(harness, /무기·파티·연구·강화 데이터는 모두 초기화/);
  assert.match(harness, /자동공격은 없습니다/);
  assert.match(harness, /필드 클릭 전투부터 붕괴·검은 탄막·보스 파괴·백색 엔딩/);
  assert.doesNotMatch(harness, /UPGRADE_KEYS|weaponLevel|partySize|data-upgrade-key/);
});
