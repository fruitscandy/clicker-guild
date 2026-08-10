"use client";

import Image from "next/image";
import {
  clampUpgradeLevel,
  maximumUpgradeLevels,
  UPGRADE_CAPS,
  UPGRADE_KEYS,
  upgradeLevelsFrom,
  type UpgradeKey,
  type UpgradeLevels,
  zeroUpgradeLevels,
} from "../developer-upgrades";
import { UPGRADE_ICON_BY_KEY } from "../upgrade-icons";
import styles from "./DeveloperUpgradePanel.module.css";

type DeveloperUpgradePanelProps = {
  levels: UpgradeLevels;
  savedLevels: UpgradeLevels;
  labels: Record<UpgradeKey, string>;
  effectText: (key: UpgradeKey, level: number) => string;
  onChange: (levels: UpgradeLevels) => void;
};

export function DeveloperUpgradePanel({ levels, savedLevels, labels, effectText, onChange }: DeveloperUpgradePanelProps) {
  function setLevel(key: UpgradeKey, nextLevel: number) {
    onChange({ ...levels, [key]: clampUpgradeLevel(key, nextLevel) });
  }

  return (
    <section className={styles.panel} aria-labelledby="developer-upgrade-title">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>DEV UPGRADE LAB</span>
          <h3 id="developer-upgrade-title">업그레이드 효과 시험대</h3>
          <p>골드와 연구 선행 조건 없이 단계별 효과를 즉시 비교합니다.</p>
        </div>
        <strong className={styles.safeBadge}>저장 영향 없음</strong>
      </header>

      <div className={styles.presets} aria-label="업그레이드 시험 프리셋">
        <button type="button" onClick={() => onChange(upgradeLevelsFrom(savedLevels))}>저장값</button>
        <button type="button" onClick={() => onChange(zeroUpgradeLevels())}>모두 0</button>
        <button type="button" onClick={() => onChange(maximumUpgradeLevels())}>모두 최대</button>
      </div>

      <div className={styles.grid}>
        {UPGRADE_KEYS.map((key) => {
          const level = levels[key];
          const cap = UPGRADE_CAPS[key];
          return (
            <article className={styles.card} key={key} data-upgrade-key={key}>
              <Image className={styles.icon} src={UPGRADE_ICON_BY_KEY[key]} alt="" width={54} height={54} unoptimized aria-hidden="true" />
              <div className={styles.copy}>
                <span><strong>{labels[key]}</strong><small>저장 Lv.{savedLevels[key]}</small></span>
                <p>{effectText(key, level)}</p>
              </div>
              <div className={styles.stepper} aria-label={`${labels[key]} 단계 조정`}>
                <button type="button" onClick={() => setLevel(key, level - 1)} disabled={level === 0} aria-label={`${labels[key]} 단계 낮추기`}>−</button>
                <output aria-live="polite"><b>{level}</b><span>/{cap}</span></output>
                <button type="button" onClick={() => setLevel(key, level + 1)} disabled={level === cap} aria-label={`${labels[key]} 단계 높이기`}>＋</button>
              </div>
            </article>
          );
        })}
      </div>
      <p className={styles.notice}>DEV를 끄면 실제 저장 진행도로 즉시 돌아갑니다. 이 패널의 조정값은 브라우저 저장소에 기록하지 않습니다.</p>
    </section>
  );
}
