import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "public/assets/audio/bgm");
const SAMPLE_RATE = 22_050;
const TAU = Math.PI * 2;

let randomState = 0x42c11c;
function random() {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return (randomState >>> 0) / 4_294_967_296;
}

function hz(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function envelope(t, duration, attack = 0.02, release = 0.18) {
  const a = Math.min(1, t / Math.max(0.001, attack));
  const r = Math.min(1, (duration - t) / Math.max(0.001, release));
  return Math.max(0, Math.min(a, r));
}

function makeTrack({ name, bpm, bars, seed, compose }) {
  randomState = seed;
  const beat = 60 / bpm;
  const duration = beat * 4 * bars;
  const frames = Math.ceil(duration * SAMPLE_RATE);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);

  function mixSample(index, value, pan = 0) {
    if (index < 0 || index >= frames) return;
    const angle = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
    left[index] += value * Math.cos(angle);
    right[index] += value * Math.sin(angle);
  }

  function tone({ start, duration: length, midi, gain, pan = 0, instrument = "sine", attack, release }) {
    const from = Math.floor(start * SAMPLE_RATE);
    const count = Math.floor(length * SAMPLE_RATE);
    const frequency = hz(midi);
    const detune = instrument === "pad" || instrument === "choir" ? 0.004 : 0;
    let previousNoise = 0;

    for (let i = 0; i < count; i += 1) {
      const t = i / SAMPLE_RATE;
      const phase = TAU * frequency * t;
      const env = envelope(t, length, attack ?? (instrument === "pad" || instrument === "choir" ? 0.34 : 0.012), release ?? (instrument === "pad" || instrument === "choir" ? 0.5 : 0.18));
      let wave = Math.sin(phase);

      if (instrument === "pluck") {
        wave = (Math.sin(phase) + 0.42 * Math.sin(phase * 2) + 0.18 * Math.sin(phase * 3)) * Math.exp(-t * 3.7);
      } else if (instrument === "lute") {
        wave = (Math.sin(phase) + 0.34 * Math.sin(phase * 2.01) + 0.12 * Math.sin(phase * 4.03)) * Math.exp(-t * 4.4);
      } else if (instrument === "flute") {
        wave = Math.sin(phase + Math.sin(TAU * 5.1 * t) * 0.018) + 0.17 * Math.sin(phase * 2);
      } else if (instrument === "strings") {
        wave = Math.tanh(1.7 * (Math.sin(phase) + 0.35 * Math.sin(phase * 2) + 0.17 * Math.sin(phase * 3)));
      } else if (instrument === "brass") {
        wave = Math.tanh(2.1 * (Math.sin(phase) + 0.48 * Math.sin(phase * 2) + 0.2 * Math.sin(phase * 3)));
      } else if (instrument === "pad") {
        wave = Math.sin(phase) * 0.7 + Math.sin(phase * (1 + detune)) * 0.2 + Math.sin(phase * 0.5) * 0.1;
      } else if (instrument === "choir") {
        wave = Math.sin(phase + Math.sin(TAU * 4.3 * t) * 0.04) * 0.72 + Math.sin(phase * 2) * 0.16 + Math.sin(phase * 0.5) * 0.12;
      } else if (instrument === "bass") {
        wave = Math.sin(phase) + 0.24 * Math.sin(phase * 2);
      } else if (instrument === "bell") {
        wave = (Math.sin(phase) + 0.45 * Math.sin(phase * 2.71) + 0.22 * Math.sin(phase * 4.18)) * Math.exp(-t * 2.9);
      } else if (instrument === "hurdy") {
        wave = Math.tanh(1.35 * (Math.sin(phase) + 0.38 * Math.sin(phase * 2) + 0.22 * Math.sin(phase * 3) + 0.1 * Math.sin(phase * 5)));
      } else if (instrument === "shawm") {
        wave = Math.tanh(1.5 * (Math.sin(phase + Math.sin(TAU * 5.8 * t) * 0.028) + 0.42 * Math.sin(phase * 3) + 0.16 * Math.sin(phase * 5)));
      } else if (instrument === "recorder") {
        wave = Math.sin(phase + Math.sin(TAU * 5.4 * t) * 0.014) + 0.22 * Math.sin(phase * 2) + 0.06 * Math.sin(phase * 3);
      } else if (instrument === "noise") {
        const raw = random() * 2 - 1;
        previousNoise += (raw - previousNoise) * 0.22;
        wave = previousNoise;
      }

      mixSample(from + i, wave * env * gain, pan);
    }
  }

  function drum({ start, gain, kind = "kick", pan = 0 }) {
    const length = kind === "taiko" ? 0.62 : kind === "frame" ? 0.38 : kind === "kick" ? 0.28 : kind === "snare" ? 0.2 : 0.075;
    const from = Math.floor(start * SAMPLE_RATE);
    const count = Math.floor(length * SAMPLE_RATE);
    let filtered = 0;
    for (let i = 0; i < count; i += 1) {
      const t = i / SAMPLE_RATE;
      const decay = Math.exp(-t * (kind === "taiko" ? 5.1 : kind === "frame" ? 8.2 : kind === "kick" ? 11 : kind === "snare" ? 19 : 42));
      const noise = random() * 2 - 1;
      filtered += (noise - filtered) * (kind === "hat" ? 0.82 : 0.3);
      let value;
      if (kind === "kick") value = Math.sin(TAU * (74 - t * 155) * t) * decay;
      else if (kind === "taiko") value = (Math.sin(TAU * (64 - t * 33) * t) + filtered * 0.16) * decay;
      else if (kind === "frame") value = (Math.sin(TAU * (92 - t * 48) * t) * 0.76 + filtered * 0.24) * decay;
      else if (kind === "snare") value = (filtered * 0.78 + Math.sin(TAU * 176 * t) * 0.22) * decay;
      else value = filtered * decay;
      mixSample(from + i, value * gain, pan);
    }
  }

  compose({ beat, bars, tone, drum });

  const fadeFrames = Math.floor(SAMPLE_RATE * 0.025);
  for (let i = 0; i < fadeFrames; i += 1) {
    const factor = Math.sin((i / fadeFrames) * Math.PI / 2) ** 2;
    left[i] *= factor;
    right[i] *= factor;
    left[frames - 1 - i] *= factor;
    right[frames - 1 - i] *= factor;
  }

  let peak = 0;
  for (let i = 0; i < frames; i += 1) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const makeup = 0.88 / Math.max(0.001, peak);
  for (let i = 0; i < frames; i += 1) {
    left[i] = Math.tanh(left[i] * makeup * 1.08) / Math.tanh(1.08);
    right[i] = Math.tanh(right[i] * makeup * 1.08) / Math.tanh(1.08);
  }

  return { name, bpm, bars, duration, left, right };
}

