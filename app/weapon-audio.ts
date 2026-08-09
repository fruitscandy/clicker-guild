export type WeaponSoundSignature =
  | "training"
  | "crescent"
  | "twin"
  | "rune"
  | "sky"
  | "nebula"
  | "dragon"
  | "celestial"
  | "blood-moon"
  | "storm"
  | "radiant"
  | "abyss"
  | "time"
  | "world-tree"
  | "myriad";

export type WeaponSoundProfile = {
  tier: number;
  key: string;
  weaponName: string;
  signature: WeaponSoundSignature;
  bodyHz: number;
  bladeHz: number;
  accentHz: number;
  duration: number;
  impact: number;
  slash: number;
  brilliance: number;
  space: number;
};

export const WEAPON_SOUND_PROFILES = [
  { tier: 0, key: "training-strike", weaponName: "훈련용 장검", signature: "training", bodyHz: 156, bladeHz: 720, accentHz: 1180, duration: 0.18, impact: 0.48, slash: 0.32, brilliance: 0.10, space: 0.06 },
  { tier: 1, key: "crescent-slash", weaponName: "초승달 도", signature: "crescent", bodyHz: 174, bladeHz: 1060, accentHz: 1640, duration: 0.23, impact: 0.52, slash: 0.48, brilliance: 0.16, space: 0.09 },
  { tier: 2, key: "cross-cut", weaponName: "쌍날검", signature: "twin", bodyHz: 188, bladeHz: 1260, accentHz: 1920, duration: 0.27, impact: 0.56, slash: 0.54, brilliance: 0.22, space: 0.12 },
  { tier: 3, key: "weakpoint-break", weaponName: "룬 파쇄검", signature: "rune", bodyHz: 132, bladeHz: 880, accentHz: 1480, duration: 0.30, impact: 0.62, slash: 0.57, brilliance: 0.28, space: 0.15 },
  { tier: 4, key: "sky-sword-array", weaponName: "천공검", signature: "sky", bodyHz: 214, bladeHz: 1420, accentHz: 2240, duration: 0.34, impact: 0.66, slash: 0.62, brilliance: 0.36, space: 0.19 },
  { tier: 5, key: "nebula-dance", weaponName: "성운도", signature: "nebula", bodyHz: 196, bladeHz: 1540, accentHz: 2620, duration: 0.37, impact: 0.69, slash: 0.66, brilliance: 0.44, space: 0.23 },
  { tier: 6, key: "dragon-vein-break", weaponName: "용맥검", signature: "dragon", bodyHz: 92, bladeHz: 1180, accentHz: 2860, duration: 0.40, impact: 0.74, slash: 0.70, brilliance: 0.50, space: 0.26 },
  { tier: 7, key: "celestial-ruin", weaponName: "천상검", signature: "celestial", bodyHz: 220, bladeHz: 1760, accentHz: 3120, duration: 0.43, impact: 0.78, slash: 0.73, brilliance: 0.58, space: 0.30 },
  { tier: 8, key: "blood-moon-eclipse", weaponName: "혈월도", signature: "blood-moon", bodyHz: 82, bladeHz: 980, accentHz: 1880, duration: 0.45, impact: 0.81, slash: 0.77, brilliance: 0.62, space: 0.34 },
  { tier: 9, key: "storm-twin-dance", weaponName: "폭풍쌍검", signature: "storm", bodyHz: 108, bladeHz: 1920, accentHz: 3480, duration: 0.47, impact: 0.84, slash: 0.82, brilliance: 0.68, space: 0.37 },
  { tier: 10, key: "radiant-judgment", weaponName: "성휘 대검", signature: "radiant", bodyHz: 116, bladeHz: 1680, accentHz: 3840, duration: 0.50, impact: 0.88, slash: 0.85, brilliance: 0.76, space: 0.41 },
  { tier: 11, key: "abyss-sever", weaponName: "심연검", signature: "abyss", bodyHz: 58, bladeHz: 740, accentHz: 2260, duration: 0.52, impact: 0.91, slash: 0.87, brilliance: 0.80, space: 0.44 },
  { tier: 12, key: "time-collapse", weaponName: "시간절단검", signature: "time", bodyHz: 146, bladeHz: 2140, accentHz: 4180, duration: 0.54, impact: 0.94, slash: 0.89, brilliance: 0.86, space: 0.47 },
  { tier: 13, key: "world-tree-wave", weaponName: "세계수 성검", signature: "world-tree", bodyHz: 128, bladeHz: 1320, accentHz: 3520, duration: 0.57, impact: 0.96, slash: 0.91, brilliance: 0.91, space: 0.50 },
  { tier: 14, key: "myriad-blades-one", weaponName: "길드마스터 신검", signature: "myriad", bodyHz: 72, bladeHz: 2380, accentHz: 4680, duration: 0.61, impact: 1.00, slash: 0.94, brilliance: 1.00, space: 0.54 },
] as const satisfies readonly WeaponSoundProfile[];

