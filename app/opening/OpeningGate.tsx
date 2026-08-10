"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { effectiveSfxVolume, readAudioSettings } from "../audio-settings";
import { OPENING_RESTART_EVENT } from "./opening-events";
import styles from "./OpeningGate.module.css";

type OpeningPhase = "invitation" | "prologue" | "awakening" | "summon" | "alert" | "title";

const PHASE_DURATION: Partial<Record<OpeningPhase, number>> = {
  prologue: 2_600,
  awakening: 3_200,
  summon: 3_400,
  alert: 2_700,
  title: 3_300,
};

const NEXT_PHASE: Partial<Record<OpeningPhase, OpeningPhase>> = {
  prologue: "awakening",
  awakening: "summon",
  summon: "alert",
  alert: "title",
};

const CUE_BY_PHASE: Partial<Record<OpeningPhase, { source: string; volume: number }>> = {
  awakening: { source: "/assets/audio/weapons/blade-ring-02.ogg", volume: 0.58 },
  summon: { source: "/assets/audio/weapons/blade-swing-02.ogg", volume: 0.48 },
  alert: { source: "/assets/audio/weapons/blade-impact-heavy-01.ogg", volume: 0.62 },
  title: { source: "/assets/audio/weapons/blade-impact-heavy-03.ogg", volume: 0.72 },
};

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
    setPhase("prologue");
  }, [stopCues]);

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
    if (!openingVisible || phase === "invitation") return;
    const duration = PHASE_DURATION[phase];
    if (!duration) return;
    const timer = window.setTimeout(() => {
      const nextPhase = NEXT_PHASE[phase];
      if (nextPhase) moveToPhase(nextPhase);
      else finishOpening();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [finishOpening, moveToPhase, openingVisible, phase]);

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
          aria-label="길드마스터 크로니클 오프닝"
        >
          <div className={styles.world} aria-hidden="true">
            <div className={styles.worldImage} />
            <div className={styles.worldShadow} />
            <div className={styles.worldWarmth} />
            <div className={styles.lightSweep} />
            <div className={styles.fog}><i /><i /><i /></div>
            <div className={styles.rain}>
              {Array.from({ length: 28 }, (_, index) => (
                <i key={index} style={{ "--drop": index } as CSSProperties} />
              ))}
            </div>
            <div className={styles.embers}>
              {Array.from({ length: 18 }, (_, index) => (
                <i key={index} style={{ "--ember": index } as CSSProperties} />
              ))}
            </div>
          </div>

          <div className={styles.letterbox} aria-hidden="true" />

          <header className={styles.topRail}>
            <div className={styles.archiveMark} aria-label="Guildmaster Chronicle">
              <span>G</span>
              <div><b>GUILDMASTER</b><small>CHRONICLE · ARCHIVE 00</small></div>
            </div>
            <button ref={skipRef} type="button" className={styles.skipButton} onClick={finishOpening}>
              건너뛰기 <kbd>ESC</kbd>
            </button>
          </header>

          <main className={styles.stage}>
            <div className={`${styles.beat} ${styles.invitationBeat}`}>
              <p className={styles.eyebrow}>KINGDOM ARCHIVE · YEAR 428</p>
              <h1>마지막 길드의<br /><em>문을 여시겠습니까?</em></h1>
              <div className={styles.invitationRule}><i /><span>F</span><i /></div>
              <button
                type="button"
                className={styles.beginButton}
                onClick={beginSequence}
              >
                <span className={styles.beginSeal}>G</span>
                <span><small>음악과 함께 자동 재생</small><b>봉인된 기록을 깨운다</b></span>
              </button>
            </div>

            <div className={`${styles.beat} ${styles.prologueBeat}`}>
              <div className={styles.prologueIndex}><span>01</span><i /></div>
              <p>그날 밤,</p>
              <h2>마지막 길드의<br />불이 꺼졌다.</h2>
              <small>왕국의 모든 원정 기록이 이곳에서 멈췄다.</small>
            </div>

            <div className={`${styles.beat} ${styles.awakeningBeat}`}>
              <div className={styles.core} aria-hidden="true">
                <i className={styles.coreHalo} />
                <i className={styles.coreOrbitOne} />
                <i className={styles.coreOrbitTwo} />
                <i className={styles.coreScan} />
                <span>G</span>
              </div>
              <div className={styles.systemReadout}>
                <small>ARCHIVE CORE // RESTARTING</small>
                <b>길드마스터 신호 확인</b>
                <span><i /> 동기화율 97.4%</span>
              </div>
            </div>

            <div className={`${styles.beat} ${styles.summonBeat}`}>
              <div className={styles.summonCopy}>
                <small>FIRST CONTRACT · UNIT 01</small>
                <h2>견습 전사<br /><em>로안</em></h2>
                <p>“명령을.”</p>
                <span>HERO DATA GENERATING · COMPLETE</span>
              </div>
              <div className={styles.portal} aria-hidden="true"><i /><i /><i /></div>
              <div className={styles.roan}>
                <Image
                  src="/assets/guild-members/roan/roan-idle-preview.webp"
                  alt="검과 방패를 든 견습 전사 로안"
                  width={512}
                  height={512}
                  priority
                />
              </div>
              <div className={styles.unitStamp} aria-hidden="true"><b>F</b><small>REGISTERED</small></div>
            </div>

            <div className={`${styles.beat} ${styles.alertBeat}`}>
              <div className={styles.alertSignal} aria-hidden="true"><i /><i /><i /></div>
              <div className={styles.alertCopy}>
                <small>EMERGENCY SIGNAL · FOREST 01</small>
                <h2>초보자의 숲<br /><em>구조 신호 감지</em></h2>
                <p>첫 원정이 당신의 명령을 기다립니다.</p>
              </div>
              <div className={styles.slimeLine} aria-hidden="true">
                {[0, 1, 2].map((item) => (
                  <Image
                    key={item}
                    src="/assets/monsters/stage-01/stage-01-01-small-green-slime.png"
                    alt=""
                    width={256}
                    height={256}
                  />
                ))}
              </div>
              <div className={styles.scanLine} aria-hidden="true" />
            </div>

            <div className={`${styles.beat} ${styles.titleBeat}`}>
              <div className={styles.titleGlow} aria-hidden="true" />
              <div className={styles.titleCrest} aria-hidden="true">G</div>
              <p>THE FIRST PAGE AWAKENS</p>
              <h1>GUILDMASTER<br /><em>CHRONICLE</em></h1>
              <div className={styles.titleRule}><i /><span>◆</span><i /></div>
              <strong>작은 길드가 전설이 되는 곳</strong>
              <small>길드로 이동합니다</small>
            </div>

            <div className={styles.guildRise} aria-hidden="true"><i /></div>
          </main>

          <div className={styles.sequenceLine} aria-hidden="true"><i /></div>
        </section>
      )}
    </>
  );
}