function writeWav(track) {
  const frames = track.left.length;
  const channels = 2;
  const bytesPerSample = 2;
  const dataBytes = frames * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, track.left[i])) * 32_767), offset);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, track.right[i])) * 32_767), offset + 2);
    offset += 4;
  }
  return buffer;
}

const progression = [
  [0, 4, 7],
  [-3, 0, 4],
  [-5, 0, 5],
  [-5, -1, 2],
];

const tracks = [
  makeTrack({
    name: "guild-hearth",
    bpm: 84,
    bars: 16,
    seed: 0x47011d,
    compose({ beat, bars, tone, drum }) {
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const chord = progression[bar % 4];
        chord.forEach((step, index) => tone({ start: start + 0.02, duration: beat * 3.92, midi: 48 + step, gain: 0.055, pan: (index - 1) * 0.36, instrument: "pad" }));
        for (let eighth = 0; eighth < 8; eighth += 1) {
          const note = chord[[0, 1, 2, 1, 2, 1, 0, 1][eighth]] + 60 + (eighth === 4 ? 12 : 0);
          tone({ start: start + eighth * beat / 2, duration: beat * 0.72, midi: note, gain: 0.145, pan: eighth % 2 ? 0.24 : -0.24, instrument: "lute" });
        }
        tone({ start, duration: beat * 1.8, midi: 36 + chord[0], gain: 0.115, pan: -0.08, instrument: "bass" });
        tone({ start: start + beat * 2, duration: beat * 1.7, midi: 36 + chord[0], gain: 0.09, pan: 0.08, instrument: "bass" });
        [0, 2].forEach((b) => drum({ start: start + b * beat, gain: 0.055, kind: "kick" }));
        [1, 3].forEach((b) => drum({ start: start + b * beat, gain: 0.025, kind: "hat", pan: b === 1 ? -0.3 : 0.3 }));
        if (bar >= 8 && bar % 2 === 1) {
          [72, 74, 76, 79].forEach((note, index) => tone({ start: start + (index + 0.5) * beat, duration: beat * 0.82, midi: note + (bar % 4 === 3 ? -2 : 0), gain: 0.052, pan: 0.38, instrument: "bell" }));
        }
      }
    },
  }),
  makeTrack({
    name: "frontier-map",
    bpm: 96,
    bars: 16,
    seed: 0xf13d5e,
    compose({ beat, bars, tone, drum }) {
      const chords = [[0, 3, 7], [-2, 2, 5], [2, 5, 9], [0, 3, 7]];
      const melody = [74, 77, 79, 81, 79, 77, 76, 74, 72, 74, 77, 76, 74, 72, 69, 72];
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const chord = chords[bar % 4];
        chord.forEach((step, index) => tone({ start: start + 0.02, duration: beat * 3.92, midi: 50 + step, gain: 0.045, pan: (index - 1) * 0.45, instrument: "pad" }));
        for (let eighth = 0; eighth < 8; eighth += 1) {
          const note = 62 + chord[[0, 1, 2, 1, 0, 2, 1, 2][eighth]] + (eighth >= 4 ? 12 : 0);
          tone({ start: start + eighth * beat / 2, duration: beat * 0.42, midi: note, gain: 0.105, pan: eighth % 2 ? 0.42 : -0.42, instrument: "pluck" });
          drum({ start: start + eighth * beat / 2, gain: eighth % 2 ? 0.024 : 0.04, kind: "hat", pan: eighth % 2 ? 0.5 : -0.5 });
        }
        tone({ start, duration: beat * 1.75, midi: 38 + chord[0], gain: 0.13, instrument: "bass" });
        tone({ start: start + beat * 2, duration: beat * 1.65, midi: 38 + chord[2] - 12, gain: 0.105, instrument: "bass" });
        [0, 2.5].forEach((b) => drum({ start: start + b * beat, gain: 0.065, kind: "kick" }));
        [1, 3].forEach((b) => drum({ start: start + b * beat, gain: 0.04, kind: "snare", pan: b === 1 ? -0.15 : 0.15 }));
        if (bar >= 4) {
          tone({ start: start + beat * 0.15, duration: beat * 1.55, midi: melody[bar], gain: 0.088, pan: 0.18, instrument: "flute", attack: 0.06, release: 0.25 });
          tone({ start: start + beat * 2.1, duration: beat * 1.4, midi: melody[(bar + 3) % melody.length] - 2, gain: 0.075, pan: -0.18, instrument: "flute", attack: 0.05, release: 0.22 });
        }
      }
    },
  }),
  makeTrack({
    name: "steel-rush",
    bpm: 136,
    bars: 16,
    seed: 0xba771e,
    compose({ beat, bars, tone, drum }) {
      const roots = [40, 40, 36, 38, 40, 40, 38, 35];
      const riff = [0, 0, 7, 3, 0, 10, 7, 3, 0, 0, 7, 12, 10, 7, 3, 2];
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const root = roots[bar % roots.length];
        [root, root + 7].forEach((note, index) => tone({ start: start + 0.01, duration: beat * 3.94, midi: note, gain: 0.035, pan: index ? 0.42 : -0.42, instrument: "pad", attack: 0.16, release: 0.26 }));
        for (let sixteenth = 0; sixteenth < 16; sixteenth += 1) {
          const accented = sixteenth % 4 === 0;
          tone({ start: start + sixteenth * beat / 4, duration: beat * 0.2, midi: root + 12 + riff[sixteenth], gain: accented ? 0.105 : 0.067, pan: sixteenth % 2 ? 0.36 : -0.36, instrument: "strings", attack: 0.004, release: 0.04 });
          if (sixteenth % 2 === 0) tone({ start: start + sixteenth * beat / 4, duration: beat * 0.32, midi: root, gain: accented ? 0.15 : 0.095, instrument: "bass", attack: 0.005, release: 0.06 });
          drum({ start: start + sixteenth * beat / 4, gain: sixteenth % 4 === 2 ? 0.038 : 0.023, kind: "hat", pan: sixteenth % 2 ? 0.52 : -0.52 });
        }
        [0, 1.75, 2, 3.25].forEach((b, index) => drum({ start: start + b * beat, gain: index === 0 ? 0.13 : 0.09, kind: "kick" }));
        [1, 3].forEach((b) => drum({ start: start + b * beat, gain: 0.105, kind: "snare", pan: b === 1 ? -0.08 : 0.08 }));
        if (bar >= 8 && bar % 2 === 0) {
          [64, 67, 71, 74].forEach((note, index) => tone({ start: start + index * beat, duration: beat * 0.72, midi: note + (bar % 4 === 2 ? -2 : 0), gain: 0.085, pan: index % 2 ? 0.2 : -0.2, instrument: "brass", attack: 0.015, release: 0.1 }));
        }
      }
    },
  }),
  makeTrack({
    name: "banner-and-blade",
    bpm: 124,
    bars: 16,
    seed: 0xbadd1e,
    compose({ beat, bars, tone, drum }) {
      const roots = [38, 38, 43, 36, 38, 41, 36, 37];
      const tune = [62, 65, 67, 69, 67, 65, 64, 62, 69, 67, 65, 64, 62, 60, 61, 62];
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const root = roots[bar % roots.length];
        tone({ start: start + 0.01, duration: beat * 3.94, midi: root, gain: 0.074, pan: -0.24, instrument: "hurdy", attack: 0.12, release: 0.25 });
        tone({ start: start + 0.01, duration: beat * 3.94, midi: root + 7, gain: 0.052, pan: 0.24, instrument: "hurdy", attack: 0.14, release: 0.25 });
        for (let eighth = 0; eighth < 8; eighth += 1) {
          const intervals = [0, 7, 3, 7, 0, 10, 7, 3];
          tone({ start: start + eighth * beat / 2, duration: beat * 0.42, midi: root + 12 + intervals[eighth], gain: eighth % 4 === 0 ? 0.14 : 0.096, pan: eighth % 2 ? 0.36 : -0.36, instrument: "lute", attack: 0.005, release: 0.08 });
        }
        [0, 1.5, 2, 3.5].forEach((b, index) => drum({ start: start + b * beat, gain: index === 0 ? 0.13 : 0.085, kind: "frame", pan: index % 2 ? 0.22 : -0.22 }));
        [1, 3].forEach((b) => drum({ start: start + b * beat, gain: 0.045, kind: "snare" }));
        if (bar >= 2) {
          tone({ start: start + beat * 0.12, duration: beat * 1.42, midi: tune[bar], gain: 0.085, pan: 0.18, instrument: "shawm", attack: 0.035, release: 0.18 });
          tone({ start: start + beat * 2.12, duration: beat * 1.35, midi: tune[(bar + 5) % tune.length] - 5, gain: 0.072, pan: -0.18, instrument: "shawm", attack: 0.035, release: 0.18 });
        }
        if (bar === 7 || bar === 15) {
          [root + 24, root + 31].forEach((note, index) => tone({ start: start + beat * (2.5 + index * 0.5), duration: beat * 0.85, midi: note, gain: 0.095, pan: index ? 0.28 : -0.28, instrument: "brass", attack: 0.02, release: 0.16 }));
        }
      }
    },
  }),
  makeTrack({
    name: "siege-at-dusk",
    bpm: 112,
    bars: 16,
    seed: 0x51e6e,
    compose({ beat, bars, tone, drum }) {
      const roots = [40, 41, 40, 38, 40, 36, 38, 39];
      const calls = [64, 65, 64, 62, 67, 65, 62, 63];
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const root = roots[bar % roots.length];
        [root - 12, root, root + 7].forEach((note, index) => tone({ start: start + 0.01, duration: beat * 3.95, midi: note, gain: index === 0 ? 0.075 : 0.042, pan: (index - 1) * 0.38, instrument: "hurdy", attack: 0.2, release: 0.34 }));
        for (let eighth = 0; eighth < 8; eighth += 1) {
          const interval = [0, 1, 0, 7, 0, 6, 1, 0][eighth];
          tone({ start: start + eighth * beat / 2, duration: beat * 0.34, midi: root + 12 + interval, gain: eighth % 2 ? 0.062 : 0.095, pan: eighth % 2 ? 0.28 : -0.28, instrument: "strings", attack: 0.008, release: 0.08 });
        }
        [0, 2].forEach((b) => drum({ start: start + b * beat, gain: 0.18, kind: "taiko", pan: b ? 0.16 : -0.16 }));
        [1, 3, 3.5].forEach((b, index) => drum({ start: start + b * beat, gain: index === 2 ? 0.075 : 0.1, kind: "frame", pan: index % 2 ? 0.18 : -0.18 }));
        if (bar >= 4) {
          tone({ start: start + beat * 0.08, duration: beat * 1.55, midi: calls[bar % calls.length], gain: 0.095, pan: -0.2, instrument: "shawm", attack: 0.025, release: 0.2 });
          tone({ start: start + beat * 2.04, duration: beat * 1.62, midi: calls[(bar + 3) % calls.length] - 5, gain: 0.1, pan: 0.2, instrument: "brass", attack: 0.04, release: 0.24 });
        }
        if (bar % 4 === 3) drum({ start: start + beat * 3.75, gain: 0.15, kind: "taiko" });
      }
    },
  }),
  makeTrack({
    name: "guild-melee",
    bpm: 144,
    bars: 16,
    seed: 0x6d311e,
    compose({ beat, bars, tone, drum }) {
      const roots = [38, 38, 43, 36, 38, 41, 43, 37];
      const melody = [74, 77, 79, 81, 79, 77, 76, 74, 69, 72, 74, 76, 77, 76, 72, 74];
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const root = roots[bar % roots.length];
        tone({ start: start + 0.01, duration: beat * 3.94, midi: root, gain: 0.052, pan: -0.16, instrument: "hurdy", attack: 0.11, release: 0.2 });
        for (let triplet = 0; triplet < 12; triplet += 1) {
          const interval = [0, 7, 3, 0, 10, 7, 0, 7, 3, 5, 3, 7][triplet];
          tone({ start: start + triplet * beat / 3, duration: beat * 0.24, midi: root + 12 + interval, gain: triplet % 3 === 0 ? 0.13 : 0.078, pan: triplet % 2 ? 0.4 : -0.4, instrument: "lute", attack: 0.003, release: 0.045 });
        }
        [0, 2].forEach((b) => drum({ start: start + b * beat, gain: 0.135, kind: "frame", pan: b ? 0.2 : -0.2 }));
        [1, 3].forEach((b) => drum({ start: start + b * beat, gain: 0.072, kind: "snare" }));
        [0.67, 1.67, 2.67, 3.67].forEach((b, index) => drum({ start: start + b * beat, gain: 0.03, kind: "hat", pan: index % 2 ? 0.48 : -0.48 }));
        if (bar >= 2) {
          tone({ start: start + beat * 0.08, duration: beat * 1.48, midi: melody[bar], gain: 0.082, pan: 0.24, instrument: "recorder", attack: 0.025, release: 0.16 });
          tone({ start: start + beat * 2.08, duration: beat * 1.38, midi: melody[(bar + 4) % melody.length] - 2, gain: 0.072, pan: -0.24, instrument: "recorder", attack: 0.025, release: 0.16 });
        }
      }
    },
  }),
  makeTrack({
    name: "crown-of-ruin",
    bpm: 150,
    bars: 16,
    seed: 0xb055f1,
    compose({ beat, bars, tone, drum }) {
      const roots = [38, 39, 38, 33, 38, 39, 36, 37];
      const ostinato = [0, 0, 1, 0, 6, 5, 1, 0, 0, 12, 6, 5, 1, 0, -1, 0];
      for (let bar = 0; bar < bars; bar += 1) {
        const start = bar * beat * 4;
        const root = roots[bar % roots.length];
        [root, root + 3, root + 7].forEach((note, index) => tone({ start: start + 0.01, duration: beat * 3.95, midi: note, gain: 0.046, pan: (index - 1) * 0.52, instrument: "choir", attack: 0.2, release: 0.32 }));
        for (let sixteenth = 0; sixteenth < 16; sixteenth += 1) {
          const accent = sixteenth % 4 === 0;
          tone({ start: start + sixteenth * beat / 4, duration: beat * 0.21, midi: root + 12 + ostinato[sixteenth], gain: accent ? 0.12 : 0.072, pan: sixteenth % 2 ? 0.4 : -0.4, instrument: "strings", attack: 0.003, release: 0.035 });
          if (sixteenth % 2 === 0) tone({ start: start + sixteenth * beat / 4, duration: beat * 0.36, midi: root - 12 + (sixteenth % 4 ? 0 : 12), gain: accent ? 0.16 : 0.105, instrument: "bass", attack: 0.004, release: 0.08 });
          drum({ start: start + sixteenth * beat / 4, gain: sixteenth % 4 === 2 ? 0.035 : 0.02, kind: "hat", pan: sixteenth % 2 ? 0.58 : -0.58 });
        }
        [0, 1.5, 2, 2.75, 3.5].forEach((b, index) => drum({ start: start + b * beat, gain: index === 0 ? 0.19 : 0.12, kind: "taiko", pan: index % 2 ? 0.25 : -0.25 }));
        [1, 3].forEach((b) => drum({ start: start + b * beat, gain: 0.105, kind: "snare" }));
        if (bar >= 4) {
          const call = [62, 63, 68, 67][bar % 4];
          tone({ start: start + beat * 0.1, duration: beat * 1.25, midi: call, gain: 0.105, pan: -0.22, instrument: "brass", attack: 0.03, release: 0.14 });
          tone({ start: start + beat * 2.05, duration: beat * 1.55, midi: call - (bar % 2 ? 2 : 1), gain: 0.095, pan: 0.22, instrument: "brass", attack: 0.03, release: 0.16 });
        }
      }
    },
  }),
];

await mkdir(OUTPUT, { recursive: true });
for (const track of tracks) {
  await writeFile(resolve(OUTPUT, `${track.name}.wav`), writeWav(track));
  console.log(`${track.name}.wav | ${track.bpm} BPM | ${track.duration.toFixed(2)}s`);
}
