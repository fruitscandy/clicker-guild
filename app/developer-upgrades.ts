export const UPGRADE_KEYS = [
  "range",
  "critical",
  "combo",
  "execution",
  "shockwave",
  "momentum",
  "time",
  "scout",
  "guild",
  "gold",
  "tavern",
  "loot",
] as const;

export type UpgradeKey = (typeof UPGRADE_KEYS)[number];
export type UpgradeLevels = Record<UpgradeKey, number>;

export const UPGRADE_CAPS: UpgradeLevels = {
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

export function clampUpgradeLevel(key: UpgradeKey, level: number) {
  return Math.max(0, Math.min(UPGRADE_CAPS[key], Math.round(level)));
}

export function upgradeLevelsFrom(source: Partial<UpgradeLevels>): UpgradeLevels {
  return UPGRADE_KEYS.reduce((levels, key) => {
    levels[key] = clampUpgradeLevel(key, source[key] ?? 0);
    return levels;
  }, {} as UpgradeLevels);
}

export function maximumUpgradeLevels() {
  return upgradeLevelsFrom(UPGRADE_CAPS);
}

export function zeroUpgradeLevels() {
  return upgradeLevelsFrom({});
}
