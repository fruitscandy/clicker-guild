import type {
  AbortedBattleResult,
  BattleController,
  BattleControllerStatus,
  BattleEvent,
  BattleEventListener,
  BattleResult,
  BattleStartInput,
  DefeatBattleResult,
  MemberId,
  SkillId,
  UnsubscribeBattleEvents,
  VictoryBattleResult,
} from "./contract.ts";

/**
 * A clock-free, deterministic combat implementation for app integration and
 * contract tests. Tests or a demo driver explicitly advance and resolve it.
 */
export class FakeBattleController implements BattleController {
  #status: BattleControllerStatus = "idle";
  #input: BattleStartInput | null = null;
  #monsterHp = 0;
  #elapsedMs = 0;
  readonly #listeners = new Set<BattleEventListener>();

  get status(): BattleControllerStatus {
    return this.#status;
  }

  get subscriberCount(): number {
    return this.#listeners.size;
  }

  get monsterHp(): number {
    return this.#monsterHp;
  }

  start(input: BattleStartInput): void {
    this.#assertNotDisposed();
    if (this.#status === "running" || this.#status === "paused") {
      throw new Error("A battle is already active");
    }
    this.#validateInput(input);

    this.#input = input;
    this.#monsterHp = input.monster.maxHp;
    this.#elapsedMs = 0;
    this.#status = "running";
    this.#emit({
      type: "started",
      battleId: input.battleId,
      stageId: input.stageId,
      monsterMaxHp: input.monster.maxHp,
    });
  }

  advanceBy(milliseconds: number): void {
    this.#assertActive();
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new Error("milliseconds must be a finite, non-negative number");
    }
    if (this.#status === "running") {
      this.#elapsedMs += milliseconds;
    }
  }

  clickAttack(): void {
    const input = this.#assertRunning();
    this.#applyDamage("player-click", input.player.clickDamage, false);
  }

  triggerSkill(memberId: MemberId, skillId: SkillId, damage: number): void {
    const input = this.#assertRunning();
    const member = input.party.find((candidate) => candidate.memberId === memberId);
    if (!member) {
      throw new Error(`Unknown party member: ${memberId}`);
    }
    if (!member.skillIds.includes(skillId)) {
      throw new Error(`Skill ${skillId} is not equipped by ${memberId}`);
    }

    this.#emit({ type: "skillTriggered", battleId: input.battleId, memberId, skillId });
    this.#applyDamage(memberId, damage, false);
  }

  resolveVictory(): VictoryBattleResult {
    const input = this.#assertRunning();
    if (this.#monsterHp > 0) {
      this.#applyDamage("fake-script", this.#monsterHp, false);
    }

    return this.#lastResult("victory") as VictoryBattleResult;
  }

  resolveDefeat(
    reason: DefeatBattleResult["reason"] = "party-defeated",
  ): DefeatBattleResult {
    const input = this.#assertRunning();
    this.#emit({ type: "partyDefeated", battleId: input.battleId, reason });
    return this.#finish({
      type: "defeat",
      battleId: input.battleId,
      stageId: input.stageId,
      elapsedMs: this.#elapsedMs,
      reason,
    });
  }

  pause(): void {
    const input = this.#assertRunning();
    this.#status = "paused";
    this.#emit({ type: "paused", battleId: input.battleId });
  }

  resume(): void {
    const input = this.#assertActive();
    if (this.#status !== "paused") {
      return;
    }
    this.#status = "running";
    this.#emit({ type: "resumed", battleId: input.battleId });
  }

  abort(reason: AbortedBattleResult["reason"] = "user"): void {
    if (this.#status !== "running" && this.#status !== "paused") {
      return;
    }
    const input = this.#requireInput();
    this.#finish({
      type: "aborted",
      battleId: input.battleId,
      stageId: input.stageId,
      elapsedMs: this.#elapsedMs,
      reason,
    });
  }

  subscribe(listener: BattleEventListener): UnsubscribeBattleEvents {
    this.#assertNotDisposed();
    this.#listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      this.#listeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.#status === "disposed") {
      return;
    }
    if (this.#status === "running" || this.#status === "paused") {
      this.abort("disposed");
    }
    this.#listeners.clear();
    this.#input = null;
    this.#status = "disposed";
  }

  #applyDamage(sourceId: string, requestedDamage: number, critical: boolean): void {
    const input = this.#assertRunning();
    if (!Number.isFinite(requestedDamage) || requestedDamage < 0) {
      throw new Error("damage must be a finite, non-negative number");
    }

    const amount = Math.min(requestedDamage, this.#monsterHp);
    this.#monsterHp -= amount;
    this.#emit({
      type: "damageApplied",
      battleId: input.battleId,
      sourceId,
      amount,
      monsterHpAfter: this.#monsterHp,
      critical,
    });

    if (this.#monsterHp === 0) {
      this.#finish({
        type: "victory",
        battleId: input.battleId,
        stageId: input.stageId,
        elapsedMs: this.#elapsedMs,
        rewardGold: input.monster.rewardGold,
      });
    }
  }

  #finish<Result extends BattleResult>(result: Result): Result {
    if (this.#status !== "running" && this.#status !== "paused") {
      throw new Error("Cannot finish an inactive battle");
    }
    this.#status = "completed";
    this.#emit({ type: "ended", result });
    return result;
  }

  #lastResult(expectedType: BattleResult["type"]): BattleResult {
    const input = this.#requireInput();
    if (expectedType !== "victory" || this.#monsterHp !== 0) {
      throw new Error(`Fake battle did not resolve as ${expectedType}: ${input.battleId}`);
    }
    return {
      type: "victory",
      battleId: input.battleId,
      stageId: input.stageId,
      elapsedMs: this.#elapsedMs,
      rewardGold: input.monster.rewardGold,
    };
  }

  #emit(event: BattleEvent): void {
    for (const listener of [...this.#listeners]) {
      listener(event);
    }
  }

  #assertRunning(): BattleStartInput {
    this.#assertNotDisposed();
    if (this.#status !== "running") {
      throw new Error("Battle is not running");
    }
    return this.#requireInput();
  }

  #assertActive(): BattleStartInput {
    this.#assertNotDisposed();
    if (this.#status !== "running" && this.#status !== "paused") {
      throw new Error("Battle is not active");
    }
    return this.#requireInput();
  }

  #assertNotDisposed(): void {
    if (this.#status === "disposed") {
      throw new Error("Battle controller has been disposed");
    }
  }

  #requireInput(): BattleStartInput {
    if (!this.#input) {
      throw new Error("Battle has not been started");
    }
    return this.#input;
  }

  #validateInput(input: BattleStartInput): void {
    if (!input.battleId || !input.stageId) {
      throw new Error("battleId and stageId are required");
    }
    if (!Number.isFinite(input.monster.maxHp) || input.monster.maxHp <= 0) {
      throw new Error("monster.maxHp must be a finite, positive number");
    }
    if (!Number.isFinite(input.player.clickDamage) || input.player.clickDamage < 0) {
      throw new Error("player.clickDamage must be a finite, non-negative number");
    }
  }
}
