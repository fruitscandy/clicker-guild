import {
  CURRENT_SAVE_SCHEMA_VERSION,
  createDefaultSave,
  sanitizeSaveV1,
  type CreateDefaultSaveOptions,
  type SanitizeSaveResult,
  type SaveV1,
} from "./model.ts";

export class CorruptSaveError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CorruptSaveError";
  }
}
export class FutureSaveVersionError extends Error {
  readonly version: number;

  constructor(version: number) {
    super(`현재 코드보다 새로운 저장 버전(${version})은 불러올 수 없습니다.`);
    this.name = "FutureSaveVersionError";
    this.version = version;
  }
}

export interface ParseSaveResult extends SanitizeSaveResult {
  migratedFrom: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 버전 필드가 없던 초기 프로토타입 저장을 v1 모양으로 옮긴다.
 * 정적 콘텐츠는 복제하지 않고, 최종 범위 보정은 sanitizeSaveV1이 담당한다.
 */
export function migrateV0ToV1(
  value: Record<string, unknown>,
  options: CreateDefaultSaveOptions = {},
): SaveV1 {
  const defaults = createDefaultSave(options);
  const oldEconomy = isRecord(value.economy) ? value.economy : {};
  const oldProgression = isRecord(value.progression) ? value.progression : {};
  const oldOffline = isRecord(value.offline) ? value.offline : {};

  const candidate: Record<string, unknown> = {
    ...defaults,
    ...value,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    economy: {
      ...defaults.economy,
      ...oldEconomy,
      gold: oldEconomy.gold ?? value.gold ?? defaults.economy.gold,
    },
    progression: {
      ...defaults.progression,
      ...oldProgression,
    },
    offline: {
      ...defaults.offline,
      ...oldOffline,
      pendingGold: oldOffline.pendingGold ?? 0,
      pendingCalculatedAt: oldOffline.pendingCalculatedAt ?? null,
    },
  };

  return sanitizeSaveV1(candidate, options).save;
}

export function parseSave(
  serialized: string,
  options: CreateDefaultSaveOptions = {},
): ParseSaveResult {
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new CorruptSaveError("저장 JSON을 해석할 수 없습니다.", { cause: error });
  }

  if (!isRecord(value)) {
    throw new CorruptSaveError("저장 루트가 객체가 아닙니다.");
  }

  const rawVersion = value.schemaVersion;
  if (rawVersion === undefined) {
    const save = migrateV0ToV1(value, options);
    return {
      save,
      issues: [{ path: "schemaVersion", message: "버전이 없는 저장을 v1으로 마이그레이션했습니다." }],
      migratedFrom: 0,
    };
  }
  if (typeof rawVersion !== "number" || !Number.isInteger(rawVersion) || rawVersion < 0) {
    throw new CorruptSaveError("저장 스키마 버전이 올바르지 않습니다.");
  }
  if (rawVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    throw new FutureSaveVersionError(rawVersion);
  }
  if (rawVersion < CURRENT_SAVE_SCHEMA_VERSION) {
    if (rawVersion !== 0) {
      throw new CorruptSaveError(`지원하지 않는 이전 저장 버전입니다: ${rawVersion}`);
    }
    const save = migrateV0ToV1(value, options);
    return {
      save,
      issues: [{ path: "schemaVersion", message: "v0 저장을 v1으로 마이그레이션했습니다." }],
      migratedFrom: 0,
    };
  }

  const result = sanitizeSaveV1(value, options);
  return { ...result, migratedFrom: null };
}

export function serializeSave(save: SaveV1): string {
  const sanitized = sanitizeSaveV1(save, {
    now: save.createdAt,
    saveId: save.saveId,
  }).save;
  return JSON.stringify(sanitized);
}
