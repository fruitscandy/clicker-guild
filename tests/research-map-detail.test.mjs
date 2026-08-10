import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("opens core research details in a modal before the purchase action", async () => {
  const researchMap = await readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8");

  assert.match(researchMap, /setSelectedNodeId\(node\.id\)/);
  assert.match(researchMap, /aria-pressed=\{isSelected\}/);
  assert.match(researchMap, /aria-controls="research-node-detail"/);
  assert.match(researchMap, /aria-haspopup="dialog"/);
  assert.match(researchMap, /role="dialog"/);
  assert.match(researchMap, /aria-modal="true"/);
  assert.match(researchMap, /createPortal\(selectedDetail, modalRoot\)/);
  assert.match(researchMap, /onClick=\{\(\) => canPurchase && onPurchase\(selectedNode\)\}/);
  assert.doesNotMatch(researchMap, /onClick=\{\(\) => onPurchase\(node\)\}/);
  assert.match(researchMap, /선택만으로는 구매되지 않습니다/);
  assert.match(researchMap, /이 버튼을 눌러야 골드를 사용하고 연구합니다/);
  assert.match(researchMap, /setSelectedNodeId\(null\)/);
  assert.doesNotMatch(researchMap, /inspectorDock|inspectorEmpty/);
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
  assert.match(styles, /display: none !important/);
  assert.match(researchMap, /id="guild-special-node-slot"/);
  assert.match(researchMap, /className=\{styles\.citadelDock\}/);
  assert.match(researchMap, /!node\.id\.startsWith\("special-"\)/);
  assert.match(researchMap, /data-upgrade-progress=\{progress \? `\$\{progress\.completed\}\/\$\{progress\.total\}`/);
  assert.match(researchMap, /familyNodes\.find\(\(node\) => !purchased\.has\(node\.id\)\)/);
  assert.match(researchMap, /completed: familyCompleted, total: familyNodes\.length/);
  assert.doesNotMatch(researchMap, /familyNodes\.map\(\(node\) => renderNode\(node\)\)/);
  assert.match(styles, /\.levelProgress/);
});

test("mounts disconnected special attacks inside the same board and opens a purchase modal", async () => {
  const [specialPanel, styles, researchMap] = await Promise.all([
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(specialPanel, /useState<SpecialAttackKind \| null>\(null\)/);
  assert.match(specialPanel, /onClick=\{\(\) => setSelectedKind\(kind\)\}/);
  assert.match(specialPanel, /aria-controls="special-upgrade-dialog"/);
  assert.match(specialPanel, /aria-haspopup="dialog"/);
  assert.match(specialPanel, /selectedState\.available && onPurchase\(selectedNode\)/);
  assert.doesNotMatch(specialPanel, /onClick=\{\(\) => onPurchase\(node\)\}/);
  assert.match(specialPanel, /선택만으로는 구매되지 않습니다/);
  assert.match(specialPanel, /getElementById\("guild-special-node-slot"\)/);
  assert.match(specialPanel, /createPortal\(nodeLayer, boardSlot\)/);
  assert.match(specialPanel, /role="dialog"/);
  assert.match(specialPanel, /aria-modal="true"/);
  assert.doesNotMatch(specialPanel, /연결선 없는 독립 노드|detailGlyph|selectedAttack\.glyph|鎖/);
  assert.doesNotMatch(researchMap, /연결선 없는 특수 공격/);
  assert.doesNotMatch(specialPanel, /봉인 비술 제단|ritualGrid|satelliteViewport|selectionHint/);
  assert.match(styles, /\.nodeLayer/);
  assert.match(styles, /\.specialNode\[data-kind="lightning"\]/);
  assert.match(styles, /\.specialNode\[data-kind="tornado"\]/);
  assert.match(styles, /\.specialNode\[data-kind="meteor"\]/);
  assert.doesNotMatch(styles, /outerOrbit|ritualGrid|satelliteField/);
  assert.match(styles, /\.detailPanel/);
});

test("removes redundant special-node and hall maximum labels", async () => {
  const [researchMap, hallStyles] = await Promise.all([
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.module.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(researchMap, /연결선 없는 특수 공격|specialHint/);
  assert.doesNotMatch(hallStyles, /MAX LV\.4|panel-title::after/);
});
