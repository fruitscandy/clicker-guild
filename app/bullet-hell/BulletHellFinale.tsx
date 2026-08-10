"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  playCombatProcSound,
  playExpeditionFailSound,
  playExpeditionStartSound,
  playMonsterHitSound,
  playStageClearSound,
  unlockBattleAudio,
} from "../battle-audio";
import { WeaponCursor, type WeaponView } from "../guild-hub/WeaponArt";
import {
  FINALE_BULLET_ASSETS,
  FINALE_GUILD_ATLAS,
  FINALE_VFX_ASSETS,
  finaleBulletAsset,
} from "./assets";
import {
  GLITCH_BOSS_BODY_RADIUS,
  GLITCH_BOSS_GLYPH_COUNT,
  glitchBossGlyphAt,
  traceGlitchBossBody,
  type GlitchBossGlyphTone,
} from "./boss-silhouette";
import {
  attackFinaleBoss,
  createFinaleWorld,
  deriveFinaleStats,
  FINALE_BOSS_ATTACKABLE_MS,
  FINALE_BOSS_CLICK_RADIUS,
  FINALE_BOSS_REVEAL_MS,
  FINALE_GUILD_SIZE,
  FINALE_HEIGHT,
  FINALE_WIDTH,
  finaleGuildMaskCells,
  forceFinaleMode,
  restartFinalePhaseTwo,
  updateFinaleWorld,
  type FinaleAttackEvent,
  type FinaleGuildMaskCell,
  type FinaleLoadout,
  type FinaleMode,
  type FinalePlayerHitEvent,
  type FinaleWorld,
} from "./engine";
import { PAGE_FRACTURE_PRELUDE_MS } from "./fracture-geometry";
import { mountPageFracture, type PageFractureController } from "./page-fracture";
import styles from "./BulletHellFinale.module.css";

const WHITEOUT_HOLD_MS = 1_550;
const ATTACK_IMPACT_LIFETIME_MS = 720;
const MAX_ATTACK_IMPACTS = 6;
const BOSS_HIT_FLASH_MS = 190;
const GUILD_MASK_GRID_SIZE = 24;
const GUILD_MASK_CELL_STEP = FINALE_GUILD_SIZE / GUILD_MASK_GRID_SIZE;
const FIELD_BACKGROUND = "/assets/fields/field-10-ancient-dragon-sanctuary-hq.webp";
const MOVEMENT_KEY_BY_CODE: Record<string, string> = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  ShiftLeft: "shift",
  ShiftRight: "shift",
};

const RENDER_SOURCES = [...new Set([
  ...FINALE_BULLET_ASSETS.map((asset) => asset.source),
  FINALE_GUILD_ATLAS.source,
  FIELD_BACKGROUND,
  ...Object.values(FINALE_VFX_ASSETS),
])];

type FinaleScene = "intro" | "running" | "paused" | "victory" | "defeat" | "departing";
type VirtualDirection = "up" | "down" | "left" | "right" | "focus";
type PlayerImpact = FinalePlayerHitEvent & { ageMs: number };
type AttackImpact = FinaleAttackEvent & { ageMs: number };
type WeaponCursorPoint = { x: number; y: number; visible: boolean };
type PageFracturePortal = {
  root: HTMLDivElement;
  shardHost: HTMLDivElement;
  keeperHost: HTMLDivElement;
  faultLines: HTMLDivElement;
  signalShear: HTMLDivElement;
  flash: HTMLDivElement;
};
type ActivePageFracture = {
  controller: PageFractureController;
  portal: PageFracturePortal;
  settled: boolean;
};

const GUILD_MASK_BOUNDARY_CACHE = new WeakMap<
  readonly FinaleGuildMaskCell[],
  readonly FinaleGuildMaskCell[]
>();

function guildMaskCellKey(x: number, y: number) {
  return `${Math.round(x * 1_000)}:${Math.round(y * 1_000)}`;
}

function guildMaskBoundaryCells(cells: readonly FinaleGuildMaskCell[]) {
  const cached = GUILD_MASK_BOUNDARY_CACHE.get(cells);
  if (cached) return cached;
  const occupied = new Set(cells.map((cell) => guildMaskCellKey(cell.x, cell.y)));
  const boundary = cells.filter((cell) => (
    !occupied.has(guildMaskCellKey(cell.x - GUILD_MASK_CELL_STEP, cell.y))
    || !occupied.has(guildMaskCellKey(cell.x + GUILD_MASK_CELL_STEP, cell.y))
    || !occupied.has(guildMaskCellKey(cell.x, cell.y - GUILD_MASK_CELL_STEP))
    || !occupied.has(guildMaskCellKey(cell.x, cell.y + GUILD_MASK_CELL_STEP))
  ));
  GUILD_MASK_BOUNDARY_CACHE.set(cells, boundary);
  return boundary;
}

function traceGuildMaskCells(context: CanvasRenderingContext2D, cells: readonly FinaleGuildMaskCell[]) {
  context.beginPath();
  cells.forEach((cell) => {
    context.moveTo(cell.x + cell.radius, cell.y);
    context.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
  });
}

type HudSnapshot = {
  playerHp: number;
  playerMaxHp: number;
  shield: number;
  bossHp: number;
  bossMaxHp: number;
  mode: FinaleMode;
  cycle: FinaleWorld["cycle"];
  cycleRemainingMs: number;
  patternName: string;
  bullets: number;
  score: number;
  grazes: number;
  clicksLanded: number;
  clicksMissed: number;
  elapsedMs: number;
  modeElapsedMs: number;
};

