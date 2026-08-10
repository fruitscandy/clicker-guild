import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const geometryUrl = new URL("../app/bullet-hell/fracture-geometry.ts", import.meta.url);
const controllerUrl = new URL("../app/bullet-hell/page-fracture.ts", import.meta.url);

async function loadGeometry() {
  const source = await readFile(geometryUrl, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}#${Date.now()}`);
}

const geometry = await loadGeometry();

function triangleArea(points) {
  const [a, b, c] = points;
  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}

function pointKey(point) {
  return `${point.x.toFixed(9)},${point.y.toFixed(9)}`;
}

test("deterministically partitions the viewport into twelve shared-vertex triangles", () => {
  const width = 1_200;
  const height = 720;
  const origin = { x: 600, y: 260 };
  const first = geometry.createPageFractureShards(width, height, origin);
  const second = geometry.createPageFractureShards(width, height, origin);

  assert.equal(first.length, geometry.PAGE_FRACTURE_SHARD_COUNT);
  assert.equal(first.length, 12);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, geometry.createPageFractureShards(width, height, origin, 7));
  assert.ok(first.every((shard) => /^polygon\(.+\)$/.test(shard.clipPath)));
  assert.ok(first.every((shard) => triangleArea(shard.points) > 0));

  const coveredArea = first.reduce((sum, shard) => sum + triangleArea(shard.points), 0);
  assert.ok(Math.abs(coveredArea - width * height) < 1e-6, "triangles cover the viewport exactly");

  const occurrences = new Map();
  for (const shard of first) {
    for (const point of shard.points) {
      const key = pointKey(point);
      occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
    }
  }
  assert.equal(occurrences.size, (geometry.PAGE_FRACTURE_COLUMNS + 1) * (geometry.PAGE_FRACTURE_ROWS + 1));
  assert.ok([...occurrences.values()].some((count) => count >= 4), "interior grid vertices are shared");
});

test("derives priming, flight and completion strictly from the supplied engine clock", () => {
  const [shard] = geometry.createPageFractureShards(1_200, 720, { x: 600, y: 260 });
  const duration = 1_800;
  const start = geometry.pageFractureMotionAt(shard, 0, 0, duration, 720);
  const charged = geometry.pageFractureMotionAt(shard, 0, 125, duration, 720);
  const flight = geometry.pageFractureMotionAt(shard, 0, 900, duration, 720);
  const repeatedFlight = geometry.pageFractureMotionAt(shard, 0, 900, duration, 720);
  const complete = geometry.pageFractureMotionAt(shard, 0, duration, duration, 720);

  assert.deepEqual(start, {
    phase: "priming",
    progress: 0,
    localProgress: 0,
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
  });
  assert.equal(charged.phase, "priming");
  assert.ok(Math.abs(charged.x + 3) < 1e-9);
  assert.ok(Math.abs(charged.rotation + .12) < 1e-9);
  assert.equal(flight.phase, "fracturing");
  assert.deepEqual(flight, repeatedFlight, "the frame has no independent time state");
  assert.ok(flight.localProgress > 0 && flight.localProgress < 1);
  assert.ok(flight.opacity >= 0 && flight.opacity <= 1);
  assert.equal(complete.phase, "complete");
  assert.ok(Math.abs(complete.x - shard.dx) < 1e-9);
  assert.ok(Math.abs(complete.y - (shard.dy + 720 * .12)) < 1e-9);
  assert.ok(Math.abs(complete.rotation - shard.rotation) < 1e-9);
  assert.equal(complete.opacity, 0);
});

test("reduced motion cross-fades static cracked shards without travel or rotation", () => {
  const [shard] = geometry.createPageFractureShards(900, 600, { x: 450, y: 184 });
  const duration = 1_800;
  const beforeFade = geometry.pageFractureMotionAt(shard, 3, duration * .16, duration, 600, true);
  const midFade = geometry.pageFractureMotionAt(shard, 3, duration * .32, duration, 600, true);
  const afterFade = geometry.pageFractureMotionAt(shard, 3, duration * .48, duration, 600, true);

  for (const frame of [beforeFade, midFade, afterFade]) {
    assert.equal(frame.x, 0);
    assert.equal(frame.y, 0);
    assert.equal(frame.rotation, 0);
  }
  assert.equal(beforeFade.opacity, 1);
  assert.ok(midFade.opacity > 0 && midFade.opacity < 1);
  assert.equal(afterFade.opacity, 0);
});

test("the DOM controller is externally clocked and contains no autonomous observer or timer", async () => {
  const source = await readFile(controllerUrl, "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame|setTimeout|setInterval|MutationObserver|performance\.now/);
  assert.match(source, /data-page-fracture-underlay/);
  assert.match(source, /sourceRoot, "source"/);
  assert.match(source, /battleSurface, "battle"/);
  assert.match(source, /soundDock, "dock"/);
  assert.match(source, /root\.inert = true/);
  assert.match(source, /name\.startsWith\("aria-"\)/);
  assert.match(source, /traceGlitchBossBody\(context\)/);
  assert.doesNotMatch(source, /traceArchivist/);
  assert.doesNotMatch(source, /createRadialGradient/);
  assert.match(source, /function eraseBossBody/);
  assert.match(source, /battleSnapshot\?: HTMLCanvasElement/);
  assert.match(source, /bossSnapshot\?: HTMLCanvasElement/);
  assert.match(source, /const eraseCapturedBoss = !providedBattleSnapshot/);
  assert.match(source, /bossSnapshot \? null : mask/);
  assert.match(source, /const sourceRect = sourceRoot\.getBoundingClientRect\(\)/);
  assert.match(source, /sourceClone\.style\.top = `\$\{sourceRect\.top\}px`/);
  assert.match(source, /const settle = \(\) =>/);
  assert.match(source, /mounted\.length = 0/);
  assert.match(source, /snapshot\.width = 1/);
  assert.match(source, /const restore = \(\) =>/);
});
