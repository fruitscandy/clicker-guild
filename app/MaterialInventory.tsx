"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { allStageMaterials, materialIconVars, weaponTiersUsingMaterial } from "./stage-materials";
import styles from "./MaterialInventory.module.css";

type MaterialInventoryProps = {
  materials: Readonly<Record<string, number>>;
  unlockedStage: number;
  weaponLevel: number;
};

export function MaterialInventory({ materials, unlockedStage, weaponLevel }: MaterialInventoryProps) {
  const [open, setOpen] = useState(false);
  const catalog = useMemo(() => allStageMaterials(), []);
  const totalOwned = catalog.reduce((sum, material) => sum + (materials[material.id] ?? 0), 0);
  const discovered = catalog.filter((material) => unlockedStage >= material.firstStage || (materials[material.id] ?? 0) > 0).length;

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <>
    <button
      type="button"
      className={styles.trigger}
      aria-expanded={open}
      aria-controls="material-inventory-dialog"
      onClick={() => setOpen(true)}
    >
      <span className={styles.iconStack} aria-hidden="true">
        {catalog.slice(0, 3).map((material) => <i key={material.id} className="stage-material-icon" style={materialIconVars(material) as CSSProperties} />)}
      </span>
      <span>강화 소재<small>{discovered}/10 발견</small></span>
      <strong>{totalOwned}</strong>
    </button>

    {open && <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section id="material-inventory-dialog" className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="material-inventory-title">
        <header>
          <div>
            <span className={styles.eyebrow}>UPGRADE MATERIAL CODEX</span>
            <h2 id="material-inventory-title">강화 소재 보관함</h2>
            <p>10개 지역을 한 번씩 돌면 필요한 제작 재료가 모두 모입니다.</p>
          </div>
          <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="강화 소재 보관함 닫기">×</button>
        </header>

        <div className={styles.summary}>
          <span>발견<strong>{discovered}/10</strong></span>
          <span>총 보유<strong>{totalOwned}</strong></span>
          <span>플레이 구조<strong>지역당 3웨이브</strong></span>
        </div>

        <div className={styles.grid} role="list" aria-label="획득 가능한 강화 소재 10종">
          {catalog.map((material) => {
            const owned = materials[material.id] ?? 0;
            const available = unlockedStage >= material.firstStage || owned > 0;
            const usedByTiers = weaponTiersUsingMaterial(material.id);
            const nextTier = usedByTiers.find((tier) => tier > weaponLevel);
            return <article key={material.id} className={`${styles.card} ${available ? styles.available : styles.locked}`} role="listitem" style={{ "--material-accent": material.accent } as CSSProperties}>
              <i className={`stage-material-icon ${styles.materialIcon}`} style={materialIconVars(material) as CSSProperties} />
              <div className={styles.cardCopy}>
                <span>{available ? `${material.region}지역 획득 가능` : `${material.firstStage}웨이브에서 해금`}</span>
                <strong>{material.name}</strong>
                <small>STAGE {material.firstStage}–{material.lastStage}</small>
              </div>
              <div className={styles.owned}><small>보유</small><strong>{owned}</strong></div>
              <p>{nextTier ? `다음 사용처 · 무기 ${nextTier + 1}단계 제작` : usedByTiers.length ? "해당 무기 제작 완료" : "사용처 확인 중"}</p>
            </article>;
          })}
        </div>
      </section>
    </div>}
  </>;
}
