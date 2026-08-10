import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("enters the ending event only after stage 10-3 and can safely resume it", async () => {
  const game = await readFile(new URL("app/Game.tsx", root), "utf8");

  assert.match(game, /import \{ BulletHellFinale \} from "\.\/bullet-hell\/BulletHellFinale"/);
  assert.match(game, /const \[finaleMode, setFinaleMode\] = useState\(false\)/);
  assert.equal((game.match(/stage\.stage === STAGE_COUNT/g) ?? []).length, 2);
  assert.match(game, /if \(finaleMode\) \{[\s\S]*?<BulletHellFinale/);
  assert.match(game, /mode=\{developerMode \? "preview" : "campaign"\}/);
  assert.match(game, /finaleCleared: true/);
  assert.match(game, /save\.cleared\.includes\(STAGE_COUNT\)[\s\S]*?엔딩 재개/);
  assert.match(game, /엔딩 TEST/);
});

test("normalizes the finale to hall level and does not transport weapon, party, or upgrades", async () => {
  const game = await readFile(new URL("app/Game.tsx", root), "utf8");
  const loadoutBlock = game.match(/const finaleLoadout = useMemo<FinaleLoadout>\(\(\) => \(\{([\s\S]*?)\}\), \[([\s\S]*?)\]\);/);

  assert.ok(loadoutBlock, "finale loadout block should exist");
  assert.match(loadoutBlock[1], /hallLevel: developerMode \? GUILD_HALL_STAGES\.length : save\.guildHallLevel/);
  assert.doesNotMatch(loadoutBlock[1], /upgrades|weaponLevel|partySize|partyMembers/);
  assert.doesNotMatch(loadoutBlock[2], /effectiveUpgrades|clickVisualLevel|partyMembers/);
});

test("uses deliberate boss clicks in both phases and contains no automatic finale attack", async () => {
  const [component, engine] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/engine.ts", root), "utf8"),
  ]);

  assert.match(component, /attackFinaleBoss\(before, x, y, performance\.now\(\)\)/);
  assert.match(component, /onPointerDown=\{handleArenaPointerDown\}/);
  assert.match(component, /보스 직접 클릭/);
  assert.match(component, /자동공격 <b>없음<\/b>/);
  assert.match(engine, /export function attackFinaleBoss/);
  assert.match(engine, /next\.stats\.clickIntervalMs/);
  assert.doesNotMatch(component, /drawPlayerShot|world\.shots\.forEach|finaleDroneOffsets/);
  assert.doesNotMatch(component, /UPGRADE TRANSLATION|WEAPON TIER|PARTY \{/);
});

test("renders the smaller guild under enemy bullets while keeping the exact white hit point on top", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /const size = 90/);
  assert.match(component, /context\.arc\(0, 0, world\.stats\.hitRadius/);
  assert.match(component, /중앙의 선명한 흰 점만 실제 피격점/);
  assert.match(component, /적탄은 건물 위에 표시/);

  const bodyLayer = component.indexOf("drawGuildBody(context, world, loadout, images, reducedMotion);");
  const enemyLayer = component.indexOf("world.bullets.forEach((bullet) => drawBullet(context, bullet, images));");
  const impactLayer = component.indexOf("if (playerImpact) drawPlayerImpact(context, playerImpact, images, reducedMotion);");
  const coreLayer = component.indexOf("drawPlayerCore(context, world, focusHeld, reducedMotion);");
  assert.ok([bodyLayer, enemyLayer, impactLayer, coreLayer].every((index) => index >= 0));
  assert.ok(bodyLayer < enemyLayer && enemyLayer < impactLayer && impactLayer < coreLayer);
});

test("makes shield absorption, defeat, retry, destruction, and victory whiteout unambiguous", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /playerImpactRef\.current = \{ \.\.\.world\.playerHitEvent, ageMs: 0 \}/);
  assert.match(component, /impact\.kind === "shield"/);
  assert.match(component, /FINALE_VFX_ASSETS\.impactFlash/);
  assert.match(component, /FINALE_VFX_ASSETS\.impactRing/);
  assert.match(component, /방어막이 탄환을 흡수했습니다/);
  assert.match(component, /이것은 게임 오버가 아닙니다/);
  assert.match(component, /restartFinalePhaseTwo\(worldRef\.current\)/);
  assert.match(component, /2페이즈 즉시 재시도/);
  assert.match(component, /hud\.mode === "destruction"/);
  assert.match(component, /hud\.mode === "whiteout"/);
  assert.match(component, /WHITEOUT_HOLD_MS/);
  assert.match(component, /최종 보스 격파/);
});

test("connects the two-phase music contract and preview scene jumps", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /data-finale-music=\{musicSignal\}/);
  assert.match(component, /return "phase-one"/);
  assert.match(component, /return "phase-two"/);
  for (const mode of ["field", "collapse", "bulletHell", "destruction", "whiteout"]) {
    assert.match(component, new RegExp(`"${mode}"`));
  }
  assert.match(component, /forceFinaleMode\(worldRef\.current, nextMode\)/);
  assert.match(component, /DEV SCENE JUMP/);
  assert.match(component, /CORE OPEN<\/button>/);
});

test("ships keyboard, touch, responsive canvas, pause, and reduced-motion affordances", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
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
  assert.match(component, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(component, /removeEventListener\("change", syncPreference\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 480px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /touch-action: none/);
  assert.match(css, /data-finale-mode="bulletHell"/);
});
