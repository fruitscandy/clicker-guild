export const DEVELOPER_RESOURCE_LIMIT = 999_999_999;

export type DeveloperResourceValues = {
  gold: number;
  bossTokens: number;
  materials: Record<string, number>;
};

export type DeveloperResourcePreset = "empty" | "ready" | "abundant";

const PRESET_AMOUNTS: Record<DeveloperResourcePreset, { gold: number; bossTokens: number; material: number }> = {
  empty: { gold: 0, bossTokens: 0, material: 0 },
  ready: { gold: 100_000, bossTokens: 10, material: 99 },
  abundant: { gold: 99_999_999, bossTokens: 999, material: 999 },
};

export function clampDeveloperResourceAmount(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(DEVELOPER_RESOURCE_LIMIT, Math.max(0, Math.round(parsed)));
}

export function developerResourcePreset(preset: DeveloperResourcePreset, materialIds: readonly string[]): DeveloperResourceValues {
  const amounts = PRESET_AMOUNTS[preset];
  return {
    gold: amounts.gold,
    bossTokens: amounts.bossTokens,
    materials: Object.fromEntries(materialIds.map((id) => [id, amounts.material])),
  };
}

export function updateDeveloperMaterial(resources: DeveloperResourceValues, id: string, amount: number | string): DeveloperResourceValues {
  return {
    ...resources,
    materials: { ...resources.materials, [id]: clampDeveloperResourceAmount(amount) },
  };
}