type WeaponAudioBus = {
  dry: GainNode;
  reverb: GainNode;
};

type ToneOptions = {
  at?: number;
  duration: number;
  fromHz: number;
  toHz?: number;
  gain: number;
  type?: OscillatorType;
  pan?: number;
  space?: number;
};

type NoiseOptions = {
  at?: number;
  duration: number;
  fromHz: number;
  toHz: number;
  gain: number;
  filter?: BiquadFilterType;
  pan?: number;
  space?: number;
};

const audioBuses = new WeakMap<AudioContext, WeaponAudioBus>();
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

function clampTier(tier: number) {
  return Math.min(WEAPON_SOUND_PROFILES.length - 1, Math.max(0, Math.round(tier)));
}

function getAudioBus(context: AudioContext) {
  const cached = audioBuses.get(context);
  if (cached) return cached;

  const dry = context.createGain();
  const reverb = context.createGain();
  const convolver = context.createConvolver();
  const wet = context.createGain();
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0.72;
  wet.gain.value = 0.24;
  compressor.threshold.value = -18;
  compressor.knee.value = 14;
  compressor.ratio.value = 7;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.16;

  const impulseLength = Math.floor(context.sampleRate * 1.75);
  const impulse = context.createBuffer(2, impulseLength, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < impulseLength; index += 1) {
      const decay = Math.pow(1 - index / impulseLength, 3.2);
      data[index] = (Math.random() * 2 - 1) * decay;
    }
  }
  convolver.buffer = impulse;

  dry.connect(master);
  reverb.connect(convolver);
  convolver.connect(wet);
  wet.connect(master);
  master.connect(compressor);
  compressor.connect(context.destination);

  const bus = { dry, reverb };
  audioBuses.set(context, bus);
  return bus;
}

function getNoiseBuffer(context: AudioContext) {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  noiseBuffers.set(context, buffer);
  return buffer;
}

function connectVoice(context: AudioContext, output: AudioNode, space = 0) {
  const bus = getAudioBus(context);
  output.connect(bus.dry);
  if (space > 0) {
    const send = context.createGain();
    send.gain.value = Math.min(0.42, space * 0.5);
    output.connect(send);
    send.connect(bus.reverb);
  }
}

function tone(context: AudioContext, options: ToneOptions, pitch = 1) {
  const start = context.currentTime + (options.at ?? 0);
  const end = start + options.duration;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  const peakAt = start + Math.min(0.018, options.duration * 0.24);

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(Math.max(24, options.fromHz * pitch), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, (options.toHz ?? options.fromHz) * pitch), end);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain), peakAt);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  panner.pan.value = options.pan ?? 0;
  oscillator.connect(envelope);
  envelope.connect(panner);
  connectVoice(context, panner, options.space);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function noise(context: AudioContext, options: NoiseOptions, offsetSeed = 0) {
  const start = context.currentTime + (options.at ?? 0);
  const end = start + options.duration;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  const peakAt = start + Math.min(0.014, options.duration * 0.2);

  source.buffer = getNoiseBuffer(context);
  filter.type = options.filter ?? "bandpass";
  filter.Q.value = options.filter === "highpass" ? 0.65 : 1.2;
  filter.frequency.setValueAtTime(Math.max(40, options.fromHz), start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, options.toHz), end);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain), peakAt);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  panner.pan.value = options.pan ?? 0;
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(panner);
  connectVoice(context, panner, options.space);
  const offset = (Math.abs(offsetSeed) * 0.071) % Math.max(0.01, 0.96 - options.duration);
  source.start(start, offset, options.duration + 0.01);
}

