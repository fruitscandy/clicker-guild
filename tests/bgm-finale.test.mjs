import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tracksSource = await readFile("app/bgm/tracks.ts", "utf8");
const controllerSource = await readFile("app/bgm/BgmController.tsx", "utf8");

test("the finale reuses the existing rotating boss-track pool", () => {
  assert.doesNotMatch(tracksSource, /"finale"/);
  assert.doesNotMatch(tracksSource, /crown-of-ruin/);
  assert.match(tracksSource, /\["guild", "field-select", "battle", "boss"\]/);
  assert.match(tracksSource, /id: "fantasy-boss-battle"[\s\S]*?sceneId: "boss"/);
  assert.match(tracksSource, /id: "fantasy-boss-battle-take-2"[\s\S]*?sceneId: "boss"/);
});

test("every finale phase preserves the current boss flow instead of swapping tracks", () => {
  assert.match(controllerSource, /value === "phase-one"/);
  assert.match(controllerSource, /value === "collapse"/);
  assert.match(controllerSource, /value === "phase-two"/);
  assert.match(controllerSource, /value === "destruction"/);
  assert.match(controllerSource, /value === "whiteout"/);
  assert.match(controllerSource, /if \(finaleMusic !== "none"\) return "boss"/);
  assert.doesNotMatch(controllerSource, /return "finale"/);
  assert.match(controllerSource, /guild: 0, "field-select": 0, battle: 0, boss: 0/);
  assert.match(controllerSource, /const CROSSFADE_MS = 1_150/);
  assert.match(controllerSource, /attributeFilter: \["class", "data-finale-music"\]/);
});

test("destruction and whiteout attenuate safely while legacy scene detection remains", () => {
  assert.match(controllerSource, /const FINALE_DESTRUCTION_FADE_MS = 480/);
  assert.match(controllerSource, /const FINALE_WHITEOUT_FADE_MS = 220/);
  assert.match(controllerSource, /fadeOutCurrent\(FINALE_DESTRUCTION_FADE_MS, false\)/);
  assert.match(controllerSource, /fadeOutCurrent\(FINALE_WHITEOUT_FADE_MS, true\)/);
  assert.match(controllerSource, /if \(pauseAtEnd\) player\.pause\(\)/);
  assert.match(controllerSource, /GUILD EXPEDITION ATLAS/);
  assert.match(controllerSource, /return banner\.includes\("BOSS"\) \? "boss" : "battle"/);
  assert.match(controllerSource, /return "guild"/);
});

test("silence interrupts both sides of an in-flight crossfade without stale async playback", () => {
  const fadeToSource = controllerSource.slice(
    controllerSource.indexOf("const fadeTo"),
    controllerSource.indexOf("const fadeOutCurrent"),
  );
  const fadeOutSource = controllerSource.slice(
    controllerSource.indexOf("const fadeOutCurrent"),
    controllerSource.indexOf("const fadeInCurrent"),
  );

  assert.match(controllerSource, /const fadeGeneration = useRef\(0\)/);
  assert.match(fadeToSource, /const generation = \+\+fadeGeneration\.current/);
  assert.match(
    fadeToSource,
    /generation !== fadeGeneration\.current \|\| isFinaleSilenceSignal\(finaleMusicSignalRef\.current\)/,
  );
  assert.ok(
    fadeToSource.indexOf("generation !== fadeGeneration.current")
      < fadeToSource.indexOf("playingTrack.current = nextTrack"),
    "an obsolete play() promise must not claim the active track",
  );
  assert.match(fadeOutSource, /const generation = \+\+fadeGeneration\.current/);
  assert.match(fadeOutSource, /players\.current\.forEach\(\(candidate, index\) =>/);
  assert.match(fadeOutSource, /candidate\.pause\(\);\s+candidate\.volume = 0/);
  assert.match(fadeOutSource, /generation !== fadeGeneration\.current/);
  assert.match(controllerSource, /fadeGeneration\.current \+= 1;[\s\S]*?players\.current\.forEach/);
});
