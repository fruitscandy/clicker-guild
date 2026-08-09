import type { LootSoundProfile } from "./stage-materials";
import {
  effectiveSfxVolume,
  readAudioSettings,
  subscribeAudioSettings,
} from "./audio-settings";

let battleAudioContext: AudioContext | null = null;
let sfxMasterGain: GainNode | null = null;
let listeningToAudioSettings = false;
let lastMonsterHitAt = -1;
let monsterHitVariation = 0;

const GOLD_COIN_SAMPLE_URLS = [
  "/assets/audio/loot/gold-coin-clink-01.mp3",
  "/assets/audio/loot/gold-coin-jingle-02.mp3",
] as const;

let goldCoinSampleBuffers: AudioBuffer[] = [];
let goldCoinSamplePromise: Promise<void> | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  battleAudioContext ??= new AudioContextClass();
  return battleAudioContext;
}

function getSfxOutput(context: AudioContext) {
  if (!sfxMasterGain) {
    const initialSettings = readAudioSettings();
    sfxMasterGain = context.createGain();
    sfxMasterGain.gain.setValueAtTime(effectiveSfxVolume(initialSettings), context.currentTime);
    sfxMasterGain.connect(context.destination);
  }

  if (!listeningToAudioSettings) {
    listeningToAudioSettings = true;
    subscribeAudioSettings((settings) => {
      if (!sfxMasterGain || !battleAudioContext) return;
      sfxMasterGain.gain.setTargetAtTime(
        effectiveSfxVolume(settings),
        battleAudioContext.currentTime,
        0.025,
      );
    });
  }

  return sfxMasterGain;
}

