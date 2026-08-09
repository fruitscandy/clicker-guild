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

export function unlockBattleAudio() {
  const context = getAudioContext();
  if (!context || context.state === "running") return;
  void context.resume().catch(() => undefined);
}

export function playGoldDropSound(dropIndex = 0) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  const variation = dropIndex % 4 * 18;
  tone(context, 265 + variation, start, 0.13, 0.024, "triangle", 185 + variation);
  tone(context, 980 + variation * 3, start + 0.025, 0.085, 0.018, "sine", 720 + variation * 2);
}

export function playGoldCollectSound(index: number, total: number) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const progress = total <= 1 ? 1 : index / (total - 1);
  const frequency = 620 * Math.pow(2, progress * 0.72);
  const start = context.currentTime;
  tone(context, frequency, start, 0.12, 0.032, "sine", frequency * 1.08);
  tone(context, frequency * 2.01, start + 0.018, 0.07, 0.012, "triangle", frequency * 2.08);
}

export function playGoldCompleteSound() {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  [784, 988, 1175].forEach((frequency, index) => {
    tone(context, frequency, start + index * 0.055, 0.28, 0.025, "sine", frequency * 1.015);
  });
}
