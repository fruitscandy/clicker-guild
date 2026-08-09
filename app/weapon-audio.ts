export type BladeImpactWeight = "light" | "medium" | "heavy";

export type WeaponSoundProfile = {
  tier: number;
  key: string;
  weaponName: string;
  impactWeight: BladeImpactWeight;
  swingGain: number;
  impactGain: number;
  bodyGain: number;
  ringGain: number;
  subGain: number;
  width: number;
  tail: number;
  swingRate: number;
  impactRate: number;
  impactDelay: number;
};

// The weapon name identifies the equipped tier only. Sound growth deliberately
// ignores the visual theme and follows one consistent blade-impact language.
export const WEAPON_SOUND_PROFILES = [
  { tier: 0, key: "training-strike", weaponName: "훈련용 장검", impactWeight: "light", swingGain: 0.150, impactGain: 0.280, bodyGain: 0.018, ringGain: 0.004, subGain: 0.002, width: 0.05, tail: 0.040, swingRate: 1.18, impactRate: 1.15, impactDelay: 0.018 },
  { tier: 1, key: "crescent-slash", weaponName: "초승달 도", impactWeight: "light", swingGain: 0.158, impactGain: 0.296, bodyGain: 0.026, ringGain: 0.008, subGain: 0.006, width: 0.08, tail: 0.052, swingRate: 1.16, impactRate: 1.12, impactDelay: 0.019 },
  { tier: 2, key: "cross-cut", weaponName: "쌍날검", impactWeight: "light", swingGain: 0.166, impactGain: 0.312, bodyGain: 0.034, ringGain: 0.014, subGain: 0.011, width: 0.11, tail: 0.064, swingRate: 1.14, impactRate: 1.09, impactDelay: 0.020 },
  { tier: 3, key: "weakpoint-break", weaponName: "룬 파쇄검", impactWeight: "light", swingGain: 0.175, impactGain: 0.328, bodyGain: 0.044, ringGain: 0.021, subGain: 0.017, width: 0.14, tail: 0.078, swingRate: 1.12, impactRate: 1.06, impactDelay: 0.021 },
  { tier: 4, key: "sky-sword-array", weaponName: "천공검", impactWeight: "light", swingGain: 0.184, impactGain: 0.346, bodyGain: 0.055, ringGain: 0.029, subGain: 0.025, width: 0.18, tail: 0.094, swingRate: 1.10, impactRate: 1.03, impactDelay: 0.022 },
  { tier: 5, key: "nebula-dance", weaponName: "성운도", impactWeight: "medium", swingGain: 0.194, impactGain: 0.365, bodyGain: 0.067, ringGain: 0.039, subGain: 0.035, width: 0.22, tail: 0.112, swingRate: 1.08, impactRate: 1.00, impactDelay: 0.023 },
  { tier: 6, key: "dragon-vein-break", weaponName: "용맥검", impactWeight: "medium", swingGain: 0.204, impactGain: 0.384, bodyGain: 0.080, ringGain: 0.050, subGain: 0.046, width: 0.27, tail: 0.132, swingRate: 1.06, impactRate: 0.97, impactDelay: 0.024 },
  { tier: 7, key: "celestial-ruin", weaponName: "천상검", impactWeight: "medium", swingGain: 0.214, impactGain: 0.404, bodyGain: 0.094, ringGain: 0.063, subGain: 0.059, width: 0.32, tail: 0.155, swingRate: 1.04, impactRate: 0.94, impactDelay: 0.025 },
  { tier: 8, key: "blood-moon-eclipse", weaponName: "혈월도", impactWeight: "medium", swingGain: 0.224, impactGain: 0.424, bodyGain: 0.109, ringGain: 0.078, subGain: 0.073, width: 0.37, tail: 0.181, swingRate: 1.02, impactRate: 0.91, impactDelay: 0.026 },
  { tier: 9, key: "storm-twin-dance", weaponName: "폭풍쌍검", impactWeight: "medium", swingGain: 0.234, impactGain: 0.444, bodyGain: 0.125, ringGain: 0.095, subGain: 0.088, width: 0.43, tail: 0.210, swingRate: 1.00, impactRate: 0.89, impactDelay: 0.027 },
  { tier: 10, key: "radiant-judgment", weaponName: "성휘 대검", impactWeight: "heavy", swingGain: 0.244, impactGain: 0.464, bodyGain: 0.142, ringGain: 0.114, subGain: 0.104, width: 0.49, tail: 0.242, swingRate: 0.98, impactRate: 0.86, impactDelay: 0.028 },
  { tier: 11, key: "abyss-sever", weaponName: "심연검", impactWeight: "heavy", swingGain: 0.254, impactGain: 0.484, bodyGain: 0.160, ringGain: 0.135, subGain: 0.121, width: 0.56, tail: 0.277, swingRate: 0.96, impactRate: 0.84, impactDelay: 0.029 },
  { tier: 12, key: "time-collapse", weaponName: "시간절단검", impactWeight: "heavy", swingGain: 0.264, impactGain: 0.504, bodyGain: 0.178, ringGain: 0.158, subGain: 0.139, width: 0.63, tail: 0.315, swingRate: 0.94, impactRate: 0.82, impactDelay: 0.030 },
  { tier: 13, key: "world-tree-wave", weaponName: "세계수 성검", impactWeight: "heavy", swingGain: 0.274, impactGain: 0.524, bodyGain: 0.197, ringGain: 0.183, subGain: 0.158, width: 0.70, tail: 0.356, swingRate: 0.92, impactRate: 0.80, impactDelay: 0.031 },
  { tier: 14, key: "myriad-blades-one", weaponName: "길드마스터 신검", impactWeight: "heavy", swingGain: 0.285, impactGain: 0.545, bodyGain: 0.217, ringGain: 0.210, subGain: 0.180, width: 0.78, tail: 0.400, swingRate: 0.90, impactRate: 0.78, impactDelay: 0.032 },
] as const satisfies readonly WeaponSoundProfile[];

