"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { effectiveSfxVolume, readAudioSettings } from "../audio-settings";
import { OPENING_RESTART_EVENT } from "./opening-events";
import styles from "./OpeningGate.module.css";

type OpeningPhase = "invitation" | "manyGuilds" | "erasure" | "lastGuild" | "frontier";

const PHASE_DURATION: Partial<Record<OpeningPhase, number>> = {
  manyGuilds: 2_200,
  erasure: 2_700,
  lastGuild: 2_300,
};

const NEXT_PHASE: Partial<Record<OpeningPhase, OpeningPhase>> = {
  manyGuilds: "erasure",
  erasure: "lastGuild",
  lastGuild: "frontier",
};

const CUE_BY_PHASE: Partial<Record<OpeningPhase, { source: string; volume: number }>> = {
  manyGuilds: { source: "/assets/audio/weapons/blade-ring-02.ogg", volume: 0.24 },
  erasure: { source: "/assets/audio/weapons/blade-impact-heavy-01.ogg", volume: 0.32 },
  lastGuild: { source: "/assets/audio/weapons/blade-impact-heavy-03.ogg", volume: 0.42 },
  frontier: { source: "/assets/audio/weapons/blade-swing-02.ogg", volume: 0.34 },
};

const GUILD_LIGHTS = [
  { left: "13%", top: "24%", delay: "0ms" },
  { left: "30%", top: "38%", delay: "130ms" },
  { left: "47%", top: "19%", delay: "250ms" },
  { left: "71%", top: "27%", delay: "390ms" },
  { left: "58%", top: "59%", delay: "520ms", last: true },
  { left: "84%", top: "52%", delay: "670ms" },
  { left: "23%", top: "66%", delay: "810ms" },
];

const ERASURE_FRAGMENTS = [
  { left: "6%", top: "10%", delay: "0ms" },
  { left: "17%", top: "78%", delay: "180ms" },
  { left: "31%", top: "15%", delay: "340ms" },
  { left: "44%", top: "74%", delay: "520ms" },
  { left: "61%", top: "9%", delay: "690ms" },
  { left: "75%", top: "69%", delay: "820ms" },
  { left: "88%", top: "20%", delay: "980ms" },
  { left: "94%", top: "58%", delay: "1.12s" },
];

