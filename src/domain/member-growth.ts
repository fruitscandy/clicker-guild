import { DomainValidationError, assertFiniteIntegerInRange } from "./validation";

export const GRADES = ["F", "E", "D", "C", "B", "A", "S"] as const;
export type Grade = (typeof GRADES)[number];

export const MIN_MEMBER_LEVEL = 1;
export const MAX_MEMBER_LEVEL = 20;
export const MIN_ENHANCEMENT = 0;
export const MAX_ENHANCEMENT = 10;
export const ENHANCEMENT_COST_GROWTH = 1.55;
export const LEVEL_GROWTH_PER_LEVEL = 0.05;
export const ENHANCEMENT_GROWTH_PER_LEVEL = 0.1;

export interface GradeBalance {
  readonly baseEnhancementCost: number;
  readonly attackMultiplier: number;
}

export const GRADE_BALANCE: Readonly<Record<Grade, GradeBalance>> = Object.freeze({
  F: Object.freeze({ baseEnhancementCost: 20, attackMultiplier: 1 }),
  E: Object.freeze({ baseEnhancementCost: 50, attackMultiplier: 1.35 }),
  D: Object.freeze({ baseEnhancementCost: 120, attackMultiplier: 1.8 }),
  C: Object.freeze({ baseEnhancementCost: 300, attackMultiplier: 2.45 }),
  B: Object.freeze({ baseEnhancementCost: 750, attackMultiplier: 3.3 }),
  A: Object.freeze({ baseEnhancementCost: 1_800, attackMultiplier: 4.5 }),
  S: Object.freeze({ baseEnhancementCost: 5_000, attackMultiplier: 6.2 }),
});

export function isGrade(value: unknown): value is Grade {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}

export function assertGrade(value: unknown): asserts value is Grade {
  if (!isGrade(value)) {
    throw new DomainValidationError("grade", `등급은 ${GRADES.join(", ")} 중 하나여야 합니다.`);
  }
}

export function getGradeBalance(grade: unknown): GradeBalance {
  assertGrade(grade);
  return GRADE_BALANCE[grade];
}

export function enhanceCost(grade: unknown, currentEnhancement: unknown): number {
  assertGrade(grade);
  assertFiniteIntegerInRange(
    currentEnhancement,
    "currentEnhancement",
    MIN_ENHANCEMENT,
    MAX_ENHANCEMENT - 1,
  );

  return Math.round(GRADE_BALANCE[grade].baseEnhancementCost * ENHANCEMENT_COST_GROWTH ** currentEnhancement);
}

export const enhancementCost = enhanceCost;

export function calculateGrowthMultiplier(
  grade: unknown,
  level: unknown,
  enhancement: unknown,
): number {
  assertGrade(grade);
  assertFiniteIntegerInRange(level, "level", MIN_MEMBER_LEVEL, MAX_MEMBER_LEVEL);
  assertFiniteIntegerInRange(enhancement, "enhancement", MIN_ENHANCEMENT, MAX_ENHANCEMENT);

  const levelMultiplier = 1 + LEVEL_GROWTH_PER_LEVEL * (level - 1);
  const enhancementMultiplier = 1 + ENHANCEMENT_GROWTH_PER_LEVEL * enhancement;
  return GRADE_BALANCE[grade].attackMultiplier * levelMultiplier * enhancementMultiplier;
}

export function nextLevelXp(currentLevel: unknown): number {
  assertFiniteIntegerInRange(currentLevel, "currentLevel", MIN_MEMBER_LEVEL, MAX_MEMBER_LEVEL - 1);
  return Math.round(10 * currentLevel ** 1.35);
}
