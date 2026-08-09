"use client";

import { useId, type CSSProperties } from "react";
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

type WeaponShape = "sword" | "saber" | "twin" | "breaker" | "greatsword";

type WeaponPalette = {
  shape: WeaponShape;
  blade: string;
  edge: string;
  metal: string;
  guard: string;
  grip: string;
  glow: string;
};

const WEAPON_PALETTES: WeaponPalette[] = [
  { shape: "sword", blade: "#d8d1bd", edge: "#fff7d8", metal: "#776f62", guard: "#aa7b39", grip: "#5a3826", glow: "#d7ae68" },
  { shape: "saber", blade: "#f0cc72", edge: "#fff1a9", metal: "#8f672a", guard: "#bc7138", grip: "#513225", glow: "#f1b642" },
  { shape: "twin", blade: "#88d7e6", edge: "#e9fcff", metal: "#416c7a", guard: "#d7ad55", grip: "#313f48", glow: "#65e3ff" },
  { shape: "breaker", blade: "#a991df", edge: "#f0e5ff", metal: "#4f426d", guard: "#d0a957", grip: "#312a43", glow: "#bd8aff" },
  { shape: "sword", blade: "#8ddbea", edge: "#fff7b6", metal: "#426f88", guard: "#e0b958", grip: "#364d5b", glow: "#8cecff" },
  { shape: "saber", blade: "#be87e9", edge: "#f2d6ff", metal: "#5b4778", guard: "#e1bd68", grip: "#322742", glow: "#d590ff" },
  { shape: "breaker", blade: "#63c8f5", edge: "#e9fbff", metal: "#32607c", guard: "#c78b48", grip: "#283744", glow: "#4ec7ff" },
  { shape: "greatsword", blade: "#fff1a1", edge: "#ffffff", metal: "#b68b39", guard: "#72d4e4", grip: "#5a4329", glow: "#ffe36f" },
  { shape: "saber", blade: "#e44b67", edge: "#ffc1cf", metal: "#76243b", guard: "#d8a45b", grip: "#3f202a", glow: "#ff416c" },
  { shape: "twin", blade: "#73e6f3", edge: "#f5ffff", metal: "#336d85", guard: "#aac6d0", grip: "#263947", glow: "#53eaff" },
  { shape: "greatsword", blade: "#fff5bd", edge: "#ffffff", metal: "#b89548", guard: "#ead073", grip: "#5e4930", glow: "#fff09a" },
  { shape: "breaker", blade: "#5b3e83", edge: "#d7acff", metal: "#241b36", guard: "#9d75c7", grip: "#1c1627", glow: "#8e55df" },
  { shape: "sword", blade: "#87ebf2", edge: "#f7ffff", metal: "#725ca0", guard: "#cfb7f2", grip: "#322c54", glow: "#84f3ff" },
  { shape: "greatsword", blade: "#b8ed88", edge: "#efffcf", metal: "#527348", guard: "#cda957", grip: "#493a25", glow: "#a8ff79" },
  { shape: "greatsword", blade: "#fff0a0", edge: "#ffffff", metal: "#6abac8", guard: "#e5b94f", grip: "#513c2a", glow: "#ffe66f" },
];

type WeaponArtProps = {
  tier: number;
  glyph: string;
  label: string;
  className?: string;
  locked?: boolean;
};

function StandardBlade({ gradientId }: { gradientId: string }) {
  return <>
    <path className={styles.blade} d="M90 20 110 150 90 181 70 150Z" fill={`url(#${gradientId})`} />
    <path className={styles.edge} d="M90 28 99 148 90 169 86 143Z" />
  </>;
}

function SaberBlade({ gradientId }: { gradientId: string }) {
  return <>
    <path className={styles.blade} d="M103 21c32 52 25 105-12 157l-23-17c31-37 45-81 17-125Z" fill={`url(#${gradientId})`} />
    <path className={styles.edge} d="M102 28c22 48 15 94-20 139l8 5c33-48 39-96 12-144Z" />
  </>;
}

function BreakerBlade({ gradientId }: { gradientId: string }) {
  return <>
    <path className={styles.blade} d="M90 17 111 53 103 72 116 94 106 113 117 137 91 181 67 147 76 124 65 105 77 84 68 61Z" fill={`url(#${gradientId})`} />
    <path className={styles.edge} d="m90 27 9 30-8 18 10 21-8 18 9 23-12 31-4-51Z" />
  </>;
}

