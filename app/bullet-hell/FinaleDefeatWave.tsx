"use client";

import { createPortal } from "react-dom";
import type { AnimationEvent, CSSProperties } from "react";
import styles from "./FinaleDefeatWave.module.css";

export type FinaleDefeatWavePhase = "covering" | "covered" | "revealing";

type FinaleDefeatWaveProps = {
  phase: FinaleDefeatWavePhase;
  onCovered: () => void;
  onRevealed: () => void;
};

type WaveStripStyle = CSSProperties & {
  "--strip-index": number;
  "--cover-delay": `${number}ms`;
  "--reveal-delay": `${number}ms`;
};

const STRIP_COUNT = 48;
const MAX_STAGGER_MS = 160;

const WAVE_STRIPS = Array.from({ length: STRIP_COUNT }, (_, index) => {
  const wavePhase = index / (STRIP_COUNT - 1) * Math.PI * 4 - Math.PI / 2;
  const coverDelay = Math.round((Math.sin(wavePhase) + 1) * MAX_STAGGER_MS / 2);

  return {
    index,
    coverDelay,
    revealDelay: MAX_STAGGER_MS - coverDelay,
  };
});

export function FinaleDefeatWave({ phase, onCovered, onRevealed }: FinaleDefeatWaveProps) {
  if (typeof document === "undefined") return null;

  const handleClockEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.target !== event.currentTarget) return;
    if (phase === "covering") onCovered();
    if (phase === "revealing") onRevealed();
  };

  return createPortal(
    <div className={styles.wave} data-finale-defeat-wave={phase} aria-hidden="true">
      <div className={styles.stripField}>
        {WAVE_STRIPS.map(({ index, coverDelay, revealDelay }) => <i
          key={index}
          className={styles.strip}
          style={{
            "--strip-index": index,
            "--cover-delay": `${coverDelay}ms`,
            "--reveal-delay": `${revealDelay}ms`,
          } as WaveStripStyle}
        />)}
      </div>
      <span className={styles.reducedVeil} />
      <span key={phase} className={styles.phaseClock} onAnimationEnd={handleClockEnd} />
    </div>,
    document.body,
  );
}