const WEAPON_AUDIO_ASSETS = {
  swings: [
    "/assets/audio/weapons/blade-swing-01.ogg",
    "/assets/audio/weapons/blade-swing-02.ogg",
  ],
  light: [
    "/assets/audio/weapons/blade-impact-light-01.ogg",
    "/assets/audio/weapons/blade-impact-light-02.ogg",
    "/assets/audio/weapons/blade-impact-light-03.ogg",
  ],
  medium: [
    "/assets/audio/weapons/blade-impact-medium-01.ogg",
    "/assets/audio/weapons/blade-impact-medium-02.ogg",
    "/assets/audio/weapons/blade-impact-medium-03.ogg",
  ],
  heavy: [
    "/assets/audio/weapons/blade-impact-heavy-01.ogg",
    "/assets/audio/weapons/blade-impact-heavy-02.ogg",
    "/assets/audio/weapons/blade-impact-heavy-03.ogg",
  ],
  rings: [
    "/assets/audio/weapons/blade-ring-01.ogg",
    "/assets/audio/weapons/blade-ring-02.ogg",
  ],
  bodies: [
    "/assets/audio/weapons/blade-body-01.ogg",
    "/assets/audio/weapons/blade-body-02.ogg",
  ],
} as const;

type WeaponSoundBank = {
  swings: AudioBuffer[];
  light: AudioBuffer[];
  medium: AudioBuffer[];
  heavy: AudioBuffer[];
  rings: AudioBuffer[];
  bodies: AudioBuffer[];
};

type WeaponAudioBus = {
  dry: GainNode;
  reverb: GainNode;
};

type SampleOptions = {
  at: number;
  gain: number;
  playbackRate: number;
  maxDuration: number;
  pan?: number;
  filter?: BiquadFilterType;
  filterHz?: number;
  space?: number;
};