function GreatswordBlade({ gradientId }: { gradientId: string }) {
  return <>
    <path className={styles.blade} d="M90 12 122 49 112 151 90 183 68 151 58 49Z" fill={`url(#${gradientId})`} />
    <path className={styles.edge} d="m90 22 14 34-7 92-7 20-5-112Z" />
  </>;
}

function SingleWeapon({ palette, gradientId, tier, glyph }: { palette: WeaponPalette; gradientId: string; tier: number; glyph: string }) {
  const blade = palette.shape === "saber"
    ? <SaberBlade gradientId={gradientId} />
    : palette.shape === "breaker"
      ? <BreakerBlade gradientId={gradientId} />
      : palette.shape === "greatsword"
        ? <GreatswordBlade gradientId={gradientId} />
        : <StandardBlade gradientId={gradientId} />;

  return <g>
    {blade}
    <path className={styles.guard} d={palette.shape === "greatsword" ? "M45 167 73 158h34l28 9-17 18-28-9-28 9Z" : "M55 165 75 157h30l20 8-11 14-24-8-24 8Z"} />
    <path className={styles.handle} d="M80 174h20l-2 55-8 15-8-15Z" />
    <path className={styles.pommel} d="m90 229 13 16-13 11-13-11Z" />
    <circle className={styles.gem} cx="90" cy="168" r={tier >= 10 ? 11 : 8} />
    {tier >= 3 && <text className={styles.rune} x="90" y="119">{glyph}</text>}
  </g>;
}

export function WeaponArt({ tier, glyph, label, className = "", locked = false }: WeaponArtProps) {
  const safeTier = Math.min(WEAPON_PALETTES.length - 1, Math.max(0, tier));
  const palette = WEAPON_PALETTES[safeTier];
  const uniqueId = useId().replace(/:/g, "");
  const gradientId = `weapon-gradient-${uniqueId}`;
  const style = {
    "--weapon-blade": palette.blade,
    "--weapon-edge": palette.edge,
    "--weapon-metal": palette.metal,
    "--weapon-guard": palette.guard,
    "--weapon-grip": palette.grip,
    "--weapon-glow": palette.glow,
  } as CSSProperties;

  return <svg className={`${styles.art} ${locked ? styles.locked : ""} ${className}`} style={style} viewBox="0 0 180 260" role="img" aria-label={label}>
    <title>{label}</title>
    <defs>
      <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={palette.edge} />
        <stop offset=".42" stopColor={palette.blade} />
        <stop offset="1" stopColor={palette.metal} />
      </linearGradient>
    </defs>
    <g className={styles.aura}>
      <ellipse cx="90" cy="128" rx={tier >= 10 ? 61 : 48} ry={tier >= 10 ? 108 : 91} />
      {tier >= 4 && <path d="M32 151c26-41 89-62 118-17M46 91c32 37 81 44 103 10" />}
    </g>
    <g className={styles.weapon}>
      {palette.shape === "twin" ? <>
        <g transform="translate(-23 3) rotate(-12 90 170)"><SingleWeapon palette={{ ...palette, shape: "sword" }} gradientId={gradientId} tier={tier} glyph={glyph} /></g>
        <g transform="translate(23 3) rotate(12 90 170)"><SingleWeapon palette={{ ...palette, shape: "sword" }} gradientId={gradientId} tier={tier} glyph={glyph} /></g>
      </> : <SingleWeapon palette={palette} gradientId={gradientId} tier={tier} glyph={glyph} />}
    </g>
    {tier >= 7 && <g className={styles.motes}>{Array.from({ length: 6 }, (_, index) => <circle key={index} cx={40 + index * 20} cy={53 + index % 2 * 112} r={index % 2 ? 3 : 2} />)}</g>}
  </svg>;
}

type WeaponCursorProps = {
  weapon: WeaponView;
  point: { x: number; y: number; visible: boolean };
};

export function WeaponCursor({ weapon, point }: WeaponCursorProps) {
  return <span
    className={`${styles.cursor} ${point.visible ? styles.cursorVisible : ""} ${styles[`cursorTier${Math.min(4, Math.floor(weapon.tier / 3))}`] ?? ""}`}
    style={{ left: `${point.x}%`, top: `${point.y}%` }}
    aria-hidden="true"
  >
    <i className={styles.cursorRing} />
    <WeaponArt tier={weapon.tier} glyph={weapon.glyph} label={weapon.weaponName} className={styles.cursorWeapon} />
    <span className={styles.cursorLabel}><b>+{weapon.tier}</b>{weapon.weaponName}</span>
  </span>;
}
