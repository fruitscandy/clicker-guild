"use client";

import type { CSSProperties } from "react";
import {
  SPECIAL_ATTACK_ORDER,
  SPECIAL_ATTACKS,
  specialCooldownProgress,
  specialCooldownRemaining,
  type SpecialAttackFx,
  type SpecialAttackKind,
} from "./special-attacks";
import styles from "./SpecialAttackLayer.module.css";

type SpecialAttackLayerProps = {
  effects: readonly SpecialAttackFx[];
  activeKinds: readonly SpecialAttackKind[];
  lastCastAt: Partial<Record<SpecialAttackKind, number>>;
  now: number;
};

function LightningEffect() {
  return (
    <div className={styles.lightningStage}>
      <i className={styles.lightningSkyFlash} />
      <i className={styles.lightningArtwork} />
      <i className={styles.lightningAfterglow} />
      <i className={styles.lightningGroundPulse} />
    </div>
  );
}

function TornadoEffect() {
  return (
    <div className={styles.tornadoStage}>
      <i className={styles.tornadoAura} />
      <i className={styles.tornadoArtwork} />
      <i className={styles.tornadoWindWake} />
      <i className={styles.tornadoGroundPulse} />
    </div>
  );
}

function MeteorEffect() {
  return (
    <div className={styles.meteorStage}>
      <i className={styles.meteorApproachGlow} />
      <i className={styles.meteorArtwork} />
      <i className={styles.meteorImpactFlash} />
      <i className={styles.meteorImpactRing} />
    </div>
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
        "--spell-art": `url("${attack.art}")`,
      } as CSSProperties}
      aria-hidden="true"
    >
      {effect.kind === "lightning" ? <LightningEffect /> : effect.kind === "tornado" ? <TornadoEffect /> : <MeteorEffect />}
      <span className={styles.effectTitle}><small>{attack.subtitle}</small><strong>{attack.title}</strong></span>
    </div>
  );
}

export function specialMonsterClassName(monsterId: string, effects: readonly SpecialAttackFx[], now: number) {
  return effects
    .filter((effect) => now < effect.expiresAt && (effect.kind === "tornado" || now >= effect.impactAt) && effect.targetIds.includes(monsterId))
    .map((effect) => `special-${effect.kind}-target`)
    .join(" ");
}

export function SpecialAttackLayer({ effects, activeKinds, lastCastAt, now }: SpecialAttackLayerProps) {
  if (!activeKinds.length) return null;
  const latest = effects.at(-1);

  return (
    <>
      <div className={styles.layer} aria-hidden="true">
        {effects.map((effect) => <EffectVisual key={effect.id} effect={effect} />)}
      </div>
      <div className={styles.hud} aria-label="자동 특수 비술 충전 상태">
        {SPECIAL_ATTACK_ORDER.filter((kind) => activeKinds.includes(kind)).map((kind) => {
          const attack = SPECIAL_ATTACKS[kind];
          const progress = specialCooldownProgress(kind, lastCastAt[kind] ?? 0, now);
          const remaining = specialCooldownRemaining(kind, lastCastAt[kind] ?? 0, now);
          const casting = effects.some((effect) => effect.kind === kind && now < effect.expiresAt);
          return (
            <span key={kind} className={`${styles.hudSpell} ${styles[`hud${kind[0].toUpperCase()}${kind.slice(1)}`]} ${casting ? styles.casting : ""}`} style={{ "--cooldown-progress": `${progress * 100}%`, "--effect-accent": attack.accent, "--spell-art": `url("${attack.art}")` } as CSSProperties}>
              <i className={styles.hudArt} aria-hidden="true" />
              <span><small>{attack.title}</small><strong>{casting ? "발동!" : remaining <= 0 ? "준비 완료" : `${(remaining / 1000).toFixed(1)}초`}</strong></span>
              <b><i /></b>
            </span>
          );
        })}
      </div>
      {latest && <span className={styles.srOnly} role="status">{SPECIAL_ATTACKS[latest.kind].title} 발동, 몬스터 {latest.targetIds.length}체가 영향받습니다.</span>}
    </>
  );
}
