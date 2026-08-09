"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { BASE_CLICK_DAMAGE } from "../game-balance";
import { allStageMaterials, canAffordWeaponRecipe, materialIconVars, weaponMaterialRecipe } from "../stage-materials";
import { WeaponArt, type WeaponView } from "./WeaponArt";
import styles from "./ForgeWorkshop.module.css";

type ForgeWorkshopProps = {
  weapons: WeaponView[];
  currentLevel: number;
  gold: number;
  materials: Record<string, number>;
  formatNumber: (value: number) => string;
  onUpgrade: () => void;
};

export function ForgeWorkshop({ weapons, currentLevel, gold, materials, formatNumber, onUpgrade }: ForgeWorkshopProps) {
  const [previewTier, setPreviewTier] = useState(currentLevel);
  const current = weapons[currentLevel];
  const next = weapons[currentLevel + 1] ?? null;
  const maxPreviewTier = Math.min(weapons.length - 1, currentLevel + 1);
  const visiblePreviewTier = Math.min(previewTier, maxPreviewTier);
  const preview = weapons[visiblePreviewTier] ?? current;
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
    setPreviewTier(Math.max(0, Math.min(maxPreviewTier, visiblePreviewTier + direction)));
  }

  function craftNextWeapon() {
    if (!next || !canAffordNext) return;
    setPreviewTier(next.tier);
    onUpgrade();
  }

  return <section className={`${styles.workshop} panel facility-first-panel`} aria-label="불꽃 대장간 무기 제작">
    <header className={styles.header}>
      <div>
        <span className="eyebrow">FLAME FORGE · MASTERWORK ARSENAL</span>
        <h3>불꽃 대장간</h3>
        <p>새 무기를 제작하면 플레이어의 클릭 무기 공격력이 높아집니다. 무기는 현재 단계의 다음 무기부터 하나씩 완성됩니다.</p>
      </div>
      <div className={styles.resources} aria-label="대장간 보유 자원">
        <span><i className={styles.gold} />골드<strong>{formatNumber(gold)}</strong></span>
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
        <button className={`${styles.arrow} ${styles.leftArrow}`} onClick={() => movePreview(-1)} disabled={visiblePreviewTier === 0} aria-label="이전 무기 보기">‹</button>
        <div className={styles.anvilGlow} aria-hidden="true" />
        <div className={styles.weaponStand}>
          <span className={styles.blueprintState}>{previewUnlocked ? (preview.tier === currentLevel ? "현재 장착" : "제작 완료") : "다음 무기"}</span>
          {previewUnlocked
            ? <WeaponArt tier={preview.tier} glyph={preview.glyph} label={preview.weaponName} className={styles.heroWeapon} />
            : <WeaponArt tier={preview.tier} glyph={preview.glyph} label="다음 무기 실루엣" locked className={styles.heroWeapon} />}
          <i className={styles.anvil} aria-hidden="true" />
        </div>
        <button className={`${styles.arrow} ${styles.rightArrow}`} onClick={() => movePreview(1)} disabled={visiblePreviewTier === maxPreviewTier} aria-label="다음 무기 보기">›</button>
      </div>

      <aside className={styles.weaponDetails}>
        <span className={styles.tierLabel}>WEAPON {String(preview.tier + 1).padStart(2, "0")} / {weapons.length}</span>
        <h4>{previewUnlocked ? preview.weaponName : "다음 무기"}</h4>
        <dl>
          <div><dt>공격력</dt><dd>{previewUnlocked ? formatNumber(Math.round(BASE_CLICK_DAMAGE * preview.damageScale)) : "???"}</dd></div>
        </dl>
        {previewCraftable && nextRecipe && <div className={styles.costPanel}>
          <span>제작 비용</span>
          <div className={styles.recipeCosts}>
            <strong className={gold >= preview.cost ? "" : styles.shortage}>{formatNumber(preview.cost)} G</strong>
            {recipeProgress.map(({ material, owned, amount }) => <strong key={material.id} className={owned >= amount ? "" : styles.shortage}><i className={`stage-material-icon ${styles.costMaterialIcon}`} style={materialIconVars(material) as CSSProperties} />{material.name} {owned}/{amount}</strong>)}
          </div>
          <small>{canAffordNext ? "골드와 재료 준비 완료" : gold < preview.cost ? `${formatNumber(preview.cost - gold)} G 부족` : firstShortage ? `${firstShortage.material.name} ${firstShortage.amount - firstShortage.owned}개 부족 · STAGE ${firstShortage.material.firstStage}~${firstShortage.material.lastStage}` : "제작 조건 확인 중"}</small>
        </div>}
      </aside>
    </div>

    <div className={styles.craftBar}>
      <div className={styles.equippedSummary}>
        <WeaponArt tier={current.tier} glyph={current.glyph} label={current.weaponName} className={styles.equippedWeapon} />
        <span><small>PLAYER WEAPON · CURRENT</small><strong>{current.weaponName}</strong><em>공격력 {formatNumber(Math.round(BASE_CLICK_DAMAGE * current.damageScale))}</em></span>
      </div>
      {next ? <button className={styles.craftButton} onClick={craftNextWeapon} disabled={!canAffordNext}>
        <span>다음 무기 제작</span>
        <strong>미확인 무기</strong>
        <small>{formatNumber(next.cost)} G · {recipeProgress.map(({ material, amount }) => `${material.name} ${amount}개`).join(" + ")}</small>
      </button> : <div className={styles.masterwork}><span>MASTERWORK COMPLETE</span><strong>길드마스터 신검 완성</strong><small>최종 무기 공격력 {formatNumber(Math.round(BASE_CLICK_DAMAGE * current.damageScale))}</small></div>}
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

    <div className={styles.arsenalHeading}><span>무기 진열대</span><strong>{currentLevel + 1}/{weapons.length} 완성</strong><small>완성한 무기와 바로 다음 무기의 실루엣만 확인할 수 있습니다.</small></div>
    <div className={styles.arsenal} role="list" aria-label="15종 무기 제작 단계">
      {weapons.map((weapon) => {
        const unlocked = weapon.tier <= currentLevel;
        const craftable = weapon.tier === currentLevel + 1;
        const hidden = weapon.tier > currentLevel + 1;
        const selected = !hidden && weapon.tier === visiblePreviewTier;
        return <button
          key={weapon.key}
          className={`${styles.weaponCard} ${unlocked ? styles.unlocked : styles.lockedCard} ${craftable ? styles.craftable : ""} ${hidden ? styles.hiddenCard : ""} ${selected ? styles.selected : ""}`}
          onClick={() => setPreviewTier(weapon.tier)}
          disabled={hidden}
          aria-pressed={selected}
          aria-label={`${weapon.tier + 1}단계 ${unlocked ? weapon.weaponName : craftable ? "다음 무기 실루엣" : "미공개 무기"}${hidden ? "" : " 보기"}`}
        >
          <span className={styles.cardTier}>{String(weapon.tier + 1).padStart(2, "0")}</span>
          {hidden
            ? <span className={styles.hiddenCardGlyph} aria-hidden="true">???</span>
            : <WeaponArt tier={weapon.tier} glyph={weapon.glyph} label={unlocked ? weapon.weaponName : "다음 무기 실루엣"} locked={!unlocked} className={styles.cardWeapon} />}
          <strong>{unlocked ? weapon.weaponName : craftable ? "다음 무기" : "???"}</strong>
          <small>{unlocked ? `공격력 ${formatNumber(Math.round(BASE_CLICK_DAMAGE * weapon.damageScale))}` : craftable ? `${formatNumber(weapon.cost)} G` : "???"}</small>
        </button>;
      })}
    </div>
  </section>;
}
