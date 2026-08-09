export type UpgradeIconKey =
  | "range"
  | "critical"
  | "combo"
  | "execution"
  | "shockwave"
  | "momentum"
  | "time"
  | "scout"
  | "guild"
  | "gold"
  | "tavern"
  | "loot";

export const UPGRADE_ICON_BY_KEY: Record<UpgradeIconKey, string> = {
  range: "/assets/upgrades/range.webp",
  critical: "/assets/upgrades/critical.webp",
  combo: "/assets/upgrades/combo.webp",
  execution: "/assets/upgrades/execution.webp",
  shockwave: "/assets/upgrades/shockwave.webp",
  momentum: "/assets/upgrades/momentum.webp",
  time: "/assets/upgrades/time.webp",
  scout: "/assets/upgrades/scout.webp",
  guild: "/assets/upgrades/guild.webp",
  gold: "/assets/upgrades/gold.webp",
  tavern: "/assets/upgrades/tavern.webp",
  loot: "/assets/upgrades/loot.webp",
};

const NODE_FAMILY_ICON: Record<string, UpgradeIconKey> = {
  range: "range",
  crit: "critical",
  combo: "combo",
  execute: "execution",
  shockwave: "shockwave",
  momentum: "momentum",
  time: "time",
  scout: "scout",
  guild: "guild",
  gold: "gold",
  tavern: "tavern",
  loot: "loot",
};

export function upgradeIconForNode(nodeId: string) {
  const family = nodeId.split("-")[0];
  const iconKey = NODE_FAMILY_ICON[family];
  return iconKey ? UPGRADE_ICON_BY_KEY[iconKey] : null;
}
