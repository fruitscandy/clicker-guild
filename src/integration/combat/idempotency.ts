import type { BattleId, BattleResult } from "./contract.ts";

/**
 * Ensures a terminal result can mutate progression/save state at most once per
 * battleId. A failing handler is not marked complete and can be retried.
 */
export class BattleResultIdempotencyGuard {
  readonly #processed = new Set<BattleId>();
  readonly #processing = new Set<BattleId>();

  hasProcessed(battleId: BattleId): boolean {
    return this.#processed.has(battleId);
  }

  isProcessing(battleId: BattleId): boolean {
    return this.#processing.has(battleId);
  }

  runOnce(result: BattleResult, handler: (result: BattleResult) => void): boolean {
    if (!this.#begin(result.battleId)) {
      return false;
    }

    try {
      handler(result);
      this.#processed.add(result.battleId);
      return true;
    } finally {
      this.#processing.delete(result.battleId);
    }
  }

  async runOnceAsync(
    result: BattleResult,
    handler: (result: BattleResult) => Promise<void>,
  ): Promise<boolean> {
    if (!this.#begin(result.battleId)) {
      return false;
    }

    try {
      await handler(result);
      this.#processed.add(result.battleId);
      return true;
    } finally {
      this.#processing.delete(result.battleId);
    }
  }

  forget(battleId: BattleId): void {
    if (this.#processing.has(battleId)) {
      throw new Error(`Cannot forget a battle result while it is processing: ${battleId}`);
    }
    this.#processed.delete(battleId);
  }

  clear(): void {
    if (this.#processing.size > 0) {
      throw new Error("Cannot clear battle result history while results are processing");
    }
    this.#processed.clear();
  }

  #begin(battleId: BattleId): boolean {
    if (this.#processed.has(battleId) || this.#processing.has(battleId)) {
      return false;
    }
    this.#processing.add(battleId);
    return true;
  }
}
