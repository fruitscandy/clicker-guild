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

function loadout({ hallLevel = 1, weaponLevel = 0, partySize = 0, upgradeLevel = 0 } = {}) {
  return {
    upgrades: Object.fromEntries(Object.keys(engine.FINALE_UPGRADE_CAPS).map((key) => [key, upgradeLevel])),
    weaponLevel,
    hallLevel,
    partySize,
  };
}

function advance(world, milliseconds, input = {}) {
  let next = world;
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 16) {
    next = engine.updateFinaleWorld(next, input, Math.min(16, milliseconds - elapsed));
    if (next.status !== "playing") break;
  }
  return next;
}

function bossClick(world, nowMs) {
  return engine.attackFinaleBoss(world, world.boss.x, world.boss.y, nowMs);
}

function overlappingBullet(world, id = 900_000) {
  return {
    id,
    x: world.player.x,
    y: world.player.y,
    vx: 0,
    vy: 1,
    ax: 0,
    ay: 0,
    radius: 8,
    rotation: 0,
    spriteIndex: 0,
    spin: 0,
    turnRate: 0,
    ageMs: engine.FINALE_TELEGRAPH_MS,
    telegraphMs: engine.FINALE_TELEGRAPH_MS,
    lifetimeMs: 10_000,
    damage: 1,
    kind: "error",
    asset: "/favicon.svg",
    grazed: false,
  };
}

test("only guild hall level survives loadout normalization and affects combat", () => {
  assert.deepEqual(engine.maximumFinaleLoadout(), { hallLevel: 6 });
  const hallOnly = engine.createFinaleWorld({ hallLevel: 3 }, { seed: 1 });
  assert.equal(hallOnly.loadout.hallLevel, 3);

  const plain = engine.createFinaleWorld(loadout({ hallLevel: 1 }), { seed: 1 });
  const noisy = engine.createFinaleWorld(loadout({
    hallLevel: 1,
    weaponLevel: 14,
    partySize: 4,
    upgradeLevel: 99,
  }), { seed: 1 });
  assert.deepEqual(noisy.stats, plain.stats);
  assert.equal(noisy.loadout.weaponLevel, 0);
  assert.equal(noisy.loadout.partySize, 0);
  assert.ok(Object.values(noisy.loadout.upgrades).every((level) => level === 0));

  const highHall = engine.createFinaleWorld(loadout({ hallLevel: 6 }), { seed: 1 });
  assert.equal(plain.stats.maxHp, 4);
  assert.equal(highHall.stats.maxHp, 5);
  assert.equal(plain.stats.maxShields, 1);
  assert.equal(highHall.stats.maxShields, 1);
  assert.equal(plain.stats.hitRadius, 7);
  assert.equal(highHall.stats.hitRadius, 7);
  assert.equal(plain.stats.moveSpeed, highHall.stats.moveSpeed);
  assert.equal(plain.stats.clickDamage, 1);
  assert.equal(highHall.stats.clickDamage, 1.25);
  assert.equal(highHall.stats.shotCount, 0);
  assert.equal(highHall.stats.droneCount, 0);
});

test("same seed and inputs produce deterministic phase-two patterns", () => {
  let first = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 0x12345678 }), "bulletHell");
  let second = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 0x12345678 }), "bulletHell");
  first.player.invulnerableMs = 999_999;
  second.player.invulnerableMs = 999_999;
  for (let frame = 0; frame < 320; frame += 1) {
    const input = { x: Math.sin(frame / 19), y: Math.cos(frame / 27), focus: frame % 7 < 3 };
    first = engine.updateFinaleWorld(first, input, 16);
    second = engine.updateFinaleWorld(second, input, 16);
  }
  assert.deepEqual(second, first);

  let different = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 99 }), "bulletHell");
  different.player.invulnerableMs = 999_999;
  different = advance(different, 5_120);
  assert.notDeepEqual(different.bullets, first.bullets);
});

