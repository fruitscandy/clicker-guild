"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { fieldAssetForRegion } from "../field-assets";
import { getStage } from "../game-data";
import styles from "./StageMap.module.css";

const STAGE_COUNT = 100;
const STAGES_PER_REGION = 10;

const ROUTE_POINTS = [
  [8, 23],
  [27, 16],
  [46, 25],
  [65, 15],
  [84, 23],
  [84, 72],
  [65, 64],
  [46, 76],
  [27, 66],
  [8, 76],
] as const;

const REGION_DETAILS = [
  { subtitle: "새싹길과 오래된 수호수" },
  { subtitle: "모래바람이 지우는 대상로" },
  { subtitle: "희미한 횃불이 잇는 수로" },
  { subtitle: "수레 자국을 따라가는 갱도" },
  { subtitle: "빙벽 사이의 좁은 순례길" },
  { subtitle: "용암강을 건너는 잿빛 능선" },
  { subtitle: "망자의 등불이 남은 묘역" },
  { subtitle: "부유석을 잇는 마력 항로" },
  { subtitle: "흑철 성문으로 향하는 공성로" },
  { subtitle: "구름 위 고룡의 마지막 성역" },
] as const;

type RegionImageStyle = CSSProperties & {
  "--region-image": string;
  "--region-image-position": string;
};

type StageState = "current" | "cleared" | "available" | "locked";

export type StageMapProps = {
  currentStage: number;
  unlockedStage: number;
  clearedStages: readonly number[];
  developerMode?: boolean;
  onSelectStage: (stageNumber: number) => void;
  onClose: () => void;
  title?: string;
};

function clampStage(stage: number) {
  return Math.max(1, Math.min(STAGE_COUNT, Math.round(stage)));
}

function classNames(...names: Array<string | false | undefined>) {
  return names.filter(Boolean).join(" ");
}

function stageState(
  stageNumber: number,
  currentStage: number,
  unlockedStage: number,
  clearedStages: ReadonlySet<number>,
  developerMode: boolean,
): StageState {
  if (!developerMode && stageNumber > unlockedStage) return "locked";
  if (stageNumber === currentStage) return "current";
  if (clearedStages.has(stageNumber)) return "cleared";
  return "available";
}

function stateLabel(state: StageState, developerMode: boolean) {
  if (state === "locked") return "잠김";
  if (state === "current") return developerMode ? "현재 · DEV" : "현재 목표";
  if (state === "cleared") return developerMode ? "완료 · DEV" : "토벌 완료";
  return developerMode ? "DEV 해금" : "도전 가능";
}

