"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./WeaponArt.module.css";

export type WeaponView = {
  key: string;
  weaponName: string;
  title: string;
  subtitle: string;
  glyph: string;
  tier: number;
  visualHits: number;
  variants: number;
  duration: number;
  cost: number;
  damageScale: number;
};

type WeaponAsset = {
  source: string;
  primary: string;
  secondary: string;
  glow: string;
  shadow: string;
  scale?: number;
};

const WEAPON_ASSETS: WeaponAsset[] = [
  { source: "/assets/weapons/tier-01-training-longsword.webp", primary: "#d8c9ad", secondary: "#875e3a", glow: "#d79e53", shadow: "#30231b", scale: .92 },
  { source: "/assets/weapons/tier-02-crescent-saber.webp", primary: "#f0c76e", secondary: "#9e5833", glow: "#f3ad3e", shadow: "#342019" },
  { source: "/assets/weapons/tier-03-twin-blades.webp", primary: "#9fdce8", secondary: "#496e7d", glow: "#62d9f2", shadow: "#1d2d36", scale: .9 },
  { source: "/assets/weapons/tier-04-rune-breaker.webp", primary: "#b9a0e7", secondary: "#644b80", glow: "#b97aff", shadow: "#251d34" },
  { source: "/assets/weapons/tier-05-sky-sword.webp", primary: "#9cdde5", secondary: "#e1ba61", glow: "#7ae5ee", shadow: "#253940" },
  { source: "/assets/weapons/tier-06-nebula-saber.webp", primary: "#c08ade", secondary: "#605176", glow: "#d188ff", shadow: "#261e34" },
  { source: "/assets/weapons/tier-07-dragon-vein.webp", primary: "#70c9df", secondary: "#a97042", glow: "#53c7ef", shadow: "#1d3340" },
  { source: "/assets/weapons/tier-08-celestial-sword.webp", primary: "#fff0a5", secondary: "#b6873b", glow: "#ffe070", shadow: "#362b19" },
  { source: "/assets/weapons/tier-09-blood-moon.webp", primary: "#e85a67", secondary: "#7c2d3a", glow: "#ff5368", shadow: "#32181e" },
  { source: "/assets/weapons/tier-10-storm-twin-blades.webp", primary: "#8ce6ef", secondary: "#537488", glow: "#59e7f4", shadow: "#182d38", scale: .9 },
  { source: "/assets/weapons/tier-11-radiant-greatsword.webp", primary: "#fff0ae", secondary: "#c49b4e", glow: "#ffe78e", shadow: "#382d1a", scale: .95 },
  { source: "/assets/weapons/tier-12-abyss-sword.webp", primary: "#8150a5", secondary: "#30233f", glow: "#a95ce1", shadow: "#17101f" },
  { source: "/assets/weapons/tier-13-time-cutter.webp", primary: "#9debf0", secondary: "#8167a5", glow: "#83eff8", shadow: "#20203c" },
  { source: "/assets/weapons/tier-14-world-tree.webp", primary: "#b3e88b", secondary: "#667946", glow: "#a8f779", shadow: "#21301d", scale: .96 },
  { source: "/assets/weapons/tier-15-guildmaster-divine.webp", primary: "#fff0a4", secondary: "#65aebb", glow: "#ffe278", shadow: "#302719", scale: .96 },
];

type WeaponArtProps = {
  tier: number;
  glyph: string;
  label: string;
  className?: string;
  locked?: boolean;
};

export function WeaponArt({ tier, glyph, label, className = "", locked = false }: WeaponArtProps) {
  const safeTier = Math.min(WEAPON_ASSETS.length - 1, Math.max(0, Math.floor(tier)));
  const asset = WEAPON_ASSETS[safeTier];
  const style = {
    "--weapon-primary": asset.primary,
    "--weapon-secondary": asset.secondary,
    "--weapon-glow": asset.glow,
    "--weapon-shadow": asset.shadow,
    "--weapon-image-scale": asset.scale ?? 1,
  } as CSSProperties;

  return <span
    className={`${styles.art} ${styles[`artTier${safeTier}`] ?? ""} ${locked ? styles.locked : ""} ${className}`}
    style={style}
    data-weapon-tier={safeTier}
    data-weapon-glyph={glyph}
    role="img"
    aria-label={label}
  >
    <i className={styles.aura} aria-hidden="true" />
    <Image
      className={styles.weaponImage}
      src={asset.source}
      width={512}
      height={768}
      sizes="(max-width: 760px) 24vw, 160px"
      alt=""
      draggable={false}
      unoptimized
    />
    <i className={styles.forgeGlint} aria-hidden="true" />
  </span>;
}

type WeaponCursorProps = {
  weapon: WeaponView;
  point: { x: number; y: number; visible: boolean };
};

export function WeaponCursor({ weapon, point }: WeaponCursorProps) {
  const safeTier = Math.min(WEAPON_ASSETS.length - 1, Math.max(0, Math.floor(weapon.tier)));
  const asset = WEAPON_ASSETS[safeTier];
  const cursorStyle = {
    left: `${point.x}%`,
    top: `${point.y}%`,
    "--weapon-glow": asset.glow,
    "--weapon-shadow": asset.shadow,
  } as CSSProperties;

  return <span
    className={`${styles.cursor} ${point.visible ? styles.cursorVisible : ""} ${styles[`cursorTier${Math.min(4, Math.floor(safeTier / 3))}`] ?? ""}`}
    style={cursorStyle}
    data-weapon-tier={safeTier}
    aria-hidden="true"
  >
    <i className={styles.cursorRing} />
    <WeaponArt tier={safeTier} glyph={weapon.glyph} label={weapon.weaponName} className={styles.cursorWeapon} />
    <span className={styles.cursorLabel}><b>+{safeTier}</b>{weapon.weaponName}</span>
  </span>;
}