function renderSignature(context: AudioContext, profile: WeaponSoundProfile, variation: number, pitch: number) {
  const flip = variation % 2 === 0 ? 1 : -1;
  const bodyGain = 0.055 + profile.impact * 0.055;
  const slashGain = 0.035 + profile.slash * 0.05;
  const shineGain = 0.016 + profile.brilliance * 0.035;
  const space = profile.space;

  switch (profile.signature) {
    case "training":
      tone(context, { duration: 0.16, fromHz: profile.bodyHz * 1.18, toHz: profile.bodyHz * 0.68, gain: bodyGain, type: "triangle", space }, pitch);
      noise(context, { duration: 0.11, fromHz: 760, toHz: 260, gain: slashGain, filter: "bandpass", pan: 0.08 * flip, space }, variation);
      break;
    case "crescent":
      noise(context, { duration: 0.21, fromHz: 420, toHz: 2480, gain: slashGain, filter: "highpass", pan: 0.34 * flip, space }, variation);
      tone(context, { at: 0.018, duration: 0.19, fromHz: profile.bladeHz * 0.72, toHz: profile.bladeHz * 1.14, gain: shineGain, type: "sine", pan: 0.25 * flip, space }, pitch);
      tone(context, { duration: 0.14, fromHz: profile.bodyHz, toHz: profile.bodyHz * 0.72, gain: bodyGain * 0.72, type: "triangle", space }, pitch);
      break;
    case "twin":
      for (let index = 0; index < 2; index += 1) {
        const pan = (index === 0 ? -0.52 : 0.52) * flip;
        noise(context, { at: index * 0.058, duration: 0.16, fromHz: 1980, toHz: 540, gain: slashGain * 0.82, filter: "highpass", pan, space }, variation + index);
        tone(context, { at: index * 0.058, duration: 0.14, fromHz: profile.bladeHz * (1 + index * 0.12), toHz: profile.bladeHz * 0.7, gain: shineGain, type: "triangle", pan, space }, pitch);
      }
      tone(context, { at: 0.085, duration: 0.14, fromHz: profile.bodyHz, toHz: profile.bodyHz * 0.6, gain: bodyGain * 0.82, type: "sine", space }, pitch);
      break;
    case "rune":
      for (let index = 0; index < 3; index += 1) {
        tone(context, { at: index * 0.038, duration: 0.105, fromHz: profile.bodyHz * (2.7 - index * 0.38), toHz: profile.bodyHz * (1.15 - index * 0.08), gain: bodyGain * (0.84 - index * 0.1), type: "square", pan: (index - 1) * 0.28 * flip, space }, pitch);
      }
      noise(context, { at: 0.065, duration: 0.18, fromHz: 1660, toHz: 180, gain: slashGain, filter: "bandpass", space }, variation);
      tone(context, { at: 0.10, duration: 0.19, fromHz: profile.accentHz, toHz: profile.accentHz * 0.52, gain: shineGain, type: "sine", space: space + 0.08 }, pitch);
      break;
    case "sky":
      for (let index = 0; index < 5; index += 1) {
        const at = index * 0.027;
        tone(context, { at, duration: 0.17, fromHz: profile.bladeHz * (0.72 + index * 0.08), toHz: profile.accentHz * (0.86 + index * 0.035), gain: shineGain * 0.66, type: index % 2 ? "sine" : "triangle", pan: ((index - 2) / 4) * flip, space }, pitch);
      }
      noise(context, { at: 0.035, duration: 0.23, fromHz: 580, toHz: 4120, gain: slashGain, filter: "highpass", space }, variation);
      tone(context, { at: 0.11, duration: 0.20, fromHz: profile.bodyHz, toHz: profile.bodyHz * 0.5, gain: bodyGain, type: "triangle", space }, pitch);
      break;
    case "nebula":
      noise(context, { duration: 0.30, fromHz: 620, toHz: 3680, gain: slashGain * 0.82, filter: "highpass", pan: 0.2 * flip, space: space + 0.08 }, variation);
      [1, 1.26, 1.5, 2.02].forEach((ratio, index) => {
        tone(context, { at: 0.02 + index * 0.039, duration: 0.23 - index * 0.018, fromHz: profile.bladeHz * ratio, toHz: profile.accentHz * ratio * 0.72, gain: shineGain * (0.78 - index * 0.08), type: "sine", pan: (index % 2 ? 0.48 : -0.48) * flip, space: space + 0.1 }, pitch);
      });
      tone(context, { at: 0.11, duration: 0.24, fromHz: profile.bodyHz * 1.1, toHz: profile.bodyHz * 0.52, gain: bodyGain, type: "triangle", space }, pitch);
      break;
    case "dragon":
      tone(context, { duration: 0.34, fromHz: profile.bodyHz * 1.42, toHz: profile.bodyHz * 0.42, gain: bodyGain * 1.25, type: "sawtooth", space }, pitch);
      noise(context, { duration: 0.35, fromHz: 1760, toHz: 84, gain: slashGain * 1.12, filter: "bandpass", space }, variation);
      for (let index = 0; index < 4; index += 1) {
        tone(context, { at: 0.018 + index * 0.034, duration: 0.075, fromHz: profile.accentHz * (1 + index * 0.09), toHz: profile.bladeHz * 0.86, gain: shineGain * 0.78, type: "square", pan: (index % 2 ? 0.65 : -0.65) * flip, space }, pitch);
      }
      break;
    case "celestial":
      tone(context, { duration: 0.26, fromHz: profile.bodyHz * 1.4, toHz: profile.bodyHz * 0.48, gain: bodyGain * 1.18, type: "triangle", space }, pitch);
      noise(context, { duration: 0.28, fromHz: 5200, toHz: 460, gain: slashGain, filter: "highpass", space }, variation);
      [1, 1.5, 2, 2.5].forEach((ratio, index) => tone(context, { at: 0.045 + index * 0.012, duration: 0.31, fromHz: profile.bladeHz * ratio, toHz: profile.bladeHz * ratio * 0.96, gain: shineGain * (0.72 - index * 0.08), type: "sine", pan: (index - 1.5) * 0.24 * flip, space: space + 0.12 }, pitch));
      break;
    case "blood-moon":
      tone(context, { duration: 0.38, fromHz: profile.bodyHz * 1.7, toHz: profile.bodyHz * 0.36, gain: bodyGain * 1.28, type: "sawtooth", pan: -0.14 * flip, space }, pitch);
      noise(context, { duration: 0.31, fromHz: 380, toHz: 2860, gain: slashGain * 1.06, filter: "highpass", pan: -0.55 * flip, space }, variation);
      noise(context, { at: 0.095, duration: 0.25, fromHz: 2720, toHz: 310, gain: slashGain * 0.84, filter: "bandpass", pan: 0.55 * flip, space }, variation + 1);
      tone(context, { at: 0.105, duration: 0.31, fromHz: profile.accentHz * 0.82, toHz: profile.bladeHz * 0.48, gain: shineGain, type: "triangle", space: space + 0.08 }, pitch);
      break;
    case "storm":
      for (let index = 0; index < 6; index += 1) {
        const pan = (index % 2 ? 0.72 : -0.72) * flip;
        const at = index * 0.026;
        noise(context, { at, duration: 0.12, fromHz: 4100 - index * 260, toHz: 620, gain: slashGain * 0.56, filter: "highpass", pan, space }, variation + index);
        tone(context, { at, duration: 0.085, fromHz: profile.accentHz * (1 + index * 0.04), toHz: profile.bladeHz * 0.62, gain: shineGain * 0.56, type: "square", pan, space }, pitch);
      }
      tone(context, { at: 0.12, duration: 0.31, fromHz: profile.bodyHz * 1.6, toHz: profile.bodyHz * 0.38, gain: bodyGain * 1.3, type: "sawtooth", space }, pitch);
      break;
    case "radiant":
      tone(context, { duration: 0.39, fromHz: profile.bodyHz * 1.55, toHz: profile.bodyHz * 0.35, gain: bodyGain * 1.34, type: "triangle", space }, pitch);
      noise(context, { duration: 0.36, fromHz: 6800, toHz: 380, gain: slashGain * 1.08, filter: "highpass", space }, variation);
      [1, 1.25, 1.5, 2].forEach((ratio, index) => tone(context, { at: 0.055, duration: 0.39, fromHz: profile.bladeHz * ratio, toHz: profile.accentHz * ratio * 0.78, gain: shineGain * (0.82 - index * 0.09), type: "sine", pan: (index - 1.5) * 0.28 * flip, space: space + 0.12 }, pitch));
      break;
    case "abyss":
      noise(context, { duration: 0.36, fromHz: 5200, toHz: 72, gain: slashGain * 1.08, filter: "bandpass", pan: 0.12 * flip, space }, variation);
      tone(context, { duration: 0.45, fromHz: profile.bodyHz * 1.75, toHz: 28, gain: bodyGain * 1.42, type: "sawtooth", space: space + 0.08 }, pitch);
      tone(context, { at: 0.085, duration: 0.36, fromHz: profile.bladeHz * 0.62, toHz: profile.accentHz * 0.34, gain: shineGain * 0.92, type: "sine", pan: -0.48 * flip, space: space + 0.14 }, pitch);
      tone(context, { at: 0.11, duration: 0.32, fromHz: profile.bladeHz * 0.68, toHz: profile.accentHz * 0.27, gain: shineGain * 0.78, type: "triangle", pan: 0.48 * flip, space: space + 0.14 }, pitch);
      break;
    case "time":
      for (let index = 0; index < 4; index += 1) {
        const at = index * 0.052;
        tone(context, { at, duration: 0.075, fromHz: profile.accentHz * (1 - index * 0.08), toHz: profile.accentHz * (0.74 + index * 0.03), gain: shineGain * 0.68, type: "square", pan: (index % 2 ? 0.58 : -0.58) * flip, space }, pitch);
      }
      noise(context, { at: 0.20, duration: 0.23, fromHz: 7200, toHz: 320, gain: slashGain * 1.12, filter: "highpass", space }, variation);
      [0.75, 1, 1.5, 2].forEach((ratio, index) => tone(context, { at: 0.205, duration: 0.32, fromHz: profile.bladeHz * ratio, toHz: profile.bodyHz * (1.4 + index * 0.2), gain: index === 0 ? bodyGain : shineGain * 0.72, type: index === 0 ? "triangle" : "sine", pan: (index - 1.5) * 0.25 * flip, space: space + 0.1 }, pitch));
      break;
    case "world-tree":
      for (let index = 0; index < 3; index += 1) {
        noise(context, { at: index * 0.047, duration: 0.13, fromHz: 940 - index * 170, toHz: 124, gain: slashGain * 0.68, filter: "bandpass", pan: (index - 1) * 0.34 * flip, space }, variation + index);
      }
      [1, 1.5, 2, 2.5].forEach((ratio, index) => tone(context, { at: 0.055 + index * 0.018, duration: 0.45, fromHz: profile.bodyHz * ratio, toHz: profile.bodyHz * ratio * 0.72, gain: index === 0 ? bodyGain * 1.18 : shineGain * 0.78, type: index % 2 ? "sine" : "triangle", pan: (index - 1.5) * 0.2 * flip, space: space + 0.13 }, pitch));
      noise(context, { at: 0.12, duration: 0.36, fromHz: 480, toHz: 3560, gain: slashGain * 0.82, filter: "highpass", space }, variation);
      break;
    case "myriad":
      for (let index = 0; index < 7; index += 1) {
        const at = index * 0.022;
        const pan = (((index * 3) % 7) / 3.5 - 0.86) * flip;
        noise(context, { at, duration: 0.11, fromHz: 7200 - index * 420, toHz: 720, gain: slashGain * 0.48, filter: "highpass", pan, space }, variation + index);
        tone(context, { at, duration: 0.10, fromHz: profile.accentHz * (0.82 + index * 0.045), toHz: profile.bladeHz * 0.54, gain: shineGain * 0.48, type: index % 2 ? "sine" : "triangle", pan, space }, pitch);
      }
      tone(context, { at: 0.145, duration: 0.44, fromHz: profile.bodyHz * 2.15, toHz: 26, gain: bodyGain * 1.58, type: "sawtooth", space: space + 0.08 }, pitch);
      noise(context, { at: 0.145, duration: 0.40, fromHz: 8200, toHz: 86, gain: slashGain * 1.12, filter: "bandpass", space }, variation);
      [1, 1.25, 1.5, 2, 2.5].forEach((ratio, index) => tone(context, { at: 0.16, duration: 0.44, fromHz: profile.bladeHz * ratio, toHz: profile.accentHz * ratio * 0.68, gain: shineGain * (0.82 - index * 0.075), type: "sine", pan: (index - 2) * 0.22 * flip, space: space + 0.16 }, pitch));
      break;
  }
}

