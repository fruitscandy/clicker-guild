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
};

type Point = { x: number; y: number };

const BRANCH_LAYOUT: Record<string, { direction: "north" | "east" | "south" | "west"; lane: number }> = {
  range: { direction: "north", lane: 35 },
  crit: { direction: "north", lane: 50 },
  shockwave: { direction: "north", lane: 65 },
  combo: { direction: "east", lane: 35 },
  execute: { direction: "east", lane: 50 },
  momentum: { direction: "east", lane: 65 },
  time: { direction: "south", lane: 35 },
  scout: { direction: "south", lane: 50 },
  loot: { direction: "south", lane: 65 },
  guild: { direction: "west", lane: 35 },
  gold: { direction: "west", lane: 50 },
  tavern: { direction: "west", lane: 65 },
};

function nodePoint(nodeId: string): Point {
  if (nodeId === "foundation") return { x: 50, y: 50 };
  if (nodeId === "citadel") return { x: 86, y: 93 };

  const [family, rawDepth] = nodeId.split("-");
  const depth = Math.max(1, Number(rawDepth) || 1);
  const layout = BRANCH_LAYOUT[family] ?? { direction: "east", lane: 50 };

  switch (layout.direction) {
    case "north": return { x: layout.lane, y: 47 - depth * 5.8 };
    case "east": return { x: 52 + depth * 8.2, y: layout.lane };
    case "south": return { x: layout.lane, y: 52 + depth * 8.2 };
    case "west": return { x: 48 - depth * 7.8, y: layout.lane };
  }
}

export function ResearchMap({ nodes, purchasedIds, hallLevel, formatCost, onPurchase }: ResearchMapProps) {
  const purchased = new Set(purchasedIds);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className={styles.viewport}>
      <div className={styles.map} aria-label="중앙에서 네 방향으로 확장되는 길드 발전 지도">
        <span className={`${styles.direction} ${styles.north}`}><b>직접 공격</b><small>범위 · 치명타 · 충격파</small></span>
        <span className={`${styles.direction} ${styles.east}`}><b>전투 리듬</b><small>연격 · 처형 · 몰입</small></span>
        <span className={`${styles.direction} ${styles.south}`}><b>원정 지원</b><small>보급 · 정찰 · 전리품</small></span>
        <span className={`${styles.direction} ${styles.west}`}><b>길드 경영</b><small>길드원 · 골드 · 여관</small></span>

        <svg className={styles.connectors} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {nodes.flatMap((node) => node.id === "citadel" ? [] : node.prerequisites.map((parentId) => {
            const parent = nodeById.get(parentId);
            if (!parent) return null;
            const start = nodePoint(parent.id);
            const end = nodePoint(node.id);
            const parentPurchased = purchased.has(parent.id);
            const nodePurchased = purchased.has(node.id);
            const hallLocked = requiredHallLevelForNode(node.id) > hallLevel;
            return (
              <line
                key={`${parentId}-${node.id}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                className={`${styles.connector} ${parentPurchased ? styles.reachable : ""} ${nodePurchased ? styles.completed : ""} ${hallLocked ? styles.hallLocked : ""}`}
              />
            );
          }))}
        </svg>

        {nodes.map((node) => {
          const point = nodePoint(node.id);
          const isPurchased = purchased.has(node.id);
          const prerequisitesMet = node.prerequisites.every((id) => purchased.has(id));
          const requiredHallLevel = requiredHallLevelForNode(node.id);
          const hallLocked = requiredHallLevel > hallLevel;
          const available = !isPurchased && prerequisitesMet && !hallLocked;
          const isFoundation = node.id === "foundation";
          const isCitadel = node.id === "citadel";
          const icon = upgradeIconForNode(node.id);
          const status = isPurchased
            ? "연구 완료"
            : hallLocked
              ? `본관 Lv.${requiredHallLevel} 필요`
              : prerequisitesMet
                ? `${formatCost(node.cost)} G`
                : "선행 연구 필요";

          return (
            <button
              key={node.id}
              className={`${styles.node} ${isPurchased ? styles.purchased : ""} ${available ? styles.available : ""} ${hallLocked ? styles.locked : ""} ${isFoundation ? styles.foundation : ""} ${isCitadel ? styles.citadel : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onPurchase(node)}
              disabled={isPurchased || !prerequisitesMet || hallLocked}
              aria-label={`${node.title}: ${node.description}. ${status}`}
            >
              <span className={`${styles.glyph} ${icon && !hallLocked ? styles.glyphArt : ""}`}>
                {hallLocked ? "🔒" : icon ? <Image src={icon} alt="" width={54} height={54} aria-hidden="true" /> : node.glyph}
              </span>
              <strong>{node.title}</strong>
              <span className={styles.effect}>{node.description}</span>
              <small>{status}</small>
            </button>
          );
        })}

        <div className={styles.centerPulse} aria-hidden="true"><i /><i /></div>
      </div>
    </div>
  );
}
