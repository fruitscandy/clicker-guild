"use client";

import Image from "next/image";
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

type BranchFamily = "range" | "crit" | "shockwave" | "combo" | "execute" | "momentum" | "time" | "scout" | "loot" | "guild" | "gold" | "tavern";

const BRANCH_LABELS: Record<BranchFamily, string> = {
  range: "참격 범위",
  crit: "치명타",
  shockwave: "충격파",
  combo: "연격 리듬",
  execute: "처형술",
  momentum: "전투 몰입",
  time: "원정 보급",
  scout: "전장 정찰",
  loot: "전리품 감정",
  guild: "길드 전술",
  gold: "행운의 금고",
  tavern: "여관 증축",
};

const DIRECTION_GROUPS: Array<{
  key: string;
  title: string;
  subtitle: string;
  glyph: string;
  families: BranchFamily[];
}> = [
  { key: "offense", title: "길드 공세", subtitle: "플레이어 직접 공격", glyph: "⚔", families: ["range", "crit", "shockwave"] },
  { key: "tactics", title: "연계 전술", subtitle: "클릭 전투 리듬", glyph: "✦", families: ["combo", "execute", "momentum"] },
  { key: "support", title: "원정 지원", subtitle: "시간 · 정찰 · 전리품", glyph: "◆", families: ["time", "scout", "loot"] },
  { key: "management", title: "길드 경영", subtitle: "길드원 · 골드 · 여관", glyph: "♜", families: ["guild", "gold", "tavern"] },
];

function familyForNode(nodeId: string) {
  return nodeId.split("-")[0] as BranchFamily;
}

function nodeDepth(nodeId: string) {
  return Number(nodeId.split("-")[1]) || 0;
}

export function ResearchMap({ nodes, purchasedIds, hallLevel, formatCost, onPurchase, readOnly = false }: ResearchMapProps) {
  const purchased = new Set(purchasedIds);
  const foundation = nodes.find((node) => node.id === "foundation");
  const citadel = nodes.find((node) => node.id === "citadel");

  function renderNode(node: ResearchNodeView, standalone = false) {
    const isPurchased = purchased.has(node.id);
    const prerequisitesMet = node.prerequisites.every((id) => purchased.has(id));
    const requiredHallLevel = requiredHallLevelForNode(node.id);
    const hallLocked = requiredHallLevel > hallLevel;
    const available = !readOnly && !isPurchased && prerequisitesMet && !hallLocked;
    const icon = upgradeIconForNode(node.id);
    const status = isPurchased
      ? "연구 완료"
      : readOnly
        ? "DEV 시험대에서 조정"
        : hallLocked
        ? `본관 Lv.${requiredHallLevel} 필요`
        : prerequisitesMet
          ? `${formatCost(node.cost)} G`
          : "선행 연구 필요";

    return (
      <div key={node.id} className={`${styles.nodeWrap} ${standalone ? styles.standalone : ""}`} role={standalone ? undefined : "listitem"}>
        <button
          type="button"
          data-node-id={node.id}
          className={`${styles.node} ${isPurchased ? styles.purchased : ""} ${available ? styles.available : ""} ${hallLocked ? styles.locked : ""} ${node.id === "foundation" ? styles.foundation : ""} ${node.id === "citadel" ? styles.citadel : ""}`}
          onClick={() => onPurchase(node)}
          disabled={readOnly || isPurchased || !prerequisitesMet || hallLocked}
          aria-label={`${node.title}: ${node.description}. ${status}`}
        >
          {nodeDepth(node.id) > 0 && <span className={styles.depth}>단계 {nodeDepth(node.id)}</span>}
          <span className={`${styles.glyph} ${icon && !hallLocked ? styles.glyphArt : ""}`}>
            {hallLocked ? "🔒" : icon ? <Image src={icon} alt="" width={54} height={54} aria-hidden="true" /> : node.glyph}
          </span>
          <span className={styles.nodeCopy}>
            <strong>{node.title}</strong>
            <span className={styles.effect}>{node.description}</span>
            <small>{status}</small>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.viewport} aria-label="네 방향 계통으로 정리된 길드 발전 지도">
      <div className={styles.map}>
        {foundation && (
          <div className={styles.coreSection}>
            <span className={styles.coreLabel}>RESEARCH CORE</span>
            {renderNode(foundation, true)}
            <p>중앙 기반에서 원하는 계통을 골라 순서대로 연구하세요.</p>
          </div>
        )}

        <div className={styles.directionGrid}>
          {DIRECTION_GROUPS.map((group) => {
            const groupNodes = nodes.filter((node) => group.families.includes(familyForNode(node.id)));
            const completedCount = groupNodes.filter((node) => purchased.has(node.id)).length;

            return (
              <section className={styles.directionPanel} key={group.key} aria-labelledby={`research-${group.key}`}>
                <header className={styles.directionHeading}>
                  <span className={styles.directionGlyph} aria-hidden="true">{group.glyph}</span>
                  <span>
                    <small>{group.subtitle}</small>
                    <strong id={`research-${group.key}`}>{group.title}</strong>
                  </span>
                  <em>{completedCount}/{groupNodes.length}</em>
                </header>

                <div className={styles.laneList}>
                  {group.families.map((family) => {
                    const familyNodes = nodes.filter((node) => familyForNode(node.id) === family).sort((a, b) => nodeDepth(a.id) - nodeDepth(b.id));
                    const familyCompleted = familyNodes.filter((node) => purchased.has(node.id)).length;

                    return (
                      <section className={styles.lane} key={family} aria-labelledby={`research-lane-${family}`}>
                        <div className={styles.laneHeading}>
                          <strong id={`research-lane-${family}`}>{BRANCH_LABELS[family]}</strong>
                          <span>{familyCompleted}/{familyNodes.length} 완료</span>
                        </div>
                        <div className={styles.laneTrack} role="list" aria-label={`${BRANCH_LABELS[family]} 연구 단계`}>
                          {familyNodes.map((node) => renderNode(node))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {citadel && (
          <div className={styles.citadelSection}>
            <span>FINAL RESEARCH</span>
            {renderNode(citadel, true)}
          </div>
        )}
      </div>
    </div>
  );
}
