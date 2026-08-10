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

export const ATTACK_RANGE_PER_LEVEL = 3.5;
export const CRITICAL_CHANCE_PER_LEVEL = 0.05;
export const BATTLE_TIME_PER_LEVEL = 4;
export const GUILD_ATTACK_BONUS_PER_LEVEL = 0.18;
export const RAID_GOLD_BONUS_PER_LEVEL = 0.12;
export const AUTO_ATTACK_INTERVALS_MS = [0, 5_200, 4_400, 3_700, 3_100, 2_600] as const;
export const CITADEL_RESEARCH_COST = 9_000;

export function shockwaveAttackInterval(level: number) {
  return level > 0 ? Math.max(4, 9 - level) : 0;
}

export function shockwaveDamageMultiplier(level: number) {
  return level > 0 ? 1.3 + level * 0.15 : 1;
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
    glyphs: ["원", "◌", "풍", "旋", "界"],
    levelTitles: ["긴 칼날", "넓은 궤적", "검풍 확장", "대회전 베기", "무한 검계"],
    costs: [100, 180, 320, 650, 1_200],
    levelDescription: (level) => `플레이어 공격 반경 +${(level * ATTACK_RANGE_PER_LEVEL).toFixed(1)}`,
  },
  critical: {
    key: "critical",
    nodeFamily: "crit",
    title: "치명타 확률",
    description: "플레이어 공격이 두 배 피해를 줄 확률을 높입니다.",
    glyphs: ["치", "점", "살", "眼", "必"],
    levelTitles: ["약점 관찰", "급소 추적", "살기 감지", "필중의 눈", "완벽한 일격"],
    costs: [140, 260, 480, 900, 1_800],
    levelDescription: (level) => `플레이어 치명타 확률 +${Math.round(level * CRITICAL_CHANCE_PER_LEVEL * 100)}%`,
  },
  shockwave: {
    key: "shockwave",
    nodeFamily: "shockwave",
    title: "공격 횟수 광역 공격",
    description: "일정 횟수의 플레이어 공격마다 넓은 충격파를 일으킵니다.",
    glyphs: ["파", "波", "震", "轟", "天"],
    levelTitles: ["검압 방출", "파동 증폭", "천지 진동", "대지 공명", "천공 붕괴"],
    costs: [220, 420, 800, 1_600, 3_200],
    levelDescription: (level) => `${shockwaveAttackInterval(level)}번째 플레이어 공격마다 ${Math.round(shockwaveDamageMultiplier(level) * 100)}% 광역 공격`,
  },
  time: {
    key: "time",
    nodeFamily: "time",
    title: "전투 제한 시간 증가",
    description: "토벌에서 싸울 수 있는 제한 시간을 늘립니다.",
    glyphs: ["시", "막", "차", "路", "鐘"],
    levelTitles: ["휴대 식량", "원정 천막", "보급 마차", "왕실 보급로", "시간의 종"],
    costs: [100, 200, 380, 750, 1_500],
    levelDescription: (level) => `전투 제한 시간 +${level * BATTLE_TIME_PER_LEVEL}초`,
  },
  tavern: {
    key: "tavern",
    nodeFamily: "tavern",
    title: "좋은 등급 영입 확률",
    description: "길드원 영입에서 B·A·S 등급이 나올 확률을 높입니다.",
    glyphs: ["관", "잔", "杯", "契", "星"],
    levelTitles: ["여관 증축", "유명한 술집", "영웅의 주점", "황금 계약소", "전설의 객잔"],
    costs: [220, 450, 900, 1_800, 3_600],
    levelDescription: (level) => `상위 등급 영입 확률 ${level}단계 적용`,
  },
  gold: {
    key: "gold",
    nodeFamily: "gold",
    title: "토벌 골드 증가량",
    description: "토벌 성공과 실패 회수로 얻는 골드를 늘립니다.",
    glyphs: ["금", "◇", "상", "財", "王"],
    levelTitles: ["보급 계약", "상단 협약", "교역로", "황금 길드", "왕실 금고"],
    costs: [120, 240, 460, 900, 1_800],
    levelDescription: (level) => `토벌 골드 +${Math.round(level * RAID_GOLD_BONUS_PER_LEVEL * 100)}%`,
  },
  guild: {
    key: "guild",
    nodeFamily: "guild",
    title: "길드원 공격력",
    description: "편성한 길드원의 일반 공격과 기술 피해를 높입니다.",
    glyphs: ["진", "旗", "합", "★", "軍"],
    levelTitles: ["전투 대형", "집결 깃발", "합동 훈련", "정예 토벌대", "영웅의 군세"],
    costs: [110, 220, 420, 850, 1_700],
    levelDescription: (level) => `길드원 공격력 +${Math.round(level * GUILD_ATTACK_BONUS_PER_LEVEL * 100)}%`,
  },
  autoAttack: {
    key: "autoAttack",
    nodeFamily: "auto",
    title: "자동 공격",
    description: "플레이어의 현재 무기로 밀집 지역을 주기적으로 자동 공격합니다.",
    glyphs: ["自", "連", "速", "無", "極"],
    levelTitles: ["자율 검격", "자동 추적", "고속 반응", "무인 검진", "극의 자동화"],
    costs: [300, 600, 1_200, 2_500, 5_000],
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
  "range-6": 1_780,
  "range-7": 2_800,
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
