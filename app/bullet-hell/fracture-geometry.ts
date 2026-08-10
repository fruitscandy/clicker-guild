export type FracturePoint = Readonly<{ x: number; y: number }>;
export type FractureOrigin = Readonly<{ x: number; y: number }>;

export type PageFractureShard = Readonly<{
  points: readonly [FracturePoint, FracturePoint, FracturePoint];
  center: FracturePoint;
  dx: number;
  dy: number;
  rotation: number;
  delay: number;
  clipPath: string;
}>;

export type PageFracturePhase = "priming" | "fracturing" | "complete";

export type PageFractureMotion = Readonly<{
  phase: PageFracturePhase;
  progress: number;
  localProgress: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
}>;

export const PAGE_FRACTURE_COLUMNS = 3;
export const PAGE_FRACTURE_ROWS = 2;
export const PAGE_FRACTURE_SHARD_COUNT = PAGE_FRACTURE_COLUMNS * PAGE_FRACTURE_ROWS * 2;
export const PAGE_FRACTURE_SEED = 20260810;
export const PAGE_FRACTURE_PRELUDE_MS = 250;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = clamp((value - edge0) / Math.max(.0001, edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
}

function assertPositiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ next >>> 15, next | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4_294_967_296;
  };
}

function makePageFractureShard(
  points: readonly [FracturePoint, FracturePoint, FracturePoint],
  random: () => number,
  width: number,
  height: number,
  origin: FractureOrigin,
): PageFractureShard {
  const center = {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };
  const vectorX = center.x - origin.x;
  const vectorY = center.y - origin.y;
  const length = Math.max(1, Math.hypot(vectorX, vectorY));
  const travel = Math.max(width, height) * (.2 + random() * .25);
  const clipPath = `polygon(${points.map((point) => (
    `${point.x / width * 100}% ${point.y / height * 100}%`
  )).join(", ")})`;

  return {
    points,
    center,
    dx: vectorX / length * travel + (random() - .5) * width * .07,
    dy: vectorY / length * travel + (random() - .42) * height * .08,
    rotation: (random() - .5) * 10,
    delay: random() * .1 + Math.min(.08, length / Math.hypot(width, height) * .08),
    clipPath,
  };
}

/**
 * Split a viewport into six shared-vertex cells and deterministically bisect
 * each cell. The result is always twelve non-overlapping triangular shards.
 */
export function createPageFractureShards(
  width: number,
  height: number,
  origin: FractureOrigin,
  seed = PAGE_FRACTURE_SEED,
): readonly PageFractureShard[] {
  assertPositiveFinite(width, "width");
  assertPositiveFinite(height, "height");
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y)) {
    throw new RangeError("origin must contain finite coordinates.");
  }

  const random = seededRandom((seed | 0) ^ Math.trunc(width) ^ Math.trunc(height));
  const grid: FracturePoint[][] = [];

  for (let row = 0; row <= PAGE_FRACTURE_ROWS; row += 1) {
    const points: FracturePoint[] = [];
    for (let column = 0; column <= PAGE_FRACTURE_COLUMNS; column += 1) {
      const xStep = width / PAGE_FRACTURE_COLUMNS;
      const yStep = height / PAGE_FRACTURE_ROWS;
      const boundaryX = column === 0 || column === PAGE_FRACTURE_COLUMNS;
      const boundaryY = row === 0 || row === PAGE_FRACTURE_ROWS;
      points.push({
        x: column * xStep + (boundaryX ? 0 : (random() - .5) * xStep * .24),
        y: row * yStep + (boundaryY ? 0 : (random() - .5) * yStep * .24),
      });
    }
    grid.push(points);
  }

  const shards: PageFractureShard[] = [];
  for (let row = 0; row < PAGE_FRACTURE_ROWS; row += 1) {
    for (let column = 0; column < PAGE_FRACTURE_COLUMNS; column += 1) {
      const topLeft = grid[row][column];
      const topRight = grid[row][column + 1];
      const bottomLeft = grid[row + 1][column];
      const bottomRight = grid[row + 1][column + 1];
      if (random() > .5) {
        shards.push(makePageFractureShard([topLeft, topRight, bottomLeft], random, width, height, origin));
        shards.push(makePageFractureShard([topRight, bottomRight, bottomLeft], random, width, height, origin));
      } else {
        shards.push(makePageFractureShard([topLeft, topRight, bottomRight], random, width, height, origin));
        shards.push(makePageFractureShard([topLeft, bottomRight, bottomLeft], random, width, height, origin));
      }
    }
  }
  return shards;
}

/**
 * Resolve one shard from the engine's collapse clock. This function owns no
 * timer, so pause, hidden-tab and forced-mode behavior stays synchronized with
 * the finale world that supplies elapsedMs.
 */
export function pageFractureMotionAt(
  shard: PageFractureShard,
  index: number,
  elapsedMs: number,
  durationMs: number,
  viewportHeight: number,
  reducedMotion = false,
): PageFractureMotion {
  assertPositiveFinite(durationMs, "durationMs");
  assertPositiveFinite(viewportHeight, "viewportHeight");
  const elapsed = clamp(Number.isFinite(elapsedMs) ? elapsedMs : 0, 0, durationMs);
  const progress = clamp(elapsed / durationMs);

  if (reducedMotion) {
    return {
      phase: elapsed >= durationMs ? "complete" : elapsed < PAGE_FRACTURE_PRELUDE_MS ? "priming" : "fracturing",
      progress,
      localProgress: progress,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1 - smoothstep(.16, .48, progress),
    };
  }

  if (elapsed < PAGE_FRACTURE_PRELUDE_MS) {
    const charge = Math.sin(clamp(elapsed / PAGE_FRACTURE_PRELUDE_MS) * Math.PI);
    const direction = index % 2 ? 1 : -1;
    if (charge === 0) {
      return {
        phase: "priming",
        progress,
        localProgress: 0,
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
      };
    }
    return {
      phase: "priming",
      progress,
      localProgress: 0,
      x: direction * charge * (3 + index % 4),
      y: Math.sin(index * 2.1) * charge * 2,
      rotation: direction * charge * .12,
      opacity: 1,
    };
  }

  const flightDuration = Math.max(1, durationMs - PAGE_FRACTURE_PRELUDE_MS * .62);
  const fractureProgress = clamp((elapsed - PAGE_FRACTURE_PRELUDE_MS * .62) / flightDuration);
  const localProgress = clamp((fractureProgress - shard.delay) / Math.max(.001, 1 - shard.delay));
  const travel = easeOutCubic(localProgress);
  const gravity = viewportHeight * .12 * travel * travel;
  return {
    phase: elapsed >= durationMs ? "complete" : "fracturing",
    progress,
    localProgress,
    x: shard.dx * travel,
    y: shard.dy * travel + gravity,
    rotation: shard.rotation * travel,
    opacity: 1 - smoothstep(.58, 1, localProgress),
  };
}
