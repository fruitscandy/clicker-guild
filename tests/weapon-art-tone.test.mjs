import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const artSource = await readFile(path.join(projectRoot, "app/guild-hub/WeaponArt.tsx"), "utf8");
const artStyles = await readFile(path.join(projectRoot, "app/guild-hub/WeaponArt.module.css"), "utf8");
const assetDirectory = path.join(projectRoot, "public/assets/weapons");

test("all 15 weapon tiers use distinct compact WebP artwork", async () => {
  const referencedAssets = [...artSource.matchAll(/source: "(\/assets\/weapons\/[^"]+\.webp)"/g)]
    .map((match) => match[1]);

  assert.equal(referencedAssets.length, 15);
  assert.equal(new Set(referencedAssets).size, 15);
  assert.match(artSource, /import Image from "next\/image"/);
  assert.doesNotMatch(artSource, /<svg|StandardBlade|GreatswordBlade/);

  const files = (await readdir(assetDirectory)).filter((file) => file.endsWith(".webp")).sort();
  assert.equal(files.length, 15);

  for (const source of referencedAssets) {
    const filePath = path.join(projectRoot, "public", source.replace(/^\//, ""));
    const fileStats = await stat(filePath);
    const header = await readFile(filePath);
    assert.ok(fileStats.size < 100_000, `${source} should stay below 100 KB`);
    assert.equal(header.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(header.subarray(8, 12).toString("ascii"), "WEBP");
  }
});

test("weapon cursor and direct-hit effects share a tier palette", () => {
  assert.match(artSource, /data-weapon-tier=\{safeTier\}/);
  assert.equal((artStyles.match(/\.click-style-\d+\):has\(\.cursor\[data-weapon-tier=/g) ?? []).length, 15);
  assert.match(artStyles, /\.field-click-fx\)::before/);
  assert.match(artStyles, /@keyframes weaponImpactCore/);
});
