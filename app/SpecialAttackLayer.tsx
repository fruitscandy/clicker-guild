"use client";

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

const LIGHTNING_SEGMENTS = [
  { x: -23, y: -184, length: 86, angle: 16, width: 9 },
  { x: -12, y: -106, length: 72, angle: -21, width: 8 },
  { x: -24, y: -40, length: 70, angle: 18, width: 7 },
  { x: -10, y: 22, length: 58, angle: -13, width: 6 },
];

function LightningEffect() {
  return (
    <div className={styles.lightningStage}>
      <i className={styles.lightningCloud} />
      <i className={styles.lightningSkyFlash} />
      <span className={styles.lightningBolt}>
        {LIGHTNING_SEGMENTS.map((segment, index) => (
          <i
            key={index}
            style={{
              "--bolt-x": `${segment.x}px`,
              "--bolt-y": `${segment.y}px`,
              "--bolt-length": `${segment.length}px`,
              "--bolt-angle": `${segment.angle}deg`,
              "--bolt-width": `${segment.width}px`,
              "--bolt-index": index,
            } as CSSProperties}
          />
        ))}
      </span>
      <span className={styles.lightningBranches}>
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} style={{ "--branch-index": index } as CSSProperties} />
        ))}
      </span>
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
      <i className={styles.tornadoDust} />
      <i className={styles.tornadoCore} />
      <span className={styles.tornadoBands}>
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} style={{ "--band-index": index } as CSSProperties} />
        ))}
      </span>
      <span className={styles.tornadoDebris}>
        {Array.from({ length: 14 }, (_, index) => (
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
        <i className={styles.meteorTrailWide} />
        <i className={styles.meteorTrailHot} />
        <i className={styles.meteorRock}><b /><em /></i>
      </span>
      <i className={styles.meteorGroundWarning} />
      <i className={styles.meteorImpactFlash} />
      <i className={styles.meteorShockwave} />
      <i className={styles.meteorCrater} />
      <span className={styles.meteorFragments}>
        {Array.from({ length: 16 }, (_, index) => (
          <i key={index} style={{
            "--fragment-angle": `${index * 22.5}deg`,
            "--fragment-distance": `${92 + index % 4 * 31}px`,
            "--fragment-delay": `${720 + index % 3 * 24}ms`,
          } as CSSProperties} />
        ))}
      </span>
      <span className={styles.meteorSmoke}>
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} style={{
            "--smoke-x": `${(index - 3) * 34}px`,
            "--smoke-y": `${-26 - Math.abs(index - 3) * 9}px`,
            "--smoke-delay": `${760 + index * 42}ms`,
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
