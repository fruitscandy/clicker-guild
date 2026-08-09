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

const LIGHTNING_BRANCHES = [
  "M50 0 L43 19 L54 29 L39 49 L48 58 L31 82 L43 90 L36 116",
  "M48 28 L26 41 L20 59 L7 70",
  "M40 52 L62 64 L72 83 L91 91",
  "M34 79 L18 91 L14 108",
];

function LightningEffect() {
  return (
    <div className={styles.lightningStage}>
      <i className={styles.lightningSkyFlash} />
      <i className={styles.lightningTexture} />
      <svg className={styles.lightningBolt} viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="special-lightning-glow" x="-80%" y="-20%" width="260%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {LIGHTNING_BRANCHES.map((path, index) => <path key={path} d={path} className={index ? styles.boltBranch : styles.boltMain} filter="url(#special-lightning-glow)" />)}
      </svg>
      <i className={styles.lightningImpact} />
      <i className={styles.lightningRing} />
      <span className={styles.electricSparks}>
        {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--spark-angle": `${index * 22.5}deg`, "--spark-distance": `${62 + index % 4 * 18}px`, "--spark-delay": `${index * 21}ms` } as CSSProperties} />)}
      </span>
    </div>
  );
}

function TornadoEffect() {
  return (
    <div className={styles.tornadoStage}>
      <i className={styles.tornadoAura} />
      <i className={styles.tornadoTextureBack} />
      <span className={styles.tornadoFunnel}>
        {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--vortex-index": index, "--vortex-width": `${46 + index * 17}px`, "--vortex-top": `${9 + index * 10}%`, "--vortex-delay": `${index * -64}ms` } as CSSProperties} />)}
      </span>
      <i className={styles.tornadoTextureFront} />
      <i className={styles.tornadoGroundRing} />
      <span className={styles.tornadoDebris}>
        {Array.from({ length: 14 }, (_, index) => <i key={index} style={{ "--debris-angle": `${index * 137.5}deg`, "--debris-radius": `${42 + index % 5 * 17}px`, "--debris-delay": `${index * -95}ms`, "--debris-size": `${3 + index % 4}px` } as CSSProperties} />)}
      </span>
    </div>
  );
}

function MeteorEffect() {
  return (
    <div className={styles.meteorStage}>
      <i className={styles.meteorTelegraph} />
      <span className={styles.meteorProjectile}>
        <i className={styles.meteorSmoke} />
        <i className={styles.meteorFlame} />
        <i className={styles.meteorCore}><b /><b /><b /></i>
      </span>
      <span className={styles.meteorImpact}>
        <i className={styles.meteorFlash} />
        <i className={styles.meteorExplosion} />
        <i className={styles.meteorShockwave} />
        <i className={styles.meteorScorch} />
        <span className={styles.meteorFragments}>
          {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--fragment-angle": `${index * 22.5}deg`, "--fragment-distance": `${72 + index % 5 * 22}px`, "--fragment-delay": `${index * 11}ms` } as CSSProperties} />)}
        </span>
      </span>
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
    .filter((effect) => now < effect.expiresAt && effect.targetIds.includes(monsterId))
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
            <span key={kind} className={`${styles.hudSpell} ${styles[`hud${kind[0].toUpperCase()}${kind.slice(1)}`]} ${casting ? styles.casting : ""}`} style={{ "--cooldown-progress": `${progress * 100}%`, "--effect-accent": attack.accent } as CSSProperties}>
              <i className={styles.hudGlyph}>{attack.glyph}</i>
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
