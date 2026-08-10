export const GLITCH_BOSS_BODY_RADIUS = 76;
export const GLITCH_BOSS_GLYPH_COUNT = 36;

const LATIN = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const NUMBERS = Array.from("0123456789");
const SYMBOLS = Array.from("∆⌁⌘⌗◊◇◆※×÷±≠∞∑∏√∫≈≡<>[]{}#/\\|_+*?;:!");
const HANGUL = Array.from("ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ가나다라마바사아자차카타파하공허신호오류침식경고불명");
const GREEK = Array.from("ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ");
const KANA = Array.from("アイウエオカキクケコサシスセソタチツテトナニヌネノマミムメモ");
const CJK = Array.from("零壱弐参界無空虚機械信号侵食警告異常未確認");

export const GLITCH_BOSS_GLYPHS = Object.freeze([
  ...LATIN,
  ...NUMBERS,
  ...SYMBOLS,
  ...HANGUL,
  ...GREEK,
  ...KANA,
  ...CJK,
]);

export type GlitchBossGlyphTone = "white" | "cyan" | "pink" | "violet";

export type GlitchBossGlyphFrame = Readonly<{
  char: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  tone: GlitchBossGlyphTone;
  hot: boolean;
  flicker: number;
  rgbOffset: number;
  mutation: number;
}>;

function unitNoise(index: number, salt: number, mutation = 0) {
  let value = Math.imul(index + 1, 0x9e3779b1)
    ^ Math.imul(salt + 1, 0x85ebca6b)
    ^ Math.imul(mutation + 1, 0xc2b2ae35);
  value = Math.imul(value ^ value >>> 16, 0x7feb352d);
  value = Math.imul(value ^ value >>> 15, 0x846ca68b);
  return ((value ^ value >>> 16) >>> 0) / 0x1_0000_0000;
}

/** Trace the exact black circular boss body shared by live rendering and PAGE // FRACTURE. */
export function traceGlitchBossBody(
  context: CanvasRenderingContext2D,
  radius = GLITCH_BOSS_BODY_RADIUS,
) {
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.closePath();
}

/**
 * Return one deterministic, independently mutating glyph. The elapsed clock
 * makes the cloud look random without ambient randomness or render-time state.
 */
export function glitchBossGlyphAt(
  index: number,
  elapsedMs: number,
): GlitchBossGlyphFrame {
  const safeIndex = Math.max(0, Math.trunc(index));
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const cadenceMs = 340 + Math.floor(unitNoise(safeIndex, 0) * 920);
  const clock = safeElapsed + unitNoise(safeIndex, 1) * cadenceMs;
  const mutation = Math.floor(clock / cadenceMs);
  const phase = clock / cadenceMs - mutation;

  const sizeRoll = unitNoise(safeIndex, 2);
  const size = sizeRoll < .58
    ? 8 + unitNoise(safeIndex, 3) * 8
    : sizeRoll < .9
      ? 14 + unitNoise(safeIndex, 3) * 12
      : 27 + unitNoise(safeIndex, 3) * 10;
  const safeRadius = Math.max(0, GLITCH_BOSS_BODY_RADIUS - size * .68 - 7);
  const angle = unitNoise(safeIndex, 4) * Math.PI * 2;
  const radius = Math.sqrt(unitNoise(safeIndex, 5)) * safeRadius;
  const toneRoll = unitNoise(safeIndex, 6, mutation);
  const tone: GlitchBossGlyphTone = toneRoll < .055
    ? "cyan"
    : toneRoll < .105
      ? "pink"
      : toneRoll < .15
        ? "violet"
        : "white";
  const hot = unitNoise(safeIndex, 7, mutation) < .46;
  const glitchWindow = phase >= .76 && phase < .85
    ? Math.sin((phase - .76) / .09 * Math.PI)
    : phase >= .89 && phase < .95
      ? Math.sin((phase - .89) / .06 * Math.PI) * .78
      : 0;
  const flicker = glitchWindow > 0
    ? Math.max(.08, 1 - glitchWindow * (hot ? .72 : .42))
    : 1;
  const direction = unitNoise(safeIndex, 8, mutation) < .5 ? -1 : 1;

  return {
    char: GLITCH_BOSS_GLYPHS[Math.floor(unitNoise(safeIndex, 9, mutation) * GLITCH_BOSS_GLYPHS.length)] ?? "?",
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    size,
    rotation: (unitNoise(safeIndex, 10) - .5) * .58,
    opacity: .34 + unitNoise(safeIndex, 11) * .62,
    tone,
    hot,
    flicker,
    rgbOffset: direction * (2 + unitNoise(safeIndex, 12, mutation) * 4.5) * glitchWindow,
    mutation,
  };
}