export type BulletHellFinaleProps = {
  loadout: FinaleLoadout;
  mode: "campaign" | "preview";
  presentation?: "standalone" | "embedded";
  cursorWeapon?: WeaponView;
  initialCursorPoint?: WeaponCursorPoint;
  seed?: number;
  onModeChange?: (mode: FinaleMode) => void;
  onDefeat?: () => void;
  onExit: () => void;
  onVictory: () => void;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(value: number) {
  const normalized = clamp(value, 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

const PAGE_FRACTURE_FAULT_ANGLES = [-171, -139, -103, -67, -31, 4, 39, 76, 116, 151] as const;

function createPageFracturePortal(): PageFracturePortal {
  const root = document.createElement("div");
  root.className = styles.pageFracturePortal;
  root.dataset.pageFracturePortal = "true";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("inert", "");
  root.inert = true;

  const shardHost = document.createElement("div");
  shardHost.className = styles.pageFractureShardHost;
  shardHost.dataset.pageFractureLayer = "shards";
  shardHost.setAttribute("aria-hidden", "true");
  shardHost.setAttribute("inert", "");
  shardHost.inert = true;

  const keeperHost = document.createElement("div");
  keeperHost.className = styles.pageFractureBossKeeper;
  keeperHost.dataset.pageFractureLayer = "boss-keeper";
  keeperHost.setAttribute("aria-hidden", "true");
  keeperHost.setAttribute("inert", "");
  keeperHost.inert = true;

  const faultLines = document.createElement("div");
  faultLines.className = styles.pageFractureFaultLines;
  faultLines.dataset.pageFractureLayer = "fault-lines";
  for (const angle of PAGE_FRACTURE_FAULT_ANGLES) {
    const line = document.createElement("i");
    line.style.rotate = `${angle}deg`;
    faultLines.append(line);
  }

  const signalShear = document.createElement("div");
  signalShear.className = styles.pageFractureSignalShear;
  signalShear.dataset.pageFractureLayer = "signal-shear";

  const flash = document.createElement("div");
  flash.className = styles.pageFractureFlash;
  flash.dataset.pageFractureLayer = "flash";

  root.append(shardHost, faultLines, signalShear, flash, keeperHost);
  document.body.append(root);
  return { root, shardHost, keeperHost, faultLines, signalShear, flash };
}

function updatePageFracturePortal(
  portal: PageFracturePortal,
  elapsedMs: number,
  durationMs: number,
  reducedMotion: boolean,
) {
  const elapsed = clamp(elapsedMs, 0, durationMs);
  const progress = clamp(elapsed / Math.max(1, durationMs), 0, 1);
  const charge = clamp(elapsed / PAGE_FRACTURE_PRELUDE_MS, 0, 1);
  const flight = clamp((elapsed - PAGE_FRACTURE_PRELUDE_MS) / Math.max(1, durationMs - PAGE_FRACTURE_PRELUDE_MS), 0, 1);
  const phase = elapsed < PAGE_FRACTURE_PRELUDE_MS ? "priming" : elapsed < durationMs ? "fracturing" : "complete";
  portal.root.dataset.pageFracturePhase = phase;
  portal.root.style.setProperty("--fracture-progress", String(progress));

  if (reducedMotion) {
    portal.faultLines.style.opacity = String(.34 * (1 - smoothstep((progress - .16) / .32)));
    portal.signalShear.style.opacity = "0";
    portal.flash.style.opacity = "0";
    return;
  }

  const faultOpacity = elapsed < PAGE_FRACTURE_PRELUDE_MS
    ? Math.sin(charge * Math.PI) * .92
    : (1 - smoothstep(flight)) * .8;
  const flashProgress = clamp(elapsed / 240, 0, 1);
  portal.faultLines.style.opacity = String(faultOpacity);
  portal.signalShear.style.opacity = String((1 - smoothstep(flight)) * Math.abs(Math.sin(progress * Math.PI * 9)) * .48);
  portal.signalShear.style.translate = `${Math.sin(progress * Math.PI * 13) * 9}px 0`;
  portal.flash.style.opacity = String(Math.sin(flashProgress * Math.PI) * .88);
}

function snapshotFromWorld(world: FinaleWorld): HudSnapshot {
  return {
    playerHp: world.player.hp,
    playerMaxHp: world.player.maxHp,
    shield: world.player.shield,
    bossHp: world.boss.hp,
    bossMaxHp: world.boss.maxHp,
    mode: world.mode,
    cycle: world.cycle,
    cycleRemainingMs: world.cycleRemainingMs,
    patternName: world.patternName,
    bullets: world.bullets.length,
    score: world.score,
    grazes: world.grazes,
    clicksLanded: world.clicksLanded,
    clicksMissed: world.clicksMissed,
    elapsedMs: world.elapsedMs,
    modeElapsedMs: world.modeElapsedMs,
  };
}

function finaleMusicForMode(mode: FinaleMode) {
  if (mode === "field") return "phase-one";
  if (mode === "collapse") return "collapse";
  if (mode === "bulletHell") return "phase-two";
  return mode;
}

function drawHexagon(context: CanvasRenderingContext2D, radius: number) {
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 3 * index - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function drawFieldBackground(context: CanvasRenderingContext2D, images: Map<string, HTMLImageElement>) {
  const background = images.get(FIELD_BACKGROUND);
  if (background?.complete && background.naturalWidth > 0) {
    const imageRatio = background.naturalWidth / background.naturalHeight;
    const arenaRatio = FINALE_WIDTH / FINALE_HEIGHT;
    const sourceWidth = imageRatio > arenaRatio ? background.naturalHeight * arenaRatio : background.naturalWidth;
    const sourceHeight = imageRatio > arenaRatio ? background.naturalHeight : background.naturalWidth / arenaRatio;
    context.drawImage(
      background,
      (background.naturalWidth - sourceWidth) / 2,
      (background.naturalHeight - sourceHeight) / 2,
      sourceWidth,
      sourceHeight,
      0,
      0,
      FINALE_WIDTH,
      FINALE_HEIGHT,
    );
  } else {
    const fallback = context.createLinearGradient(0, 0, 0, FINALE_HEIGHT);
    fallback.addColorStop(0, "#8899a4");
    fallback.addColorStop(.48, "#6b7565");
    fallback.addColorStop(1, "#29352c");
    context.fillStyle = fallback;
    context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
  }
  const shade = context.createLinearGradient(0, 0, 0, FINALE_HEIGHT);
  shade.addColorStop(0, "rgba(18,22,24,.16)");
  shade.addColorStop(.52, "rgba(20,18,14,.04)");
  shade.addColorStop(1, "rgba(9,12,10,.48)");
  context.fillStyle = shade;
  context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
}

function drawNullBackground(context: CanvasRenderingContext2D, world: FinaleWorld, reducedMotion: boolean) {
  const seconds = reducedMotion ? 0 : world.elapsedMs / 1_000;
  const gradient = context.createRadialGradient(FINALE_WIDTH / 2, 90, 24, FINALE_WIDTH / 2, FINALE_HEIGHT / 2, 680);
  gradient.addColorStop(0, world.mode === "destruction" ? "#31101f" : "#111d2b");
  gradient.addColorStop(.48, "#060a10");
  gradient.addColorStop(1, "#000000");
  context.fillStyle = gradient;
  context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);

  context.save();
  context.strokeStyle = "rgba(93,231,239,.16)";
  context.lineWidth = 1;
  const offset = seconds * 14 % 42;
  for (let x = -42 + offset; x <= FINALE_WIDTH + 42; x += 42) {
    context.beginPath();
    context.moveTo(FINALE_WIDTH / 2 + (x - FINALE_WIDTH / 2) * .2, 118);
    context.lineTo(x, FINALE_HEIGHT);
    context.stroke();
  }
  for (let y = 158; y <= FINALE_HEIGHT + 42; y += 42) {
    context.globalAlpha = .08 + (y / FINALE_HEIGHT) * .22;
    context.beginPath();
    context.moveTo(0, y + offset * .25);
    context.lineTo(FINALE_WIDTH, y + offset * .25);
    context.stroke();
  }
  context.restore();
}

const GLITCH_GLYPH_COLORS: Record<GlitchBossGlyphTone, string> = {
  white: "#f8fbff",
  cyan: "#38eeff",
  pink: "#ff3cab",
  violet: "#956fff",
};

function drawGlitchBossGlow(
  context: CanvasRenderingContext2D,
  seconds: number,
  opacity: number,
  opening: boolean,
  reducedMotion: boolean,
) {
  const rotation = reducedMotion ? 0 : seconds * (opening ? .31 : .18);
  const breath = reducedMotion ? 1 : .84 + Math.sin(seconds * 1.85) * .16;
  const glowRadius = GLITCH_BOSS_BODY_RADIUS - 12;
  const colors = opening
    ? ["rgba(255,241,177,.88)", "rgba(56,238,255,.8)", "rgba(255,60,171,.74)"]
    : ["rgba(56,238,255,.86)", "rgba(132,92,255,.8)", "rgba(255,60,171,.78)"];

  context.save();
  context.globalCompositeOperation = "screen";
  context.globalAlpha = opacity * breath * (opening ? 1 : .9);

  const ambient = context.createRadialGradient(0, 0, 48, 0, 0, opening ? 138 : 128);
  ambient.addColorStop(0, opening ? "rgba(255,235,153,.34)" : "rgba(109,74,255,.3)");
  ambient.addColorStop(.42, opening ? "rgba(255,60,171,.18)" : "rgba(255,60,171,.16)");
  ambient.addColorStop(.72, "rgba(56,238,255,.09)");
  ambient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = ambient;
  context.fillRect(-144, -144, 288, 288);

  context.rotate(rotation);
  for (let index = 0; index < colors.length; index += 1) {
    const angle = index * Math.PI * 2 / colors.length - .45;
    const centerX = Math.cos(angle) * glowRadius;
    const centerY = Math.sin(angle) * glowRadius;
    const glow = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, opening ? 62 : 56);
    glow.addColorStop(0, colors[index]);
    glow.addColorStop(.34, colors[index].replace(/\.[0-9]+\)$/, ".3)"));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = glow;
    context.fillRect(-144, -144, 288, 288);
  }
  context.restore();
}

function drawGlitchBossGlyphCluster(
  context: CanvasRenderingContext2D,
  elapsedMs: number,
  opacity: number,
  assembly: number,
  opening: boolean,
  hitStrength: number,
  reducedMotion: boolean,
) {
  const visualTime = reducedMotion ? 0 : elapsedMs;
  const glyphCount = Math.ceil(GLITCH_BOSS_GLYPH_COUNT * assembly);
  const frames = Array.from({ length: glyphCount }, (_, index) => (
    glitchBossGlyphAt(index, visualTime)
  )).sort((left, right) => left.size - right.size);

  context.save();
  traceGlitchBossBody(context, GLITCH_BOSS_BODY_RADIUS - 1.5);
  context.clip();
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const glyph of frames) {
    context.save();
    context.translate(glyph.x, glyph.y);
    context.rotate(glyph.rotation);
    context.font = `900 ${glyph.size.toFixed(2)}px ui-monospace, "Noto Sans KR", "Malgun Gothic", sans-serif`;
    const glyphOpacity = opacity * glyph.opacity * glyph.flicker;
    const baseColor = hitStrength > .68
      ? "#ffffff"
      : opening && glyph.tone === "white"
        ? "#fff8cf"
        : GLITCH_GLYPH_COLORS[glyph.tone];

    if (!reducedMotion && glyph.hot && Math.abs(glyph.rgbOffset) > .05) {
      const sliceHeight = Math.max(2, glyph.size * .28);
      context.save();
      context.beginPath();
      context.rect(-glyph.size * .72, -glyph.size * .46, glyph.size * 1.44, sliceHeight);
      context.clip();
      context.globalAlpha = glyphOpacity * .82;
      context.fillStyle = "#ff3cab";
      context.fillText(glyph.char, -glyph.rgbOffset, 0);
      context.restore();

      context.save();
      context.beginPath();
      context.rect(-glyph.size * .72, glyph.size * .08, glyph.size * 1.44, sliceHeight);
      context.clip();
      context.globalAlpha = glyphOpacity * .76;
      context.fillStyle = "#38eeff";
      context.fillText(glyph.char, glyph.rgbOffset, 0);
      context.restore();
    }

    context.globalAlpha = glyphOpacity;
    context.fillStyle = baseColor;
    context.fillText(glyph.char, 0, 0);
    context.restore();
  }
  context.restore();
}

