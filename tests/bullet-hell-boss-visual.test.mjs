import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const moduleUrl = new URL("../app/bullet-hell/boss-silhouette.ts", import.meta.url);

async function loadBossVisual() {
  const source = await readFile(moduleUrl, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return {
    source,
    module: await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}#${Date.now()}`),
  };
}

const visual = await loadBossVisual();

test("ships a multilingual glyph cloud inside the circular boss body", () => {
  const { GLITCH_BOSS_BODY_RADIUS, GLITCH_BOSS_GLYPH_COUNT, GLITCH_BOSS_GLYPHS } = visual.module;
  assert.equal(GLITCH_BOSS_BODY_RADIUS, 76);
  assert.equal(GLITCH_BOSS_GLYPH_COUNT, 36);
  for (const representative of ["A", "0", "∆", "가", "Ω", "ア", "零"]) {
    assert.ok(GLITCH_BOSS_GLYPHS.includes(representative), `missing ${representative}`);
  }
  assert.ok(GLITCH_BOSS_GLYPHS.length > 150);
});

test("derives independent random-looking mutations deterministically from elapsed time", () => {
  const atZero = Array.from({ length: visual.module.GLITCH_BOSS_GLYPH_COUNT }, (_, index) => (
    visual.module.glitchBossGlyphAt(index, 0)
  ));
  const repeated = Array.from({ length: visual.module.GLITCH_BOSS_GLYPH_COUNT }, (_, index) => (
    visual.module.glitchBossGlyphAt(index, 0)
  ));
  const later = Array.from({ length: visual.module.GLITCH_BOSS_GLYPH_COUNT }, (_, index) => (
    visual.module.glitchBossGlyphAt(index, 2_000)
  ));

  assert.deepEqual(atZero, repeated);
  assert.ok(later.filter((glyph, index) => glyph.char !== atZero[index].char).length >= 12);
  assert.ok(new Set(later.map((glyph) => glyph.mutation)).size > 2, "glyphs do not mutate in lockstep");
  assert.ok(atZero.some((glyph) => glyph.hot));
  assert.ok(atZero.some((glyph) => glyph.tone !== "white"));
});

test("keeps varied glyph sizes and RGB displacement safely inside the shared body radius", () => {
  const frames = Array.from({ length: visual.module.GLITCH_BOSS_GLYPH_COUNT }, (_, index) => (
    visual.module.glitchBossGlyphAt(index, 1_375)
  ));
  assert.ok(frames.some((glyph) => glyph.size < 14));
  assert.ok(frames.some((glyph) => glyph.size >= 14 && glyph.size < 27));
  assert.ok(frames.some((glyph) => glyph.size >= 27));

  for (const glyph of frames) {
    const occupiedRadius = Math.hypot(glyph.x, glyph.y) + glyph.size * .68 + 7;
    assert.ok(occupiedRadius <= visual.module.GLITCH_BOSS_BODY_RADIUS + 1e-9);
    assert.ok(glyph.opacity >= .34 && glyph.opacity <= .96);
    assert.ok(glyph.flicker >= .08 && glyph.flicker <= 1);
    assert.ok(Number.isFinite(glyph.rotation));
    assert.ok(Number.isFinite(glyph.rgbOffset));
  }
});

test("uses the finale engine clock without autonomous randomness or timers", () => {
  assert.doesNotMatch(visual.source, /Math\.random|Date\.now|performance\.now|requestAnimationFrame|setTimeout|setInterval/);
  assert.match(visual.source, /export function traceGlitchBossBody/);
  assert.match(visual.source, /context\.arc\(0, 0, radius/);
});
