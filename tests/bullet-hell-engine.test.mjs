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

function overlappingBullet(world, id = 900_000, overrides = {}) {
  return {
    id,
    x: world.player.x,
    y: world.player.y,
    vx: 0,
    vy: 1,
    ax: 0,
    ay: 0,
    cardSize: engine.FINALE_ASSET_BULLET_CARD_SIZE,
    rotation: 0,
    spriteIndex: 0,
    spin: 0,
    turnRate: 0,
    ageMs: engine.FINALE_TELEGRAPH_MS,
    telegraphMs: engine.FINALE_TELEGRAPH_MS,
    lifetimeMs: 10_000,
    damage: 1,
    kind: "error",
    grazed: false,
    ...overrides,
  };
}

function withoutBulletId(bullet) {
  const pattern = { ...bullet };
  Reflect.deleteProperty(pattern, "id");
  return pattern;
}

function rayIntersectsBox(origin, velocity, box) {
  let entry = Number.NEGATIVE_INFINITY;
  let exit = Number.POSITIVE_INFINITY;
  for (const axis of ["x", "y"]) {
    if (Math.abs(velocity[axis]) < 1e-12) {
      if (origin[axis] < box[`min${axis}`] || origin[axis] > box[`max${axis}`]) return false;
      continue;
    }
    const first = (box[`min${axis}`] - origin[axis]) / velocity[axis];
    const second = (box[`max${axis}`] - origin[axis]) / velocity[axis];
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
  }
  return exit >= Math.max(0, entry);
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
  assert.equal(plain.stats.hitRadius, 45);
  assert.equal(highHall.stats.hitRadius, 45);
  assert.equal(plain.stats.grazeRadius, 64);
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

test("edge cards spawn one at a time, aim through jitter, and replay from the phase-two seed", () => {
  let first = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 0xace5 }), "bulletHell");
  first.player.invulnerableMs = 999_999;
  const jitterBox = {
    minx: first.player.x - 56,
    maxx: first.player.x + 56,
    miny: first.player.y - 56,
    maxy: first.player.y + 56,
  };
  const seen = new Set();
  const spawned = [];
  const spawnTimes = [];
  let previousCount = 0;
  for (let elapsed = 16; spawned.length < engine.FINALE_BULLET_CAP; elapsed += 16) {
    first = engine.updateFinaleWorld(first, {}, 16);
    assert.ok(first.bullets.length - previousCount <= 1, "a fixed step may add at most one card");
    previousCount = first.bullets.length;
    for (const bullet of first.bullets) {
      if (seen.has(bullet.id)) continue;
      seen.add(bullet.id);
      spawned.push({ ...bullet });
      spawnTimes.push(elapsed);
    }
  }
  assert.equal(spawnTimes[0], 16);
  assert.ok(spawnTimes.slice(1).every((time, index) => {
    const cadence = time - spawnTimes[index];
    return cadence === 512 || cadence === 528;
  }), `spawn cadence must stay within one fixed step of 520ms: ${spawnTimes.join(",")}`);
  assert.equal(first.bullets.length, 5);

  let nonCentralAim = false;
  const halfCard = engine.FINALE_ASSET_BULLET_CARD_SIZE / 2;
  for (const bullet of spawned) {
    const speed = Math.hypot(bullet.vx, bullet.vy);
    assert.ok(speed >= 112 && speed < 136);
    assert.equal(rayIntersectsBox(bullet, { x: bullet.vx / speed, y: bullet.vy / speed }, jitterBox), true);
    const centerCross = Math.abs(
      (first.player.x - bullet.x) * (bullet.vy / speed)
      - (first.player.y - bullet.y) * (bullet.vx / speed),
    );
    nonCentralAim ||= centerCross > 0.01;
    assert.ok(
      bullet.y === 92 + halfCard
      || bullet.x === halfCard
      || bullet.x === engine.FINALE_WIDTH - halfCard,
      "bullet did not originate on a supported battlefield edge",
    );
    assert.equal(bullet.cardSize, engine.FINALE_ASSET_BULLET_CARD_SIZE);
  }
  assert.equal(nonCentralAim, true, "at least one projectile must retain deterministic aim error");
  assert.ok(spawned.some((bullet) => bullet.spriteIndex >= 37), "selectors stay unbounded for manifest wrapping");

  let replay = engine.restartFinalePhaseTwo({ ...first, status: "defeat" });
  replay.player.invulnerableMs = 999_999;
  replay = advance(replay, spawnTimes.at(-1));
  assert.deepEqual(replay.bullets.map(withoutBulletId), first.bullets.map(withoutBulletId));
  assert.ok(replay.bullets[0].id > first.bullets.at(-1).id, "event serials remain globally monotonic across retry");
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
  firing = advance(firing, 16);
  assert.equal(firing.bullets.length, 1);
  const halfCard = engine.FINALE_ASSET_BULLET_CARD_SIZE / 2;
  assert.ok(firing.bullets.every((bullet) => (
    bullet.x === halfCard
    || bullet.x === engine.FINALE_WIDTH - halfCard
    || bullet.y === 92 + halfCard
  )), "the first asset card must enter from the top, left, or right battlefield edge");
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