function drawBossEntranceEnergy(context: CanvasRenderingContext2D, world: FinaleWorld, reducedMotion: boolean) {
  if (world.mode !== "field") return;
  const progress = clamp(world.modeElapsedMs / FINALE_BOSS_REVEAL_MS, 0, 1);
  if (progress >= 1) return;
  const energy = Math.sin(progress * Math.PI);
  const converge = smoothstep((progress - .12) / .68);
  const entranceConverge = reducedMotion ? 1 : converge;
  const { x, y } = world.boss;

  context.save();
  context.fillStyle = `rgba(3,1,10,${energy * .14})`;
  context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
  context.translate(x, y);

  const aura = context.createRadialGradient(0, 0, 12, 0, 0, 182);
  aura.addColorStop(0, `rgba(225,242,255,${energy * .16})`);
  aura.addColorStop(.28, `rgba(85,35,116,${energy * .22})`);
  aura.addColorStop(.62, `rgba(143,45,43,${energy * .16})`);
  aura.addColorStop(1, "transparent");
  context.fillStyle = aura;
  context.fillRect(-190, -190, 380, 380);

  context.strokeStyle = `rgba(143,74,171,${energy * .5})`;
  context.lineWidth = 2;
  context.setLineDash([9, 13]);
  context.beginPath();
  context.arc(0, 0, 150 - entranceConverge * 62, -Math.PI * .86, Math.PI * .38);
  context.stroke();
  context.strokeStyle = `rgba(228,168,83,${energy * .4})`;
  context.beginPath();
  context.arc(0, 0, 128 - entranceConverge * 48, Math.PI * .18, Math.PI * 1.55);
  context.stroke();

  if (!reducedMotion) {
    for (let index = 0; index < 18; index += 1) {
      const baseAngle = index * 2.399963 + (index % 3) * .17;
      const angle = baseAngle + (1 - converge) * (1.5 + index % 4 * .2);
      const startRadius = 168 + index % 5 * 13;
      const radius = startRadius * (1 - converge) + (34 + index % 4 * 9) * converge;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius * .72;
      const previousRadius = radius + 13 + index % 3 * 5;
      context.strokeStyle = index % 3 === 0
        ? `rgba(255,53,147,${energy * .34})`
        : index % 2 === 0
          ? `rgba(62,236,236,${energy * .42})`
          : `rgba(231,171,91,${energy * .36})`;
      context.lineWidth = 1 + index % 2;
      context.beginPath();
      context.moveTo(Math.cos(angle - .08) * previousRadius, Math.sin(angle - .08) * previousRadius * .72);
      context.lineTo(px, py);
      context.stroke();
      context.save();
      context.translate(px, py);
      context.rotate(angle + Math.PI / 4);
      context.fillStyle = context.strokeStyle;
      context.fillRect(-2 - index % 2, -2 - index % 3, 4 + index % 2 * 2, 4 + index % 3 * 2);
      context.restore();
    }
  }
  context.restore();
}

function drawBoss(context: CanvasRenderingContext2D, world: FinaleWorld, reducedMotion: boolean) {
  if (world.mode === "whiteout") return;
  const { x, y } = world.boss;
  const seconds = reducedMotion ? 0 : world.elapsedMs / 1_000;
  const opening = world.mode === "bulletHell" && world.cycle === "opening";
  const revealProgress = world.mode === "field"
    ? clamp(world.modeElapsedMs / FINALE_BOSS_REVEAL_MS, 0, 1)
    : 1;
  const assembly = smoothstep((revealProgress - .5) / .38);
  const glyphAssembly = smoothstep((revealProgress - .48) / .46);
  const destructionProgress = world.mode === "destruction"
    ? clamp(world.modeElapsedMs / world.stats.destructionDurationMs, 0, 1)
    : 0;
  const pulse = reducedMotion ? 1 : 1 + Math.sin(seconds * 3.7) * .025;
  const hitStrength = clamp(world.boss.flashMs / BOSS_HIT_FLASH_MS, 0, 1);
  const hitPhase = 1 - hitStrength;
  const recoil = reducedMotion
    ? 0
    : Math.sin(hitPhase * Math.PI * 2.4) * hitStrength * 6 * (world.clicksLanded % 2 ? 1 : -1);
  const squash = reducedMotion ? 0 : Math.sin(hitPhase * Math.PI) * hitStrength * .05;
  const signalJitter = reducedMotion ? 0 : Math.sin(world.elapsedMs * .091) * (1 - revealProgress) * 9;
  const bodyOpacity = assembly * (1 - destructionProgress * .76);
  const destructionMotion = reducedMotion ? 0 : destructionProgress;
  const attackableVisual = world.mode === "bulletHell"
    || (world.mode === "field" && world.modeElapsedMs >= FINALE_BOSS_ATTACKABLE_MS);

  context.save();
  context.translate(x + signalJitter + recoil * .5, y);
  context.scale(
    .94 * pulse * (1 + squash) * (destructionMotion ? 1 - destructionMotion * .78 : 1),
    .94 * pulse * (1 - squash * .7) * (1 + destructionMotion * .12),
  );
  drawGlitchBossGlow(context, seconds, bodyOpacity, opening, reducedMotion);

  const bodyGradient = context.createRadialGradient(-12, -14, 3, 0, 0, GLITCH_BOSS_BODY_RADIUS);
  bodyGradient.addColorStop(0, opening ? "#17130a" : "#10121b");
  bodyGradient.addColorStop(.32, "#07080d");
  bodyGradient.addColorStop(.76, "#010205");
  bodyGradient.addColorStop(1, "#000000");
  context.globalAlpha = bodyOpacity;
  context.fillStyle = bodyGradient;
  traceGlitchBossBody(context);
  context.fill();

  drawGlitchBossGlyphCluster(
    context,
    world.elapsedMs,
    bodyOpacity,
    glyphAssembly,
    opening,
    hitStrength,
    reducedMotion,
  );

  if (hitStrength > 0) {
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = hitStrength * .42 * bodyOpacity;
    const flash = context.createRadialGradient(-12, -18, 2, 0, 0, GLITCH_BOSS_BODY_RADIUS);
    flash.addColorStop(0, "#ffffff");
    flash.addColorStop(.42, "rgba(206,253,255,.72)");
    flash.addColorStop(1, "rgba(255,255,255,.04)");
    context.fillStyle = flash;
    traceGlitchBossBody(context);
    context.fill();
    context.restore();
  }
  context.restore();

  if (attackableVisual && glyphAssembly > 0) {
    context.save();
    context.translate(x, y);
    context.globalCompositeOperation = "screen";
    context.globalAlpha = glyphAssembly * (opening ? .82 : .26);
    const targetGlow = context.createRadialGradient(
      0,
      0,
      GLITCH_BOSS_BODY_RADIUS - 5,
      0,
      0,
      FINALE_BOSS_CLICK_RADIUS + (opening ? 24 : 18),
    );
    targetGlow.addColorStop(0, "rgba(0,0,0,0)");
    targetGlow.addColorStop(.28, opening ? "rgba(255,240,164,.46)" : "rgba(56,238,255,.16)");
    targetGlow.addColorStop(.62, opening ? "rgba(255,60,171,.18)" : "rgba(132,92,255,.11)");
    targetGlow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = targetGlow;
    context.fillRect(-120, -120, 240, 240);
    context.restore();
  }

  if (world.mode === "destruction") {
    context.save();
    context.translate(x, y);
    context.globalCompositeOperation = "screen";
    context.strokeStyle = `rgba(232,255,255,${1 - destructionProgress})`;
    context.lineWidth = 2.5;
    for (let index = 0; index < 14; index += 1) {
      const angle = index * Math.PI / 7 + .13;
      const inner = 18 + destructionMotion * 32;
      const outer = 54 + destructionMotion * (150 + index % 4 * 18);
      context.beginPath();
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.stroke();
    }
    context.fillStyle = `rgba(230,255,255,${.92 * destructionProgress})`;
    context.fillRect(-1.5, -84 - destructionMotion * 30, 3, 168 + destructionMotion * 60);
    context.restore();
  }
}

function drawGuildBody(
  context: CanvasRenderingContext2D,
  world: FinaleWorld,
  loadout: FinaleLoadout,
  images: Map<string, HTMLImageElement>,
  reducedMotion: boolean,
) {
  const atlas = images.get(FINALE_GUILD_ATLAS.source);
  const frame = clamp(Math.round(loadout.hallLevel), 1, 6) - 1;
  const column = frame % FINALE_GUILD_ATLAS.columns;
  const row = Math.floor(frame / FINALE_GUILD_ATLAS.columns);
  const blink = !reducedMotion && world.player.invulnerableMs > 0 && Math.floor(world.player.invulnerableMs / 90) % 2 === 0;
  const size = FINALE_GUILD_SIZE;

  context.save();
  context.translate(world.player.x, world.player.y);
  context.globalAlpha = blink ? .42 : 1;
  context.shadowColor = world.player.shield > 0 ? "#66f2fb" : "#e8b45e";
  context.shadowBlur = world.player.shield > 0 ? 17 : 9;
  if (atlas?.complete && atlas.naturalWidth > 0) {
    context.drawImage(
      atlas,
      column * FINALE_GUILD_ATLAS.frameWidth,
      row * FINALE_GUILD_ATLAS.frameHeight,
      FINALE_GUILD_ATLAS.frameWidth,
      FINALE_GUILD_ATLAS.frameHeight,
      -size / 2,
      -size / 2,
      size,
      size,
    );
  } else {
    context.fillStyle = "#b57639";
    context.fillRect(-28, -21, 56, 42);
  }
  context.shadowBlur = 0;
  context.restore();
}

