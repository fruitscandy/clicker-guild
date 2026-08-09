import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("wraps the game in the interactive opening gate", async () => {
  const [page, opening, styles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.module.css", root), "utf8"),
  ]);

  assert.match(page, /<OpeningGate>/);
  assert.match(opening, /오프닝 스킵/);
  assert.match(opening, /견습 전사 로안/);
  assert.match(opening, /HERO DATA GENERATING/);
  assert.match(opening, /NEW_GAME_TOAST/);
  assert.match(opening, /MutationObserver/);
  assert.match(opening, /Escape/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media \(max-width: 480px\)/);
});

test("ships non-empty Korean opening voice files", async () => {
  const files = [
    "core-awake.wav",
    "core-contract.wav",
    "core-sync.wav",
    "roan-arrival.wav",
    "core-quest.wav",
    "core-promise.wav",
  ];

  for (const file of files) {
    const info = await stat(new URL(`public/audio/opening/${file}`, root));
    assert.ok(info.size > 100_000, `${file} should contain rendered speech`);
  }
});


