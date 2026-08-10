export const FINALE_WIDTH = 960;
export const FINALE_HEIGHT = 600;

export const FINALE_BULLET_CAP = 6;
export const FINALE_CLICK_INTERVAL_MS = 125;
export const FINALE_TELEGRAPH_MS = 650;
export const FINALE_DODGE_MS = 6_000;
export const FINALE_OPENING_MS = 2_500;
export const FINALE_COLLAPSE_MS = 1_800;
export const FINALE_DESTRUCTION_MS = 1_600;
export const FINALE_BOSS_REVEAL_MS = 3_600;
export const FINALE_BOSS_ATTACKABLE_MS = 3_450;
export const FINALE_BOSS_CLICK_RADIUS = 78;
export const FINALE_BOSS_ANCHOR_X = FINALE_WIDTH / 2;
export const FINALE_BOSS_ANCHOR_Y = 184;
export const FINALE_PLAYER_START_X = FINALE_WIDTH / 2;
export const FINALE_PLAYER_START_Y = FINALE_HEIGHT - 72;
export const FINALE_GUILD_SIZE = 90;
export const FINALE_ASSET_BULLET_CORE_RADIUS = 8;
export const FINALE_ASSET_BULLET_VISUAL_RADIUS = 44;

const FIXED_STEP_MS = 16;
const MAX_UPDATE_MS = 512;
const ARENA_TOP = 92;
const DEFAULT_SEED = 0xc0de_2026;
const PHASE_ONE_HP = 16;
const PHASE_TWO_HP = 42;
const DODGE_CLICK_MULTIPLIER = 0.35;
const ASSET_VOLLEY_MIN = 5;
const ASSET_VOLLEY_SPEED_MIN = 112;
const ASSET_VOLLEY_SPEED_RANGE = 24;
const ASSET_VOLLEY_AIM_JITTER = 56;
const ASSET_VOLLEY_RESPAWN_MS = 900;
const GUILD_MASK_GRID_SIZE = 24;
const GUILD_MASK_CELL_SIZE = FINALE_GUILD_SIZE / GUILD_MASK_GRID_SIZE;
const GUILD_MASK_CELL_RADIUS = GUILD_MASK_CELL_SIZE * 0.42;

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

/**
 * The legacy fields remain in the transport shape so saved games and the preview
 * harness can hand the finale their existing snapshot. The finale deliberately
 * normalizes every value except hallLevel back to zero.
 */
