"use client";

/* eslint-disable @next/next/no-img-element -- animated VFX layers need direct local image elements without layout wrappers */

import type { CSSProperties } from "react";
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
  return (
    <div className={styles.lightningStage}>
      <i className={styles.lightningStormVeil} />
      <i className={styles.lightningCloud} />
      <span className={styles.lightningChargeArcs}>
        {Array.from({ length: 6 }, (_, index) => (
          <i key={index} style={{ "--charge-angle": `${index * 60}deg` } as CSSProperties} />
        ))}
      </span>
      <i className={styles.lightningSkyFlash} />
      <svg className={styles.lightningBolt} viewBox="0 0 460 540" preserveAspectRatio="none">
        <g className={styles.lightningBoltGlow}>
          <path pathLength="100" d="M244 0 L216 36 L238 67 L198 97 L226 126 L178 163 L205 194 L157 231 L193 257 L144 294 L174 324 L127 361 L164 391 L115 429 L151 459 L102 497 L126 535" />
          <path pathLength="100" d="M198 97 L164 101 L145 122 L96 151" />
          <path pathLength="100" d="M157 231 L201 228 L232 247 L294 276" />
          <path pathLength="100" d="M127 361 L90 367 L61 390 L22 409" />
          <path pathLength="100" d="M115 429 L166 429 L204 450 L274 463" />
        </g>
        <g className={styles.lightningBoltCore}>
          <path pathLength="100" d="M244 0 L216 36 L238 67 L198 97 L226 126 L178 163 L205 194 L157 231 L193 257 L144 294 L174 324 L127 361 L164 391 L115 429 L151 459 L102 497 L126 535" />
          <path pathLength="100" d="M198 97 L164 101 L145 122 L96 151" />
          <path pathLength="100" d="M157 231 L201 228 L232 247 L294 276" />
          <path pathLength="100" d="M127 361 L90 367 L61 390 L22 409" />
          <path pathLength="100" d="M115 429 L166 429 L204 450 L274 463" />
        </g>
      </svg>
      <span className={styles.lightningBranches}>
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} style={{ "--branch-index": index } as CSSProperties} />
        ))}
      </span>
      <span className={styles.lightningAfterbolts}>
        {Array.from({ length: 3 }, (_, index) => (
          <i key={index} style={{
            "--afterbolt-x": `${(index - 1) * 82 - 4}px`,
            "--afterbolt-angle": `${(index - 1) * 17}deg`,
            "--afterbolt-delay": `${590 + index * 92}ms`,
          } as CSSProperties} />
        ))}
      </span>
      <img className={styles.lightningImpactTexture} src="/assets/vfx/special/special-lightning-impact-v3-alpha.webp" alt="" draggable={false} />
      <i className={styles.lightningImpact} />
      <i className={styles.lightningGroundArc} />
      <span className={styles.lightningSparks}>
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{
            "--spark-angle": `${index * 30}deg`,
            "--spark-distance": `${62 + index % 3 * 18}px`,
            "--spark-delay": `${180 + index % 4 * 34}ms`,
          } as CSSProperties} />
        ))}
      </span>
    </div>
  );
}

function TornadoEffect() {
  return (
    <div className={styles.tornadoStage}>
      <i className={styles.tornadoPressure} />
      <span className={styles.tornadoInflow}>
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{
            "--inflow-angle": `${index * 22.5}deg`,
            "--inflow-delay": `${index % 5 * 34}ms`,
            "--inflow-length": `${92 + index % 4 * 28}px`,
          } as CSSProperties} />
        ))}
      </span>
      <i className={styles.tornadoSeed} />
      <i className={styles.tornadoDust} />
      <i className={styles.tornadoCore} />
      <img className={styles.tornadoTexture} src="/assets/vfx/special/special-tornado-funnel-v3-alpha.webp" alt="" draggable={false} />
      <span className={styles.tornadoFilaments}>
        {Array.from({ length: 28 }, (_, index) => (
          <i key={index} style={{
            "--filament-x": `${(index % 7 - 3) * 24}px`,
            "--filament-height": `${118 + index % 6 * 43}px`,
            "--filament-width": `${82 + index % 5 * 28}px`,
            "--filament-delay": `${380 + index % 9 * 86}ms`,
            "--filament-duration": `${720 + index % 4 * 150}ms`,
          } as CSSProperties} />
        ))}
      </span>
      <span className={styles.tornadoBands}>
        {Array.from({ length: 9 }, (_, index) => (
          <i key={index} style={{ "--band-index": index } as CSSProperties} />
        ))}
      </span>
      <span className={styles.tornadoDebris}>
        {Array.from({ length: 22 }, (_, index) => (
          <i key={index} style={{
            "--debris-angle": `${index * 25.72}deg`,
            "--debris-radius": `${76 + index % 5 * 25}px`,
            "--debris-height": `${40 + index % 4 * 58}px`,
            "--debris-delay": `${index * -97}ms`,
          } as CSSProperties} />
        ))}
      </span>
      <i className={styles.tornadoGroundSpiral} />
    </div>
  );
}

function MeteorEffect() {
  return (
    <div className={styles.meteorStage}>
      <span className={styles.meteorFlight}>
        <i className={styles.meteorBowShock} />
        <i className={styles.meteorTrailWide} />
        <i className={styles.meteorTrailHot} />
        <i className={styles.meteorRock}><b /><em /></i>
      </span>
      <i className={styles.meteorGroundWarning} />
      <img className={styles.meteorImpactTexture} src="/assets/vfx/special/special-meteor-impact-v3-alpha.webp" alt="" draggable={false} />
      <i className={styles.meteorImpactFlash} />
      <span className={styles.meteorBlastRays}>
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{ "--blast-angle": `${index * 30}deg` } as CSSProperties} />
        ))}
      </span>
      <i className={styles.meteorShockwave} />
      <i className={styles.meteorCrater} />
      <span className={styles.meteorFragments}>
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{
            "--fragment-angle": `${index * 22.5}deg`,
            "--fragment-distance": `${92 + index % 4 * 31}px`,
            "--fragment-delay": `${980 + index % 3 * 24}ms`,
          } as CSSProperties} />
        ))}
      </span>
      <span className={styles.meteorSmoke}>
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} style={{
            "--smoke-x": `${(index - 3) * 34}px`,
            "--smoke-y": `${-26 - Math.abs(index - 3) * 9}px`,
            "--smoke-delay": `${1_020 + index * 42}ms`,
          } as CSSProperties} />
        ))}
      </span>
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
