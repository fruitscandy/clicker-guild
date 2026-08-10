import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("opens with the vanishing world and its last remaining guild", async () => {
  const [page, opening, events, styles] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.tsx", root), "utf8"),
    readFile(new URL("app/opening/opening-events.ts", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.module.css", root), "utf8"),
  ]);

  assert.match(page, /<OpeningGate>/);
  assert.match(opening, /PHASE_DURATION/);
  assert.match(opening, /NEXT_PHASE/);
  assert.match(opening, /CUE_BY_PHASE/);
  assert.match(opening, /manyGuilds/);
  assert.match(opening, /erasure/);
  assert.match(opening, /lastGuild/);
  assert.match(opening, /frontier/);
  assert.match(opening, /수많은 길드가/);
  assert.match(opening, /세계가 조금씩/);
  assert.match(opening, /단 하나의 길드만/);
  assert.match(opening, /몬스터 토벌/);
  assert.match(opening, /길드 성장/);
  assert.match(opening, /전투 시작/);
  assert.doesNotMatch(opening, /마지막으로 남은 세 토벌지|남아 있는 세 토벌지/);
  assert.match(opening, /OPENING_RESTART_EVENT/);
  assert.match(events, /guildmaster:opening-restart/);
  assert.doesNotMatch(opening, /NEW_GAME_TOAST|MutationObserver|\.toast/);
  assert.match(opening, /Escape/);
  assert.match(opening, /blade-ring-02\.ogg/);
  assert.match(opening, /onClick=\{beginSequence\}/);
  assert.doesNotMatch(opening, /견습 전사|로안|HERO DATA|ARCHIVE CORE|동기화율/);
  assert.doesNotMatch(opening, /audio\/opening/);
  assert.doesNotMatch(opening, /VOICE_BY_PHASE/);

  assert.match(styles, /worldImage/);
  assert.match(styles, /letterbox/);
  assert.match(opening, /className=\{styles\.erasureLine\}/);
  assert.match(styles, /\.erasureLine\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(opening, /className=\{styles\.lastGuildArt\}/);
  assert.match(styles, /\[data-phase="lastGuild"\] \.lastGuildArt/);
  assert.match(styles, /guild-growth-sprites-v1/);
  assert.match(styles, /\[data-phase="frontier"\] \.lastGuildArt\s*\{[^}]*visibility:\s*hidden/);
  assert.match(styles, /guildErase/);
  assert.match(styles, /guildHeartbeat/);
  assert.match(styles, /frontierRoute/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /@media \(max-width: 520px\)/);
});

test("does not ship synthesized opening narration", async () => {
  let entries = [];
  try {
    entries = await readdir(new URL("public/audio/opening/", root));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const narration = entries.filter((file) => file.endsWith(".wav"));

  assert.deepEqual(narration, []);
});