test("boss reveal locks damage without consuming a click or cooldown", () => {
  let world = engine.createFinaleWorld(loadout(), { seed: 6 });
  const initialHp = world.boss.hp;
  const initialSerial = world.nextAttackSerial;
  world = bossClick(world, 0);
  assert.equal(world.boss.hp, initialHp);
  assert.equal(world.attackEvent, null);
  assert.equal(world.clicksLanded, 0);
  assert.equal(world.clicksMissed, 0);
  assert.equal(world.clicksRejected, 0);
  assert.equal(world.nextAttackSerial, initialSerial);

  world = advance(world, engine.FINALE_BOSS_ATTACKABLE_MS - 1);
  const boundarySerial = world.nextAttackSerial;
  world = bossClick(world, 0);
  assert.equal(world.boss.hp, initialHp, "the gathering animation remains protected immediately before the boundary");
  assert.equal(world.nextAttackSerial, boundarySerial);

  world = advance(world, 32);
  world = bossClick(world, 0);
  assert.equal(world.boss.hp, initialHp - world.stats.clickDamage);

  world = engine.forceFinaleMode(world, "field");
  assert.equal(world.modeElapsedMs, 0);
  const replayHp = world.boss.hp;
  world = bossClick(world, 1_000);
  assert.equal(world.boss.hp, replayHp, "re-entering field mode must replay the protected reveal");
});

test("boss damage requires an actual click inside the 156px circular target", () => {
  let world = engine.createFinaleWorld(loadout(), { seed: 7 });
  world = advance(world, engine.FINALE_BOSS_ATTACKABLE_MS + 16);
  const initialHp = world.boss.hp;
  world = engine.attackFinaleBoss(world, world.boss.x + world.boss.clickRadius + 1, world.boss.y, 0);
  assert.equal(world.boss.hp, initialHp);
  assert.equal(world.clicksMissed, 1);
  assert.equal(world.attackEvent.kind, "miss");

  world = engine.attackFinaleBoss(world, world.boss.x + world.boss.clickRadius, world.boss.y, 125);
  assert.equal(world.boss.hp, initialHp - world.stats.clickDamage);
  assert.equal(world.clicksLanded, 1);
  assert.equal(world.attackEvent.kind, "hit");
  assert.ok(world.boss.flashMs >= 160, "a hit should keep the whole boss visibly flashing across several frames");
  assert.equal(world.boss.clickRadius, engine.FINALE_BOSS_CLICK_RADIUS);
  assert.equal(world.boss.clickRadius * 2, 156);
});

test("click damage has a strict eight-clicks-per-second cap", () => {
  let world = engine.createFinaleWorld(loadout(), { seed: 8 });
  world = advance(world, engine.FINALE_BOSS_ATTACKABLE_MS + 16);
  world = bossClick(world, 0);
  const hpAfterFirst = world.boss.hp;
  world = bossClick(world, 124);
  assert.equal(world.boss.hp, hpAfterFirst);
  assert.equal(world.clicksRejected, 1);
  assert.equal(world.attackEvent.kind, "rate-limited");
  world = bossClick(world, 125);
  assert.ok(world.boss.hp < hpAfterFirst);
  assert.equal(world.clicksLanded, 2);
});

test("phase one has no automatic attack and takes 12-18 deliberate clicks", () => {
  for (const hallLevel of [1, 6]) {
    let world = engine.createFinaleWorld(loadout({ hallLevel }), { seed: 9 });
    world = advance(world, 30_000);
    assert.equal(world.boss.hp, world.boss.maxHp, "time alone must never damage the boss");
    assert.equal(world.shots.length, 0);
    let clicks = 0;
    while (world.mode === "field") {
      world = bossClick(world, 30_000 + clicks * 125);
      clicks += 1;
    }
    assert.ok(clicks >= 12 && clicks <= 18, `hall ${hallLevel} ended phase one in ${clicks} clicks`);
    assert.equal(world.mode, "collapse");
    assert.equal(world.status, "playing");
  }
});

