export const UPGRADE_KEYS = [
  "range",
  "critical",
  "shockwave",
  "time",
  "tavern",
  "gold",
  "guild",
  "autoAttack",
] as const;

export type UpgradeKey = (typeof UPGRADE_KEYS)[number];
export type UpgradeLevels = Record<UpgradeKey, number>;

export type GuildUpgradeNode = {
  id: string;
  title: string;
  description: string;
  glyph: string;
  target: UpgradeKey;
  cost: number;
  prerequisites: string[];
};

type GuildUpgradeDefinition = {
  key: UpgradeKey;
  nodeFamily: string;
  title: string;
  description: string;
  glyphs: readonly string[];
  levelTitles: readonly string[];
  costs: readonly number[];
  levelDescription: (level: number) => string;
};

export const ATTACK_RANGE_PER_LEVEL = 6;
export const CRITICAL_CHANCE_PER_LEVEL = 0.12;
export const BATTLE_TIME_PER_LEVEL = 8;
export const GUILD_ATTACK_BONUS_PER_LEVEL = 0.35;
export const RAID_GOLD_BONUS_PER_LEVEL = 0.2;
export const AUTO_ATTACK_INTERVALS_MS = [0, 4_500] as const;
export const CITADEL_RESEARCH_COST = 9_000;

export function shockwaveAttackInterval(level: number) {
  return level > 0 ? 6 : 0;
}

export function shockwaveDamageMultiplier(level: number) {
  return level > 0 ? 1.65 : 1;
}

export function guildAttackMultiplier(level: number) {
  return 1 + Math.max(0, level) * GUILD_ATTACK_BONUS_PER_LEVEL;
}

export function raidGoldMultiplier(level: number) {
  return 1 + Math.max(0, level) * RAID_GOLD_BONUS_PER_LEVEL;
}

export function playerAutoAttackIntervalMs(level: number) {
  const safeLevel = Math.max(0, Math.min(AUTO_ATTACK_INTERVALS_MS.length - 1, Math.round(level)));
  return AUTO_ATTACK_INTERVALS_MS[safeLevel];
}

export const GUILD_UPGRADE_DEFINITIONS: Record<UpgradeKey, GuildUpgradeDefinition> = {
  range: {
    key: "range",
    nodeFamily: "range",
    title: "공격 범위 증가",
    description: "플레이어 공격이 닿는 범위를 넓힙니다.",
    glyphs: ["界"],
    levelTitles: ["확장 검풍"],
    costs: [800],
    levelDescription: (level) => `플레이어 공격 반경 +${(level * ATTACK_RANGE_PER_LEVEL).toFixed(1)}`,
  },
  critical: {
    key: "critical",
    nodeFamily: "crit",
    title: "치명타 확률",
    description: "플레이어 공격이 두 배 피해를 줄 확률을 높입니다.",
    glyphs: ["必"],
    levelTitles: ["필중 감각"],
    costs: [1_200],
    levelDescription: (level) => `플레이어 치명타 확률 +${Math.round(level * CRITICAL_CHANCE_PER_LEVEL * 100)}%`,
  },
  shockwave: {
    key: "shockwave",
    nodeFamily: "shockwave",
    title: "공격 횟수 광역 공격",
    description: "일정 횟수의 플레이어 공격마다 넓은 충격파를 일으킵니다.",
    glyphs: ["轟"],
    levelTitles: ["대지 공명"],
    costs: [2_200],
    levelDescription: (level) => `${shockwaveAttackInterval(level)}번째 플레이어 공격마다 ${Math.round(shockwaveDamageMultiplier(level) * 100)}% 광역 공격`,
  },
  time: {
    key: "time",
    nodeFamily: "time",
    title: "전투 제한 시간 증가",
    description: "토벌에서 싸울 수 있는 제한 시간을 늘립니다.",
    glyphs: ["鐘"],
    levelTitles: ["원정 보급선"],
    costs: [700],
    levelDescription: (level) => `전투 제한 시간 +${level * BATTLE_TIME_PER_LEVEL}초`,
  },
  tavern: {
    key: "tavern",
    nodeFamily: "tavern",
    title: "좋은 등급 영입 확률",
    description: "길드원 영입에서 B·A·S 등급이 나올 확률을 높입니다.",
    glyphs: ["星"],
    levelTitles: ["영웅 계약소"],
    costs: [1_600],
    levelDescription: () => "B 이상 영입 확률 4% → 8%",
  },
  gold: {
    key: "gold",
    nodeFamily: "gold",
    title: "토벌 골드 증가량",
    description: "토벌 성공과 실패 회수로 얻는 골드를 늘립니다.",
    glyphs: ["財"],
    levelTitles: ["황금 보급로"],
    costs: [1_200],
    levelDescription: (level) => `토벌 골드 +${Math.round(level * RAID_GOLD_BONUS_PER_LEVEL * 100)}%`,
  },
  guild: {
    key: "guild",
    nodeFamily: "guild",
    title: "길드원 공격력",
    description: "편성한 길드원의 일반 공격과 기술 피해를 높입니다.",
    glyphs: ["軍"],
    levelTitles: ["정예 토벌대"],
    costs: [1_800],
    levelDescription: (level) => `길드원 공격력 +${Math.round(level * GUILD_ATTACK_BONUS_PER_LEVEL * 100)}%`,
  },
  autoAttack: {
    key: "autoAttack",
    nodeFamily: "auto",
    title: "자동 공격",
    description: "플레이어의 현재 무기로 밀집 지역을 주기적으로 자동 공격합니다.",
    glyphs: ["自"],
    levelTitles: ["자율 검진"],
    costs: [2_600],
    levelDescription: (level) => level ? `${(playerAutoAttackIntervalMs(level) / 1_000).toFixed(1)}초마다 플레이어 공격 자동 발동` : "플레이어 자동 공격 잠김",
  },
};

