export const TUTORIAL_STEPS = [
  "hunt",
  "stage",
  "battle",
  "retry",
  "return",
  "tavern",
  "recruit",
  "recruitResult",
  "forge",
  "upgrade",
  "complete",
  "done",
] as const;

export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

export function isTutorialStep(value: unknown): value is TutorialStep {
  return typeof value === "string" && TUTORIAL_STEPS.includes(value as TutorialStep);
}

export function recoverTutorialStep(step: TutorialStep, firstStageCleared: boolean): TutorialStep {
  if (step === "stage" || step === "battle" || step === "retry") return "hunt";
  if (step === "return") return firstStageCleared ? "tavern" : "hunt";
  if (step === "recruit") return "tavern";
  if (step === "recruitResult" || step === "upgrade") return "forge";
  return step;
}
