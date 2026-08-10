export const FINALE_WIDTH = 960;
export const FINALE_HEIGHT = 600;

const FIXED_STEP_MS = 16;
const MAX_UPDATE_MS = 512;
const MAX_BULLETS = 480;
const MAX_SHOTS = 180;
const ARENA_TOP = 92;
const DEFAULT_SEED = 0xc0de_2026;

export type FinaleUpgradeKey =
  | "range"
  | "critical"
  | "combo"
  | "execution"
  | "shockwave"
  | "momentum"
  | "time"
  | "scout"
  | "guild"
  | "gold"
  | "tavern"
  | "loot";

export type FinaleUpgrades = Record<FinaleUpgradeKey, number>;

export type FinaleLoadout = {
  upgrades: FinaleUpgrades;
  weaponLevel: number;
  hallLevel: number;
  partySize: number;
};

export type FinaleInput = {
  x?: number;
  y?: number;
  left?: boolean;
  right?: boolean;
  up?: boolean;
  down?: boolean;
  focus?: boolean;
  pulse?: boolean;
};

export type FinaleStatus = "playing" | "victory" | "defeat";
export type FinalePhase = 1 | 2 | 3 | 4;
export type FinaleBulletKind = "weapon" | "upgrade" | "loot" | "guild" | "error";

export type FinaleStats = {
  maxHp: number;
  maxShields: number;
  moveSpeed: number;
  focusSpeed: number;
  hitRadius: number;
  grazeRadius: number;
  shotDamage: number;
  shotIntervalMs: number;
  shotSpeed: number;
  shotCount: number;
  shotSpread: number;
  droneCount: number;
  criticalChance: number;
  criticalMultiplier: number;
  comboEvery: number;
  comboMultiplier: number;
  executionThreshold: number;
  pulseCooldownMs: number;
  pulseRadius: number;
  invulnerabilityMs: number;
  warningMs: number;
  scoreMultiplier: number;
  shieldEveryGrazes: number;
};

export type FinalePlayer = {
  x: number;
  y: number;
  radius: number;
  hitRadius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShields: number;
  invulnerableMs: number;
  shotCooldownMs: number;
  volleysFired: number;
  criticalShots: number;
  comboVolleys: number;
  damageDealt: number;
  executionTriggered: boolean;
};

export type FinaleBoss = {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  phase: FinalePhase;
  phaseName: string;
  patternName: string;
  phaseElapsed: number;
  attackCooldownMs: number;
  secondaryCooldownMs: number;
  patternAngle: number;
};

export type FinaleBullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  radius: number;
  rotation: number;
  spriteIndex: number;
  spin: number;
  turnRate: number;
  ageMs: number;
  lifetimeMs: number;
  damage: number;
  kind: FinaleBulletKind;
  asset: string;
  grazed: boolean;
};

export type FinaleShot = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  critical: boolean;
  combo: boolean;
  piercing: boolean;
  hitBoss: boolean;
  asset: string;
};

export type FinalePulse = {
  ready: boolean;
  cooldownMs: number;
  activeMs: number;
  radius: number;
  count: number;
  removed: number;
};

export type FinaleWorld = {
  width: number;
  height: number;
  preview: boolean;
  loadout: FinaleLoadout;
  stats: FinaleStats;
  player: FinalePlayer;
  boss: FinaleBoss;
  bullets: FinaleBullet[];
  shots: FinaleShot[];
  status: FinaleStatus;
  phase: FinalePhase;
  phaseName: string;
  patternName: string;
  elapsed: number;
  elapsedMs: number;
  score: number;
  grazes: number;
  pulse: boolean;
  pulseRadius: number;
  pulseState: FinalePulse;
  playerHit: boolean;
  phaseChanged: boolean;
  victory: boolean;
  defeat: boolean;
  rngState: number;
  accumulatorMs: number;
  nextBulletId: number;
  nextShotId: number;
};

export const FINALE_UPGRADE_CAPS: FinaleUpgrades = {
  range: 7,
  critical: 4,
  combo: 4,
  execution: 3,
  shockwave: 3,
  momentum: 3,
  time: 4,
  scout: 3,
  guild: 5,
  gold: 4,
  tavern: 3,
  loot: 3,
};

const UPGRADE_KEYS = Object.keys(FINALE_UPGRADE_CAPS) as FinaleUpgradeKey[];

