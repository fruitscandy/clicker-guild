export type AudioSettings = {
  bgmMuted: boolean;
  bgmVolume: number;
  sfxMuted: boolean;
  sfxVolume: number;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bgmMuted: false,
  bgmVolume: 0.42,
  sfxMuted: false,
  sfxVolume: 0.75,
};

// Keep the saved sliders intuitive while balancing the final game mix.
// BGM masters are comparatively loud, while the procedural effects need
// extra presence to stay readable during combat and reward sequences.
export const BGM_OUTPUT_GAIN = 0.62;
export const SFX_OUTPUT_GAIN = 1.34;

const AUDIO_SETTINGS_KEY = "clicker-guild-audio-settings-v2";
const LEGACY_BGM_SETTINGS_KEY = "clicker-guild-bgm-settings-v1";
const AUDIO_SETTINGS_EVENT = "clicker-guild:audio-settings";

function clampVolume(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
}

function normalizeSettings(value: Partial<AudioSettings> | null): AudioSettings {
  return {
    bgmMuted: typeof value?.bgmMuted === "boolean" ? value.bgmMuted : DEFAULT_AUDIO_SETTINGS.bgmMuted,
    bgmVolume: clampVolume(value?.bgmVolume, DEFAULT_AUDIO_SETTINGS.bgmVolume),
    sfxMuted: typeof value?.sfxMuted === "boolean" ? value.sfxMuted : DEFAULT_AUDIO_SETTINGS.sfxMuted,
    sfxVolume: clampVolume(value?.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
  };
}

export function readAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;

  try {
    const saved = JSON.parse(window.localStorage.getItem(AUDIO_SETTINGS_KEY) ?? "null") as Partial<AudioSettings> | null;
    if (saved) return normalizeSettings(saved);

    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_BGM_SETTINGS_KEY) ?? "null") as {
      muted?: boolean;
      volume?: number;
    } | null;
    if (legacy) {
      return normalizeSettings({
        bgmMuted: Boolean(legacy.muted),
        bgmVolume: legacy.volume,
      });
    }
  } catch {
    // A malformed or unavailable browser store should never prevent audio controls.
  }

  return DEFAULT_AUDIO_SETTINGS;
}

export function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === "undefined") return;
  const normalized = normalizeSettings(settings);
  try {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalized));
  } catch {
    // Settings still apply for the current session when persistence is unavailable.
  }
  window.dispatchEvent(new CustomEvent<AudioSettings>(AUDIO_SETTINGS_EVENT, { detail: normalized }));
}

export function subscribeAudioSettings(listener: (settings: AudioSettings) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handleSettings = (event: Event) => {
    const detail = (event as CustomEvent<AudioSettings>).detail;
    listener(normalizeSettings(detail ?? null));
  };
  window.addEventListener(AUDIO_SETTINGS_EVENT, handleSettings);
  return () => window.removeEventListener(AUDIO_SETTINGS_EVENT, handleSettings);
}

export function effectiveBgmVolume(settings: AudioSettings) {
  return settings.bgmMuted ? 0 : Math.min(1, settings.bgmVolume * BGM_OUTPUT_GAIN);
}

export function effectiveSfxVolume(settings: AudioSettings) {
  // Web Audio gain nodes may safely exceed 1. Media elements cap this value
  // at their own playback boundary (see OpeningGate).
  return settings.sfxMuted ? 0 : settings.sfxVolume * SFX_OUTPUT_GAIN;
}
