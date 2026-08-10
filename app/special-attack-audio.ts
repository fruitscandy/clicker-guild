import { effectiveSfxVolume, readAudioSettings, subscribeAudioSettings } from "./audio-settings";
import type { SpecialAttackKind } from "./special-attacks";

type SpecialSoundPhase = "cast" | "impact" | "pulse";

let specialAudioContext: AudioContext | null = null;
let specialMasterGain: GainNode | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;
let subscribed = false;
const SHARED_NOISE_BUFFER_SECONDS = 0.32;

function getContext() {
  if (typeof window === "undefined") return null;
  const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;
  specialAudioContext ??= new Context();
  if (!specialMasterGain) {
    specialMasterGain = specialAudioContext.createGain();
    specialMasterGain.gain.setValueAtTime(effectiveSfxVolume(readAudioSettings()) * 0.92, specialAudioContext.currentTime);
    specialMasterGain.connect(specialAudioContext.destination);
  }
  if (!subscribed) {
    subscribed = true;
    subscribeAudioSettings((settings) => {
      if (!specialAudioContext || !specialMasterGain) return;
      specialMasterGain.gain.setTargetAtTime(effectiveSfxVolume(settings) * 0.92, specialAudioContext.currentTime, 0.03);
    });
  }
  return specialAudioContext;
}

function tone(context: AudioContext, start: number, duration: number, from: number, to: number, volume: number, type: OscillatorType = "sine") {
  if (!specialMasterGain) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(1, from), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.018, duration * 0.18));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(specialMasterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function getSharedNoiseBuffer(context: AudioContext) {
  if (sharedNoiseBuffer?.sampleRate === context.sampleRate) return sharedNoiseBuffer;
  const frameCount = Math.max(1, Math.floor(context.sampleRate * SHARED_NOISE_BUFFER_SECONDS));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
  sharedNoiseBuffer = buffer;
  return buffer;
}

function noise(context: AudioContext, start: number, duration: number, volume: number, from: number, to: number, type: BiquadFilterType = "bandpass") {
  if (!specialMasterGain) return;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = type;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  filter.Q.setValueAtTime(type === "bandpass" ? 1.5 : 0.72, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.025, duration * 0.15));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = getSharedNoiseBuffer(context);
  source.loop = true;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(specialMasterGain);
  source.start(start);
  source.stop(start + duration + 0.02);
}

function playLightning(context: AudioContext, phase: SpecialSoundPhase) {
  const start = context.currentTime;
  if (phase === "cast") {
    tone(context, start, 0.18, 1_480, 4_900, 0.018, "sawtooth");
    noise(context, start + 0.05, 0.16, 0.024, 5_800, 1_900);
    return;
  }
  noise(context, start, 0.09, 0.085, 8_400, 1_100);
  noise(context, start + 0.018, 0.38, 0.046, 1_300, 170, "lowpass");
  tone(context, start, 0.44, 112, 48, 0.055, "triangle");
  [0.025, 0.072, 0.128].forEach((offset, index) => tone(context, start + offset, 0.08, 2_200 + index * 730, 620 + index * 80, 0.016, "square"));
}

function playTornado(context: AudioContext, phase: SpecialSoundPhase) {
  const start = context.currentTime;
  if (phase === "pulse") {
    noise(context, start, 0.24, 0.025, 1_900, 520);
    tone(context, start, 0.2, 230, 130, 0.016, "triangle");
    return;
  }
  noise(context, start, 1.15, 0.034, 240, 1_600, "bandpass");
  noise(context, start + 0.16, 1.25, 0.028, 1_800, 360, "bandpass");
  tone(context, start, 1.1, 82, 126, 0.028, "sine");
  [0, 0.27, 0.54, 0.81].forEach((offset) => tone(context, start + offset, 0.34, 310, 195, 0.012, "triangle"));
}

function playMeteor(context: AudioContext, phase: SpecialSoundPhase) {
  const start = context.currentTime;
  if (phase === "cast") {
    tone(context, start, 0.78, 1_420, 118, 0.034, "sawtooth");
    noise(context, start, 0.78, 0.024, 3_200, 240, "bandpass");
    tone(context, start + 0.1, 0.62, 460, 74, 0.023, "triangle");
    return;
  }
  noise(context, start, 0.16, 0.11, 3_600, 120, "lowpass");
  noise(context, start + 0.03, 0.78, 0.058, 620, 65, "lowpass");
  tone(context, start, 0.75, 92, 31, 0.085, "sine");
  tone(context, start + 0.02, 0.46, 185, 48, 0.048, "triangle");
  [0.08, 0.15, 0.24].forEach((offset, index) => noise(context, start + offset, 0.17, 0.025 - index * 0.004, 1_800 - index * 260, 290));
}

export function playSpecialAttackSound(kind: SpecialAttackKind, phase: SpecialSoundPhase = "cast") {
  const context = getContext();
  if (!context) return;
  const play = () => {
    if (kind === "lightning") playLightning(context, phase);
    else if (kind === "tornado") playTornado(context, phase);
    else playMeteor(context, phase);
  };
  if (context.state === "running") play();
  else void context.resume().then(play).catch(() => undefined);
}
