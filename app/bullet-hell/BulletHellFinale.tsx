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
import {
  FINALE_BULLET_ASSETS,
  FINALE_GUILD_ATLAS,
  FINALE_VFX_ASSETS,
  finaleBulletAsset,
} from "./assets";
import {
  attackFinaleBoss,
  createFinaleWorld,
  deriveFinaleStats,
  FINALE_BULLET_CAP,
  FINALE_HEIGHT,
  FINALE_WIDTH,
  forceFinaleMode,
  restartFinalePhaseTwo,
  updateFinaleWorld,
  type FinaleAttackEvent,
  type FinaleLoadout,
  type FinaleMode,
  type FinalePlayerHitEvent,
  type FinaleWorld,
} from "./engine";
import styles from "./BulletHellFinale.module.css";

const CAMPAIGN_REVEAL_MS = 1_850;
const PREVIEW_REVEAL_MS = 480;
const WHITEOUT_HOLD_MS = 1_550;
const ATTACK_IMPACT_LIFETIME_MS = 720;
const MAX_ATTACK_IMPACTS = 6;
const BOSS_HIT_FLASH_MS = 190;
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

const BULLET_ASSET_BY_SOURCE = new Map(FINALE_BULLET_ASSETS.map((asset) => [asset.source, asset]));

type FinaleScene = "intro" | "running" | "paused" | "victory" | "defeat";
type VirtualDirection = "up" | "down" | "left" | "right" | "focus";
type PlayerImpact = FinalePlayerHitEvent & { ageMs: number };
type AttackImpact = FinaleAttackEvent & { ageMs: number };

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
};

