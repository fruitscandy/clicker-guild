export const CURRENT_SAVE_SCHEMA_VERSION = 1 as const;

export const SAVE_LIMITS = {
  maxGold: Number.MAX_SAFE_INTEGER,
  maxMemberLevel: 20,
  maxEnhancement: 10,
  maxPartySize: 4,
  maxOfflineGoldPerSecond: 1_000_000,
} as const;

export type StageId = `${number}-${number}`;

export interface EconomySave {
  gold: number;
  lifetimeGoldEarned: number;
  lifetimeGoldSpent: number;
}

export interface ProgressionSave {
  selectedStage: StageId;
  highestClearedStage: StageId | null;
  clearedStages: StageId[];
  firstClearClaimed: StageId[];
}

export interface MemberSave {
  owned: boolean;
  unlocked: boolean;
  level: number;
  xp: number;
  enhancement: number;
}

export interface OfflineSave {
  lastSeenAt: number;
  goldPerSecond: number;
  pendingGold: number;
  pendingCalculatedAt: number | null;
}

export interface SettingsSave {
  musicVolume: number;
  sfxVolume: number;
  locale: string;
}

export interface StatsSave {
  monstersDefeated: number;
  bossesDefeated: number;
  manualClicks: number;
}

export interface SaveV1 {
  schemaVersion: typeof CURRENT_SAVE_SCHEMA_VERSION;
  saveId: string;
  createdAt: number;
  updatedAt: number;
  economy: EconomySave;
  progression: ProgressionSave;
  members: Record<string, MemberSave>;
  party: string[];
  offline: OfflineSave;
  settings: SettingsSave;
  stats: StatsSave;
}

export interface CreateDefaultSaveOptions {
  now?: number;
  saveId?: string;
}

export interface SaveValidationIssue {
  path: string;
  message: string;
}

export interface SanitizeSaveResult {
  save: SaveV1;
  issues: SaveValidationIssue[];
}

const STAGE_PATTERN = /^(10|[1-9])-(10|[1-9])$/;
const MEMBER_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

