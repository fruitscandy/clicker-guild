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

const BRANCH_DETAILS: Record<BranchFamily, { summary: string; impact: string }> = {
  range: { summary: "직접 공격이 닿는 원형 범위를 넓힙니다.", impact: "한 번의 클릭으로 더 멀리 떨어진 몬스터까지 함께 맞힐 수 있어 밀집한 적을 정리하기 쉬워집니다." },
  crit: { summary: "직접 공격이 두 배 피해를 주는 확률을 높입니다.", impact: "치명타가 발동하면 일반 피해보다 큰 숫자와 충격 연출이 나타나 강한 한 방을 쉽게 알아볼 수 있습니다." },
  shockwave: { summary: "일정 횟수의 직접 공격마다 전장 전체에 광역 파동을 일으킵니다.", impact: "단계가 오르면 파동이 더 자주 발동하고 피해량도 증가해 다수의 적을 동시에 압박합니다." },
  combo: { summary: "다섯 번째 직접 공격을 연격으로 강화합니다.", impact: "발동 시 시간차를 둔 추가 참격이 이어지며, 단계가 오를수록 연격의 추가 피해가 강해집니다." },
  execute: { summary: "체력이 얼마 남지 않은 적을 즉시 처형합니다.", impact: "강한 적의 마지막 체력을 건너뛰어 전투 마무리를 앞당기며, 처형 대상에는 전용 마무리 연출이 표시됩니다." },
  momentum: { summary: "빠르게 연속 클릭할수록 직접 공격 피해가 누적 증가합니다.", impact: "공격을 쉬면 중첩이 사라지므로 짧은 시간에 리듬 있게 공격할 때 가장 큰 효과를 냅니다." },
  time: { summary: "원정에서 사용할 수 있는 전투 제한 시간을 늘립니다.", impact: "화력이 조금 부족한 구역에서도 길드원이 공격할 시간을 더 확보해 토벌 성공 가능성을 높입니다." },
  scout: { summary: "전장에 남은 적에 대한 정찰 보고를 더 정확하게 만듭니다.", impact: "전투 진행 상황을 더 구체적으로 파악해 남은 시간과 공격 위치를 판단하기 쉬워집니다." },
  loot: { summary: "토벌 완료 시 길드원 장비를 획득할 확률을 높입니다.", impact: "반복 원정에서 장비 성장 기회를 늘려 길드원의 장기 전투력을 강화합니다." },
  guild: { summary: "출전한 길드원의 일반 공격과 기술 피해를 함께 높입니다.", impact: "플레이어가 직접 클릭하지 않는 동안에도 파티 전체의 자동 전투 화력이 꾸준히 증가합니다." },
  gold: { summary: "토벌 성공으로 획득하는 골드 보상을 늘립니다.", impact: "연구, 무기 제작, 길드원 고용에 사용할 성장 자금을 더 빠르게 모을 수 있습니다." },
  tavern: { summary: "여관에서 만날 수 있는 길드원의 최대 등급을 높입니다.", impact: "더 높은 등급의 신규 길드원을 고용 후보로 발견해 파티 조합의 선택지를 넓힙니다." },
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
    <div className={styles.viewport} aria-label="네 방향 계통으로 정리된 길드 발전 지도">
      <div className={styles.map}>
        {foundation && (
          <div className={styles.coreSection}>
            <span className={styles.coreLabel}>RESEARCH CORE</span>
            {renderNode(foundation, true)}
            <p>중앙 기반에서 원하는 계통을 골라 순서대로 연구하세요.</p>
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
