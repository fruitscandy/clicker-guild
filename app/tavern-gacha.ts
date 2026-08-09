import { RANK_ORDER, type MemberDefinition, type Rank } from "./game-data";

export const RECRUIT_COSTS = {
  single: 300,
  ten: 2_700,
} as const;

export const MEMBER_SALE_PRICES: Record<Rank, number> = {
  F: 60,
  E: 100,
  D: 220,
  C: 500,
  B: 1_200,
  A: 3_000,
  S: 8_000,
};

const RECRUIT_RATES_BY_TAVERN_LEVEL: ReadonlyArray<Record<Rank, number>> = [
  { F: 52, E: 26, D: 12, C: 6, B: 2.8, A: 1, S: 0.2 },
  { F: 48, E: 26, D: 14, C: 7, B: 3.5, A: 1.2, S: 0.3 },
  { F: 44, E: 26, D: 16, C: 8, B: 4, A: 1.5, S: 0.5 },
  { F: 40, E: 25, D: 18, C: 9, B: 5, A: 2, S: 1 },
];

export type RecruitResult = {
  memberId: string;
  isNew: boolean;
  refund: number;
};

export function recruitRatesForLevel(tavernLevel: number) {
  const safeLevel = Math.min(RECRUIT_RATES_BY_TAVERN_LEVEL.length - 1, Math.max(0, Math.round(tavernLevel)));
  return RECRUIT_RATES_BY_TAVERN_LEVEL[safeLevel];
}

export function highRankRecruitChance(tavernLevel: number) {
  const rates = recruitRatesForLevel(tavernLevel);
  return rates.B + rates.A + rates.S;
}

export function formatRecruitRate(rate: number) {
  return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;
}

export function rollRecruitMember(
  members: MemberDefinition[],
  tavernLevel: number,
  random: () => number = Math.random,
) {
  const rates = recruitRatesForLevel(tavernLevel);
  const rankRoll = Math.min(0.999999, Math.max(0, random())) * 100;
  let accumulated = 0;
  let selectedRank: Rank = "F";

  for (const rank of RANK_ORDER) {
    accumulated += rates[rank];
    if (rankRoll < accumulated) {
      selectedRank = rank;
      break;
    }
  }

  const rankPool = members.filter((member) => member.rank === selectedRank);
  const memberRoll = Math.min(0.999999, Math.max(0, random()));
  return rankPool[Math.floor(memberRoll * rankPool.length)];
}

export function rollRecruitMembers(
  members: MemberDefinition[],
  count: 1 | 10,
  tavernLevel: number,
  random: () => number = Math.random,
) {
  return Array.from({ length: count }, () => rollRecruitMember(members, tavernLevel, random));
}

export function settleRecruitment(ownedIds: string[], rolls: MemberDefinition[]) {
  const owned = new Set(ownedIds);
  const newMemberIds: string[] = [];
  let refund = 0;

  const results = rolls.map<RecruitResult>((member) => {
    if (owned.has(member.id)) {
      const duplicateRefund = MEMBER_SALE_PRICES[member.rank];
      refund += duplicateRefund;
      return { memberId: member.id, isNew: false, refund: duplicateRefund };
    }

    owned.add(member.id);
    newMemberIds.push(member.id);
    return { memberId: member.id, isNew: true, refund: 0 };
  });

  return { results, newMemberIds, refund };
}
