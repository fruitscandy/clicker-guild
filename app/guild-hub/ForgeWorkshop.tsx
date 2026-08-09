"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { allStageMaterials, canAffordWeaponRecipe, materialIconVars, weaponMaterialRecipe } from "../stage-materials";
import { WeaponArt, type WeaponView } from "./WeaponArt";
import styles from "./ForgeWorkshop.module.css";

type ForgeWorkshopProps = {
  weapons: WeaponView[];
  currentLevel: number;
  gold: number;
  bossTokens: number;
  materials: Record<string, number>;
  formatNumber: (value: number) => string;
  onUpgrade: () => void;
};

export function ForgeWorkshop({ weapons, currentLevel, gold, bossTokens, materials, formatNumber, onUpgrade }: ForgeWorkshopProps) {
  const [previewTier, setPreviewTier] = useState(currentLevel);
  const current = weapons[currentLevel];
  const next = weapons[currentLevel + 1] ?? null;
  const preview = weapons[previewTier] ?? current;
  const previewUnlocked = preview.tier <= currentLevel;
  const previewCraftable = preview.tier === currentLevel + 1;
  const nextRecipe = next ? weaponMaterialRecipe(next.tier) : null;
  const recipeProgress = nextRecipe?.ingredients.map((ingredient) => ({
    ...ingredient,
    owned: materials[ingredient.material.id] ?? 0,
  })) ?? [];
  const firstShortage = recipeProgress.find(({ owned, amount }) => owned < amount);
  const canAffordNext = Boolean(next && gold >= next.cost && canAffordWeaponRecipe(materials, nextRecipe));
  const vaultMaterials = allStageMaterials().map((material) => ({ material, amount: materials[material.id] ?? 0 }));

  function movePreview(direction: -1 | 1) {
    setPreviewTier((tier) => Math.max(0, Math.min(weapons.length - 1, tier + direction)));
  }

  function craftNextWeapon() {
    if (!next || !canAffordNext) return;
    setPreviewTier(next.tier);
    onUpgrade();
  }

  return <section className={`${styles.workshop} panel facility-first-panel`} aria-label="불꽃 대장간 무기 강화">
    <header className={styles.header}>
      <div>
        <span className="eyebrow">FLAME FORGE · MASTERWORK ARSENAL</span>
        <h3>불꽃 대장간</h3>
        <p>대장간은 플레이어의 클릭 무기 공격력과 외형만 올립니다. 길드원 패시브 공격력은 길드 강화 연구에서 따로 성장합니다.</p>
      </div>
      <div className={styles.resources} aria-label="대장간 보유 자원">
        <span><i className={styles.gold} />골드<strong>{formatNumber(gold)}</strong></span>
        <span><i className={styles.token} />보스 증표<strong>{bossTokens}</strong></span>
        {nextRecipe && <span className={styles.recipeResource}><i className={`stage-material-icon ${styles.materialIcon}`} style={materialIconVars(nextRecipe.ingredients[0].material) as CSSProperties} />다음 제작 재료<strong>{recipeProgress.map(({ owned, amount }) => `${owned}/${amount}`).join(" + ")}</strong></span>}
      </div>
    </header>

    <div className={styles.forgeFloor}>
      <Image className={styles.workshopArt} src="/assets/guild/forge/flame-forge-v1.png" alt="붉은 지붕과 타오르는 화덕이 있는 불꽃 대장간" fill sizes="(max-width: 900px) 100vw, 1100px" priority unoptimized draggable={false} />
      <div className={styles.fireHaze} aria-hidden="true"><i /><i /><i /><i /></div>

      <div className={styles.forgeLore}>
        <span>대장장이 브람</span>
        <strong>“강한 무기는 손끝에서 먼저 느껴지는 법이지.”</strong>
        <small>완성한 무기는 즉시 장착되며 전투 필드의 마우스 커서에도 같은 외형으로 나타납니다.</small>
      </div>

      <div className={styles.weaponStage}>
        <button className={`${styles.arrow} ${styles.leftArrow}`} onClick={() => movePreview(-1)} disabled={previewTier === 0} aria-label="이전 무기 보기">‹</button>
        <div className={styles.anvilGlow} aria-hidden="true" />
        <div className={styles.weaponStand}>
          <span className={styles.blueprintState}>{previewUnlocked ? "완성품" : previewCraftable ? "제작 가능" : "도면 잠김"}</span>
          <WeaponArt tier={preview.tier} glyph={preview.glyph} label={preview.weaponName} locked={!previewUnlocked && !previewCraftable} className={styles.heroWeapon} />
          <i className={styles.anvil} aria-hidden="true" />
        </div>
        <button className={`${styles.arrow} ${styles.rightArrow}`} onClick={() => movePreview(1)} disabled={previewTier === weapons.length - 1} aria-label="다음 무기 보기">›</button>
      </div>

      <aside className={styles.weaponDetails}>
        <span className={styles.tierLabel}>WEAPON {String(preview.tier + 1).padStart(2, "0")} / {weapons.length}</span>
        <h4>{previewUnlocked || previewCraftable ? preview.weaponName : "미확인 무기 도면"}</h4>
        <p>{previewUnlocked || previewCraftable ? preview.subtitle : "앞 단계 무기를 완성해야 이 도면을 해독할 수 있습니다."}</p>
        <dl>
          <div><dt>클릭 공격력</dt><dd>{previewUnlocked || previewCraftable ? formatNumber(Math.round(12 * preview.damageScale)) : "???"}</dd></div>
          <div><dt>공격 연출</dt><dd>{previewUnlocked || previewCraftable ? `${preview.visualHits} HIT` : "???"}</dd></div>
          <div><dt>강화 효과</dt><dd>공격력만 상승</dd></div>
        </dl>
        {previewCraftable && nextRecipe && <div className={styles.costPanel}>
          <span>제작 비용</span>
          <div className={styles.recipeCosts}>
            <strong className={gold >= preview.cost ? "" : styles.shortage}>{formatNumber(preview.cost)} G</strong>
            {recipeProgress.map(({ material, owned, amount }) => <strong key={material.id} className={owned >= amount ? "" : styles.shortage}><i className={`stage-material-icon ${styles.costMaterialIcon}`} style={materialIconVars(material) as CSSProperties} />{material.name} {owned}/{amount}</strong>)}
          </div>
          <small>{canAffordNext ? "골드와 재료 준비 완료" : gold < preview.cost ? `${formatNumber(preview.cost - gold)} G 부족` : firstShortage ? `${firstShortage.material.name} ${firstShortage.amount - firstShortage.owned}개 부족 · STAGE ${firstShortage.material.firstStage}~${firstShortage.material.lastStage}` : "제작 조건 확인 중"}</small>
        </div>}
        {previewUnlocked && <div className={styles.ownedPanel}><span>{preview.tier === currentLevel ? "현재 장착 중" : "제작 완료"}</span><strong>{preview.title}</strong><small>전투에서 커서를 움직여 무기 외형을 확인하세요.</small></div>}
        {!previewUnlocked && !previewCraftable && <div className={styles.lockedPanel}><span>연속 제작 필요</span><strong>{current.weaponName} 이후 도면</strong><small>현재 무기 다음 단계부터 차례대로 제작할 수 있습니다.</small></div>}
      </aside>
    </div>

    <div className={styles.craftBar}>
      <div className={styles.equippedSummary}>
        <WeaponArt tier={current.tier} glyph={current.glyph} label={current.weaponName} className={styles.equippedWeapon} />
        <span><small>PLAYER WEAPON · +{current.tier}</small><strong>{current.weaponName}</strong><em>{current.title} · 클릭 공격력 {formatNumber(Math.round(12 * current.damageScale))}</em></span>
      </div>
      {next ? <button className={styles.craftButton} onClick={craftNextWeapon} disabled={!canAffordNext}>
        <span>다음 무기 제작</span>
        <strong>{next.weaponName}</strong>
        <small>{formatNumber(next.cost)} G · {recipeProgress.map(({ material, amount }) => `${material.name} ${amount}개`).join(" + ")}</small>
      </button> : <div className={styles.masterwork}><span>MASTERWORK COMPLETE</span><strong>길드마스터 신검 완성</strong><small>15종 무기와 모든 직접 공격 연출을 해금했습니다.</small></div>}
    </div>

    <div className={styles.materialVault}>
      <div className={styles.vaultHeading}><span>REGIONAL MATERIAL VAULT</span><strong>10종 강화 소재</strong><small>지역당 하나의 핵심 소재만 기억하면 됩니다. 모든 소재는 무기 제작에 실제로 소모됩니다.</small></div>
      <div className={styles.vaultGrid}>
        {vaultMaterials.map(({ material, amount }) => <div className={styles.vaultItem} key={material.id} title={material.description}>
          <i className={`stage-material-icon ${styles.vaultIcon}`} style={materialIconVars(material) as CSSProperties} />
          <span><strong>{material.name}</strong><small>STAGE {material.firstStage}–{material.lastStage} · 보유 {amount}</small></span>
        </div>)}
      </div>
    </div>

    <div className={styles.arsenalHeading}><span>무기 진열대</span><strong>{currentLevel + 1}/{weapons.length} 완성</strong><small>카드를 눌러 무기의 외형과 성능을 미리 확인하세요.</small></div>
    <div className={styles.arsenal} role="list" aria-label="15종 무기 제작 단계">
      {weapons.map((weapon) => {
        const unlocked = weapon.tier <= currentLevel;
        const craftable = weapon.tier === currentLevel + 1;
        const selected = weapon.tier === previewTier;
        return <button
          key={weapon.key}
          className={`${styles.weaponCard} ${unlocked ? styles.unlocked : styles.lockedCard} ${craftable ? styles.craftable : ""} ${selected ? styles.selected : ""}`}
          onClick={() => setPreviewTier(weapon.tier)}
          aria-pressed={selected}
          aria-label={`${weapon.tier + 1}단계 ${unlocked || craftable ? weapon.weaponName : "미확인 무기 도면"} 보기`}
        >
          <span className={styles.cardTier}>{String(weapon.tier + 1).padStart(2, "0")}</span>
          <WeaponArt tier={weapon.tier} glyph={weapon.glyph} label={weapon.weaponName} locked={!unlocked && !craftable} className={styles.cardWeapon} />
          <strong>{unlocked || craftable ? weapon.weaponName : "미확인 도면"}</strong>
          <small>{unlocked ? weapon.title : craftable ? `${formatNumber(weapon.cost)} G` : "LOCKED"}</small>
        </button>;
      })}
    </div>
  </section>;
}
