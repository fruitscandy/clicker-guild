"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import EndingSequence from "./EndingSequence";
import { ENDING_START_EVENT, type EndingLaunchMode, type EndingRequest } from "./ending-events";
import styles from "./EndingGate.module.css";

export default function EndingGate({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<EndingLaunchMode>("campaign");
  const completionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const startEnding = (event: Event) => {
      const request = (event as CustomEvent<EndingRequest>).detail;
      if (!request || typeof request.onComplete !== "function") return;
      completionRef.current = request.onComplete;
      setMode(request.mode);
      setVisible(true);
    };

    window.addEventListener(ENDING_START_EVENT, startEnding);
    return () => window.removeEventListener(ENDING_START_EVENT, startEnding);
  }, []);

  const finishEnding = useCallback(() => {
    const onComplete = completionRef.current;
    completionRef.current = null;
    setVisible(false);
    onComplete?.();
  }, []);

  return (
    <>
      <div
        className={visible ? styles.gameBehindEnding : undefined}
        data-ending-mode={visible ? mode : undefined}
        aria-hidden={visible || undefined}
        inert={visible ? true : undefined}
      >
        {children}
      </div>
      {visible && <EndingSequence visible onComplete={finishEnding} />}
    </>
  );
}
