import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const EXPECTED_ASSETS = [
  "field-01-beginners-forest-hq.webp",
  "field-02-parched-wilds-hq.webp",
  "field-03-poison-mist-swamp-hq.webp",
  "field-04-abandoned-mine-hq.webp",
  "field-05-frozen-canyon-hq.webp",
  "field-06-burning-mountains-hq.webp",
  "field-07-graveyard-of-the-dead-hq.webp",
  "field-08-mana-storm-zone-hq.webp",
  "field-09-demon-army-fort-hq.webp",
  "field-10-ancient-dragon-sanctuary-hq.webp",
];

test("ships the ten optimized regional field backgrounds", async () => {
  const assetsUrl = new URL("../public/assets/fields/", import.meta.url);
  const assets = (await readdir(assetsUrl)).filter((file) => file.endsWith(".webp")).sort();

  assert.deepEqual(assets, EXPECTED_ASSETS);

  for (const asset of assets) {
    const metadata = await stat(new URL(asset, assetsUrl));
    assert.ok(metadata.size > 100_000, `${asset} should contain production artwork`);
    assert.ok(metadata.size < 1_000_000, `${asset} should remain web optimized`);
  }
});

test("maps every region to a field asset and keeps a forest fallback", async () => {
  const [manifest, game, css] = await Promise.all([
    readFile(new URL("../app/field-assets.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  for (const asset of EXPECTED_ASSETS) {
    assert.match(manifest, new RegExp(asset.replaceAll(".", "\\.")));
  }

  assert.match(manifest, /return FIELD_ASSET_MANIFEST\.forest/);
  assert.match(game, /fieldAssetForRegion\(stage\.region\.hue\)/);
  assert.match(game, /className="field-background-art"/);
  assert.doesNotMatch(game, /className=\{`board-ground/);
  assert.match(css, /\.field-background-art \{/);
  assert.match(css, /object-fit: cover/);
});