export const UPGRADE_CAPS = UPGRADE_KEYS.reduce((caps, key) => {
  caps[key] = GUILD_UPGRADE_DEFINITIONS[key].costs.length;
  return caps;
}, {} as UpgradeLevels);

export const CORE_UPGRADE_NODES: GuildUpgradeNode[] = UPGRADE_KEYS.flatMap((key) => {
  const definition = GUILD_UPGRADE_DEFINITIONS[key];
  return definition.costs.map((cost, index) => {
    const level = index + 1;
    const id = `${definition.nodeFamily}-${level}`;
    return {
      id,
      title: definition.levelTitles[index],
      description: definition.levelDescription(level),
      glyph: definition.glyphs[index],
      target: key,
      cost,
      prerequisites: [level === 1 ? "foundation" : `${definition.nodeFamily}-${level - 1}`],
    };
  });
});

export const CITADEL_PREREQUISITES = [
  ...UPGRADE_KEYS.map((key) => {
    const definition = GUILD_UPGRADE_DEFINITIONS[key];
    return `${definition.nodeFamily}-${definition.costs.length}`;
  }),
  "special-lightning-2",
  "special-tornado-3",
  "special-meteor-4",
] as const;

export const LEGACY_REMOVED_NODE_REFUNDS: Readonly<Record<string, number>> = {
  "range-2": 180,
  "range-3": 320,
  "range-4": 650,
  "range-5": 1_200,
  "range-6": 1_780,
  "range-7": 2_800,
  "crit-2": 260,
  "crit-3": 480,
  "crit-4": 900,
  "crit-5": 1_800,
  "shockwave-2": 420,
  "shockwave-3": 800,
  "shockwave-4": 1_600,
  "shockwave-5": 3_200,
  "time-2": 200,
  "time-3": 380,
  "time-4": 750,
  "time-5": 1_500,
  "tavern-2": 450,
  "tavern-3": 900,
  "tavern-4": 1_800,
  "tavern-5": 3_600,
  "gold-2": 240,
  "gold-3": 460,
  "gold-4": 900,
  "gold-5": 1_800,
  "guild-2": 220,
  "guild-3": 420,
  "guild-4": 850,
  "guild-5": 1_700,
  "auto-2": 600,
  "auto-3": 1_200,
  "auto-4": 2_500,
  "auto-5": 5_000,
  "combo-1": 210,
  "combo-2": 470,
  "combo-3": 980,
  "combo-4": 1_900,
  "execute-1": 280,
  "execute-2": 760,
  "execute-3": 1_750,
  "momentum-1": 360,
  "momentum-2": 940,
  "momentum-3": 2_150,
  "scout-1": 135,
  "scout-2": 430,
  "scout-3": 1_180,
  "loot-1": 260,
  "loot-2": 680,
  "loot-3": 1_520,
};

export function legacyResearchRefund(nodeIds: readonly string[]) {
  return nodeIds.reduce((sum, id) => sum + (LEGACY_REMOVED_NODE_REFUNDS[id] ?? 0), 0);
}