function drawBullet(
  context: CanvasRenderingContext2D,
  bullet: FinaleWorld["bullets"][number],
  images: Map<string, HTMLImageElement>,
  reducedMotion: boolean,
) {
  const asset = finaleBulletAsset(bullet.spriteIndex);
  const image = images.get(asset.source);
  const telegraph = bullet.ageMs < bullet.telegraphMs;
  const warningProgress = clamp(bullet.ageMs / Math.max(1, bullet.telegraphMs), 0, 1);
  const cardSize = bullet.cardSize;
  const halfCard = cardSize / 2;

  context.save();
  context.translate(bullet.x, bullet.y);
  context.rotate(bullet.rotation);
  if (telegraph) {
    context.globalAlpha = .2 + warningProgress * .42;
    context.strokeStyle = warningProgress > .72 ? "#fff1ad" : "#ff7fb6";
    context.lineWidth = 2;
    context.setLineDash([4, 5]);
    const warningHalf = halfCard + 7 - warningProgress * 4;
    context.strokeRect(-warningHalf, -warningHalf, warningHalf * 2, warningHalf * 2);
  }

  context.globalAlpha = 1;
  context.setLineDash([]);
  context.shadowColor = "#ff4da1";
  context.shadowBlur = telegraph || reducedMotion ? 0 : 8;
  context.fillStyle = telegraph ? "#a81258" : "#d91b73";
  context.fillRect(-halfCard, -halfCard, cardSize, cardSize);
  context.shadowBlur = 0;
  context.strokeStyle = telegraph ? "#ff8fc1" : "#ffc0dd";
  context.lineWidth = 2;
  context.strokeRect(-halfCard + 1, -halfCard + 1, cardSize - 2, cardSize - 2);

  if (image?.complete && image.naturalWidth > 0) {
    const contentSize = cardSize - 12;
    const imageScale = Math.min(contentSize / image.naturalWidth, contentSize / image.naturalHeight);
    const imageWidth = image.naturalWidth * imageScale;
    const imageHeight = image.naturalHeight * imageScale;
    context.globalAlpha = telegraph ? .58 : 1;
    context.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
  } else {
    context.globalAlpha = telegraph ? .5 : .9;
    context.fillStyle = "#ffe1ef";
    context.fillRect(-cardSize * .2, -cardSize * .2, cardSize * .4, cardSize * .4);
  }
  context.restore();
}

function drawPlayerImpact(
  context: CanvasRenderingContext2D,
  impact: PlayerImpact,
  images: Map<string, HTMLImageElement>,
  reducedMotion: boolean,
) {
  const duration = reducedMotion ? 190 : impact.kind === "shield" ? 430 : 320;
  const progress = clamp(impact.ageMs / duration, 0, 1);
  if (progress >= 1) return;
  const shielded = impact.kind === "shield";
  const radius = reducedMotion ? 48 : 38 + (1 - Math.pow(1 - progress, 3)) * (shielded ? 63 : 36);
  const fade = Math.pow(1 - progress, 1.3);
  const flash = images.get(FINALE_VFX_ASSETS.impactFlash);
  const ring = images.get(FINALE_VFX_ASSETS.impactRing);

  context.save();
  context.translate(impact.x, impact.y);
  context.globalCompositeOperation = "screen";
  if (flash?.complete && flash.naturalWidth > 0 && impact.ageMs < 120) {
    const size = 88 + progress * 64;
    context.globalAlpha = clamp(1 - impact.ageMs / 120, 0, 1) * .9;
    context.drawImage(flash, -size / 2, -size / 2, size, size);
  }
  if (ring?.complete && ring.naturalWidth > 0) {
    context.globalAlpha = fade * .9;
    context.drawImage(ring, -radius, -radius, radius * 2, radius * 2);
  }
  context.globalAlpha = fade;
  context.strokeStyle = shielded ? "#b7ffff" : "#ff9b72";
  context.shadowColor = shielded ? "#5cf2fb" : "#ff654f";
  context.shadowBlur = 16;
  context.lineWidth = reducedMotion ? 4 : 3;
  drawHexagon(context, radius);
  context.stroke();
  drawHexagon(context, Math.max(14, radius - 9));
  context.stroke();
  if (!reducedMotion) {
    for (let index = 0; index < 8; index += 1) {
      const angle = impact.angle + Math.PI + index * Math.PI / 4;
      const distance = 18 + progress * (shielded ? 58 : 38);
      context.save();
      context.rotate(angle);
      context.translate(distance, 0);
      context.fillStyle = shielded ? "#d7ffff" : "#ffd3a8";
      context.fillRect(-3, -1.3, 8, 2.6);
      context.restore();
    }
  }
  context.restore();
}

function drawGuildHitArea(
  context: CanvasRenderingContext2D,
  world: FinaleWorld,
  loadout: FinaleLoadout,
  impact: PlayerImpact | null,
  focusHeld: boolean,
  reducedMotion: boolean,
) {
  const cells = finaleGuildMaskCells(loadout.hallLevel);
  const boundaryCells = guildMaskBoundaryCells(cells);
  const impactDuration = reducedMotion ? 190 : impact?.kind === "shield" ? 430 : 320;
  const impactProgress = impact ? clamp(impact.ageMs / impactDuration, 0, 1) : 1;
  const impactVisible = Boolean(impact && impactProgress < 1);
  const shielded = impactVisible ? impact?.kind === "shield" : world.player.shield > 0;
  const outlineColor = impactVisible && !shielded
    ? "#ff8b72"
    : shielded
      ? "#7cf8ff"
      : focusHeld
        ? "#ff7697"
        : "#ffd38a";
  const pulse = reducedMotion ? 1 : .86 + Math.sin(world.elapsedMs / 180) * .14;

  context.save();
  context.translate(world.player.x, world.player.y);
  context.globalCompositeOperation = "screen";
  context.fillStyle = outlineColor;
  context.globalAlpha = impactVisible ? .2 : .08;
  traceGuildMaskCells(context, cells);
  context.fill();

  context.globalAlpha = (impactVisible ? .98 - impactProgress * .24 : .72) * pulse;
  context.shadowColor = outlineColor;
  context.shadowBlur = reducedMotion ? 0 : impactVisible ? 18 : shielded ? 11 : 6;
  traceGuildMaskCells(context, boundaryCells);
  context.fill();
  context.restore();
}

