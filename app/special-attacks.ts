export type SpecialAttackKind = "lightning" | "tornado" | "meteor";

export type SpecialAttackDefinition = {
  kind: SpecialAttackKind;
  nodeId: string;
  title: string;
  subtitle: string;
  description: string;
  glyph: string;
  cost: number;
  hallLevel: number;
  cooldownMs: number;
  delayMs: number;
  durationMs: number;
  radius: number;
  damageMultiplier: number;
  pulses: number;
  maxTargets: number;
  accent: string;
};

export type SpecialResearchNode = {
  id: string;
  title: string;
  description: string;
  glyph: string;
  cost: number;
  prerequisites: string[];
  x: number;
  y: number;
};

export type SpecialAttackMonster = {
  id: string;
  x: number;
  y: number;
  hp: number;
};

export type SpecialAttackPoint = { x: number; y: number };

export type SpecialAttackFx = SpecialAttackPoint & {
  id: number;
  kind: SpecialAttackKind;
  targetIds: string[];
  startedAt: number;
  impactAt: number;
  expiresAt: number;
};

export const SPECIAL_ATTACK_ORDER: readonly SpecialAttackKind[] = ["lightning", "tornado", "meteor"];

export const SPECIAL_ATTACKS: Record<SpecialAttackKind, SpecialAttackDefinition> = {
  lightning: {
    kind: "lightning",
    nodeId: "special-lightning-2",
    title: "번개 강타",
    subtitle: "천뢰의 인장",
    description: "6.8초마다 밀집한 적에게 연쇄 번개가 떨어져 최대 7체를 감전시킵니다.",
    glyph: "雷",
    cost: 1_600,
    hallLevel: 2,
    cooldownMs: 6_800,
    delayMs: 260,
    durationMs: 1_180,
    radius: 17,
    damageMultiplier: 2.15,
    pulses: 1,
    maxTargets: 7,
    accent: "#8de9ff",
  },
  tornado: {
    kind: "tornado",
    nodeId: "special-tornado-3",
    title: "토네이도",
    subtitle: "폭풍의 감옥",
    description: "10.8초마다 회오리가 적을 끌어당기며 세 차례 광역 피해를 줍니다.",
    glyph: "嵐",
    cost: 4_800,
    hallLevel: 3,
    cooldownMs: 10_800,
    delayMs: 120,
    durationMs: 2_450,
    radius: 25,
    damageMultiplier: 1.95,
    pulses: 3,
    maxTargets: 22,
    accent: "#71f0c2",
  },
  meteor: {
    kind: "meteor",
    nodeId: "special-meteor-4",
    title: "운석 충돌",
    subtitle: "멸성의 낙하",
    description: "15.5초마다 운석이 낙하해 대폭발 피해를 주고 적을 전장 안쪽으로 날려 보냅니다.",
    glyph: "隕",
    cost: 12_000,
    hallLevel: 4,
    cooldownMs: 15_500,
    delayMs: 820,
    durationMs: 2_300,
    radius: 27,
    damageMultiplier: 4.65,
    pulses: 1,
    maxTargets: Number.POSITIVE_INFINITY,
    accent: "#ff7a38",
  },
};

export const SPECIAL_RESEARCH_NODES: readonly SpecialResearchNode[] = SPECIAL_ATTACK_ORDER.map((kind, index) => {
  const attack = SPECIAL_ATTACKS[kind];
  return {
    id: attack.nodeId,
    title: attack.title,
    description: attack.description,
    glyph: attack.glyph,
    cost: attack.cost,
    prerequisites: ["foundation"],
    x: 28 + index * 22,
    y: 1_640,
  };
});

export function unlockedSpecialAttacks(nodeIds: readonly string[], unlockAll = false) {
  return SPECIAL_ATTACK_ORDER.filter((kind) => unlockAll || nodeIds.includes(SPECIAL_ATTACKS[kind].nodeId));
}

export function specialAttackForNode(nodeId: string) {
  return SPECIAL_ATTACK_ORDER.map((kind) => SPECIAL_ATTACKS[kind]).find((attack) => attack.nodeId === nodeId);
}

export function fieldDistance(a: SpecialAttackPoint, b: SpecialAttackPoint) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * 0.72);
}

function aliveMonsters(monsters: readonly SpecialAttackMonster[]) {
  return monsters.filter((monster) => monster.hp > 0);
}

