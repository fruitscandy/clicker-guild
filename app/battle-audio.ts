import type { LootSoundProfile } from "./stage-materials";

let battleAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  battleAudioContext ??= new AudioContextClass();
  return battleAudioContext;
}

function tone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.018, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noiseBurst(
  context: AudioContext,
  start: number,
  duration: number,
  volume: number,
  frequency: number,
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
  filter.Q.setValueAtTime(1.2, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
}

export function unlockBattleAudio() {
  const context = getAudioContext();
  if (!context || context.state === "running") return;
  void context.resume().catch(() => undefined);
}

export function playLootDropSound(profile: LootSoundProfile, dropIndex = 0) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  const variation = (dropIndex % 5 - 2) * 13;

  if (profile === "coin") {
    tone(context, 1180 + variation * 2, start, 0.19, 0.028, "sine", 940 + variation);
    tone(context, 2310 + variation * 4, start + 0.008, 0.11, 0.012, "triangle", 1780 + variation * 2);
    tone(context, 420 + variation, start + 0.018, 0.09, 0.013, "triangle", 310 + variation);
    noiseBurst(context, start, 0.045, 0.012, 3100);
    return;
  }
  if (profile === "organic") {
    tone(context, 370 + variation, start, 0.16, 0.025, "triangle", 250 + variation);
    tone(context, 680 + variation, start + 0.025, 0.13, 0.014, "sine", 520 + variation);
    noiseBurst(context, start, 0.055, 0.009, 1100);
    return;
  }
  if (profile === "stone") {
    tone(context, 190 + variation / 2, start, 0.17, 0.032, "triangle", 104 + variation / 3);
    tone(context, 510 + variation, start + 0.012, 0.09, 0.01, "square", 350 + variation);
    noiseBurst(context, start, 0.07, 0.018, 620);
    return;
  }
  if (profile === "molten") {
    tone(context, 145 + variation / 3, start, 0.22, 0.029, "sawtooth", 82 + variation / 4);
    tone(context, 760 + variation * 2, start + 0.035, 0.13, 0.012, "triangle", 430 + variation);
    noiseBurst(context, start + 0.02, 0.11, 0.015, 1550);
    return;
  }
  if (profile === "ethereal") {
    tone(context, 520 + variation, start, 0.28, 0.022, "sine", 860 + variation * 2);
    tone(context, 1040 + variation * 2, start + 0.035, 0.2, 0.009, "sine", 1370 + variation * 3);
    return;
  }
  if (profile === "scale") {
    tone(context, 330 + variation, start, 0.2, 0.026, "triangle", 245 + variation);
    tone(context, 990 + variation * 2, start + 0.015, 0.17, 0.015, "sine", 720 + variation);
    noiseBurst(context, start, 0.06, 0.01, 2400);
    return;
  }
  tone(context, 880 + variation * 2, start, 0.24, 0.024, "sine", 620 + variation);
  tone(context, 1320 + variation * 3, start + 0.018, 0.16, 0.013, "triangle", 940 + variation * 2);
  noiseBurst(context, start, 0.045, 0.008, 2800);
}

export function playLootCollectSound(profile: LootSoundProfile, index: number, total: number) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const progress = total <= 1 ? 1 : index / (total - 1);
  const base = profile === "coin" ? 650 : profile === "stone" || profile === "molten" ? 430 : profile === "organic" ? 520 : 710;
  const frequency = base * Math.pow(2, progress * 0.76);
  const start = context.currentTime;
  tone(context, frequency, start, 0.13, 0.027, profile === "molten" ? "triangle" : "sine", frequency * 1.09);
  tone(context, frequency * 2.01, start + 0.016, 0.075, 0.01, "triangle", frequency * 2.08);
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
