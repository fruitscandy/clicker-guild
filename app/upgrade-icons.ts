export type UpgradeIconKey =
  | "range"
  | "critical"
  | "shockwave"
  | "time"
  | "guild"
  | "gold"
  | "tavern"
  | "autoAttack";

export const UPGRADE_ICON_BY_KEY: Record<UpgradeIconKey, string> = {
  range: "/assets/upgrades/range.webp",
  critical: "/assets/upgrades/critical.webp",
  shockwave: "/assets/upgrades/shockwave.webp",
  time: "/assets/upgrades/time.webp",
  guild: "/assets/upgrades/guild.webp",
  gold: "/assets/upgrades/gold.webp",
  tavern: "/assets/upgrades/tavern.webp",
  autoAttack: "/assets/upgrades/momentum.webp",
};

const NODE_FAMILY_ICON: Record<string, UpgradeIconKey> = {
  range: "range",
  crit: "critical",
  shockwave: "shockwave",
  time: "time",
  guild: "guild",
  gold: "gold",
  tavern: "tavern",
  auto: "autoAttack",
};

export function upgradeIconForNode(nodeId: string) {
  const family = nodeId.split("-")[0];
  const iconKey = NODE_FAMILY_ICON[family];
  return iconKey ? UPGRADE_ICON_BY_KEY[iconKey] : null;
}