export function selectSpecialAttackCenter(monsters: readonly SpecialAttackMonster[], kind: SpecialAttackKind): SpecialAttackPoint {
  const alive = aliveMonsters(monsters);
  if (!alive.length) return { x: 50, y: 50 };
  const definition = SPECIAL_ATTACKS[kind];
  const scanRadius = kind === "lightning" ? definition.radius * 0.78 : definition.radius;
  const result = alive.reduce((best, candidate) => {
    const neighbors = alive.filter((monster) => fieldDistance(monster, candidate) <= scanRadius);
    const score = neighbors.reduce((sum, monster) => sum + (1 - Math.min(1, fieldDistance(monster, candidate) / scanRadius)) * 0.4 + 1, 0);
    return score > best.score ? { x: candidate.x, y: candidate.y, score } : best;
  }, { x: alive[0].x, y: alive[0].y, score: -1 });
  return { x: result.x, y: result.y };
}

export function targetsForSpecialAttack(
  monsters: readonly SpecialAttackMonster[],
  kind: SpecialAttackKind,
  center = selectSpecialAttackCenter(monsters, kind),
) {
  const definition = SPECIAL_ATTACKS[kind];
  return aliveMonsters(monsters)
    .map((monster) => ({ monster, distance: fieldDistance(monster, center) }))
    .filter(({ distance }) => distance <= definition.radius)
    .sort((a, b) => a.distance - b.distance || a.monster.id.localeCompare(b.monster.id))
    .slice(0, definition.maxTargets)
    .map(({ monster }) => monster.id);
}

export function specialAttackDamage(kind: SpecialAttackKind, playerDamage: number, pulse = 0) {
  const definition = SPECIAL_ATTACKS[kind];
  const pulseWeight = kind === "tornado" ? [0.26, 0.33, 0.41][Math.min(2, Math.max(0, pulse))] : 1;
  return Math.max(1, Math.round(playerDamage * definition.damageMultiplier * pulseWeight));
}

function stableAngle(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  return hash / 0xffffffff * Math.PI * 2;
}

function clampFieldPoint(point: SpecialAttackPoint): SpecialAttackPoint {
  return {
    x: Math.max(7, Math.min(93, point.x)),
    y: Math.max(11, Math.min(89, point.y)),
  };
}

export function displacedSpecialTargets(
  monsters: readonly SpecialAttackMonster[],
  kind: "tornado" | "meteor",
  center: SpecialAttackPoint,
  pulse = 0,
) {
  const targetIds = new Set(targetsForSpecialAttack(monsters, kind, center));
  return monsters.reduce<Record<string, SpecialAttackPoint>>((positions, monster) => {
    if (!targetIds.has(monster.id)) return positions;
    const dx = monster.x - center.x;
    const dy = (monster.y - center.y) * 0.72;
    const distance = Math.hypot(dx, dy);
    const angle = distance > 0.01 ? Math.atan2(dy, dx) : stableAngle(monster.id);

    if (kind === "tornado") {
      const orbitAngle = angle + 0.82 + pulse * 0.62;
      const pulledDistance = Math.max(2.5, distance * (0.72 - pulse * 0.11));
      positions[monster.id] = clampFieldPoint({
        x: center.x + Math.cos(orbitAngle) * pulledDistance,
        y: center.y + Math.sin(orbitAngle) * pulledDistance / 0.72,
      });
      return positions;
    }

    const launchAngle = distance > 0.01 ? angle : stableAngle(`${monster.id}-meteor`);
    const push = 10.5 + Math.max(0, 1 - distance / SPECIAL_ATTACKS.meteor.radius) * 7.5;
    positions[monster.id] = clampFieldPoint({
      x: monster.x + Math.cos(launchAngle) * push,
      y: monster.y + Math.sin(launchAngle) * push / 0.72,
    });
    return positions;
  }, {});
}

export function specialCooldownProgress(kind: SpecialAttackKind, lastCastAt: number, now: number) {
  if (!lastCastAt) return 1;
  return Math.max(0, Math.min(1, (now - lastCastAt) / SPECIAL_ATTACKS[kind].cooldownMs));
}

export function specialCooldownRemaining(kind: SpecialAttackKind, lastCastAt: number, now: number) {
  if (!lastCastAt) return 0;
  return Math.max(0, SPECIAL_ATTACKS[kind].cooldownMs - (now - lastCastAt));
}
