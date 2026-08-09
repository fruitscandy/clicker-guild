export type BattleId = string;
export type StageId = string;
export type MemberId = string;
export type SkillId = string;

export interface PartyMemberGrowth {
  readonly level: number;
  readonly rankId: string;
  readonly attack: number;
  readonly maxHp: number;
  readonly attackIntervalMs: number;
}
export interface PartyMemberBattleInput {
  readonly memberId: MemberId;
  readonly growth: PartyMemberGrowth;
  readonly skillIds: readonly SkillId[];
}

export interface MonsterBattleInput {
  readonly monsterId: string;
  readonly maxHp: number;
  readonly attack: number;
  readonly attackIntervalMs: number;
  readonly rewardGold: number;
}

export interface BattleSettings {
  /** A deterministic seed for combat implementations that use randomness. */
  readonly seed: number;
  readonly speedMultiplier: number;
  readonly autoUseSkills: boolean;
  readonly reducedMotion: boolean;
  readonly muted: boolean;
}

export interface BattleStartInput {
  readonly battleId: BattleId;
  readonly stageId: StageId;
  readonly monster: MonsterBattleInput;
  readonly party: readonly PartyMemberBattleInput[];
  readonly player: {
    readonly clickDamage: number;
  };
  readonly settings: BattleSettings;
}

interface BattleResultBase {
  readonly battleId: BattleId;
  readonly stageId: StageId;
  readonly elapsedMs: number;
}

export interface VictoryBattleResult extends BattleResultBase {
  readonly type: "victory";
  readonly rewardGold: number;
}

export interface DefeatBattleResult extends BattleResultBase {
  readonly type: "defeat";
  readonly reason: "party-defeated" | "time-limit";
}

export interface AbortedBattleResult extends BattleResultBase {
  readonly type: "aborted";
  readonly reason: "user" | "superseded" | "disposed";
}

export type BattleResult =
  | VictoryBattleResult
  | DefeatBattleResult
  | AbortedBattleResult;

export type BattleEvent =
  | {
      readonly type: "started";
      readonly battleId: BattleId;
      readonly stageId: StageId;
      readonly monsterMaxHp: number;
    }
  | { readonly type: "paused"; readonly battleId: BattleId }
  | { readonly type: "resumed"; readonly battleId: BattleId }
  | {
      readonly type: "skillTriggered";
      readonly battleId: BattleId;
      readonly memberId: MemberId;
      readonly skillId: SkillId;
    }
  | {
      readonly type: "damageApplied";
      readonly battleId: BattleId;
      readonly sourceId: string;
      readonly amount: number;
      readonly monsterHpAfter: number;
      readonly critical: boolean;
    }
  | {
      readonly type: "partyDefeated";
      readonly battleId: BattleId;
      readonly reason: DefeatBattleResult["reason"];
    }
  | { readonly type: "ended"; readonly result: BattleResult };

export type BattleEventListener = (event: BattleEvent) => void;
export type UnsubscribeBattleEvents = () => void;

export type BattleControllerStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "disposed";

/**
 * The only boundary the non-combat app uses to control a combat implementation.
 * Implementations must not access DOM, storage, progression state, or app globals.
 */
export interface BattleController {
  readonly status: BattleControllerStatus;
  start(input: BattleStartInput): void;
  clickAttack(): void;
  pause(): void;
  resume(): void;
  abort(reason?: AbortedBattleResult["reason"]): void;
  subscribe(listener: BattleEventListener): UnsubscribeBattleEvents;
  dispose(): void;
}
