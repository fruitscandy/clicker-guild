import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("separates research detail selection from the purchase action", async () => {
  const researchMap = await readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8");

  assert.match(researchMap, /onClick=\{\(\) => setSelectedNodeId\(node\.id\)\}/);
  assert.match(researchMap, /aria-pressed=\{isSelected\}/);
  assert.match(researchMap, /aria-controls="research-node-detail"/);
  assert.match(researchMap, /onClick=\{\(\) => canPurchase && onPurchase\(selectedNode\)\}/);
  assert.doesNotMatch(researchMap, /onClick=\{\(\) => onPurchase\(node\)\}/);
  assert.match(researchMap, /선택만으로는 구매되지 않습니다/);
  assert.match(researchMap, /아래 버튼을 눌러야 실제로 구매됩니다/);
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
});
