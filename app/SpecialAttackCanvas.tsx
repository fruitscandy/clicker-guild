"use client";

import { useEffect, useRef } from "react";
import type { SpecialAttackKind } from "./special-attacks";

type Point = { x: number; y: number };
type LightningBranch = { points: Point[]; delay: number };
type LightningSpark = { angle: number; delay: number; distance: number; size: number };
type TornadoParticle = {
  angle: number;
  height: number;
  radiusScale: number;
  speed: number;
  thickness: number;
  brightness: number;
};
type TornadoInflow = { angle: number; delay: number; radius: number; speed: number; width: number };
type TornadoDebris = { angle: number; height: number; radiusScale: number; speed: number; size: number };
type MeteorParticle = {
  angle: number;
  delay: number;
  speed: number;
  size: number;
  gravity: number;
  life: number;
};
type MeteorSmoke = { angle: number; delay: number; distance: number; rise: number; size: number; life: number };

type LightningModel = {
  bolt: Point[];
  branches: LightningBranch[];
  groundBranches: LightningBranch[];
  sparks: LightningSpark[];
};

type TornadoModel = {
  particles: TornadoParticle[];
  inflow: TornadoInflow[];
  debris: TornadoDebris[];
};

type MeteorModel = {
  fire: MeteorParticle[];
  fragments: MeteorParticle[];
  sparks: MeteorParticle[];
  smoke: MeteorSmoke[];
  rockShape: number[];
};

type Props = {
  kind: SpecialAttackKind;
  width: number;
  height: number;
  durationMs: number;
  impactAtMs: number;
  className?: string;
};

const TAU = Math.PI * 2;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function smoothstep(from: number, to: number, value: number) {
  const amount = clamp((value - from) / Math.max(0.0001, to - from));
  return amount * amount * (3 - 2 * amount);
}

function easeInCubic(value: number) {
  return value * value * value;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return mix(minimum, maximum, random());
}

function partialPoints(points: readonly Point[], progress: number) {
  if (points.length < 2 || progress <= 0) return [];
  if (progress >= 1) return [...points];
  const scaled = progress * (points.length - 1);
  const complete = Math.floor(scaled);
  const result = points.slice(0, complete + 1);
  const next = points[Math.min(points.length - 1, complete + 1)];
  const current = points[complete];
  result.push({ x: mix(current.x, next.x, scaled - complete), y: mix(current.y, next.y, scaled - complete) });
  return result;
}

function strokePolyline(context: CanvasRenderingContext2D, points: readonly Point[], progress: number, color: string, width: number, blur: number) {
  const visible = partialPoints(points, progress);
  if (visible.length < 2) return;
  context.save();
  context.beginPath();
  context.moveTo(visible[0].x, visible[0].y);
  visible.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = color;
  context.lineWidth = width;
  context.shadowColor = color;
  context.shadowBlur = blur;
  context.stroke();
  context.restore();
}

function createLightningModel(width: number, height: number, random: () => number): LightningModel {
  const centerX = width / 2;
  const groundY = height - 66;
  const bolt: Point[] = [{ x: centerX + randomBetween(random, -54, 54), y: -18 }];
  let x = bolt[0].x;
  const boltSegments = 28;
  for (let index = 1; index <= boltSegments; index += 1) {
    const remaining = boltSegments - index;
    const pullToCenter = (centerX - x) / Math.max(1, remaining);
    x = clamp(x + pullToCenter + randomBetween(random, -34, 34), 34, width - 34);
    if (index === boltSegments) x = centerX;
    bolt.push({ x, y: mix(-18, groundY, index / boltSegments) });
  }

  const branches: LightningBranch[] = [];
  [4, 8, 11, 15, 19, 22, 25].forEach((boltIndex, index) => {
    const origin = bolt[boltIndex];
    const direction = index % 2 === 0 ? -1 : 1;
    const points = [origin];
    let branchX = origin.x;
    let branchY = origin.y;
    for (let segment = 0; segment < 4 + index % 2; segment += 1) {
      branchX += direction * randomBetween(random, 24, 52);
      branchY += randomBetween(random, 12, 34);
      points.push({ x: branchX, y: branchY });
    }
    branches.push({ points, delay: index * 0.018 });
  });

  const groundBranches: LightningBranch[] = Array.from({ length: 20 }, (_, index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    const distance = randomBetween(random, 86, 224);
    const segments = 6 + Math.floor(random() * 5);
    const points: Point[] = [{ x: centerX, y: groundY }];
    let groundX = centerX;
    let groundYPosition = groundY;
    for (let segment = 1; segment <= segments; segment += 1) {
      groundX += direction * distance / segments * randomBetween(random, 0.72, 1.34);
      groundYPosition += randomBetween(random, -9, 9);
      points.push({ x: groundX, y: groundYPosition });
    }
    return { points, delay: index * 0.012 + randomBetween(random, 0, 0.07) };
  });

  const sparks = Array.from({ length: 44 }, () => ({
    angle: randomBetween(random, Math.PI * 1.05, Math.PI * 1.95),
    delay: randomBetween(random, 0, 240),
    distance: randomBetween(random, 48, 210),
    size: randomBetween(random, 1, 3.6),
  }));

  return { bolt, branches, groundBranches, sparks };
}