const WEAPON_DAMAGE_SCALE = [
  1, 2.15, 3.6, 5.4, 7.8, 11.2, 15.8, 22, 30, 41, 55, 74, 98, 128, 165,
] as const;

const WEAPON_ASSETS = [
  "/assets/weapons/tier-01-training-longsword.webp",
  "/assets/weapons/tier-02-crescent-saber.webp",
  "/assets/weapons/tier-03-twin-blades.webp",
  "/assets/weapons/tier-04-rune-breaker.webp",
  "/assets/weapons/tier-05-sky-sword.webp",
  "/assets/weapons/tier-06-nebula-saber.webp",
  "/assets/weapons/tier-07-dragon-vein.webp",
  "/assets/weapons/tier-08-celestial-sword.webp",
  "/assets/weapons/tier-09-blood-moon.webp",
  "/assets/weapons/tier-10-storm-twin-blades.webp",
  "/assets/weapons/tier-11-radiant-greatsword.webp",
  "/assets/weapons/tier-12-abyss-sword.webp",
  "/assets/weapons/tier-13-time-cutter.webp",
  "/assets/weapons/tier-14-world-tree.webp",
  "/assets/weapons/tier-15-guildmaster-divine.webp",
] as const;

const UPGRADE_ASSETS = [
  "/assets/upgrades/range.webp",
  "/assets/upgrades/critical.webp",
  "/assets/upgrades/combo.webp",
  "/assets/upgrades/execution.webp",
  "/assets/upgrades/shockwave.webp",
  "/assets/upgrades/momentum.webp",
  "/assets/upgrades/time.webp",
  "/assets/upgrades/scout.webp",
  "/assets/upgrades/guild.webp",
  "/assets/upgrades/gold.webp",
  "/assets/upgrades/tavern.webp",
  "/assets/upgrades/loot.webp",
] as const;

const GUILD_ASSETS = [
  "/assets/guild/guild-growth-sprites-v1.png",
  "/assets/guild/forge/flame-forge-v1.png",
  "/assets/guild/research/guild-enhancement-institute-v1.png",
  "/assets/guild/tavern/wandering-mug-tavern-v1.png",
  "/assets/guild/hunting/hunting-ground-outpost-v2.png",
] as const;

