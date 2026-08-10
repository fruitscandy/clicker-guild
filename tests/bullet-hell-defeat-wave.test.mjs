import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const gameUrl = new URL("../app/Game.tsx", import.meta.url);
const waveUrl = new URL("../app/bullet-hell/FinaleDefeatWave.tsx", import.meta.url);
const stylesUrl = new URL("../app/bullet-hell/FinaleDefeatWave.module.css", import.meta.url);

test("renders a deterministic 48-strip defeat wave above the whole application", async () => {
  const [wave, css] = await Promise.all([
    readFile(waveUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(wave, /const STRIP_COUNT = 48/);
  assert.match(wave, /Math\.sin\(wavePhase\)/);
  assert.match(wave, /"--cover-delay"/);
  assert.match(wave, /"--reveal-delay"/);
  assert.match(wave, /createPortal\([\s\S]*document\.body/);
  assert.match(wave, /data-finale-defeat-wave=\{phase\}/);
  assert.match(css, /\.wave\s*\{[\s\S]*position: fixed;[\s\S]*inset: 0;[\s\S]*z-index: 2147483200;/);
  assert.match(css, /pointer-events: auto/);
  assert.match(css, /mask-image: linear-gradient/);
  assert.match(css, /@keyframes waveCover/);
  assert.match(css, /@keyframes waveReveal/);
});

test("holds the fully covered frame while Game silently swaps combat for the guild", async () => {
  const [game, wave, css] = await Promise.all([
    readFile(gameUrl, "utf8"),
    readFile(waveUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(wave, /"covering" \| "covered" \| "revealing"/);
  assert.match(css, /data-finale-defeat-wave="covered"[\s\S]*translate3d\(0, 0, 0\)/);
  assert.match(game, /useState<FinaleDefeatTransitionPhase>\("idle"\)/);
  assert.match(game, /onDefeat=\{beginFinaleDefeatReturn\}/);
  assert.match(game, /document\.activeElement instanceof HTMLElement[\s\S]*?document\.activeElement\.blur\(\)/);
  assert.match(game, /function handleFinaleDefeatCovered\(\)[\s\S]*setNotice\(null\)[\s\S]*setFinaleMode\(false\)[\s\S]*returnToGuild\("auto"\)/);
  assert.match(game, /requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame\(\(\) => \{/);
  assert.match(game, /data-finale-defeat-transition=\{finaleDefeatTransitioning \? finaleDefeatPhase : undefined\}/);
  assert.match(game, /inert=\{finaleDefeatTransitioning \? true : undefined\}/);
  assert.doesNotMatch(wave, /MutationObserver|setTimeout/);
});

test("uses animation completion for reduced motion and restores focus after reveal", async () => {
  const [game, wave, css] = await Promise.all([
    readFile(gameUrl, "utf8"),
    readFile(waveUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(wave, /onAnimationEnd=\{handleClockEnd\}/);
  assert.match(wave, /if \(phase === "covering"\) onCovered\(\)/);
  assert.match(wave, /if \(phase === "revealing"\) onRevealed\(\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@keyframes reducedCover/);
  assert.match(css, /@keyframes reducedReveal/);
  assert.match(game, /ref=\{guildHeadingRef\} tabIndex=\{-1\}/);
  assert.match(game, /guildHeadingRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(game, /cancelFinaleDefeatFrames/);
  assert.match(game, /<FinaleDefeatWave[\s\S]*onCovered=\{handleFinaleDefeatCovered\}[\s\S]*onRevealed=\{handleFinaleDefeatRevealed\}/);
});
