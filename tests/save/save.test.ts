import { describe, expect, it } from "vitest";

import {
  CURRENT_SAVE_SCHEMA_VERSION,
  DEFAULT_SAVE_KEYS,
  FutureSaveVersionError,
  MemoryStorage,
  createDefaultSave,
  loadFromStorage,
  parseSave,
  sanitizeSaveV1,
  saveToStorage,
  serializeSave,
  validateSaveV1,
} from "../../src/services/save/index.ts";

const fixedOptions = { now: 1_786_200_000_000, saveId: "local-test" } as const;

describe("save v1 serialization", () => {
  it("정상 저장을 JSON으로 왕복한다", () => {
    const save = createDefaultSave(fixedOptions);
    save.economy.gold = 315;
    save.members.mia = {
      owned: true,
      unlocked: true,
      level: 3,
      xp: 2,
      enhancement: 1,
    };
    save.party = ["roan", "mia"];
    save.offline.pendingGold = 72;
    save.offline.pendingCalculatedAt = fixedOptions.now + 60_000;

    const parsed = parseSave(serializeSave(save), fixedOptions);

    expect(parsed.migratedFrom).toBeNull();
    expect(parsed.issues).toEqual([]);
    expect(parsed.save).toEqual(save);
    expect(validateSaveV1(parsed.save)).toBe(true);
  });

  it("버전이 없던 초기 저장을 v1으로 마이그레이션한다", () => {
    const legacy = JSON.stringify({
      saveId: "legacy",
      createdAt: 10,
      updatedAt: 20,
      gold: 77,
      party: ["roan"],
    });

    const parsed = parseSave(legacy, fixedOptions);

    expect(parsed.migratedFrom).toBe(0);
    expect(parsed.save.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(parsed.save.economy.gold).toBe(77);
    expect(parsed.save.members.roan?.owned).toBe(true);
    expect(parsed.save.offline.pendingGold).toBe(0);
  });
});

describe("save repository recovery", () => {
  it("손상된 주 저장 대신 직전 정상 백업을 복구한다", () => {
    const storage = new MemoryStorage();
    const first = createDefaultSave(fixedOptions);
    first.economy.gold = 100;
    saveToStorage(storage, first, fixedOptions);

    const second = structuredClone(first);
    second.economy.gold = 250;
    saveToStorage(storage, second, fixedOptions);
    storage.setItem(DEFAULT_SAVE_KEYS.primary, "{broken-json");

    const loaded = loadFromStorage(storage, fixedOptions);

    expect(loaded.source).toBe("backup");
    expect(loaded.save.economy.gold).toBe(100);
    expect(parseSave(storage.getItem(DEFAULT_SAVE_KEYS.primary)!, fixedOptions).save).toEqual(first);
  });

  it("미래 버전 주 저장은 백업으로 덮어쓰지 않고 거부한다", () => {
    const future = JSON.stringify({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 });
    const backup = serializeSave(createDefaultSave(fixedOptions));
    const storage = new MemoryStorage({
      [DEFAULT_SAVE_KEYS.primary]: future,
      [DEFAULT_SAVE_KEYS.backup]: backup,
    });

    expect(() => loadFromStorage(storage, fixedOptions)).toThrow(FutureSaveVersionError);
    expect(storage.getItem(DEFAULT_SAVE_KEYS.primary)).toBe(future);
  });
});

describe("save validation and sanitization", () => {
  it("잘못된 수치와 파티 중복·최대 인원을 안전하게 보정한다", () => {
    const source = createDefaultSave(fixedOptions);
    const member = {
      owned: true,
      unlocked: true,
      level: 1,
      xp: 0,
      enhancement: 0,
    };
    const invalid: unknown = {
      ...source,
      economy: {
        gold: -50,
        lifetimeGoldEarned: Number.NaN,
        lifetimeGoldSpent: 4.8,
      },
      progression: {
        selectedStage: "9-9",
        highestClearedStage: "9-9",
        clearedStages: ["1-1", "1-1", "bad"],
        firstClearClaimed: ["1-1", "1-2"],
      },
      members: {
        roan: { owned: false, unlocked: false, level: 99, xp: -2, enhancement: 99 },
        mia: member,
        finn: member,
        lulu: member,
        eli: member,
      },
      party: ["mia", "mia", "finn", "lulu", "eli", "ghost"],
      offline: {
        lastSeenAt: -1,
        goldPerSecond: -4,
        pendingGold: 32.9,
        pendingCalculatedAt: "invalid",
      },
      settings: { musicVolume: 2, sfxVolume: -1, locale: "" },
      stats: { monstersDefeated: -1, bossesDefeated: 2.9, manualClicks: Number.NaN },
    };

    const result = sanitizeSaveV1(invalid, fixedOptions);

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.save.economy).toEqual({
      gold: 0,
      lifetimeGoldEarned: 0,
      lifetimeGoldSpent: 4,
    });
    expect(result.save.members.roan).toMatchObject({
      owned: true,
      unlocked: true,
      level: 20,
      xp: 0,
      enhancement: 10,
    });
    expect(result.save.party).toEqual(["mia", "finn", "lulu", "eli"]);
    expect(new Set(result.save.party).size).toBe(result.save.party.length);
    expect(result.save.progression.selectedStage).toBe("1-1");
    expect(result.save.progression.highestClearedStage).toBe("1-1");
    expect(result.save.progression.firstClearClaimed).toEqual(["1-1"]);
    expect(result.save.offline).toEqual({
      lastSeenAt: 0,
      goldPerSecond: 0,
      pendingGold: 32,
      pendingCalculatedAt: 0,
    });
    expect(result.save.settings).toEqual({
      musicVolume: 1,
      sfxVolume: 0,
      locale: "ko-KR",
    });
    expect(validateSaveV1(result.save)).toBe(true);
  });
});
