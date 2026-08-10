import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("changes genre only when the final campaign stage has actually finalized", async () => {
  const game = await readFile(new URL("app/Game.tsx", root), "utf8");

  assert.match(game, /import \{ BulletHellFinale \} from "\.\/bullet-hell\/BulletHellFinale"/);
  assert.match(game, /const \[finaleMode, setFinaleMode\] = useState\(false\)/);
  assert.equal((game.match(/stage\.stage === STAGE_COUNT/g) ?? []).length, 2);
  assert.match(game, /playStageClearSound\(stage\.boss\);\s*if \(developerMode\)/);
  assert.match(game, /if \(finaleMode\) \{[\s\S]*?<BulletHellFinale/);
  assert.match(game, /mode=\{developerMode \? "preview" : "campaign"\}/);
  assert.match(game, /finaleCleared: true/);
  assert.match(game, /탄막 TEST/);
});
test("passes the saved weapon, hall, party, and all upgrade values into the finale", async () => {
  const game = await readFile(new URL("app/Game.tsx", root), "utf8");

  assert.match(game, /const finaleLoadout = useMemo<FinaleLoadout>/);
  assert.match(game, /upgrades: effectiveUpgrades/);
  assert.match(game, /weaponLevel: clickVisualLevel/);
  assert.match(game, /hallLevel: developerMode \? GUILD_HALL_STAGES\.length : save\.guildHallLevel/);
  assert.match(game, /partySize: developerMode \? 4 : Math\.max\(1, partyMembers\.length\)/);
});

test("ships keyboard, focus, pause, touch, canvas, and responsive play affordances", async () => {
  const [component, styles, engine] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
    readFile(new URL("app/bullet-hell/engine.ts", root), "utf8"),
  ]);

  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /window\.devicePixelRatio/);
  assert.match(component, /"w", "a", "s", "d"/);
  assert.match(component, /"arrowup", "arrowdown", "arrowleft", "arrowright"/);
  assert.match(component, /window\.addEventListener\("keyup"/);
  assert.match(component, /window\.addEventListener\("blur"/);
  assert.match(component, /document\.addEventListener\("visibilitychange"/);
  assert.match(component, /data-direction=\{direction\}/);
  assert.match(component, /role="application"/);
  assert.match(component, /aria-live="assertive"/);
  assert.match(component, /보이는 건물 전체가 아니라 중앙의 작은 빛만 피격/);

  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /touch-action: none/);
  assert.match(engine, /const MAX_BULLETS = 480/);
  assert.match(engine, /const PHASES: Record<FinalePhase/);
});