function defaultSaveId(now: number): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid !== undefined) {
    return `local-${uuid}`;
  }
  return `local-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function finiteTimestamp(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)));
}

export function createDefaultSave(options: CreateDefaultSaveOptions = {}): SaveV1 {
  const now = finiteTimestamp(options.now ?? Date.now());
  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    saveId: options.saveId ?? defaultSaveId(now),
    createdAt: now,
    updatedAt: now,
    economy: {
      gold: 0,
      lifetimeGoldEarned: 0,
      lifetimeGoldSpent: 0,
    },
    progression: {
      selectedStage: "1-1",
      highestClearedStage: null,
      clearedStages: [],
      firstClearClaimed: [],
    },
    members: {
      roan: {
        owned: true,
        unlocked: true,
        level: 1,
        xp: 0,
        enhancement: 0,
      },
    },
    party: ["roan"],
    offline: {
      lastSeenAt: now,
      goldPerSecond: 0,
      pendingGold: 0,
      pendingCalculatedAt: null,
    },
    settings: {
      musicVolume: 0.8,
      sfxVolume: 0.8,
      locale: "ko-KR",
    },
    stats: {
      monstersDefeated: 0,
      bossesDefeated: 0,
      manualClicks: 0,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stageIndex(stageId: StageId): number {
  const [regionText, stageText] = stageId.split("-");
  return (Number(regionText) - 1) * 10 + Number(stageText);
}

function isStageId(value: unknown): value is StageId {
  return typeof value === "string" && STAGE_PATTERN.test(value);
}

function nextStage(stageId: StageId): StageId | null {
  const index = stageIndex(stageId);
  if (index >= 100) {
    return null;
  }
  const nextIndex = index + 1;
  const region = Math.floor((nextIndex - 1) / 10) + 1;
  const stage = ((nextIndex - 1) % 10) + 1;
  return `${region}-${stage}`;
}

function recordAt(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const candidate = value[key];
  return isRecord(candidate) ? candidate : {};
}

function addIssue(issues: SaveValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function sanitizeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  integer: boolean,
  path: string,
  issues: SaveValidationIssue[],
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addIssue(issues, path, "유한 숫자가 아니어서 기본값으로 보정했습니다.");
    return fallback;
  }
  const normalized = integer ? Math.floor(value) : value;
  const clamped = Math.min(max, Math.max(min, normalized));
  if (clamped !== value) {
    addIssue(issues, path, "허용 범위로 보정했습니다.");
  }
  return clamped;
}

function sanitizeBoolean(
  value: unknown,
  fallback: boolean,
  path: string,
  issues: SaveValidationIssue[],
): boolean {
  if (typeof value !== "boolean") {
    addIssue(issues, path, "불리언이 아니어서 기본값으로 보정했습니다.");
    return fallback;
  }
  return value;
}

function sanitizeStageList(
  value: unknown,
  path: string,
  issues: SaveValidationIssue[],
): StageId[] {
  if (!Array.isArray(value)) {
    addIssue(issues, path, "배열이 아니어서 빈 목록으로 보정했습니다.");
    return [];
  }
  const result: StageId[] = [];
  const seen = new Set<StageId>();
  for (const entry of value) {
    if (!isStageId(entry) || seen.has(entry)) {
      addIssue(issues, path, "잘못되었거나 중복된 스테이지 ID를 제거했습니다.");
      continue;
    }
    seen.add(entry);
    result.push(entry);
  }
  return result.sort((left, right) => stageIndex(left) - stageIndex(right));
}

function sanitizeMember(
  value: unknown,
  path: string,
  issues: SaveValidationIssue[],
): MemberSave {
  const source = isRecord(value) ? value : {};
  if (!isRecord(value)) {
    addIssue(issues, path, "길드원 상태가 객체가 아니어서 기본값으로 보정했습니다.");
  }
  const owned = sanitizeBoolean(source.owned, false, `${path}.owned`, issues);
  const unlockedInput = sanitizeBoolean(source.unlocked, false, `${path}.unlocked`, issues);
  if (owned && !unlockedInput) {
    addIssue(issues, `${path}.unlocked`, "소유한 길드원을 해금 상태로 보정했습니다.");
  }
  return {
    owned,
    unlocked: owned || unlockedInput,
    level: sanitizeNumber(
      source.level,
      1,
      1,
      SAVE_LIMITS.maxMemberLevel,
      true,
      `${path}.level`,
      issues,
    ),
    xp: sanitizeNumber(
      source.xp,
      0,
      0,
      SAVE_LIMITS.maxGold,
      true,
      `${path}.xp`,
      issues,
    ),
    enhancement: sanitizeNumber(
      source.enhancement,
      0,
      0,
      SAVE_LIMITS.maxEnhancement,
      true,
      `${path}.enhancement`,
      issues,
    ),
  };
}

export function sanitizeSaveV1(
  value: unknown,
  options: CreateDefaultSaveOptions = {},
): SanitizeSaveResult {
  const defaults = createDefaultSave(options);
  const issues: SaveValidationIssue[] = [];
  const source = isRecord(value) ? value : {};
  if (!isRecord(value)) {
    addIssue(issues, "$", "저장 루트가 객체가 아니어서 기본 저장으로 보정했습니다.");
  }

  if (source.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) {
    addIssue(issues, "schemaVersion", "현재 스키마 버전으로 보정했습니다.");
  }

  const economy = recordAt(source, "economy");
  const progression = recordAt(source, "progression");
  const offline = recordAt(source, "offline");
  const settings = recordAt(source, "settings");
  const stats = recordAt(source, "stats");

  const saveId = typeof source.saveId === "string" && source.saveId.trim().length > 0
    ? source.saveId.slice(0, 128)
    : defaults.saveId;
  if (saveId !== source.saveId) {
    addIssue(issues, "saveId", "유효한 저장 ID로 보정했습니다.");
  }

  const createdAt = sanitizeNumber(
    source.createdAt,
    defaults.createdAt,
    0,
    Number.MAX_SAFE_INTEGER,
    true,
    "createdAt",
    issues,
  );
  const updatedAt = sanitizeNumber(
    source.updatedAt,
    defaults.updatedAt,
    createdAt,
    Number.MAX_SAFE_INTEGER,
    true,
    "updatedAt",
    issues,
  );

  const clearedStages = sanitizeStageList(
    progression.clearedStages,
    "progression.clearedStages",
    issues,
  );
  const clearedSet = new Set(clearedStages);
  const claimedStages = sanitizeStageList(
    progression.firstClearClaimed,
    "progression.firstClearClaimed",
    issues,
  ).filter((stage) => {
    if (clearedSet.has(stage)) {
      return true;
    }
    addIssue(
      issues,
      "progression.firstClearClaimed",
      "클리어하지 않은 스테이지의 최초 보상 기록을 제거했습니다.",
    );
    return false;
  });
  const highestClearedStage = clearedStages.length === 0
    ? null
    : clearedStages[clearedStages.length - 1] ?? null;
  if (progression.highestClearedStage !== highestClearedStage) {
    addIssue(issues, "progression.highestClearedStage", "클리어 목록에서 다시 계산했습니다.");
  }
  const unlockedStages = new Set<StageId>(["1-1"]);
  for (const stage of clearedStages) {
    const following = nextStage(stage);
    if (following !== null) {
      unlockedStages.add(following);
    }
    unlockedStages.add(stage);
  }
  const selectedStage = isStageId(progression.selectedStage)
    && unlockedStages.has(progression.selectedStage)
    ? progression.selectedStage
    : defaults.progression.selectedStage;
  if (selectedStage !== progression.selectedStage) {
    addIssue(issues, "progression.selectedStage", "해금된 유효 스테이지로 보정했습니다.");
  }

  const members: Record<string, MemberSave> = {};
  const memberSource = isRecord(source.members) ? source.members : {};
  if (!isRecord(source.members)) {
    addIssue(issues, "members", "길드원 목록이 객체가 아니어서 기본값으로 보정했습니다.");
  }
  for (const [memberId, memberValue] of Object.entries(memberSource)) {
    if (!MEMBER_ID_PATTERN.test(memberId)) {
      addIssue(issues, `members.${memberId}`, "유효하지 않은 길드원 ID를 제거했습니다.");
      continue;
    }
    members[memberId] = sanitizeMember(memberValue, `members.${memberId}`, issues);
  }
  if (members.roan === undefined) {
    members.roan = defaults.members.roan!;
    addIssue(issues, "members.roan", "기본 길드원을 복구했습니다.");
  } else if (!members.roan.owned || !members.roan.unlocked) {
    members.roan = { ...members.roan, owned: true, unlocked: true };
    addIssue(issues, "members.roan", "기본 길드원의 소유·해금 상태를 복구했습니다.");
  }

  const party: string[] = [];
  const partySource = Array.isArray(source.party) ? source.party : [];
  if (!Array.isArray(source.party)) {
    addIssue(issues, "party", "파티가 배열이 아니어서 기본 편성으로 보정했습니다.");
  }
  for (const memberId of partySource) {
    const valid = typeof memberId === "string"
      && members[memberId]?.owned === true
      && !party.includes(memberId);
    if (!valid || party.length >= SAVE_LIMITS.maxPartySize) {
      addIssue(issues, "party", "미소유·중복 또는 최대 인원을 넘는 길드원을 제거했습니다.");
      continue;
    }
    party.push(memberId);
  }
  if (party.length === 0) {
    party.push("roan");
    addIssue(issues, "party", "파티가 비어 기본 길드원을 편성했습니다.");
  }

  const offlineLastSeenAt = sanitizeNumber(
    offline.lastSeenAt,
    defaults.offline.lastSeenAt,
    0,
    Number.MAX_SAFE_INTEGER,
    true,
    "offline.lastSeenAt",
    issues,
  );
  const pendingGold = sanitizeNumber(
    offline.pendingGold,
    defaults.offline.pendingGold,
    0,
    SAVE_LIMITS.maxGold,
    true,
    "offline.pendingGold",
    issues,
  );
  const pendingCalculatedAt = offline.pendingCalculatedAt === null
    ? null
    : sanitizeNumber(
        offline.pendingCalculatedAt,
        offlineLastSeenAt,
        0,
        Number.MAX_SAFE_INTEGER,
        true,
        "offline.pendingCalculatedAt",
        issues,
      );
  if (pendingGold === 0 && pendingCalculatedAt !== null) {
    addIssue(issues, "offline.pendingCalculatedAt", "미수령 보상이 없어 계산 시각을 제거했습니다.");
  }

  const save: SaveV1 = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    saveId,
    createdAt,
    updatedAt,
    economy: {
      gold: sanitizeNumber(economy.gold, 0, 0, SAVE_LIMITS.maxGold, true, "economy.gold", issues),
      lifetimeGoldEarned: sanitizeNumber(
        economy.lifetimeGoldEarned,
        0,
        0,
        SAVE_LIMITS.maxGold,
        true,
        "economy.lifetimeGoldEarned",
        issues,
      ),
      lifetimeGoldSpent: sanitizeNumber(
        economy.lifetimeGoldSpent,
        0,
        0,
        SAVE_LIMITS.maxGold,
        true,
        "economy.lifetimeGoldSpent",
        issues,
      ),
    },
    progression: {
      selectedStage,
      highestClearedStage,
      clearedStages,
      firstClearClaimed: claimedStages,
    },
    members,
    party,
    offline: {
      lastSeenAt: offlineLastSeenAt,
      goldPerSecond: sanitizeNumber(
        offline.goldPerSecond,
        0,
        0,
        SAVE_LIMITS.maxOfflineGoldPerSecond,
        false,
        "offline.goldPerSecond",
        issues,
      ),
      pendingGold,
      pendingCalculatedAt: pendingGold === 0 ? null : pendingCalculatedAt,
    },
    settings: {
      musicVolume: sanitizeNumber(settings.musicVolume, 0.8, 0, 1, false, "settings.musicVolume", issues),
      sfxVolume: sanitizeNumber(settings.sfxVolume, 0.8, 0, 1, false, "settings.sfxVolume", issues),
      locale: typeof settings.locale === "string" && settings.locale.length > 0
        ? settings.locale.slice(0, 32)
        : "ko-KR",
    },
    stats: {
      monstersDefeated: sanitizeNumber(
        stats.monstersDefeated,
        0,
        0,
        SAVE_LIMITS.maxGold,
        true,
        "stats.monstersDefeated",
        issues,
      ),
      bossesDefeated: sanitizeNumber(
        stats.bossesDefeated,
        0,
        0,
        SAVE_LIMITS.maxGold,
        true,
        "stats.bossesDefeated",
        issues,
      ),
      manualClicks: sanitizeNumber(
        stats.manualClicks,
        0,
        0,
        SAVE_LIMITS.maxGold,
        true,
        "stats.manualClicks",
        issues,
      ),
    },
  };

  if (save.settings.locale !== settings.locale) {
    addIssue(issues, "settings.locale", "유효한 언어 코드로 보정했습니다.");
  }
  if (save.offline.pendingGold > 0 && save.offline.pendingCalculatedAt === null) {
    save.offline.pendingCalculatedAt = save.offline.lastSeenAt;
    addIssue(issues, "offline.pendingCalculatedAt", "미수령 보상의 계산 시각을 복구했습니다.");
  }

  return { save, issues };
}

export function validateSaveV1(value: unknown): value is SaveV1 {
  if (!isRecord(value) || value.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) {
    return false;
  }
  return sanitizeSaveV1(value, { now: 0, saveId: "validation" }).issues.length === 0;
}
