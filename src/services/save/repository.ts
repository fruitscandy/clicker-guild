import {
  createDefaultSave,
  sanitizeSaveV1,
  type CreateDefaultSaveOptions,
  type SaveV1,
  type SaveValidationIssue,
} from "./model.ts";
import {
  CorruptSaveError,
  FutureSaveVersionError,
  parseSave,
  serializeSave,
} from "./serialization.ts";
import type { StorageLike } from "./storage.ts";

export const DEFAULT_SAVE_KEYS = {
  primary: "clicker-guild.save.v1",
  backup: "clicker-guild.save.v1.backup",
} as const;

export interface SaveKeys {
  primary: string;
  backup: string;
}
export interface SaveRepositoryOptions extends CreateDefaultSaveOptions {
  keys?: SaveKeys;
}

export interface LoadSaveResult {
  save: SaveV1;
  source: "primary" | "backup" | "default";
  issues: SaveValidationIssue[];
}

export class SaveRecoveryError extends Error {
  readonly primaryError: unknown;
  readonly backupError: unknown;

  constructor(primaryError: unknown, backupError: unknown) {
    super("주 저장과 백업 저장을 모두 복구할 수 없습니다.");
    this.name = "SaveRecoveryError";
    this.primaryError = primaryError;
    this.backupError = backupError;
  }
}

function parseOptions(options: SaveRepositoryOptions): CreateDefaultSaveOptions {
  return { now: options.now, saveId: options.saveId };
}

function loadCandidate(
  serialized: string,
  options: SaveRepositoryOptions,
): ReturnType<typeof parseSave> {
  return parseSave(serialized, parseOptions(options));
}

export function saveToStorage(
  storage: StorageLike,
  input: SaveV1,
  options: SaveRepositoryOptions = {},
): SaveV1 {
  const keys = options.keys ?? DEFAULT_SAVE_KEYS;
  const sanitized = sanitizeSaveV1(input, {
    now: input.createdAt,
    saveId: input.saveId,
  }).save;
  const currentPrimary = storage.getItem(keys.primary);

  if (currentPrimary !== null) {
    try {
      const current = loadCandidate(currentPrimary, options);
      storage.setItem(keys.backup, serializeSave(current.save));
    } catch (error) {
      if (error instanceof FutureSaveVersionError) {
        throw error;
      }
      // 손상된 주 저장은 백업에 복제하지 않고 새 정상 저장으로 교체한다.
    }
  }

  storage.setItem(keys.primary, serializeSave(sanitized));
  return sanitized;
}

export function loadFromStorage(
  storage: StorageLike,
  options: SaveRepositoryOptions = {},
): LoadSaveResult {
  const keys = options.keys ?? DEFAULT_SAVE_KEYS;
  const primary = storage.getItem(keys.primary);
  const backup = storage.getItem(keys.backup);

  if (primary === null && backup === null) {
    return {
      save: createDefaultSave(parseOptions(options)),
      source: "default",
      issues: [],
    };
  }

  let primaryError: unknown = new CorruptSaveError("주 저장이 없습니다.");
  if (primary !== null) {
    try {
      const parsed = loadCandidate(primary, options);
      return { save: parsed.save, source: "primary", issues: parsed.issues };
    } catch (error) {
      if (error instanceof FutureSaveVersionError) {
        throw error;
      }
      primaryError = error;
    }
  }

  let backupError: unknown = new CorruptSaveError("백업 저장이 없습니다.");
  if (backup !== null) {
    try {
      const parsed = loadCandidate(backup, options);
      storage.setItem(keys.primary, serializeSave(parsed.save));
      return {
        save: parsed.save,
        source: "backup",
        issues: [
          { path: "$", message: "주 저장을 불러오지 못해 백업을 복구했습니다." },
          ...parsed.issues,
        ],
      };
    } catch (error) {
      if (error instanceof FutureSaveVersionError) {
        throw error;
      }
      backupError = error;
    }
  }

  throw new SaveRecoveryError(primaryError, backupError);
}
