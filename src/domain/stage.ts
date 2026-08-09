import { DomainValidationError, assertFiniteIntegerInRange } from "./validation";

export const MIN_REGION = 1;
export const MAX_REGION = 10;
export const MIN_STAGE_IN_REGION = 1;
export const MAX_STAGE_IN_REGION = 10;
export const MIN_STAGE_INDEX = 1;
export const MAX_STAGE_INDEX = MAX_REGION * MAX_STAGE_IN_REGION;

declare const stageIdBrand: unique symbol;

export type StageId = string & { readonly [stageIdBrand]: "StageId" };

export interface ParsedStageId {
  readonly id: StageId;
  readonly region: number;
  readonly stage: number;
  readonly overallIndex: number;
  readonly isBoss: boolean;
}

const STAGE_ID_PATTERN = /^(10|[1-9])-(10|[1-9])$/;

export function createStageId(region: unknown, stage: unknown): StageId {
  assertFiniteIntegerInRange(region, "region", MIN_REGION, MAX_REGION);
  assertFiniteIntegerInRange(stage, "stage", MIN_STAGE_IN_REGION, MAX_STAGE_IN_REGION);
  return `${region}-${stage}` as StageId;
}

export function parseStageId(value: unknown): ParsedStageId {
  if (typeof value !== "string") {
    throw new DomainValidationError("stageId", "문자열이어야 합니다.");
  }

  const match = STAGE_ID_PATTERN.exec(value);
  if (match === null) {
    throw new DomainValidationError("stageId", "1-1부터 10-10까지의 '지역-스테이지' 형식이어야 합니다.");
  }

  const regionText = match[1];
  const stageText = match[2];
  if (regionText === undefined || stageText === undefined) {
    throw new DomainValidationError("stageId", "지역 또는 스테이지가 누락되었습니다.");
  }

  const region = Number(regionText);
  const stage = Number(stageText);
  const overallIndex = (region - 1) * MAX_STAGE_IN_REGION + stage;

  return Object.freeze({
    id: value as StageId,
    region,
    stage,
    overallIndex,
    isBoss: stage === MAX_STAGE_IN_REGION,
  });
}

export function isStageId(value: unknown): value is StageId {
  try {
    parseStageId(value);
    return true;
  } catch (error) {
    if (error instanceof DomainValidationError) {
      return false;
    }
    throw error;
  }
}

export function toOverallStageIndex(stageId: unknown): number {
  return parseStageId(stageId).overallIndex;
}

export function isBossStage(stageId: unknown): boolean {
  return parseStageId(stageId).isBoss;
}

export function assertStageIndex(value: unknown): asserts value is number {
  assertFiniteIntegerInRange(value, "stageIndex", MIN_STAGE_INDEX, MAX_STAGE_INDEX);
}
