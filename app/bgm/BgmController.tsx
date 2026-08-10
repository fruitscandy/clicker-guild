"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_AUDIO_SETTINGS,
  effectiveBgmVolume,
  readAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from "../audio-settings";
import { playSoundSettingsPreview } from "../battle-audio";
import {
  BGM_TRACK_BY_ID,
  BGM_TRACKS_BY_SCENE,
  type BgmSceneId,
  type BgmTrackId,
} from "./tracks";
import styles from "./BgmController.module.css";

const CROSSFADE_MS = 1_150;

function sceneFromDocument(): BgmSceneId {
  const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-modal='true']");
  if (dialog?.textContent?.includes("GUILD EXPEDITION ATLAS")) return "field-select";

  const battlefield = document.querySelector(".battle-mode .field-screen");
  if (battlefield) {
    const banner = battlefield.querySelector(".battle-banner span")?.textContent ?? "";
    return banner.includes("BOSS") ? "boss" : "battle";
  }
  return "guild";
}

export default function BgmController({ children }: { children: ReactNode }) {
  const [trackId, setTrackId] = useState<BgmTrackId>("guild-hearth");
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [activated, setActivated] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const players = useRef<[HTMLAudioElement | null, HTMLAudioElement | null]>([null, null]);
  const activePlayer = useRef(0);
  const fadeTimer = useRef<number | null>(null);
  const desiredScene = useRef<BgmSceneId>("guild");
  const desiredTrack = useRef<BgmTrackId>("guild-hearth");
  const sceneCursors = useRef<Record<BgmSceneId, number>>({ guild: 0, "field-select": 0, battle: 0, boss: 0 });
  const playingTrack = useRef<BgmTrackId | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const loaded = readAudioSettings();
      settingsRef.current = loaded;
      setSettings(loaded);
      setSettingsLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    settingsRef.current = settings;
    saveAudioSettings(settings);
  }, [settings, settingsLoaded]);

  useEffect(() => {
    const update = () => {
      const nextScene = sceneFromDocument();
      if (nextScene !== desiredScene.current) {
        const pool = BGM_TRACKS_BY_SCENE[nextScene];
        const cursor = sceneCursors.current[nextScene] % pool.length;
        const nextTrack = pool[cursor];
        sceneCursors.current[nextScene] = (cursor + 1) % pool.length;
        desiredScene.current = nextScene;
        desiredTrack.current = nextTrack.id;
        setTrackId(nextTrack.id);
      }
      setDeveloperMode(Boolean(document.querySelector(".game-shell.developer-mode")));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fadeTo = useCallback(async (nextTrack: BgmTrackId, immediate = false) => {
    const fromIndex = activePlayer.current;
    const toIndex = 1 - fromIndex;
    const from = players.current[fromIndex];
    const to = players.current[toIndex];
    if (!to) return;

    if (fadeTimer.current !== null) window.clearInterval(fadeTimer.current);
    const targetVolume = effectiveBgmVolume(settingsRef.current);
    const source = BGM_TRACK_BY_ID[nextTrack].source;
    if (!to.src.endsWith(source)) {
      to.src = source;
      to.load();
    }
    to.currentTime = 0;
    to.volume = immediate ? targetVolume : 0;
    playingTrack.current = nextTrack;
    try {
      await to.play();
    } catch {
      playingTrack.current = null;
      return;
    }

    activePlayer.current = toIndex;
    if (immediate) {
      from?.pause();
      return;
    }
    const started = performance.now();
    const fromVolume = from?.volume ?? 0;
    fadeTimer.current = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / CROSSFADE_MS);
      to.volume = targetVolume * progress;
      if (from) from.volume = fromVolume * (1 - progress);
      if (progress >= 1) {
        if (fadeTimer.current !== null) window.clearInterval(fadeTimer.current);
        fadeTimer.current = null;
        from?.pause();
      }
    }, 40);
  }, []);

  const startCurrent = useCallback(() => {
    setActivated(true);
    if (settingsRef.current.bgmMuted) return;
    const player = players.current[activePlayer.current];
    if (playingTrack.current === desiredTrack.current && player?.src) {
      player.volume = effectiveBgmVolume(settingsRef.current);
      void player.play().catch(() => undefined);
    } else {
      void fadeTo(desiredTrack.current, true);
    }
  }, [fadeTo]);

  useEffect(() => {
    if (activated && !settings.bgmMuted && playingTrack.current !== trackId) void fadeTo(trackId);
  }, [activated, fadeTo, settings.bgmMuted, trackId]);

  useEffect(() => {
    const player = players.current[activePlayer.current];
    if (!player) return;
    player.volume = effectiveBgmVolume(settings);
  }, [settings.bgmMuted, settings.bgmVolume]);

  useEffect(() => {
    const unlock = () => {
      startCurrent();
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock, { once: true, capture: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("keydown", unlock);
    };
  }, [startCurrent]);

  const updateSettings = (next: AudioSettings) => {
    settingsRef.current = next;
    setSettings(next);
  };

  const toggleBgmMute = () => {
    setActivated(true);
    const next = { ...settingsRef.current, bgmMuted: !settingsRef.current.bgmMuted };
    updateSettings(next);
    if (next.bgmMuted) {
      players.current.forEach((player) => player?.pause());
      return;
    }
    const player = players.current[activePlayer.current];
    if (playingTrack.current === desiredTrack.current && player?.src) {
      player.volume = effectiveBgmVolume(next);
      void player.play().catch(() => undefined);
    } else {
      void fadeTo(desiredTrack.current, true);
    }
  };

  const changeBgmVolume = (bgmVolume: number) => {
    const next = { ...settingsRef.current, bgmMuted: false, bgmVolume };
    updateSettings(next);
    const player = players.current[activePlayer.current];
    if (playingTrack.current === desiredTrack.current && player?.src) {
      player.volume = effectiveBgmVolume(next);
      if (activated) void player.play().catch(() => undefined);
    } else if (activated) {
      void fadeTo(desiredTrack.current, true);
    }
  };

  const toggleSfxMute = () => {
    updateSettings({ ...settingsRef.current, sfxMuted: !settingsRef.current.sfxMuted });
  };

  const changeSfxVolume = (sfxVolume: number) => {
    updateSettings({ ...settingsRef.current, sfxMuted: false, sfxVolume });
  };

  const track = BGM_TRACK_BY_ID[trackId];

  return (
    <>
      {children}
      <audio ref={(node) => { players.current[0] = node; }} loop preload="none" />
      <audio ref={(node) => { players.current[1] = node; }} loop preload="none" />
      <div className={styles.dock} aria-label="게임 사운드 제어">
        <div className={styles.nowPlaying} aria-live="polite">
          <small>{activated ? "NOW PLAYING" : "BGM READY"} · {track.scene}</small>
          <strong>{track.title}</strong>
          <span>{track.subtitle} · {track.bpm} BPM</span>
        </div>
        <button
          className={`${styles.toggle} ${settings.bgmMuted ? styles.toggleMuted : ""}`}
          type="button"
          onClick={() => {
            startCurrent();
            setPanelOpen((open) => !open);
          }}
          aria-expanded={panelOpen}
          aria-label="사운드 설정 열기"
          title="BGM과 효과음 설정"
        >
          {settings.bgmMuted ? "♩" : "♫"}
        </button>
        {panelOpen && (
          <div className={styles.panel} role="dialog" aria-label="사운드 설정">
            <div className={styles.panelHeading}>
              <strong>사운드 설정</strong>
              <span>항목별로 따로 조절됩니다</span>
            </div>
            <div className={styles.settingGroup}>
              <div className={styles.settingHeader}>
                <label htmlFor="bgm-volume">BGM 음량 {Math.round(settings.bgmVolume * 100)}%</label>
                <button type="button" onClick={toggleBgmMute}>{settings.bgmMuted ? "BGM 켜기" : "BGM 음소거"}</button>
              </div>
              <input
                id="bgm-volume"
                aria-label="BGM 음량"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.bgmVolume}
                onInput={(event) => changeBgmVolume(Number(event.currentTarget.value))}
              />
            </div>
            <div className={styles.settingGroup}>
              <div className={styles.settingHeader}>
                <label htmlFor="sfx-volume">효과음 음량 {Math.round(settings.sfxVolume * 100)}%</label>
                <button type="button" onClick={toggleSfxMute}>{settings.sfxMuted ? "효과음 켜기" : "효과음 음소거"}</button>
              </div>
              <input
                id="sfx-volume"
                aria-label="효과음 음량"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.sfxVolume}
                onInput={(event) => changeSfxVolume(Number(event.currentTarget.value))}
              />
              <button className={styles.previewButton} type="button" onClick={playSoundSettingsPreview} disabled={settings.sfxMuted}>
                효과음 미리듣기
              </button>
            </div>
            <span className={styles.hint}>설정은 이 브라우저에 저장되며 다음 방문에도 유지됩니다. BGM은 화면 전환 시 자연스럽게 이어집니다.</span>
            {developerMode && <Link href="/bgm-preview">DEV · 확정곡과 후보곡 검토 →</Link>}
          </div>
        )}
      </div>
    </>
  );
}