test("field collapse leads to a fresh phase two without replaying phase one", () => {
  let world = engine.createFinaleWorld(loadout(), { seed: 10 });
  const fieldBossY = world.boss.y;
  world = engine.forceFinaleMode(world, "collapse");
  world = advance(world, engine.FINALE_COLLAPSE_MS - 16);
  assert.equal(world.mode, "collapse");
  assert.equal(world.boss.y, fieldBossY);
  world = advance(world, 32);
  assert.equal(world.mode, "bulletHell");
  assert.equal(world.phase, 2);
  assert.equal(world.boss.x, engine.FINALE_BOSS_ANCHOR_X);
  assert.equal(world.boss.y, engine.FINALE_BOSS_ANCHOR_Y);
  assert.equal(world.boss.y, fieldBossY, "the live boss must keep one anchor through the page fracture");
  assert.equal(world.boss.hp, 42);
  assert.equal(world.cycle, "dodge");
  assert.equal(world.player.shield, 1);

  const retried = engine.restartFinalePhaseTwo({ ...world, status: "defeat" });
  assert.equal(retried.boss.y, fieldBossY);

  let firing = engine.forceFinaleMode(world, "bulletHell");
  firing.player.invulnerableMs = 999_999;
  firing = advance(firing, 800);
  const aimedOriginY = engine.FINALE_BOSS_ANCHOR_Y + firing.boss.radius * .5;
  assert.equal(firing.bullets.filter((bullet) => bullet.y === aimedOriginY).length, 3,
    "the aimed fan must fire from the same anchored boss body");
});

test("one run reaches the ending from protected reveal through both combat phases", () => {
  let world = engine.createFinaleWorld(loadout({ hallLevel: 6 }), { seed: 101 });
  world = advance(world, engine.FINALE_BOSS_ATTACKABLE_MS + 16);
  let attackTime = 10_000;
  while (world.mode === "field") {
    world = bossClick(world, attackTime);
    attackTime += engine.FINALE_CLICK_INTERVAL_MS;
  }
  assert.equal(world.mode, "collapse");

  world = advance(world, engine.FINALE_COLLAPSE_MS + 16);
  assert.equal(world.mode, "bulletHell");
  world.player.invulnerableMs = 999_999;
  world = advance(world, engine.FINALE_DODGE_MS + 16);
  assert.equal(world.cycle, "opening");
  while (world.mode === "bulletHell") {
    world = bossClick(world, attackTime);
    attackTime += engine.FINALE_CLICK_INTERVAL_MS;
  }
  assert.equal(world.mode, "destruction");
  assert.equal(world.status, "playing");

  world = advance(world, engine.FINALE_DESTRUCTION_MS + 16);
  assert.equal(world.mode, "whiteout");
  assert.equal(world.status, "victory");
  assert.equal(world.victory, true);
});

test("phase two repeats a six-second dodge and 2.5-second double-damage opening", () => {
  let world = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 11 }), "bulletHell");
  world.player.invulnerableMs = 999_999;
  world = advance(world, engine.FINALE_DODGE_MS - 16);
  assert.equal(world.cycle, "dodge");
  const dodged = bossClick(world, 6_000);
  assert.ok(Math.abs(world.boss.hp - dodged.boss.hp - world.stats.clickDamage * 0.35) < 1e-9);
  assert.equal(dodged.attackEvent.multiplier, 0.35);

  world = advance(world, 32);
  assert.equal(world.cycle, "opening");
  assert.equal(world.bullets.length, 0);
  const opened = bossClick(world, 6_125);
  assert.equal(world.boss.hp - opened.boss.hp, world.stats.clickDamage * 2);
  assert.equal(opened.attackEvent.multiplier, 2);

  let spammed = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel: 6 }), { seed: 111 }), "bulletHell");
  for (let click = 0; click < 40; click += 1) spammed = bossClick(spammed, click * 125);
  assert.equal(spammed.mode, "bulletHell", "dodge clicks alone must not skip the first CORE OPEN");

  world = advance(opened, engine.FINALE_OPENING_MS + 16);
  assert.equal(world.cycle, "dodge");
});