function drawAttackImpact(
  context: CanvasRenderingContext2D,
  impact: AttackImpact,
  images: Map<string, HTMLImageElement>,
  reducedMotion: boolean,
) {
  const duration = impact.kind === "hit" ? ATTACK_IMPACT_LIFETIME_MS : 180;
  const progress = clamp(impact.ageMs / duration, 0, 1);
  if (progress >= 1 || impact.kind === "rate-limited") return;
  context.save();
  context.translate(impact.x, impact.y);
  if (impact.kind === "miss") {
    context.globalAlpha = 1 - progress;
    context.strokeStyle = "rgba(215,226,225,.7)";
    context.setLineDash([3, 5]);
    context.beginPath();
    context.arc(0, 0, 18 + progress * 18, 0, Math.PI * 2);
    context.stroke();
  } else {
    const opening = impact.multiplier > 1;
    const guarded = impact.multiplier < 1;
    const accent = opening ? "#ffe27a" : guarded ? "#6cecf5" : "#f6f2df";
    const flash = images.get(FINALE_VFX_ASSETS.impactFlash);
    const ring = images.get(FINALE_VFX_ASSETS.impactRing);
    const slash = images.get(FINALE_VFX_ASSETS.steelSlash);
    const spark = images.get(FINALE_VFX_ASSETS.spark);
    const baseAngle = ((impact.serial % 9) - 4) * .075 - .34;

    context.globalCompositeOperation = "screen";
    if (impact.ageMs < 190) {
      const flashProgress = clamp(impact.ageMs / 190, 0, 1);
      const size = (guarded ? 82 : opening ? 154 : 126) + flashProgress * 48;
      context.globalAlpha = (1 - flashProgress) * (guarded ? .58 : .94);
      if (flash?.complete && flash.naturalWidth > 0) {
        context.drawImage(flash, -size / 2, -size / 2, size, size);
      } else {
        context.fillStyle = accent;
        context.beginPath();
        context.arc(0, 0, size * .28, 0, Math.PI * 2);
        context.fill();
      }
    }

    const ringProgress = clamp(impact.ageMs / 500, 0, 1);
    if (ringProgress < 1) {
      const radius = (guarded ? 35 : 48) + ringProgress * (opening ? 74 : 48);
      context.globalAlpha = (1 - ringProgress) * (guarded ? .48 : .8);
      if (ring?.complete && ring.naturalWidth > 0) {
        context.drawImage(ring, -radius, -radius, radius * 2, radius * 2);
      } else {
        context.strokeStyle = accent;
        context.lineWidth = opening ? 5 : 3;
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.stroke();
      }
    }

    const drawSlash = (delayMs: number, angleOffset: number) => {
      const age = impact.ageMs - delayMs;
      if (age < 0 || age >= 580) return;
      const slashProgress = clamp(age / 580, 0, 1);
      const size = (guarded ? 128 : opening ? 252 : 208) * (.76 + slashProgress * .34);
      context.save();
      context.rotate(reducedMotion ? angleOffset : baseAngle + angleOffset);
      context.globalAlpha = Math.sin(Math.min(1, slashProgress * 5) * Math.PI / 2)
        * Math.pow(1 - slashProgress, .56) * (guarded ? .62 : 1);
      context.shadowColor = accent;
      context.shadowBlur = opening ? 20 : 13;
      if (slash?.complete && slash.naturalWidth > 0) {
        context.drawImage(slash, -size / 2, -size / 2, size, size);
      } else {
        context.strokeStyle = accent;
        context.lineWidth = opening ? 9 : 6;
        context.beginPath();
        context.arc(0, 0, size * .36, -.8, .8);
        context.stroke();
      }
      context.restore();
    };
    drawSlash(0, 0);
    if (opening) drawSlash(60, Math.PI / 2);

    if (!reducedMotion && impact.ageMs < 430) {
      const shardProgress = clamp(impact.ageMs / 430, 0, 1);
      for (let index = 0; index < 6; index += 1) {
        const angle = baseAngle + index * Math.PI / 3 + (impact.serial % 5) * .11;
        const distance = 22 + shardProgress * (guarded ? 38 : 72);
        context.save();
        context.rotate(angle);
        context.translate(distance, 0);
        context.rotate(Math.PI / 2);
        context.globalAlpha = Math.pow(1 - shardProgress, 1.3) * (guarded ? .5 : .9);
        if (spark?.complete && spark.naturalWidth > 0) {
          context.drawImage(spark, -6, -12, 12, 24);
        } else {
          context.fillStyle = index % 2 ? accent : "#ff76b8";
          context.fillRect(-2, -7, 4, 14);
        }
        context.restore();
      }
    }

    if (impact.ageMs < 330) {
      const crossProgress = clamp(impact.ageMs / 330, 0, 1);
      const spread = (guarded ? 32 : 48) + crossProgress * (opening ? 42 : 28);
      context.globalAlpha = Math.pow(1 - crossProgress, .7) * (guarded ? .5 : .86);
      context.strokeStyle = accent;
      context.shadowColor = accent;
      context.shadowBlur = 18;
      context.lineWidth = opening ? 6 : 4;
      context.beginPath();
      context.moveTo(-spread, -spread * .38);
      context.lineTo(spread, spread * .38);
      context.moveTo(spread * .52, -spread);
      context.lineTo(-spread * .52, spread);
      context.stroke();
      context.shadowBlur = 0;
    }

    const textProgress = clamp((impact.ageMs - 45) / 675, 0, 1);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1 - Math.pow(textProgress, 3);
    context.fillStyle = accent;
    context.strokeStyle = "rgba(3,7,12,.88)";
    context.lineWidth = 5;
    context.font = opening ? "900 28px ui-monospace, monospace" : "900 23px ui-monospace, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    const label = opening
      ? `WEAK! ×2  -${impact.damage.toFixed(1)}`
      : guarded
        ? `GUARD 35%  -${impact.damage.toFixed(1)}`
        : `DIRECT HIT  -${impact.damage.toFixed(1)}`;
    const textY = 72 - (reducedMotion ? 0 : textProgress * 30);
    context.strokeText(label, 0, textY);
    context.fillText(label, 0, textY);
  }
  context.restore();
}

function drawWorld(
  context: CanvasRenderingContext2D,
  world: FinaleWorld,
  loadout: FinaleLoadout,
  images: Map<string, HTMLImageElement>,
  focusHeld: boolean,
  playerImpact: PlayerImpact | null,
  attackImpacts: readonly AttackImpact[],
  reducedMotion: boolean,
  preserveHostField: boolean,
  omitBoss = false,
) {
  if (world.mode === "field") {
    if (!preserveHostField) drawFieldBackground(context, images);
  } else if (world.mode === "collapse") {
    context.fillStyle = "#010204";
    context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
  } else {
    drawNullBackground(context, world, reducedMotion);
  }

  if (!omitBoss) {
    drawBossEntranceEnergy(context, world, reducedMotion);
    drawBoss(context, world, reducedMotion);
  }
  if (world.mode === "collapse" || world.mode === "bulletHell") {
    drawGuildBody(context, world, loadout, images, reducedMotion);
    if (world.mode === "bulletHell") {
      world.bullets.forEach((bullet) => drawBullet(context, bullet, images, reducedMotion));
      if (playerImpact) drawPlayerImpact(context, playerImpact, images, reducedMotion);
    }
    drawGuildHitArea(context, world, loadout, playerImpact, focusHeld, reducedMotion);
  }
  if (!omitBoss) {
    attackImpacts.forEach((impact) => drawAttackImpact(context, impact, images, reducedMotion));
  }

  if (world.mode === "whiteout") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
  }
  context.save();
  context.strokeStyle = world.mode === "field" ? "rgba(245,220,169,.44)" : "rgba(103,236,245,.22)";
  context.lineWidth = 2;
  context.strokeRect(7, 7, FINALE_WIDTH - 14, FINALE_HEIGHT - 14);
  context.restore();
}

function withFinaleWorldClip(context: CanvasRenderingContext2D, draw: () => void) {
  context.save();
  context.beginPath();
  context.rect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
  context.clip();
  draw();
  context.restore();
}

function drawBossOnlyCanvas(
  canvas: HTMLCanvasElement,
  world: FinaleWorld,
  reducedMotion: boolean,
) {
  const context = canvas.getContext("2d");
  if (!context) return false;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / FINALE_WIDTH, canvas.height / FINALE_HEIGHT);
  const offsetX = (canvas.width - FINALE_WIDTH * scale) / 2;
  const offsetY = (canvas.height - FINALE_HEIGHT * scale) / 2;
  context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  withFinaleWorldClip(context, () => drawBoss(context, world, reducedMotion));
  return true;
}

