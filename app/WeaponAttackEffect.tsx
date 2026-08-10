"use client";

import type { CSSProperties } from "react";
import styles from "./WeaponAttackEffect.module.css";

export type WeaponAttackEffectState = {
  id: number;
  tier: number;
  variant: number;
  damage: number;
  critical: boolean;
  shockwave: boolean;
  hitCount: number;
  x: number;
  y: number;
  radius: number;
};

type WeaponEffectMotif =
  | "motifTraining"
  | "motifCrescent"
  | "motifCrosscut"
  | "motifRuneBreak"
  | "motifSkyArray"
  | "motifNebula"
  | "motifDragonVein"
  | "motifCelestial"
  | "motifBloodMoon"
  | "motifStormTwin"
  | "motifRadiant"
  | "motifAbyss"
  | "motifTimeCollapse"
  | "motifWorldTree"
  | "motifMyriad";

type WeaponEffectDefinition = {
  key: string;
  motif: WeaponEffectMotif;
  primary: string;
  secondary: string;
  shadow: string;
  rotation: number;
  fragments: number;
  dust: number;
  impactScale: number;
  impactRotation: number;
  scarRotation: number;
};

const WEAPON_EFFECTS: WeaponEffectDefinition[] = [
  { key: "training-strike", motif: "motifTraining", primary: "#d8c9ad", secondary: "#875e3a", shadow: "#30231b", rotation: -32, fragments: 4, dust: 3, impactScale: .7, impactRotation: 12, scarRotation: 8 },
  { key: "crescent-slash", motif: "motifCrescent", primary: "#e4b967", secondary: "#8b5133", shadow: "#342019", rotation: -21, fragments: 5, dust: 3, impactScale: .76, impactRotation: -8, scarRotation: -12 },
  { key: "cross-cut", motif: "motifCrosscut", primary: "#92c8d1", secondary: "#4b6873", shadow: "#1d2d36", rotation: -36, fragments: 6, dust: 3, impactScale: .7, impactRotation: 22, scarRotation: 18 },
  { key: "weakpoint-break", motif: "motifRuneBreak", primary: "#a68bca", secondary: "#58446e", shadow: "#251d34", rotation: -12, fragments: 7, dust: 4, impactScale: .86, impactRotation: 5, scarRotation: -4 },
  { key: "sky-sword-array", motif: "motifSkyArray", primary: "#8bc6cd", secondary: "#b79558", shadow: "#253940", rotation: -42, fragments: 5, dust: 3, impactScale: .72, impactRotation: -16, scarRotation: 6 },
  { key: "nebula-dance", motif: "motifNebula", primary: "#aa78c3", secondary: "#564769", shadow: "#261e34", rotation: -24, fragments: 4, dust: 5, impactScale: .66, impactRotation: 28, scarRotation: -22 },
  { key: "dragon-vein-break", motif: "motifDragonVein", primary: "#68adbf", secondary: "#91623d", shadow: "#1d3340", rotation: -8, fragments: 8, dust: 4, impactScale: .92, impactRotation: 8, scarRotation: 15 },
  { key: "celestial-ruin", motif: "motifCelestial", primary: "#e4d28c", secondary: "#99733a", shadow: "#362b19", rotation: -45, fragments: 6, dust: 4, impactScale: .84, impactRotation: -12, scarRotation: 0 },
  { key: "blood-moon-eclipse", motif: "motifBloodMoon", primary: "#c64e59", secondary: "#652832", shadow: "#32181e", rotation: -29, fragments: 5, dust: 3, impactScale: .74, impactRotation: 18, scarRotation: -18 },
  { key: "storm-twin-dance", motif: "motifStormTwin", primary: "#7bc4cc", secondary: "#4b6877", shadow: "#182d38", rotation: -38, fragments: 7, dust: 3, impactScale: .7, impactRotation: -24, scarRotation: 20 },
  { key: "radiant-judgment", motif: "motifRadiant", primary: "#e6d398", secondary: "#9e8045", shadow: "#382d1a", rotation: -5, fragments: 8, dust: 5, impactScale: 1, impactRotation: 0, scarRotation: 4 },
  { key: "abyss-sever", motif: "motifAbyss", primary: "#70478f", secondary: "#2b2038", shadow: "#17101f", rotation: -26, fragments: 6, dust: 4, impactScale: .78, impactRotation: 32, scarRotation: -9 },
  { key: "time-collapse", motif: "motifTimeCollapse", primary: "#8acbd0", secondary: "#6e5c88", shadow: "#20203c", rotation: -16, fragments: 5, dust: 3, impactScale: .68, impactRotation: -18, scarRotation: 13 },
  { key: "world-tree-wave", motif: "motifWorldTree", primary: "#91bd72", secondary: "#596a3e", shadow: "#21301d", rotation: -34, fragments: 7, dust: 5, impactScale: .9, impactRotation: 14, scarRotation: -15 },
  { key: "myriad-blades-one", motif: "motifMyriad", primary: "#e8d58f", secondary: "#5c929d", shadow: "#302719", rotation: -20, fragments: 9, dust: 4, impactScale: .82, impactRotation: -6, scarRotation: 10 },
];

