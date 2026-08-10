export type GuildFacility = "hall" | "tavern" | "forge" | "research";

export type GuildHallStage = {
  level: number;
  name: string;
  description: string;
  researchDepth: number;
  upgradeCost: number | null;
  requiredResearch: number | null;
};

export const GUILD_HALL_STAGES: readonly GuildHallStage[] = [
  {
    level: 1,
    name: "개척 길드 회관",
    description: "작은 회관을 중심으로 첫 원정대가 모이는 단계",
    researchDepth: 1,
    upgradeCost: 600,
    requiredResearch: 3,
  },
  {
    level: 2,
    name: "정식 길드 본관",
    description: "여관과 대장간이 자리를 잡고 전문 연구가 시작되는 거점",
    researchDepth: 2,
    upgradeCost: 2_400,
    requiredResearch: 6,
  },
  {
    level: 3,
    name: "성장 길드촌",
    description: "원정·전투·경영 연구가 균형 있게 확장되는 길드촌",
    researchDepth: 3,
    upgradeCost: 7_600,
    requiredResearch: 10,
  },
  {
    level: 4,
    name: "명문 길드 요새",
    description: "선택 연구를 완성하고 마지막 특수 공격을 해금하는 최종 본관",
    researchDepth: 4,
    upgradeCost: null,
    requiredResearch: null,
  },
] as const;

export const GUILD_FACILITIES: ReadonlyArray<{
  id: GuildFacility;
  title: string;
  subtitle: string;
  glyph: string;
}> = [
  { id: "hall", title: "길드 본관", subtitle: "건물 승급과 해금 관리", glyph: "G" },
  { id: "tavern", title: "방랑자의 잔", subtitle: "고용과 파티 편성", glyph: "잔" },
  { id: "forge", title: "불꽃 대장간", subtitle: "플레이어 무기 제작과 강화", glyph: "鍛" },
  { id: "research", title: "길드 강화소", subtitle: "핵심 강화와 특수 공격", glyph: "✦" },
] as const;

export function guildHallStage(level: number) {
  const safeLevel = Math.min(GUILD_HALL_STAGES.length, Math.max(1, Math.floor(level || 1)));
  return GUILD_HALL_STAGES[safeLevel - 1];
}

export function researchDepthForNodeId(nodeId: string) {
  if (nodeId === "foundation") return 0;
  if (nodeId === "citadel") return 7;
  const match = nodeId.match(/-(\d+)$/);
  return match ? Number(match[1]) : 1;
}

export function requiredHallLevelForNode(nodeId: string) {
  const depth = researchDepthForNodeId(nodeId);
  return GUILD_HALL_STAGES.find((stage) => stage.researchDepth >= depth)?.level ?? GUILD_HALL_STAGES.length;
}

export function inferHallLevelFromNodes(nodeIds: string[]) {
  const deepestNode = nodeIds.reduce((deepest, nodeId) => Math.max(deepest, researchDepthForNodeId(nodeId)), 0);
  return GUILD_HALL_STAGES.find((stage) => stage.researchDepth >= deepestNode)?.level ?? GUILD_HALL_STAGES.length;
}