const audioBuses = new WeakMap<AudioContext, WeaponAudioBus>();
const transientBuffers = new WeakMap<AudioContext, AudioBuffer>();
const activeBursts = new WeakMap<AudioContext, AudioScheduledSourceNode[][]>();

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

  master.gain.value = 0.82;
  wet.gain.value = 0.18;
  compressor.threshold.value = -15;
  compressor.knee.value = 10;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.12;

  const impulseLength = Math.floor(context.sampleRate * 0.82);
  const impulse = context.createBuffer(2, impulseLength, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < impulseLength; index += 1) {
      const decay = Math.pow(1 - index / impulseLength, 4.4);
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

function connectVoice(context: AudioContext, output: AudioNode, space = 0) {
  const bus = getAudioBus(context);
  output.connect(bus.dry);
  if (space <= 0) return;
  const send = context.createGain();
  send.gain.value = Math.min(0.28, space);
  output.connect(send);
  send.connect(bus.reverb);
}

function playSample(context: AudioContext, buffer: AudioBuffer, options: SampleOptions) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  const rate = Math.max(0.55, options.playbackRate);
  const naturalDuration = buffer.duration / rate;
  const duration = Math.min(options.maxDuration, naturalDuration);
  const end = options.at + duration;
  const attackEnd = Math.min(end - 0.004, options.at + 0.004);
  const releaseStart = Math.max(attackEnd, end - Math.min(0.055, duration * 0.36));

  source.buffer = buffer;
  source.playbackRate.value = rate;
  filter.type = options.filter ?? "highpass";
  filter.frequency.value = options.filterHz ?? 90;
  filter.Q.value = 0.65;
  envelope.gain.setValueAtTime(0.0001, options.at);
  envelope.gain.linearRampToValueAtTime(options.gain, attackEnd);
  envelope.gain.setValueAtTime(options.gain, releaseStart);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  panner.pan.value = options.pan ?? 0;

  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(panner);
  connectVoice(context, panner, options.space);
  source.start(options.at);
  source.stop(end + 0.008);
  return source;
}

function getTransientBuffer(context: AudioContext) {
  const cached = transientBuffers.get(context);
  if (cached) return cached;
  const length = Math.floor(context.sampleRate * 0.038);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    const decay = Math.pow(1 - index / data.length, 5.6);
    data[index] = (Math.random() * 2 - 1) * decay;
  }
  transientBuffers.set(context, buffer);
  return buffer;
}

function playBladeCrack(context: AudioContext, profile: WeaponSoundProfile, at: number, pan: number) {
  return playSample(context, getTransientBuffer(context), {
    at,
    gain: 0.075 + profile.impactGain * 0.10,
    playbackRate: 1,
    maxDuration: 0.018 + profile.tier * 0.0008,
    pan,
    filter: "highpass",
    filterHz: 2300 + profile.tier * 85,
    space: profile.tail * 0.09,
  });
}

function playSubImpact(context: AudioContext, profile: WeaponSoundProfile, at: number, pan: number) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const panner = context.createStereoPanner();
  const duration = 0.10 + profile.tail * 0.38;
  const end = at + duration;
  const startHz = 96 - profile.tier * 1.8;
  const endHz = Math.max(28, 43 - profile.tier * 0.65);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(startHz, at);
  oscillator.frequency.exponentialRampToValueAtTime(endHz, end);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, profile.subGain), at + 0.009);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  panner.pan.value = pan;
  oscillator.connect(envelope);
  envelope.connect(panner);
  connectVoice(context, panner, profile.tail * 0.06);
  oscillator.start(at);
  oscillator.stop(end + 0.01);
  return oscillator;
}