function renderProgressionLayers(context: AudioContext, profile: WeaponSoundProfile, variation: number, pitch: number) {
  const flip = variation % 2 === 0 ? 1 : -1;
  if (profile.tier >= 4) {
    tone(context, { at: 0.11, duration: profile.duration * 0.72, fromHz: profile.accentHz * 1.08, toHz: profile.accentHz * 0.72, gain: 0.018 + profile.brilliance * 0.018, type: "sine", pan: 0.36 * flip, space: profile.space + 0.12 }, pitch);
  }
  if (profile.tier >= 7) {
    tone(context, { at: 0.055, duration: profile.duration * 0.7, fromHz: Math.max(46, profile.bodyHz * 0.72), toHz: 28, gain: 0.038 + profile.impact * 0.026, type: "sine", pan: -0.12 * flip, space: profile.space }, pitch);
  }
  if (profile.tier >= 10) {
    noise(context, { at: 0.08, duration: profile.duration * 0.62, fromHz: 7600, toHz: 980, gain: 0.018 + profile.slash * 0.022, filter: "highpass", pan: 0.62 * flip, space: profile.space + 0.1 }, variation + 17);
    noise(context, { at: 0.095, duration: profile.duration * 0.58, fromHz: 6800, toHz: 720, gain: 0.016 + profile.slash * 0.02, filter: "highpass", pan: -0.62 * flip, space: profile.space + 0.1 }, variation + 29);
  }
  if (profile.tier >= 13) {
    [1, 1.25, 1.5].forEach((ratio, index) => tone(context, { at: 0.18 + index * 0.008, duration: profile.duration * 0.72, fromHz: profile.accentHz * ratio, toHz: profile.accentHz * ratio * 0.74, gain: 0.022 + profile.brilliance * 0.014, type: "sine", pan: (index - 1) * 0.5 * flip, space: profile.space + 0.18 }, pitch));
  }
}