const FRAGMENTS = Array.from({ length: 9 }, (_, index) => index);
const DUST = Array.from({ length: 5 }, (_, index) => index);

type WeaponAttackEffectProps = {
  effect: WeaponAttackEffectState;
  glyph: string;
  formatNumber: (value: number) => string;
};

export function WeaponAttackEffect({ effect, glyph, formatNumber }: WeaponAttackEffectProps) {
  const tier = Math.min(WEAPON_EFFECTS.length - 1, Math.max(0, Math.floor(effect.tier)));
  const weaponEffect = WEAPON_EFFECTS[tier];
  const variantRotation = (effect.variant % 4) * 4;
  const style = {
    left: `${effect.x}%`,
    top: `${effect.y}%`,
    "--effect-primary": weaponEffect.primary,
    "--effect-secondary": weaponEffect.secondary,
    "--effect-shadow": weaponEffect.shadow,
    "--effect-rotation": `${weaponEffect.rotation + variantRotation}deg`,
    "--effect-counter-rotation": `${-weaponEffect.rotation - variantRotation}deg`,
    "--impact-scale": weaponEffect.impactScale,
    "--impact-rotation": `${weaponEffect.impactRotation}deg`,
    "--scar-rotation": `${weaponEffect.scarRotation}deg`,
  } as CSSProperties;

  return <>
    <span
      className={`${styles.range} ${effect.hitCount ? "" : styles.rangeMiss} ${effect.shockwave ? styles.rangeShockwave : ""}`}
      style={{ ...style, width: `${effect.radius * 2}%` }}
      aria-hidden="true"
    ><i /></span>
    <span
      className={`${styles.effect} ${effect.critical ? styles.critical : ""}`}
      style={style}
      data-weapon-tier={tier}
      data-effect-motif={weaponEffect.key}
      data-effect-id={effect.id}
      aria-hidden="true"
    >
      {effect.hitCount > 0 && <>
        <i className={styles.groundScar} />
        <span className={`${styles.signature} ${styles[weaponEffect.motif]}`}>
          <i /><i /><i /><i />
          <b>{glyph}</b>
        </span>
        <span className={styles.impact}><i /></span>
        <span className={styles.fragments}>
          {FRAGMENTS.slice(0, weaponEffect.fragments).map((index) => <i key={index} style={{
            "--fragment-angle": `${index * 47 + effect.variant * 11}deg`,
            "--fragment-distance": `${54 + (index % 3) * 16}px`,
            "--fragment-delay": `${index * 17}ms`,
          } as CSSProperties} />)}
        </span>
        <span className={styles.dust}>
          {DUST.slice(0, weaponEffect.dust).map((index) => <i key={index} style={{
            "--dust-x": `${(index - 2) * 32}px`,
            "--dust-delay": `${index * 24}ms`,
          } as CSSProperties} />)}
        </span>
        {effect.critical && <i className={styles.criticalNotch} />}
        {effect.shockwave && <span className={styles.shockwavePulse}><i /><i /></span>}
      </>}
      {effect.hitCount > 0 && <strong className={styles.damage}>{`−${formatNumber(effect.damage)}`}</strong>}
    </span>
  </>;
}
