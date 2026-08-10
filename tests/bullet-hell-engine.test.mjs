import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadEngine() {
  const source = await readFile(new URL("../app/bullet-hell/engine.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}#${Date.now()}`);
}

const engine = await loadEngine();

function zeroLoadout() {
  return {
    upgrades: Object.fromEntries(Object.keys(engine.FINALE_UPGRADE_CAPS).map((key) => [key, 0])),
    weaponLevel: 0,
    hallLevel: 1,
    partySize: 0,
  };
}

function advance(world, milliseconds, input = {}) {
  let next = world;
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 16) {
    next = engine.updateFinaleWorld(next, input, 16);
    if (next.status !== "playing") break;
  }
  return next;
}

function overlappingBullet(world, id = 900_000) {
  return {
    id,
    x: world.player.x,
    y: world.player.y,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    radius: 8,
    rotation: 0,
    spriteIndex: 0,
    spin: 0,
    turnRate: 0,
    ageMs: 0,
    lifetimeMs: 10_000,
    damage: 1,
    kind: "error",
    asset: "/favicon.svg",
    grazed: false,
  };
}

test("exposes the fixed finale arena and maps every saved upgrade family", () => {
  assert.equal(engine.FINALE_WIDTH, 960);
  assert.equal(engine.FINALE_HEIGHT, 600);
  assert.deepEqual(Object.keys(engine.FINALE_UPGRADE_CAPS), [
    "range", "critical", "combo", "execution", "shockwave", "momentum",
    "time", "scout", "guild", "gold", "tavern", "loot",
  ]);

  const base = engine.deriveFinaleStats(zeroLoadout());
  const maximumLoadout = engine.maximumFinaleLoadout();
  const maximum = engine.deriveFinaleStats(maximumLoadout);
  assert.deepEqual(maximumLoadout.upgrades, engine.FINALE_UPGRADE_CAPS);
  assert.equal(maximumLoadout.weaponLevel, 14);
  assert.equal(maximumLoadout.hallLevel, 6);
  assert.equal(maximumLoadout.partySize, 4);
  assert.ok(maximum.shotDamage > base.shotDamage);
  assert.ok(maximum.shotCount > base.shotCount);
  assert.ok(maximum.shotIntervalMs < base.shotIntervalMs);
  assert.ok(maximum.criticalChance > 0);
  assert.ok(maximum.executionThreshold > 0);
  assert.ok(Number.isFinite(maximum.pulseCooldownMs));
  assert.ok(maximum.moveSpeed > base.moveSpeed);
  assert.ok(maximum.hitRadius < base.hitRadius);
  assert.ok(maximum.maxHp > base.maxHp);
  assert.ok(maximum.maxShields > base.maxShields);
  assert.ok(maximum.droneCount > base.droneCount);
  assert.ok(maximum.invulnerabilityMs > base.invulnerabilityMs);
  assert.ok(maximum.scoreMultiplier > base.scoreMultiplier);

  const world = engine.createFinaleWorld(maximumLoadout, { preview: true, seed: 1 });
  assert.equal(world.elapsedMs, world.elapsed);
  assert.equal(world.player.shield, maximum.maxShields);
  assert.equal(world.pulse, false);
  assert.equal(world.pulseRadius, 0);
  assert.equal(world.playerHit, false);
  assert.equal(world.phaseChanged, false);
});

test("normalizes diagonal axes and clamps the guild building inside the arena", () => {
  const loadout = engine.maximumFinaleLoadout();
  const start = engine.createFinaleWorld(loadout, { preview: true, seed: 11 });
  const moved = advance(start, 960, { x: 1, y: -1 });
  const dx = moved.player.x - start.player.x;
  const dy = start.player.y - moved.player.y;
  assert.ok(Math.abs(dx - dy) < 0.01, `normalized diagonal should move equally: ${dx}, ${dy}`);
  assert.ok(Math.hypot(dx, dy) <= moved.stats.moveSpeed * 0.97);

  const edge = advance(moved, 12_000, { right: true, down: true });
  assert.ok(edge.player.x <= engine.FINALE_WIDTH - edge.player.radius * 0.72);
  assert.ok(edge.player.y <= engine.FINALE_HEIGHT - edge.player.radius * 0.72);
  assert.ok(edge.player.x >= 0 && edge.player.y >= 0);
});

test("same seed and inputs produce byte-for-byte deterministic combat state", () => {
  const loadout = engine.maximumFinaleLoadout();
  let first = engine.createFinaleWorld(loadout, { preview: true, seed: 0x12345678 });
  let second = engine.createFinaleWorld(loadout, { preview: true, seed: 0x12345678 });
  for (let frame = 0; frame < 260; frame += 1) {
    const input = { x: Math.sin(frame / 19), y: Math.cos(frame / 27), focus: frame % 7 < 3 };
    first = engine.updateFinaleWorld(first, input, 16);
    second = engine.updateFinaleWorld(second, input, 16);
  }
  assert.deepEqual(second, first);

  const differentSeed = advance(engine.createFinaleWorld(loadout, { preview: true, seed: 99 }), 4_160);
  assert.notDeepEqual(differentSeed.bullets, first.bullets);
});

test("all four health phases have distinct seeded asset patterns and respect the bullet cap", () => {
  const names = new Set();
  for (const phase of [1, 2, 3, 4]) {
    let world = engine.createFinaleWorld(zeroLoadout(), { preview: true, seed: 700 + phase });
    world = engine.forceFinalePhase(world, phase);
    world = advance(world, 2_600, { left: phase % 2 === 0 });
    names.add(world.patternName);
    assert.equal(world.phase, phase);
    assert.ok(world.bullets.length > 0, `phase ${phase} should emit bullets`);
    assert.ok(world.bullets.every((bullet) => bullet.asset.startsWith("/assets/")));
  }
  assert.equal(names.size, 4);

  let overflow = engine.forceFinalePhase(engine.createFinaleWorld(zeroLoadout(), { seed: 41 }), 4);
  overflow.player.invulnerableMs = 999_999;
  overflow = advance(overflow, 30_000);
  assert.ok(overflow.bullets.length <= 480);
});

test("shields absorb one collision and invulnerability rejects the overlapping follow-up", () => {
  const loadout = zeroLoadout();
  loadout.upgrades.loot = 3;
  let world = engine.createFinaleWorld(loadout, { preview: true, seed: 5 });
  const initialHp = world.player.hp;
  const initialShields = world.player.shield;
  world.bullets = [overlappingBullet(world, 1), overlappingBullet(world, 2)];
  world = engine.updateFinaleWorld(world, {}, 16);
  assert.equal(world.player.shield, initialShields - 1);
  assert.equal(world.player.hp, initialHp);
  assert.equal(world.playerHit, true);
  assert.ok(world.player.invulnerableMs > 0);
  assert.equal(world.bullets.length, 1);

  world.bullets.push(overlappingBullet(world, 3));
  const protectedWorld = engine.updateFinaleWorld(world, {}, 16);
  assert.equal(protectedWorld.player.shield, world.player.shield);
  assert.equal(protectedWorld.player.hp, world.player.hp);
});

test("shockwave research deletes nearby hostile assets without deleting distant bullets", () => {
  const loadout = zeroLoadout();
  loadout.upgrades.shockwave = 3;
  let world = engine.createFinaleWorld(loadout, { preview: true, seed: 18 });
  const near = overlappingBullet(world, 1);
  near.x += world.stats.pulseRadius * 0.5;
  const far = overlappingBullet(world, 2);
  far.x = 30;
  far.y = 110;
  world.bullets = [near, far];
  world = engine.updateFinaleWorld(world, { pulse: true }, 16);
  assert.equal(world.pulse, true);
  assert.equal(world.pulseState.count, 1);
  assert.equal(world.pulseState.removed, 1);
  assert.equal(world.bullets.length, 1);
  assert.equal(world.bullets[0].id, far.id);
  assert.ok(world.pulseState.cooldownMs > 0);
});

test("automatic volleys exercise criticals and combos before execution wins phase four", () => {
  let world = engine.createFinaleWorld(engine.maximumFinaleLoadout(), { preview: true, seed: 77 });
  world = engine.forceFinalePhase(world, 1);
  world = advance(world, 3_200, { focus: true });
  assert.ok(world.player.volleysFired >= 10);
  assert.ok(world.player.comboVolleys >= 3);
  assert.ok(world.player.criticalShots > 0);
  assert.ok(world.player.damageDealt > 0);

  world = engine.forceFinalePhase(world, 4);
  world = advance(world, 900, { focus: true });
  assert.equal(world.status, "victory");
  assert.equal(world.victory, true);
  assert.equal(world.boss.hp, 0);
  assert.equal(world.player.executionTriggered, true);
  assert.equal(world.patternName, "GLITCH PURGED");
});

test("an unshielded final hit ends the run in defeat", () => {
  let world = engine.createFinaleWorld(zeroLoadout(), { preview: true, seed: 3 });
  world.player.hp = 1;
  world.bullets = [overlappingBullet(world)];
  world = engine.updateFinaleWorld(world, {}, 16);
  assert.equal(world.status, "defeat");
  assert.equal(world.defeat, true);
  assert.equal(world.player.hp, 0);
  assert.equal(world.patternName, "GUILD CORE LOST");
});