function registerBurst(context: AudioContext, sources: AudioScheduledSourceNode[]) {
  const bursts = activeBursts.get(context) ?? [];
  bursts.push(sources);
  while (bursts.length > 7) {
    const oldest = bursts.shift();
    oldest?.forEach((source) => {
      try { source.stop(); } catch { /* already ended */ }
    });
  }
  activeBursts.set(context, bursts);
  const lastSource = sources.at(-1);
  if (lastSource) {
    lastSource.addEventListener("ended", () => {
      const current = activeBursts.get(context);
      if (!current) return;
      const index = current.indexOf(sources);
      if (index >= 0) current.splice(index, 1);
    }, { once: true });
  }
}

async function fetchAudioBytes() {
  const urls = [...new Set(Object.values(WEAPON_AUDIO_ASSETS).flat())];
  const entries = await Promise.all(urls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weapon audio failed to load: ${url}`);
    return [url, await response.arrayBuffer()] as const;
  }));
  return new Map(entries);
}

async function decodeSoundBank(context: AudioContext, bytes: Map<string, ArrayBuffer>): Promise<WeaponSoundBank> {
  const decodeGroup = (urls: readonly string[]) => Promise.all(urls.map((url) => {
    const data = bytes.get(url);
    if (!data) throw new Error(`Weapon audio data missing: ${url}`);
    return context.decodeAudioData(data.slice(0));
  }));
  return {
    swings: await decodeGroup(WEAPON_AUDIO_ASSETS.swings),
    light: await decodeGroup(WEAPON_AUDIO_ASSETS.light),
    medium: await decodeGroup(WEAPON_AUDIO_ASSETS.medium),
    heavy: await decodeGroup(WEAPON_AUDIO_ASSETS.heavy),
    rings: await decodeGroup(WEAPON_AUDIO_ASSETS.rings),
    bodies: await decodeGroup(WEAPON_AUDIO_ASSETS.bodies),
  };
}

export function playWeaponAttackSound(context: AudioContext, bank: WeaponSoundBank, tier: number, variation = 0) {
  const profile = WEAPON_SOUND_PROFILES[clampTier(tier)];
  const start = context.currentTime + 0.004;
  const impactAt = start + profile.impactDelay;
  const direction = variation % 2 === 0 ? 1 : -1;
  const jitter = 1 + ((variation % 5) - 2) * 0.009;
  const swingPan = direction * profile.width * 0.48;
  const impactPan = direction * profile.width * 0.12;
  const impactBuffers = bank[profile.impactWeight];
  const sources: AudioScheduledSourceNode[] = [];

  sources.push(playSample(context, bank.swings[variation % bank.swings.length], {
    at: start,
    gain: profile.swingGain,
    playbackRate: profile.swingRate * jitter,
    maxDuration: 0.20 + profile.tail * 0.36,
    pan: swingPan,
    filter: "highpass",
    filterHz: 170 + profile.tier * 9,
    space: profile.tail * 0.22,
  }));

  sources.push(playBladeCrack(context, profile, impactAt, impactPan));
  sources.push(playSample(context, impactBuffers[variation % impactBuffers.length], {
    at: impactAt,
    gain: profile.impactGain,
    playbackRate: profile.impactRate * jitter,
    maxDuration: 0.15 + profile.tail * 0.52,
    pan: impactPan,
    filter: "highpass",
    filterHz: 72,
    space: profile.tail * 0.24,
  }));

  sources.push(playSample(context, bank.bodies[variation % bank.bodies.length], {
    at: impactAt + 0.003,
    gain: profile.bodyGain,
    playbackRate: Math.max(0.68, 0.94 - profile.tier * 0.012) * jitter,
    maxDuration: 0.13 + profile.tail * 0.38,
    pan: -impactPan * 0.45,
    filter: "lowpass",
    filterHz: 1050 - profile.tier * 22,
    space: profile.tail * 0.08,
  }));

  sources.push(playSample(context, bank.rings[variation % bank.rings.length], {
    at: impactAt + 0.006,
    gain: profile.ringGain,
    playbackRate: Math.max(0.64, 1.10 - profile.tier * 0.022) * jitter,
    maxDuration: 0.11 + profile.tail * 0.70,
    pan: -direction * profile.width * 0.28,
    filter: "highpass",
    filterHz: 620,
    space: profile.tail * 0.34,
  }));

  sources.push(playSubImpact(context, profile, impactAt, -impactPan));

  if (profile.tier >= 9) {
    sources.push(playSample(context, bank.swings[(variation + 1) % bank.swings.length], {
      at: start + 0.012,
      gain: profile.swingGain * (0.20 + profile.width * 0.18),
      playbackRate: profile.swingRate * 0.94 / jitter,
      maxDuration: 0.18 + profile.tail * 0.30,
      pan: -swingPan,
      filter: "highpass",
      filterHz: 260,
      space: profile.tail * 0.20,
    }));
  }

  if (profile.tier >= 12) {
    sources.push(playSample(context, impactBuffers[(variation + 1) % impactBuffers.length], {
      at: impactAt + 0.026,
      gain: profile.impactGain * 0.24,
      playbackRate: profile.impactRate * 1.08 / jitter,
      maxDuration: 0.12 + profile.tail * 0.22,
      pan: -direction * profile.width * 0.42,
      filter: "highpass",
      filterHz: 150,
      space: profile.tail * 0.18,
    }));
  }

  if (profile.tier >= 14) {
    sources.push(playSample(context, bank.rings[(variation + 1) % bank.rings.length], {
      at: impactAt + 0.042,
      gain: profile.ringGain * 0.34,
      playbackRate: 0.69 / jitter,
      maxDuration: 0.34,
      pan: direction * 0.65,
      filter: "bandpass",
      filterHz: 1320,
      space: 0.22,
    }));
  }

  registerBurst(context, sources);
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
  const bytesPromise = fetchAudioBytes();
  void bytesPromise.catch(() => undefined);
  let context: AudioContext | null = null;
  let bankPromise: Promise<WeaponSoundBank> | null = null;
  let variation = 0;
  let disposed = false;
  document.documentElement.dataset.weaponAudio = "loading";

  const prepareAudio = () => {
    if (typeof window.AudioContext === "undefined") return null;
    context ??= new window.AudioContext({ latencyHint: "interactive" });
    const activeContext = context;
    if (activeContext.state === "suspended") void activeContext.resume().catch(() => undefined);
    bankPromise ??= bytesPromise.then((bytes) => decodeSoundBank(activeContext, bytes)).then((bank) => {
      if (!disposed) document.documentElement.dataset.weaponAudio = "ready";
      return bank;
    });
    return bankPromise.then((bank) => ({ context: activeContext, bank }));
  };

  const playFromPointer = (event: PointerEvent) => {
    const prepared = prepareAudio();
    const arena = findAttackArena(event.target);
    const attackButton = document.querySelector<HTMLButtonElement>(".attack-button");
    if (!prepared || !arena || !attackButton || attackButton.disabled) return;
    const tier = weaponTierFromClassName(arena.className);
    if (tier === null) return;
    const currentVariation = variation;
    variation += 1;

    void prepared.then(({ context: activeContext, bank }) => {
      if (disposed || activeContext.state === "closed") return;
      const profile = playWeaponAttackSound(activeContext, bank, tier, currentVariation);
      arena.dataset.lastWeaponSound = profile.key;
      arena.dataset.lastWeaponSoundTier = String(profile.tier);
      window.dispatchEvent(new CustomEvent("guild:weapon-attack-sound", { detail: { tier: profile.tier, key: profile.key, weaponName: profile.weaponName } }));
    }).catch(() => {
      if (!disposed) document.documentElement.dataset.weaponAudio = "error";
    });
  };

  document.addEventListener("pointerdown", playFromPointer, { capture: true });
  return () => {
    disposed = true;
    document.removeEventListener("pointerdown", playFromPointer, { capture: true });
    delete document.documentElement.dataset.weaponAudio;
    if (context && context.state !== "closed") void context.close();
  };
}
