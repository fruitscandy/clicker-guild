"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { effectiveSfxVolume, readAudioSettings } from "../audio-settings";
import styles from "./EndingSequence.module.css";

type EndingPhase = "aiDefeated" | "erasureStopped" | "newPaths" | "firstGuild";

type EndingSequenceProps = {
  visible: boolean;
  onComplete: () => void;
};

const PHASE_DURATION: Partial<Record<EndingPhase, number>> = {
  aiDefeated: 2_400,
  erasureStopped: 2_500,
  newPaths: 2_500,
};

const NEXT_PHASE: Partial<Record<EndingPhase, EndingPhase>> = {
  aiDefeated: "erasureStopped",
  erasureStopped: "newPaths",
  newPaths: "firstGuild",
};

const ANNOUNCEMENT_BY_PHASE: Record<EndingPhase, string> = {
  aiDefeated: "세계와 길드들을 지워 온 AI, 기록 말소자가 쓰러졌습니다.",
  erasureStopped: "말소 코어가 무너진 뒤, 세계는 더 이상 지워지지 않았습니다.",
  newPaths: "지워지던 세계 위로 새로운 길이 다시 열리기 시작했습니다.",
  firstGuild: "세계를 다시 시작하는 첫 불빛. 마지막 길드는 최초의 길드가 되었습니다. 새로운 기록을 시작할 수 있습니다.",
};

const CUE_BY_PHASE: Record<EndingPhase, { source: string; volume: number }> = {
  aiDefeated: { source: "/assets/audio/weapons/blade-impact-heavy-03.ogg", volume: 0.38 },
  erasureStopped: { source: "/assets/audio/weapons/blade-ring-02.ogg", volume: 0.24 },
  newPaths: { source: "/assets/audio/weapons/blade-swing-02.ogg", volume: 0.28 },
  firstGuild: { source: "/assets/audio/weapons/blade-impact-heavy-01.ogg", volume: 0.32 },
};

const CORE_FRAGMENTS = [
  { left: "43%", top: "40%", delay: "0ms", rotate: "-18deg", x: "-30vw", y: "-28vh" },
  { left: "49%", top: "34%", delay: "90ms", rotate: "12deg", x: "-6vw", y: "-32vh" },
  { left: "55%", top: "42%", delay: "170ms", rotate: "31deg", x: "24vw", y: "-25vh" },
  { left: "46%", top: "51%", delay: "230ms", rotate: "-42deg", x: "-26vw", y: "15vh" },
  { left: "57%", top: "54%", delay: "310ms", rotate: "17deg", x: "28vw", y: "18vh" },
  { left: "51%", top: "61%", delay: "390ms", rotate: "-9deg", x: "4vw", y: "30vh" },
];

const PATH_LIGHTS = [
  { left: "18%", top: "65%", delay: "120ms" },
  { left: "31%", top: "53%", delay: "260ms" },
  { left: "46%", top: "61%", delay: "400ms" },
  { left: "63%", top: "45%", delay: "540ms" },
  { left: "78%", top: "57%", delay: "680ms" },
];

