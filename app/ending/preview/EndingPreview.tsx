"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EndingGate from "../EndingGate";
import { requestEnding } from "../ending-events";
import styles from "./EndingPreview.module.css";

export default function EndingPreview() {
  return (
    <EndingGate>
      <EndingPreviewContent />
    </EndingGate>
  );
}

function EndingPreviewContent() {
  const [completed, setCompleted] = useState(false);
  const launchedRef = useRef(false);

  const launchEnding = useCallback(() => {
    setCompleted(false);
    requestEnding({
      mode: "preview",
      onComplete: () => setCompleted(true),
    });
  }, []);

  useEffect(() => {
    const launchFrame = window.requestAnimationFrame(() => {
      if (launchedRef.current) return;
      launchedRef.current = true;
      launchEnding();
    });
    return () => window.cancelAnimationFrame(launchFrame);
  }, [launchEnding]);

  return (
    <main className={styles.preview}>
      <section className={styles.guildCard} aria-labelledby="ending-preview-title">
        <span className={styles.seal} aria-hidden="true">G</span>
        <p>ENDING SEQUENCE PREVIEW</p>
        <h1 id="ending-preview-title">최초의 길드 엔딩</h1>
        <span>저장 데이터와 분리된 화면 검증용 미리보기입니다.</span>
        {completed ? <strong role="status">엔딩 재생을 마쳤습니다.</strong> : <small>엔딩이 재생 중입니다.</small>}
        <button type="button" onClick={launchEnding}>엔딩 다시 보기</button>
      </section>
    </main>
  );
}
