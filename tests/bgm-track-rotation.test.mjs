import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const tracksSource = await readFile("app/bgm/tracks.ts", "utf8");
const controllerSource = await readFile("app/bgm/BgmController.tsx", "utf8");

const flowTracks = [
  "vanguards-charge.m4a",
  "iron-advance.m4a",
  "fantasy-boss-battle.m4a",
  "fantasy-boss-battle-take-2.m4a",
];

test("Flow Music battle tracks are shipped and assigned to scene pools", async () => {
  for (const file of flowTracks) {
    const asset = await stat(`public/assets/audio/bgm/flow-candidates/${file}`);
    assert.ok(asset.size > 2_000_000, `${file} should contain the downloaded full track`);
    assert.match(tracksSource, new RegExp(file.replaceAll(".", "\\.")));
  }

  assert.equal((tracksSource.match(/sceneId: "battle"/g) ?? []).length, 2);
  assert.equal((tracksSource.match(/sceneId: "boss"/g) ?? []).length, 2);
});

test("battle and boss scene pools advance without rotating on unrelated DOM mutations", () => {
  assert.match(controllerSource, /nextScene !== desiredScene\.current/);
  assert.match(controllerSource, /sceneCursors\.current\[nextScene\]/);
  assert.match(controllerSource, /\(cursor \+ 1\) % pool\.length/);
});
