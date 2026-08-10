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
  createFinaleWorld,
  deriveFinaleStats,
  FINALE_HEIGHT,
  FINALE_WIDTH,
  forceFinalePhase,
  updateFinaleWorld,
  type FinaleLoadout,
  type FinaleWorld,
} from "./engine";
import styles from "./BulletHellFinale.module.css";

const CAMPAIGN_REVEAL_MS = 2_450;
const PREVIEW_REVEAL_MS = 780;

const ENGINE_GUILD_BULLET_SOURCES = [
  "/assets/guild/forge/flame-forge-v1.png",
  "/assets/guild/research/guild-enhancement-institute-v1.png",
  "/assets/guild/tavern/wandering-mug-tavern-v1.png",
  "/assets/guild/hunting/hunting-ground-outpost-v2.png",
] as const;

const RENDER_SOURCES = [...new Set([
  ...FINALE_BULLET_ASSETS.map((asset) => asset.source),
  FINALE_GUILD_ATLAS.source,
  ...ENGINE_GUILD_BULLET_SOURCES,
  ...Object.values(FINALE_VFX_ASSETS),
])];

const BULLET_ASSET_BY_SOURCE = new Map(FINALE_BULLET_ASSETS.map((asset) => [asset.source, asset]));

type FinaleScene = "breach" | "running" | "paused" | "victory" | "defeat";
type VirtualDirection = "up" | "down" | "left" | "right" | "focus";

type HudSnapshot = {
  playerHp: number;
  playerMaxHp: number;
  shield: number;
  bossHp: number;
  bossMaxHp: number;
  phase: number;
  patternName: string;
  bullets: number;
  score: number;
  grazes: number;
  pulse: number;
  pulseCooldownMs: number;
  elapsedMs: number;
};

export type BulletHellFinaleProps = {
  loadout: FinaleLoadout;
  mode: "campaign" | "preview";
  seed?: number;
  onExit: () => void;
  onVictory: () => void;
  onLoadoutChange?: (next: FinaleLoadout) => void;
};

