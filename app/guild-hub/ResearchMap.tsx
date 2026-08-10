"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { upgradeIconForNode } from "../upgrade-icons";
import { requiredHallLevelForNode } from "./guild-progression";
import styles from "./ResearchMap.module.css";

export type ResearchNodeView = {
  id: string;
  title: string;
  description: string;
  glyph: string;
  cost: number;
  prerequisites: string[];
};

type ResearchMapProps = {
  nodes: ResearchNodeView[];
  purchasedIds: string[];
  hallLevel: number;
  formatCost: (cost: number) => string;
  onPurchase: (node: ResearchNodeView) => void;
  readOnly?: boolean;
};

type BranchFamily = "range" | "crit" | "shockwave" | "auto" | "time" | "guild" | "gold" | "tavern";
type BranchDirection = "north" | "east" | "south" | "west";

const BRANCH_LABELS: Record<BranchFamily, string> = {
  range: "공격 범위",
  crit: "치명타 확률",
  shockwave: "횟수 광역 공격",
  auto: "자동 공격",
  time: "전투 제한 시간",
  guild: "길드원 공격력",
  gold: "토벌 골드",
  tavern: "영입 행운",
};

const BRANCH_DETAILS: Record<BranchFamily, { summary: string; impact: string }> = {
  range: { summary: "두 단계에 걸쳐 플레이어 공격 반경을 단계마다 6씩 넓힙니다.", impact: "2단계 완료 시 반경이 총 12 늘어나지만 공격력 자체는 대장간 무기가 결정합니다." },
  crit: { summary: "치명타 확률을 1단계 15%, 2단계 누적 30%까지 높입니다.", impact: "평균 화력을 보조하지만 치명타 없이도 모든 전투를 끝낼 수 있도록 설계했습니다." },
  shockwave: { summary: "6번째 플레이어 공격마다 165% 광역 충격파를 일으킵니다.", impact: "몬스터 무리 정리를 단축하는 선택 보너스이며 필수 공격 수단은 아닙니다." },
  auto: { summary: "현재 플레이어 무기로 4.5초마다 한 번 자동 공격합니다.", impact: "수동 공격보다 훨씬 느려 직접 조작의 화력 우위를 유지하면서 잠깐의 여유만 제공합니다." },
  time: { summary: "모든 원정의 전투 제한 시간을 8초 늘립니다.", impact: "기본 제한 시간 안에도 클리어할 수 있고, 이 연구는 실수를 만회할 여유를 줍니다." },
  guild: { summary: "출전한 길드원의 일반 공격과 기술 피해를 35% 높입니다.", impact: "길드원은 보조 화력이며 플레이어 무기 성장 없이 전투를 대체하지 않습니다." },
  gold: { summary: "토벌 성공과 실패 회수 골드를 20% 늘립니다.", impact: "클리어 가능 여부가 아니라 다음 무기·영입 선택을 조금 앞당기는 경제 보너스입니다." },
  tavern: { summary: "여관의 B·A·S 등급 합산 확률을 4%에서 8%로 높입니다.", impact: "낮은 등급도 계속 등장하며 전투 클리어에 특정 등급 길드원을 요구하지 않습니다." },
};

const DIRECTION_BRANCHES: Array<{
  direction: BranchDirection;
  title: string;
  subtitle: string;
  glyph: string;
  families: [BranchFamily, BranchFamily];
}> = [
  { direction: "north", title: "정밀 타격", subtitle: "위쪽 가지", glyph: "↑", families: ["range", "crit"] },
  { direction: "east", title: "토벌 지원", subtitle: "오른쪽 가지", glyph: "→", families: ["time", "gold"] },
  { direction: "south", title: "길드 성장", subtitle: "아래쪽 가지", glyph: "↓", families: ["guild", "tavern"] },
  { direction: "west", title: "전투 자동화", subtitle: "왼쪽 가지", glyph: "←", families: ["shockwave", "auto"] },
];

function familyForNode(nodeId: string) {
  return nodeId.split("-")[0] as BranchFamily;
}

function nodeDepth(nodeId: string) {
  return Number(nodeId.split("-")[1]) || 0;
}

const subscribeToClient = () => () => {};

