import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("victory actions use player-friendly region and combat terms", async () => {
  const [game, styles] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /체 처치 완료!/);
  assert.match(game, />다음 지역</);
  assert.match(game, />재전투</);
  assert.doesNotMatch(game, /도륙|다음 웨이브 즉시 진입|반복 도륙/);
  assert.match(styles, /\.battle-mode \.field-screen:has\(\.victory-overlay\) \{ animation: none; \}/);
});
