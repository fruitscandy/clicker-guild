"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import styles from "./OpeningGate.module.css";

type OpeningPhase = "boot" | "awakening" | "contract" | "summon" | "alert" | "title";

const PHASES: OpeningPhase[] = ["boot", "awakening", "contract", "summon", "alert", "title"];

const VOICE_BY_PHASE: Partial<Record<OpeningPhase, string>> = {
  awakening: "/audio/opening/core-awake.wav",
  contract: "/audio/opening/core-contract.wav",
  summon: "/audio/opening/core-sync.wav",
  alert: "/audio/opening/core-quest.wav",
  title: "/audio/opening/core-promise.wav",
};

const DIALOGUE_BY_PHASE: Record<OpeningPhase, { speaker: string; line: string }> = {
  boot: { speaker: "봉인된 길드 기록", line: "길드 활동 정지 · 새로운 길드마스터를 기다리는 중" },
  awakening: { speaker: "길드 코어", line: "오래 기다렸습니다. 당신이 새로운 길드마스터군요." },
  contract: { speaker: "길드 코어", line: "길드 인장을 깨워, 계약을 시작하세요." },
  summon: { speaker: "견습 전사 로안", line: "계약 신호를 확인했습니다. 길드마스터, 첫 명령을 내려주세요!" },
  alert: { speaker: "길드 코어", line: "첫 번째 의뢰가 도착했습니다. 당신의 가능성을 증명하세요." },
  title: { speaker: "길드 코어", line: "당신의 모험이 끝나지 않도록, 제가 돕겠습니다." },
};

const NEW_GAME_TOAST = "새로운 길드가 창설되었습니다";

function stopAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export default function OpeningGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<OpeningPhase>("boot");
  const [openingVisible, setOpeningVisible] = useState(true);
  const [gameMounted, setGameMounted] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const skipRef = useRef<HTMLButtonElement | null>(null);
  const handledNewGameToastRef = useRef(false);

  const stopAllAudio = useCallback(() => {
    stopAudio(voiceRef.current);
    voiceRef.current = null;
  }, []);

  const playVoice = useCallback((source: string, force = false) => {
    stopAudio(voiceRef.current);
    if (!soundEnabled && !force) return;
    const voice = new Audio(source);
    voice.volume = 0.92;
    voiceRef.current = voice;
    void voice.play().catch(() => undefined);
  }, [soundEnabled]);

  const moveToPhase = useCallback((nextPhase: OpeningPhase) => {
    setPhase(nextPhase);
    const voice = VOICE_BY_PHASE[nextPhase];
    if (voice) playVoice(voice);
  }, [playVoice]);

  const finishOpening = useCallback(() => {
    stopAllAudio();
    setOpeningVisible(false);
    setGameMounted(true);
  }, [stopAllAudio]);

  const startOpening = useCallback(() => {
    stopAllAudio();
    setPhase("boot");
    setOpeningVisible(true);
  }, [stopAllAudio]);

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
    if (!openingVisible || phase !== "awakening") return;
    const timer = window.setTimeout(() => moveToPhase("contract"), 4_600);
    return () => window.clearTimeout(timer);
  }, [moveToPhase, openingVisible, phase]);

  useEffect(() => {
    if (!openingVisible || phase !== "summon") return;
    const timer = window.setTimeout(() => {
      playVoice("/audio/opening/roan-arrival.wav");
    }, 1_900);
    return () => window.clearTimeout(timer);
  }, [openingVisible, phase, playVoice]);

  useEffect(() => {
    if (!openingVisible || phase !== "alert") return;
    const timer = window.setTimeout(() => moveToPhase("title"), 4_800);
    return () => window.clearTimeout(timer);
  }, [moveToPhase, openingVisible, phase]);

  useEffect(() => {
    if (!gameMounted || openingVisible) return;
    const observer = new MutationObserver(() => {
      const toast = document.querySelector<HTMLElement>(".toast");
      const isNewGame = toast?.textContent?.includes(NEW_GAME_TOAST) ?? false;
      if (!isNewGame) {
        handledNewGameToastRef.current = false;
        return;
      }
      if (!handledNewGameToastRef.current) {
        handledNewGameToastRef.current = true;
        window.setTimeout(startOpening, 220);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [gameMounted, openingVisible, startOpening]);

  useEffect(() => () => stopAllAudio(), [stopAllAudio]);

  function beginChronicle() {
    moveToPhase("awakening");
  }

  function toggleSound() {
    if (soundEnabled) {
      stopAllAudio();
      setSoundEnabled(false);
      return;
    }

    setSoundEnabled(true);
    const voice = VOICE_BY_PHASE[phase];
    if (voice) playVoice(voice, true);
  }

  const dialogue = DIALOGUE_BY_PHASE[phase];
  const phaseNumber = PHASES.indexOf(phase) + 1;

  return (
    <>
      {gameMounted && (
        <div className={openingVisible ? styles.gameBehindOpening : undefined} aria-hidden={openingVisible || undefined}>
          {children}
        </div>
      )}

      {openingVisible && (
        <section className={styles.opening} data-phase={phase} role="dialog" aria-modal="true" aria-label="길드마스터 연대기 오프닝">
          <div className={styles.backdrop} aria-hidden="true" />
          <div className={styles.dawn} aria-hidden="true" />
          <div className={styles.rain} aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
          </div>
          <div className={styles.vignette} aria-hidden="true" />

          <header className={styles.topRail}>
            <div className={styles.archiveMark}>
              <span>G</span>
              <div><b>GUILDMASTER CHRONICLE</b><small>ARCHIVE NODE · 00</small></div>
            </div>
            <div className={styles.controls}>
              <button type="button" className={styles.soundButton} onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? "오프닝 음성 끄기" : "오프닝 음성 켜기"}>
                {soundEnabled ? "음성 ON" : "음성 OFF"}
              </button>
              <button ref={skipRef} type="button" className={styles.skipButton} onClick={finishOpening}>
                오프닝 스킵 <span aria-hidden="true">›</span>
              </button>
            </div>
          </header>

          <div className={styles.progress} aria-label={`오프닝 ${phaseNumber}/${PHASES.length}`}>
            {PHASES.map((item, index) => <i key={item} className={index <= PHASES.indexOf(phase) ? styles.progressActive : undefined} />)}
          </div>

          <main className={styles.scene}>
            <div className={styles.guildSilhouette} aria-hidden="true">
              <div className={styles.guildSprite} />
              <span className={styles.guildDust}>{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</span>
            </div>

            {(phase === "awakening" || phase === "contract") && (
              <div className={styles.core} aria-hidden="true">
                <i className={styles.coreRingOne} /><i className={styles.coreRingTwo} />
                <span>G</span>
                <b>契約</b>
              </div>
            )}

            {phase === "boot" && (
              <div className={styles.bootCopy}>
                <p>왕국력 428년 · 폐쇄 기록</p>
                <h1>마지막 길드의<br /><em>문을 여시겠습니까?</em></h1>
                <div className={styles.ledger}><span>길드 등급 <b>F</b></span><span>활동 인원 <b>0</b></span><span>남은 불빛 <b>1</b></span></div>
                <button type="button" className={styles.sealButton} onClick={beginChronicle}>
                  <i aria-hidden="true">G</i><span><small>음성과 함께 시작</small>길드 인장을 깨운다</span>
                </button>
              </div>
            )}

            {phase === "contract" && (
              <button type="button" className={styles.contractSeal} onClick={() => moveToPhase("summon")}>
                <span className={styles.contractHalo} aria-hidden="true" />
                <i aria-hidden="true">G</i>
                <b>계약 승인</b>
                <small>길드마스터의 인장을 새깁니다</small>
              </button>
            )}

            {phase === "summon" && (
              <div className={styles.summonStage}>
                <div className={styles.portal} aria-hidden="true"><i /><i /><i /></div>
                <div className={styles.systemGlitch} aria-hidden="true">HERO DATA GENERATING · 01</div>
                <article className={styles.recruitCard}>
                  <div className={styles.rankStamp}>F</div>
                  <Image src="/assets/guild-members/roan/roan-idle-preview.webp" alt="검과 방패를 든 견습 전사 로안" width={512} height={512} priority />
                  <div><small>FIRST CONTRACT</small><h2>견습 전사 로안</h2><p>“검과 용기로 길드의 첫 전열을 지키겠습니다.”</p></div>
                </article>
                <button type="button" className={styles.nextButton} onClick={() => moveToPhase("alert")}>첫 명령을 내린다 <span aria-hidden="true">›</span></button>
              </div>
            )}

            {phase === "alert" && (
              <div className={styles.alertStage}>
                <div className={styles.alertPulse} aria-hidden="true" />
                <p>FIRST EXPEDITION</p>
                <h2>초보자의 숲에서<br />구조 요청이 도착했습니다</h2>
                <div className={styles.slimePack} aria-hidden="true">
                  {[0, 1, 2].map((item) => <Image key={item} src="/assets/monsters/stage-01/stage-01-01-small-green-slime.png" alt="" width={256} height={256} />)}
                </div>
                <button type="button" className={styles.nextButton} onClick={() => moveToPhase("title")}>전장을 확인한다 <span aria-hidden="true">›</span></button>
              </div>
            )}

            {phase === "title" && (
              <div className={styles.titleStage}>
                <span className={styles.titleCrest} aria-hidden="true">G</span>
                <p>THE FIRST PAGE AWAKENS</p>
                <h1>GUILDMASTER<br /><em>CHRONICLE</em></h1>
                <div className={styles.titleDivider}><i />◆<i /></div>
                <strong>작은 길드가 전설이 되는 곳</strong>
                <button type="button" className={styles.enterButton} onClick={finishOpening}>길드의 문을 연다 <span aria-hidden="true">›</span></button>
              </div>
            )}
          </main>

          <footer className={styles.dialogue} aria-live="polite">
            <span className={styles.speaker}>{dialogue.speaker}</span>
            <p>{dialogue.line}</p>
            <small>ESC로 언제든 건너뛸 수 있습니다</small>
          </footer>
        </section>
      )}
    </>
  );
}


