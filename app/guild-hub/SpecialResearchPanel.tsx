"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  SPECIAL_ATTACK_ORDER,
  SPECIAL_ATTACKS,
  SPECIAL_RESEARCH_NODES,
  type SpecialAttackKind,
  type SpecialResearchNode,
} from "../special-attacks";
import styles from "./SpecialResearchPanel.module.css";

type SpecialResearchPanelProps = {
  purchasedIds: string[];
  hallLevel: number;
  gold: number;
  formatCost: (cost: number) => string;
  onPurchase: (node: SpecialResearchNode) => void;
  developerMode?: boolean;
};

function SpellPreview({ kind }: { kind: SpecialAttackKind }) {
  return (
    <span className={`${styles.spellPreview} ${styles[kind]}`} aria-hidden="true">
      <i className={styles.previewField} />
      <i className={styles.previewCore} />
      <i className={styles.previewRing} />
      <i className={styles.previewRingSecondary} />
      <i className={styles.previewTrail} />
      <span className={styles.previewParticles}>
        {Array.from({ length: 8 }, (_, index) => (
          <i
            key={index}
            style={{
              "--particle-angle": `${index * 45}deg`,
              "--particle-distance": `${32 + index * 1.4}px`,
              "--particle-index": index,
            } as CSSProperties}
          />
        ))}
      </span>
    </span>
  );
}

const subscribeToClient = () => () => {};