const PHASES: Record<FinalePhase, { phaseName: string; patternName: string; primaryMs: number; secondaryMs: number }> = {
  1: { phaseName: "ARCHIVE BREACH", patternName: "무기 에셋 역류", primaryMs: 720, secondaryMs: 1_480 },
  2: { phaseName: "UPGRADE CORRUPTION", patternName: "성장 트리 나선", primaryMs: 176, secondaryMs: 1_080 },
  3: { phaseName: "GUILD DELETION", patternName: "길드 데이터 압축벽", primaryMs: 690, secondaryMs: 930 },
  4: { phaseName: "CONTEXT OVERFLOW", patternName: "에셋 컨텍스트 폭주", primaryMs: 124, secondaryMs: 720 },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clampLevel(value: number, maximum: number) {
  return Math.round(clamp(finiteOr(value, 0), 0, maximum));
}

function normalizeLoadout(loadout: FinaleLoadout): FinaleLoadout {
  const upgrades = UPGRADE_KEYS.reduce((levels, key) => {
    levels[key] = clampLevel(loadout.upgrades[key], FINALE_UPGRADE_CAPS[key]);
    return levels;
  }, {} as FinaleUpgrades);
  return {
    upgrades,
    weaponLevel: clampLevel(loadout.weaponLevel, WEAPON_DAMAGE_SCALE.length - 1),
    hallLevel: clampLevel(loadout.hallLevel || 1, 6) || 1,
    partySize: clampLevel(loadout.partySize, 4),
  };
}

export function maximumFinaleLoadout(): FinaleLoadout {
  return {
    upgrades: { ...FINALE_UPGRADE_CAPS },
    weaponLevel: WEAPON_DAMAGE_SCALE.length - 1,
    hallLevel: 6,
    partySize: 4,
  };
}

export function deriveFinaleStats(loadout: FinaleLoadout): FinaleStats {
  const normalized = normalizeLoadout(loadout);
  const { upgrades } = normalized;
  const weaponScale = WEAPON_DAMAGE_SCALE[normalized.weaponLevel];
  const guildPower = 1 + upgrades.guild * 0.08;
  const partyPower = 1 + normalized.partySize * 0.03;
  const shockwaveUnlocked = upgrades.shockwave > 0;
  const lootUnlocked = upgrades.loot > 0;

  return {
    maxHp: 3 + Math.floor((normalized.hallLevel - 1) / 2) + Math.floor(upgrades.guild / 2),
    maxShields: Math.ceil(upgrades.loot / 2),
    moveSpeed: 232 + upgrades.momentum * 24,
    focusSpeed: 126 + upgrades.momentum * 10,
    hitRadius: Math.max(5.8, 9.4 - upgrades.scout * 1.05),
    grazeRadius: 28 + upgrades.scout * 4,
    shotDamage: Math.round(45 * Math.sqrt(weaponScale) * guildPower * partyPower),
    shotIntervalMs: Math.max(112, 310 - upgrades.combo * 30 - upgrades.momentum * 12),
    shotSpeed: 710 + upgrades.range * 18,
    shotCount: 1 + Math.floor(upgrades.range / 2),
    shotSpread: 0.034 + upgrades.range * 0.012,
    droneCount: Math.min(normalized.partySize, upgrades.tavern + 1),
    criticalChance: Math.min(0.45, upgrades.critical * 0.05),
    criticalMultiplier: 2,
    comboEvery: Math.max(3, 7 - upgrades.combo),
    comboMultiplier: upgrades.combo ? 1.25 + upgrades.combo * 0.12 : 1,
    executionThreshold: upgrades.execution ? 0.05 + upgrades.execution * 0.02 : 0,
    pulseCooldownMs: shockwaveUnlocked ? 9_200 - upgrades.shockwave * 1_300 : Number.POSITIVE_INFINITY,
    pulseRadius: shockwaveUnlocked ? 120 + upgrades.shockwave * 45 : 0,
    invulnerabilityMs: 620 + upgrades.time * 125,
    warningMs: 300 + upgrades.scout * 120,
    scoreMultiplier: 1 + upgrades.gold * 0.1,
    shieldEveryGrazes: lootUnlocked ? 34 - upgrades.loot * 6 : Number.POSITIVE_INFINITY,
  };
}

function phaseForHealth(hp: number, maxHp: number): FinalePhase {
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  if (ratio > 0.7) return 1;
  if (ratio > 0.35) return 2;
  if (ratio > 0.1) return 3;
  return 4;
}

function normalizeSeed(seed: number | undefined) {
  const normalized = finiteOr(seed ?? DEFAULT_SEED, DEFAULT_SEED) >>> 0;
  return normalized || DEFAULT_SEED;
}

export function createFinaleWorld(
  loadout: FinaleLoadout,
  options: { preview?: boolean; seed?: number } = {},
): FinaleWorld {
  const normalized = normalizeLoadout(loadout);
  const stats = deriveFinaleStats(normalized);
  const phase = PHASES[1];
  const bossMaxHp = options.preview ? 640_000 : 920_000;
  return {
    width: FINALE_WIDTH,
    height: FINALE_HEIGHT,
    preview: Boolean(options.preview),
    loadout: normalized,
    stats,
    player: {
      x: FINALE_WIDTH / 2,
      y: FINALE_HEIGHT - 72,
      radius: 24 + normalized.hallLevel * 1.5,
      hitRadius: stats.hitRadius,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      shield: stats.maxShields,
      maxShields: stats.maxShields,
      invulnerableMs: 0,
      shotCooldownMs: 0,
      volleysFired: 0,
      criticalShots: 0,
      comboVolleys: 0,
      damageDealt: 0,
      executionTriggered: false,
    },
    boss: {
      x: FINALE_WIDTH / 2,
      y: 92,
      radius: 52,
      hp: bossMaxHp,
      maxHp: bossMaxHp,
      phase: 1,
      phaseName: phase.phaseName,
      patternName: phase.patternName,
      phaseElapsed: 0,
      attackCooldownMs: 480,
      secondaryCooldownMs: 1_080,
      patternAngle: -Math.PI / 2,
    },
    bullets: [],
    shots: [],
    status: "playing",
    phase: 1,
    phaseName: phase.phaseName,
    patternName: phase.patternName,
    elapsed: 0,
    elapsedMs: 0,
    score: 0,
    grazes: 0,
    pulse: false,
    pulseRadius: 0,
    pulseState: {
      ready: stats.pulseRadius > 0,
      cooldownMs: stats.pulseRadius > 0 ? 0 : Number.POSITIVE_INFINITY,
      activeMs: 0,
      radius: stats.pulseRadius,
      count: 0,
      removed: 0,
    },
    playerHit: false,
    phaseChanged: false,
    victory: false,
    defeat: false,
    rngState: normalizeSeed(options.seed),
    accumulatorMs: 0,
    nextBulletId: 1,
    nextShotId: 1,
  };
}

function cloneWorld(world: FinaleWorld): FinaleWorld {
  return {
    ...world,
    loadout: { ...world.loadout, upgrades: { ...world.loadout.upgrades } },
    stats: { ...world.stats },
    player: { ...world.player },
    boss: { ...world.boss },
    bullets: world.bullets.map((bullet) => ({ ...bullet })),
    shots: world.shots.map((shot) => ({ ...shot })),
    pulseState: { ...world.pulseState },
  };
}

function random(world: FinaleWorld) {
  let value = world.rngState >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  world.rngState = value >>> 0 || DEFAULT_SEED;
  return world.rngState / 0x1_0000_0000;
}

function distanceSquared(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function addBullet(
  world: FinaleWorld,
  bullet: Omit<FinaleBullet, "id" | "ageMs" | "lifetimeMs" | "damage" | "grazed" | "spriteIndex"> & Partial<Pick<FinaleBullet, "lifetimeMs" | "damage" | "spriteIndex">>,
) {
  if (world.bullets.length >= MAX_BULLETS) return;
  world.bullets.push({
    ...bullet,
    id: world.nextBulletId,
    spriteIndex: bullet.spriteIndex ?? (world.nextBulletId - 1) % WEAPON_ASSETS.length,
    ageMs: 0,
    lifetimeMs: bullet.lifetimeMs ?? 9_000,
    damage: bullet.damage ?? 1,
    grazed: false,
  });
  world.nextBulletId += 1;
}

function addPolarBullet(
  world: FinaleWorld,
  angle: number,
  speed: number,
  radius: number,
  kind: FinaleBulletKind,
  asset: string,
  options: Partial<Pick<FinaleBullet, "x" | "y" | "spin" | "turnRate" | "ax" | "ay">> = {},
) {
  const speedScale = world.preview ? 0.88 : 1;
  addBullet(world, {
    x: options.x ?? world.boss.x,
    y: options.y ?? world.boss.y + world.boss.radius * 0.55,
    vx: Math.cos(angle) * speed * speedScale,
    vy: Math.sin(angle) * speed * speedScale,
    ax: options.ax ?? 0,
    ay: options.ay ?? 0,
    radius,
    rotation: angle,
    spin: options.spin ?? 0,
    turnRate: options.turnRate ?? 0,
    kind,
    asset,
  });
}

function angleToPlayer(world: FinaleWorld) {
  return Math.atan2(world.player.y - world.boss.y, world.player.x - world.boss.x);
}

function spawnAimedFan(world: FinaleWorld, count: number, spread: number, speed: number, kind: FinaleBulletKind, assets: readonly string[]) {
  const center = angleToPlayer(world);
  for (let index = 0; index < count; index += 1) {
    const offset = (index - (count - 1) / 2) * spread;
    addPolarBullet(
      world,
      center + offset,
      speed + (index % 2) * 18,
      9 + index % 3,
      kind,
      assets[index % assets.length],
      { spin: (index % 2 ? 1 : -1) * (0.8 + random(world)) },
    );
  }
}

function spawnPrimaryPattern(world: FinaleWorld) {
  const phase = world.phase;
  if (phase === 1) {
    const count = 14;
    const offset = world.boss.patternAngle + random(world) * 0.12;
    for (let index = 0; index < count; index += 1) {
      const angle = offset + index / count * Math.PI * 2;
      addPolarBullet(world, angle, 142 + index % 3 * 18, 10 + index % 2 * 2, "weapon", WEAPON_ASSETS[index], {
        spin: (index % 2 ? 1 : -1) * 1.15,
      });
    }
    world.boss.patternAngle += 0.19;
    return;
  }

  if (phase === 2) {
    for (let arm = 0; arm < 3; arm += 1) {
      const angle = world.boss.patternAngle + arm * Math.PI * 2 / 3;
      addPolarBullet(world, angle, 174 + arm * 12, 10, "upgrade", UPGRADE_ASSETS[(world.nextBulletId + arm) % UPGRADE_ASSETS.length], {
        spin: arm % 2 ? 1.7 : -1.7,
        turnRate: arm % 2 ? 0.24 : -0.24,
      });
    }
    world.boss.patternAngle += 0.22;
    return;
  }

  if (phase === 3) {
    const safeCenter = 140 + random(world) * (FINALE_WIDTH - 280);
    const gap = 154;
    for (let x = 34, index = 0; x < FINALE_WIDTH - 20; x += 52, index += 1) {
      if (Math.abs(x - safeCenter) < gap / 2) continue;
      addPolarBullet(world, Math.PI / 2 + (random(world) - 0.5) * 0.08, 188 + index % 4 * 13, 13, "guild", GUILD_ASSETS[index % GUILD_ASSETS.length], {
        x,
        y: ARENA_TOP - 34,
        spin: index % 2 ? 0.75 : -0.75,
      });
    }
    return;
  }

  for (let arm = 0; arm < 5; arm += 1) {
    const angle = world.boss.patternAngle + arm * Math.PI * 2 / 5;
    const selector = (world.nextBulletId + arm) % 3;
    const assets = selector === 0 ? WEAPON_ASSETS : selector === 1 ? UPGRADE_ASSETS : GUILD_ASSETS;
    const kind: FinaleBulletKind = selector === 0 ? "weapon" : selector === 1 ? "upgrade" : "error";
    addPolarBullet(world, angle, 214 + arm * 11, 10 + arm % 3, kind, assets[(world.nextBulletId + arm) % assets.length], {
      spin: arm % 2 ? 2.1 : -2.1,
      turnRate: arm % 2 ? 0.58 : -0.58,
    });
  }
  world.boss.patternAngle += 0.31;
}

function spawnSecondaryPattern(world: FinaleWorld) {
  if (world.phase === 1) {
    spawnAimedFan(world, 7, 0.115, 218, "weapon", WEAPON_ASSETS);
    return;
  }
  if (world.phase === 2) {
    const count = 20;
    for (let index = 0; index < count; index += 1) {
      const angle = world.boss.patternAngle * -0.7 + index / count * Math.PI * 2;
      addPolarBullet(world, angle, index % 2 ? 164 : 214, 9 + index % 4, "upgrade", UPGRADE_ASSETS[index % UPGRADE_ASSETS.length], {
        spin: index % 2 ? 1.2 : -1.2,
      });
    }
    return;
  }
  if (world.phase === 3) {
    const fromLeft = random(world) >= 0.5;
    const safeCenter = 190 + random(world) * 260;
    for (let y = ARENA_TOP + 38, index = 0; y < FINALE_HEIGHT - 24; y += 46, index += 1) {
      if (Math.abs(y - safeCenter) < 66) continue;
      addPolarBullet(world, fromLeft ? 0 : Math.PI, 252 + index % 3 * 14, 12, "loot", "/assets/loot/stage-material-cutout-atlas-v2.png", {
        x: fromLeft ? -24 : FINALE_WIDTH + 24,
        y,
        spin: fromLeft ? 1.1 : -1.1,
      });
    }
    return;
  }

  spawnAimedFan(world, 15, 0.075, 268, "error", UPGRADE_ASSETS);
  const count = 24;
  for (let index = 0; index < count; index += 1) {
    const angle = world.boss.patternAngle + index / count * Math.PI * 2;
    addPolarBullet(world, angle, 172 + index % 4 * 21, 8 + index % 5, index % 2 ? "weapon" : "upgrade", index % 2 ? WEAPON_ASSETS[index % WEAPON_ASSETS.length] : UPGRADE_ASSETS[index % UPGRADE_ASSETS.length], {
      spin: index % 2 ? 2.4 : -2.4,
    });
  }
}

function updateBossPatterns(world: FinaleWorld, deltaMs: number) {
  const definition = PHASES[world.phase];
  world.boss.attackCooldownMs -= deltaMs;
  world.boss.secondaryCooldownMs -= deltaMs;
  while (world.boss.attackCooldownMs <= 0 && world.bullets.length < MAX_BULLETS) {
    spawnPrimaryPattern(world);
    world.boss.attackCooldownMs += definition.primaryMs;
  }
  while (world.boss.secondaryCooldownMs <= 0 && world.bullets.length < MAX_BULLETS) {
    spawnSecondaryPattern(world);
    world.boss.secondaryCooldownMs += definition.secondaryMs;
  }
}

function inputAxis(input: FinaleInput) {
  const digitalX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const digitalY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  let x = clamp(finiteOr(input.x ?? digitalX, digitalX), -1, 1);
  let y = clamp(finiteOr(input.y ?? digitalY, digitalY), -1, 1);
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }
  return { x, y };
}

function movePlayer(world: FinaleWorld, input: FinaleInput, deltaSeconds: number) {
  const axis = inputAxis(input);
  const speed = input.focus ? world.stats.focusSpeed : world.stats.moveSpeed;
  const horizontalMargin = world.player.radius * 0.72;
  const verticalMargin = world.player.radius * 0.72;
  world.player.x = clamp(world.player.x + axis.x * speed * deltaSeconds, horizontalMargin, FINALE_WIDTH - horizontalMargin);
  world.player.y = clamp(world.player.y + axis.y * speed * deltaSeconds, ARENA_TOP + verticalMargin, FINALE_HEIGHT - verticalMargin);
}

function spawnPlayerVolley(world: FinaleWorld) {
  world.player.volleysFired += 1;
  const combo = world.loadout.upgrades.combo > 0 && world.player.volleysFired % world.stats.comboEvery === 0;
  if (combo) world.player.comboVolleys += 1;
  const totalShots = world.stats.shotCount + world.stats.droneCount;
  const aim = Math.atan2(world.boss.y - world.player.y, world.boss.x - world.player.x);
  const weaponAsset = WEAPON_ASSETS[world.loadout.weaponLevel];

  for (let index = 0; index < totalShots; index += 1) {
    if (world.shots.length >= MAX_SHOTS) break;
    const offset = (index - (totalShots - 1) / 2) * world.stats.shotSpread;
    const critical = random(world) < world.stats.criticalChance;
    const multiplier = (critical ? world.stats.criticalMultiplier : 1) * (combo ? world.stats.comboMultiplier : 1);
    if (critical) world.player.criticalShots += 1;
    world.shots.push({
      id: world.nextShotId,
      x: world.player.x + Math.cos(aim + Math.PI / 2) * (index - (totalShots - 1) / 2) * 7,
      y: world.player.y - world.player.radius * 0.4,
      vx: Math.cos(aim + offset) * world.stats.shotSpeed,
      vy: Math.sin(aim + offset) * world.stats.shotSpeed,
      radius: 4 + Math.min(3, world.loadout.upgrades.range * 0.35),
      damage: Math.round(world.stats.shotDamage * multiplier),
      critical,
      combo,
      piercing: world.loadout.upgrades.range >= 6 && index === Math.floor(totalShots / 2),
      hitBoss: false,
      asset: weaponAsset,
    });
    world.nextShotId += 1;
  }
}

function updatePlayerShots(world: FinaleWorld, deltaMs: number) {
  world.player.shotCooldownMs -= deltaMs;
  while (world.player.shotCooldownMs <= 0 && world.status === "playing") {
    spawnPlayerVolley(world);
    world.player.shotCooldownMs += world.stats.shotIntervalMs;
  }
}

function moveProjectiles(world: FinaleWorld, deltaMs: number) {
  const deltaSeconds = deltaMs / 1_000;
  world.bullets.forEach((bullet) => {
    if (bullet.turnRate) {
      const turn = bullet.turnRate * deltaSeconds;
      const cosine = Math.cos(turn);
      const sine = Math.sin(turn);
      const vx = bullet.vx * cosine - bullet.vy * sine;
      bullet.vy = bullet.vx * sine + bullet.vy * cosine;
      bullet.vx = vx;
    }
    bullet.vx += bullet.ax * deltaSeconds;
    bullet.vy += bullet.ay * deltaSeconds;
    bullet.x += bullet.vx * deltaSeconds;
    bullet.y += bullet.vy * deltaSeconds;
    bullet.rotation += bullet.spin * deltaSeconds;
    bullet.ageMs += deltaMs;
  });
  world.bullets = world.bullets.filter((bullet) => (
    bullet.ageMs <= bullet.lifetimeMs
    && bullet.x >= -90
    && bullet.x <= FINALE_WIDTH + 90
    && bullet.y >= ARENA_TOP - 100
    && bullet.y <= FINALE_HEIGHT + 90
  ));

  world.shots.forEach((shot) => {
    shot.x += shot.vx * deltaSeconds;
    shot.y += shot.vy * deltaSeconds;
  });
  world.shots = world.shots.filter((shot) => shot.x >= -40 && shot.x <= FINALE_WIDTH + 40 && shot.y >= -50 && shot.y <= FINALE_HEIGHT + 40);
}

function triggerPulse(world: FinaleWorld) {
  if (world.stats.pulseRadius <= 0 || world.pulseState.cooldownMs > 0) return;
  const before = world.bullets.length;
  const radiusSquared = world.stats.pulseRadius * world.stats.pulseRadius;
  world.bullets = world.bullets.filter((bullet) => distanceSquared(world.player, bullet) > radiusSquared);
  const removed = before - world.bullets.length;
  world.pulse = true;
  world.pulseRadius = 1;
  world.pulseState.ready = false;
  world.pulseState.cooldownMs = world.stats.pulseCooldownMs;
  world.pulseState.activeMs = 460;
  world.pulseState.count += 1;
  world.pulseState.removed += removed;
  world.score += Math.round(removed * 25 * world.stats.scoreMultiplier);
}

function updatePulse(world: FinaleWorld, input: FinaleInput, deltaMs: number) {
  world.pulseState.activeMs = Math.max(0, world.pulseState.activeMs - deltaMs);
  world.pulseRadius = world.pulseState.activeMs > 0
    ? world.stats.pulseRadius * (1 - world.pulseState.activeMs / 460)
    : 0;
  if (world.stats.pulseRadius <= 0) return;
  world.pulseState.cooldownMs = Math.max(0, world.pulseState.cooldownMs - deltaMs);
  world.pulseState.ready = world.pulseState.cooldownMs <= 0;
  if (world.pulseState.ready && (input.pulse || world.pulseState.cooldownMs <= 0)) triggerPulse(world);
}

function collideShotsWithBoss(world: FinaleWorld) {
  const survivors: FinaleShot[] = [];
  for (const shot of world.shots) {
    const hitDistance = world.boss.radius + shot.radius;
    if (!shot.hitBoss && distanceSquared(shot, world.boss) <= hitDistance * hitDistance) {
      const appliedDamage = Math.min(world.boss.hp, shot.damage);
      world.boss.hp = Math.max(0, world.boss.hp - shot.damage);
      world.player.damageDealt += appliedDamage;
      world.score += Math.round(appliedDamage * 0.12 * world.stats.scoreMultiplier);
      if (world.boss.hp > 0 && world.stats.executionThreshold > 0 && world.boss.hp / world.boss.maxHp <= world.stats.executionThreshold) {
        world.player.damageDealt += world.boss.hp;
        world.boss.hp = 0;
        world.player.executionTriggered = true;
      }
      if (shot.piercing) {
        shot.hitBoss = true;
        survivors.push(shot);
      }
    } else {
      survivors.push(shot);
    }
  }
  world.shots = survivors;
  if (world.boss.hp <= 0) {
    world.status = "victory";
    world.victory = true;
    world.bullets = [];
    world.score += Math.round(20_000 * world.stats.scoreMultiplier);
    world.patternName = "GLITCH PURGED";
    world.boss.patternName = world.patternName;
  }
}

function collideBulletsWithPlayer(world: FinaleWorld) {
  const survivors: FinaleBullet[] = [];
  for (const bullet of world.bullets) {
    const distance = Math.sqrt(distanceSquared(world.player, bullet));
    const hitDistance = world.player.hitRadius + bullet.radius;
    const grazeDistance = world.stats.grazeRadius + bullet.radius;

    if (distance <= hitDistance && world.player.invulnerableMs <= 0) {
      world.playerHit = true;
      if (world.player.shield > 0) world.player.shield -= 1;
      else world.player.hp = Math.max(0, world.player.hp - bullet.damage);
      world.player.invulnerableMs = world.stats.invulnerabilityMs;
      if (world.player.hp <= 0) {
        world.status = "defeat";
        world.defeat = true;
      }
      continue;
    }

    if (!bullet.grazed && distance <= grazeDistance && distance > hitDistance) {
      bullet.grazed = true;
      world.grazes += 1;
      world.score += Math.round(80 * world.stats.scoreMultiplier);
      if (
        Number.isFinite(world.stats.shieldEveryGrazes)
        && world.grazes % world.stats.shieldEveryGrazes === 0
        && world.player.shield < world.player.maxShields
      ) {
        world.player.shield += 1;
      }
    }
    survivors.push(bullet);
  }
  world.bullets = survivors;
  if (world.status === "defeat") {
    world.patternName = "GUILD CORE LOST";
    world.boss.patternName = world.patternName;
  }
}

function syncPhase(world: FinaleWorld) {
  if (world.status !== "playing") return;
  const phase = phaseForHealth(world.boss.hp, world.boss.maxHp);
  if (phase === world.phase) return;
  const definition = PHASES[phase];
  world.phase = phase;
  world.phaseName = definition.phaseName;
  world.patternName = definition.patternName;
  world.boss.phase = phase;
  world.boss.phaseName = definition.phaseName;
  world.boss.patternName = definition.patternName;
  world.boss.phaseElapsed = 0;
  world.boss.attackCooldownMs = 360;
  world.boss.secondaryCooldownMs = 760;
  world.boss.patternAngle += Math.PI / 5;
  world.bullets = [];
  world.player.invulnerableMs = Math.max(world.player.invulnerableMs, 420);
  world.phaseChanged = true;
}

function stepWorld(world: FinaleWorld, input: FinaleInput, deltaMs: number) {
  if (world.status !== "playing") return;
  const deltaSeconds = deltaMs / 1_000;
  world.elapsed += deltaMs;
  world.elapsedMs = world.elapsed;
  world.boss.phaseElapsed += deltaMs;
  world.player.invulnerableMs = Math.max(0, world.player.invulnerableMs - deltaMs);
  syncPhase(world);
  movePlayer(world, input, deltaSeconds);
  updatePulse(world, input, deltaMs);
  updateBossPatterns(world, deltaMs);
  updatePlayerShots(world, deltaMs);
  moveProjectiles(world, deltaMs);
  collideShotsWithBoss(world);
  syncPhase(world);
  if (world.status === "playing") collideBulletsWithPlayer(world);
}

export function updateFinaleWorld(world: FinaleWorld, input: FinaleInput, deltaMs: number): FinaleWorld {
  const next = cloneWorld(world);
  next.playerHit = false;
  next.pulse = false;
  next.phaseChanged = false;
  next.victory = false;
  next.defeat = false;
  if (next.status !== "playing") return next;
  const safeDelta = clamp(finiteOr(deltaMs, 0), 0, MAX_UPDATE_MS);
  next.accumulatorMs += safeDelta;
  while (next.accumulatorMs >= FIXED_STEP_MS && next.status === "playing") {
    stepWorld(next, input, FIXED_STEP_MS);
    next.accumulatorMs -= FIXED_STEP_MS;
  }
  return next;
}

export function forceFinalePhase(world: FinaleWorld, requestedPhase: number): FinaleWorld {
  const next = cloneWorld(world);
  const phase = clampLevel(requestedPhase, 4) as FinalePhase;
  const safePhase: FinalePhase = phase < 1 ? 1 : phase;
  const healthRatio: Record<FinalePhase, number> = { 1: 1, 2: 0.69, 3: 0.34, 4: 0.09 };
  const definition = PHASES[safePhase];
  next.status = "playing";
  next.playerHit = false;
  next.pulse = false;
  next.phaseChanged = true;
  next.victory = false;
  next.defeat = false;
  next.phase = safePhase;
  next.phaseName = definition.phaseName;
  next.patternName = definition.patternName;
  next.boss.phase = safePhase;
  next.boss.phaseName = definition.phaseName;
  next.boss.patternName = definition.patternName;
  next.boss.hp = Math.max(1, Math.round(next.boss.maxHp * healthRatio[safePhase]));
  next.boss.phaseElapsed = 0;
  next.boss.attackCooldownMs = 48;
  next.boss.secondaryCooldownMs = 96;
  next.boss.patternAngle = -Math.PI / 2 + (safePhase - 1) * 0.37;
  next.bullets = [];
  next.shots = [];
  next.player.shotCooldownMs = 0;
  next.player.invulnerableMs = Math.max(next.player.invulnerableMs, 320);
  next.accumulatorMs = 0;
  return next;
}