export type BulletHellFinaleProps = {
  loadout: FinaleLoadout;
  mode: "campaign" | "preview";
  seed?: number;
  onExit: () => void;
  onVictory: () => void;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
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

function drawBoss(context: CanvasRenderingContext2D, world: FinaleWorld, reducedMotion: boolean) {
  if (world.mode === "whiteout") return;
  const { x, y, hp, maxHp } = world.boss;
  const seconds = reducedMotion ? 0 : world.elapsedMs / 1_000;
  const field = world.mode === "field" || world.mode === "collapse";
  const opening = world.mode === "bulletHell" && world.cycle === "opening";
  const destructionProgress = world.mode === "destruction"
    ? clamp(world.modeElapsedMs / world.stats.destructionDurationMs, 0, 1)
    : 0;
  const pulse = reducedMotion ? 1 : 1 + Math.sin(seconds * 4.1) * .035;
  const hitStrength = clamp(world.boss.flashMs / BOSS_HIT_FLASH_MS, 0, 1);
  const hitPhase = 1 - hitStrength;
  const recoil = reducedMotion
    ? 0
    : Math.sin(hitPhase * Math.PI * 2.4) * hitStrength * 7 * (world.clicksLanded % 2 ? 1 : -1);
  const squash = reducedMotion ? 0 : Math.sin(hitPhase * Math.PI) * hitStrength * .055;
  const coreColor = opening ? "#fff2ae" : field ? "#f2c76f" : "#69eff8";
  const dangerColor = field ? "#8f302a" : "#ff4cae";

  context.save();
  context.translate(x + recoil, y);
  context.scale(
    pulse * (1 + destructionProgress * .16) * (1 + squash),
    pulse * (1 + destructionProgress * .16) * (1 - squash * .72),
  );
  context.globalAlpha = 1 - destructionProgress * .82;

  const aura = context.createRadialGradient(0, 0, 12, 0, 0, opening ? 136 : 114);
  aura.addColorStop(0, opening ? "rgba(255,238,143,.55)" : field ? "rgba(147,48,40,.35)" : "rgba(88,229,240,.36)");
  aura.addColorStop(.48, opening ? "rgba(255,219,107,.16)" : "rgba(255,64,157,.09)");
  aura.addColorStop(1, "transparent");
  context.fillStyle = aura;
  context.fillRect(-145, -145, 290, 290);

  if (hitStrength > 0) {
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = .2 + hitStrength * .46;
    context.lineWidth = 3;
    context.strokeStyle = "#5ff5ff";
    context.translate(reducedMotion ? 0 : -5 * hitStrength, 0);
    drawHexagon(context, field ? 67 : 62);
    context.stroke();
    context.strokeStyle = "#ff5cad";
    context.translate(reducedMotion ? 0 : 10 * hitStrength, 0);
    drawHexagon(context, field ? 67 : 62);
    context.stroke();
    context.restore();
  }

  context.save();
  context.rotate(reducedMotion ? 0 : seconds * (field ? .12 : .28));
  context.strokeStyle = opening ? "rgba(255,244,177,.95)" : `${coreColor}a8`;
  context.lineWidth = opening ? 4 : 2;
  context.setLineDash(field ? [18, 7, 3, 7] : [8, 9]);
  context.beginPath();
  context.arc(0, 0, opening ? 91 : 82, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  context.save();
  if (!reducedMotion && !field && Math.floor(seconds * 12) % 8 === 0) context.translate(4, 0);
  drawHexagon(context, field ? 63 : 58);
  context.fillStyle = field ? "rgba(40,25,20,.95)" : "rgba(2,5,10,.96)";
  context.fill();
  context.strokeStyle = dangerColor;
  context.lineWidth = 5;
  context.stroke();
  drawHexagon(context, field ? 49 : 45);
  context.strokeStyle = coreColor;
  context.lineWidth = 2;
  context.stroke();
  context.restore();

  if (hitStrength > 0) {
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = hitStrength * .52;
    context.fillStyle = "#ffffff";
    drawHexagon(context, field ? 63 : 58);
    context.fill();
    context.restore();
  }

  context.save();
  context.rotate(field ? Math.PI / 6 : 0);
  context.strokeStyle = "rgba(246,237,207,.45)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-46, -16);
  context.lineTo(-9, -4);
  context.lineTo(8, -36);
  context.moveTo(5, 38);
  context.lineTo(17, 5);
  context.lineTo(46, 18);
  context.stroke();
  context.restore();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = coreColor;
  context.shadowBlur = world.boss.flashMs > 0 ? 30 : 13;
  context.fillStyle = world.boss.flashMs > 0 ? "#ffffff" : coreColor;
  context.font = field ? "900 26px Georgia, serif" : "900 20px ui-monospace, monospace";
  context.fillText(field ? "消" : opening ? "OPEN" : "NULL", 0, -2);
  context.shadowBlur = 0;
  context.font = "800 8px ui-monospace, monospace";
  context.fillStyle = field ? "#f4dfb7" : "#d9fbff";
  context.fillText(`${Math.ceil(hp / Math.max(1, maxHp) * 100)}%`, 0, 28);

  if (opening) {
    context.fillStyle = "#fff0a8";
    context.font = "900 11px ui-monospace, monospace";
    context.fillText("CLICK DAMAGE ×2", 0, 113);
  }
  context.restore();

  if (world.mode === "destruction" && !reducedMotion) {
    context.save();
    context.translate(x, y);
    context.strokeStyle = `rgba(255,245,218,${1 - destructionProgress})`;
    context.lineWidth = 3;
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6 + .13;
      const inner = 24 + destructionProgress * 36;
      const outer = 52 + destructionProgress * 180;
      context.beginPath();
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.stroke();
    }
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
  const size = 90;

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
  if (world.player.shield > 0) {
    context.strokeStyle = "rgba(108,244,251,.76)";
    context.lineWidth = 2;
    context.setLineDash([13, 7]);
    context.beginPath();
    context.arc(0, 0, 40 + (reducedMotion ? 0 : Math.sin(world.elapsedMs / 145) * 1.5), 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function drawBullet(
  context: CanvasRenderingContext2D,
  bullet: FinaleWorld["bullets"][number],
  images: Map<string, HTMLImageElement>,
) {
  const asset = BULLET_ASSET_BY_SOURCE.get(bullet.asset) ?? finaleBulletAsset(bullet.spriteIndex);
  const image = images.get(bullet.asset) ?? images.get(asset.source);
  const telegraph = bullet.ageMs < bullet.telegraphMs;
  const warningProgress = clamp(bullet.ageMs / Math.max(1, bullet.telegraphMs), 0, 1);
  const visibleRadius = Math.max(asset.radius * 1.52, bullet.radius * 1.72);

  context.save();
  context.translate(bullet.x, bullet.y);
  context.rotate(bullet.rotation);
  if (telegraph) {
    context.globalAlpha = .2 + warningProgress * .42;
    context.strokeStyle = warningProgress > .72 ? "#fff1ad" : "#ff7fb6";
    context.lineWidth = 2;
    context.setLineDash([4, 5]);
    context.beginPath();
    context.arc(0, 0, visibleRadius + 7 - warningProgress * 4, 0, Math.PI * 2);
    context.stroke();
  } else {
    context.shadowColor = asset.kind === "weapon" ? "#ff5aa8" : "#5debf4";
    context.shadowBlur = 8;
  }
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, -visibleRadius, -visibleRadius, visibleRadius * 2, visibleRadius * 2);
  } else {
    context.fillStyle = telegraph ? "#ff92be" : "#74f3fa";
    context.beginPath();
    context.arc(0, 0, bullet.radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = telegraph ? .3 : .64;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(0, 0, bullet.radius, 0, Math.PI * 2);
  context.stroke();
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

function drawPlayerCore(context: CanvasRenderingContext2D, world: FinaleWorld, focusHeld: boolean, reducedMotion: boolean) {
  context.save();
  context.translate(world.player.x, world.player.y);
  context.fillStyle = focusHeld ? "#ff5478" : "#ffffff";
  context.strokeStyle = focusHeld ? "#ffc0cc" : "#7af4fb";
  context.shadowColor = focusHeld ? "#ff5478" : "#64eef6";
  context.shadowBlur = 12;
  context.beginPath();
  context.arc(0, 0, world.stats.hitRadius, 0, Math.PI * 2);
  context.fill();
  context.lineWidth = 1.5;
  context.stroke();
  context.shadowBlur = 0;
  if (reducedMotion && world.player.invulnerableMs > 0) {
    context.strokeStyle = "#ffe5a8";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, world.stats.hitRadius + 5, 0, Math.PI * 2);
    context.stroke();
  }
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

function drawCollapse(context: CanvasRenderingContext2D, world: FinaleWorld, reducedMotion: boolean) {
  if (world.mode !== "collapse") return;
  const progress = clamp(world.modeElapsedMs / world.stats.collapseDurationMs, 0, 1);
  context.save();
  context.fillStyle = `rgba(0,0,0,${progress * .84})`;
  context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);
  context.strokeStyle = `rgba(103,239,247,${1 - progress})`;
  context.lineWidth = 3;
  const split = FINALE_HEIGHT * (.48 + progress * .18);
  context.beginPath();
  context.moveTo(0, split);
  context.lineTo(FINALE_WIDTH, split - 42 * progress);
  context.stroke();
  if (!reducedMotion) {
    for (let index = 0; index < 11; index += 1) {
      const y = (index * 61 + world.elapsedMs * .34) % FINALE_HEIGHT;
      const height = 2 + index % 4;
      context.fillStyle = index % 2 ? `rgba(255,58,154,${.25 * (1 - progress)})` : `rgba(88,235,245,${.3 * (1 - progress)})`;
      context.fillRect(index % 2 ? 0 : 130, y, FINALE_WIDTH - (index % 3) * 120, height);
    }
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
) {
  if (world.mode === "field" || world.mode === "collapse") drawFieldBackground(context, images);
  else drawNullBackground(context, world, reducedMotion);

  drawBoss(context, world, reducedMotion);
  if (world.mode === "bulletHell") {
    drawGuildBody(context, world, loadout, images, reducedMotion);
    world.bullets.forEach((bullet) => drawBullet(context, bullet, images));
    if (playerImpact) drawPlayerImpact(context, playerImpact, images, reducedMotion);
    drawPlayerCore(context, world, focusHeld, reducedMotion);
  }
  drawCollapse(context, world, reducedMotion);
  attackImpacts.forEach((impact) => drawAttackImpact(context, impact, images, reducedMotion));

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

export function BulletHellFinale({
  loadout,
  mode,
  seed = 20260810,
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
  const resultSoundRef = useRef<"victory" | "defeat" | null>(null);
  const previousModeRef = useRef<FinaleMode>(initialWorld.mode);
  const previousCycleRef = useRef(initialWorld.cycle);
  const sceneRef = useRef<FinaleScene>("intro");
  const [scene, setScene] = useState<FinaleScene>("intro");
  const [hud, setHud] = useState(() => snapshotFromWorld(initialWorld));
  const [announcement, setAnnouncement] = useState("10-3의 기록 뒤에서 낯선 관리자가 모습을 드러냅니다.");
  const stats = useMemo(() => deriveFinaleStats(loadout), [loadout]);
  const bossPercent = hud.bossMaxHp ? clamp(hud.bossHp / hud.bossMaxHp * 100, 0, 100) : 0;
  const cyclePercent = hud.mode === "bulletHell"
    ? clamp(hud.cycleRemainingMs / (hud.cycle === "dodge" ? stats.dodgeDurationMs : stats.openingDurationMs) * 100, 0, 100)
    : 0;
  const musicSignal = finaleMusicForMode(hud.mode);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(canvas.width / FINALE_WIDTH, 0, 0, canvas.height / FINALE_HEIGHT, 0, 0);
    drawWorld(
      context,
      worldRef.current,
      loadout,
      imagesRef.current,
      keysRef.current.has("shift") || virtualRef.current.has("focus"),
      playerImpactRef.current,
      attackImpactsRef.current,
      reducedMotionRef.current,
    );
  }, [loadout]);

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
    canvas.getContext("2d")?.setTransform(width / FINALE_WIDTH, 0, 0, height / FINALE_HEIGHT, 0, 0);
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      reducedMotionRef.current = query.matches;
      renderCanvas();
    };
    syncPreference();
    query.addEventListener("change", syncPreference);
    return () => query.removeEventListener("change", syncPreference);
  }, [renderCanvas]);

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

  const beginEncounter = useCallback(() => {
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
    setAnnouncement("1페이즈. 화면의 기록 말소자를 직접 클릭해 공격하세요.");
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (scene !== "intro") return;
    const timer = window.setTimeout(beginEncounter, mode === "preview" ? PREVIEW_REVEAL_MS : CAMPAIGN_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [beginEncounter, mode, scene]);

  const applyBossAttack = useCallback((x: number, y: number) => {
    const before = worldRef.current;
    const next = attackFinaleBoss(before, x, y, performance.now());
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
      setAnnouncement("공격이 빗나갔습니다. 보스 문양 안쪽을 직접 클릭하세요.");
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
  }, [renderCanvas]);

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
      if (world.playerHitEvent) playerImpactRef.current = { ...world.playerHitEvent, ageMs: 0 };

      if (world.playerHit) {
        if (world.playerHitEvent?.kind === "shield") {
          playCombatProcSound({ critical: true });
          setAnnouncement(`방어막이 탄환을 흡수했습니다. 잔여 ${world.player.shield} CHARGE, 본관 내구도 유지.`);
        } else {
          playMonsterHitSound(4, 1);
          setAnnouncement(`길드 본관 피격. 내구도 ${world.player.hp}/${world.player.maxHp}.`);
        }
      }
      if (previousModeRef.current !== world.mode) {
        previousModeRef.current = world.mode;
        if (world.mode === "bulletHell") {
          playCombatProcSound({ momentumMaxed: true });
          setAnnouncement("2페이즈. WASD로 흰 피격점을 지키고, 보스를 직접 클릭하세요.");
        } else if (world.mode === "whiteout") {
          whiteoutStartedAtRef.current = timestamp;
          setAnnouncement("기록 말소자 격파. 마지막 기록을 복원합니다.");
        }
      }
      if (previousCycleRef.current !== world.cycle && world.mode === "bulletHell") {
        previousCycleRef.current = world.cycle;
        playCombatProcSound(world.cycle === "opening" ? { combo: true } : { momentumMaxed: true });
        setAnnouncement(world.cycle === "opening"
          ? "CORE OPEN. 탄막이 멈췄습니다. 지금 보스를 클릭하면 피해가 두 배입니다."
          : "코어 폐쇄. 안전 통로를 찾아 탄막을 피하세요.");
      }

      renderCanvas();
      const stateChanged = before.mode !== world.mode || before.cycle !== world.cycle || before.status !== world.status;
      if (stateChanged || timestamp - lastHudRef.current >= 80) {
        lastHudRef.current = timestamp;
        setHud(snapshotFromWorld(world));
      }

      if (world.status === "defeat") {
        if (resultSoundRef.current !== "defeat") {
          resultSoundRef.current = "defeat";
          playExpeditionFailSound();
        }
        setHud(snapshotFromWorld(world));
        setAnnouncement("동기화 실패. 2페이즈 시작점에서 즉시 재시도할 수 있습니다.");
        setScene("defeat");
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
  }, [renderCanvas, scene]);

  const handleArenaPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (scene !== "running" || event.button > 0) return;
    const world = worldRef.current;
    if (world.mode !== "field" && world.mode !== "bulletHell") return;
    event.preventDefault();
    unlockBattleAudio();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width) * FINALE_WIDTH;
    const y = (event.clientY - rect.top) / Math.max(1, rect.height) * FINALE_HEIGHT;
    applyBossAttack(x, y);
    event.currentTarget.focus({ preventScroll: true });
  };

  const restartAll = useCallback(() => {
    const world = createFinaleWorld(loadout, { preview: mode === "preview", seed });
    worldRef.current = world;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    whiteoutStartedAtRef.current = null;
    resultSoundRef.current = null;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    setHud(snapshotFromWorld(world));
    setAnnouncement("1페이즈 재시작. 기록 말소자를 직접 클릭하세요.");
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
  }, [loadout, mode, seed]);

  const retryPhaseTwo = useCallback(() => {
    const world = restartFinalePhaseTwo(worldRef.current);
    worldRef.current = world;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    resultSoundRef.current = null;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    setHud(snapshotFromWorld(world));
    setAnnouncement("2페이즈 시작점에서 재동기화했습니다. 저장 진행도는 그대로입니다.");
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  }, []);

  const jumpToMode = (nextMode: FinaleMode) => {
    const world = forceFinaleMode(worldRef.current, nextMode);
    worldRef.current = world;
    playerImpactRef.current = null;
    attackImpactsRef.current = [];
    whiteoutStartedAtRef.current = null;
    resultSoundRef.current = null;
    previousModeRef.current = world.mode;
    previousCycleRef.current = world.cycle;
    setHud(snapshotFromWorld(world));
    setAnnouncement(`개발자 장면 이동: ${nextMode}.`);
    setScene("running");
    renderCanvas();
  };

  const forceDefeat = () => {
    const current = forceFinaleMode(worldRef.current, "bulletHell");
    const world: FinaleWorld = {
      ...current,
      status: "defeat",
      defeat: true,
      player: { ...current.player, hp: 0, shield: 0 },
      bullets: [],
    };
    worldRef.current = world;
    setHud(snapshotFromWorld(world));
    setScene("defeat");
  };

  const jumpToOpening = () => {
    const current = forceFinaleMode(worldRef.current, "bulletHell");
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

  const hullCells = Array.from({ length: Math.max(1, hud.playerMaxHp) }, (_, index) => index < hud.playerHp);
  const timeText = `${Math.floor(hud.elapsedMs / 60_000).toString().padStart(2, "0")}:${Math.floor(hud.elapsedMs / 1_000 % 60).toString().padStart(2, "0")}`;
  const phaseLabel = hud.mode === "field" || hud.mode === "collapse" ? "PHASE 1" : "PHASE 2";
  const phaseTwo = hud.mode === "bulletHell" || hud.mode === "destruction" || hud.mode === "whiteout";

  return (
    <main
      className={`game-shell battle-mode ${mode === "preview" ? "developer-mode" : ""} ${styles.shell}`}
      data-finale-scene={scene}
      data-finale-mode={hud.mode}
      data-finale-music={musicSignal}
    >
      <section className={`field-screen ${styles.screen}`} role="application" aria-label="기록 말소자 최종 결전">
        <div className={`battle-banner ${styles.bossMarker}`}><span>BOSS</span></div>
        <header className={styles.topHud}>
          <div className={styles.identity}>
            <small>FINAL EXPEDITION · GUILD HALL</small>
            <strong>길드 본관 Lv.{loadout.hallLevel}</strong>
            <span>다른 성장 요소는 결전에서 초기화</span>
          </div>
          <div className={styles.bossReadout}>
            <small>{phaseLabel} · ENDING EVENT</small>
            <strong>기록 말소자 // THE ARCHIVIST</strong>
            <em>{hud.mode === "bulletHell" && hud.cycle === "opening" ? "CORE OPEN ×2" : phaseLabel}</em>
            <div className={styles.bossBar} style={{ "--boss-hp": `${bossPercent}%` } as CSSProperties}><i /></div>
          </div>
          <div className={styles.scoreBlock}>
            <small>DIRECT CLICK RECORD</small>
            <strong>{hud.clicksLanded}</strong>
            <span>{timeText} · MISS {hud.clicksMissed}</span>
          </div>
        </header>

        <div className={styles.battleGrid}>
          <aside className={styles.sidePanel} aria-label="결전 상태">
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>{phaseTwo ? "GUILD HULL" : "PHASE ONE"}</span>
              {phaseTwo ? <>
                <div className={styles.hullRow} aria-label={`내구도 ${hud.playerHp}/${hud.playerMaxHp}`}>
                  {hullCells.map((active, index) => <i key={index} className={`${styles.hullCell} ${active ? styles.active : ""}`} />)}
                </div>
                <div className={styles.shieldLine}><span>방어막 <b>{hud.shield} CHARGE</b></span></div>
              </> : <div className={styles.patternName}><strong>직접 클릭 전투</strong><span>기존 필드처럼 보스 문양을 마우스나 터치로 눌러 공격합니다.</span></div>}
            </section>
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>{phaseTwo ? "BATTLE RHYTHM" : "ATTACK CONTRACT"}</span>
              {hud.mode === "bulletHell" ? <>
                <div className={styles.patternName}><strong>{hud.cycle === "opening" ? "CORE OPEN · 공격 기회" : "DODGE · 회피 구간"}</strong><span>{hud.cycle === "opening" ? "탄막 정지 · 클릭 피해 2배" : "안전 통로 탐색 · 닫힌 코어 피해 35%"}</span></div>
                <div className={styles.meter} style={{ "--meter": `${cyclePercent}%` } as CSSProperties}><i /></div>
                <p className={styles.signalText}>{(hud.cycleRemainingMs / 1_000).toFixed(1)}s · BULLETS {hud.bullets}/{FINALE_BULLET_CAP}</p>
              </> : <div className={styles.statList}><span>공격 방식 <b>보스 직접 클릭</b></span><span>자동 공격 <b>없음</b></span><span>클릭 상한 <b>초당 8회</b></span></div>}
            </section>
          </aside>

          <div className={styles.arenaColumn}>
            <div ref={arenaRef} className={styles.arenaFrame}>
              <span className={styles.arenaLabel}><i /> {hud.mode === "field" ? "STAGE 10-3 · RECORD INTERRUPTION" : "NULL FIELD · FINALE"}</span>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                tabIndex={0}
                onPointerDown={handleArenaPointerDown}
                aria-label={hud.mode === "field" ? "화면의 기록 말소자를 직접 클릭해 공격하는 전장" : "WASD로 길드 건물을 움직이고 기록 말소자를 직접 클릭하는 탄막 전장"}
              />

              {scene === "intro" && <div className={styles.intro} role="dialog" aria-modal="true" aria-labelledby="finale-intro-title">
                <span className={styles.introCode}>STAGE 10-3 CLEAR // ARCHIVE ACCESS DENIED</span>
                <h1 id="finale-intro-title">기록 말소자 등장<em>엔딩을 되찾기 위한 마지막 결전</em></h1>
                <p>{mode === "preview" ? "첫 전투는 익숙한 방식입니다. 보스를 직접 클릭해 공격하세요. 필드가 무너지면 길드 본관을 WASD로 움직여 탄막을 피하고, 코어가 열릴 때 다시 클릭 공격을 몰아칩니다." : "10-3의 마지막 기록을 가로막은 관리자가 나타났습니다. 익숙한 필드에서 보스 문양을 직접 클릭해 공격하세요."}</p>
                <div className={styles.actionRow}><button className={styles.primaryAction} type="button" onClick={beginEncounter}>보스를 직접 공격한다</button><button className={styles.secondaryAction} type="button" onClick={onExit}>길드로 돌아가기</button></div>
              </div>}

              {scene === "running" && hud.mode === "field" && <div className={styles.clickGuide}><b>보스 문양을 직접 클릭</b><span>자동공격 없음 · ENTER 키도 공격 가능</span></div>}
              {scene === "running" && hud.mode === "bulletHell" && <div className={`${styles.cycleCallout} ${hud.cycle === "opening" ? styles.opening : ""}`}><b>{hud.cycle === "opening" ? "CORE OPEN" : "DODGE"}</b><span>{hud.cycle === "opening" ? "지금 클릭하면 피해 ×2" : "WASD 이동 · 닫힌 코어 피해 35%"}</span></div>}
              {hud.mode === "collapse" && <div className={styles.cinematicLabel}><strong>FIELD COLLAPSE</strong><span>전투 규칙을 재구성합니다</span></div>}
              {hud.mode === "destruction" && <div className={styles.cinematicLabel}><strong>CORE BREAK</strong><span>기록 말소자가 파괴되고 있습니다</span></div>}
              {scene === "running" && hud.mode === "whiteout" && <div className={styles.whiteout} aria-hidden="true"><span>FINAL RECORD RESTORED</span></div>}

              {scene === "paused" && <div className={styles.pauseCurtain}><strong>전투 일시정지</strong><small>P 또는 ESC로 계속</small><button className={styles.primaryAction} type="button" onClick={() => setScene("running")}>계속하기</button></div>}

              {(scene === "victory" || scene === "defeat") && <div className={`${styles.result} ${scene === "defeat" ? styles.defeatResult : ""}`} role="dialog" aria-modal="true">
                <span className={styles.resultCode}>{scene === "victory" ? "FINAL RECORD RESTORED" : "GUILD HALL SYNC LOST"}</span>
                <h2>{scene === "victory" ? <>최종 보스 격파<em>길드의 엔딩을 되찾았다</em></> : <>동기화 실패<em>이것은 게임 오버가 아닙니다</em></>}</h2>
                <p>{scene === "victory" ? `기록 말소자가 파괴되었습니다. 직접 공격 ${hud.clicksLanded}회, 근접 회피 ${hud.grazes}회를 기록했습니다.` : "Stage 10-3 완료와 저장 진행도는 안전합니다. 1페이즈를 반복하지 않고 2페이즈 시작점에서 바로 재시도합니다."}</p>
                <div className={styles.actionRow}>
                  {scene === "victory" ? <button className={styles.primaryAction} type="button" onClick={onVictory}>{mode === "preview" ? "시험 설정으로 돌아가기" : "엔딩 확정"}</button> : <button className={styles.primaryAction} type="button" onClick={retryPhaseTwo}>2페이즈 즉시 재시도</button>}
                  <button className={styles.secondaryAction} type="button" onClick={scene === "victory" && mode === "preview" ? restartAll : onExit}>{scene === "victory" && mode === "preview" ? "처음부터 다시 보기" : "길드로 돌아가기"}</button>
                </div>
              </div>}

              <div className={styles.touchControls} aria-label="터치 이동 패드">
                {(["up", "left", "focus", "right", "down"] as VirtualDirection[]).map((direction) => <button
                  key={direction}
                  type="button"
                  data-direction={direction}
                  aria-label={direction === "up" ? "위로 이동" : direction === "down" ? "아래로 이동" : direction === "left" ? "왼쪽으로 이동" : direction === "right" ? "오른쪽으로 이동" : "정밀 이동"}
                  onPointerDown={(event) => setVirtualDirection(direction, true, event)}
                  onPointerUp={(event) => setVirtualDirection(direction, false, event)}
                  onPointerCancel={(event) => setVirtualDirection(direction, false, event)}
                >{direction === "up" ? "▲" : direction === "down" ? "▼" : direction === "left" ? "◀" : direction === "right" ? "▶" : "FOCUS"}</button>)}
              </div>
            </div>

            {mode === "preview" && <div className={styles.quickTools} aria-label="개발자 장면 이동 도구"><span>DEV SCENE JUMP</span><div>{(["field", "collapse", "bulletHell", "destruction", "whiteout"] as FinaleMode[]).map((target) => <button className={styles.phaseButton} key={target} type="button" onClick={() => jumpToMode(target)}>{target}</button>)}<button className={styles.phaseButton} type="button" onClick={jumpToOpening}>CORE OPEN</button><button className={styles.phaseButton} type="button" onClick={forceDefeat}>DEFEAT</button><button className={styles.phaseButton} type="button" onClick={restartAll}>RESET</button></div></div>}
          </div>

          <aside className={styles.sidePanel} aria-label="결전 규칙과 조작">
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>NORMALIZED FINALE</span>
              <div className={styles.statList}>
                <span>반영 성장 <b>길드 본관 Lv.{loadout.hallLevel}</b></span>
                <span>클릭 피해 <b>{stats.clickDamage.toFixed(2)}</b></span>
                <span>무기·강화·파티 <b>초기화</b></span>
                <span>자동공격 <b>없음</b></span>
                <span>실제 피격점 <b>흰 점 {stats.hitRadius}px</b></span>
              </div>
            </section>
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>CONTROL CONTRACT</span>
              <div className={styles.controlHelp}>
                <span><kbd>CLICK</kbd><b>보스 직접 공격</b></span>
                <span><kbd>WASD</kbd><b>2페이즈 이동</b></span>
                <span><kbd>SHIFT</kbd><b>정밀 이동</b></span>
                <span><kbd>P / ESC</kbd><b>일시정지</b></span>
              </div>
            </section>
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>CURRENT SIGNAL</span>
              <div className={styles.patternName}><strong>{hud.patternName}</strong><span>안전 통로와 0.65초 예고를 보고 이동하세요. 제한시간과 광폭화는 없습니다.</span></div>
              <p className={styles.signalText}>SCORE {hud.score.toLocaleString("ko-KR")} · GRAZE {hud.grazes}</p>
            </section>
          </aside>
        </div>

        <footer className={styles.bottomRail}><span><strong>판정 안내</strong> 길드 건물 전체가 아니라 중앙의 선명한 흰 점만 실제 피격점입니다. 적탄은 건물 위에 표시됩니다.</span><span>ENDING EVENT BUILD · SEED {seed}</span></footer>
        <p className={styles.srOnly} aria-live="assertive">{announcement}</p>
      </section>
    </main>
  );
}

export default BulletHellFinale;
