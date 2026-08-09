export const SHORT_RUN_TARGET_MINUTES = 20;
export const NORMAL_BATTLE_SECONDS = 26;
export const BOSS_BATTLE_SECONDS = 36;

export function shortRunStageGold(regionIndex: number, localStage: number) {
  const rewardMultiplier = localStage === 1 ? 1 : localStage === 2 ? 0.62 : 2.4;
  return Math.round(150 * Math.pow(1.82, regionIndex) * rewardMultiplier);
}

export function onePassCombatSeconds() {
  return 20 * NORMAL_BATTLE_SECONDS + 10 * BOSS_BATTLE_SECONDS;
}