export function SpecialResearchPanel({
  purchasedIds,
  hallLevel,
  gold,
  formatCost,
  onPurchase,
  developerMode = false,
}: SpecialResearchPanelProps) {
  const purchased = new Set(purchasedIds);
  const [selectedKind, setSelectedKind] = useState<SpecialAttackKind | null>(null);
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const boardSlot = isClient ? document.getElementById("guild-special-node-slot") : null;
  const modalRoot = isClient ? document.body : null;
  const selectedAttack = selectedKind ? SPECIAL_ATTACKS[selectedKind] : null;
  const selectedNode = selectedAttack
    ? SPECIAL_RESEARCH_NODES.find((candidate) => candidate.id === selectedAttack.nodeId) ?? null
    : null;

  useEffect(() => {
    if (!selectedKind) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedKind(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedKind]);

  function stateFor(kind: SpecialAttackKind) {
    const attack = SPECIAL_ATTACKS[kind];
    const node = SPECIAL_RESEARCH_NODES.find((candidate) => candidate.id === attack.nodeId)!;
    const isPurchased = purchased.has(node.id);
    const hallLocked = hallLevel < attack.hallLevel;
    const prerequisitesMet = node.prerequisites.every((id) => purchased.has(id));
    const affordable = gold >= node.cost;
    const available = !developerMode && !isPurchased && !hallLocked && prerequisitesMet && affordable;
    const status = isPurchased
      ? "자동 발동 활성화"
      : developerMode
        ? "DEV 시험대에서는 전체 활성"
        : hallLocked
          ? `길드 본관 Lv.${attack.hallLevel} 필요`
          : !prerequisitesMet
            ? "길드의 기반 연구 필요"
            : affordable
              ? `${formatCost(node.cost)} G로 연구 가능`
              : `${formatCost(node.cost - gold)} G 부족`;
    const shortStatus = isPurchased
      ? "완료"
      : hallLocked
        ? `본관 ${attack.hallLevel}`
        : !prerequisitesMet
          ? "기반 필요"
          : `${formatCost(node.cost)} G`;
    return { attack, node, isPurchased, hallLocked, prerequisitesMet, affordable, available, status, shortStatus };
  }

  const selectedState = selectedKind ? stateFor(selectedKind) : null;

  const nodeLayer = (
    <div className={styles.nodeLayer} role="group" aria-label="연결선 없는 특수 공격 업그레이드">
      {SPECIAL_ATTACK_ORDER.map((kind) => {
        const { attack, isPurchased, hallLocked, prerequisitesMet, available, status, shortStatus } = stateFor(kind);
        const isSelected = kind === selectedKind;
        return (
          <button
            type="button"
            key={kind}
            data-kind={kind}
            className={`${styles.specialNode} ${styles[kind]} ${isPurchased ? styles.purchased : ""} ${available ? styles.available : ""} ${hallLocked || !prerequisitesMet ? styles.locked : ""} ${isSelected ? styles.selected : ""}`}
            style={{ "--special-accent": attack.accent } as CSSProperties}
            onClick={() => setSelectedKind(kind)}
            aria-label={`${attack.title} 특수 공격 상세보기: ${attack.description}. ${status}. 선택만으로는 구매되지 않습니다.`}
            aria-pressed={isSelected}
            aria-expanded={isSelected}
            aria-controls="special-upgrade-dialog"
            aria-haspopup="dialog"
            title={`${attack.title} · ${status}`}
          >
            <span className={styles.specialBadge}>특수</span>
            <span className={styles.nodeIcon}><SpellPreview kind={kind} /></span>
            <span className={styles.nodeName}>{attack.title}</span>
            <span className={styles.nodeCost}>{shortStatus}</span>
            <span className={styles.statusMark} aria-hidden="true">{isPurchased ? "✓" : hallLocked || !prerequisitesMet ? "◆" : "+"}</span>
          </button>
        );
      })}
    </div>
  );

  const detailModal = selectedState && selectedAttack && selectedNode ? (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && setSelectedKind(null)}>
      <section
        id="special-upgrade-dialog"
        className={styles.detailPanel}
        style={{ "--special-accent": selectedAttack.accent } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={`${selectedAttack.title} 특수 공격 상세 정보`}
      >
        <button type="button" autoFocus className={styles.detailClose} onClick={() => setSelectedKind(null)} aria-label="특수 공격 설명 닫기">×</button>
        <div className={styles.detailVisual}>
          <SpellPreview kind={selectedKind!} />
          <span className={styles.detailGlyph} aria-hidden="true">{selectedState.hallLocked ? "鎖" : selectedAttack.glyph}</span>
        </div>

        <div className={styles.detailCopy}>
          <small>특수 공격 · 연결선 없는 독립 노드</small>
          <h4>{selectedAttack.title}</h4>
          <p>{selectedAttack.description}</p>
          <em>{selectedState.status}</em>
        </div>

        <dl className={styles.detailFacts}>
          <div><dt>피해</dt><dd>클릭 공격력 ×{selectedAttack.damageMultiplier.toFixed(2)}</dd></div>
          <div><dt>발동 주기</dt><dd>{(selectedAttack.cooldownMs / 1000).toFixed(1)}초</dd></div>
          <div><dt>범위</dt><dd>반경 {selectedAttack.radius}</dd></div>
          <div><dt>특성</dt><dd>{selectedKind === "lightning" ? "연쇄 감전" : selectedKind === "tornado" ? "3연타 · 견인" : "대폭발 · 넉백"}</dd></div>
          <div><dt>연구 비용</dt><dd>{formatCost(selectedNode.cost)} G</dd></div>
          <div><dt>해금 조건</dt><dd>{selectedState.hallLocked ? `길드 본관 Lv.${selectedAttack.hallLevel}` : selectedState.prerequisitesMet ? "충족" : "길드의 기반 연구"}</dd></div>
        </dl>

        <div className={styles.detailAction}>
          <p><strong>구매 전 효과를 확인하세요.</strong><span>이 버튼을 눌러야 골드를 사용하고 연구합니다.</span></p>
          <button type="button" disabled={!selectedState.available} onClick={() => selectedState.available && onPurchase(selectedNode)}>
            {selectedState.isPurchased ? "특수 공격 연구 완료" : selectedState.status}
          </button>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      {boardSlot ? createPortal(nodeLayer, boardSlot) : null}
      {modalRoot && detailModal ? createPortal(detailModal, modalRoot) : null}
    </>
  );
}
