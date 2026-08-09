import type {
  GoldLootSoundProfile,
  LootSoundProfile,
  MaterialLootSoundProfile,
  StageMaterial,
} from "./stage-materials";

export type LootMonster = {
  id: string;
  x: number;
  y: number;
  kind: "swarm" | "brute" | "mystic" | "leader";
};

type BattleLootDropBase = {
  id: string;
  monsterId: string;
  x: number;
  y: number;
  amount: number;
  variant: number;
  droppedAt: number;
  resourceId: string;
  soundProfile: LootSoundProfile;
};

export type BattleGoldDrop = BattleLootDropBase & {
  kind: "gold";
  resourceId: "gold";
  form: GoldDropForm;
  soundProfile: GoldLootSoundProfile;
};

export type BattleMaterialDrop = BattleLootDropBase & {
  kind: "material";
  resourceId: string;
  soundProfile: MaterialLootSoundProfile;
};

export type BattleLootDrop = BattleGoldDrop | BattleMaterialDrop;

export type GoldDropForm = "coins" | "coin-pouch" | "cash-bundle";

export const GOLD_LOOT_SETTLE_MS = 760;
export const GOLD_LOOT_TRAVEL_MS = 720;
export const GOLD_LOOT_FINAL_PAUSE_MS = 260;

const LOOT_WEIGHTS: Record<LootMonster["kind"], number> = {
  swarm: 1,
  mystic: 1.3,
  brute: 1.8,
  leader: 4.6,
};

const GOLD_DROP_FORM_VARIANTS: Record<GoldDropForm, number> = {
  coins: 0,
  "coin-pouch": 4,
  "cash-bundle": 8,
};

const GOLD_DROP_FORM_SOUNDS: Record<GoldDropForm, GoldLootSoundProfile> = {
  coins: "coin",
  "coin-pouch": "coin-pouch",
  "cash-bundle": "cash-bundle",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function goldLootStaggerMs(dropCount: number) {
  if (dropCount <= 1) return 0;
  return Math.round(clamp(920 / (dropCount - 1), 42, 88));
}

export function goldLootSweepDuration(dropCount: number) {
  return GOLD_LOOT_TRAVEL_MS + Math.max(0, dropCount - 1) * goldLootStaggerMs(dropCount) + GOLD_LOOT_FINAL_PAUSE_MS;
}

export function goldDropFormForStage(stage: number): GoldDropForm {
  const safeStage = clamp(Math.round(stage), 1, 30);
  if (safeStage >= 21) return "cash-bundle";
  if (safeStage >= 11) return "coin-pouch";
  return "coins";
}

export function createGoldDropPlan(monsters: readonly LootMonster[], totalGold: number, stage = 1): BattleGoldDrop[] {
  if (!monsters.length) return [];

  const reward = Math.max(0, Math.round(totalGold));
  const form = goldDropFormForStage(stage);
  const totalWeight = monsters.reduce((sum, monster) => sum + LOOT_WEIGHTS[monster.kind], 0);
  const allocations = monsters.map((monster, index) => {
    const exact = reward * LOOT_WEIGHTS[monster.kind] / totalWeight;
    return { index, amount: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = reward - allocations.reduce((sum, allocation) => sum + allocation.amount, 0);

  [...allocations]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .forEach((allocation) => {
      if (remaining <= 0) return;
      allocations[allocation.index].amount += 1;
      remaining -= 1;
    });

  return monsters.map((monster, index) => ({
    id: `gold-${monster.id}`,
    kind: "gold",
    resourceId: "gold",
    form,
    soundProfile: GOLD_DROP_FORM_SOUNDS[form],
    monsterId: monster.id,
    x: clamp(monster.x + (index * 7 % 9) - 4, 7, 93),
    y: clamp(monster.y + 5 + (index * 5 % 7), 14, 90),
    amount: allocations[index].amount,
    variant: GOLD_DROP_FORM_VARIANTS[form] + index % 4,
    droppedAt: 0,
  }));
}

export function createMaterialDropPlan(monsters: readonly LootMonster[], material: StageMaterial): BattleMaterialDrop[] {
  if (!monsters.length || material.rewardAmount <= 0) return [];

  const ranked = monsters
    .map((monster, index) => ({ monster, index, weight: LOOT_WEIGHTS[monster.kind] }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  const dropCount = Math.min(monsters.length, Math.max(1, Math.ceil(material.rewardAmount / 2)));
  const selected = ranked.slice(0, dropCount).sort((a, b) => a.index - b.index);
  const allocations = selected.map((entry) => ({ ...entry, amount: 1 }));
  let remaining = material.rewardAmount - allocations.length;
  let cursor = 0;
  while (remaining > 0) {
    allocations[cursor % allocations.length].amount += 1;
    remaining -= 1;
    cursor += 1;
  }

  return allocations.map(({ monster, index, amount }) => ({
    id: `${material.id}-${monster.id}`,
    kind: "material",
    resourceId: material.id,
    soundProfile: material.soundProfile,
    monsterId: monster.id,
    x: clamp(monster.x + (index * 5 % 11) - 5, 7, 93),
    y: clamp(monster.y + 1 + (index * 3 % 8), 14, 90),
    amount,
    variant: material.variant,
    droppedAt: 0,
  }));
}

export function createBattleLootPlan(monsters: readonly LootMonster[], totalGold: number, material: StageMaterial): BattleLootDrop[] {
  const gold = createGoldDropPlan(monsters, totalGold, material.stage);
  const materials = createMaterialDropPlan(monsters, material);
  const materialByMonster = new Map(materials.map((drop) => [drop.monsterId, drop]));
  return gold.flatMap((drop) => {
    const materialDrop = materialByMonster.get(drop.monsterId);
    return materialDrop ? [drop, materialDrop] : [drop];
  });
}

export function revealedLootDrops(plan: readonly BattleLootDrop[], defeatedAt: ReadonlyMap<string, number>) {
  return plan
    .filter((drop) => defeatedAt.has(drop.monsterId))
    .map((drop) => ({ ...drop, droppedAt: defeatedAt.get(drop.monsterId) ?? 0 }))
    .sort((a, b) => a.droppedAt - b.droppedAt || a.monsterId.localeCompare(b.monsterId));
}

export function revealedGoldDrops(plan: readonly BattleGoldDrop[], defeatedAt: ReadonlyMap<string, number>) {
  return revealedLootDrops(plan, defeatedAt) as BattleGoldDrop[];
}
