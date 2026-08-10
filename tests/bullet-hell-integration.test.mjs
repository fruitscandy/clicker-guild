import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("continues stage 10-3 inside the same arena instead of replacing the game shell", async () => {
  const game = await readFile(new URL("app/Game.tsx", root), "utf8");

  assert.match(game, /import \{ BulletHellFinale \} from "\.\/bullet-hell\/BulletHellFinale"/);
  assert.match(game, /const \[finaleMode, setFinaleMode\] = useState\(false\)/);
  assert.match(game, /const \[finaleVisualMode, setFinaleVisualMode\] = useState<FinaleMode>\("field"\)/);
  assert.equal((game.match(/stage\.stage === STAGE_COUNT/g) ?? []).length, 2);
  assert.doesNotMatch(game, /if \(finaleMode\) \{\s*return <BulletHellFinale/);
  assert.match(game, /const combatLocked = finaleMode \|\| battleActive/);
  assert.match(game, /presentation="embedded"/);
  assert.match(game, /onModeChange=\{setFinaleVisualMode\}/);
  assert.match(game, /seamlessFinale \? finaleFieldAsset\.source : fieldAsset\.source/);
  assert.match(game, /onPointerDown=\{seamlessFinale \? undefined : attackField\}/);
  assert.match(game, /\{!seamlessFinale && <>\s*<div className="swarm-hud"/);
  assert.match(game, /victory && !seamlessFinale/);
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
  assert.match(component, /보스를 클릭하거나 Enter로 공격합니다/);
  assert.match(engine, /export function attackFinaleBoss/);
  assert.match(engine, /next\.stats\.clickIntervalMs/);
  assert.doesNotMatch(component, /drawPlayerShot|world\.shots\.forEach|finaleDroneOffsets/);
  assert.doesNotMatch(component, /UPGRADE TRANSLATION|WEAPON TIER|PARTY \{/);
});

test("removes explanatory panels and exposes only compact accessible combat overlays", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.doesNotMatch(component, /styles\.topHud|styles\.sidePanel|styles\.bottomRail|styles\.clickGuide|scene === "intro"/);
  assert.equal((component.match(/role="progressbar"/g) ?? []).length, 2);
  assert.match(component, /data-finale-overlay="boss"/);
  assert.match(component, /data-finale-overlay="guild"/);
  assert.match(component, /aria-label="기록 말소자 체력"/);
  assert.match(component, /aria-label="길드 본관 내구도"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /if \(presentation === "embedded"\) return battleSurface/);
});

test("keeps phase one transparent and changes to a black null field without changing the host rect", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
  ]);

  assert.match(component, /if \(!preserveHostField\) drawFieldBackground/);
  assert.match(component, /presentation === "embedded"/);
  assert.match(component, /context\.clearRect\(0, 0, canvas\.width, canvas\.height\)/);
  assert.match(component, /Math\.min\(canvas\.width \/ FINALE_WIDTH, canvas\.height \/ FINALE_HEIGHT\)/);
  assert.match(css, /\.embeddedSurface\s*\{[\s\S]*?position: absolute;[\s\S]*?inset: 0;[\s\S]*?background: transparent;/);
  assert.match(css, /\.battleSurface\[data-finale-mode="bulletHell"\][\s\S]*?background: #000;/);
  assert.match(css, /\.bossOverlay[\s\S]*?pointer-events: none;/);
  assert.match(css, /\.guildOverlay\s*\{[\s\S]*?right: 14px;[\s\S]*?bottom: 78px;/);
  assert.match(css, /finaleChromeFracture/);
  assert.match(css, /visibility: hidden;[\s\S]*?opacity: 0;/);
});

test("stacks visible boss-hit feedback without letting rate-limited clicks erase it", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /const attackImpactsRef = useRef<AttackImpact\[\]>\(\[\]\)/);
  assert.match(component, /event && event\.kind !== "rate-limited"/);
  assert.match(component, /slice\(-MAX_ATTACK_IMPACTS\)/);
  assert.match(component, /attackImpactsRef\.current[\s\S]*?\.map\(\(impact\)[\s\S]*?\.filter\(\(impact\)/);
  assert.match(component, /FINALE_VFX_ASSETS\.steelSlash/);
  assert.match(component, /FINALE_VFX_ASSETS\.impactFlash/);
  assert.match(component, /FINALE_VFX_ASSETS\.impactRing/);
  assert.match(component, /FINALE_VFX_ASSETS\.spark/);
  assert.match(component, /WEAK! ×2/);
  assert.match(component, /GUARD 35%/);
  assert.match(component, /DIRECT HIT/);
  assert.match(component, /world\.boss\.flashMs \/ BOSS_HIT_FLASH_MS/);
  assert.match(component, /const recoil = reducedMotion/);
  assert.doesNotMatch(component, /Math\.random/);

  const collapseLayer = component.indexOf("drawCollapse(context, world, reducedMotion);");
  const attackLayer = component.indexOf("attackImpacts.forEach((impact) => drawAttackImpact(context, impact, images, reducedMotion));");
  assert.ok(collapseLayer >= 0 && attackLayer >= 0 && collapseLayer < attackLayer);
});

test("renders the guild under enemy bullets while keeping the exact white hit point on top", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /const size = 90/);
  assert.match(component, /context\.arc\(0, 0, world\.stats\.hitRadius/);

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
  assert.match(component, /방어막이 탄환을 흡수했습니다/);
  assert.match(component, /이것은 게임 오버가 아닙니다/);
  assert.match(component, /restartFinalePhaseTwo\(worldRef\.current\)/);
  assert.match(component, /2페이즈 즉시 재시도/);
  assert.match(component, /hud\.mode === "destruction"/);
  assert.match(component, /hud\.mode === "whiteout"/);
  assert.match(component, /WHITEOUT_HOLD_MS/);
  assert.match(component, /최종 보스 격파/);
});

test("connects existing boss-stage music and preview scene jumps", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /data-finale-music=\{musicSignal\}/);
  assert.match(component, /return "phase-one"/);
  assert.match(component, /return "phase-two"/);
  for (const mode of ["field", "collapse", "bulletHell", "destruction", "whiteout"]) {
    assert.match(component, new RegExp(`"${mode}"`));
  }
  assert.match(component, /forceFinaleMode\(worldRef\.current, nextMode\)/);
  assert.match(component, />CORE OPEN<\/button>/);
});

test("ships keyboard, touch, responsive canvas, pause, and reduced-motion affordances", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
  ]);

  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /ResizeObserver/);
  assert.match(component, /window\.devicePixelRatio/);
  assert.match(component, /KeyW: "w"/);
  assert.match(component, /KeyA: "a"/);
  assert.match(component, /"w", "a", "s", "d"/);
  assert.match(component, /"arrowup", "arrowdown", "arrowleft", "arrowright"/);
  assert.match(component, /window\.addEventListener\("keyup"/);
  assert.match(component, /window\.addEventListener\("blur"/);
  assert.match(component, /document\.addEventListener\("visibilitychange"/);
  assert.match(component, /data-direction=\{direction\}/);
  assert.match(component, /role="application"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(component, /removeEventListener\("change", syncPreference\)/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /touch-action: none/);
  assert.match(css, /data-finale-mode="bulletHell"/);
});
