import type { LootSoundProfile } from "./stage-materials";
import type { Rank } from "./game-data";
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
let lastCombatProcAt = -1;

export type ProgressionSoundKind = "weapon-craft" | "research-unlock" | "guild-hall";
export type RareRewardSoundKind = "first-clear";
export type CombatProcSound = {
  critical?: boolean;
  shockwave?: boolean;
};

const GOLD_COIN_SAMPLE_URLS = [
  "/assets/audio/loot/gold-coin-clink-01.mp3",
  "/assets/audio/loot/gold-coin-jingle-02.mp3",
] as const;

// Reward cues and the victory fanfare compete with a dense stream of combat
// transients. Boost only those semantic groups so the global SFX slider can
// stay comfortable for weapon hits.
const REWARD_MIX_GAIN = 1.85;
const VICTORY_MIX_GAIN = 1.5;
const WEAPON_CRAFT_MIX_GAIN = 1.5;
const GUILD_HALL_MIX_GAIN = 1.55;
const RECRUIT_OPEN_MIX_GAIN = 1.35;
const RECRUIT_REVEAL_MIX_GAIN = 1.32;

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

function createSfxMixBus(context: AudioContext, volume: number) {
  const mixBus = context.createGain();
  mixBus.gain.setValueAtTime(volume, context.currentTime);
  mixBus.connect(getSfxOutput(context));
  return mixBus;
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

function playGoldCoinSample(context: AudioContext, start: number, dropIndex: number, output: AudioNode) {
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
  gain.connect(output);
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
  output: AudioNode = getSfxOutput(context),
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
  gain.connect(output);
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
  output: AudioNode = getSfxOutput(context),
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
  gain.connect(output);
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

function markEventSound(name: string) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  document.documentElement.dataset.lastEventSfx = name;
  window.dispatchEvent(new CustomEvent("guild:event-sfx", { detail: { name } }));
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

export function playGuildMemberHireSound(count: 1 | 10 = 1) {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    const recruitMix = createSfxMixBus(context, RECRUIT_OPEN_MIX_GAIN);
    window.setTimeout(() => recruitMix.disconnect(), 700);
    markEventSound(`guild-recruit-open:${count}`);
    tone(context, count === 10 ? 92 : 116, start, 0.2, 0.032, "triangle", 73, 0.003, recruitMix);
    noiseBurst(context, start + 0.015, 0.13, 0.019, 420, 2800, recruitMix);
    tone(context, 392, start + 0.075, 0.17, 0.021, "triangle", count === 10 ? 659 : 523, 0.004, recruitMix);
    tone(context, count === 10 ? 784 : 659, start + 0.15, 0.2, 0.012, "sine", count === 10 ? 1047 : 784, 0.006, recruitMix);
  });
}

