import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audioSettingsSource = await readFile(new URL("../app/audio-settings.ts", import.meta.url), "utf8");
const bgmControllerSource = await readFile(new URL("../app/bgm/BgmController.tsx", import.meta.url), "utf8");

test("the final mix lowers BGM and lifts all sound effects", () => {
  assert.match(audioSettingsSource, /BGM_OUTPUT_GAIN = 0\.62/);
  assert.match(audioSettingsSource, /SFX_OUTPUT_GAIN = 1\.34/);
  assert.match(
    audioSettingsSource,
    /effectiveBgmVolume[\s\S]*settings\.bgmVolume \* BGM_OUTPUT_GAIN/,
  );
  assert.match(
    audioSettingsSource,
    /effectiveSfxVolume[\s\S]*settings\.sfxVolume \* SFX_OUTPUT_GAIN/,
  );
  assert.doesNotMatch(
    audioSettingsSource,
    /effectiveSfxVolume[\s\S]*Math\.min\(1, settings\.sfxVolume \* SFX_OUTPUT_GAIN\)/,
  );
});

test("every BGM playback path uses the balanced output volume", () => {
  assert.match(bgmControllerSource, /effectiveBgmVolume/);
  assert.doesNotMatch(bgmControllerSource, /player\.volume = settingsRef\.current\.bgmVolume/);
  assert.doesNotMatch(bgmControllerSource, /player\.volume = settings\.bgmMuted \? 0 : settings\.bgmVolume/);
  assert.doesNotMatch(bgmControllerSource, /player\.volume = next\.bgmVolume/);
  assert.doesNotMatch(bgmControllerSource, /player\.volume = bgmVolume/);
});
