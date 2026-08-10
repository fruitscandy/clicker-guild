import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { playSpecialAttackSound } from "./special-attack-audio";
import {
  displacedSpecialTargets,
  selectSpecialAttackCenter,
  SPECIAL_ATTACKS,
  specialAttackDamage,
  targetsForSpecialAttack,
  unlockedSpecialAttacks,
  type SpecialAttackFx,
  type SpecialAttackKind,
  type SpecialAttackMonster,
} from "./special-attacks";

type SpecialAttackControllerOptions<T extends SpecialAttackMonster> = {
  battleActive: boolean;
  now: number;
  nodeIds: readonly string[];
  unlockAll?: boolean;
  monsters: readonly T[];
  playerDamage: number;
  weaponTier: number;
  damageMonsters: (targetIds: string[], damage: number, impactTier?: number) => void;
  setMonsters: Dispatch<SetStateAction<T[]>>;
};

const FIRST_CAST_DELAY: Record<SpecialAttackKind, number> = {
  lightning: 1_050,
  tornado: 1_850,
  meteor: 2_850,
};

export function useSpecialAttackController<T extends SpecialAttackMonster>({
  battleActive,
  now,
  nodeIds,
  unlockAll = false,
  monsters,
  playerDamage,
  weaponTier,
  damageMonsters,
  setMonsters,
}: SpecialAttackControllerOptions<T>) {
  const activeKinds = useMemo(() => unlockedSpecialAttacks(nodeIds, unlockAll), [nodeIds, unlockAll]);
  const [effects, setEffects] = useState<SpecialAttackFx[]>([]);
  const [lastCastAt, setLastCastAt] = useState<Partial<Record<SpecialAttackKind, number>>>({});
  const lastCastRef = useRef<Partial<Record<SpecialAttackKind, number>>>({});
  const effectCounter = useRef(0);
  const timers = useRef<number[]>([]);
  const battleWasActive = useRef(false);
  const battleActiveRef = useRef(battleActive);

  useEffect(() => {
    battleActiveRef.current = battleActive;
  }, [battleActive]);

  const queueTimer = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current = timers.current.filter((candidate) => candidate !== timer);
      if (battleActiveRef.current) callback();
    }, delay);
    timers.current.push(timer);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const moveTargets = useCallback((kind: "tornado" | "meteor", center: { x: number; y: number }, targetIds: readonly string[], pulse: number) => {
    const targetSet = new Set(targetIds);
    setMonsters((current) => {
      const positions = displacedSpecialTargets(current.filter((monster) => targetSet.has(monster.id)), kind, center, pulse);
      return current.map((monster) => {
        const position = positions[monster.id];
        return position ? { ...monster, ...position } : monster;
      });
    });
  }, [setMonsters]);

  const cast = useCallback((kind: SpecialAttackKind, castAt: number) => {
    const alive = monsters.filter((monster) => monster.hp > 0);
    if (!alive.length) return;
    const attack = SPECIAL_ATTACKS[kind];
    const center = selectSpecialAttackCenter(alive, kind);
    const targetIds = targetsForSpecialAttack(alive, kind, center);
    if (!targetIds.length) return;
    const id = effectCounter.current + 1;
    effectCounter.current = id;
    const effect: SpecialAttackFx = {
      id,
      kind,
      ...center,
      targetIds,
      startedAt: castAt,
      impactAt: castAt + attack.delayMs,
      expiresAt: castAt + attack.durationMs,
    };
    setEffects((current) => [...current.slice(-5), effect]);
    playSpecialAttackSound(kind, "cast");

    const impactTier = Math.max(4, weaponTier);
    if (kind === "tornado") {
      Array.from({ length: attack.pulses }, (_, pulse) => {
        queueTimer(() => {
          damageMonsters(targetIds, specialAttackDamage(kind, playerDamage, pulse), impactTier);
          moveTargets(kind, center, targetIds, pulse);
          playSpecialAttackSound(kind, "pulse");
        }, attack.delayMs + 220 + pulse * 520);
      });
    } else {
      queueTimer(() => {
        damageMonsters(targetIds, specialAttackDamage(kind, playerDamage), impactTier);
        if (kind === "meteor") moveTargets(kind, center, targetIds, 0);
        playSpecialAttackSound(kind, "impact");
      }, attack.delayMs);
    }

    queueTimer(() => setEffects((current) => current.filter((candidate) => candidate.id !== id)), attack.durationMs);
  }, [damageMonsters, monsters, moveTargets, playerDamage, queueTimer, weaponTier]);

  useEffect(() => {
    if (!battleActive) {
      if (battleWasActive.current) {
        battleWasActive.current = false;
        clearTimers();
        lastCastRef.current = {};
        setLastCastAt({});
        setEffects([]);
      }
      return;
    }

    if (!battleWasActive.current) {
      battleWasActive.current = true;
      const initialCasts = activeKinds.reduce<Partial<Record<SpecialAttackKind, number>>>((casts, kind) => {
        casts[kind] = now - SPECIAL_ATTACKS[kind].cooldownMs + FIRST_CAST_DELAY[kind];
        return casts;
      }, {});
      lastCastRef.current = initialCasts;
      setLastCastAt(initialCasts);
      setEffects([]);
      return;
    }

    if (!monsters.some((monster) => monster.hp > 0)) return;
    activeKinds.forEach((kind) => {
      const previous = lastCastRef.current[kind] ?? now;
      if (now - previous < SPECIAL_ATTACKS[kind].cooldownMs) return;
      lastCastRef.current[kind] = now;
      setLastCastAt((current) => ({ ...current, [kind]: now }));
      cast(kind, now);
    });
  }, [activeKinds, battleActive, cast, clearTimers, monsters, now]);

  return { activeKinds, effects, lastCastAt };
}
