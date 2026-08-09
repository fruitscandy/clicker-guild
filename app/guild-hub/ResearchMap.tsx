"use client";

import Image from "next/image";
import { useState } from "react";
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
  range: { summary: "플레이어 공격이 닿는 원형 범위를 넓힙니다.", impact: "밀집한 적을 한 번에 더 많이 타격하지만 공격력 자체는 대장간 무기가 결정합니다." },
  crit: { summary: "플레이어 공격이 두 배 피해를 주는 확률을 높입니다.", impact: "단계마다 5%씩 상승해 최대 25%가 되며, 수동 공격의 강한 한 방을 분명하게 살립니다." },
  shockwave: { summary: "일정 횟수의 플레이어 공격마다 넓은 충격파를 일으킵니다.", impact: "단계가 오르면 발동에 필요한 공격 횟수가 줄고 피해량이 올라 몬스터 무리를 정리하기 쉬워집니다." },
  auto: { summary: "현재 플레이어 무기로 밀집 지역을 주기적으로 자동 공격합니다.", impact: "최대 단계에서도 수동 공격보다 느리게 발동해 방치 진행을 돕되 직접 조작의 화력 우위를 유지합니다." },
  time: { summary: "원정의 전투 제한 시간을 늘립니다.", impact: "단계마다 4초씩, 최대 20초를 확보해 조금 부족한 화력을 보완합니다." },
  guild: { summary: "출전한 길드원의 일반 공격과 기술 피해를 함께 높입니다.", impact: "단계마다 18%씩 증가하지만 플레이어 무기 성장보다 완만해 보조 화력 역할을 유지합니다." },
  gold: { summary: "토벌 성공과 실패 회수로 얻는 골드를 늘립니다.", impact: "단계마다 12%씩 증가해 강화와 영입을 반복할 경제 기반을 마련합니다." },
  tavern: { summary: "여관에서 좋은 등급 길드원이 등장할 확률을 높입니다.", impact: "모든 등급은 계속 등장하며, 단계가 오를수록 B·A·S 등급 계약의 비중이 점진적으로 커집니다." },
};

const DIRECTION_GROUPS: Array<{
  key: string;
  title: string;
  subtitle: string;
  glyph: string;
  families: BranchFamily[];
}> = [
  { key: "player", title: "플레이어 공격", subtitle: "범위 · 치명타 · 광역 · 자동", glyph: "⚔", families: ["range", "crit", "shockwave", "auto"] },
  { key: "expedition", title: "토벌 지원", subtitle: "제한 시간 · 골드", glyph: "◆", families: ["time", "gold"] },
  { key: "guild", title: "길드 성장", subtitle: "길드원 · 영입", glyph: "♜", families: ["guild", "tavern"] },
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
  const [selectedNodeId, setSelectedNodeId] = useState(() => foundation?.id ?? nodes[0]?.id ?? "");
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? foundation ?? nodes[0];

  function stateForNode(node: ResearchNodeView) {
    const isPurchased = purchased.has(node.id);
    const missingPrerequisites = node.prerequisites.filter((id) => !purchased.has(id));
    const prerequisitesMet = missingPrerequisites.length === 0;
    const requiredHallLevel = requiredHallLevelForNode(node.id);
    const hallLocked = requiredHallLevel > hallLevel;
    return { isPurchased, missingPrerequisites, prerequisitesMet, requiredHallLevel, hallLocked };
  }

  function renderNode(node: ResearchNodeView, standalone = false) {
    const { isPurchased, prerequisitesMet, requiredHallLevel, hallLocked } = stateForNode(node);
    const available = !readOnly && !isPurchased && prerequisitesMet && !hallLocked;
    const isSelected = node.id === selectedNode?.id;
    const icon = upgradeIconForNode(node.id);
    const status = isPurchased
      ? "연구 완료"
      : readOnly
        ? "DEV 시험대에서 조정"
        : hallLocked
        ? `본관 Lv.${requiredHallLevel} 필요`
        : prerequisitesMet
          ? `${formatCost(node.cost)} G · 상세보기`
          : "선행 연구 필요";

    return (
      <div key={node.id} className={`${styles.nodeWrap} ${standalone ? styles.standalone : ""}`} role={standalone ? undefined : "listitem"}>
        <button
          type="button"
          data-node-id={node.id}
          className={`${styles.node} ${isPurchased ? styles.purchased : ""} ${available ? styles.available : ""} ${hallLocked ? styles.locked : ""} ${isSelected ? styles.selected : ""} ${node.id === "foundation" ? styles.foundation : ""} ${node.id === "citadel" ? styles.citadel : ""}`}
          onClick={() => setSelectedNodeId(node.id)}
          aria-label={`${node.title} 상세보기: ${node.description}. ${status}. 선택만으로는 구매되지 않습니다.`}
          aria-pressed={isSelected}
          aria-controls="research-node-detail"
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
    <div className={styles.viewport} aria-label="여덟 가지 핵심 계통으로 정리된 길드 강화 지도">
      <div className={styles.map}>
        {foundation && (
          <div className={styles.coreSection}>
            <span className={styles.coreLabel}>RESEARCH CORE</span>
            {renderNode(foundation, true)}
            <p>전투와 경제에 직접 쓰이는 여덟 계통만 골라 순서대로 강화하세요.</p>
          </div>
        )}

        {selectedNode && (() => {
          const family = familyForNode(selectedNode.id);
          const detail = BRANCH_DETAILS[family];
          const { isPurchased, missingPrerequisites, prerequisitesMet, requiredHallLevel, hallLocked } = stateForNode(selectedNode);
          const missingTitles = missingPrerequisites.map((id) => nodes.find((node) => node.id === id)?.title ?? id);
          const icon = upgradeIconForNode(selectedNode.id);
          const canPurchase = !readOnly && !isPurchased && prerequisitesMet && !hallLocked;
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
            <aside id="research-node-detail" className={styles.detailPanel} aria-live="polite" aria-label={`${selectedNode.title} 연구 상세 정보`}>
              <div className={styles.detailIdentity}>
                <span className={`${styles.detailIcon} ${icon ? styles.detailIconArt : ""}`} aria-hidden="true">
                  {icon ? <Image src={icon} alt="" width={72} height={72} /> : selectedNode.glyph}
                </span>
                <span>
                  <small>{detail ? BRANCH_LABELS[family] : "핵심 연구"}{nodeDepth(selectedNode.id) ? ` · 단계 ${nodeDepth(selectedNode.id)}` : ""}</small>
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
                <div><dt>연구 비용</dt><dd>{selectedNode.cost ? `${formatCost(selectedNode.cost)} G` : "무료"}</dd></div>
                <div><dt>해금 조건</dt><dd>{hallLocked ? `길드 본관 Lv.${requiredHallLevel}` : missingTitles.length ? missingTitles.join(", ") : "충족"}</dd></div>
              </dl>

              <div className={styles.detailAction}>
                <p><strong>안전한 확인</strong><span>노드를 누르면 설명만 바뀝니다. 아래 버튼을 눌러야 실제로 구매됩니다.</span></p>
                <button type="button" onClick={() => canPurchase && onPurchase(selectedNode)} disabled={!canPurchase}>{actionLabel}</button>
              </div>
            </aside>
          );
        })()}

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
