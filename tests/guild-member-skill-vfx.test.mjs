import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const assetDirectory = path.join(projectRoot, "public/assets/vfx/guild-members");
const manifest = JSON.parse(await readFile(path.join(assetDirectory, "manifest.json"), "utf8"));
const gameData = await readFile(path.join(projectRoot, "app/game-data.ts"), "utf8");

function vp8xCanvas(buffer) {
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8X");
  const width = buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
  const height = buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
  return {
    alpha: Boolean(buffer[20] & 0x10),
    width: width + 1,
    height: height + 1,
  };
}

test("every guild member has one distinct automatic skill VFX mapping", async () => {
  const membersBlock = gameData.match(/export const MEMBERS:[\s\S]+?= \[([\s\S]+?)\n\];/)?.[1] ?? "";
  const memberIds = [...membersBlock.matchAll(/\{ id: "([^"]+)"/g)].map((match) => match[1]);
  const manifestIds = manifest.members.map((member) => member.id);
  const manifestAssets = manifest.members.map((member) => member.asset);

  assert.equal(memberIds.length, 25);
  assert.deepEqual(manifestIds, memberIds);
  assert.equal(new Set(manifestAssets).size, 25);
  assert.deepEqual(manifest.canvas, { width: 512, height: 512, alpha: true });

  const files = (await readdir(assetDirectory)).filter((file) => file.endsWith(".webp")).sort();
  assert.deepEqual(files, manifestAssets.slice().sort());
});

test("guild member skill VFX remain compact 512px WebP assets with alpha", async () => {
  for (const member of manifest.members) {
    const filePath = path.join(assetDirectory, member.asset);
    const [buffer, metadata] = await Promise.all([readFile(filePath), stat(filePath)]);

    assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
    assert.deepEqual(vp8xCanvas(buffer), { alpha: true, width: 512, height: 512 });
    assert.ok(metadata.size < 120_000, `${member.asset} should stay below 120 KB`);
  }
});
