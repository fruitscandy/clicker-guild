"use client";

import { useMemo, useState } from "react";

import { getStage, STAGE_COUNT, STAGES_PER_REGION } from "../../game-data";
import { StageMap } from "../StageMap";
import styles from "./page.module.css";

const INITIAL_STAGE = 17;
const INITIAL_UNLOCKED_STAGE = 27;

export default function StageMapPreviewPage() {
  const [currentStage, setCurrentStage] = useState(INITIAL_STAGE);
  const [unlockedStage, setUnlockedStage] = useState(INITIAL_UNLOCKED_STAGE);
  const [clearedStages, setClearedStages] = useState<number[]>(
    () => Array.from({ length: INITIAL_STAGE - 1 }, (_, index) => index + 1),
  );
  const [developerMode, setDeveloperMode] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const stage = useMemo(() => getStage(currentStage), [currentStage]);
  const isCleared = clearedStages.includes(currentStage);

  function clearCurrentStage() {
    setClearedStages((current) => current.includes(currentStage)
      ? current
      : [...current, currentStage].sort((left, right) => left - right));
    setUnlockedStage((current) => Math.min(STAGE_COUNT, Math.max(current, currentStage + 1)));
  }

  function unlockNextStage() {
    setUnlockedStage((current) => Math.min(STAGE_COUNT, current + 1));
  }

  function resetPreview() {
    setCurrentStage(INITIAL_STAGE);
    setUnlockedStage(INITIAL_UNLOCKED_STAGE);
    setClearedStages(Array.from({ length: INITIAL_STAGE - 1 }, (_, index) => index + 1));
    setDeveloperMode(false);
    setMapOpen(true);
  }

  return (
    <main className={styles.preview}>
      <section className={styles.hero}>
        <span>CLICKER GUILD · UI PREVIEW</span>
        <h1>월드맵 스테이지 선택기</h1>
        <p>실제 게임 저장 데이터와 같은 형태의 상태를 사용해 선택, 클리어, 해금 동작을 확인합니다.</p>
      </section>

      <section className={styles.dashboard} aria-label="지도 미리보기 제어판">
        <article className={styles.currentCard}>
          <span>현재 토벌 목표</span>
          <strong>{stage.region.name}</strong>
          <h2>스테이지 {stage.stage} · {stage.name}</h2>
          <div>
            <b>{stage.boss ? "군주 웨이브" : `${stage.localStage}/${STAGES_PER_REGION} 웨이브`}</b>
            <b>{isCleared ? "토벌 완료" : "도전 가능"}</b>
            <b>{unlockedStage}/{STAGE_COUNT} 해금</b>
          </div>
        </article>

        <div className={styles.controls}>
          <button className={styles.primary} type="button" onClick={() => setMapOpen(true)}>
            월드맵 열기
          </button>
          <button type="button" onClick={clearCurrentStage} disabled={isCleared}>
            {isCleared ? "현재 스테이지 완료됨" : "현재 스테이지 클리어"}
          </button>
          <button type="button" onClick={unlockNextStage} disabled={unlockedStage >= STAGE_COUNT}>
            다음 스테이지 해금
          </button>
          <button
            className={developerMode ? styles.developerActive : undefined}
            type="button"
            onClick={() => {
              if (developerMode && currentStage > unlockedStage) setCurrentStage(unlockedStage);
              setDeveloperMode((current) => !current);
            }}
            aria-pressed={developerMode}
          >
            DEV 전체 해금 {developerMode ? "ON" : "OFF"}
          </button>
          <button className={styles.reset} type="button" onClick={resetPreview}>
            미리보기 초기화
          </button>
        </div>
      </section>

      <section className={styles.notes}>
        <h2>확인할 동작</h2>
        <ul>
          <li>잠긴 노드는 선택되지 않고, 해금된 노드를 고르면 현재 목표가 바뀝니다.</li>
          <li>방향키와 Home·End 키로 경로를 이동하고 Enter로 선택할 수 있습니다.</li>
          <li>클리어와 해금을 누른 뒤 지도를 다시 열면 경로 상태가 즉시 반영됩니다.</li>
        </ul>
      </section>

      {mapOpen && (
        <StageMap
          currentStage={currentStage}
          unlockedStage={unlockedStage}
          clearedStages={clearedStages}
          developerMode={developerMode}
          onSelectStage={setCurrentStage}
          onClose={() => setMapOpen(false)}
        />
      )}
    </main>
  );
}