test("large rotating edge cards stay at exactly five simultaneous bullets", () => {
  let world = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 12 }), "bulletHell");
  world.player.invulnerableMs = 999_999;
  let observedMaximum = 0;
  let observedTelegraph = false;
  let observedRotation = false;
  for (let elapsed = 0; elapsed < 34_000; elapsed += 16) {
    const rotations = new Map(world.bullets.map((bullet) => [bullet.id, bullet.rotation]));
    world = engine.updateFinaleWorld(world, {}, 16);
    observedMaximum = Math.max(observedMaximum, world.bullets.length);
    observedTelegraph ||= world.bullets.some((bullet) => bullet.ageMs < bullet.telegraphMs && bullet.telegraphMs >= 500);
    observedRotation ||= world.bullets.some((bullet) => rotations.has(bullet.id) && rotations.get(bullet.id) !== bullet.rotation);
    assert.ok(world.bullets.length <= engine.FINALE_BULLET_CAP);
    assert.ok(world.bullets.every((bullet) => bullet.cardSize === engine.FINALE_ASSET_BULLET_CARD_SIZE));
    assert.ok(world.bullets.every((bullet) => bullet.spin !== 0));
  }
  assert.equal(observedTelegraph, true);
  assert.equal(observedRotation, true);
  assert.equal(observedMaximum, 5);
  assert.equal(engine.FINALE_BULLET_CAP, 5);

  let imported = engine.forceFinaleMode(engine.createFinaleWorld(loadout(), { seed: 120 }), "bulletHell");
  imported.boss.attackCooldownMs = 999_999;
  imported.bullets = Array.from({ length: 9 }, (_, index) => overlappingBullet(imported, 80_000 + index, {
    x: 120 + index * 20,
    y: 220,
    ageMs: 0,
    telegraphMs: 10_000,
  }));
  imported = engine.updateFinaleWorld(imported, {}, 16);
  assert.equal(imported.bullets.length, 5, "the cap also repairs imported or debug-mutated state");
});

