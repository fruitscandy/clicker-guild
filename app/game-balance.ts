export const BASE_CLICK_DAMAGE = 18;
export const BASE_ATTACK_RANGE = 11;
export const MEMBER_ASSIST_FACTOR = 0.68;

export const TARGET_RUN_MINUTES = { min: 10, max: 20 } as const;
export const TARGET_CLEAR_SECONDS = {
  pressure: { min: 18, max: 25 },
  massacre: { min: 5, max: 10 },
  boss: { min: 15, max: 20 },
} as const;

// Conservative first-clear route after hiring one F-rank member. Each entry is
// the stage whose reward makes the next weapon craftable for the following wave.
export const EXPECTED_WEAPON_POWER_SPIKE_STAGES = [1, 2, 3, 6, 8, 10, 12, 15, 17, 19, 21, 24, 25, 29] as const;

export const PLAYER_WEAPON_BALANCE = [
  { cost: 0, damageScale: 1 },
  { cost: 90, damageScale: 2.15 },
  { cost: 180, damageScale: 3.6 },
  { cost: 360, damageScale: 5.4 },
  { cost: 650, damageScale: 7.8 },
  { cost: 1_100, damageScale: 11.2 },
  { cost: 1_800, damageScale: 15.8 },
  { cost: 2_900, damageScale: 22 },
  { cost: 4_500, damageScale: 30 },
  { cost: 6_800, damageScale: 41 },
  { cost: 10_000, damageScale: 55 },
  { cost: 15_000, damageScale: 74 },
  { cost: 22_000, damageScale: 98 },
  { cost: 32_000, damageScale: 128 },
  { cost: 46_000, damageScale: 165 },
] as const;

const PACK_HP_MULTIPLIER = { regular: 1.42, boss: 1.7 } as const;
const HP_PER_CLICK_DAMAGE = { pressure: 220, massacre: 128, boss: 250 } as const;

function clampStage(stage: number) {
  return Math.min(30, Math.max(1, Math.round(stage)));
}

export function expectedWeaponTierForStage(stage: number) {
  const safeStage = clampStage(stage);
  return EXPECTED_WEAPON_POWER_SPIKE_STAGES.filter((powerSpikeStage) => powerSpikeStage < safeStage).length;
}

export function weaponBalanceForTier(tier: number) {
  const safeTier = Math.min(PLAYER_WEAPON_BALANCE.length - 1, Math.max(0, Math.round(tier)));
  return PLAYER_WEAPON_BALANCE[safeTier];
}

export function monsterCountForStage(stage: number) {
  const safeStage = clampStage(stage);
  const regionIndex = Math.floor((safeStage - 1) / 3);
  const localStage = (safeStage - 1) % 3 + 1;
  if (localStage === 1) return Math.min(64, 42 + regionIndex * 2);
  if (localStage === 2) return Math.min(88, 68 + regionIndex * 2);
  return Math.min(84, 54 + regionIndex * 3);
}

export function stageBaseHpFor(stage: number) {
  const safeStage = clampStage(stage);
  const localStage = (safeStage - 1) % 3 + 1;
  const tier = expectedWeaponTierForStage(safeStage);
  const damage = BASE_CLICK_DAMAGE * weaponBalanceForTier(tier).damageScale;
  const encounter = localStage === 1 ? "pressure" : localStage === 2 ? "massacre" : "boss";
  const totalPackHp = Math.round(damage * HP_PER_CLICK_DAMAGE[encounter]);
  return Math.round(totalPackHp / (encounter === "boss" ? PACK_HP_MULTIPLIER.boss : PACK_HP_MULTIPLIER.regular));
}

export type FailureSalvage = { gold: number; material: number };

export function failureSalvageFor(
  stage: number,
  stageGold: number,
  materialReward: number,
  defeatedMonsters: number,
  totalMonsters: number,
): FailureSalvage {
  if (defeatedMonsters <= 0 || totalMonsters <= 0) return { gold: 0, material: 0 };

  const ratio = Math.min(1, defeatedMonsters / totalMonsters);
  let gold = Math.max(20, Math.round(stageGold * ratio * 0.72));
  let material = Math.max(1, Math.round(materialReward * ratio * 0.72));

  // A meaningful first attempt always unlocks the first weapon recipe, even if the timer expires.
  if (clampStage(stage) === 1 && ratio >= 0.25) {
    gold = Math.max(40, gold);
    material = Math.max(4, material);
  }

  return { gold, material };
}