export function ResearchMap({ nodes, purchasedIds, hallLevel, formatCost, onPurchase, readOnly = false }: ResearchMapProps) {
  const purchased = new Set(purchasedIds);
  const foundation = nodes.find((node) => node.id === "foundation");
  const citadel = nodes.find((node) => node.id === "citadel");
  const crossViewportRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const modalRoot = isClient ? document.body : null;
  const selectedCandidate = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) : undefined;
  const selectedFamily = selectedCandidate ? familyForNode(selectedCandidate.id) : undefined;
  const selectedFamilyNodes = selectedFamily && BRANCH_DETAILS[selectedFamily]
    ? nodes
        .filter((node) => familyForNode(node.id) === selectedFamily)
        .sort((a, b) => nodeDepth(a.id) - nodeDepth(b.id))
    : [];
  const selectedNode = selectedFamilyNodes.length
    ? selectedFamilyNodes.find((node) => !purchased.has(node.id)) ?? selectedFamilyNodes.at(-1)
    : selectedCandidate;
  const coreNodes = nodes.filter((node) => node.id !== "foundation" && node.id !== "citadel" && !node.id.startsWith("special-"));
  const completedCoreNodes = coreNodes.filter((node) => purchased.has(node.id)).length;

  const centerResearchMap = useCallback(() => {
    const viewport = crossViewportRef.current;
    if (!viewport) return;
    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
  }, []);

  useEffect(() => {
    const viewport = crossViewportRef.current;
    if (!viewport) return;
    const frame = window.requestAnimationFrame(centerResearchMap);
    const observer = new ResizeObserver(centerResearchMap);
    observer.observe(viewport);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [centerResearchMap]);

  useEffect(() => {
    if (!selectedNode) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedNodeId(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedNode]);

  function stateForNode(node: ResearchNodeView) {
    const isPurchased = purchased.has(node.id);
    const missingPrerequisites = node.prerequisites.filter((id) => !purchased.has(id));
    const prerequisitesMet = missingPrerequisites.length === 0;
    const requiredHallLevel = requiredHallLevelForNode(node.id);
    const hallLocked = requiredHallLevel > hallLevel;
    return { isPurchased, missingPrerequisites, prerequisitesMet, requiredHallLevel, hallLocked };
  }

  function renderNode(
    node: ResearchNodeView,
    variant: "branch" | "core" | "citadel" = "branch",
    progress?: { completed: number; total: number },
  ) {
    const { isPurchased, prerequisitesMet, requiredHallLevel, hallLocked } = stateForNode(node);
    const familyComplete = progress ? progress.completed >= progress.total : isPurchased;
    const available = !readOnly && !familyComplete && prerequisitesMet && !hallLocked;
    const isSelected = node.id === selectedNode?.id;
    const icon = upgradeIconForNode(node.id);
    const depth = nodeDepth(node.id);
    const singleUnlock = variant === "branch" && (progress?.total ?? nodes.filter((candidate) => familyForNode(candidate.id) === familyForNode(node.id)).length) === 1;
    const status = familyComplete
      ? "연구 완료"
      : readOnly
        ? "DEV 시험대에서 조정"
        : hallLocked
          ? `본관 Lv.${requiredHallLevel} 필요`
          : prerequisitesMet
            ? `${formatCost(node.cost)} G · 상세보기`
            : "선행 연구 필요";

    return (
      <div
        key={node.id}
        className={`${styles.nodeWrap} ${styles[variant]} ${familyComplete ? styles.pathComplete : ""}`}
        role={variant === "branch" ? "listitem" : undefined}
      >
        <button
          type="button"
          data-node-id={node.id}
          data-upgrade-progress={progress ? `${progress.completed}/${progress.total}` : undefined}
          className={`${styles.node} ${familyComplete ? styles.purchased : ""} ${available ? styles.available : ""} ${hallLocked ? styles.locked : ""} ${isSelected ? styles.selected : ""}`}
          onClick={() => setSelectedNodeId(node.id)}
          aria-label={`${node.title} 상세보기: ${node.description}. ${progress ? `${progress.completed}/${progress.total} 단계. ` : ""}${status}. 선택만으로는 구매되지 않습니다.`}
          aria-pressed={isSelected}
          aria-expanded={isSelected}
          aria-controls="research-node-detail"
          aria-haspopup="dialog"
          title={`${node.title} · ${status}`}
        >
          {progress && !singleUnlock
            ? <span className={styles.levelProgress}>{progress.completed}/{progress.total}</span>
            : depth > 0 && !singleUnlock && <span className={styles.depth}>{depth}</span>}
          <span className={`${styles.glyph} ${icon && !hallLocked ? styles.glyphArt : ""}`} aria-hidden="true">
            {hallLocked ? "◆" : icon ? <Image src={icon} alt="" width={64} height={64} unoptimized /> : node.glyph}
          </span>
          <span className={styles.nodeName}>{variant === "branch" ? BRANCH_LABELS[familyForNode(node.id)] : node.title}</span>
          <span className={styles.nodeCost}>{familyComplete ? "완료" : hallLocked ? `본관 ${requiredHallLevel}` : node.cost ? `${formatCost(node.cost)} G` : "기반"}</span>
          <span className={styles.statusMark} aria-hidden="true">
            {familyComplete ? "✓" : hallLocked || !prerequisitesMet ? "◆" : "+"}
          </span>
        </button>
      </div>
    );
  }

  const selectedDetail = selectedNode ? (() => {
    const family = familyForNode(selectedNode.id);
    const detail = BRANCH_DETAILS[family];
    const { isPurchased, missingPrerequisites, prerequisitesMet, requiredHallLevel, hallLocked } = stateForNode(selectedNode);
    const missingTitles = missingPrerequisites.map((id) => nodes.find((node) => node.id === id)?.title ?? id);
    const icon = upgradeIconForNode(selectedNode.id);
    const canPurchase = !readOnly && !isPurchased && prerequisitesMet && !hallLocked;
    const familyNodes = detail ? nodes.filter((node) => familyForNode(node.id) === family) : [];
    const completedCount = familyNodes.filter((node) => purchased.has(node.id)).length;
    const singleUnlock = familyNodes.length === 1;
    const actionLabel = isPurchased
      ? "연구 완료"
      : readOnly
        ? "DEV 시험대에서 단계 조정"
        : hallLocked
          ? `본관 Lv.${requiredHallLevel} 필요`
          : !prerequisitesMet
            ? "선행 연구 완료 필요"
            : `${formatCost(selectedNode.cost)} G로 연구하기`;

    return (
      <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && setSelectedNodeId(null)}>
      <aside id="research-node-detail" className={styles.detailPanel} role="dialog" aria-modal="true" aria-live="polite" aria-label={`${selectedNode.title} 연구 상세 정보`}>
        <button type="button" autoFocus className={styles.detailClose} onClick={() => setSelectedNodeId(null)} aria-label="연구 설명 닫기">×</button>
        <div className={styles.detailIdentity}>
          <span className={`${styles.detailIcon} ${icon ? styles.detailIconArt : ""}`} aria-hidden="true">
            {icon ? <Image src={icon} alt="" width={64} height={64} unoptimized /> : selectedNode.glyph}
          </span>
          <span>
            <small>{detail ? BRANCH_LABELS[family] : "핵심 연구"}{nodeDepth(selectedNode.id) && !singleUnlock ? ` · 단계 ${nodeDepth(selectedNode.id)}` : ""}</small>
            <strong>{selectedNode.title}</strong>
            <em>{isPurchased ? "현재 적용 중" : hallLocked || !prerequisitesMet ? "잠금 상태" : "연구 가능"}</em>
          </span>
        </div>

        <div className={styles.detailCopy}>
          <p>{detail?.summary ?? selectedNode.description}</p>
          {detail && <span>{detail.impact}</span>}
        </div>

        <dl className={styles.detailFacts}>
          <div><dt>{isPurchased ? "적용 효과" : "선택 단계 효과"}</dt><dd>{selectedNode.description}</dd></div>
          <div><dt>연구 상태</dt><dd>{detail && singleUnlock ? isPurchased ? "해금 완료" : "미해금" : detail ? `${completedCount} / ${familyNodes.length} 완료` : isPurchased ? "완료" : "미완료"}</dd></div>
          <div><dt>연구 비용</dt><dd>{selectedNode.cost ? `${formatCost(selectedNode.cost)} G` : "무료"}</dd></div>
          <div><dt>해금 조건</dt><dd>{hallLocked ? `길드 본관 Lv.${requiredHallLevel}` : missingTitles.length ? missingTitles.join(", ") : "충족"}</dd></div>
        </dl>

        <div className={styles.detailAction}>
          <p><strong>구매 전 효과를 확인하세요.</strong><span>이 버튼을 눌러야 골드를 사용하고 연구합니다.</span></p>
          <button type="button" onClick={() => canPurchase && onPurchase(selectedNode)} disabled={!canPurchase}>{actionLabel}</button>
        </div>
      </aside>
      </div>
    );
  })() : null;

  return (
    <div className={styles.viewport} aria-label="핵심 강화와 독립 특수 공격이 함께 있는 길드 강화판">
      <div className={styles.mapHeader}>
        <span className={styles.mapSeal} aria-hidden="true"><i>G</i></span>
        <span className={styles.mapHeaderCopy}>
          <b>GUILD UPGRADES</b>
          <strong>길드 강화</strong>
          <small>노드를 눌러 효과를 확인하고 팝업에서 연구하세요.</small>
        </span>
        <span className={styles.mapProgress}><b>{completedCoreNodes}</b><small>/ {coreNodes.length} 핵심 완료</small></span>
      </div>

      <div className={styles.crossViewport} ref={crossViewportRef}>
        <div className={styles.crossCanvas}>
          <span className={styles.boardEmblem} aria-hidden="true">GUILD<br />ORDERS</span>
          <span className={`${styles.axis} ${styles.axisNorth}`} aria-hidden="true" />
          <span className={`${styles.axis} ${styles.axisEast}`} aria-hidden="true" />
          <span className={`${styles.axis} ${styles.axisSouth}`} aria-hidden="true" />
          <span className={`${styles.axis} ${styles.axisWest}`} aria-hidden="true" />

          {DIRECTION_BRANCHES.map((branch) => {
            const groupNodes = nodes.filter((node) => branch.families.includes(familyForNode(node.id)));
            const completedCount = groupNodes.filter((node) => purchased.has(node.id)).length;

            return (
              <section
                className={`${styles.branch} ${styles[branch.direction]}`}
                data-direction={branch.direction}
                key={branch.direction}
                aria-labelledby={`research-${branch.direction}`}
              >
                <header className={styles.branchHeader}>
                  <span aria-hidden="true">{branch.glyph}</span>
                  <strong id={`research-${branch.direction}`}>{branch.title}</strong>
                  <em>{completedCount}/{groupNodes.length}</em>
                </header>

                <div className={styles.familyStack}>
                  {branch.families.map((family) => {
                    const familyNodes = nodes
                      .filter((node) => familyForNode(node.id) === family)
                      .sort((a, b) => nodeDepth(a.id) - nodeDepth(b.id));
                    const familyCompleted = familyNodes.filter((node) => purchased.has(node.id)).length;

                    return (
                      <section className={styles.familyLane} key={family} aria-labelledby={`research-lane-${family}`}>
                        <div className={styles.familyLabel}>
                          <strong id={`research-lane-${family}`}>{BRANCH_LABELS[family]}</strong>
                          <span>{familyCompleted}/{familyNodes.length}</span>
                        </div>
                        <div className={styles.familyTrack} role="list" aria-label={`${BRANCH_LABELS[family]} 연구 단계`}>
                          {familyNodes.length > 0 && renderNode(
                            familyNodes.find((node) => !purchased.has(node.id)) ?? familyNodes[familyNodes.length - 1],
                            "branch",
                            { completed: familyCompleted, total: familyNodes.length },
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {foundation && (
            <div className={styles.coreDock}>
              <span className={styles.coreHalo} aria-hidden="true" />
              {renderNode(foundation, "core")}
            </div>
          )}

          <div id="guild-special-node-slot" className={styles.specialNodeSlot} />

          {citadel && (
            <div className={styles.citadelDock}>
              <small>최종</small>
              {renderNode(citadel, "citadel")}
            </div>
          )}
        </div>
      </div>

      {modalRoot && selectedDetail ? createPortal(selectedDetail, modalRoot) : null}
    </div>
  );
}