test("hall-specific alpha masks hit painted cells but not transparent frame corners", () => {
  const corners = [[-84, -84], [84, -84], [-84, 84], [84, 84]];
  for (let hallLevel = 1; hallLevel <= 6; hallLevel += 1) {
    const cells = engine.finaleGuildMaskCells(hallLevel);
    assert.ok(cells.length > 0, `hall ${hallLevel} must have collision cells`);
    assert.ok(cells.every((cell) => (
      Math.abs(cell.x) + cell.radius <= engine.FINALE_GUILD_SIZE / 2
      && Math.abs(cell.y) + cell.radius <= engine.FINALE_GUILD_SIZE / 2
    )), `hall ${hallLevel} cells must stay inside the 90px sprite frame`);

    for (const [offsetX, offsetY] of corners) {
      let cornerWorld = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel }), { seed: hallLevel }), "bulletHell");
      cornerWorld.player.invulnerableMs = 0;
      cornerWorld.boss.attackCooldownMs = 999_999;
      cornerWorld.bullets = [overlappingBullet(cornerWorld, 90_000 + hallLevel, {
        x: cornerWorld.player.x + offsetX,
        y: cornerWorld.player.y + offsetY,
        cardSize: engine.FINALE_ASSET_BULLET_CARD_SIZE,
        rotation: 0,
        vx: 0,
        vy: 0,
      })];
      cornerWorld = engine.updateFinaleWorld(cornerWorld, {}, 16);
      assert.equal(cornerWorld.player.shield, 1, `hall ${hallLevel} transparent corner must not absorb a hit`);
    }

    const opaqueCell = cells[Math.floor(cells.length / 2)];
    let opaqueWorld = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel }), { seed: hallLevel }), "bulletHell");
    opaqueWorld.player.invulnerableMs = 0;
    opaqueWorld.boss.attackCooldownMs = 999_999;
    opaqueWorld.bullets = [overlappingBullet(opaqueWorld, 91_000 + hallLevel, {
      x: opaqueWorld.player.x + opaqueCell.x,
      y: opaqueWorld.player.y + opaqueCell.y,
      cardSize: engine.FINALE_ASSET_BULLET_CARD_SIZE,
      vx: 0,
      vy: 0,
    })];
    opaqueWorld = engine.updateFinaleWorld(opaqueWorld, {}, 16);
    assert.equal(opaqueWorld.player.shield, 0, `hall ${hallLevel} painted cell must absorb a hit`);

    let topLeft = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel }), { seed: hallLevel }), "bulletHell");
    topLeft.player.invulnerableMs = 999_999;
    topLeft = advance(topLeft, 5_000, { left: true, up: true });
    assert.equal(topLeft.player.x, 45);
    assert.equal(topLeft.player.y, 92 + 45);
    assert.ok(cells.every((cell) => (
      topLeft.player.x + cell.x - cell.radius >= 0
      && topLeft.player.y + cell.y - cell.radius >= 92
    )));

    let bottomRight = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel }), { seed: hallLevel }), "bulletHell");
    bottomRight.player.invulnerableMs = 999_999;
    bottomRight = advance(bottomRight, 5_000, { right: true, down: true });
    assert.equal(bottomRight.player.x, engine.FINALE_WIDTH - 45);
    assert.equal(bottomRight.player.y, engine.FINALE_HEIGHT - 45);
    assert.ok(cells.every((cell) => (
      bottomRight.player.x + cell.x + cell.radius <= engine.FINALE_WIDTH
      && bottomRight.player.y + cell.y + cell.radius <= engine.FINALE_HEIGHT
    )));
  }
});

test("rotated card corners collide with alpha cells while a separated corner does not", () => {
  const cells = engine.finaleGuildMaskCells(1);
  const topCell = cells.reduce((top, cell) => cell.y < top.y ? cell : top);
  const cardCornerReach = engine.FINALE_ASSET_BULLET_CARD_SIZE / Math.sqrt(2);

  let touching = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel: 1 }), { seed: 301 }), "bulletHell");
  touching.player.invulnerableMs = 0;
  touching.boss.attackCooldownMs = 999_999;
  touching.bullets = [overlappingBullet(touching, 92_001, {
    x: touching.player.x + topCell.x,
    y: touching.player.y + topCell.y - cardCornerReach + topCell.radius * 0.5,
    rotation: Math.PI / 4,
    vx: 0,
    vy: 0,
  })];
  touching = engine.updateFinaleWorld(touching, {}, 16);
  assert.equal(touching.player.shield, 0, "the visible rotated card corner must hit the painted cell");

  let separated = engine.forceFinaleMode(engine.createFinaleWorld(loadout({ hallLevel: 1 }), { seed: 302 }), "bulletHell");
  separated.player.invulnerableMs = 0;
  separated.boss.attackCooldownMs = 999_999;
  separated.bullets = [overlappingBullet(separated, 92_002, {
    x: separated.player.x + topCell.x,
    y: separated.player.y + topCell.y - cardCornerReach - topCell.radius - 0.5,
    rotation: Math.PI / 4,
    vx: 0,
    vy: 0,
  })];
  separated = engine.updateFinaleWorld(separated, {}, 16);
  assert.equal(separated.player.shield, 1, "a rotated card corner outside the alpha cell must not hit");
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
