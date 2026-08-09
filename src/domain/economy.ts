import { parseStageId, assertStageIndex, type StageId } from "./stage";

export const NORMAL_HP_BASE = 30;
export const NORMAL_HP_GROWTH = 1.18;
export const BOSS_HP_MULTIPLIER = 5;

export const NORMAL_GOLD_BASE = 8;
export const NORMAL_GOLD_GROWTH = 1.15;
export const BOSS_GOLD_MULTIPLIER = 3;

export const NORMAL_XP_BASE = 4;
export const NORMAL_XP_GROWTH = 1.1;
export const BOSS_XP_MULTIPLIER = 5;

export const NORMAL_FIRST_CLEAR_MULTIPLIER = 5;
export const BOSS_FIRST_CLEAR_MULTIPLIER = 15;

export interface StageBalance {
  readonly stageId: StageId;
  readonly overallIndex: number;
  readonly isBoss: boolean;
  readonly hp: number;
  readonly gold: number;
  readonly xp: number;
  readonly firstClearBonus: number;
}

function roundedExponential(base: number, growth: number, stageIndex: unknown): number {
  assertStageIndex(stageIndex);
  return Math.round(base * growth ** (stageIndex - 1));
}

export function normalHp(stageIndex: unknown): number {
  return roundedExponential(NORMAL_HP_BASE, NORMAL_HP_GROWTH, stageIndex);
}

export function bossHp(stageIndex: unknown): number {
  return normalHp(stageIndex) * BOSS_HP_MULTIPLIER;
}

export function normalGold(stageIndex: unknown): number {
  return roundedExponential(NORMAL_GOLD_BASE, NORMAL_GOLD_GROWTH, stageIndex);
}

export function bossGold(stageIndex: unknown): number {
  return normalGold(stageIndex) * BOSS_GOLD_MULTIPLIER;
}

export function normalXp(stageIndex: unknown): number {
  return roundedExponential(NORMAL_XP_BASE, NORMAL_XP_GROWTH, stageIndex);
}

export function bossXp(stageIndex: unknown): number {
  return normalXp(stageIndex) * BOSS_XP_MULTIPLIER;
}

export function normalFirstClearBonus(stageIndex: unknown): number {
  return normalGold(stageIndex) * NORMAL_FIRST_CLEAR_MULTIPLIER;
}

export function bossFirstClearBonus(stageIndex: unknown): number {
  return normalGold(stageIndex) * BOSS_FIRST_CLEAR_MULTIPLIER;
}

export function firstClearBonus(stageIndex: unknown, isBoss: boolean): number {
  return isBoss ? bossFirstClearBonus(stageIndex) : normalFirstClearBonus(stageIndex);
}

export function getStageBalance(stageId: unknown): StageBalance {
  const stage = parseStageId(stageId);
  const hp = stage.isBoss ? bossHp(stage.overallIndex) : normalHp(stage.overallIndex);
  const gold = stage.isBoss ? bossGold(stage.overallIndex) : normalGold(stage.overallIndex);
  const xp = stage.isBoss ? bossXp(stage.overallIndex) : normalXp(stage.overallIndex);

  return Object.freeze({
    stageId: stage.id,
    overallIndex: stage.overallIndex,
    isBoss: stage.isBoss,
    hp,
    gold,
    xp,
    firstClearBonus: firstClearBonus(stage.overallIndex, stage.isBoss),
  });
}
