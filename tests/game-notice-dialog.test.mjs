import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("removes the global top toast and uses an accessible game notice dialog", async () => {
  const [game, dialog, styles, globalStyles] = await Promise.all([
    readFile(new URL("app/Game.tsx", root), "utf8"),
    readFile(new URL("app/game-notice/GameNoticeDialog.tsx", root), "utf8"),
    readFile(new URL("app/game-notice/GameNoticeDialog.module.css", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.doesNotMatch(game, /setToast|className="toast"|window\.confirm/);
  assert.doesNotMatch(globalStyles, /\.toast(?:\s|,|\{)/);
  assert.match(game, /<GameNoticeDialog notice=\{notice\} onClose=\{closeNotice\} onConfirm=\{confirmNotice\}/);
  assert.match(game, /showNotice\("연구가 더 필요합니다"/);
  assert.match(game, /showNotice\("제작 재료가 부족합니다"/);
  assert.match(game, /showNotice\("파티가 가득 찼습니다"/);
  assert.match(game, /action: "reset"/);

  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby=\{titleId\}/);
  assert.match(dialog, /aria-describedby=\{descriptionId\}/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /previouslyFocused\?\.focus/);
  assert.match(styles, /\.backdrop[\s\S]*position: fixed/);
  assert.match(styles, /\.actions\.singleAction/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("restarts the cinematic through an explicit event after reset", async () => {
  const [game, opening, events] = await Promise.all([
    readFile(new URL("app/Game.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.tsx", root), "utf8"),
    readFile(new URL("app/opening/opening-events.ts", root), "utf8"),
  ]);

  assert.match(events, /OPENING_RESTART_EVENT/);
  assert.match(game, /dispatchEvent\(new Event\(OPENING_RESTART_EVENT\)\)/);
  assert.match(opening, /addEventListener\(OPENING_RESTART_EVENT, restartOpening\)/);
  assert.doesNotMatch(opening, /MutationObserver|querySelector<HTMLElement>\("\.toast"\)/);
});
