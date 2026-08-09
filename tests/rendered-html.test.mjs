import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Guildmaster game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>모험가 길드 \| 길드마스터 클리커 RPG<\/title>/i);
  assert.match(html, /길드 관리/);
  assert.match(html, /토벌 출정/);
  assert.match(html, /초보자의 숲/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships region-specific monsters with hit and death actions", async () => {
  const [forestAssets, regionEntries, monsterConfig, game, css] = await Promise.all([
    readdir(new URL("../public/assets/monsters/stage-01/", import.meta.url)),
    readdir(new URL("../public/assets/monsters/", import.meta.url), { withFileTypes: true }),
    readFile(new URL("../app/monster-assets.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  const regionDirectories = regionEntries.filter((entry) => entry.isDirectory() && /^region-\d{2}$/.test(entry.name));
  const regionAssets = await Promise.all(
    regionDirectories.map((entry) => readdir(new URL(`../public/assets/monsters/${entry.name}/`, import.meta.url))),
  );

  assert.equal(forestAssets.filter((file) => file.endsWith(".png")).length, 10);
  assert.equal(regionDirectories.length, 9);
  assert.equal(regionAssets.flat().filter((file) => file.endsWith(".png")).length, 18);
  assert.match(monsterConfig, /작은 초록 슬라임/);
  assert.match(monsterConfig, /고블린 족장 그루칸/);
  assert.match(monsterConfig, /뿔 모래도마뱀/);
  assert.match(monsterConfig, /태고의 천공룡/);
  assert.match(monsterConfig, /stage > 100/);
  assert.match(game, /className="pack-monster-art"/);
  assert.match(game, /is-struck click-recoil-tier/);
  assert.match(game, /window\.setTimeout\(awardVictory, 900\)/);
  assert.match(css, /@keyframes packMonsterArtHit/);
  assert.match(css, /@keyframes packMonsterArtDefeat/);
  assert.match(css, /@keyframes packMonsterSoul/);
});