export function playWeaponAttackSound(context: AudioContext, tier: number, variation = 0) {
  const profile = WEAPON_SOUND_PROFILES[clampTier(tier)];
  const pitch = 1 + ((variation % 5) - 2) * 0.006;
  renderSignature(context, profile, variation, pitch);
  renderProgressionLayers(context, profile, variation, pitch);
  return profile;
}

export function weaponTierFromClassName(className: string) {
  const match = className.match(/(?:^|\s)click-style-(\d+)(?=\s|$)/);
  return match ? clampTier(Number(match[1])) : null;
}

function findAttackArena(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const directArena = target.closest<HTMLElement>(".hack-arena");
  if (directArena) return directArena;
  if (!target.closest(".attack-button")) return null;
  return document.querySelector<HTMLElement>(".hack-arena");
}

export function installWeaponAttackAudio() {
  let context: AudioContext | null = null;
  let variation = 0;
  let disposed = false;
  document.documentElement.dataset.weaponAudio = "ready";

  const playFromPointer = (event: PointerEvent) => {
    const arena = findAttackArena(event.target);
    const attackButton = document.querySelector<HTMLButtonElement>(".attack-button");
    if (!arena || !attackButton || attackButton.disabled) return;
    const tier = weaponTierFromClassName(arena.className);
    if (tier === null || typeof window.AudioContext === "undefined") return;

    context ??= new window.AudioContext({ latencyHint: "interactive" });
    const activeContext = context;
    const currentVariation = variation;
    variation += 1;

    const play = () => {
      if (disposed || activeContext.state === "closed") return;
      const profile = playWeaponAttackSound(activeContext, tier, currentVariation);
      arena.dataset.lastWeaponSound = profile.key;
      arena.dataset.lastWeaponSoundTier = String(profile.tier);
      window.dispatchEvent(new CustomEvent("guild:weapon-attack-sound", { detail: { tier: profile.tier, key: profile.key, weaponName: profile.weaponName } }));
    };

    if (activeContext.state === "suspended") void activeContext.resume().then(play).catch(() => undefined);
    else play();
  };

  document.addEventListener("pointerdown", playFromPointer, { capture: true });
  return () => {
    disposed = true;
    document.removeEventListener("pointerdown", playFromPointer, { capture: true });
    delete document.documentElement.dataset.weaponAudio;
    if (context && context.state !== "closed") void context.close();
  };
}
