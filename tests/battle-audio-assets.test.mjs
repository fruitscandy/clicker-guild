import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const coinAssets = [
  "public/assets/audio/loot/gold-coin-clink-01.mp3",
  "public/assets/audio/loot/gold-coin-jingle-02.mp3",
];

test("recorded gold drop samples are shipped and wired into battle audio", async () => {
  const source = await readFile("app/battle-audio.ts", "utf8");

  for (const asset of coinAssets) {
    const assetStat = await stat(asset);
    assert.ok(assetStat.size > 4_000, `${asset} should contain recorded audio`);
    assert.ok(assetStat.size < 80_000, `${asset} should stay lightweight for battle preload`);
    assert.match(source, new RegExp(asset.split("/").at(-1).replaceAll(".", "\\.")));
  }

  assert.match(source, /prepareGoldCoinSamples/);
  assert.match(source, /playGoldCoinSample/);
  assert.match(source, /dropIndex % 3 === 0/);
});

test("recorded gold sounds preserve CC0 source provenance", async () => {
  const license = await readFile("public/assets/audio/loot/LICENSE.md", "utf8");

  assert.match(license, /CC0 1\.0/);
  assert.match(license, /Vinrax/);
  assert.match(license, /Kenney Vleugels/);
  assert.match(license, /opengameart\.org\/content\/coin-drop/);
  assert.match(license, /opengameart\.org\/node\/21999/);
});
