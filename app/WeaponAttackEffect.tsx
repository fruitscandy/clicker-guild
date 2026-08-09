"use client";

import type { CSSProperties } from "react";
import styles from "./WeaponAttackEffect.module.css";

export type WeaponAttackEffectState = {
  id: number;
  tier: number;
  variant: number;
  damage: number;
  critical: boolean;
  combo: boolean;
  shockwave: boolean;
  momentum: number;
  executionCount: number;
  hitCount: number;
  x: number;
  y: number;
  radius: number;
};

type EffectPalette = {
  primary: string;
  secondary: string;
  shadow: string;
  rotation: number;
};

const EFFECT_PALETTES: EffectPalette[] = [
  { primary: "#d8c9ad", secondary: "#875e3a", shadow: "#30231b", rotation: -32 },
  { primary: "#e4b967", secondary: "#8b5133", shadow: "#342019", rotation: -21 },
  { primary: "#92c8d1", secondary: "#4b6873", shadow: "#1d2d36", rotation: -36 },
  { primary: "#a68bca", secondary: "#58446e", shadow: "#251d34", rotation: -12 },
  { primary: "#8bc6cd", secondary: "#b79558", shadow: "#253940", rotation: -42 },
  { primary: "#aa78c3", secondary: "#564769", shadow: "#261e34", rotation: -24 },
  { primary: "#68adbf", secondary: "#91623d", shadow: "#1d3340", rotation: -8 },
  { primary: "#e4d28c", secondary: "#99733a", shadow: "#362b19", rotation: -45 },
  { primary: "#c64e59", secondary: "#652832", shadow: "#32181e", rotation: -29 },
  { primary: "#7bc4cc", secondary: "#4b6877", shadow: "#182d38", rotation: -38 },
  { primary: "#e6d398", secondary: "#9e8045", shadow: "#382d1a", rotation: -5 },
  { primary: "#70478f", secondary: "#2b2038", shadow: "#17101f", rotation: -26 },
  { primary: "#8acbd0", secondary: "#6e5c88", shadow: "#20203c", rotation: -16 },
  { primary: "#91bd72", secondary: "#596a3e", shadow: "#21301d", rotation: -34 },
  { primary: "#e8d58f", secondary: "#5c929d", shadow: "#302719", rotation: -20 },
];

const FRAGMENTS = Array.from({ length: 9 }, (_, index) => index);
const DUST = Array.from({ length: 5 }, (_, index) => index);

type WeaponAttackEffectProps = {
  effect: WeaponAttackEffectState;
  glyph: string;
  formatNumber: (value: number) => string;
};

export function WeaponAttackEffect({ effect, glyph, formatNumber }: WeaponAttackEffectProps) {
  const tier = Math.min(EFFECT_PALETTES.length - 1, Math.max(0, Math.floor(effect.tier)));
  const palette = EFFECT_PALETTES[tier];
  const rotation = palette.rotation + (effect.variant % 4) * 7;
  const grade = tier >= 13 ? "legendary" : tier >= 10 ? "masterwork" : tier >= 5 ? "forged" : "field";
  const showSecondCut = effect.combo || tier === 2 || tier >= 7;
  const fragmentCount = Math.min(FRAGMENTS.length, 4 + Math.floor(tier / 3));
  const dustCount = Math.min(DUST.length, 3 + Math.floor(tier / 5));
  const style = {
    left: `${effect.x}%`,
    top: `${effect.y}%`,
    "--effect-primary": palette.primary,
    "--effect-secondary": palette.secondary,
    "--effect-shadow": palette.shadow,
    "--effect-rotation": `${rotation}deg`,
    "--effect-counter-rotation": `${-rotation}deg`,
  } as CSSProperties;

  return <>
    <span
      className={`${styles.range} ${effect.hitCount ? "" : styles.rangeMiss} ${effect.shockwave ? styles.rangeShockwave : ""}`}
      style={{ ...style, width: `${effect.radius * 2}%` }}
      aria-hidden="true"
    >
      <i />
    </span>
    <span
      className={`${styles.effect} ${styles[`tier${tier}`]} ${effect.critical ? styles.critical : ""} ${effect.executionCount ? styles.execution : ""} ${effect.momentum ? styles.momentum : ""}`}
      style={style}
      data-weapon-tier={tier}
      data-effect-grade={grade}
      data-effect-id={effect.id}
      aria-hidden="true"
    >
      {effect.hitCount > 0 && <>
        <i className={styles.groundScar} />
        <i className={styles.slash} />
        {showSecondCut && <i className={styles.secondarySlash} />}
        {effect.momentum > 0 && <i className={styles.momentumEcho} />}
        <span className={styles.impact}><i /></span>
        <span className={styles.fragments}>
          {FRAGMENTS.slice(0, fragmentCount).map((index) => <i key={index} style={{
            "--fragment-angle": `${index * 51 + effect.variant * 9}deg`,
            "--fragment-distance": `${60 + (index % 3) * 17 + tier * 2}px`,
            "--fragment-delay": `${index * 17}ms`,
          } as CSSProperties} />)}
        </span>
        <span className={styles.dust}>
          {DUST.slice(0, dustCount).map((index) => <i key={index} style={{
            "--dust-x": `${(index - 2) * 34}px`,
            "--dust-delay": `${index * 24}ms`,
          } as CSSProperties} />)}
        </span>
        {tier >= 5 && <b className={styles.forgeStamp}>{glyph}</b>}
        {tier >= 10 && <i className={styles.masterworkCrest} />}
        {tier >= 13 && <i className={styles.legendaryArc} />}
        {effect.critical && <i className={styles.criticalNotch} />}
        {effect.executionCount > 0 && <i className={styles.executionCut} />}
        {effect.shockwave && <span className={styles.shockwavePulse}><i /><i /></span>}
      </>}
      {effect.hitCount > 0 && (effect.combo ? <span className={styles.comboDamage}>
        <strong>{`−${formatNumber(Math.ceil(effect.damage / 2))}`}</strong>
        <strong>{`−${formatNumber(Math.floor(effect.damage / 2))}`}</strong>
      </span> : <strong className={styles.damage}>{`−${formatNumber(effect.damage)}`}</strong>)}
    </span>
  </>;
}
