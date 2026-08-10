import { UPGRADE_CAPS, UPGRADE_KEYS, type UpgradeKey, type UpgradeLevels } from "./guild-upgrades";

export { UPGRADE_CAPS, UPGRADE_KEYS, type UpgradeKey, type UpgradeLevels };

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
