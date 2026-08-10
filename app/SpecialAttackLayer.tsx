"use client";

import type { CSSProperties } from "react";
import { SpecialAttackCanvas } from "./SpecialAttackCanvas";
import {
  SPECIAL_ATTACK_ORDER,
  SPECIAL_ATTACKS,
  specialCooldownProgress,
  specialCooldownRemaining,
  type SpecialAttackFx,
  type SpecialAttackKind,
  type SpecialAttackMonster,
} from "./special-attacks";
import styles from "./SpecialAttackLayer.module.css";

type SpecialAttackLayerProps = {
  effects: readonly SpecialAttackFx[];
  activeKinds: readonly SpecialAttackKind[];
  lastCastAt: Partial<Record<SpecialAttackKind, number>>;
  now: number;
};

function LightningEffect() {
  const attack = SPECIAL_ATTACKS.lightning;
  return (
    <div className={styles.lightningStage}>
      <i className={styles.lightningStormVeil} />
      <i className={styles.lightningCloud} />
      <i className={styles.lightningSkyFlash} />
      <SpecialAttackCanvas kind="lightning" width={460} height={620} durationMs={attack.durationMs} impactAtMs={attack.delayMs} className={styles.lightningCanvas} />
    </div>
  );
}

function TornadoEffect() {
  const attack = SPECIAL_ATTACKS.tornado;
  return (
    <div className={styles.tornadoStage}>
      <i className={styles.tornadoPressure} />
      <SpecialAttackCanvas kind="tornado" width={560} height={470} durationMs={attack.durationMs} impactAtMs={attack.delayMs} className={styles.tornadoCanvas} />
    </div>
  );
}

function MeteorEffect() {
  const attack = SPECIAL_ATTACKS.meteor;
  return (
    <div className={styles.meteorStage}>
      <SpecialAttackCanvas kind="meteor" width={760} height={620} durationMs={attack.durationMs} impactAtMs={attack.delayMs} className={styles.meteorCanvas} />
    </div>
  );
}

function HudIcon({ kind }: { kind: SpecialAttackKind }) {
  const name = `${kind[0].toUpperCase()}${kind.slice(1)}`;
  return (
    <i className={`${styles.hudIcon} ${styles[`hudIcon${name}`]}`} aria-hidden="true">
      <i /><b /><em />
    </i>
  );
}

function EffectVisual({ effect }: { effect: SpecialAttackFx }) {
  const attack = SPECIAL_ATTACKS[effect.kind];
  return (
    <div
      className={`${styles.effect} ${styles[effect.kind]}`}
      style={{
        "--effect-x": `${effect.x}%`,
        "--effect-y": `${effect.y}%`,
        "--effect-duration": `${attack.durationMs}ms`,
        "--effect-delay": `${attack.delayMs}ms`,
        "--effect-accent": attack.accent,
      } as CSSProperties}
      aria-hidden="true"
    >
      {effect.kind === "lightning" ? <LightningEffect /> : effect.kind === "tornado" ? <TornadoEffect /> : <MeteorEffect />}
    </div>
  );
}

function latestMonsterEffect(monsterId: string, effects: readonly SpecialAttackFx[], now: number) {
  return effects.findLast((effect) => now < effect.expiresAt && effect.targetIds.includes(monsterId));
}

export function specialMonsterClassName(monsterId: string, effects: readonly SpecialAttackFx[], now: number) {
  return effects
    .filter((effect) => now < effect.expiresAt && (effect.kind === "tornado" || now >= effect.impactAt) && effect.targetIds.includes(monsterId))
    .map((effect) => `special-${effect.kind}-target`)
    .join(" ");
}

export function specialMonsterEffectStyle(
  monster: Pick<SpecialAttackMonster, "id" | "x" | "y">,
  effects: readonly SpecialAttackFx[],
  now: number,
): CSSProperties {
  const effect = latestMonsterEffect(monster.id, effects, now);
  if (!effect || effect.kind === "lightning") return {};
  const dx = monster.x - effect.x;
  const dy = (monster.y - effect.y) * 0.72;
  const length = Math.max(0.01, Math.hypot(dx, dy));
  const direction = effect.kind === "tornado" ? 1 : -1;
  const distance = effect.kind === "tornado" ? 42 : 78;
  return {
    "--special-motion-x": `${dx / length * distance * direction}px`,
    "--special-motion-y": `${dy / length * distance * direction}px`,
  } as CSSProperties;
}

export function SpecialAttackLayer({ effects, activeKinds, lastCastAt, now }: SpecialAttackLayerProps) {
  if (!activeKinds.length) return null;
  const latest = effects.at(-1);

  return (
    <>
      <div className={styles.layer} aria-hidden="true">
        {effects.map((effect) => <EffectVisual key={effect.id} effect={effect} />)}
      </div>
      <div className={styles.hud} aria-label="자동 특수 공격 충전 상태">
        {SPECIAL_ATTACK_ORDER.filter((kind) => activeKinds.includes(kind)).map((kind) => {
          const attack = SPECIAL_ATTACKS[kind];
          const progress = specialCooldownProgress(kind, lastCastAt[kind] ?? 0, now);
          const remaining = specialCooldownRemaining(kind, lastCastAt[kind] ?? 0, now);
          const casting = effects.some((effect) => effect.kind === kind && now < effect.expiresAt);
          return (
            <span key={kind} className={`${styles.hudSpell} ${casting ? styles.casting : ""}`} style={{ "--cooldown-progress": `${progress * 100}%`, "--effect-accent": attack.accent } as CSSProperties}>
              <HudIcon kind={kind} />
              <span><small>{attack.title}</small><strong>{casting ? "발동!" : remaining <= 0 ? "준비 완료" : `${(remaining / 1000).toFixed(1)}초`}</strong></span>
              <b><i /></b>
            </span>
          );
        })}
      </div>
      {latest && <span className={styles.srOnly} role="status">{SPECIAL_ATTACKS[latest.kind].title} 발동, 몬스터 {latest.targetIds.length}체가 영향을 받았습니다.</span>}
    </>
  );
}
