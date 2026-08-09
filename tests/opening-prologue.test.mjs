import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("wraps the game in an automatic cinematic opening", async () => {
  const [page, opening, styles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.module.css", root), "utf8"),
  ]);

  assert.match(page, /<OpeningGate>/);
  assert.match(opening, /PHASE_DURATION/);
  assert.match(opening, /NEXT_PHASE/);
  assert.match(opening, /CUE_BY_PHASE/);
  assert.match(opening, /HERO DATA GENERATING/);
  assert.match(opening, /NEW_GAME_TOAST/);
  assert.match(opening, /MutationObserver/);
  assert.match(opening, /Escape/);
  assert.match(opening, /blade-ring-02\.ogg/);
  assert.match(opening, /onClick=\{beginSequence\}/);
  assert.match(styles, /guildRise[^}]*pointer-events: none/);
  assert.doesNotMatch(opening, /audio\/opening/);
  assert.doesNotMatch(opening, /VOICE_BY_PHASE/);

  assert.match(styles, /worldImage/);
  assert.match(styles, /letterbox/);
  assert.match(styles, /heroArrival/);
  assert.match(styles, /sequenceProgress/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media \(max-width: 520px\)/);
});

test("does not ship synthesized opening narration", async () => {
  const entries = await readdir(new URL("public/audio/opening/", root));
  const narration = entries.filter((file) => file.endsWith(".wav"));

  assert.deepEqual(narration, []);
});
