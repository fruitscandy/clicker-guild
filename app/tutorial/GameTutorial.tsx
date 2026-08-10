"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { TutorialStep } from "./tutorial-state";
import styles from "./GameTutorial.module.css";

type TutorialDetails = {
  selector: string | null;
  eyebrow: string;
  title: string;
  message: string;
  hint?: string;
  advanceLabel?: string;
};

type TutorialRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type GameTutorialProps = {
  active: boolean;
  step: TutorialStep;
  onSkip: () => void;
  onAdvance: () => void;
};

const STEP_DETAILS: Record<Exclude<TutorialStep, "done">, TutorialDetails> = {
  hunt: {
    selector: '[data-tutorial="hunting-ground"]',
    eyebrow: "첫 원정 · 1단계",
    title: "사냥터로 이동하세요",
    message: "마지막 길드가 성장하려면 먼저 몬스터를 토벌해야 합니다.",
    hint: "빛나는 사냥터를 눌러 토벌 지도를 여세요.",
  },
  stage: {
    selector: '[data-tutorial="stage-1"]',
    eyebrow: "첫 원정 · 2단계",
    title: "스테이지 1-1을 선택하세요",
    message: "초보자의 숲에서 첫 번째 전투를 시작합니다.",
    hint: "강조된 1번 스테이지만 선택할 수 있습니다.",
  },
  battle: {
    selector: '[data-tutorial="battlefield"]',
    eyebrow: "첫 전투 · 직접 공격",
    title: "전장을 눌러 몬스터를 공격하세요",
    message: "길드마스터의 무기는 누른 위치 주변의 몬스터를 한꺼번에 공격합니다.",
    hint: "몬스터가 모여 있는 곳을 계속 눌러 모두 처치하세요.",
  },
  retry: {
    selector: '[data-tutorial="return-guild"]',
    eyebrow: "첫 전투 · 재도전",
    title: "괜찮아요, 다시 준비하면 됩니다",
    message: "회수한 전리품은 그대로 남습니다. 영지로 돌아가 첫 전투에 다시 도전하세요.",
    hint: "영지로 복귀를 누르면 사냥터부터 다시 안내합니다.",
  },
  return: {
    selector: '[data-tutorial="return-guild"]',
    eyebrow: "첫 토벌 완료",
    title: "길드 영지로 돌아가세요",
    message: "첫 보상으로 길드원을 영입하고 무기를 강화할 수 있게 되었습니다.",
    hint: "영지로 복귀를 눌러 다음 안내를 확인하세요.",
  },
  tavern: {
    selector: '[data-tutorial="facility-tavern"]',
    eyebrow: "길드원 영입 · 1단계",
    title: "여관으로 이동하세요",
    message: "빈 길드에 함께 싸울 첫 길드원들을 모집합니다.",
    hint: "방랑자의 잔 여관을 누르세요.",
  },
  recruit: {
    selector: '[data-tutorial="recruit-ten"]',
    eyebrow: "길드원 영입 · 2단계",
    title: "무료 10연 영입을 진행하세요",
    message: "첫 계약은 길드에서 지원합니다. 골드는 소모되지 않습니다.",
    hint: "10명 영입 버튼을 누르세요.",
  },
  recruitResult: {
    selector: '[data-tutorial="recruit-results"]',
    eyebrow: "길드원 영입 완료",
    title: "첫 원정대가 완성되었습니다",
    message: "새로 영입한 길드원 중 최대 4명이 자동으로 전투 파티에 편성되었습니다.",
    hint: "이제 길드마스터의 직접 공격 무기를 강화해 봅시다.",
    advanceLabel: "대장간 안내 보기",
  },
  forge: {
    selector: '[data-tutorial="facility-forge"]',
    eyebrow: "무기 강화 · 1단계",
    title: "대장간으로 이동하세요",
    message: "전투에서 얻은 골드와 재료로 더 강한 무기를 제작할 수 있습니다.",
    hint: "불꽃 대장간을 누르세요.",
  },
  upgrade: {
    selector: '[data-tutorial="forge-upgrade"]',
    eyebrow: "무기 강화 · 2단계",
    title: "첫 무기를 제작하세요",
    message: "새 무기를 완성하면 클릭 공격력이 즉시 강해집니다.",
    hint: "강조된 제작 버튼을 누르세요.",
  },
  complete: {
    selector: null,
    eyebrow: "초보 길드마스터 가이드",
    title: "튜토리얼 완료!",
    message: "이제 몬스터를 토벌하고, 길드원을 모으고, 무기를 강화하며 마지막 길드를 성장시키세요.",
    hint: "앞으로의 성장은 길드마스터의 선택에 달려 있습니다.",
    advanceLabel: "모험 시작",
  },
};

