import { type Grade, isGrade } from "../domain/member-growth";
import { type StageId, isStageId, parseStageId } from "../domain/stage";
import { DomainValidationError, assertPlainObject } from "../domain/validation";

export type RecruitmentUnlock =
  | Readonly<{ kind: "new-game" }>
  | Readonly<{ kind: "first-clear"; stageId: StageId }>;

export interface RecruitmentEntry {
  readonly memberId: string;
  readonly displayName: string;
  readonly grade: Grade;
  readonly cost: number;
  readonly automatic: boolean;
  readonly unlock: RecruitmentUnlock;
}

const MEMBER_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function parseRecruitmentEntry(value: unknown, index: number): RecruitmentEntry {
  const path = `recruitments[${index}]`;
  assertPlainObject(value, path);

  const { memberId, displayName, grade, cost, automatic, unlock } = value;

  if (typeof memberId !== "string" || !MEMBER_ID_PATTERN.test(memberId)) {
    throw new DomainValidationError(`${path}.memberId`, "영문 소문자로 시작하는 kebab-case ID여야 합니다.");
  }
  if (typeof displayName !== "string" || displayName.trim().length === 0) {
    throw new DomainValidationError(`${path}.displayName`, "비어 있지 않은 문자열이어야 합니다.");
  }
  if (!isGrade(grade)) {
    throw new DomainValidationError(`${path}.grade`, "유효한 길드원 등급이어야 합니다.");
  }
  if (typeof cost !== "number" || !Number.isSafeInteger(cost) || cost < 0) {
    throw new DomainValidationError(`${path}.cost`, "0 이상의 안전한 정수여야 합니다.");
  }
  if (typeof automatic !== "boolean") {
    throw new DomainValidationError(`${path}.automatic`, "불리언이어야 합니다.");
  }

  assertPlainObject(unlock, `${path}.unlock`);
  let parsedUnlock: RecruitmentUnlock;

  if (unlock.kind === "new-game") {
    if (automatic !== true || cost !== 0) {
      throw new DomainValidationError(path, "새 게임 영입은 자동이며 무료여야 합니다.");
    }
    parsedUnlock = Object.freeze({ kind: "new-game" });
  } else if (unlock.kind === "first-clear") {
    if (!isStageId(unlock.stageId)) {
      throw new DomainValidationError(`${path}.unlock.stageId`, "유효한 스테이지 ID여야 합니다.");
    }
    const parsedStage = parseStageId(unlock.stageId);
    if (parsedStage.region !== 1) {
      throw new DomainValidationError(`${path}.unlock.stageId`, "1지역 스테이지여야 합니다.");
    }
    if (automatic || cost <= 0) {
      throw new DomainValidationError(path, "최초 클리어 영입은 수동이며 비용이 1 이상이어야 합니다.");
    }
    parsedUnlock = Object.freeze({ kind: "first-clear", stageId: parsedStage.id });
  } else {
    throw new DomainValidationError(`${path}.unlock.kind`, "new-game 또는 first-clear여야 합니다.");
  }

  return Object.freeze({ memberId, displayName, grade, cost, automatic, unlock: parsedUnlock });
}

export function parseRegionOneRecruitments(value: unknown): readonly RecruitmentEntry[] {
  if (!Array.isArray(value)) {
    throw new DomainValidationError("recruitments", "배열이어야 합니다.");
  }
  if (value.length === 0) {
    throw new DomainValidationError("recruitments", "적어도 한 항목이 필요합니다.");
  }

  const entries = value.map(parseRecruitmentEntry);
  const memberIds = new Set<string>();
  const firstClearStages = new Set<StageId>();
  let newGameCount = 0;

  for (const entry of entries) {
    if (memberIds.has(entry.memberId)) {
      throw new DomainValidationError("recruitments", `중복 memberId: ${entry.memberId}`);
    }
    memberIds.add(entry.memberId);

    if (entry.unlock.kind === "new-game") {
      newGameCount += 1;
      continue;
    }

    if (firstClearStages.has(entry.unlock.stageId)) {
      throw new DomainValidationError("recruitments", `중복 해금 스테이지: ${entry.unlock.stageId}`);
    }
    firstClearStages.add(entry.unlock.stageId);
  }

  if (newGameCount !== 1) {
    throw new DomainValidationError("recruitments", "새 게임 자동 영입은 정확히 하나여야 합니다.");
  }

  return Object.freeze(entries);
}

const REGION_ONE_RECRUITMENT_SOURCE = [
  {
    memberId: "roan",
    displayName: "견습 전사 로안",
    grade: "F",
    cost: 0,
    automatic: true,
    unlock: { kind: "new-game" },
  },
  {
    memberId: "mia",
    displayName: "떠돌이 궁수 미아",
    grade: "F",
    cost: 60,
    automatic: false,
    unlock: { kind: "first-clear", stageId: "1-2" },
  },
  {
    memberId: "finn",
    displayName: "골목 도적 핀",
    grade: "F",
    cost: 100,
    automatic: false,
    unlock: { kind: "first-clear", stageId: "1-4" },
  },
  {
    memberId: "lulu",
    displayName: "수습 마법사 루루",
    grade: "F",
    cost: 160,
    automatic: false,
    unlock: { kind: "first-clear", stageId: "1-6" },
  },
  {
    memberId: "eli",
    displayName: "신입 사제 엘리",
    grade: "F",
    cost: 240,
    automatic: false,
    unlock: { kind: "first-clear", stageId: "1-8" },
  },
  {
    memberId: "garon",
    displayName: "방패병 가론",
    grade: "E",
    cost: 400,
    automatic: false,
    unlock: { kind: "first-clear", stageId: "1-10" },
  },
] as const;

export const REGION_ONE_RECRUITMENTS = parseRegionOneRecruitments(REGION_ONE_RECRUITMENT_SOURCE);

export function getRegionOneRecruitment(memberId: unknown): RecruitmentEntry | undefined {
  if (typeof memberId !== "string" || !MEMBER_ID_PATTERN.test(memberId)) {
    throw new DomainValidationError("memberId", "영문 소문자로 시작하는 kebab-case ID여야 합니다.");
  }
  return REGION_ONE_RECRUITMENTS.find((entry) => entry.memberId === memberId);
}