test("telegraphed safe-corridor patterns stay near the 100-bullet target and below 140", () => {
  let world = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 12 }), "bulletHell");
  world.player.invulnerableMs = 999_999;
  let observedMaximum = 0;
  let observedTelegraph = false;
  for (let elapsed = 0; elapsed < 34_000; elapsed += 16) {
    world = engine.updateFinaleWorld(world, {}, 16);
    observedMaximum = Math.max(observedMaximum, world.bullets.length);
    observedTelegraph ||= world.bullets.some((bullet) => bullet.ageMs < bullet.telegraphMs && bullet.telegraphMs >= 500);
    assert.ok(world.bullets.length <= engine.FINALE_BULLET_CAP);
  }
  assert.equal(observedTelegraph, true);
  assert.ok(observedMaximum >= 80, `expected a dense but readable field, saw ${observedMaximum}`);
  assert.ok(observedMaximum <= 140);
});

test("one shield, one-second invulnerability, hull defeat, and phase-two retry are explicit", () => {
  let world = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 13 }), "bulletHell");
  const initialHp = world.player.hp;
  world.player.invulnerableMs = 0;
  world.bullets = [overlappingBullet(world, 1), overlappingBullet(world, 2)];
  world = engine.updateFinaleWorld(world, {}, 16);
  assert.equal(world.player.shield, 0);
  assert.equal(world.player.hp, initialHp);
  assert.equal(world.playerHitEvent.kind, "shield");
  assert.ok(world.player.invulnerableMs >= 984);

  world.bullets = [overlappingBullet(world, 3)];
  world = engine.updateFinaleWorld(world, {}, 16);
  assert.equal(world.player.hp, initialHp);
  assert.equal(world.playerHitEvent, null);

  for (let hit = 0; hit < initialHp; hit += 1) {
    world.player.invulnerableMs = 0;
    world.bullets = [overlappingBullet(world, 10 + hit)];
    world = engine.updateFinaleWorld(world, {}, 16);
  }
  assert.equal(world.status, "defeat");
  assert.equal(world.phase, 2);
  assert.equal(world.player.hp, 0);

  const retried = engine.restartFinalePhaseTwo(world);
  assert.equal(retried.status, "playing");
  assert.equal(retried.mode, "bulletHell");
  assert.equal(retried.phase, 2);
  assert.equal(retried.player.hp, retried.player.maxHp);
  assert.equal(retried.player.shield, 1);
  assert.equal(retried.boss.hp, retried.boss.maxHp);
});

test("phase-two victory reserves success for destruction followed by whiteout", () => {
  let world = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 14 }), "bulletHell");
  world.cycle = "opening";
  world.boss.hp = world.stats.clickDamage * 2;
  world = bossClick(world, 0);
  assert.equal(world.mode, "destruction");
  assert.equal(world.status, "playing");
  assert.equal(world.victory, false);
  world = advance(world, engine.FINALE_DESTRUCTION_MS - 16);
  assert.equal(world.mode, "destruction");
  world = advance(world, 32);
  assert.equal(world.mode, "whiteout");
  assert.equal(world.status, "victory");
  assert.equal(world.victory, true);
});

test("there is no timeout or enrage failure", () => {
  let world = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 15 }), "bulletHell");
  world.player.invulnerableMs = 1_000_000;
  const bossHp = world.boss.hp;
  world = advance(world, 180_000);
  assert.equal(world.status, "playing");
  assert.equal(world.boss.hp, bossHp);
  assert.equal(world.shots.length, 0);
});
