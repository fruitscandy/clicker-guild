"use client";

import type { CSSProperties } from "react";
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
  readOnly?: boolean;
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
        {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--particle-index": index } as CSSProperties} />)}
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
  readOnly = false,
}: SpecialResearchPanelProps) {
  const purchased = new Set(purchasedIds);
  const completed = SPECIAL_ATTACK_ORDER.filter((kind) => purchased.has(SPECIAL_ATTACKS[kind].nodeId)).length;

  return (
    <section className={styles.panel} aria-labelledby="special-research-title">
      <header className={styles.heading}>
        <span className={styles.headingSeal} aria-hidden="true"><i />秘</span>
        <span className={styles.headingCopy}>
          <small>SPECIAL ARCANA · FIELD AUTOMATION</small>
          <strong id="special-research-title">특수 비술</strong>
          <p>연구한 비술은 전투 중 자동으로 충전되어 밀집한 몬스터 무리를 향해 발동합니다.</p>
        </span>
        <span className={styles.progressBadge}><b>{completed}</b> / 3 해금</span>
      </header>

      <div className={styles.cards}>
        {SPECIAL_ATTACK_ORDER.map((kind) => {
          const attack = SPECIAL_ATTACKS[kind];
          const node = SPECIAL_RESEARCH_NODES.find((candidate) => candidate.id === attack.nodeId)!;
          const isPurchased = purchased.has(node.id);
          const hallLocked = hallLevel < attack.hallLevel;
          const prerequisitesMet = node.prerequisites.every((id) => purchased.has(id));
          const affordable = gold >= node.cost;
          const available = !readOnly && !isPurchased && !hallLocked && prerequisitesMet && affordable;
          const status = isPurchased
            ? "자동 발동 활성화"
            : readOnly
              ? "DEV 시험대에서는 전체 활성"
              : hallLocked
                ? `길드 본관 Lv.${attack.hallLevel} 필요`
                : !prerequisitesMet
                  ? "길드의 기반 연구 필요"
                  : affordable
                    ? `${formatCost(node.cost)} G로 연구`
                    : `${formatCost(node.cost - gold)} G 부족`;

          return (
            <article
              key={kind}
              className={`${styles.card} ${styles[kind]} ${isPurchased ? styles.unlocked : ""} ${hallLocked ? styles.locked : ""}`}
              style={{ "--special-accent": attack.accent } as CSSProperties}
            >
              <div className={styles.visual}>
                <SpellPreview kind={kind} />
                <span className={styles.spellGlyph}>{hallLocked ? "鎖" : attack.glyph}</span>
                <span className={styles.cooldownChip}>{(attack.cooldownMs / 1000).toFixed(1)}초</span>
              </div>
              <div className={styles.copy}>
                <small>{attack.subtitle}</small>
                <h4>{attack.title}</h4>
                <p>{attack.description}</p>
                <dl>
                  <div><dt>피해</dt><dd>클릭 공격력 ×{attack.damageMultiplier.toFixed(2)}</dd></div>
                  <div><dt>범위</dt><dd>반경 {attack.radius}</dd></div>
                  <div><dt>특성</dt><dd>{kind === "lightning" ? "연쇄 감전" : kind === "tornado" ? "3연타 · 견인" : "대폭발 · 넉백"}</dd></div>
                </dl>
              </div>
              <button
                type="button"
                className={styles.unlockButton}
                disabled={!available}
                onClick={() => onPurchase(node)}
                aria-label={`${attack.title}: ${status}`}
              >
                <span>{isPurchased ? "✓" : hallLocked ? "◆" : "✦"}</span>
                <strong>{status}</strong>
                {!isPurchased && !hallLocked && <small>{formatCost(node.cost)} G</small>}
              </button>
            </article>
          );
        })}
      </div>
      <p className={styles.footnote}><b>자동 비술 규칙</b> 전투가 시작되면 각 비술이 독립적으로 충전됩니다. 플레이어 무기 강화는 공격력만 높이고 비술의 범위·주기는 바꾸지 않습니다.</p>
    </section>
  );
}