function drawLightning(context: CanvasRenderingContext2D, model: LightningModel, width: number, height: number, elapsedMs: number, durationMs: number) {
  const progress = clamp(elapsedMs / durationMs);
  const centerX = width / 2;
  const groundY = height - 66;
  const trace = smoothstep(0.05, 0.34, progress);
  const boltFade = 1 - smoothstep(0.58, 0.82, progress);
  const flicker = 0.72 + Math.sin(elapsedMs * 0.095) * 0.18 + Math.sin(elapsedMs * 0.173) * 0.1;

  context.save();
  context.globalCompositeOperation = "lighter";
  context.globalAlpha = clamp(boltFade * flicker);
  strokePolyline(context, model.bolt, trace, "rgba(56, 137, 255, .6)", 11, 23);
  strokePolyline(context, model.bolt, trace, "rgba(172, 232, 255, .88)", 4.2, 12);
  strokePolyline(context, model.bolt, trace, "rgba(255, 255, 255, .98)", 1.35, 6);

  model.branches.forEach((branch) => {
    const branchProgress = smoothstep(0.2 + branch.delay, 0.48 + branch.delay, progress);
    strokePolyline(context, branch.points, branchProgress, "rgba(102, 194, 255, .62)", 3.6, 11);
    strokePolyline(context, branch.points, branchProgress, "rgba(235, 252, 255, .9)", 0.9, 5);
  });
  context.restore();

  const groundProgress = smoothstep(0.31, 0.7, progress);
  const groundFade = 1 - smoothstep(0.74, 1, progress);
  if (groundProgress > 0) {
    context.save();
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = groundFade;

    const glow = context.createRadialGradient(centerX, groundY, 4, centerX, groundY, 210 * groundProgress);
    glow.addColorStop(0, "rgba(255, 255, 255, .95)");
    glow.addColorStop(0.14, "rgba(104, 215, 255, .55)");
    glow.addColorStop(0.48, "rgba(38, 112, 255, .15)");
    glow.addColorStop(1, "rgba(16, 66, 200, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.ellipse(centerX, groundY, 230 * groundProgress, 78 * groundProgress, 0, 0, TAU);
    context.fill();

    model.groundBranches.forEach((branch, index) => {
      const spread = smoothstep(0.3 + branch.delay, 0.63 + branch.delay, progress);
      const pulse = 0.68 + Math.sin(elapsedMs * 0.06 + index * 1.7) * 0.32;
      strokePolyline(context, branch.points, spread, `rgba(54, 156, 255, ${0.55 * pulse})`, 5.6, 15);
      strokePolyline(context, branch.points, spread, `rgba(221, 249, 255, ${0.9 * pulse})`, 1.25, 6);
    });

    context.strokeStyle = `rgba(126, 227, 255, ${0.82 * groundFade})`;
    context.lineWidth = 2.2;
    context.shadowColor = "#5fc9ff";
    context.shadowBlur = 12;
    context.beginPath();
    context.ellipse(centerX, groundY, 208 * groundProgress, 52 * groundProgress, 0, 0, TAU);
    context.stroke();
    context.restore();
  }

  model.sparks.forEach((spark) => {
    const sparkAge = (elapsedMs - durationMs * 0.34 - spark.delay) / 520;
    if (sparkAge <= 0 || sparkAge >= 1) return;
    const distance = spark.distance * easeOutCubic(sparkAge);
    const x = centerX + Math.cos(spark.angle) * distance;
    const y = groundY + Math.sin(spark.angle) * distance * 0.36 - Math.sin(sparkAge * Math.PI) * 52;
    context.save();
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 1 - sparkAge;
    context.fillStyle = spark.size > 2.4 ? "#ffffff" : "#6edaff";
    context.shadowColor = "#39aaff";
    context.shadowBlur = 9;
    context.beginPath();
    context.arc(x, y, spark.size * (1 - sparkAge * 0.45), 0, TAU);
    context.fill();
    context.restore();
  });
}

function createTornadoModel(random: () => number): TornadoModel {
  const particles = Array.from({ length: 250 }, () => ({
    angle: randomBetween(random, 0, TAU),
    height: randomBetween(random, 0.02, 1),
    radiusScale: randomBetween(random, 0.72, 1.24),
    speed: randomBetween(random, 2.4, 6.8),
    thickness: randomBetween(random, 0.65, 2.8),
    brightness: randomBetween(random, 0.38, 1),
  }));
  const inflow = Array.from({ length: 92 }, () => ({
    angle: randomBetween(random, 0, TAU),
    delay: randomBetween(random, 0, 0.86),
    radius: randomBetween(random, 220, 430),
    speed: randomBetween(random, 2.2, 5.1),
    width: randomBetween(random, 0.7, 2.3),
  }));
  const debris = Array.from({ length: 42 }, () => ({
    angle: randomBetween(random, 0, TAU),
    height: randomBetween(random, 0.04, 0.92),
    radiusScale: randomBetween(random, 0.72, 1.18),
    speed: randomBetween(random, 1.8, 4.8),
    size: randomBetween(random, 2.2, 6.8),
  }));
  return { particles, inflow, debris };
}

function drawTornado(context: CanvasRenderingContext2D, model: TornadoModel, width: number, height: number, elapsedMs: number, durationMs: number) {
  const progress = clamp(elapsedMs / durationMs);
  const seconds = elapsedMs / 1_000;
  const centerX = width / 2;
  const groundY = height - 44;
  const build = smoothstep(0.05, 0.33, progress);
  const fade = 1 - smoothstep(0.82, 1, progress);
  const strength = build * fade;

  context.save();
  context.globalCompositeOperation = "source-over";
  const body = context.createLinearGradient(centerX, groundY - 370, centerX, groundY);
  body.addColorStop(0, `rgba(24, 88, 83, ${0.19 * strength})`);
  body.addColorStop(0.45, `rgba(42, 151, 135, ${0.15 * strength})`);
  body.addColorStop(1, `rgba(176, 243, 218, ${0.08 * strength})`);
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(centerX - 190 * build, groundY - 360 * build);
  context.bezierCurveTo(centerX - 128 * build, groundY - 220 * build, centerX - 56 * build, groundY - 94, centerX - 18, groundY);
  context.lineTo(centerX + 18, groundY);
  context.bezierCurveTo(centerX + 56 * build, groundY - 94, centerX + 128 * build, groundY - 220 * build, centerX + 190 * build, groundY - 360 * build);
  context.closePath();
  context.fill();
  context.restore();

  context.save();
  context.globalCompositeOperation = "source-over";
  context.filter = "blur(6px)";
  context.lineCap = "round";
  model.particles.forEach((particle, index) => {
    if (index % 2 !== 0) return;
    const heightRatio = particle.height * build;
    const radius = (18 + heightRatio ** 1.42 * 186) * particle.radiusScale * build;
    const angle = particle.angle + seconds * particle.speed * (1.16 - particle.height * 0.28);
    const previousAngle = angle - 0.16 * particle.speed;
    const x = centerX + Math.cos(angle) * radius;
    const y = groundY - heightRatio * 368 + Math.sin(angle) * radius * 0.17;
    const previousX = centerX + Math.cos(previousAngle) * radius;
    const previousY = groundY - heightRatio * 368 + Math.sin(previousAngle) * radius * 0.17;
    context.globalAlpha = strength * (0.045 + particle.brightness * 0.055);
    context.strokeStyle = particle.height > 0.52 ? "#2ca891" : "#a4ead8";
    context.lineWidth = 8 + heightRatio * 13;
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.quadraticCurveTo((previousX + x) / 2, (previousY + y) / 2 - 6, x, y);
    context.stroke();
  });
  context.restore();

  context.save();
  context.globalCompositeOperation = "lighter";
  context.lineCap = "round";
  model.inflow.forEach((particle) => {
    const cycle = (seconds * 0.46 * particle.speed + particle.delay) % 1;
    const radius = mix(particle.radius, 32, easeInCubic(cycle));
    const angle = particle.angle + seconds * particle.speed + cycle * 2.4;
    const x = centerX + Math.cos(angle) * radius;
    const y = groundY + Math.sin(angle) * radius * 0.19;
    const tangent = angle + Math.PI / 2;
    const length = mix(34, 8, cycle) * strength;
    context.globalAlpha = strength * Math.sin(cycle * Math.PI) * 0.62;
    context.strokeStyle = particle.width > 1.5 ? "#d9fff4" : "#65d7c1";
    context.lineWidth = particle.width;
    context.shadowColor = "#5ce0c5";
    context.shadowBlur = 6;
    context.beginPath();
    context.moveTo(x - Math.cos(tangent) * length, y - Math.sin(tangent) * length * 0.32);
    context.quadraticCurveTo(x, y - 5, x + Math.cos(tangent) * length, y + Math.sin(tangent) * length * 0.32);
    context.stroke();
  });

  model.particles.forEach((particle, index) => {
    const heightRatio = particle.height * build;
    const radius = (16 + heightRatio ** 1.42 * 188) * particle.radiusScale * build;
    const angle = particle.angle + seconds * particle.speed * (1.16 - particle.height * 0.28);
    const verticalWobble = Math.sin(seconds * 3.2 + particle.angle * 1.7) * 7;
    const x = centerX + Math.cos(angle) * radius;
    const y = groundY - heightRatio * 368 + Math.sin(angle) * radius * 0.17 + verticalWobble;
    const previousAngle = angle - 0.11 * particle.speed;
    const previousX = centerX + Math.cos(previousAngle) * radius;
    const previousY = groundY - heightRatio * 368 + Math.sin(previousAngle) * radius * 0.17 + verticalWobble;
    const front = 0.55 + Math.max(0, Math.sin(angle)) * 0.65;
    const flicker = 0.72 + Math.sin(elapsedMs * 0.013 + index * 1.9) * 0.28;
    context.globalAlpha = strength * particle.brightness * front * flicker * 0.68;
    context.strokeStyle = particle.brightness > 0.74 ? "#e9fff8" : particle.height > 0.55 ? "#63d8c3" : "#a5f6df";
    context.lineWidth = particle.thickness * (0.66 + heightRatio * 0.7);
    context.shadowColor = "#59d9bf";
    context.shadowBlur = 4 + particle.thickness * 2;
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.quadraticCurveTo((previousX + x) / 2 + Math.sin(angle) * 8, (previousY + y) / 2 - 4, x, y);
    context.stroke();
  });

  for (let ring = 0; ring < 17; ring += 1) {
    const heightRatio = (ring + 0.5) / 17 * build;
    const radius = (24 + heightRatio ** 1.35 * 178) * build;
    const y = groundY - heightRatio * 356;
    const spin = seconds * (4.9 - heightRatio * 1.4) + ring * 0.71;
    context.globalAlpha = strength * (0.1 + heightRatio * 0.12);
    context.strokeStyle = ring % 3 === 0 ? "#effff8" : "#70e1c9";
    context.lineWidth = 1.1 + heightRatio * 1.15;
    context.shadowColor = "#65dfc5";
    context.shadowBlur = 7;
    context.beginPath();
    context.ellipse(centerX, y, radius, 9 + radius * 0.13, Math.sin(seconds + ring) * 0.08, spin, spin + 1.55 + Math.sin(ring) * 0.35);
    context.stroke();
  }
  context.restore();

  context.save();
  model.debris.forEach((piece) => {
    const heightRatio = piece.height * build;
    const radius = (34 + heightRatio ** 1.3 * 168) * piece.radiusScale * build;
    const angle = piece.angle + seconds * piece.speed;
    const x = centerX + Math.cos(angle) * radius;
    const y = groundY - heightRatio * 346 + Math.sin(angle) * radius * 0.17;
    context.save();
    context.globalAlpha = strength * (0.46 + Math.max(0, Math.sin(angle)) * 0.44);
    context.translate(x, y);
    context.rotate(-angle * 1.8 + seconds * 3.7);
    context.fillStyle = piece.height > 0.55 ? "#756845" : "#c3ae72";
    context.fillRect(-piece.size / 2, -piece.size * 0.38, piece.size, piece.size * 0.76);
    context.restore();
  });
  context.restore();

  context.save();
  context.globalCompositeOperation = "lighter";
  context.globalAlpha = strength * 0.62;
  context.strokeStyle = "#b8ffea";
  context.lineWidth = 2.2;
  context.shadowColor = "#5fe2c6";
  context.shadowBlur = 13;
  context.beginPath();
  context.ellipse(centerX, groundY, 132 * build, 28 * build, seconds * 2.8, 0.35, 5.72);
  context.stroke();
  context.restore();
}

function createMeteorModel(random: () => number): MeteorModel {
  const createParticle = (kind: "fire" | "fragment" | "spark"): MeteorParticle => {
    const fire = kind === "fire";
    const spark = kind === "spark";
    return {
      angle: randomBetween(random, Math.PI * 1.03, Math.PI * 1.97),
      delay: randomBetween(random, 0, fire ? 120 : spark ? 270 : 210),
      speed: randomBetween(random, fire ? 130 : 95, fire ? 390 : spark ? 480 : 310),
      size: randomBetween(random, spark ? 0.8 : 2.4, fire ? 9 : spark ? 2.8 : 7),
      gravity: randomBetween(random, fire ? 130 : 180, fire ? 260 : 390),
      life: randomBetween(random, fire ? 580 : 680, fire ? 1_180 : spark ? 1_020 : 1_350),
    };
  };
  const smoke = Array.from({ length: 38 }, () => ({
    angle: randomBetween(random, Math.PI * 1.08, Math.PI * 1.92),
    delay: randomBetween(random, 160, 640),
    distance: randomBetween(random, 24, 170),
    rise: randomBetween(random, 70, 230),
    size: randomBetween(random, 22, 68),
    life: randomBetween(random, 760, 1_620),
  }));
  return {
    fire: Array.from({ length: 64 }, () => createParticle("fire")),
    fragments: Array.from({ length: 34 }, () => createParticle("fragment")),
    sparks: Array.from({ length: 88 }, () => createParticle("spark")),
    smoke,
    rockShape: Array.from({ length: 13 }, () => randomBetween(random, 0.76, 1.18)),
  };
}

function meteorPosition(width: number, height: number, progress: number): Point {
  const eased = easeInCubic(progress);
  return {
    x: mix(width * 0.06, width * 0.5, eased),
    y: mix(height * 0.02, height - 68, eased),
  };
}

function drawMeteorFlight(context: CanvasRenderingContext2D, model: MeteorModel, width: number, height: number, elapsedMs: number, impactAtMs: number) {
  const progress = clamp(elapsedMs / impactAtMs);
  const position = meteorPosition(width, height, progress);
  const previous = meteorPosition(width, height, clamp(progress - 0.018));
  const direction = Math.atan2(position.y - previous.y, position.x - previous.x);
  const scale = mix(0.08, 1.18, easeInCubic(progress));
  const radius = 44 * scale;

  context.save();
  context.globalCompositeOperation = "lighter";
  for (let trail = 18; trail >= 1; trail -= 1) {
    const sampleProgress = clamp(progress - trail * 0.018);
    if (sampleProgress <= 0) continue;
    const sample = meteorPosition(width, height, sampleProgress);
    const trailLife = 1 - trail / 19;
    const trailRadius = radius * trailLife * 0.78 + 2;
    const gradient = context.createRadialGradient(sample.x, sample.y, 0, sample.x, sample.y, trailRadius * 2.4);
    gradient.addColorStop(0, `rgba(255, 250, 198, ${0.82 * trailLife})`);
    gradient.addColorStop(0.25, `rgba(255, 151, 38, ${0.72 * trailLife})`);
    gradient.addColorStop(0.62, `rgba(255, 55, 16, ${0.42 * trailLife})`);
    gradient.addColorStop(1, "rgba(255, 43, 8, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(sample.x, sample.y, trailRadius * 2.4, 0, TAU);
    context.fill();
  }

  context.translate(position.x, position.y);
  context.rotate(direction + elapsedMs * 0.0046);
  const rockGradient = context.createRadialGradient(-radius * 0.28, -radius * 0.35, 0, 0, 0, radius * 1.25);
  rockGradient.addColorStop(0, "#ffe989");
  rockGradient.addColorStop(0.13, "#ff9a32");
  rockGradient.addColorStop(0.28, "#8b3e24");
  rockGradient.addColorStop(0.62, "#351d19");
  rockGradient.addColorStop(1, "#100807");
  context.fillStyle = rockGradient;
  context.shadowColor = "#ff5217";
  context.shadowBlur = 18 * scale;
  context.beginPath();
  model.rockShape.forEach((shape, index) => {
    const angle = index / model.rockShape.length * TAU;
    const rockRadius = radius * shape;
    const x = Math.cos(angle) * rockRadius;
    const y = Math.sin(angle) * rockRadius * 0.88;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(255, 178, 52, .92)";
  context.lineWidth = Math.max(0.7, 2.6 * scale);
  context.shadowColor = "#ff4015";
  context.shadowBlur = 8;
  [-0.34, 0.08, 0.4].forEach((offset, index) => {
    context.beginPath();
    context.moveTo(-radius * 0.56, radius * offset);
    context.lineTo(-radius * 0.12, radius * (offset + (index % 2 ? -0.22 : 0.2)));
    context.lineTo(radius * 0.42, radius * (offset - 0.06));
    context.stroke();
  });
  context.restore();

  context.save();
  context.globalCompositeOperation = "lighter";
  context.globalAlpha = 0.22 + progress * 0.62;
  context.strokeStyle = "#ffd46c";
  context.lineWidth = 2 + progress * 4;
  context.shadowColor = "#ff4c17";
  context.shadowBlur = 15;
  context.beginPath();
  context.arc(position.x, position.y, radius * 1.42, direction - 1.18, direction + 1.18);
  context.stroke();
  context.restore();
}

function drawMeteorImpact(context: CanvasRenderingContext2D, model: MeteorModel, width: number, height: number, impactMs: number) {
  const centerX = width / 2;
  const groundY = height - 68;
  const seconds = impactMs / 1_000;
  const impactProgress = clamp(impactMs / 1_650);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = smoothstep(0.04, 0.28, impactProgress) * (1 - smoothstep(0.75, 1, impactProgress)) * 0.72;
  const crater = context.createRadialGradient(centerX, groundY, 4, centerX, groundY, 178);
  crater.addColorStop(0, "rgba(20, 10, 8, .92)");
  crater.addColorStop(0.36, "rgba(104, 39, 18, .68)");
  crater.addColorStop(0.58, "rgba(255, 92, 21, .38)");
  crater.addColorStop(1, "rgba(26, 12, 8, 0)");
  context.fillStyle = crater;
  context.beginPath();
  context.ellipse(centerX, groundY, 185 * easeOutCubic(impactProgress), 46 * easeOutCubic(impactProgress), 0, 0, TAU);
  context.fill();
  context.restore();

  const flashLife = clamp(impactMs / 480);
  if (flashLife < 1) {
    context.save();
    context.globalCompositeOperation = "lighter";
    const flashRadius = 42 + easeOutCubic(flashLife) * 255;
    const flash = context.createRadialGradient(centerX, groundY, 0, centerX, groundY, flashRadius);
    flash.addColorStop(0, `rgba(255, 255, 244, ${1 - flashLife * 0.35})`);
    flash.addColorStop(0.12, `rgba(255, 224, 111, ${0.98 - flashLife * 0.42})`);
    flash.addColorStop(0.38, `rgba(255, 92, 24, ${0.78 - flashLife * 0.55})`);
    flash.addColorStop(1, "rgba(255, 40, 8, 0)");
    context.fillStyle = flash;
    context.beginPath();
    context.arc(centerX, groundY, flashRadius, 0, TAU);
    context.fill();
    context.restore();
  }

  const flameLife = clamp(impactMs / 1_050);
  if (flameLife < 1) {
    context.save();
    context.globalCompositeOperation = "lighter";
    for (let tongue = 0; tongue < 18; tongue += 1) {
      const amount = tongue / 17;
      const angle = mix(Math.PI * 1.05, Math.PI * 1.95, amount) + Math.sin(tongue * 4.1) * 0.075;
      const flicker = 0.78 + Math.sin(impactMs * 0.028 + tongue * 2.3) * 0.22;
      const length = (72 + (tongue % 5) * 23) * Math.sin(Math.PI * clamp(flameLife * 1.18)) * flicker;
      const spread = 8 + (tongue % 4) * 3.4;
      const tipX = centerX + Math.cos(angle) * length;
      const tipY = groundY + Math.sin(angle) * length;
      context.globalAlpha = (1 - flameLife) * (0.5 + (tongue % 3) * 0.15);
      context.fillStyle = tongue % 4 === 0 ? "#fff4a8" : tongue % 2 === 0 ? "#ffad2f" : "#ff4d16";
      context.shadowColor = "#ff4815";
      context.shadowBlur = 14;
      context.beginPath();
      context.moveTo(centerX - spread, groundY + 5);
      context.quadraticCurveTo(
        mix(centerX, tipX, 0.52) + Math.sin(impactMs * 0.02 + tongue) * 12,
        mix(groundY, tipY, 0.52),
        tipX,
        tipY,
      );
      context.quadraticCurveTo(
        mix(centerX, tipX, 0.46) - Math.cos(impactMs * 0.017 + tongue) * 10,
        mix(groundY, tipY, 0.48),
        centerX + spread,
        groundY + 5,
      );
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  context.save();
  context.globalCompositeOperation = "lighter";
  [0, 150, 310].forEach((delay, index) => {
    const age = clamp((impactMs - delay) / (780 + index * 180));
    if (age <= 0 || age >= 1) return;
    context.globalAlpha = (1 - age) * (0.92 - index * 0.17);
    context.strokeStyle = index === 0 ? "#fff1a2" : index === 1 ? "#ff972b" : "#ff4c18";
    context.lineWidth = 4.5 - index;
    context.shadowColor = "#ff541a";
    context.shadowBlur = 18;
    context.beginPath();
    context.ellipse(centerX, groundY, 44 + easeOutCubic(age) * (280 + index * 52), 13 + easeOutCubic(age) * (66 + index * 13), 0, 0, TAU);
    context.stroke();
  });
  context.restore();

  const drawBallistic = (particle: MeteorParticle, index: number, type: "fire" | "fragment" | "spark") => {
    const ageMs = impactMs - particle.delay;
    if (ageMs <= 0 || ageMs >= particle.life) return;
    const age = ageMs / 1_000;
    const life = ageMs / particle.life;
    const horizontal = Math.cos(particle.angle) * particle.speed;
    const vertical = Math.sin(particle.angle) * particle.speed;
    const x = centerX + horizontal * age;
    const y = groundY + vertical * age + particle.gravity * age * age * 0.5;
    const previousAge = Math.max(0, age - (type === "spark" ? 0.045 : 0.075));
    const previousX = centerX + horizontal * previousAge;
    const previousY = groundY + vertical * previousAge + particle.gravity * previousAge * previousAge * 0.5;
    const alpha = (1 - life) * (0.72 + Math.sin(index * 2.3 + impactMs * 0.02) * 0.28);
    context.save();
    context.globalCompositeOperation = type === "fragment" ? "source-over" : "lighter";
    context.globalAlpha = alpha;
    if (type === "fragment") {
      context.translate(x, y);
      context.rotate(index * 1.7 + seconds * (5 + index % 4));
      context.fillStyle = index % 3 === 0 ? "#ff8a2b" : "#4a251b";
      context.shadowColor = "#ff4c18";
      context.shadowBlur = 6;
      context.fillRect(-particle.size, -particle.size * 0.58, particle.size * 2, particle.size * 1.16);
    } else {
      context.strokeStyle = type === "fire" ? (index % 3 === 0 ? "#fff4b8" : "#ff7022") : "#ffd96b";
      context.lineWidth = particle.size * (1 - life * 0.55);
      context.lineCap = "round";
      context.shadowColor = "#ff4315";
      context.shadowBlur = type === "fire" ? 13 : 7;
      context.beginPath();
      context.moveTo(previousX, previousY);
      context.lineTo(x, y);
      context.stroke();
    }
    context.restore();
  };

  model.fire.forEach((particle, index) => drawBallistic(particle, index, "fire"));
  model.fragments.forEach((particle, index) => drawBallistic(particle, index, "fragment"));
  model.sparks.forEach((particle, index) => drawBallistic(particle, index, "spark"));

  model.smoke.forEach((smoke, index) => {
    const ageMs = impactMs - smoke.delay;
    if (ageMs <= 0 || ageMs >= smoke.life) return;
    const life = ageMs / smoke.life;
    const eased = easeOutCubic(life);
    const x = centerX + Math.cos(smoke.angle) * smoke.distance * eased + Math.sin(seconds * 2.1 + index) * 9;
    const y = groundY + Math.sin(smoke.angle) * smoke.distance * 0.35 * eased - smoke.rise * eased;
    const radius = smoke.size * mix(0.35, 1.45, eased);
    const cloud = context.createRadialGradient(x - radius * 0.2, y - radius * 0.25, 0, x, y, radius);
    cloud.addColorStop(0, `rgba(255, 127, 42, ${(1 - life) * 0.28})`);
    cloud.addColorStop(0.28, `rgba(94, 45, 34, ${(1 - life) * 0.4})`);
    cloud.addColorStop(0.72, `rgba(32, 28, 29, ${(1 - life) * 0.28})`);
    cloud.addColorStop(1, "rgba(20, 22, 24, 0)");
    context.save();
    context.globalAlpha = 1 - smoothstep(0.72, 1, life);
    context.fillStyle = cloud;
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();
    context.restore();
  });

  const emberLife = clamp(impactMs / 940);
  if (emberLife < 1) {
    context.save();
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = 1 - emberLife;
    const emberRadius = 38 + easeOutCubic(emberLife) * 118;
    const ember = context.createRadialGradient(centerX, groundY, 0, centerX, groundY, emberRadius);
    ember.addColorStop(0, "rgba(255, 255, 225, .96)");
    ember.addColorStop(0.15, "rgba(255, 209, 83, .88)");
    ember.addColorStop(0.42, "rgba(255, 83, 18, .5)");
    ember.addColorStop(1, "rgba(255, 42, 8, 0)");
    context.fillStyle = ember;
    context.beginPath();
    context.ellipse(centerX, groundY, emberRadius, emberRadius * 0.44, 0, 0, TAU);
    context.fill();
    context.restore();
  }
}

function drawMeteor(context: CanvasRenderingContext2D, model: MeteorModel, width: number, height: number, elapsedMs: number, impactAtMs: number) {
  if (elapsedMs < impactAtMs) drawMeteorFlight(context, model, width, height, elapsedMs, impactAtMs);
  else drawMeteorImpact(context, model, width, height, elapsedMs - impactAtMs);
}

export function SpecialAttackCanvas({ kind, width, height, durationMs, impactAtMs, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const ratio = Math.min(1.75, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const random = createRandom(seed);
    const model = kind === "lightning"
      ? createLightningModel(width, height, random)
      : kind === "tornado"
        ? createTornadoModel(random)
        : createMeteorModel(random);
    const startedAt = performance.now();
    let animationFrame = 0;

    const render = (now: number) => {
      const elapsedMs = now - startedAt;
      context.clearRect(0, 0, width, height);
      if (kind === "lightning") drawLightning(context, model as LightningModel, width, height, elapsedMs, durationMs);
      else if (kind === "tornado") drawTornado(context, model as TornadoModel, width, height, elapsedMs, durationMs);
      else drawMeteor(context, model as MeteorModel, width, height, elapsedMs, impactAtMs);
      if (elapsedMs < durationMs) animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationMs, height, impactAtMs, kind, width]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
