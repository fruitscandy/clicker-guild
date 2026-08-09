export type LootMonster = {
  id: string;
  x: number;
  y: number;
  kind: "swarm" | "brute" | "mystic" | "leader";
};

export type BattleGoldDrop = {
  id: string;
  monsterId: string;
  x: number;
  y: number;
  amount: number;
  variant: number;
  droppedAt: number;
};

export const GOLD_LOOT_SETTLE_MS = 760;
export const GOLD_LOOT_TRAVEL_MS = 720;
export const GOLD_LOOT_FINAL_PAUSE_MS = 260;

const LOOT_WEIGHTS: Record<LootMonster["kind"], number> = {
  swarm: 1,
  mystic: 1.3,
  brute: 1.8,
  leader: 4.6,
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

export function createGoldDropPlan(monsters: readonly LootMonster[], totalGold: number): BattleGoldDrop[] {
  if (!monsters.length) return [];

  const reward = Math.max(0, Math.round(totalGold));
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
    monsterId: monster.id,
    x: clamp(monster.x + (index * 7 % 9) - 4, 7, 93),
    y: clamp(monster.y + 5 + (index * 5 % 7), 14, 90),
    amount: allocations[index].amount,
    variant: index % 4,
    droppedAt: 0,
  }));
}

export function revealedGoldDrops(plan: readonly BattleGoldDrop[], defeatedAt: ReadonlyMap<string, number>) {
  return plan
    .filter((drop) => defeatedAt.has(drop.monsterId))
    .map((drop) => ({ ...drop, droppedAt: defeatedAt.get(drop.monsterId) ?? 0 }))
    .sort((a, b) => a.droppedAt - b.droppedAt || a.monsterId.localeCompare(b.monsterId));
}
