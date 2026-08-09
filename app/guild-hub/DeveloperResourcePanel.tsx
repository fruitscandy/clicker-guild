"use client";

import type { CSSProperties } from "react";
import {
  clampDeveloperResourceAmount,
  developerResourcePreset,
  updateDeveloperMaterial,
  type DeveloperResourcePreset,
  type DeveloperResourceValues,
} from "../developer-resources";
import { allStageMaterials } from "../stage-materials";
import styles from "./DeveloperResourcePanel.module.css";

type DeveloperResourcePanelProps = {
  resources: DeveloperResourceValues;
  onChange: (resources: DeveloperResourceValues) => void;
};

const MATERIAL_GROUPS = allStageMaterials().map((material) => [material]);
const MATERIAL_IDS = MATERIAL_GROUPS.flat().map((material) => material.id);

const PRESETS: Array<{ id: DeveloperResourcePreset; label: string; detail: string }> = [
  { id: "empty", label: "모두 0", detail: "부족 상태" },
  { id: "ready", label: "구매 가능", detail: "골드 10만 · 재료 99" },
  { id: "abundant", label: "대량 보유", detail: "장기 반복 테스트" },
];

export function DeveloperResourcePanel({ resources, onChange }: DeveloperResourcePanelProps) {
  function setAmount(key: "gold" | "bossTokens", value: string) {
    onChange({ ...resources, [key]: clampDeveloperResourceAmount(value) });
  }

  function applyPreset(preset: DeveloperResourcePreset) {
    onChange(developerResourcePreset(preset, MATERIAL_IDS));
  }

  return (
    <details className={styles.panel} open>
      <summary className={styles.summary}>
        <span>
          <small>DEV RESOURCE LAB</small>
          <strong>시험용 자원 설정</strong>
        </span>
        <span className={styles.snapshot}>골드 {resources.gold.toLocaleString()} · 증표 {resources.bossTokens}</span>
      </summary>

      <div className={styles.body}>
        <header className={styles.header}>
          <div>
            <h3>구매 경계 상태를 즉시 재현합니다</h3>
            <p>이 값과 DEV에서 발생한 차감·구매 진행은 브라우저 저장소에 기록되지 않으며, DEV를 끄면 진입 전 상태로 돌아갑니다.</p>
          </div>
          <strong className={styles.safeBadge}>실제 저장 보호</strong>
        </header>

        <div className={styles.presets} aria-label="시험용 자원 프리셋">
          {PRESETS.map((preset) => (
            <button type="button" key={preset.id} onClick={() => applyPreset(preset.id)}>
              <strong>{preset.label}</strong>
              <small>{preset.detail}</small>
            </button>
          ))}
        </div>

        <div className={styles.primaryResources}>
          <label>
            <span><b>골드</b><small>연구·본관·무기·고용</small></span>
            <input type="number" min="0" max="999999999" step="1" value={resources.gold} onChange={(event) => setAmount("gold", event.target.value)} />
          </label>
          <label>
            <span><b>보스 증표</b><small>특수 전술 해금</small></span>
            <input type="number" min="0" max="999999999" step="1" value={resources.bossTokens} onChange={(event) => setAmount("bossTokens", event.target.value)} />
          </label>
        </div>

        <div className={styles.materialHeading}>
          <div><strong>지역 강화 소재 10종</strong><small>각 지역의 3개 웨이브가 공유하는 무기 제작 소재를 조정합니다.</small></div>
          <div>
            <button type="button" onClick={() => onChange({ ...resources, materials: developerResourcePreset("empty", MATERIAL_IDS).materials })}>재료 0</button>
            <button type="button" onClick={() => onChange({ ...resources, materials: developerResourcePreset("ready", MATERIAL_IDS).materials })}>재료 99</button>
          </div>
        </div>

        <div className={styles.materialGrid}>
          {MATERIAL_GROUPS.map((group) => (
            <fieldset className={styles.materialGroup} key={group[0].region}>
              <legend style={{ "--resource-accent": group[0].accent } as CSSProperties}>
                <i />
                <span><b>{group[0].familyName}</b><small>{group[0].region}지역</small></span>
              </legend>
              {group.map((material) => (
                <label key={material.id}>
                  <span><b>{material.firstStage}–{material.lastStage}W</b><small>{material.name}</small></span>
                  <input
                    type="number"
                    min="0"
                    max="999999999"
                    step="1"
                    aria-label={`${material.name} 보유량`}
                    value={resources.materials[material.id] ?? 0}
                    onChange={(event) => onChange(updateDeveloperMaterial(resources, material.id, event.target.value))}
                  />
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      </div>
    </details>
  );
}