function snapshotFromWorld(world: FinaleWorld): HudSnapshot {
  return {
    playerHp: world.player.hp,
    playerMaxHp: world.player.maxHp,
    shield: world.player.shield,
    bossHp: world.boss.hp,
    bossMaxHp: world.boss.maxHp,
    phase: world.boss.phase,
    patternName: world.patternName,
    bullets: world.bullets.length,
    score: world.score,
    grazes: world.grazes,
    pulse: world.pulseRadius,
    pulseCooldownMs: world.pulseState.cooldownMs,
    elapsedMs: world.elapsedMs,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
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

function drawArenaBackground(context: CanvasRenderingContext2D, world: FinaleWorld) {
  const seconds = world.elapsedMs / 1000;
  const gradient = context.createRadialGradient(FINALE_WIDTH / 2, 90, 30, FINALE_WIDTH / 2, FINALE_HEIGHT / 2, 650);
  gradient.addColorStop(0, world.boss.phase >= 3 ? "#2d1028" : "#10253b");
  gradient.addColorStop(.5, "#07101a");
  gradient.addColorStop(1, "#020408");
  context.fillStyle = gradient;
  context.fillRect(0, 0, FINALE_WIDTH, FINALE_HEIGHT);

  context.save();
  context.globalAlpha = .2;
  context.strokeStyle = world.boss.phase >= 3 ? "#d84486" : "#3dcbd8";
  context.lineWidth = 1;
  const gridOffset = seconds * 18 % 40;
  for (let x = -40 + gridOffset; x < FINALE_WIDTH + 40; x += 40) {
    context.beginPath();
    context.moveTo(FINALE_WIDTH / 2 + (x - FINALE_WIDTH / 2) * .22, 150);
    context.lineTo(x, FINALE_HEIGHT);
    context.stroke();
  }
  for (let y = 180; y < FINALE_HEIGHT + 60; y += 40) {
    const perspective = (y - 150) / (FINALE_HEIGHT - 150);
    context.globalAlpha = .06 + perspective * .18;
    context.beginPath();
    context.moveTo(0, y + gridOffset * perspective);
    context.lineTo(FINALE_WIDTH, y + gridOffset * perspective);
    context.stroke();
  }
  context.restore();

  context.save();
  context.font = "700 11px ui-monospace, monospace";
  context.fillStyle = "rgba(113,235,243,.13)";
  const fragments = ["SAVE_STATE", "MERGE_CONFLICT", "ASSET://37", "CONTEXT_OVERFLOW", "FINAL_ANSWER"];
  fragments.forEach((fragment, index) => {
    const x = 38 + (index * 193 + Math.floor(seconds * 17)) % 840;
    const y = 205 + index * 74;
    context.fillText(fragment, x, y);
  });
  context.restore();
}

function drawGlitchBoss(context: CanvasRenderingContext2D, world: FinaleWorld) {
  const { x, y, hp, maxHp, phase } = world.boss;
  const seconds = world.elapsedMs / 1000;
  const pulse = 1 + Math.sin(seconds * 4.2) * .035;
  const phaseColor = phase >= 4 ? "#ff526a" : phase >= 3 ? "#ff4dac" : phase >= 2 ? "#9873ff" : "#62eff8";

  context.save();
  context.translate(x, y);
  context.scale(pulse, pulse);

  const aura = context.createRadialGradient(0, 0, 8, 0, 0, 103);
  aura.addColorStop(0, `${phaseColor}66`);
  aura.addColorStop(.48, `${phaseColor}18`);
  aura.addColorStop(1, "transparent");
  context.fillStyle = aura;
  context.fillRect(-112, -112, 224, 224);

  context.save();
  context.rotate(seconds * .22);
  context.strokeStyle = `${phaseColor}8f`;
  context.setLineDash([7, 8]);
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, 74, 0, Math.PI * 2);
  context.stroke();
  context.rotate(-seconds * .58);
  context.strokeStyle = "rgba(235,247,255,.28)";
  context.beginPath();
  context.arc(0, 0, 59, 0, Math.PI * 1.45);
  context.stroke();
  context.restore();

  context.save();
  context.translate(phase >= 3 && Math.floor(seconds * 13) % 7 === 0 ? 5 : 0, 0);
  drawHexagon(context, 48);
  context.fillStyle = "rgba(4,7,14,.94)";
  context.fill();
  context.strokeStyle = phaseColor;
  context.lineWidth = 2.5;
  context.stroke();
  drawHexagon(context, 39);
  context.strokeStyle = "rgba(216,246,255,.28)";
  context.lineWidth = 1;
  context.stroke();
  context.restore();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 20px ui-monospace, monospace";
  context.shadowColor = phaseColor;
  context.shadowBlur = 14;
  context.fillStyle = "#ecffff";
  context.fillText(phase >= 4 ? "ERR" : ">_", 0, -1);
  context.shadowBlur = 0;
  context.font = "800 7px ui-monospace, monospace";
  context.fillStyle = phaseColor;
  context.fillText(`P${phase} // ${Math.ceil(hp / maxHp * 100)}%`, 0, 26);

  context.globalAlpha = .74;
  context.fillStyle = phaseColor;
  for (let index = 0; index < 7; index += 1) {
    const offset = ((index * 37 + Math.floor(seconds * 42)) % 116) - 58;
    const width = 6 + (index * 11) % 24;
    context.fillRect(offset, -57 + index * 18, width, 2 + index % 2);
  }
  context.restore();
}

function drawBullet(
  context: CanvasRenderingContext2D,
  bullet: FinaleWorld["bullets"][number],
  images: Map<string, HTMLImageElement>,
) {
  const manifestAsset = BULLET_ASSET_BY_SOURCE.get(bullet.asset) ?? finaleBulletAsset(bullet.spriteIndex);
  const image = images.get(bullet.asset) ?? images.get(manifestAsset.source);
  const kind = bullet.kind === "guild" ? "boss" : manifestAsset.kind;
  const visibleRadius = Math.max(manifestAsset.radius * 1.75, bullet.radius * (kind === "boss" ? 2.3 : 1.9));

  context.save();
  context.translate(bullet.x, bullet.y);
  context.rotate(bullet.rotation);
  context.shadowColor = kind === "upgrade" ? "#57edf5" : kind === "weapon" ? "#f153a3" : "#ff675f";
  context.shadowBlur = kind === "boss" ? 13 : 8;
  if (image?.complete && image.naturalWidth > 0) {
    context.drawImage(image, -visibleRadius, -visibleRadius, visibleRadius * 2, visibleRadius * 2);
  } else {
    context.fillStyle = context.shadowColor;
    context.beginPath();
    context.arc(0, 0, bullet.radius, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;
  context.globalAlpha = .55;
  context.strokeStyle = "#f4ffff";
  context.lineWidth = .75;
  context.beginPath();
  context.arc(0, 0, bullet.radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawPlayerShot(context: CanvasRenderingContext2D, shot: FinaleWorld["shots"][number]) {
  context.save();
  context.translate(shot.x, shot.y);
  context.rotate(Math.atan2(shot.vy, shot.vx) + Math.PI / 2);
  const gradient = context.createLinearGradient(0, 11, 0, -14);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(.48, shot.critical ? "#fff1a4" : "#6ef7ff");
  gradient.addColorStop(1, "#ffffff");
  context.fillStyle = gradient;
  context.shadowColor = shot.critical ? "#ffd969" : "#53edf5";
  context.shadowBlur = shot.critical ? 13 : 7;
  context.beginPath();
  context.moveTo(0, -14);
  context.lineTo(3.5, 10);
  context.lineTo(-3.5, 10);
  context.closePath();
  context.fill();
  context.restore();
}

function drawGuildPlayer(
  context: CanvasRenderingContext2D,
  world: FinaleWorld,
  loadout: FinaleLoadout,
  images: Map<string, HTMLImageElement>,
  focusHeld: boolean,
) {
  const player = world.player;
  const atlas = images.get(FINALE_GUILD_ATLAS.source);
  const frame = clamp(Math.round(loadout.hallLevel), 1, 6) - 1;
  const column = frame % FINALE_GUILD_ATLAS.columns;
  const row = Math.floor(frame / FINALE_GUILD_ATLAS.columns);
  const blink = player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 75) % 2 === 0;
  const size = 116;

  context.save();
  context.translate(player.x, player.y);
  context.globalAlpha = blink ? .34 : 1;
  context.shadowColor = player.shield > 0 ? "#62f5ff" : "#e7aa50";
  context.shadowBlur = player.shield > 0 ? 22 : 13;
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
    context.fillStyle = "#ad6d36";
    context.fillRect(-32, -23, 64, 46);
  }
  context.shadowBlur = 0;

  const droneCount = Math.max(0, Math.min(3, loadout.partySize - 1));
  for (let index = 0; index < droneCount; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const tier = Math.floor(index / 2);
    context.fillStyle = "rgba(103,238,244,.88)";
    context.strokeStyle = "rgba(225,255,255,.78)";
    context.lineWidth = 1;
    drawHexagon(context, 7);
    context.save();
    context.translate(side * (53 + tier * 11), 7 + tier * 17);
    drawHexagon(context, 7);
    context.fill();
    context.stroke();
    context.restore();
  }

  context.globalAlpha = 1;
  context.fillStyle = focusHeld ? "#ff557b" : "#f9ffff";
  context.shadowColor = focusHeld ? "#ff557b" : "#61edf7";
  context.shadowBlur = 10;
  context.beginPath();
  context.arc(0, 5, world.stats.hitRadius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  if (player.shield > 0) {
    context.strokeStyle = "rgba(99,241,252,.68)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(0, 2, 48 + Math.sin(world.elapsedMs / 130) * 2, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function drawWorld(
  context: CanvasRenderingContext2D,
  world: FinaleWorld,
  loadout: FinaleLoadout,
  images: Map<string, HTMLImageElement>,
  focusHeld: boolean,
) {
  drawArenaBackground(context, world);

  if (world.pulseRadius > 0) {
    context.save();
    context.strokeStyle = `rgba(99,244,255,${clamp(1 - world.pulseRadius / 260, .08, .72)})`;
    context.lineWidth = 4;
    context.shadowColor = "#5cf3ff";
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(world.player.x, world.player.y, world.pulseRadius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  drawGlitchBoss(context, world);
  world.shots.forEach((shot) => drawPlayerShot(context, shot));
  world.bullets.forEach((bullet) => drawBullet(context, bullet, images));
  drawGuildPlayer(context, world, loadout, images, focusHeld);

  context.save();
  context.strokeStyle = "rgba(113,235,243,.22)";
  context.lineWidth = 1;
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
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const lastHudRef = useRef(0);
  const resultSoundRef = useRef<"victory" | "defeat" | null>(null);
  const [scene, setScene] = useState<FinaleScene>("breach");
  const [hud, setHud] = useState(() => snapshotFromWorld(initialWorld));
  const [announcement, setAnnouncement] = useState("최종 원정 기록이 손상되었습니다. 장르 전환을 시작합니다.");
  const stats = useMemo(() => deriveFinaleStats(loadout), [loadout]);
  const bossPercent = hud.bossMaxHp ? clamp(hud.bossHp / hud.bossMaxHp * 100, 0, 100) : 0;
  const pulsePercent = Number.isFinite(stats.pulseCooldownMs)
    ? clamp((1 - hud.pulseCooldownMs / Math.max(1, stats.pulseCooldownMs)) * 100, 0, 100)
    : 0;

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
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(width / FINALE_WIDTH, 0, 0, height / FINALE_HEIGHT, 0, 0);
    context.imageSmoothingEnabled = true;
    drawWorld(context, worldRef.current, loadout, imagesRef.current, keysRef.current.has("shift") || virtualRef.current.has("focus"));
  }, [loadout]);

  useEffect(() => {
    let cancelled = false;
    RENDER_SOURCES.forEach((source) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = source;
      image.addEventListener("load", () => {
        if (!cancelled) {
          imagesRef.current.set(source, image);
          resizeCanvas();
        }
      }, { once: true });
    });
    return () => { cancelled = true; };
  }, [resizeCanvas]);

  useEffect(() => {
    const observer = new ResizeObserver(resizeCanvas);
    if (arenaRef.current) observer.observe(arenaRef.current);
    resizeCanvas();
    return () => observer.disconnect();
  }, [resizeCanvas]);

  const beginEncounter = useCallback(() => {
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
    setAnnouncement("CODEX NULL 교전 개시. WASD 또는 방향키로 길드 건물을 이동하세요.");
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (scene !== "breach") return;
    const timer = window.setTimeout(beginEncounter, mode === "preview" ? PREVIEW_REVEAL_MS : CAMPAIGN_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [beginEncounter, mode, scene]);

  useEffect(() => {
    const movementKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"]);
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (movementKeys.has(key)) {
        event.preventDefault();
        keysRef.current.add(key);
      }
      if ((key === "p" || key === "escape") && !event.repeat) {
        event.preventDefault();
        setScene((current) => current === "running" ? "paused" : current === "paused" ? "running" : current);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
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
  }, []);

  useEffect(() => {
    if (scene !== "running") return;
    lastFrameRef.current = performance.now();

    const animate = (timestamp: number) => {
      const canvas = canvasRef.current;
      let world = worldRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;

      const elapsed = Math.min(50, Math.max(0, timestamp - lastFrameRef.current));
      lastFrameRef.current = timestamp;

      const pressed = keysRef.current;
      const virtual = virtualRef.current;
      const horizontal = (pressed.has("d") || pressed.has("arrowright") || virtual.has("right") ? 1 : 0)
        - (pressed.has("a") || pressed.has("arrowleft") || virtual.has("left") ? 1 : 0);
      const vertical = (pressed.has("s") || pressed.has("arrowdown") || virtual.has("down") ? 1 : 0)
        - (pressed.has("w") || pressed.has("arrowup") || virtual.has("up") ? 1 : 0);
      const focus = pressed.has("shift") || virtual.has("focus");
      world = updateFinaleWorld(world, { x: horizontal, y: vertical, focus }, elapsed);
      worldRef.current = world;
      const playerHit = world.playerHit;
      const phaseChanged = world.phaseChanged;
      const pulse = world.pulse;

      context.setTransform(canvas.width / FINALE_WIDTH, 0, 0, canvas.height / FINALE_HEIGHT, 0, 0);
      drawWorld(context, world, loadout, imagesRef.current, focus);

      if (playerHit) {
        playMonsterHitSound(4, 1);
        setAnnouncement(world.player.shield > 0 ? "금고 장갑이 데이터 탄환을 차단했습니다." : `길드 본관 피격. 내구도 ${world.player.hp}/${world.player.maxHp}.`);
      }
      if (pulse) playCombatProcSound({ shockwave: true });
      if (phaseChanged) {
        playCombatProcSound({ momentumMaxed: true });
        setAnnouncement(`보스 패턴 변경. ${world.patternName}.`);
      }

      if (timestamp - lastHudRef.current >= 90) {
        lastHudRef.current = timestamp;
        setHud(snapshotFromWorld(world));
      }

      if (world.status === "victory") {
        if (resultSoundRef.current !== "victory") {
          resultSoundRef.current = "victory";
          playCombatProcSound({ execution: true });
          playStageClearSound(true);
        }
        setHud(snapshotFromWorld(world));
        setAnnouncement("CODEX NULL 코어가 소거되었습니다. 마지막 기록을 확보했습니다.");
        setScene("victory");
        return;
      }
      if (world.status === "defeat") {
        if (resultSoundRef.current !== "defeat") {
          resultSoundRef.current = "defeat";
          playExpeditionFailSound();
        }
        setHud(snapshotFromWorld(world));
        setAnnouncement("길드 본관 동기화가 끊겼습니다. 재시도가 가능합니다.");
        setScene("defeat");
        return;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [loadout, scene]);

  const restart = useCallback(() => {
    worldRef.current = createFinaleWorld(loadout, { preview: mode === "preview", seed });
    resultSoundRef.current = null;
    setHud(snapshotFromWorld(worldRef.current));
    setAnnouncement("글리치 코어 재동기화. 교전을 다시 시작합니다.");
    unlockBattleAudio();
    playExpeditionStartSound(true);
    setScene("running");
  }, [loadout, mode, seed]);

  const jumpToPhase = (phase: number) => {
    worldRef.current = forceFinalePhase(worldRef.current, phase);
    setHud(snapshotFromWorld(worldRef.current));
    setAnnouncement(`개발자 패턴 점프: PHASE ${phase}.`);
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  };

  const setVirtualDirection = (direction: VirtualDirection, active: boolean, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
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
  const phaseCount = 4;
  const timeText = `${Math.floor(hud.elapsedMs / 60_000).toString().padStart(2, "0")}:${Math.floor(hud.elapsedMs / 1000 % 60).toString().padStart(2, "0")}`;

  return (
    <main className={`game-shell battle-mode ${mode === "preview" ? "developer-mode" : ""} ${styles.shell}`} data-finale-scene={scene}>
      <section className={`field-screen ${styles.screen}`} role="application" aria-label="글리치 보스 탄막 피날레">
        <div className={`battle-banner ${styles.bossMarker}`}><span>BOSS // GENRE OVERRIDE</span></div>
        <header className={styles.topHud}>
          <div className={styles.identity}>
            <small>PLAYER OBJECT // GUILD HALL</small>
            <strong>움직이는 길드 성채 · Lv.{loadout.hallLevel}</strong>
            <span>WEAPON TIER {loadout.weaponLevel + 1} · PARTY {loadout.partySize}</span>
          </div>
          <div className={styles.bossReadout}>
            <small>UNAUTHORIZED FINAL BOSS</small>
            <strong>CODEX NULL // THE GLITCH ARCHIVIST</strong>
            <em>PHASE {hud.phase}</em>
            <div className={styles.bossBar} style={{ "--boss-hp": `${bossPercent}%` } as CSSProperties}><i /></div>
          </div>
          <div className={styles.scoreBlock}>
            <small>SCORE // ARCHIVE RECOVERY</small>
            <strong>{Math.round(hud.score).toLocaleString("ko-KR")}</strong>
            <span>{timeText} · GRAZE {hud.grazes}</span>
          </div>
        </header>

        <div className={styles.battleGrid}>
          <aside className={styles.sidePanel} aria-label="길드 성채 상태">
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>GUILD HULL</span>
              <div className={styles.hullRow} aria-label={`내구도 ${hud.playerHp}/${hud.playerMaxHp}`}>
                {hullCells.map((active, index) => <i key={index} className={`${styles.hullCell} ${active ? styles.active : ""}`} />)}
              </div>
              <div className={styles.shieldLine}><span>금고 장갑 <b>{hud.shield} CHARGE</b></span></div>
              <div className={styles.meterLine}>
                <span>자동 충격파 <b>{Number.isFinite(stats.pulseCooldownMs) ? `${(stats.pulseCooldownMs / 1000).toFixed(1)}s` : "LOCK"}</b></span>
                <div className={styles.meter} style={{ "--meter": `${pulsePercent}%` } as CSSProperties}><i /></div>
              </div>
            </section>
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>INCOMING PACKET</span>
              <div className={styles.patternName}><strong>{hud.patternName}</strong><span>보스가 게임의 무기·강화·몬스터 에셋을 탄환 데이터로 던집니다.</span></div>
              <div className={styles.patternIndex}>{Array.from({ length: phaseCount }, (_, index) => <i key={index} className={index + 1 <= hud.phase ? styles.active : ""} />)}</div>
              <p className={styles.signalText}>LIVE OBJECTS {hud.bullets}/480</p>
            </section>
          </aside>

          <div className={styles.arenaColumn}>
            <div ref={arenaRef} className={styles.arenaFrame}>
              <span className={styles.arenaLabel}><i /> LIVE · DETERMINISTIC SIMULATION</span>
              <canvas ref={canvasRef} className={styles.canvas} tabIndex={0} aria-label="WASD로 길드 건물을 움직여 에셋 탄막을 피하는 전장" />

              {scene === "breach" && <div className={styles.intro} role="dialog" aria-modal="true" aria-labelledby="genre-override-title">
                <span className={styles.introCode}>FINAL STAGE CLEAR // RESPONSE CORRUPTED</span>
                <h1 id="genre-override-title">GENRE OVERRIDE<em>CLICKER → BULLET HELL</em></h1>
                <p>“마지막 기록은 제가 검수하겠습니다.” 길드 전체가 하나의 플레이어 기체로 재해석됩니다. 지금까지 쌓은 강화가 생존·사격 능력으로 변환됩니다.</p>
                <div className={styles.actionRow}><button className={styles.primaryAction} type="button" onClick={beginEncounter}>WASD · 즉시 교전</button><button className={styles.secondaryAction} type="button" onClick={onExit}>연결 끊기</button></div>
              </div>}

              {scene === "paused" && <div className={styles.pauseCurtain}><strong>SIMULATION PAUSED</strong><small>P 또는 ESC로 계속</small><button className={styles.primaryAction} type="button" onClick={() => setScene("running")}>계속하기</button></div>}

              {(scene === "victory" || scene === "defeat") && <div className={styles.result} role="dialog" aria-modal="true">
                <span className={styles.resultCode}>{scene === "victory" ? "CORE MERGED // FINAL RECORD RESTORED" : "SYNC LOST // GUILD HALL OFFLINE"}</span>
                <h2>{scene === "victory" ? <>FINAL ANSWER<em>당신의 길드는 삭제되지 않았다</em></> : <>CONTEXT LOST<em>성채 동기화 실패</em></>}</h2>
                <p>{scene === "victory" ? `CODEX NULL이 붕괴했습니다. ${Math.round(hud.score).toLocaleString("ko-KR")}점 · 근접 회피 ${hud.grazes}회를 기록했습니다.` : "저장 진행도는 안전합니다. 같은 성장값과 패턴 시드로 즉시 다시 도전할 수 있습니다."}</p>
                <div className={styles.actionRow}>
                  {scene === "victory" ? <button className={styles.primaryAction} type="button" onClick={onVictory}>{mode === "preview" ? "시험 설정으로 돌아가기" : "새 마지막 기록 확정"}</button> : <button className={styles.primaryAction} type="button" onClick={restart}>즉시 재동기화</button>}
                  <button className={styles.secondaryAction} type="button" onClick={scene === "victory" ? restart : onExit}>{scene === "victory" ? "다시 싸우기" : "길드 영지로 귀환"}</button>
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

            {mode === "preview" && <div className={styles.quickTools} aria-label="개발자 패턴 이동 도구"><span>DEV PATTERN JUMP</span><div>{Array.from({ length: phaseCount }, (_, index) => <button className={styles.phaseButton} key={index} type="button" onClick={() => jumpToPhase(index + 1)}>PHASE {index + 1}</button>)}<button className={styles.phaseButton} type="button" onClick={restart}>RESET</button></div></div>}
          </div>

          <aside className={styles.sidePanel} aria-label="피날레 변환 능력치">
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>UPGRADE TRANSLATION</span>
              <div className={styles.statList}>
                <span>자동 사격 <b>{stats.shotDamage.toFixed(1)} DMG</b></span>
                <span>발사 주기 <b>{stats.shotIntervalMs}ms</b></span>
                <span>사격 열 <b>{stats.shotCount} + {stats.droneCount}</b></span>
                <span>치명 확률 <b>{Math.round(stats.criticalChance * 100)}%</b></span>
                <span>이동 속도 <b>{Math.round(stats.moveSpeed)}</b></span>
                <span>실제 피격점 <b>{stats.hitRadius.toFixed(1)}px</b></span>
                <span>점수 배율 <b>×{stats.scoreMultiplier.toFixed(2)}</b></span>
              </div>
            </section>
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>CONTROL CONTRACT</span>
              <div className={styles.controlHelp}>
                <span><kbd>WASD</kbd><b>성채 이동</b></span>
                <span><kbd>ARROW</kbd><b>대체 이동</b></span>
                <span><kbd>SHIFT</kbd><b>정밀 이동</b></span>
                <span><kbd>P / ESC</kbd><b>일시정지</b></span>
              </div>
            </section>
            <section className={styles.dataCard}>
              <span className={styles.sectionLabel}>DODGE TELEMETRY</span>
              <div className={styles.statList}><span>근접 회피 <b>{hud.grazes}</b></span><span>적탄 수 <b>{hud.bullets}</b></span><span>경과 시간 <b>{timeText}</b></span></div>
            </section>
          </aside>
        </div>

        <footer className={styles.bottomRail}><span><strong>TIP</strong> 보이는 건물 전체가 아니라 중앙의 작은 빛만 피격됩니다. SHIFT를 누르면 빛이 붉게 표시됩니다.</span><span>ASSET BARRAGE BUILD · SEED {seed}</span></footer>
        <p className={styles.srOnly} aria-live="assertive">{announcement}</p>
      </section>
    </main>
  );
}

export default BulletHellFinale;