export function playGuildRecruitRevealSound(rank: Rank, revealIndex = 0) {
  playWhenAudioIsReady((context) => {
    const tier = ["F", "E", "D", "C", "B", "A", "S"].indexOf(rank);
    const rare = tier >= 4;
    const start = context.currentTime + 0.004;
    const revealMix = createSfxMixBus(context, RECRUIT_REVEAL_MIX_GAIN + Math.max(0, tier - 3) * 0.1);
    const variation = (revealIndex % 4) * 45;
    window.setTimeout(() => revealMix.disconnect(), rank === "S" ? 1600 : 900);
    markEventSound(`guild-recruit-reveal:${rank}`);

    // Every portrait enters with a short left-to-right cloth/card whoosh.
    noiseBurst(context, start, rare ? 0.15 : 0.095, rare ? 0.025 : 0.016, 2450 + variation, 480, revealMix);
    tone(context, 210 + tier * 22, start, rare ? 0.18 : 0.11, rare ? 0.021 : 0.013, "triangle", 420 + tier * 48, 0.002, revealMix);
    tone(context, 760 + variation, start + 0.025, 0.08, 0.008, "sine", 1120 + tier * 70, 0.002, revealMix);

    if (!rare) return;

    // B, A and S gain progressively heavier impact and a longer rising fanfare.
    tone(context, rank === "S" ? 55 : rank === "A" ? 73 : 92, start, 0.34, 0.045, "sine", 49, 0.003, revealMix);
    noiseBurst(context, start + 0.055, 0.22, 0.022, 720, 3800, revealMix);
    const fanfare = rank === "S" ? [392, 523, 659, 988] : rank === "A" ? [349, 440, 659] : [330, 415, 523];
    fanfare.forEach((frequency, index) => {
      tone(context, frequency, start + 0.07 + index * 0.07, 0.32, 0.022 + tier * 0.002, index === fanfare.length - 1 ? "sine" : "triangle", frequency * 1.02, 0.006, revealMix);
      if (rank === "S") tone(context, frequency * 2, start + 0.08 + index * 0.07, 0.22, 0.008, "sine", frequency * 2.04, 0.004, revealMix);
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

export function playStageClearSound(boss = false) {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime + 0.018;
    const victoryMix = createSfxMixBus(context, VICTORY_MIX_GAIN);
    const melody = boss ? [294, 370, 440, 587] : [392, 494, 587, 784];
    const offsets = [0, 0.09, 0.18, 0.32];
    const root = boss ? 147 : 196;
    markEventSound(`stage-clear:${boss ? "boss" : "normal"}`);

    // A soft impact opens space after the last combat hit, then a four-note
    // major fanfare and a sustained chord make the result read as a victory.
    noiseBurst(context, start, boss ? 0.32 : 0.19, boss ? 0.025 : 0.015, boss ? 880 : 1850, boss ? 105 : 520, victoryMix);
    tone(context, boss ? 73 : 98, start, boss ? 0.58 : 0.4, boss ? 0.042 : 0.028, "triangle", boss ? 49 : 73, 0.004, victoryMix);
    if (boss) tone(context, 110, start + 0.025, 0.5, 0.022, "sine", 73, 0.006, victoryMix);

    melody.forEach((frequency, index) => {
      const noteStart = start + offsets[index];
      const duration = index === melody.length - 1 ? (boss ? 0.72 : 0.58) : 0.25;
      tone(context, frequency, noteStart, duration, boss ? 0.023 : 0.021, "triangle", frequency * 1.012, 0.006, victoryMix);
      tone(context, frequency * 2, noteStart + 0.012, duration * 0.72, boss ? 0.006 : 0.008, "sine", frequency * 2.025, 0.004, victoryMix);
    });

    [root, root * 1.25, root * 1.5].forEach((frequency, index) => {
      tone(context, frequency, start + 0.38, boss ? 0.72 : 0.56, boss ? 0.018 : 0.014, index === 0 ? "triangle" : "sine", frequency * 1.008, 0.018, victoryMix);
    });
    noiseBurst(context, start + 0.3, boss ? 0.28 : 0.2, boss ? 0.011 : 0.009, boss ? 3100 : 4600, boss ? 6800 : 7600, victoryMix);
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

export function playProgressionSound(kind: ProgressionSoundKind, tier = 1) {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    const tierLift = Math.min(5, Math.max(0, tier - 1));
    markEventSound(`progression:${kind}`);

    if (kind === "weapon-craft") {
      const craftMix = createSfxMixBus(context, WEAPON_CRAFT_MIX_GAIN);
      window.setTimeout(() => craftMix.disconnect(), 1100);

      // Two forge blows land first, followed by a bright metal ring and a
      // compact success chord. The tier lift makes later weapons sound denser
      // without pushing the signal above the shared SFX mix.
      noiseBurst(context, start, 0.09, 0.032, 1800 + tierLift * 120, 260, craftMix);
      tone(context, 118 + tierLift * 6, start, 0.3, 0.042, "triangle", 62 + tierLift * 3, 0.002, craftMix);
      noiseBurst(context, start + 0.11, 0.07, 0.022, 2300 + tierLift * 140, 420, craftMix);
      tone(context, 104 + tierLift * 5, start + 0.105, 0.24, 0.034, "triangle", 58 + tierLift * 3, 0.002, craftMix);
      tone(context, 980 + tierLift * 38, start + 0.02, 0.5, 0.026, "triangle", 1420 + tierLift * 54, 0.003, craftMix);
      tone(context, 1560 + tierLift * 45, start + 0.045, 0.42, 0.014, "sine", 1120 + tierLift * 40, 0.003, craftMix);
      [392, 523, 784].forEach((frequency, index) => {
        tone(context, frequency + tierLift * 10, start + 0.2 + index * 0.075, 0.34, 0.019 + index * 0.002, index === 2 ? "sine" : "triangle", frequency * 1.02 + tierLift * 10, 0.008, craftMix);
      });
      noiseBurst(context, start + 0.25, 0.12, 0.009, 4200, 7600, craftMix);
      return;
    }

    if (kind === "guild-hall") {
      const hallMix = createSfxMixBus(context, GUILD_HALL_MIX_GAIN);
      window.setTimeout(() => hallMix.disconnect(), 1400);

      // Stone settles in three measured impacts, then a warm brass-like
      // fanfare announces that the whole guild has advanced.
      noiseBurst(context, start, 0.36, 0.032, 330, 58, hallMix);
      tone(context, 65, start, 0.58, 0.048, "sine", 43, 0.004, hallMix);
      [0.03, 0.15, 0.27].forEach((offset, index) => {
        noiseBurst(context, start + offset, 0.1, 0.022 - index * 0.003, 620 - index * 90, 92, hallMix);
        tone(context, 110 - index * 9, start + offset, 0.24, 0.027 - index * 0.002, "triangle", 62, 0.003, hallMix);
      });
      [196, 247, 294, 392].forEach((frequency, index) => {
        tone(context, frequency, start + 0.18 + index * 0.085, index === 3 ? 0.68 : 0.36, 0.021 + index * 0.0015, "triangle", frequency * 1.035, 0.012, hallMix);
        if (index >= 2) tone(context, frequency * 2, start + 0.2 + index * 0.085, 0.34, 0.008, "sine", frequency * 2.02, 0.008, hallMix);
      });
      noiseBurst(context, start + 0.44, 0.18, 0.008, 3300, 6700, hallMix);
      return;
    }

    [523, 659, 784].forEach((frequency, index) => {
      tone(context, frequency + tierLift * 12, start + index * 0.06, 0.24, 0.018, "triangle", (frequency + tierLift * 12) * 1.06, 0.006);
    });
    noiseBurst(context, start + 0.02, 0.075, 0.007, 2400, 5200);
  });
}

export function playWeaponCraftSound(tier = 1) {
  playProgressionSound("weapon-craft", tier);
}

export function playGuildHallUpgradeSound(level = 1) {
  playProgressionSound("guild-hall", level);
}

export function playCombatProcSound(proc: CombatProcSound) {
  const primary = proc.shockwave ? "shockwave" : proc.critical ? "critical" : null;
  if (!primary) return;

  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    if (start - lastCombatProcAt < 0.075) return;
    lastCombatProcAt = start;
    markEventSound(`combat:${primary}`);

    if (primary === "shockwave") {
      noiseBurst(context, start, 0.18, 0.025, 760, 92);
      tone(context, 128, start, 0.25, 0.034, "sine", 43, 0.002);
      tone(context, 510, start + 0.018, 0.14, 0.013, "square", 130, 0.0015);
      return;
    }
    if (primary === "critical") {
      noiseBurst(context, start, 0.045, 0.016, 5400, 2100);
      tone(context, 1260, start, 0.11, 0.018, "square", 2100, 0.001);
      tone(context, 2520, start + 0.018, 0.09, 0.009, "triangle", 1380, 0.001);
      return;
    }
  });
}

export function playRareRewardSound(kind: RareRewardSoundKind) {
  playWhenAudioIsReady((context) => {
    const start = context.currentTime;
    markEventSound(`reward:${kind}`);

    tone(context, 392, start, 0.2, 0.015, "triangle", 523, 0.006);
    tone(context, 659, start + 0.07, 0.24, 0.017, "sine", 784, 0.006);
  });
}

export function playLootDropSound(profile: LootSoundProfile, dropIndex = 0) {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  const rewardMix = createSfxMixBus(context, REWARD_MIX_GAIN);
  const variation = (dropIndex % 5 - 2) * 13;

  if (profile === "coin") {
    if (playGoldCoinSample(context, start, dropIndex, rewardMix)) return;
    // The recorded CC0 samples are normally preloaded at battle start. This
    // compact fallback only covers a first-frame cache miss or network failure.
    tone(context, 2380 + variation * 3, start, 0.12, 0.022, "triangle", 1510 + variation * 2, 0.002, rewardMix);
    tone(context, 3650 + variation * 4, start + 0.035, 0.09, 0.012, "sine", 2460 + variation * 2, 0.0015, rewardMix);
    noiseBurst(context, start, 0.024, 0.007, 7200, 3900, rewardMix);
    return;
  }
  if (profile === "coin-pouch") {
    tone(context, 170 + variation / 4, start, 0.16, 0.03, "triangle", 105 + variation / 5, undefined, rewardMix);
    noiseBurst(context, start, 0.085, 0.015, 1050, 620, rewardMix);
    [0.016, 0.046, 0.078].forEach((offset, index) => {
      tone(context, 1120 + variation * 2 + index * 180, start + offset, 0.09, 0.012, "sine", 840 + variation + index * 120, undefined, rewardMix);
    });
    return;
  }
  if (profile === "cash-bundle") {
    tone(context, 128 + variation / 6, start + 0.01, 0.16, 0.026, "triangle", 78 + variation / 8, undefined, rewardMix);
    tone(context, 520 + variation, start + 0.018, 0.1, 0.011, "triangle", 330 + variation / 2, undefined, rewardMix);
    noiseBurst(context, start, 0.11, 0.022, 2800, 920, rewardMix);
    noiseBurst(context, start + 0.035, 0.07, 0.012, 4100, 1700, rewardMix);
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
  const rewardMix = createSfxMixBus(context, REWARD_MIX_GAIN);
  const voice: OscillatorType = profile === "magma-core" || profile === "black-iron" || profile === "blood-obsidian" || profile === "cash-bundle" ? "triangle" : "sine";
  tone(context, frequency, start, 0.13, 0.027, voice, frequency * 1.09, undefined, rewardMix);
  tone(context, frequency * 2.01, start + 0.016, 0.075, 0.01, "triangle", frequency * 2.08, undefined, rewardMix);
  if (profile === "cash-bundle") noiseBurst(context, start, 0.045, 0.005, 2600, 1300, rewardMix);
}

export function playLootCompleteSound() {
  const context = getAudioContext();
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  const rewardMix = createSfxMixBus(context, REWARD_MIX_GAIN);
  [784, 988, 1175].forEach((frequency, index) => {
    tone(context, frequency, start + index * 0.055, 0.28, 0.025, "sine", frequency * 1.015, undefined, rewardMix);
  });
  tone(context, 392, start, 0.38, 0.016, "triangle", 523, undefined, rewardMix);
}

export function playGoldDropSound(dropIndex = 0) { playLootDropSound("coin", dropIndex); }
export function playGoldCollectSound(index: number, total: number) { playLootCollectSound("coin", index, total); }
export function playGoldCompleteSound() { playLootCompleteSound(); }
