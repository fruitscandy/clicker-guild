import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL("../app/bullet-hell/assets.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const assets = await import(sourceUrl.href);

function publicAssetUrl(assetPath) {
  assert.match(assetPath, /^\/assets\//, `public path expected: ${assetPath}`);
  return new URL(`../public${assetPath}`, import.meta.url);
}

test("finale manifest keeps every upgrade, weapon, and regional boss in stable sprite order", () => {
  assert.match(source, /export type FinaleBulletAssetKind/);
  assert.match(source, /export const FINALE_BULLET_ASSETS/);
  assert.match(source, /export function finaleBulletAsset/);

  assert.equal(assets.FINALE_UPGRADE_BULLET_ASSETS.length, 12);
  assert.equal(assets.FINALE_WEAPON_BULLET_ASSETS.length, 15);
  assert.equal(assets.FINALE_BOSS_BULLET_ASSETS.length, 10);
  assert.equal(assets.FINALE_BULLET_ASSETS.length, 37);

  assert.deepEqual(
    assets.FINALE_BULLET_ASSETS.map((asset) => asset.kind),
    [
      ...Array(12).fill("upgrade"),
      ...Array(15).fill("weapon"),
      ...Array(10).fill("boss"),
    ],
  );

  assert.equal(new Set(assets.FINALE_BULLET_ASSETS.map((asset) => asset.id)).size, 37);
  assert.equal(new Set(assets.FINALE_BULLET_ASSETS.map((asset) => asset.source)).size, 37);
  for (const asset of assets.FINALE_BULLET_ASSETS) {
    assert.ok(asset.radius > 0, asset.id);
    assert.ok(asset.scale > 0 && asset.scale <= 1, asset.id);
    assert.ok(asset.label.length > 0, asset.id);
  }
});

test("sprite lookup wraps finite indices and falls back safely for invalid input", () => {
  const manifest = assets.FINALE_BULLET_ASSETS;
  assert.equal(assets.finaleBulletAsset(0), manifest[0]);
  assert.equal(assets.finaleBulletAsset(manifest.length), manifest[0]);
  assert.equal(assets.finaleBulletAsset(-1), manifest.at(-1));
  assert.equal(assets.finaleBulletAsset(4.9), manifest[4]);
  assert.equal(assets.finaleBulletAsset(Number.NaN), manifest[0]);
  assert.equal(assets.finaleBulletAsset(Number.POSITIVE_INFINITY), manifest[0]);
});

test("asset manifest leaves card geometry to the engine", () => {
  assert.doesNotMatch(source, /FINALE_BULLET_CARD_SIZE_BY_KIND|finaleBulletCardSize/);
});

test("guild player atlas exposes its six square frames", () => {
  assert.deepEqual(assets.FINALE_GUILD_ATLAS, {
    source: "/assets/guild/guild-growth-sprites-v1.png",
    width: 1536,
    height: 1024,
    columns: 3,
    rows: 2,
    frameWidth: 512,
    frameHeight: 512,
  });
  assert.equal(assets.FINALE_GUILD_ATLAS.columns * assets.FINALE_GUILD_ATLAS.rows, 6);
  assert.equal(assets.FINALE_GUILD_ATLAS.frameWidth * assets.FINALE_GUILD_ATLAS.columns, assets.FINALE_GUILD_ATLAS.width);
  assert.equal(assets.FINALE_GUILD_ATLAS.frameHeight * assets.FINALE_GUILD_ATLAS.rows, assets.FINALE_GUILD_ATLAS.height);
});

test("every manifest, guild, and VFX path resolves to a checked-in non-empty asset", async () => {
  const declaredPaths = [
    ...assets.FINALE_BULLET_ASSETS.map((asset) => asset.source),
    assets.FINALE_GUILD_ATLAS.source,
    ...Object.values(assets.FINALE_VFX_ASSETS),
  ];
  assert.equal(new Set(declaredPaths).size, declaredPaths.length);

  await Promise.all(declaredPaths.map(async (assetPath) => {
    const url = publicAssetUrl(assetPath);
    await access(url);
    assert.ok((await stat(url)).size > 0, assetPath);
  }));
});