export function StageMap({
  currentStage,
  unlockedStage,
  clearedStages,
  developerMode = false,
  onSelectStage,
  onClose,
  title = "토벌 목표 선택",
}: StageMapProps) {
  const generatedId = useId();
  const titleId = `stage-map-title-${generatedId.replace(/:/g, "")}`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingFocusStage = useRef<number | null>(null);
  const safeCurrentStage = clampStage(currentStage);
  const safeUnlockedStage = clampStage(unlockedStage);
  const currentRegionIndex = Math.floor((safeCurrentStage - 1) / STAGES_PER_REGION);
  const [activeRegionIndex, setActiveRegionIndex] = useState(currentRegionIndex);
  const clearedSet = useMemo(
    () => new Set(clearedStages.filter((stage) => stage >= 1 && stage <= STAGE_COUNT)),
    [clearedStages],
  );

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialStage = developerMode
      ? safeCurrentStage
      : Math.min(safeCurrentStage, safeUnlockedStage);
    const frame = window.requestAnimationFrame(() => stageRefs.current[initialStage]?.focus());

    return () => {
      window.cancelAnimationFrame(frame);
      previousFocus?.focus();
    };
  }, [developerMode, safeCurrentStage, safeUnlockedStage]);

  useEffect(() => {
    const destination = pendingFocusStage.current;
    if (destination === null) return;

    const frame = window.requestAnimationFrame(() => {
      stageRefs.current[destination]?.focus();
      pendingFocusStage.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeRegionIndex]);

  function closeFromBackdrop(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget === event.target) onClose();
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [],
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleStageKeyDown(event: KeyboardEvent<HTMLButtonElement>, stageNumber: number) {
    const limit = developerMode ? STAGE_COUNT : safeUnlockedStage;
    let destination: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      destination = Math.min(limit, stageNumber + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      destination = Math.max(1, stageNumber - 1);
    } else if (event.key === "Home") {
      destination = 1;
    } else if (event.key === "End") {
      destination = limit;
    }

    if (destination === undefined) return;
    event.preventDefault();
    const destinationRegion = Math.floor((destination - 1) / STAGES_PER_REGION);
    if (destinationRegion === activeRegionIndex) {
      stageRefs.current[destination]?.focus();
    } else {
      pendingFocusStage.current = destination;
      setActiveRegionIndex(destinationRegion);
    }
  }

  function selectStage(stageNumber: number) {
    if (!developerMode && stageNumber > safeUnlockedStage) return;
    onSelectStage(stageNumber);
    onClose();
  }

  function visitRegion(regionIndex: number) {
    const regionStart = regionIndex * STAGES_PER_REGION + 1;
    const focusTarget = developerMode
      ? regionStart
      : Math.min(safeUnlockedStage, regionStart + STAGES_PER_REGION - 1);
    setActiveRegionIndex(regionIndex);
    if (focusTarget >= regionStart) {
      pendingFocusStage.current = focusTarget;
      if (regionIndex === activeRegionIndex) {
        window.requestAnimationFrame(() => {
          stageRefs.current[focusTarget]?.focus();
          pendingFocusStage.current = null;
        });
      }
    }
  }

  const activeFirstStage = activeRegionIndex * STAGES_PER_REGION + 1;
  const activeDetails = REGION_DETAILS[activeRegionIndex];
  const activeRegion = getStage(activeFirstStage).region;
  const activeRegionAsset = fieldAssetForRegion(activeRegion.hue);
  const activeRegionStages = Array.from(
    { length: STAGES_PER_REGION },
    (_, localIndex) => activeFirstStage + localIndex,
  );
  const activeUnlockedCount = developerMode
    ? STAGES_PER_REGION
    : Math.max(0, Math.min(STAGES_PER_REGION, safeUnlockedStage - activeFirstStage + 1));
  const activeClearedCount = activeRegionStages.filter((stageNumber) => clearedSet.has(stageNumber)).length;
  const activeImageStyle = {
    "--region-image": `url("${activeRegionAsset.source}")`,
    "--region-image-position": activeRegionAsset.objectPosition,
  } as RegionImageStyle;

  return (
    <div className={styles.backdrop} onPointerDown={closeFromBackdrop}>
      <div
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleDialogKeyDown}
      >
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>GUILD EXPEDITION ATLAS</span>
            <h2 id={titleId}>{title}</h2>
            <p>길을 따라 다음 토벌지를 지정하세요.</p>
          </div>
          <button className={styles.closeButton} type="button" onClick={onClose} aria-label="지도 닫기">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className={styles.legend} aria-label="지도 표시 안내">
          <span><i className={styles.legendCurrent} />현재 목표</span>
          <span><i className={styles.legendCleared} />토벌 완료</span>
          <span><i className={styles.legendAvailable} />도전 가능</span>
          <span><i className={styles.legendLocked} />잠김</span>
          <span><i className={styles.legendBoss}>♛</i>지역 보스</span>
          {developerMode && <strong>DEV · 전체 경로 임시 해금</strong>}
        </div>

        <nav className={styles.regionOverview} aria-label="원정 지역 선택">
          {REGION_DETAILS.map((_, regionIndex) => {
            const firstStage = regionIndex * STAGES_PER_REGION + 1;
            const region = getStage(firstStage).region;
            const regionAsset = fieldAssetForRegion(region.hue);
            const unlockedCount = developerMode
              ? STAGES_PER_REGION
              : Math.max(0, Math.min(STAGES_PER_REGION, safeUnlockedStage - firstStage + 1));
            const completed = Array.from({ length: STAGES_PER_REGION }, (_, index) => firstStage + index)
              .every((stageNumber) => clearedSet.has(stageNumber));
            const active = activeRegionIndex === regionIndex;
            const currentRegion = currentRegionIndex === regionIndex;
            const regionImageStyle = {
              "--region-image": `url("${regionAsset.source}")`,
              "--region-image-position": regionAsset.objectPosition,
            } as RegionImageStyle;

            return (
              <button
                key={region.name}
                type="button"
                style={regionImageStyle}
                className={classNames(
                  styles.regionJump,
                  active && styles.regionJumpActive,
                  completed && styles.regionJumpComplete,
                  unlockedCount === 0 && styles.regionJumpLocked,
                )}
                onClick={() => visitRegion(regionIndex)}
                aria-current={active ? "true" : undefined}
                aria-label={`${regionIndex + 1}지역 ${region.name}, ${unlockedCount}/10 해금${currentRegion ? ", 현재 목표 지역" : ""}${active ? ", 지도 표시 중" : ""}`}
              >
                <span className={styles.regionJumpShade} aria-hidden="true" />
                <span className={styles.regionJumpContent}>
                  <b>{String(regionIndex + 1).padStart(2, "0")}</b>
                  <span>{region.name}</span>
                  <small>{currentRegion ? "현재 원정" : unlockedCount === 0 ? "미개척" : `${unlockedCount}/10 탐사`}</small>
                  <i><em style={{ width: `${unlockedCount * 10}%` }} /></i>
                </span>
              </button>
            );
          })}
        </nav>

        <div className={styles.atlas}>
          <section
            className={classNames(styles.region, styles[`theme_${activeRegion.hue}`])}
            key={activeRegion.name}
            style={activeImageStyle}
            aria-labelledby={`region-${activeRegionIndex + 1}-${generatedId}`}
          >
            <div className={styles.regionHeading}>
              <span className={styles.regionNumber}>{String(activeRegionIndex + 1).padStart(2, "0")}</span>
              <div>
                <span>EXPEDITION AREA · REGION {activeRegionIndex + 1}</span>
                <h3 id={`region-${activeRegionIndex + 1}-${generatedId}`}>{activeRegion.name}</h3>
                <p>{activeDetails.subtitle}</p>
              </div>
              <strong>{activeUnlockedCount}<small>/ 10 해금</small></strong>
            </div>

            <div className={styles.mapCanvas}>
              <div className={styles.mapStatus} aria-hidden="true">
                <span>FIELD MAP</span>
                <strong>{activeClearedCount} / 10 토벌 완료</strong>
              </div>
              <div className={styles.compass} aria-hidden="true"><b>N</b><i /></div>
              <svg className={styles.route} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {ROUTE_POINTS.slice(1).map(([x, y], index) => {
                  const [previousX, previousY] = ROUTE_POINTS[index];
                  const targetStage = activeFirstStage + index + 1;
                  const targetState = stageState(
                    targetStage,
                    safeCurrentStage,
                    safeUnlockedStage,
                    clearedSet,
                    developerMode,
                  );
                  const traveled = developerMode || clearedSet.has(targetStage - 1);
                  return (
                    <line
                      key={targetStage}
                      x1={previousX}
                      y1={previousY}
                      x2={x}
                      y2={y}
                      className={classNames(
                        styles.routeSegment,
                        targetState !== "locked" && styles.routeSegmentOpen,
                        traveled && styles.routeSegmentTraveled,
                        developerMode && styles.routeSegmentDeveloper,
                      )}
                    />
                  );
                })}
              </svg>

              {activeRegionStages.map((stageNumber, localIndex) => {
                const stage = getStage(stageNumber);
                const state = stageState(
                  stageNumber,
                  safeCurrentStage,
                  safeUnlockedStage,
                  clearedSet,
                  developerMode,
                );
                const label = stateLabel(state, developerMode);
                const [x, y] = ROUTE_POINTS[localIndex];

                return (
                  <button
                    key={stageNumber}
                    type="button"
                    ref={(node) => { stageRefs.current[stageNumber] = node; }}
                    className={classNames(
                      styles.stageNode,
                      styles[`state_${state}`],
                      stage.boss && styles.bossNode,
                      developerMode && state !== "locked" && styles.developerNode,
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    disabled={state === "locked"}
                    aria-current={state === "current" ? "step" : undefined}
                    aria-label={`스테이지 ${stageNumber}, ${stage.name}, ${stage.boss ? "지역 보스, " : ""}${label}`}
                    title={`${stage.name} · ${label}`}
                    onClick={() => selectStage(stageNumber)}
                    onKeyDown={(event) => handleStageKeyDown(event, stageNumber)}
                  >
                    <span className={styles.nodeCore} aria-hidden="true">
                      <b>{stage.boss ? "♛" : stage.localStage}</b>
                      <i>{state === "cleared" ? "✓" : state === "locked" ? "×" : ""}</i>
                    </span>
                    <small aria-hidden="true">{stage.boss ? "BOSS" : label}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <span><kbd>←</kbd><kbd>→</kbd> 경로 이동 · <kbd>Enter</kbd> 선택 · <kbd>Esc</kbd> 닫기</span>
          <button type="button" onClick={onClose}>지도로 돌아가기</button>
        </footer>
      </div>
    </div>
  );
}