function prepareGoldCoinSamples(context: AudioContext) {
  if (goldCoinSampleBuffers.length === GOLD_COIN_SAMPLE_URLS.length) return Promise.resolve();
  if (goldCoinSamplePromise) return goldCoinSamplePromise;

  goldCoinSamplePromise = Promise.allSettled(
    GOLD_COIN_SAMPLE_URLS.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load coin sound: ${response.status}`);
      return context.decodeAudioData(await response.arrayBuffer());
    }),
  ).then((results) => {
    goldCoinSampleBuffers = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  }).finally(() => {
    goldCoinSamplePromise = null;
  });

  return goldCoinSamplePromise;
}

function playGoldCoinSample(context: AudioContext, start: number, dropIndex: number) {
  if (!goldCoinSampleBuffers.length) {
    void prepareGoldCoinSamples(context);
    return false;
  }

  // The shorter jingle is favored so every drop reads as game gold, while the
  // harder real-coin impact keeps repeated monster kills from sounding cloned.
  const requestedIndex = dropIndex % 3 === 0 ? 0 : 1;
  const sampleIndex = requestedIndex % goldCoinSampleBuffers.length;
  const source = context.createBufferSource();
  const gain = context.createGain();
  const pitchVariation = [0.97, 1.015, 0.99, 1.035, 0.955][dropIndex % 5];

  source.buffer = goldCoinSampleBuffers[sampleIndex];
  source.playbackRate.setValueAtTime(pitchVariation, start);
  gain.gain.setValueAtTime(sampleIndex === 0 ? 0.2 : 0.27, start);
  source.connect(gain);
  gain.connect(getSfxOutput(context));
  source.start(start);
  return true;
}

function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  endFrequency = frequency,
  attackDuration = Math.min(0.018, duration * 0.2),
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attackDuration);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(getSfxOutput(context));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noiseBurst(
  context: AudioContext,
  start: number,
  duration: number,
  volume: number,
  frequency: number,
  endFrequency = frequency,
) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    const decay = Math.pow(1 - index / frameCount, 2.8);
    channel[index] = (Math.random() * 2 - 1) * decay;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  filter.Q.setValueAtTime(1.2, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getSfxOutput(context));
  source.start(start);
}

function playWhenAudioIsReady(play: (context: AudioContext) => void) {
  const context = getAudioContext();
  if (!context) return;
  getSfxOutput(context);
  if (context.state === "running") {
    play(context);
    return;
  }
  void context.resume().then(() => play(context)).catch(() => undefined);
}

export function unlockBattleAudio() {
  const context = getAudioContext();
  if (!context) return;
  getSfxOutput(context);
  void prepareGoldCoinSamples(context);
  if (context.state !== "running") void context.resume().catch(() => undefined);
}

export function playSoundSettingsPreview() {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    tone(context, 587, start, 0.13, 0.03, "triangle", 740);
    tone(context, 880, start + 0.07, 0.2, 0.025, "sine", 1175);
  });
}

export function playMenuTabSound() {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    tone(context, 420, start, 0.065, 0.018, "triangle", 610, 0.002);
    tone(context, 840, start + 0.018, 0.055, 0.009, "sine", 1120, 0.0015);
    noiseBurst(context, start, 0.026, 0.006, 2600, 4200);
  });
}

export function playExpeditionStartSound(boss = false) {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    const weight = boss ? 1.18 : 1;
    tone(context, boss ? 82 : 98, start, 0.34, 0.04 * weight, "triangle", boss ? 61 : 73, 0.004);
    noiseBurst(context, start, 0.16, 0.026 * weight, 210, 92);
    tone(context, boss ? 164 : 196, start + 0.07, 0.34, 0.023, "sawtooth", boss ? 220 : 262, 0.018);
    tone(context, boss ? 246 : 294, start + 0.15, 0.31, 0.018, "triangle", boss ? 328 : 392, 0.014);
    tone(context, boss ? 328 : 392, start + 0.25, 0.3, 0.016, "sine", boss ? 438 : 523, 0.012);
  });
}

export function playGuildMemberHireSound() {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    tone(context, 145, start, 0.13, 0.027, "triangle", 92, 0.003);
    noiseBurst(context, start, 0.055, 0.012, 1200, 620);
    [523, 659, 784].forEach((frequency, index) => {
      tone(context, frequency, start + 0.055 + index * 0.065, 0.25, 0.021, "sine", frequency * 1.025, 0.008);
      tone(context, frequency * 2, start + 0.065 + index * 0.065, 0.14, 0.006, "triangle", frequency * 2.08, 0.004);
    });
  });
}

export function playExpeditionFailSound() {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    noiseBurst(context, start, 0.22, 0.02, 520, 110);
    tone(context, 392, start, 0.26, 0.023, "triangle", 311, 0.01);
    tone(context, 294, start + 0.13, 0.32, 0.026, "triangle", 220, 0.012);
    tone(context, 196, start + 0.28, 0.48, 0.032, "sawtooth", 98, 0.018);
    tone(context, 73, start + 0.3, 0.5, 0.035, "sine", 49, 0.008);
  });
}

export function playMonsterHitSound(impactTier = 0, targetCount = 1) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  if (start - lastMonsterHitAt < 0.035) return;
  lastMonsterHitAt = start;
  monsterHitVariation = (monsterHitVariation + 1) % 5;

  const tier = Math.max(0, Math.min(4, impactTier));
  const crowdWeight = Math.min(1, Math.max(0, targetCount - 1) / 7);
  const variation = (monsterHitVariation - 2) * 18;
  const bodyFrequency = 175 + tier * 28 + variation;
  noiseBurst(context, start, 0.048 + tier * 0.008, 0.012 + tier * 0.003 + crowdWeight * 0.004, 1850 + tier * 280, 620 + tier * 90);
  tone(context, bodyFrequency, start, 0.072 + tier * 0.012, 0.018 + tier * 0.003, "triangle", Math.max(72, bodyFrequency * 0.55), 0.002);
  if (tier >= 2 || targetCount >= 4) {
    tone(context, 720 + tier * 90 + variation, start + 0.012, 0.065, 0.008 + crowdWeight * 0.003, "square", 360 + tier * 55, 0.0015);
  }
}

export function playLootDropSound(profile: LootSoundProfile, dropIndex = 0) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  const variation = (dropIndex % 5 - 2) * 13;

  if (profile === "coin") {
    if (playGoldCoinSample(context, start, dropIndex)) return;
    // The recorded CC0 samples are normally preloaded at battle start. This
    // compact fallback only covers a first-frame cache miss or network failure.
    tone(context, 2380 + variation * 3, start, 0.12, 0.022, "triangle", 1510 + variation * 2, 0.002);
    tone(context, 3650 + variation * 4, start + 0.035, 0.09, 0.012, "sine", 2460 + variation * 2, 0.0015);
    noiseBurst(context, start, 0.024, 0.007, 7200, 3900);
    return;
  }
  if (profile === "coin-pouch") {
    tone(context, 170 + variation / 4, start, 0.16, 0.03, "triangle", 105 + variation / 5);
    noiseBurst(context, start, 0.085, 0.015, 1050, 620);
    [0.016, 0.046, 0.078].forEach((offset, index) => {
      tone(context, 1120 + variation * 2 + index * 180, start + offset, 0.09, 0.012, "sine", 840 + variation + index * 120);
    });
    return;
  }
  if (profile === "cash-bundle") {
    tone(context, 128 + variation / 6, start + 0.01, 0.16, 0.026, "triangle", 78 + variation / 8);
    tone(context, 520 + variation, start + 0.018, 0.1, 0.011, "triangle", 330 + variation / 2);
    noiseBurst(context, start, 0.11, 0.022, 2800, 920);
    noiseBurst(context, start + 0.035, 0.07, 0.012, 4100, 1700);
    return;
  }
  if (profile === "seed-amber") {
    tone(context, 350 + variation, start, 0.17, 0.025, "triangle", 220 + variation / 2);
    tone(context, 690 + variation, start + 0.025, 0.14, 0.014, "sine", 510 + variation);
    noiseBurst(context, start, 0.055, 0.009, 1120, 760);
    return;
  }
  if (profile === "sun-glass") {
    tone(context, 980 + variation * 2, start, 0.24, 0.024, "sine", 790 + variation);
    tone(context, 1660 + variation * 3, start + 0.014, 0.18, 0.016, "triangle", 1290 + variation * 2);
    tone(context, 2640 + variation * 4, start + 0.025, 0.1, 0.008, "sine", 2040 + variation * 2);
    noiseBurst(context, start, 0.035, 0.006, 3800, 2900);
    return;
  }
  if (profile === "toxic-spore") {
    tone(context, 250 + variation / 2, start, 0.2, 0.027, "sine", 118 + variation / 4);
    tone(context, 470 + variation, start + 0.026, 0.15, 0.015, "triangle", 310 + variation / 2);
    noiseBurst(context, start + 0.01, 0.08, 0.012, 760, 430);
    return;
  }
  if (profile === "black-iron") {
    tone(context, 190 + variation / 3, start, 0.19, 0.034, "triangle", 88 + variation / 5);
    tone(context, 520 + variation, start + 0.012, 0.1, 0.012, "square", 290 + variation / 2);
    noiseBurst(context, start, 0.075, 0.019, 650, 410);
    return;
  }
  if (profile === "frost-heart") {
    tone(context, 1280 + variation * 2, start, 0.24, 0.023, "sine", 900 + variation);
    tone(context, 2180 + variation * 3, start + 0.012, 0.16, 0.013, "triangle", 1450 + variation * 2);
    noiseBurst(context, start, 0.045, 0.009, 4600, 2900);
    return;
  }
  if (profile === "magma-core") {
    tone(context, 132 + variation / 4, start, 0.24, 0.031, "sawtooth", 64 + variation / 6);
    tone(context, 650 + variation * 2, start + 0.034, 0.14, 0.013, "triangle", 290 + variation);
    noiseBurst(context, start + 0.018, 0.13, 0.017, 1950, 780);
    return;
  }
  if (profile === "soul-pearl") {
    tone(context, 480 + variation, start, 0.29, 0.022, "sine", 850 + variation * 2);
    tone(context, 960 + variation * 2, start + 0.035, 0.22, 0.01, "sine", 1390 + variation * 3);
    noiseBurst(context, start + 0.02, 0.12, 0.006, 2200, 4100);
    return;
  }
  if (profile === "storm-prism") {
    tone(context, 320 + variation, start, 0.11, 0.02, "square", 170 + variation / 2);
    tone(context, 1820 + variation * 3, start + 0.008, 0.12, 0.015, "sawtooth", 920 + variation * 2);
    noiseBurst(context, start, 0.052, 0.018, 5400, 1700);
    return;
  }
  if (profile === "blood-obsidian") {
    tone(context, 165 + variation / 3, start, 0.22, 0.032, "triangle", 82 + variation / 5);
    tone(context, 740 + variation, start + 0.024, 0.15, 0.013, "triangle", 410 + variation);
    noiseBurst(context, start, 0.09, 0.014, 920, 560);
    return;
  }
  tone(context, 340 + variation, start, 0.2, 0.027, "triangle", 230 + variation / 2);
  tone(context, 1060 + variation * 2, start + 0.015, 0.17, 0.015, "sine", 690 + variation);
  noiseBurst(context, start, 0.065, 0.012, 2800, 1200);
}

export function playLootCollectSound(profile: LootSoundProfile, index: number, total: number) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const progress = total <= 1 ? 1 : index / (total - 1);
  const bases: Record<LootSoundProfile, number> = {
    coin: 690,
    "coin-pouch": 570,
    "cash-bundle": 470,
    "seed-amber": 520,
    "sun-glass": 780,
    "toxic-spore": 410,
    "black-iron": 360,
    "frost-heart": 860,
    "magma-core": 390,
    "soul-pearl": 690,
    "storm-prism": 800,
    "blood-obsidian": 440,
    "dragon-scale": 590,
  };
  const base = bases[profile];
  const frequency = base * Math.pow(2, progress * 0.76);
  const start = context.currentTime;
  const voice: OscillatorType = profile === "magma-core" || profile === "black-iron" || profile === "blood-obsidian" || profile === "cash-bundle" ? "triangle" : "sine";
  tone(context, frequency, start, 0.13, 0.027, voice, frequency * 1.09);
  tone(context, frequency * 2.01, start + 0.016, 0.075, 0.01, "triangle", frequency * 2.08);
  if (profile === "cash-bundle") noiseBurst(context, start, 0.045, 0.005, 2600, 1300);
}

export function playLootCompleteSound() {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  [784, 988, 1175].forEach((frequency, index) => {
    tone(context, frequency, start + index * 0.055, 0.28, 0.025, "sine", frequency * 1.015);
  });
  tone(context, 392, start, 0.38, 0.016, "triangle", 523);
}

export function playGoldDropSound(dropIndex = 0) { playLootDropSound("coin", dropIndex); }
export function playGoldCollectSound(index: number, total: number) { playLootCollectSound("coin", index, total); }
export function playGoldCompleteSound() { playLootCompleteSound(); }
