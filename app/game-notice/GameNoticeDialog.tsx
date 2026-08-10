"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./GameNoticeDialog.module.css";

export type GameNotice = {
  eyebrow?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "info" | "warning" | "danger";
  action?: "reset";
};

type GameNoticeDialogProps = {
  notice: GameNotice | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function GameNoticeDialog({ notice, onClose, onConfirm }: GameNoticeDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!notice) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => {
      (notice.cancelLabel ? cancelRef.current : confirmRef.current)?.focus({ preventScroll: true });
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [notice, onClose]);

  if (!notice) return null;

  const tone = notice.tone ?? "info";
  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <section
        className={`${styles.dialog} ${styles[tone]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className={styles.eyebrow}>{notice.eyebrow ?? "GUILD NOTICE"}</span>
        <span className={styles.seal} aria-hidden="true">{tone === "danger" ? "!" : "✦"}</span>
        <h2 id={titleId}>{notice.title}</h2>
        <p id={descriptionId}>{notice.message}</p>
        <div className={`${styles.actions} ${notice.cancelLabel ? "" : styles.singleAction}`}>
          {notice.cancelLabel && <button ref={cancelRef} type="button" onClick={onClose}>{notice.cancelLabel}</button>}
          <button ref={confirmRef} type="button" className={styles.confirmButton} onClick={onConfirm}>{notice.confirmLabel ?? "확인"}</button>
        </div>
      </section>
    </div>
  );
}