export function BulletHellFinale({
  loadout,
  mode,
  presentation = "standalone",
  cursorWeapon,
  initialCursorPoint,
  seed = 20260810,
  onModeChange,
  onDefeat,
  onExit,
  onVictory,
}: BulletHellFinaleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const [initialWorld] = useState(() => createFinaleWorld(loadout, { preview: mode === "preview", seed }));
  const worldRef = useRef<FinaleWorld>(initialWorld);
  const keysRef = useRef(new Set<string>());
  const virtualRef = useRef(new Set<VirtualDirection>());
  const playerImpactRef = useRef<PlayerImpact | null>(null);
  const attackImpactsRef = useRef<AttackImpact[]>([]);
  const reducedMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastHudRef = useRef(0);
  const whiteoutStartedAtRef = useRef<number | null>(null);
  const onVictoryRef = useRef(onVictory);
  const resultSoundRef = useRef<"victory" | "defeat" | null>(null);
  const defeatHandledRef = useRef(false);
  const pageFractureRef = useRef<ActivePageFracture | null>(null);
  const pageFractureScrollRef = useRef<{ x: number; y: number } | null>(null);
  const previousModeRef = useRef<FinaleMode>(initialWorld.mode);
  const previousCycleRef = useRef(initialWorld.cycle);
  const sceneRef = useRef<FinaleScene>("running");
  const [scene, setScene] = useState<FinaleScene>("running");
  const [hud, setHud] = useState(() => snapshotFromWorld(initialWorld));
  const [announcement, setAnnouncement] = useState("마지막 스테이지에 기록 말소자가 모습을 드러냅니다.");
  const [weaponCursorPoint, setWeaponCursorPoint] = useState<WeaponCursorPoint>(() => initialCursorPoint
    ? { ...initialCursorPoint }
    : { x: 50, y: 50, visible: false });
  const stats = useMemo(() => deriveFinaleStats(loadout), [loadout]);
  const bossPercent = hud.bossMaxHp ? clamp(hud.bossHp / hud.bossMaxHp * 100, 0, 100) : 0;
  const cyclePercent = hud.mode === "bulletHell"
    ? clamp(hud.cycleRemainingMs / (hud.cycle === "dodge" ? stats.dodgeDurationMs : stats.openingDurationMs) * 100, 0, 100)
    : 0;
  const bossRevealOpacity = hud.mode === "field"
    ? smoothstep((hud.modeElapsedMs - FINALE_BOSS_ATTACKABLE_MS + 400) / 400)
    : 1;
  const musicSignal = finaleMusicForMode(hud.mode);

  const completeDefeat = useCallback((world: FinaleWorld) => {
    if (defeatHandledRef.current) return;
    defeatHandledRef.current = true;
    if (resultSoundRef.current !== "defeat") {
      resultSoundRef.current = "defeat";
      playExpeditionFailSound();
    }
    setHud(snapshotFromWorld(world));
    if (onDefeat) {
      sceneRef.current = "departing";
      setScene("departing");
      onDefeat();
      return;
    }
    setAnnouncement("동기화 실패. 2페이즈 시작점에서 즉시 재시도할 수 있습니다.");
    sceneRef.current = "defeat";
    setScene("defeat");
  }, [onDefeat]);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    onVictoryRef.current = onVictory;
  }, [onVictory]);

  useEffect(() => {
    onModeChange?.(hud.mode);
  }, [hud.mode, onModeChange]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / FINALE_WIDTH, canvas.height / FINALE_HEIGHT);
    const offsetX = (canvas.width - FINALE_WIDTH * scale) / 2;
    const offsetY = (canvas.height - FINALE_HEIGHT * scale) / 2;
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    withFinaleWorldClip(context, () => {
      drawWorld(
        context,
        worldRef.current,
        loadout,
        imagesRef.current,
        keysRef.current.has("shift") || virtualRef.current.has("focus"),
        playerImpactRef.current,
        attackImpactsRef.current,
        reducedMotionRef.current,
        presentation === "embedded",
      );
    });
  }, [loadout, presentation]);

  const restorePageFracture = useCallback(() => {
    const active = pageFractureRef.current;
    if (!active) return;
    active.controller.restore();
    active.portal.root.remove();
    pageFractureRef.current = null;
    pageFractureScrollRef.current = null;
  }, []);

  const settlePageFracture = useCallback(() => {
    const active = pageFractureRef.current;
    if (!active || active.settled) return;
    active.controller.settle();
    active.portal.root.remove();
    active.settled = true;
    const preservedScroll = pageFractureScrollRef.current;
    if (preservedScroll) {
      window.requestAnimationFrame(() => {
        window.scrollTo(preservedScroll.x, preservedScroll.y);
        canvasRef.current?.focus({ preventScroll: true });
        window.scrollTo(preservedScroll.x, preservedScroll.y);
      });
    }
  }, []);

  const updatePageFracture = useCallback((world: FinaleWorld) => {
    const active = pageFractureRef.current;
    if (!active || active.settled || world.mode !== "collapse") return;
    active.controller.update(world.modeElapsedMs, world.stats.collapseDurationMs, reducedMotionRef.current);
    updatePageFracturePortal(
      active.portal,
      world.modeElapsedMs,
      world.stats.collapseDurationMs,
      reducedMotionRef.current,
    );
    const keeper = active.portal.keeperHost.querySelector<HTMLCanvasElement>("[data-page-fracture-keeper]");
    if (keeper) drawBossOnlyCanvas(keeper, world, reducedMotionRef.current);
  }, []);

  const beginPageFracture = useCallback((world: FinaleWorld) => {
    const battleCanvas = canvasRef.current;
    const battleSurface = arenaRef.current;
    const sourceRoot = battleSurface?.closest<HTMLElement>(".game-shell");
    if (!battleCanvas || !battleSurface || !sourceRoot || battleCanvas.width < 2 || battleCanvas.height < 2) return false;

    const current = pageFractureRef.current;
    if (current) {
      current.controller.restore();
      current.portal.root.remove();
      pageFractureRef.current = null;
    }

    const soundDock = document.querySelector<HTMLElement>("[aria-label='게임 사운드 제어']");
    pageFractureScrollRef.current = { x: window.scrollX, y: window.scrollY };
    const portal = createPageFracturePortal();
    const battleSnapshot = document.createElement("canvas");
    const bossSnapshot = document.createElement("canvas");
    battleSnapshot.width = bossSnapshot.width = battleCanvas.width;
    battleSnapshot.height = bossSnapshot.height = battleCanvas.height;
    const battleSnapshotContext = battleSnapshot.getContext("2d");
    if (!battleSnapshotContext || !drawBossOnlyCanvas(bossSnapshot, world, reducedMotionRef.current)) {
      portal.root.remove();
      pageFractureScrollRef.current = null;
      return false;
    }
    const snapshotScale = Math.min(battleCanvas.width / FINALE_WIDTH, battleCanvas.height / FINALE_HEIGHT);
    const snapshotOffsetX = (battleCanvas.width - FINALE_WIDTH * snapshotScale) / 2;
    const snapshotOffsetY = (battleCanvas.height - FINALE_HEIGHT * snapshotScale) / 2;
    battleSnapshotContext.setTransform(snapshotScale, 0, 0, snapshotScale, snapshotOffsetX, snapshotOffsetY);
    withFinaleWorldClip(battleSnapshotContext, () => {
      drawWorld(
        battleSnapshotContext,
        world,
        loadout,
        imagesRef.current,
        keysRef.current.has("shift") || virtualRef.current.has("focus"),
        playerImpactRef.current,
        attackImpactsRef.current,
        reducedMotionRef.current,
        presentation === "embedded",
        true,
      );
    });
    const canvasRect = battleCanvas.getBoundingClientRect();
    const canvasScale = Math.max(.001, Math.min(canvasRect.width / FINALE_WIDTH, canvasRect.height / FINALE_HEIGHT));
    const canvasOffsetX = (canvasRect.width - FINALE_WIDTH * canvasScale) / 2;
    const canvasOffsetY = (canvasRect.height - FINALE_HEIGHT * canvasScale) / 2;
    portal.root.style.setProperty("--fracture-origin-x", `${canvasRect.left + canvasOffsetX + world.boss.x * canvasScale}px`);
    portal.root.style.setProperty("--fracture-origin-y", `${canvasRect.top + canvasOffsetY + world.boss.y * canvasScale}px`);
    try {
      const controller = mountPageFracture({
        sourceRoot,
        battleSurface,
        soundDock,
        battleCanvas,
        battleSnapshot,
        bossSnapshot,
        shardHost: portal.shardHost,
        keeperHost: portal.keeperHost,
        worldWidth: FINALE_WIDTH,
        worldHeight: FINALE_HEIGHT,
        boss: {
          x: world.boss.x,
          y: world.boss.y,
          radius: world.boss.radius,
          clickRadius: world.boss.clickRadius,
          silhouetteScale: .94,
        },
        seed,
        classNames: {
          shard: styles.pageFractureShard,
          content: styles.pageFractureContent,
        },
      });
      pageFractureRef.current = { controller, portal, settled: false };
      controller.update(0, world.stats.collapseDurationMs, reducedMotionRef.current);
      updatePageFracturePortal(portal, 0, world.stats.collapseDurationMs, reducedMotionRef.current);
      return true;
    } catch {
      portal.root.remove();
      pageFractureScrollRef.current = null;
      sourceRoot.removeAttribute("data-page-fracture-underlay");
      battleSurface.removeAttribute("data-page-fracture-underlay");
      soundDock?.removeAttribute("data-page-fracture-underlay");
      return false;
    }
  }, [loadout, presentation, seed]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const arena = arenaRef.current;
    if (!canvas || !arena) return;
    const rect = arena.getBoundingClientRect();
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      reducedMotionRef.current = query.matches;
      updatePageFracture(worldRef.current);
      renderCanvas();
    };
    syncPreference();
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, [renderCanvas, updatePageFracture]);

  useEffect(() => () => restorePageFracture(), [restorePageFracture]);

  useEffect(() => {
    let cancelled = false;
    RENDER_SOURCES.forEach((source) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = source;
      image.addEventListener("load", () => {
        if (!cancelled) {
          imagesRef.current.set(source, image);
          renderCanvas();
        }
      }, { once: true });
    });
    return () => { cancelled = true; };
  }, [renderCanvas]);

  useEffect(() => {
    let resizeFrame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        resizeCanvas();
      });
    });
    if (arenaRef.current) observer.observe(arenaRef.current);
    resizeCanvas();
    return () => {
      observer.disconnect();
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    unlockBattleAudio();
    if (mode === "preview") playExpeditionStartSound(true);
    const frame = requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  const applyBossAttack = useCallback((x: number, y: number) => {
    const before = worldRef.current;
    const next = attackFinaleBoss(before, x, y, performance.now());
    if (before.mode !== "collapse" && next.mode === "collapse") beginPageFracture(before);
    worldRef.current = next;
    const event = next.attackEvent;
    if (event && event.kind !== "rate-limited") {
      attackImpactsRef.current = [...attackImpactsRef.current, { ...event, ageMs: 0 }].slice(-MAX_ATTACK_IMPACTS);
    }
    if (event?.kind === "hit") {
      playMonsterHitSound(4, 1);
      if (event.multiplier > 1) playCombatProcSound({ combo: true });
      setAnnouncement(event.multiplier > 1
        ? `코어 노출 타격. ${event.damage.toFixed(1)} 피해, 두 배 공격 성공.`
        : event.multiplier < 1
          ? `코어가 닫혀 피해가 감소했습니다. ${event.damage.toFixed(1)} 피해.`
          : `기록 말소자 타격. ${event.damage.toFixed(1)} 피해.`);
    } else if (event?.kind === "miss") {
      setAnnouncement("공격이 빗나갔습니다. 기록 말소자의 검은 몸체를 직접 클릭하세요.");
    }
    if (before.mode !== next.mode) {
      previousModeRef.current = next.mode;
      if (next.mode === "collapse") {
        playCombatProcSound({ shockwave: true });
        setAnnouncement("1페이즈 격파. 필드가 붕괴하며 결전 공간으로 전환됩니다.");
      } else if (next.mode === "destruction") {
        playCombatProcSound({ execution: true });
        setAnnouncement("기록 말소자의 코어가 파괴되기 시작합니다.");
      }
    }
    setHud(snapshotFromWorld(next));
    renderCanvas();
    updatePageFracture(next);
  }, [beginPageFracture, renderCanvas, updatePageFracture]);

  useEffect(() => {
    const movementKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"]);
    const onKeyDown = (event: KeyboardEvent) => {
      const key = MOVEMENT_KEY_BY_CODE[event.code] ?? event.key.toLowerCase();
      if (movementKeys.has(key)) {
        event.preventDefault();
        keysRef.current.add(key);
      }
      if ((key === "p" || key === "escape") && !event.repeat) {
        event.preventDefault();
        setScene((current) => current === "running" ? "paused" : current === "paused" ? "running" : current);
      }
      if ((key === "enter" || key === " ") && !event.repeat && sceneRef.current === "running") {
        event.preventDefault();
        const boss = worldRef.current.boss;
        applyBossAttack(boss.x, boss.y);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(MOVEMENT_KEY_BY_CODE[event.code] ?? event.key.toLowerCase());
    const clearKeys = () => {
      keysRef.current.clear();
      virtualRef.current.clear();
    };
    const onVisibility = () => {
      clearKeys();
      if (document.hidden) setScene((current) => current === "running" ? "paused" : current);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [applyBossAttack]);

  useEffect(() => {
    if (scene !== "running") return;
    lastFrameRef.current = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = Math.min(50, Math.max(0, timestamp - lastFrameRef.current));
      lastFrameRef.current = timestamp;
      if (playerImpactRef.current) {
        playerImpactRef.current.ageMs += elapsed;
        if (playerImpactRef.current.ageMs >= 460) playerImpactRef.current = null;
      }
      attackImpactsRef.current = attackImpactsRef.current
        .map((impact) => ({ ...impact, ageMs: impact.ageMs + elapsed }))
        .filter((impact) => impact.ageMs < (impact.kind === "hit" ? ATTACK_IMPACT_LIFETIME_MS : 180));

      const pressed = keysRef.current;
      const virtual = virtualRef.current;
      const horizontal = (pressed.has("d") || pressed.has("arrowright") || virtual.has("right") ? 1 : 0)
        - (pressed.has("a") || pressed.has("arrowleft") || virtual.has("left") ? 1 : 0);
      const vertical = (pressed.has("s") || pressed.has("arrowdown") || virtual.has("down") ? 1 : 0)
        - (pressed.has("w") || pressed.has("arrowup") || virtual.has("up") ? 1 : 0);
      const focus = pressed.has("shift") || virtual.has("focus");
      const before = worldRef.current;
      const world = updateFinaleWorld(before, { x: horizontal, y: vertical, focus }, elapsed);
      worldRef.current = world;
      updatePageFracture(world);
      if (world.playerHitEvent) playerImpactRef.current = { ...world.playerHitEvent, ageMs: 0 };

      if (world.playerHit) {
        const departingAfterDefeat = world.status === "defeat" && Boolean(onDefeat);
        if (world.playerHitEvent?.kind === "shield") {
          playCombatProcSound({ critical: true });
          if (!departingAfterDefeat) setAnnouncement(`방어막이 탄환을 흡수했습니다. 잔여 ${world.player.shield} CHARGE, 본관 내구도 유지.`);
        } else {
          playMonsterHitSound(4, 1);
          if (!departingAfterDefeat) setAnnouncement(`길드 본관 피격. 내구도 ${world.player.hp}/${world.player.maxHp}.`);
        }
      }
      if (previousModeRef.current !== world.mode) {
        previousModeRef.current = world.mode;
        if (world.mode === "bulletHell") {
          playCombatProcSound({ momentumMaxed: true });
          setAnnouncement("2페이즈. WASD로 길드 본관 전체 피격영역을 지키고, 보스를 직접 클릭하세요.");
        } else if (world.mode === "whiteout") {
          whiteoutStartedAtRef.current = timestamp;
          setAnnouncement("기록 말소자 격파. 마지막 기록을 복원합니다.");
        }
      }
      if (previousCycleRef.current !== world.cycle && world.mode === "bulletHell") {
        previousCycleRef.current = world.cycle;
        playCombatProcSound(world.cycle === "opening" ? { combo: true } : { momentumMaxed: true });
        setAnnouncement(world.cycle === "opening"
          ? "CORE OPEN. 클릭 피해가 두 배가 되며, 탄막은 계속됩니다."
          : "코어 폐쇄. 안전 통로를 찾아 탄막을 피하세요.");
      }

      renderCanvas();
      if (before.mode === "collapse" && world.mode === "bulletHell") {
        settlePageFracture();
      }
      const stateChanged = before.mode !== world.mode || before.cycle !== world.cycle || before.status !== world.status;
      if (stateChanged || timestamp - lastHudRef.current >= 80) {
        lastHudRef.current = timestamp;
        setHud(snapshotFromWorld(world));
      }

      if (world.status === "defeat") {
        completeDefeat(world);
        return;
      }

      if (world.mode === "whiteout") {
        if (whiteoutStartedAtRef.current === null) whiteoutStartedAtRef.current = timestamp;
        if (timestamp - whiteoutStartedAtRef.current >= WHITEOUT_HOLD_MS) {
          if (resultSoundRef.current !== "victory") {
            resultSoundRef.current = "victory";
            playStageClearSound(true);
          }
          setHud(snapshotFromWorld(world));
          if (presentation === "embedded") {
            sceneRef.current = "departing";
            setScene("departing");
            onVictoryRef.current();
            return;
          }
          setScene("victory");
          return;
        }
      }
      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [completeDefeat, onDefeat, presentation, renderCanvas, scene, settlePageFracture, updatePageFracture]);

  const trackFinaleWeaponCursor = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setWeaponCursorPoint({
      x: clamp((event.clientX - rect.left) / Math.max(1, rect.width) * 100, 0, 100),
      y: clamp((event.clientY - rect.top) / Math.max(1, rect.height) * 100, 0, 100),
      visible: true,
    });
  };

  const handleArenaPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (scene !== "running" || event.button > 0) return;
    const world = worldRef.current;
    if (world.mode !== "field" && world.mode !== "bulletHell") return;
    event.preventDefault();
    trackFinaleWeaponCursor(event);
    unlockBattleAudio();
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = Math.max(.001, Math.min(rect.width / FINALE_WIDTH, rect.height / FINALE_HEIGHT));
    const offsetX = (rect.width - FINALE_WIDTH * scale) / 2;
    const offsetY = (rect.height - FINALE_HEIGHT * scale) / 2;
    const x = (event.clientX - rect.left - offsetX) / scale;
    const y = (event.clientY - rect.top - offsetY) / scale;
    applyBossAttack(x, y);
    event.currentTarget.focus({ preventScroll: true });
  };

  const restartAll = useCallback(() => {
    restorePageFracture();
    const world = createFinaleWorld(loadout, { preview: mode === "preview", seed });
    worldRef.current = world;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    whiteoutStartedAtRef.current = null;
    resultSoundRef.current = null;
    defeatHandledRef.current = false;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    setHud(snapshotFromWorld(world));
    setAnnouncement("1페이즈 재시작. 기록 말소자를 직접 클릭하세요.");
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
  }, [loadout, mode, restorePageFracture, seed]);

  const retryPhaseTwo = useCallback(() => {
    settlePageFracture();
    const world = restartFinalePhaseTwo(worldRef.current);
    worldRef.current = world;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    resultSoundRef.current = null;
    defeatHandledRef.current = false;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    setHud(snapshotFromWorld(world));
    setAnnouncement("2페이즈 시작점에서 재동기화했습니다. 저장 진행도는 그대로입니다.");
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  }, [settlePageFracture]);

  const jumpToMode = (nextMode: FinaleMode) => {
    const before = worldRef.current;
    if (nextMode === "field") restorePageFracture();
    else if (before.mode === "field") beginPageFracture(before);
    const world = forceFinaleMode(before, nextMode);
    worldRef.current = world;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    whiteoutStartedAtRef.current = null;
    resultSoundRef.current = null;
    defeatHandledRef.current = false;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    setHud(snapshotFromWorld(world));
    setAnnouncement(`개발자 장면 이동: ${nextMode}.`);
    setScene("running");
    renderCanvas();
    if (nextMode === "collapse") updatePageFracture(world);
    else if (nextMode !== "field") settlePageFracture();
  };

  const forceDefeat = () => {
    const before = worldRef.current;
    if (before.mode === "field") beginPageFracture(before);
    const current = forceFinaleMode(before, "bulletHell");
    const world: FinaleWorld = {
      ...current,
      status: "defeat",
      defeat: true,
      player: { ...current.player, hp: 0, shield: 0 },
      bullets: [],
    };
    worldRef.current = world;
    setHud(snapshotFromWorld(world));
    renderCanvas();
    settlePageFracture();
    completeDefeat(world);
  };

  const jumpToOpening = () => {
    const before = worldRef.current;
    if (before.mode === "field") beginPageFracture(before);
    const current = forceFinaleMode(before, "bulletHell");
    const patternName = "코어 노출 · 클릭 피해 2배";
    const world: FinaleWorld = {
      ...current,
      cycle: "opening",
      cycleRemainingMs: current.stats.openingDurationMs,
      bullets: [],
      patternName,
      boss: { ...current.boss, patternName },
    };
    worldRef.current = world;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    setHud(snapshotFromWorld(world));
    setAnnouncement("개발자 장면 이동: 첫 CORE OPEN 공격 기회.");
    setScene("running");
    renderCanvas();
    settlePageFracture();
  };

  const setVirtualDirection = (direction: VirtualDirection, active: boolean, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (active) {
      virtualRef.current.add(direction);
      event.currentTarget.setPointerCapture(event.pointerId);
      canvasRef.current?.focus({ preventScroll: true });
    } else {
      virtualRef.current.delete(direction);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const phaseLabel = hud.mode === "field" || hud.mode === "collapse" ? "PHASE 1" : "PHASE 2";
  const showCombatChrome = hud.mode === "field";
  const showWeaponCursor = Boolean(cursorWeapon) && scene === "running" && (hud.mode === "field" || hud.mode === "bulletHell");

  const battleSurface = <div
    ref={arenaRef}
    className={`${styles.battleSurface} ${presentation === "embedded" ? styles.embeddedSurface : styles.standaloneSurface}`}
    data-finale-scene={scene}
    data-finale-mode={hud.mode}
    data-boss-summoning={hud.mode === "field" && hud.modeElapsedMs < FINALE_BOSS_REVEAL_MS ? "true" : undefined}
    data-page-fracture-live={hud.mode === "field" ? undefined : "true"}
    data-finale-music={musicSignal}
    role="application"
    aria-label="기록 말소자 최종 결전"
  >
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      tabIndex={0}
      onPointerDown={handleArenaPointerDown}
      onPointerMove={trackFinaleWeaponCursor}
      onPointerLeave={() => setWeaponCursorPoint((current) => ({ ...current, visible: false }))}
      aria-describedby="finale-controls"
      aria-label={hud.mode === "field" ? "마지막 스테이지에 그대로 등장한 기록 말소자를 클릭 공격하는 전장" : "WASD로 길드 건물을 움직이며 기록 말소자를 클릭 공격하는 탄막 전장"}
    />

    {showWeaponCursor && cursorWeapon && <div className={styles.weaponCursorLayer} aria-hidden="true">
      <WeaponCursor weapon={cursorWeapon} point={weaponCursorPoint} />
    </div>}

    {showCombatChrome && <div className={styles.bossOverlay} data-finale-overlay="boss" style={{ "--boss-reveal": bossRevealOpacity } as CSSProperties}>
      <span><b>기록 말소자</b><em>{hud.mode === "bulletHell" && hud.cycle === "opening" ? "CORE OPEN ×2" : phaseLabel}</em><strong>{Math.ceil(bossPercent)}%</strong></span>
      <div
        className={styles.bossBar}
        role="progressbar"
        aria-label="기록 말소자 체력"
        aria-valuemin={0}
        aria-valuemax={hud.bossMaxHp}
        aria-valuenow={Math.max(0, hud.bossHp)}
        aria-valuetext={`${Math.ceil(bossPercent)}퍼센트`}
        style={{ "--boss-hp": `${bossPercent}%` } as CSSProperties}
      ><i /></div>
      {hud.mode === "bulletHell" && <small className={hud.cycle === "opening" ? styles.openingSignal : ""}>
        {hud.cycle === "opening" ? "CORE OPEN" : "DODGE"} · {(hud.cycleRemainingMs / 1_000).toFixed(1)}s
        <i style={{ "--meter": `${cyclePercent}%` } as CSSProperties} />
      </small>}
    </div>}

    {scene === "running" && showCombatChrome && <button className={styles.pauseButton} type="button" onClick={() => setScene("paused")} aria-label="전투 일시정지">Ⅱ</button>}
    {scene === "running" && hud.mode === "whiteout" && <div className={styles.whiteout} aria-hidden="true"><span>FINAL RECORD RESTORED</span></div>}

    {scene === "paused" && <div className={styles.pauseCurtain}><strong>전투 일시정지</strong><small>P 또는 ESC로 계속</small><button className={styles.primaryAction} type="button" onClick={() => setScene("running")}>계속하기</button></div>}

    {(scene === "victory" || scene === "defeat") && <div className={`${styles.result} ${scene === "defeat" ? styles.defeatResult : ""}`} role="dialog" aria-modal="true">
      <span className={styles.resultCode}>{scene === "victory" ? "FINAL RECORD RESTORED" : "GUILD HALL SYNC LOST"}</span>
      <h2>{scene === "victory" ? <>최종 보스 격파<em>길드의 엔딩을 되찾았다</em></> : <>동기화 실패<em>이것은 게임 오버가 아닙니다</em></>}</h2>
      <p>{scene === "victory" ? `기록 말소자가 파괴되었습니다. 직접 공격 ${hud.clicksLanded}회, 근접 회피 ${hud.grazes}회.` : "Stage 10-3 완료 기록은 안전합니다. 2페이즈 시작점에서 바로 재시도합니다."}</p>
      <div className={styles.actionRow}>
        {scene === "victory" ? <button className={styles.primaryAction} type="button" onClick={onVictory}>{mode === "preview" ? "시험 설정으로 돌아가기" : "엔딩 확정"}</button> : <button className={styles.primaryAction} type="button" onClick={retryPhaseTwo}>2페이즈 즉시 재시도</button>}
        <button className={styles.secondaryAction} type="button" onClick={scene === "victory" && mode === "preview" ? restartAll : onExit}>{scene === "victory" && mode === "preview" ? "처음부터 다시 보기" : "길드로 돌아가기"}</button>
      </div>
    </div>}

    {scene === "running" && hud.mode === "bulletHell" && <div className={styles.touchControls} aria-label="터치 이동 패드">
      {(["up", "left", "focus", "right", "down"] as VirtualDirection[]).map((direction) => <button
        key={direction}
        type="button"
        data-direction={direction}
        aria-label={direction === "up" ? "위로 이동" : direction === "down" ? "아래로 이동" : direction === "left" ? "왼쪽으로 이동" : direction === "right" ? "오른쪽으로 이동" : "정밀 이동"}
        onPointerDown={(event) => setVirtualDirection(direction, true, event)}
        onPointerUp={(event) => setVirtualDirection(direction, false, event)}
        onPointerCancel={(event) => setVirtualDirection(direction, false, event)}
      >{direction === "up" ? "▲" : direction === "down" ? "▼" : direction === "left" ? "◀" : direction === "right" ? "▶" : "FOCUS"}</button>)}
    </div>}

    {mode === "preview" && showCombatChrome && <div className={styles.quickTools} aria-label="개발자 장면 이동 도구"><span>DEV</span><div>{(["field", "collapse", "bulletHell", "destruction", "whiteout"] as FinaleMode[]).map((target) => <button className={styles.phaseButton} key={target} type="button" onClick={() => jumpToMode(target)}>{target}</button>)}<button className={styles.phaseButton} type="button" onClick={jumpToOpening}>CORE OPEN</button><button className={styles.phaseButton} type="button" onClick={forceDefeat}>DEFEAT</button><button className={styles.phaseButton} type="button" onClick={restartAll}>RESET</button></div></div>}

    <p id="finale-controls" className={styles.srOnly}>보스를 클릭하거나 Enter로 공격합니다. 2페이즈에서는 WASD 또는 방향키로 길드 본관을 움직이고 Shift로 정밀 이동합니다. 회전하는 핑크 카드가 길드의 발광 실루엣에 닿으면 피격됩니다.</p>
    <p className={styles.srOnly} aria-live="polite">{announcement}</p>
  </div>;

  if (presentation === "embedded") return battleSurface;

  return (
    <main
      className={`game-shell battle-mode ${mode === "preview" ? "developer-mode" : ""} ${styles.shell}`}
      data-finale-scene={scene}
      data-finale-mode={hud.mode}
      data-finale-music={musicSignal}
      data-finale-presentation="standalone"
    >
      <section className={`field-screen ${styles.screen}`} aria-label="최종 스테이지 전투">
        <header className={styles.stageToolbar}>
          <div><small>CURRENT EXPEDITION · GUILD SURVIVOR</small><h2>고대 용의 성소 <b>3/3</b></h2></div>
          <span>기록 말소자</span>
        </header>
        <div className={styles.standaloneHost}>{battleSurface}</div>
      </section>
    </main>
  );
}

export default BulletHellFinale;
