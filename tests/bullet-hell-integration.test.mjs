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
  assert.match(game, /cursorWeapon=\{activeClickPattern\}/);
  assert.match(game, /initialCursorPoint=\{weaponCursor\}/);
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

test("keeps the equipped sword cursor while narrowing attacks to the assembled boss body", async () => {
  const [component, engine, css] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/engine.ts", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
  ]);

  assert.match(component, /import \{ WeaponCursor, type WeaponView \}/);
  assert.match(component, /cursorWeapon\?: WeaponView/);
  assert.match(component, /initialCursorPoint\?: WeaponCursorPoint/);
  assert.match(component, /initialCursorPoint[\s\S]*?\{ \.\.\.initialCursorPoint \}/);
  assert.match(component, /<WeaponCursor weapon=\{cursorWeapon\} point=\{weaponCursorPoint\}/);
  assert.match(component, /onPointerMove=\{trackFinaleWeaponCursor\}/);
  assert.match(component, /onPointerLeave=\{\(\) => setWeaponCursorPoint/);
  assert.match(engine, /FINALE_BOSS_CLICK_RADIUS = 78/);
  assert.match(engine, /bossClickRadius: FINALE_BOSS_CLICK_RADIUS/);
  assert.match(css, /\.weaponCursorLayer\s*\{[\s\S]*?z-index: 10;[\s\S]*?pointer-events: none;/);
  assert.match(css, /@media \(pointer: fine\)[\s\S]*?\.battleSurface \.canvas\s*\{[\s\S]*?cursor: none;/);
  assert.doesNotMatch(css, /finale-active \.arena > \[data-weapon-tier\]/);
});

test("assembles the circular multilingual glitch boss from ominous energy before it becomes attackable", async () => {
  const [component, engine, css, silhouette] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/engine.ts", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
    readFile(new URL("app/bullet-hell/boss-silhouette.ts", root), "utf8"),
  ]);

  assert.match(engine, /FINALE_BOSS_REVEAL_MS = 3_600/);
  assert.match(engine, /FINALE_BOSS_ATTACKABLE_MS = 3_450/);
  assert.match(engine, /mode === "field" && next\.modeElapsedMs < FINALE_BOSS_ATTACKABLE_MS/);
  assert.match(component, /function drawBossEntranceEnergy/);
  assert.match(component, /world\.modeElapsedMs \/ FINALE_BOSS_REVEAL_MS/);
  assert.match(component, /GLITCH_BOSS_BODY_RADIUS,[\s\S]*?GLITCH_BOSS_GLYPH_COUNT,[\s\S]*?glitchBossGlyphAt,[\s\S]*?traceGlitchBossBody/);
  assert.match(silhouette, /GLITCH_BOSS_BODY_RADIUS = 76/);
  assert.match(silhouette, /GLITCH_BOSS_GLYPH_COUNT = 36/);
  assert.match(silhouette, /export function traceGlitchBossBody/);
  assert.match(silhouette, /export function glitchBossGlyphAt/);
  assert.match(component, /function drawGlitchBossGlow/);
  assert.match(component, /function drawGlitchBossGlyphCluster/);
  assert.match(component, /traceGlitchBossBody\(context, GLITCH_BOSS_BODY_RADIUS - 1\.5\);\s*context\.clip\(\)/);
  assert.match(component, /context\.fillText\(glyph\.char, -glyph\.rgbOffset, 0\)/);
  assert.match(component, /context\.fillText\(glyph\.char, glyph\.rgbOffset, 0\)/);
  assert.match(component, /const rotation = reducedMotion \? 0 : seconds/);
  assert.match(component, /const breath = reducedMotion \? 1 :/);
  assert.match(component, /const visualTime = reducedMotion \? 0 : elapsedMs/);
  assert.match(component, /glitchBossGlyphAt\(index, visualTime\)/);
  assert.doesNotMatch(component, /opening \? 1\.72 : 1/);
  assert.doesNotMatch(component, /traceArchivist|drawArchivistSilhouette/);
  assert.match(component, /data-boss-summoning=\{hud\.mode === "field" && hud\.modeElapsedMs < FINALE_BOSS_REVEAL_MS/);
  assert.match(component, /smoothstep\(\(progress - \.12\) \/ \.68\)/);
  assert.match(component, /smoothstep\(\(revealProgress - \.5\) \/ \.38\)/);
  assert.match(component, /smoothstep\(\(revealProgress - \.48\) \/ \.46\)/);
  assert.match(component, /const attackableVisual = world\.mode === "bulletHell"[\s\S]*?world\.modeElapsedMs >= FINALE_BOSS_ATTACKABLE_MS/);
  assert.match(component, /const targetGlow = context\.createRadialGradient/);
  assert.doesNotMatch(component, /context\.arc\(0, 0, FINALE_BOSS_CLICK_RADIUS/);
  assert.doesNotMatch(component, /context\.fillText\(field \? "消"/);
  assert.doesNotMatch(component, /context\.fillText\("CLICK DAMAGE ×2"/);
  assert.match(css, /\.standaloneSurface\[data-boss-summoning="true"\][\s\S]*?finaleSurfaceFracture 1\.25s steps\(8, end\) 2\.35s both/);
  assert.match(css, /finale-active\[data-finale-mode="field"\][\s\S]*?arena:has\(> \[data-boss-summoning="true"\]\)/);
  assert.match(css, /@keyframes finaleBossSummonFractureMobile/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?data-boss-summoning/);

  const energyLayer = component.indexOf("drawBossEntranceEnergy(context, world, reducedMotion);");
  const bossLayer = component.indexOf("drawBoss(context, world, reducedMotion);");
  assert.ok(energyLayer >= 0 && bossLayer >= 0 && energyLayer < bossLayer);
});

test("removes explanatory panels and hides combat overlays after phase one", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.doesNotMatch(component, /styles\.topHud|styles\.sidePanel|styles\.bottomRail|styles\.clickGuide|scene === "intro"/);
  assert.equal((component.match(/role="progressbar"/g) ?? []).length, 1);
  assert.match(component, /data-finale-overlay="boss"/);
  assert.match(component, /const showCombatChrome = hud\.mode === "field"/);
  assert.doesNotMatch(component, /data-finale-overlay="guild"/);
  assert.match(component, /aria-label="기록 말소자 체력"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /if \(presentation === "embedded"\) return battleSurface/);
});

test("fractures the whole page over a live black phase-two underlay without changing the host rect", async () => {
  const [component, css, controller] = await Promise.all([
    readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8"),
    readFile(new URL("app/bullet-hell/BulletHellFinale.module.css", root), "utf8"),
    readFile(new URL("app/bullet-hell/page-fracture.ts", root), "utf8"),
  ]);

  assert.match(component, /if \(!preserveHostField\) drawFieldBackground/);
  assert.match(component, /presentation === "embedded"/);
  assert.match(component, /context\.clearRect\(0, 0, canvas\.width, canvas\.height\)/);
  assert.match(component, /Math\.min\(canvas\.width \/ FINALE_WIDTH, canvas\.height \/ FINALE_HEIGHT\)/);
  assert.match(css, /\.embeddedSurface\s*\{[\s\S]*?position: absolute;[\s\S]*?inset: 0;[\s\S]*?background: transparent;/);
  assert.match(css, /\.battleSurface\[data-finale-mode="collapse"\][\s\S]*?background: #010204;/);
  assert.match(css, /\.battleSurface\[data-finale-mode="bulletHell"\][\s\S]*?background: #000;/);
  assert.match(css, /\.bossOverlay[\s\S]*?pointer-events: none;/);
  assert.match(component, /mountPageFracture\(/);
  assert.match(component, /const battleSnapshot = document\.createElement\("canvas"\)/);
  assert.match(component, /const bossSnapshot = document\.createElement\("canvas"\)/);
  assert.match(component, /drawWorld\([\s\S]*?presentation === "embedded",[\s\S]*?true,/);
  assert.match(component, /drawBossOnlyCanvas\(bossSnapshot, world, reducedMotionRef\.current\)/);
  assert.match(component, /keeper\) drawBossOnlyCanvas\(keeper, world, reducedMotionRef\.current\)/);
  assert.match(component, /battleSnapshot,[\s\S]*?bossSnapshot,[\s\S]*?keeperHost: portal\.keeperHost/);
  assert.match(css, /\.pageFractureBossKeeper[\s\S]*?z-index: 5/);
  assert.match(component, /beginPageFracture\(before\)[\s\S]*?worldRef\.current = next/);
  assert.match(component, /active\.controller\.update\(world\.modeElapsedMs, world\.stats\.collapseDurationMs/);
  assert.match(component, /before\.mode === "collapse" && world\.mode === "bulletHell"[\s\S]*?settlePageFracture\(\)/);
  assert.match(component, /pageFractureScrollRef\.current = \{ x: window\.scrollX, y: window\.scrollY \}/);
  assert.match(component, /window\.scrollTo\(preservedScroll\.x, preservedScroll\.y\)/);
  assert.match(component, /dataset\.pageFracturePortal = "true"/);
  assert.match(component, /data-page-fracture-live/);
  assert.match(controller, /sourceRoot, "source"/);
  assert.match(controller, /battleSurface, "battle"/);
  assert.match(controller, /soundDock, "dock"/);
  assert.doesNotMatch(controller, /requestAnimationFrame|setTimeout|setInterval|MutationObserver|performance\.now/);
  assert.match(css, /data-page-fracture-underlay="source"/);
  assert.match(css, /height: 100svh !important/);
  assert.match(component, /data-finale-presentation="standalone"/);
  assert.match(css, /html:has\(\[data-page-fracture-underlay="source"\]:not\(\[data-finale-presentation="standalone"\]\)\)[\s\S]*?overflow-y: scroll !important/);
  assert.match(css, /data-page-fracture-underlay="dock"/);
  assert.doesNotMatch(css, /finaleChromeFracture/);
  assert.doesNotMatch(css, /data-finale-mode="collapse"[^\{]*\{[^}]*animation:/);
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

  const bossLayer = component.indexOf("drawBoss(context, world, reducedMotion);");
  const attackLayer = component.indexOf("attackImpacts.forEach((impact) => drawAttackImpact(context, impact, images, reducedMotion));");
  assert.ok(bossLayer >= 0 && attackLayer >= 0 && bossLayer < attackLayer);
});

test("renders the guild under enemy bullets while keeping the exact white hit point on top", async () => {
  const component = await readFile(new URL("app/bullet-hell/BulletHellFinale.tsx", root), "utf8");

  assert.match(component, /const size = FINALE_GUILD_SIZE/);
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
  assert.match(component, /world\.mode === "destruction"/);
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
  assert.match(component, /forceFinaleMode\(before, nextMode\)/);
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
