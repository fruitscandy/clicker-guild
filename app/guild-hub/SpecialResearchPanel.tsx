"use client";

import { useState, type CSSProperties } from "react";
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
              "--particle-distance": `${38 + index * 1.7}px`,
              "--particle-index": index,
            } as CSSProperties}
          />
        ))}
      </span>
    </span>
  );
}

export function SpecialResearchPanel({
  purchasedIds,
  hallLevel,
  gold,
  formatCost,
  onPurchase,
  developerMode = false,
}: SpecialResearchPanelProps) {
  const purchased = new Set(purchasedIds);
  const completed = SPECIAL_ATTACK_ORDER.filter((kind) => purchased.has(SPECIAL_ATTACKS[kind].nodeId)).length;
  const [selectedKind, setSelectedKind] = useState<SpecialAttackKind | null>(null);
  const selectedAttack = selectedKind ? SPECIAL_ATTACKS[selectedKind] : null;
  const selectedNode = selectedAttack
    ? SPECIAL_RESEARCH_NODES.find((candidate) => candidate.id === selectedAttack.nodeId) ?? null
    : null;

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
    return { attack, node, isPurchased, hallLocked, prerequisitesMet, affordable, available, status };
  }

  const selectedState = selectedKind ? stateFor(selectedKind) : null;

  return (
    <section className={styles.panel} aria-labelledby="special-research-title">
      <header className={styles.heading}>
        <span className={styles.headingSeal} aria-hidden="true"><i />秘</span>
        <span className={styles.headingCopy}>
          <small>OUTER RING · SPECIAL ATTACK</small>
          <strong id="special-research-title">외곽 특수 공격</strong>
          <p>핵심 4방향 트리와 연결되지 않은 독립 연구입니다. 원하는 인장을 눌러 효과를 확인하세요.</p>
        </span>
        <span className={styles.progressBadge}><b>{completed}</b> / 3 해금</span>
      </header>

      <div className={styles.satelliteViewport}>
        <div className={styles.satelliteField}>
          <span className={styles.outerOrbit} aria-hidden="true" />

          {SPECIAL_ATTACK_ORDER.map((kind) => {
            const { attack, isPurchased, hallLocked, prerequisitesMet, available, status } = stateFor(kind);
            const isSelected = kind === selectedKind;

            return (
              <button
                type="button"
                key={kind}
                data-kind={kind}
                className={`${styles.specialNode} ${styles[kind]} ${isPurchased ? styles.unlocked : ""} ${hallLocked ? styles.locked : ""} ${isSelected ? styles.selected : ""}`}
                style={{ "--special-accent": attack.accent } as CSSProperties}
                onClick={() => setSelectedKind(kind)}
                aria-label={`${attack.title} 상세보기: ${attack.description}. ${status}. 선택만으로는 구매되지 않습니다.`}
                aria-pressed={isSelected}
                aria-expanded={isSelected}
                aria-controls="special-research-detail"
                title={`${attack.title} · ${status}`}
              >
                <span className={styles.nodePreview}><SpellPreview kind={kind} /></span>
                <span className={styles.spellGlyph} aria-hidden="true">{hallLocked ? "鎖" : attack.glyph}</span>
                <span className={styles.nodeCopy}><small>{attack.subtitle}</small><strong>{attack.title}</strong></span>
                <span className={styles.nodeStatus} aria-hidden="true">{isPurchased ? "✓" : hallLocked || !prerequisitesMet ? "◆" : available ? "+" : "G"}</span>
              </button>
            );
          })}

          {!selectedState && (
            <div className={styles.selectionHint}>
              <span aria-hidden="true">✦</span>
              <strong>특수 공격 인장을 선택하세요</strong>
              <p>번개·토네이도·메테오는 서로 연결되지 않아 원하는 순서로 연구할 수 있습니다.</p>
            </div>
          )}

          {selectedState && selectedAttack && selectedNode && (
            <aside
              id="special-research-detail"
              className={styles.detailPanel}
              style={{ "--special-accent": selectedAttack.accent } as CSSProperties}
              aria-live="polite"
              aria-label={`${selectedAttack.title} 특수 공격 상세 정보`}
            >
              <button type="button" className={styles.detailClose} onClick={() => setSelectedKind(null)} aria-label="특수 공격 설명 닫기">×</button>
              <div className={styles.detailVisual}>
                <SpellPreview kind={selectedKind!} />
                <span className={styles.detailGlyph} aria-hidden="true">{selectedState.hallLocked ? "鎖" : selectedAttack.glyph}</span>
              </div>

              <div className={styles.detailCopy}>
                <small>{selectedAttack.subtitle} · 독립 연구</small>
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
                <p><strong>인장 선택은 설명만 엽니다.</strong><span>아래 버튼을 눌러야 골드를 사용하고 해금합니다.</span></p>
                <button
                  type="button"
                  disabled={!selectedState.available}
                  onClick={() => selectedState.available && onPurchase(selectedNode)}
                >
                  {selectedState.isPurchased ? "특수 공격 해금 완료" : selectedState.status}
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>

      <p className={styles.footnote}><b>독립 연구 규칙</b> 세 인장은 선행 순서가 없습니다. 해금하면 전투 중 각자 충전되고 플레이어 무기 공격력을 기준으로 자동 발동합니다.</p>
    </section>
  );
}