export type FinaleLoadout = {
  hallLevel: number;
  /** @deprecated Ignored by the finale and accepted only for old save snapshots. */
  upgrades?: Partial<FinaleUpgrades>;
  /** @deprecated Ignored by the finale and accepted only for old save snapshots. */
  weaponLevel?: number;
  /** @deprecated Ignored by the finale and accepted only for old save snapshots. */
  partySize?: number;
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
export type FinalePhase = 1 | 2;
export type FinaleMode = "field" | "collapse" | "bulletHell" | "destruction" | "whiteout";
export type FinaleCycle = "dodge" | "opening";
export type FinaleBulletKind = "weapon" | "upgrade" | "loot" | "guild" | "error";
export type FinaleShotSource = "guild" | "drone";

export type FinalePlayerHitEvent = {
  kind: "shield" | "hull";
  x: number;
  y: number;
  angle: number;
  serial: number;
};

export type FinaleAttackEvent = {
  kind: "hit" | "miss" | "rate-limited";
  x: number;
  y: number;
  damage: number;
  multiplier: number;
  serial: number;
};

export type FinaleStats = {
  maxHp: number;
  maxShields: number;
  moveSpeed: number;
  focusSpeed: number;
  hitRadius: number;
  grazeRadius: number;
  clickDamage: number;
  openingMultiplier: number;
  clickIntervalMs: number;
  bossClickRadius: number;
  dodgeDurationMs: number;
  openingDurationMs: number;
  collapseDurationMs: number;
  destructionDurationMs: number;
  warningMs: number;
  invulnerabilityMs: number;
  // Compatibility fields. There is no automatic attack, drone, execution, or pulse.
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
  clickRadius: number;
  hp: number;
  maxHp: number;
  phase: FinalePhase;
  phaseName: string;
  patternName: string;
  phaseElapsed: number;
  attackCooldownMs: number;
  secondaryCooldownMs: number;
  patternAngle: number;
  flashMs: number;
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
  visualRadius: number;
  rotation: number;
  spriteIndex: number;
  spin: number;
  turnRate: number;
  ageMs: number;
  telegraphMs: number;
  lifetimeMs: number;
  damage: number;
  kind: FinaleBulletKind;
  grazed: boolean;
};

export type FinaleGuildMaskCell = Readonly<{
  x: number;
  y: number;
  radius: number;
}>;

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
  source: FinaleShotSource;
  sourceIndex: number;
  ageMs: number;
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
  mode: FinaleMode;
  modeElapsedMs: number;
  phase: FinalePhase;
  phaseName: string;
  patternName: string;
  cycle: FinaleCycle;
  cycleRemainingMs: number;
  cycleSerial: number;
  elapsed: number;
  elapsedMs: number;
  score: number;
  grazes: number;
  pulse: boolean;
  pulseRadius: number;
  pulseState: FinalePulse;
  playerHit: boolean;
  playerHitEvent: FinalePlayerHitEvent | null;
  attackEvent: FinaleAttackEvent | null;
  phaseChanged: boolean;
  victory: boolean;
  defeat: boolean;
  clicksLanded: number;
  clicksMissed: number;
  clicksRejected: number;
  lastAttackAtMs: number;
  nextAttackSerial: number;
  rngState: number;
  initialSeed: number;
  phaseTwoSeed: number;
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
const EMPTY_UPGRADES = Object.fromEntries(UPGRADE_KEYS.map((key) => [key, 0])) as FinaleUpgrades;

const MODE_COPY: Record<FinaleMode, { phaseName: string; patternName: string }> = {
  field: { phaseName: "ARCHIVE INTERVENTION", patternName: "기록 관리자 직접 타격" },
  collapse: { phaseName: "FIELD COLLAPSE", patternName: "전장 데이터 붕괴" },
  bulletHell: { phaseName: "NULL CORE", patternName: "에셋 경계 포격" },
  destruction: { phaseName: "CORE DESTRUCTION", patternName: "말소 코어 파괴" },
  whiteout: { phaseName: "ENDING UNLOCKED", patternName: "기록 복원 완료" },
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

// These masks are sampled from the centre of a 24x24 grid over each frame in
// guild-growth-sprites-v1.png (alpha >= 128). Small circles keep collision
// inside the painted silhouette instead of treating transparent frame corners
// as solid. Coordinates are converted once into the finale's 90px space.
const GUILD_ALPHA_MASK_ROWS = [
  [
    "........................", "........................", "........................", "........................",
    "........................", "........................", "........................", "........................",
    ".......##...............", ".......######..#........", ".......#########........", ".....###########........",
    ".....#############......", ".....##############.....", ".....##############.....", "......############.#....",
    "...#.#.###########.#....", "...#.#.###########.#....", "..###.############.#....", "...#.###############....",
    "...##.#############.....", "........................", "........................", "........................",
  ],
  [
    "........................", "........................", "........................", "........................",
    "........................", ".....#..................", "....###.....##..........", "....##########..........",
    "....##########..........", "....###########.........", "...#############........", "..##############........",
    "...#############........", "...###############......", "...################.....", "...################.....",
    "..#################.....", "...################.....", ".##################.....", ".##################.....",
    "..#################.....", ".............##.........", "........................", "........................",
  ],
  [
    "........................", "........................", "........................", "........................",
    ".......#................", ".......###..............", ".......#######..........", "......########.##.......",
    "....#############.......", "...##############.......", "..###############.......", ".#################......",
    "..################......", ".#################......", "##################......", "#####################...",
    "#####################...", "######################..", "#####################...", "######################..",
    "....###########.#####...", ".......#................", "........................", "........................",
  ],
  [
    "........................", "...............##.......", "...............#........", ".............#####......",
    ".......#.....#####......", ".......##....#####......", "....#..###########......", ".....#############......",
    "....##############......", "...################.....", "....###############.....", "....###############.....",
    "...################.....", "..##################....", ".####################...", "..###################..#",
    "..###################..#", ".####################..#", "..###################..#", ".....#####......###.....",
    "........................", "........................", "........................", "........................",
  ],
  [
    "........................", "..............#.........", "....#.........##........", "...##.........#.#.......",
    "...##..#.....###........", "..####.###.#####........", "..####.##########.......", "..###############.......",
    "..##############........", "..################......", "..##################....", "..##################...#",
    "..##################...#", "..##################...#", "..##################...#", "####################...#",
    "#####################..#", "####################...#", "#####################...", "...#################....",
    "...........#######......", "........................", "........................", "........................",
  ],
  [
    "........................", "..........#.............", ".........##.............", "........####............",
    "........####...#........", "........####..#.........", "..##..#######.##........", "..##..##########........",
    "..##.#############......", "#.##.#############......", "#.################......", "#.################......",
    "##################.#....", "#.##################....", "######################..", "######################..",
    "######################..", "#####################...", "#####################...", "..###############.......",
    ".....###########........", "........................", "........................", "........................",
  ],
] as const;

const GUILD_MASK_CELLS: readonly (readonly FinaleGuildMaskCell[])[] = GUILD_ALPHA_MASK_ROWS.map((rows) => (
  rows.flatMap((row, rowIndex) => [...row].flatMap((value, columnIndex) => value === "#" ? [{
    x: -FINALE_GUILD_SIZE / 2 + (columnIndex + 0.5) * GUILD_MASK_CELL_SIZE,
    y: -FINALE_GUILD_SIZE / 2 + (rowIndex + 0.5) * GUILD_MASK_CELL_SIZE,
    radius: GUILD_MASK_CELL_RADIUS,
  }] : []))
));

/** Alpha-derived conservative collision cells in logical coordinates relative to the guild centre. */
export function finaleGuildMaskCells(hallLevel: number): readonly FinaleGuildMaskCell[] {
  const index = (clampLevel(hallLevel || 1, 6) || 1) - 1;
  return GUILD_MASK_CELLS[index];
}

function normalizeSeed(seed: number | undefined) {
  const normalized = finiteOr(seed ?? DEFAULT_SEED, DEFAULT_SEED) >>> 0;
  return normalized || DEFAULT_SEED;
}

function normalizeLoadout(loadout: FinaleLoadout): FinaleLoadout {
  return {
    upgrades: { ...EMPTY_UPGRADES },
    weaponLevel: 0,
    hallLevel: clampLevel(loadout.hallLevel || 1, 6) || 1,
    partySize: 0,
  };
}

export function maximumFinaleLoadout(): FinaleLoadout {
  return { hallLevel: 6 };
}

export function deriveFinaleStats(loadout: FinaleLoadout): FinaleStats {
  const normalized = normalizeLoadout(loadout);
  const clickDamage = 1 + (normalized.hallLevel - 1) * 0.05;
  return {
    maxHp: normalized.hallLevel >= 5 ? 5 : 4,
    maxShields: 1,
    moveSpeed: 224,
    focusSpeed: 128,
    hitRadius: FINALE_GUILD_SIZE / 2,
    grazeRadius: 64,
    clickDamage,
    openingMultiplier: 2,
    clickIntervalMs: FINALE_CLICK_INTERVAL_MS,
    bossClickRadius: FINALE_BOSS_CLICK_RADIUS,
    dodgeDurationMs: FINALE_DODGE_MS,
    openingDurationMs: FINALE_OPENING_MS,
    collapseDurationMs: FINALE_COLLAPSE_MS,
    destructionDurationMs: FINALE_DESTRUCTION_MS,
    warningMs: FINALE_TELEGRAPH_MS,
    invulnerabilityMs: 1_000,
    shotDamage: clickDamage,
    shotIntervalMs: FINALE_CLICK_INTERVAL_MS,
    shotSpeed: 0,
    shotCount: 0,
    shotSpread: 0,
    droneCount: 0,
    criticalChance: 0,
    criticalMultiplier: 1,
    comboEvery: Number.POSITIVE_INFINITY,
    comboMultiplier: 1,
    executionThreshold: 0,
    pulseCooldownMs: Number.POSITIVE_INFINITY,
    pulseRadius: 0,
    scoreMultiplier: 1,
    shieldEveryGrazes: Number.POSITIVE_INFINITY,
  };
}

const DRONE_FORMATIONS = [
  [],
  [{ x: 0, y: -50 }],
  [{ x: -60, y: 4 }, { x: 60, y: 4 }],
  [{ x: -60, y: 7 }, { x: 60, y: 7 }, { x: 0, y: -50 }],
  [{ x: -60, y: 9 }, { x: 60, y: 9 }, { x: -34, y: -44 }, { x: 34, y: -44 }],
] as const;

/** Compatibility helper for the previous renderer. New finale stats always request zero drones. */
export function finaleDroneOffsets(count: number): ReadonlyArray<{ readonly x: number; readonly y: number }> {
  return DRONE_FORMATIONS[clampLevel(count, 4)];
}

export function createFinaleWorld(
  loadout: FinaleLoadout,
  options: { preview?: boolean; seed?: number } = {},
): FinaleWorld {
  const normalized = normalizeLoadout(loadout);
  const stats = deriveFinaleStats(normalized);
  const initialSeed = normalizeSeed(options.seed);
  const phaseTwoSeed = normalizeSeed(initialSeed ^ 0x9e37_79b9);
  const copy = MODE_COPY.field;
  return {
    width: FINALE_WIDTH,
    height: FINALE_HEIGHT,
    preview: Boolean(options.preview),
    loadout: normalized,
    stats,
    player: {
      x: FINALE_PLAYER_START_X,
      y: FINALE_PLAYER_START_Y,
      radius: FINALE_GUILD_SIZE / 2,
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
      x: FINALE_BOSS_ANCHOR_X,
      y: FINALE_BOSS_ANCHOR_Y,
      radius: 56,
      clickRadius: stats.bossClickRadius,
      hp: PHASE_ONE_HP,
      maxHp: PHASE_ONE_HP,
      phase: 1,
      phaseName: copy.phaseName,
      patternName: copy.patternName,
      phaseElapsed: 0,
      attackCooldownMs: 0,
      secondaryCooldownMs: 0,
      patternAngle: -Math.PI / 2,
      flashMs: 0,
    },
    bullets: [],
    shots: [],
    status: "playing",
    mode: "field",
    modeElapsedMs: 0,
    phase: 1,
    phaseName: copy.phaseName,
    patternName: copy.patternName,
    cycle: "dodge",
    cycleRemainingMs: stats.dodgeDurationMs,
    cycleSerial: 0,
    elapsed: 0,
    elapsedMs: 0,
    score: 0,
    grazes: 0,
    pulse: false,
    pulseRadius: 0,
    pulseState: {
      ready: false,
      cooldownMs: Number.POSITIVE_INFINITY,
      activeMs: 0,
      radius: 0,
      count: 0,
      removed: 0,
    },
    playerHit: false,
    playerHitEvent: null,
    attackEvent: null,
    phaseChanged: false,
    victory: false,
    defeat: false,
    clicksLanded: 0,
    clicksMissed: 0,
    clicksRejected: 0,
    lastAttackAtMs: Number.NEGATIVE_INFINITY,
    nextAttackSerial: 1,
    rngState: initialSeed,
    initialSeed,
    phaseTwoSeed,
    accumulatorMs: 0,
    nextBulletId: 1,
    nextShotId: 1,
  };
}

function cloneWorld(world: FinaleWorld): FinaleWorld {
  return {
    ...world,
    loadout: { ...world.loadout, upgrades: { ...(world.loadout.upgrades ?? EMPTY_UPGRADES) } },
    stats: { ...world.stats },
    player: { ...world.player },
    boss: { ...world.boss },
    bullets: world.bullets.map((bullet) => ({ ...bullet })),
    shots: world.shots.map((shot) => ({ ...shot })),
    pulseState: { ...world.pulseState },
    playerHitEvent: world.playerHitEvent ? { ...world.playerHitEvent } : null,
    attackEvent: world.attackEvent ? { ...world.attackEvent } : null,
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

function applyModeCopy(world: FinaleWorld, mode: FinaleMode) {
  const copy = MODE_COPY[mode];
  world.phaseName = copy.phaseName;
  world.patternName = copy.patternName;
  world.boss.phaseName = copy.phaseName;
  world.boss.patternName = copy.patternName;
}

function resetTransientEvents(world: FinaleWorld) {
  world.playerHit = false;
  world.playerHitEvent = null;
  world.attackEvent = null;
  world.pulse = false;
  world.phaseChanged = false;
  world.victory = false;
  world.defeat = false;
}

function configurePhaseOne(world: FinaleWorld) {
  world.status = "playing";
  world.mode = "field";
  world.modeElapsedMs = 0;
  world.phase = 1;
  world.boss.phase = 1;
  world.boss.x = FINALE_BOSS_ANCHOR_X;
  world.boss.y = FINALE_BOSS_ANCHOR_Y;
  world.boss.hp = PHASE_ONE_HP;
  world.boss.maxHp = PHASE_ONE_HP;
  world.boss.phaseElapsed = 0;
  world.boss.flashMs = 0;
  world.bullets = [];
  world.shots = [];
  world.player.x = FINALE_PLAYER_START_X;
  world.player.y = FINALE_PLAYER_START_Y;
  world.player.hp = world.player.maxHp;
  world.player.shield = world.player.maxShields;
  world.player.invulnerableMs = 0;
  world.rngState = world.initialSeed;
  world.accumulatorMs = 0;
  world.lastAttackAtMs = Number.NEGATIVE_INFINITY;
  applyModeCopy(world, "field");
}

function configurePhaseTwo(world: FinaleWorld) {
  world.status = "playing";
  world.mode = "bulletHell";
  world.modeElapsedMs = 0;
  world.phase = 2;
  world.boss.phase = 2;
  world.boss.x = FINALE_BOSS_ANCHOR_X;
  world.boss.y = FINALE_BOSS_ANCHOR_Y;
  world.boss.hp = PHASE_TWO_HP;
  world.boss.maxHp = PHASE_TWO_HP;
  world.boss.phaseElapsed = 0;
  world.boss.attackCooldownMs = 0;
  world.boss.secondaryCooldownMs = 800;
  world.boss.patternAngle = -Math.PI / 2;
  world.boss.flashMs = 0;
  world.cycle = "dodge";
  world.cycleRemainingMs = world.stats.dodgeDurationMs;
  world.cycleSerial = 0;
  world.bullets = [];
  world.shots = [];
  world.player.x = FINALE_PLAYER_START_X;
  world.player.y = FINALE_PLAYER_START_Y;
  world.player.hp = world.player.maxHp;
  world.player.shield = world.player.maxShields;
  world.player.invulnerableMs = 700;
  world.rngState = world.phaseTwoSeed;
  world.accumulatorMs = 0;
  world.lastAttackAtMs = Number.NEGATIVE_INFINITY;
  applyModeCopy(world, "bulletHell");
}

function enterCollapse(world: FinaleWorld) {
  world.mode = "collapse";
  world.modeElapsedMs = 0;
  world.boss.hp = 0;
  world.bullets = [];
  world.shots = [];
  world.phaseChanged = true;
  applyModeCopy(world, "collapse");
}

function enterDestruction(world: FinaleWorld) {
  world.mode = "destruction";
  world.modeElapsedMs = 0;
  world.boss.hp = 0;
  world.bullets = [];
  world.shots = [];
  world.phaseChanged = true;
  applyModeCopy(world, "destruction");
}

function enterWhiteout(world: FinaleWorld) {
  world.mode = "whiteout";
  world.modeElapsedMs = 0;
  world.status = "victory";
  world.victory = true;
  world.bullets = [];
  world.phaseChanged = true;
  applyModeCopy(world, "whiteout");
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
  const margin = FINALE_GUILD_SIZE / 2;
  world.player.x = clamp(world.player.x + axis.x * speed * deltaSeconds, margin, FINALE_WIDTH - margin);
  world.player.y = clamp(world.player.y + axis.y * speed * deltaSeconds, ARENA_TOP + margin, FINALE_HEIGHT - margin);
}

function addBullet(
  world: FinaleWorld,
  bullet: Omit<FinaleBullet, "id" | "ageMs" | "grazed" | "spriteIndex"> & Partial<Pick<FinaleBullet, "spriteIndex">>,
) {
  if (world.bullets.length >= FINALE_BULLET_CAP) return;
  world.bullets.push({
    ...bullet,
    id: world.nextBulletId,
    spriteIndex: bullet.spriteIndex ?? world.nextBulletId - 1,
    ageMs: 0,
    grazed: false,
  });
  world.nextBulletId += 1;
}

function spawnAssetVolley(world: FinaleWorld) {
  const count = ASSET_VOLLEY_MIN + Math.floor(random(world) * 2);
  const edgeOffset = Math.floor(random(world) * 3);
  for (let index = 0; index < count; index += 1) {
    const edge = (edgeOffset + index) % 3;
    const lane = random(world);
    let x = FINALE_ASSET_BULLET_VISUAL_RADIUS;
    let y = ARENA_TOP + FINALE_ASSET_BULLET_VISUAL_RADIUS;
    if (edge === 0) {
      x += lane * (FINALE_WIDTH - FINALE_ASSET_BULLET_VISUAL_RADIUS * 2);
    } else {
      x = edge === 1 ? FINALE_ASSET_BULLET_VISUAL_RADIUS : FINALE_WIDTH - FINALE_ASSET_BULLET_VISUAL_RADIUS;
      y += lane * (FINALE_HEIGHT - ARENA_TOP - FINALE_ASSET_BULLET_VISUAL_RADIUS * 2);
    }

    const targetX = world.player.x + (random(world) * 2 - 1) * ASSET_VOLLEY_AIM_JITTER;
    const targetY = world.player.y + (random(world) * 2 - 1) * ASSET_VOLLEY_AIM_JITTER;
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = ASSET_VOLLEY_SPEED_MIN + random(world) * ASSET_VOLLEY_SPEED_RANGE;
    const spinSample = random(world) * 2 - 1;
    const spin = (spinSample < 0 ? -1 : 1) * (0.65 + Math.abs(spinSample) * 0.9);
    const spriteIndex = Math.floor(random(world) * 0x1_0000_0000);
    addBullet(world, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: 0,
      ay: 0,
      radius: FINALE_ASSET_BULLET_CORE_RADIUS,
      visualRadius: FINALE_ASSET_BULLET_VISUAL_RADIUS,
      rotation: angle,
      spin,
      turnRate: 0,
      telegraphMs: world.stats.warningMs,
      lifetimeMs: 6_500,
      damage: 1,
      kind: "error",
      spriteIndex,
    });
  }
}

function updatePatterns(world: FinaleWorld, deltaMs: number) {
  if (world.cycle !== "dodge") return;
  world.boss.attackCooldownMs -= deltaMs;
  if (world.boss.attackCooldownMs <= 0 && world.bullets.length === 0) {
    spawnAssetVolley(world);
    world.boss.attackCooldownMs = ASSET_VOLLEY_RESPAWN_MS;
  }
}

function moveBullets(world: FinaleWorld, deltaMs: number) {
  const deltaSeconds = deltaMs / 1_000;
  for (const bullet of world.bullets) {
    const previousActiveMs = Math.max(0, bullet.ageMs - bullet.telegraphMs);
    bullet.ageMs += deltaMs;
    const activeMs = Math.max(0, bullet.ageMs - bullet.telegraphMs);
    const activeDeltaSeconds = (activeMs - previousActiveMs) / 1_000;
    if (activeDeltaSeconds <= 0) continue;
    if (bullet.turnRate) {
      const turn = bullet.turnRate * activeDeltaSeconds;
      const cosine = Math.cos(turn);
      const sine = Math.sin(turn);
      const vx = bullet.vx * cosine - bullet.vy * sine;
      bullet.vy = bullet.vx * sine + bullet.vy * cosine;
      bullet.vx = vx;
    }
    bullet.vx += bullet.ax * activeDeltaSeconds;
    bullet.vy += bullet.ay * activeDeltaSeconds;
    bullet.x += bullet.vx * activeDeltaSeconds;
    bullet.y += bullet.vy * activeDeltaSeconds;
    bullet.rotation += bullet.spin * activeDeltaSeconds;
  }
  world.bullets = world.bullets.filter((bullet) => (
    bullet.ageMs <= bullet.lifetimeMs
    && bullet.x >= -90
    && bullet.x <= FINALE_WIDTH + 90
    && bullet.y >= ARENA_TOP - 90
    && bullet.y <= FINALE_HEIGHT + 90
  ));
  // This defensive slice is deliberately redundant with addBullet's guard. It
  // makes the hard cap invariant survive imported/debug-mutated state as well.
  if (world.bullets.length > FINALE_BULLET_CAP) world.bullets.length = FINALE_BULLET_CAP;
  void deltaSeconds;
}

function collideBulletsWithPlayer(world: FinaleWorld) {
  const survivors: FinaleBullet[] = [];
  const guildMask = finaleGuildMaskCells(world.loadout.hallLevel);
  for (const bullet of world.bullets) {
    if (bullet.ageMs < bullet.telegraphMs) {
      survivors.push(bullet);
      continue;
    }
    const intersectsGuild = guildMask.some((cell) => {
      const cellWorld = { x: world.player.x + cell.x, y: world.player.y + cell.y };
      const hitDistance = cell.radius + bullet.radius;
      return distanceSquared(cellWorld, bullet) <= hitDistance * hitDistance;
    });
    const distance = Math.sqrt(distanceSquared(world.player, bullet));
    const grazeDistance = world.stats.grazeRadius + bullet.radius;
    if (intersectsGuild && world.player.invulnerableMs <= 0) {
      const shielded = world.player.shield > 0;
      world.playerHit = true;
      world.playerHitEvent = {
        kind: shielded ? "shield" : "hull",
        x: world.player.x,
        y: world.player.y,
        angle: Math.atan2(bullet.vy, bullet.vx),
        serial: bullet.id,
      };
      if (shielded) world.player.shield -= 1;
      else world.player.hp = Math.max(0, world.player.hp - bullet.damage);
      world.player.invulnerableMs = world.stats.invulnerabilityMs;
      if (world.player.hp <= 0) {
        world.status = "defeat";
        world.defeat = true;
        world.patternName = "동기화 실패 · 2페이즈 재시도";
        world.boss.patternName = world.patternName;
      }
      continue;
    }
    if (!bullet.grazed && !intersectsGuild && distance <= grazeDistance) {
      bullet.grazed = true;
      world.grazes += 1;
      world.score += 40;
    }
    survivors.push(bullet);
  }
  world.bullets = world.status === "defeat" ? [] : survivors;
}

function updateCycle(world: FinaleWorld, deltaMs: number) {
  world.cycleRemainingMs -= deltaMs;
  if (world.cycleRemainingMs > 0) return;
  world.cycleSerial += 1;
  world.phaseChanged = true;
  world.bullets = [];
  if (world.cycle === "dodge") {
    world.cycle = "opening";
    world.cycleRemainingMs += world.stats.openingDurationMs;
    world.patternName = "코어 노출 · 클릭 피해 2배";
    world.boss.patternName = world.patternName;
    return;
  }
  world.cycle = "dodge";
  world.cycleRemainingMs += world.stats.dodgeDurationMs;
  world.boss.attackCooldownMs = 0;
  world.boss.secondaryCooldownMs = 800;
    world.patternName = "에셋 경계 포격";
  world.boss.patternName = world.patternName;
}

function stepWorld(world: FinaleWorld, input: FinaleInput, deltaMs: number) {
  if (world.status !== "playing") return;
  world.elapsed += deltaMs;
  world.elapsedMs = world.elapsed;
  world.modeElapsedMs += deltaMs;
  world.boss.phaseElapsed += deltaMs;
  world.boss.flashMs = Math.max(0, world.boss.flashMs - deltaMs);

  if (world.mode === "field") return;
  if (world.mode === "collapse") {
    if (world.modeElapsedMs >= world.stats.collapseDurationMs) {
      configurePhaseTwo(world);
      world.phaseChanged = true;
    }
    return;
  }
  if (world.mode === "destruction") {
    if (world.modeElapsedMs >= world.stats.destructionDurationMs) enterWhiteout(world);
    return;
  }
  if (world.mode !== "bulletHell") return;

  world.player.invulnerableMs = Math.max(0, world.player.invulnerableMs - deltaMs);
  movePlayer(world, input, deltaMs / 1_000);
  updateCycle(world, deltaMs);
  updatePatterns(world, deltaMs);
  moveBullets(world, deltaMs);
  collideBulletsWithPlayer(world);
}

export function updateFinaleWorld(world: FinaleWorld, input: FinaleInput, deltaMs: number): FinaleWorld {
  const next = cloneWorld(world);
  resetTransientEvents(next);
  if (next.status !== "playing") return next;
  const safeDelta = clamp(finiteOr(deltaMs, 0), 0, MAX_UPDATE_MS);
  next.accumulatorMs += safeDelta;
  while (next.accumulatorMs >= FIXED_STEP_MS && next.status === "playing") {
    stepWorld(next, input, FIXED_STEP_MS);
    next.accumulatorMs -= FIXED_STEP_MS;
  }
  return next;
}

/**
 * Apply one deliberate boss click. Damage is based only on hall level; saved
 * weapon/upgrades/party values never enter this calculation.
 */
export function attackFinaleBoss(
  world: FinaleWorld,
  x: number,
  y: number,
  nowMs: number = world.elapsedMs,
): FinaleWorld {
  const next = cloneWorld(world);
  next.attackEvent = null;
  next.victory = false;
  next.defeat = false;
  const attackable = next.status === "playing" && (next.mode === "field" || next.mode === "bulletHell");
  if (!attackable) return next;
  if (next.mode === "field" && next.modeElapsedMs < FINALE_BOSS_ATTACKABLE_MS) return next;

  const attackX = finiteOr(x, Number.NEGATIVE_INFINITY);
  const attackY = finiteOr(y, Number.NEGATIVE_INFINITY);
  const attackTime = finiteOr(nowMs, next.elapsedMs);
  const serial = next.nextAttackSerial;
  next.nextAttackSerial += 1;
  if (attackTime - next.lastAttackAtMs < next.stats.clickIntervalMs) {
    next.clicksRejected += 1;
    next.attackEvent = { kind: "rate-limited", x: attackX, y: attackY, damage: 0, multiplier: 0, serial };
    return next;
  }
  next.lastAttackAtMs = attackTime;

  const hit = distanceSquared({ x: attackX, y: attackY }, next.boss) <= next.boss.clickRadius * next.boss.clickRadius;
  if (!hit) {
    next.clicksMissed += 1;
    next.attackEvent = { kind: "miss", x: attackX, y: attackY, damage: 0, multiplier: 0, serial };
    return next;
  }

  const multiplier = next.mode === "bulletHell"
    ? next.cycle === "opening" ? next.stats.openingMultiplier : DODGE_CLICK_MULTIPLIER
    : 1;
  const damage = Math.min(next.boss.hp, next.stats.clickDamage * multiplier);
  next.boss.hp = Math.max(0, next.boss.hp - damage);
  next.boss.flashMs = 190;
  next.player.damageDealt += damage;
  next.clicksLanded += 1;
  next.score += Math.round(damage * 250);
  next.attackEvent = { kind: "hit", x: attackX, y: attackY, damage, multiplier, serial };

  if (next.boss.hp <= 0) {
    if (next.phase === 1) enterCollapse(next);
    else enterDestruction(next);
  }
  return next;
}

/** Restart after a phase-two defeat without replaying stage 10-3 or phase one. */
export function restartFinalePhaseTwo(world: FinaleWorld): FinaleWorld {
  const next = cloneWorld(world);
  resetTransientEvents(next);
  configurePhaseTwo(next);
  next.phaseChanged = true;
  return next;
}

/** Preview/debug helper for exercising every cinematic and combat state directly. */
export function forceFinaleMode(world: FinaleWorld, mode: FinaleMode): FinaleWorld {
  const next = cloneWorld(world);
  resetTransientEvents(next);
  if (mode === "field") {
    configurePhaseOne(next);
  } else if (mode === "collapse") {
    configurePhaseOne(next);
    enterCollapse(next);
  } else if (mode === "bulletHell") {
    configurePhaseTwo(next);
  } else if (mode === "destruction") {
    configurePhaseTwo(next);
    enterDestruction(next);
  } else {
    configurePhaseTwo(next);
    enterWhiteout(next);
  }
  next.phaseChanged = true;
  return next;
}

/** Backward-compatible preview jump: the redesigned finale has exactly two phases. */
export function forceFinalePhase(world: FinaleWorld, requestedPhase: number): FinaleWorld {
  return forceFinaleMode(world, requestedPhase <= 1 ? "field" : "bulletHell");
}
