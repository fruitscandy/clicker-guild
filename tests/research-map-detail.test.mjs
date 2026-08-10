import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("separates research detail selection from the purchase action", async () => {
  const researchMap = await readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8");

  assert.match(researchMap, /setSelectedNodeId\(node\.id\)/);
  assert.match(researchMap, /requestAnimationFrame\(centerResearchMap\)/);
  assert.match(researchMap, /aria-pressed=\{isSelected\}/);
  assert.match(researchMap, /aria-controls="research-node-detail"/);
  assert.match(researchMap, /onClick=\{\(\) => canPurchase && onPurchase\(selectedNode\)\}/);
  assert.doesNotMatch(researchMap, /onClick=\{\(\) => onPurchase\(node\)\}/);
  assert.match(researchMap, /선택만으로는 구매되지 않습니다/);
  assert.match(researchMap, /아래 버튼을 눌러야 골드를 사용하고 연구합니다/);
  assert.match(researchMap, /setSelectedNodeId\(null\)/);
  assert.match(researchMap, /className=\{styles\.inspectorDock\}/);
  assert.match(researchMap, /className=\{styles\.crossViewport\}/);
  assert.ok(
    researchMap.indexOf("className={styles.inspectorDock}") > researchMap.indexOf("className={styles.crossViewport}"),
    "the research inspector should be rendered after the tactical board instead of covering it",
  );
});

test("documents every upgrade family and its purchase requirements", async () => {
  const [researchMap, styles] = await Promise.all([
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ResearchMap.module.css", import.meta.url), "utf8"),
  ]);

  for (const family of ["range", "crit", "shockwave", "auto", "time", "guild", "gold", "tavern"]) {
    assert.match(researchMap, new RegExp(`\\b${family}: \\{ summary:`));
  }
  for (const removedFamily of ["combo", "execute", "momentum", "scout", "loot"]) {
    assert.doesNotMatch(researchMap, new RegExp(`\\b${removedFamily}: \\{ summary:`));
  }

  assert.match(researchMap, /연구 비용/);
  assert.match(researchMap, /해금 조건/);
  assert.match(researchMap, /missingPrerequisites/);
  assert.match(researchMap, /readOnly/);
  assert.match(styles, /\.detailPanel/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /:global\(\.facility-research \.research-overview\)/);
  assert.match(styles, /#211814/);
});

test("keeps special attacks outside the core tree and opens details before purchase", async () => {
  const [specialPanel, styles] = await Promise.all([
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(specialPanel, /useState<SpecialAttackKind \| null>\(null\)/);
  assert.match(specialPanel, /onClick=\{\(\) => setSelectedKind\(kind\)\}/);
  assert.match(specialPanel, /aria-controls="special-research-detail"/);
  assert.match(specialPanel, /selectedState\.available && onPurchase\(selectedNode\)/);
  assert.doesNotMatch(specialPanel, /onClick=\{\(\) => onPurchase\(node\)\}/);
  assert.match(specialPanel, /선택만으로는 구매되지 않습니다/);
  assert.match(specialPanel, /SEALED RITES · DETACHED SANCTUM/);
  assert.match(specialPanel, /className=\{styles\.ritualGrid\}/);
  assert.match(specialPanel, /서로 선행 관계가 없습니다/);
  assert.ok(
    specialPanel.indexOf("className={styles.detailPanel}") > specialPanel.indexOf("className={styles.satelliteViewport}"),
    "the special-attack detail should be rendered after the detached altar field",
  );
  assert.match(styles, /\.ritualGrid/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /margin-top: clamp\(48px, 6vw, 76px\)/);
  assert.doesNotMatch(styles, /\.outerOrbit/);
  assert.doesNotMatch(styles, /\.specialNode\[data-kind=/);
  assert.match(styles, /\.detailPanel/);
});