export default function OpeningGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<OpeningPhase>("invitation");
  const [openingVisible, setOpeningVisible] = useState(true);
  const cuePlayersRef = useRef<HTMLAudioElement[]>([]);
  const skipRef = useRef<HTMLButtonElement | null>(null);

  const stopCues = useCallback(() => {
    cuePlayersRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    cuePlayersRef.current = [];
  }, []);

  const playCue = useCallback((nextPhase: OpeningPhase) => {
    const cue = CUE_BY_PHASE[nextPhase];
    if (!cue) return;

    const volume = effectiveSfxVolume(readAudioSettings());
    if (volume <= 0) return;

    const audio = new Audio(cue.source);
    audio.volume = Math.min(1, volume * cue.volume);
    cuePlayersRef.current.push(audio);
    audio.addEventListener("ended", () => {
      cuePlayersRef.current = cuePlayersRef.current.filter((player) => player !== audio);
    }, { once: true });
    void audio.play().catch(() => undefined);
  }, []);

  const finishOpening = useCallback(() => {
    stopCues();
    setOpeningVisible(false);
  }, [stopCues]);

  const moveToPhase = useCallback((nextPhase: OpeningPhase) => {
    setPhase(nextPhase);
    playCue(nextPhase);
  }, [playCue]);

  const startOpening = useCallback(() => {
    stopCues();
    setPhase("invitation");
    setOpeningVisible(true);
  }, [stopCues]);

  const beginSequence = useCallback(() => {
    stopCues();
    moveToPhase("manyGuilds");
  }, [moveToPhase, stopCues]);

  useEffect(() => {
    if (!openingVisible) return;
    skipRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishOpening();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishOpening, openingVisible]);

  useEffect(() => {
    if (!openingVisible || phase === "invitation" || phase === "frontier") return;
    const duration = PHASE_DURATION[phase];
    if (!duration) return;
    const timer = window.setTimeout(() => {
      const nextPhase = NEXT_PHASE[phase];
      if (nextPhase) moveToPhase(nextPhase);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [moveToPhase, openingVisible, phase]);

  useEffect(() => {
    let restartTimer: number | null = null;
    const restartOpening = () => {
      if (restartTimer !== null) window.clearTimeout(restartTimer);
      restartTimer = window.setTimeout(startOpening, 220);
    };
    window.addEventListener(OPENING_RESTART_EVENT, restartOpening);
    return () => {
      if (restartTimer !== null) window.clearTimeout(restartTimer);
      window.removeEventListener(OPENING_RESTART_EVENT, restartOpening);
    };
  }, [startOpening]);

  useEffect(() => () => stopCues(), [stopCues]);

  return (
    <>
      <div className={openingVisible ? styles.gameBehindOpening : undefined} aria-hidden={openingVisible || undefined}>
        {children}
      </div>

      {openingVisible && (
        <section
          className={styles.opening}
          data-phase={phase}
          role="dialog"
          aria-modal="true"
          aria-label="모험가 길드 오프닝"
        >
          <div className={styles.world} aria-hidden="true">
            <div className={styles.worldImage} />
            <div className={styles.mapGrid} />
            <div className={styles.worldShadow} />
            <div className={styles.erasureVeil} />
            <div className={styles.erasureFragments}>
              {ERASURE_FRAGMENTS.map((fragment, index) => (
                <i
                  key={index}
                  style={{
                    left: fragment.left,
                    top: fragment.top,
                    animationDelay: fragment.delay,
                  }}
                />
              ))}
            </div>
            <div className={styles.guildLights}>
              {GUILD_LIGHTS.map((guild, index) => (
                <i
                  key={index}
                  className={guild.last ? styles.lastLight : undefined}
                  style={{ left: guild.left, top: guild.top, animationDelay: guild.delay }}
                />
              ))}
            </div>
            <div className={styles.lastGuildArt}><i /></div>
            <div className={styles.fog}><i /><i /><i /></div>
          </div>

          <div className={styles.letterbox} aria-hidden="true" />

          <header className={styles.topRail}>
            <div className={styles.brandMark} aria-label="모험가 길드">
              <span>G</span>
              <div><b>모험가 길드</b><small>세계에 마지막으로 남은 길드</small></div>
            </div>
            <button ref={skipRef} type="button" className={styles.skipButton} onClick={finishOpening}>
              건너뛰기 <kbd>ESC</kbd>
            </button>
          </header>

          <main className={styles.stage}>
            <div className={`${styles.beat} ${styles.invitationBeat}`}>
              <p className={styles.eyebrow}>모험가 길드</p>
              <h1>마지막 길드의<br /><em>이야기를 시작합니다.</em></h1>
              <button type="button" className={styles.beginButton} onClick={beginSequence}>
                <span className={styles.beginSeal}>G</span>
                <span><small>짧은 오프닝</small><b>이야기 시작</b></span>
              </button>
            </div>

            <div className={`${styles.beat} ${styles.manyGuildsBeat}`}>
              <div className={styles.storyCopy}>
                <p>한때 이 세계에는</p>
                <h2>수많은 길드가<br /><em>있었습니다.</em></h2>
              </div>
            </div>

            <div className={`${styles.beat} ${styles.erasureBeat}`}>
              <div className={styles.storyCopy}>
                <p>하지만 어느 날부터</p>
                <h2>세계가 조금씩<br /><em>사라지고 있습니다.</em></h2>
              </div>
            </div>

            <div className={`${styles.beat} ${styles.lastGuildBeat}`}>
              <div className={styles.storyCopy}>
                <p>모든 불빛이 꺼진 뒤</p>
                <h2>단 하나의 길드만<br /><em>남았습니다.</em></h2>
              </div>
            </div>

            <div className={`${styles.beat} ${styles.frontierBeat}`}>
              <div className={styles.frontierCopy}>
                <p>세계에 마지막으로 남은 길드</p>
                <h2>몬스터를 토벌하고<br /><em>마지막 길드를 성장시키세요.</em></h2>
              </div>
              <div className={styles.frontierRoute} aria-label="몬스터 토벌로 성장하는 마지막 길드">
                <span className={styles.routeGuild}><b>G</b><small>마지막 길드</small></span>
                <span className={styles.routeCombat}><b>⚔</b><small>몬스터 토벌</small></span>
                <span className={styles.growthRoute}><b>↑</b><small>길드 성장</small></span>
              </div>
              <button type="button" className={styles.startHuntButton} onClick={finishOpening}>
                전투 시작
              </button>
            </div>
          </main>

          <div className={styles.sequenceLine} aria-hidden="true"><i /></div>
        </section>
      )}
    </>
  );
}