const SPOTLIGHT_PADDING = 9;
const BATTLE_GUIDE_LIFT = 36;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readRect(element: Element): TutorialRect {
  const rect = element.getBoundingClientRect();
  const left = clamp(rect.left - SPOTLIGHT_PADDING, 8, window.innerWidth - 8);
  const top = clamp(rect.top - SPOTLIGHT_PADDING, 8, window.innerHeight - 8);
  const right = clamp(rect.right + SPOTLIGHT_PADDING, 8, window.innerWidth - 8);
  const bottom = clamp(rect.bottom + SPOTLIGHT_PADDING, 8, window.innerHeight - 8);
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function focusTarget(element: Element) {
  const focusable = element.matches("button, [href], input, select, textarea, [tabindex]")
    ? element
    : element.querySelector("button, [href], input, select, textarea, [tabindex]");
  if (focusable instanceof HTMLElement) focusable.focus({ preventScroll: true });
}

export function GameTutorial({ active, step, onSkip, onAdvance }: GameTutorialProps) {
  const details = step === "done" ? null : STEP_DETAILS[step];
  const [targetRect, setTargetRect] = useState<TutorialRect | null>(null);
  const targetRef = useRef<Element | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const preparedStepRef = useRef<TutorialStep | null>(null);

  useEffect(() => {
    if (!active || !details?.selector) {
      targetRef.current = null;
      const clearFrame = window.requestAnimationFrame(() => setTargetRect(null));
      return () => window.cancelAnimationFrame(clearFrame);
    }

    let resizeObserver: ResizeObserver | null = null;
    let focusTimer = 0;
    let settleTimer = 0;
    let initialFrame = 0;

    const update = () => {
      const element = document.querySelector(details.selector!);
      if (!element) {
        targetRef.current = null;
        setTargetRect(null);
        return;
      }

      if (targetRef.current !== element) {
        resizeObserver?.disconnect();
        targetRef.current = element;
        resizeObserver = new ResizeObserver(() => setTargetRect(readRect(element)));
        resizeObserver.observe(element);
      }

      if (preparedStepRef.current !== step) {
        preparedStepRef.current = step;
        const rect = element.getBoundingClientRect();
        const offscreen = rect.top < 72 || rect.bottom > window.innerHeight - 72;
        if (offscreen) {
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          element.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "center" });
          settleTimer = window.setTimeout(() => setTargetRect(readRect(element)), reducedMotion ? 30 : 420);
        }
        focusTimer = window.setTimeout(() => focusTarget(element), offscreen ? 440 : 40);
      }

      setTargetRect(readRect(element));
    };

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    initialFrame = window.requestAnimationFrame(update);

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearTimeout(focusTimer);
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(initialFrame);
    };
  }, [active, details?.selector, step]);

  useEffect(() => {
    if (!active || !details) return;

    const allowed = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      return Boolean(targetRef.current?.contains(target) || cardRef.current?.contains(target));
    };
    const blockOutside = (event: Event) => {
      if (allowed(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };
    const keepKeyboardInside = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        if (!allowed(event.target)) blockOutside(event);
        return;
      }

      const selector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
      const focusable = [
        ...(targetRef.current?.querySelectorAll<HTMLElement>(selector) ?? []),
        ...(cardRef.current?.querySelectorAll<HTMLElement>(selector) ?? []),
      ];
      if (targetRef.current instanceof HTMLElement && targetRef.current.matches(selector)) focusable.unshift(targetRef.current);
      if (!focusable.length) return;

      event.preventDefault();
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
        : (currentIndex + 1) % focusable.length;
      focusable[nextIndex].focus({ preventScroll: true });
    };

    document.addEventListener("pointerdown", blockOutside, true);
    document.addEventListener("click", blockOutside, true);
    document.addEventListener("wheel", blockOutside, { capture: true, passive: false });
    document.addEventListener("keydown", keepKeyboardInside, true);
    return () => {
      document.removeEventListener("pointerdown", blockOutside, true);
      document.removeEventListener("click", blockOutside, true);
      document.removeEventListener("wheel", blockOutside, true);
      document.removeEventListener("keydown", keepKeyboardInside, true);
    };
  }, [active, details]);

  const cardPosition = useMemo<CSSProperties>(() => {
    if (!targetRect) return {};
    const width = Math.min(360, window.innerWidth - 24);
    const left = clamp(targetRect.left + targetRect.width / 2 - width / 2, 12, window.innerWidth - width - 12);
    const belowHasRoom = window.innerHeight - targetRect.bottom >= 210;
    const defaultTop = belowHasRoom
      ? targetRect.bottom + 16
      : clamp(targetRect.top - 188, 68, Math.max(68, window.innerHeight - 205));
    const top = step === "battle" && !belowHasRoom
      ? Math.max(24, defaultTop - BATTLE_GUIDE_LIFT)
      : defaultTop;
    return { left, top, width };
  }, [step, targetRect]);

  if (!active || !details) return null;

  const complete = step === "complete";
  const waitingForTarget = Boolean(details.selector && !targetRect);

  return (
    <aside className={`${styles.tutorial} ${complete ? styles.complete : ""}`} aria-label="초보 길드마스터 튜토리얼">
      {targetRect ? (
        <>
          <span className={styles.blocker} style={{ left: 0, top: 0, width: "100%", height: targetRect.top }} />
          <span className={styles.blocker} style={{ left: 0, top: targetRect.top, width: targetRect.left, height: targetRect.height }} />
          <span className={styles.blocker} style={{ left: targetRect.right, top: targetRect.top, right: 0, height: targetRect.height }} />
          <span className={styles.blocker} style={{ left: 0, top: targetRect.bottom, width: "100%", bottom: 0 }} />
          <span
            className={styles.spotlight}
            style={{ left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height }}
            aria-hidden="true"
          />
        </>
      ) : <span className={styles.fullBlocker} />}

      <div
        ref={cardRef}
        className={`${styles.guideCard} ${complete || waitingForTarget ? styles.centerCard : ""}`}
        style={complete || waitingForTarget ? undefined : cardPosition}
        role="status"
        aria-live="polite"
      >
        <span className={styles.guideSeal} aria-hidden="true">G</span>
        <div className={styles.guideCopy}>
          <small>{details.eyebrow}</small>
          <strong>{waitingForTarget ? "다음 안내를 준비하고 있습니다" : details.title}</strong>
          <p>{waitingForTarget ? "화면이 열리면 강조된 영역만 눌러 진행할 수 있습니다." : details.message}</p>
          {!waitingForTarget && details.hint && <em>{details.hint}</em>}
        </div>
        <div className={styles.guideActions}>
          {details.advanceLabel && <button type="button" className={styles.advanceButton} onClick={onAdvance}>{details.advanceLabel}</button>}
          {!complete && <button type="button" className={styles.skipButton} onClick={onSkip}>튜토리얼 건너뛰기</button>}
        </div>
      </div>
    </aside>
  );
}