export default function EndingSequence({ visible, onComplete }: EndingSequenceProps) {
  const [phase, setPhase] = useState<EndingPhase>("aiDefeated");
  const cuePlayersRef = useRef<HTMLAudioElement[]>([]);
  const skipRef = useRef<HTMLButtonElement | null>(null);
  const completingRef = useRef(false);

  const stopCues = useCallback(() => {
    cuePlayersRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    cuePlayersRef.current = [];
  }, []);

  const playCue = useCallback((nextPhase: EndingPhase) => {
    const cue = CUE_BY_PHASE[nextPhase];
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

  const moveToPhase = useCallback((nextPhase: EndingPhase) => {
    setPhase(nextPhase);
    playCue(nextPhase);
  }, [playCue]);

  const finishEnding = useCallback(() => {
    if (completingRef.current) return;
    completingRef.current = true;
    stopCues();
    onComplete();
  }, [onComplete, stopCues]);

  useEffect(() => {
    if (!visible) {
      stopCues();
      return;
    }

    completingRef.current = false;
    playCue("aiDefeated");
    const focusFrame = window.requestAnimationFrame(() => skipRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(focusFrame);
  }, [playCue, stopCues, visible]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finishEnding();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishEnding, visible]);

  useEffect(() => {
    if (!visible || phase === "firstGuild") return;
    const duration = PHASE_DURATION[phase];
    if (!duration) return;
    const timer = window.setTimeout(() => {
      const nextPhase = NEXT_PHASE[phase];
      if (nextPhase) moveToPhase(nextPhase);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [moveToPhase, phase, visible]);

  useEffect(() => () => stopCues(), [stopCues]);

  if (!visible) return null;

  return (
    <section
      className={styles.ending}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="모험가 길드 엔딩"
      aria-describedby="ending-phase-announcement"
    >
      <div className={styles.world} aria-hidden="true">
        <div className={styles.worldImage} />
        <div className={styles.mapGrid} />
        <div className={styles.worldShadow} />
        <div className={styles.restorationLight} />
        <div className={styles.erasureCore}><i /></div>
        <div className={styles.coreFragments}>
          {CORE_FRAGMENTS.map((fragment, index) => (
            <i
              key={index}
              style={{
                left: fragment.left,
                top: fragment.top,
                animationDelay: fragment.delay,
                rotate: fragment.rotate,
                "--fragment-x": fragment.x,
                "--fragment-y": fragment.y,
              } as CSSProperties}
            />
          ))}
        </div>
        <div className={styles.pathField} />
        <div className={styles.pathLights}>
          {PATH_LIGHTS.map((light, index) => (
            <i key={index} style={{ left: light.left, top: light.top, animationDelay: light.delay }} />
          ))}
        </div>
        <div className={styles.guildArt}><i /></div>
        <div className={styles.fog}><i /><i /><i /></div>
      </div>

      <div className={styles.letterbox} aria-hidden="true" />

      <p
        id="ending-phase-announcement"
        className={styles.announcement}
        aria-live="polite"
        aria-atomic="true"
      >
        {ANNOUNCEMENT_BY_PHASE[phase]}
      </p>

      <header className={styles.topRail}>
        <div className={styles.brandMark} aria-label="모험가 길드">
          <span>G</span>
          <div><b>모험가 길드</b><small>마지막 기록에서 시작되는 새로운 세계</small></div>
        </div>
        <button ref={skipRef} type="button" className={styles.skipButton} onClick={finishEnding}>
          건너뛰기 <kbd>ESC</kbd>
        </button>
      </header>

      <main className={styles.stage}>
        <div className={`${styles.beat} ${styles.aiDefeatedBeat}`}>
          <div className={styles.storyCopy}>
            <p>세계와 길드들을 지워 온 AI</p>
            <h2>기록 말소자가<br /><em>쓰러졌습니다.</em></h2>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.erasureStoppedBeat}`}>
          <div className={styles.storyCopy}>
            <p>말소 코어가 무너진 뒤</p>
            <h2>세계는 더 이상<br /><em className={styles.longLine}>지워지지 않았습니다.</em></h2>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.newPathsBeat}`}>
          <div className={styles.storyCopy}>
            <p>지워지던 세계 위로</p>
            <h2>새로운 길이<br /><em className={styles.longLine}>다시 열리기 시작했습니다.</em></h2>
          </div>
        </div>

        <div className={`${styles.beat} ${styles.firstGuildBeat}`}>
          <div className={styles.finalCopy}>
            <p>세계를 다시 시작하는 첫 불빛</p>
            <h2>마지막 길드는<br /><em className={styles.longLine}>최초의 길드가 되었습니다.</em></h2>
          </div>
          <div className={styles.finalRoute} aria-label="마지막 길드에서 세계의 최초의 길드로 이어지는 새로운 기록">
            <span className={styles.routeLast}><b>G</b><small>마지막 길드</small></span>
            <span className={styles.routeLight}><b>✦</b><small>세계의 첫 불빛</small></span>
            <span className={styles.routeFirst}><b>G</b><small>최초의 길드</small></span>
          </div>
          <button type="button" className={styles.completeButton} onClick={finishEnding}>
            새로운 기록 시작
          </button>
        </div>
      </main>

      <div className={styles.sequenceLine} aria-hidden="true"><i /></div>
    </section>
  );
}
