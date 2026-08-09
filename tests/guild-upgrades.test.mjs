import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/guild-upgrades.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const upgrades = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);

test("길드 강화는 핵심 8종을 각 5단계로만 제공한다", () => {
  assert.deepEqual(upgrades.UPGRADE_KEYS, ["range", "critical", "shockwave", "time", "tavern", "gold", "guild", "autoAttack"]);
  assert.equal(upgrades.CORE_UPGRADE_NODES.length, 40);
  for (const key of upgrades.UPGRADE_KEYS) {
    assert.equal(upgrades.UPGRADE_CAPS[key], 5);
    assert.equal(upgrades.GUILD_UPGRADE_DEFINITIONS[key].costs.length, 5);
  }
});

test("비용은 단계마다 오르고 플레이어 수동 공격의 우위를 보존한다", () => {
  for (const key of upgrades.UPGRADE_KEYS) {
    const costs = upgrades.GUILD_UPGRADE_DEFINITIONS[key].costs;
    for (let index = 1; index < costs.length; index += 1) assert.ok(costs[index] > costs[index - 1], `${key} cost ${index}`);
  }
  const coreResearchCost = upgrades.CORE_UPGRADE_NODES.reduce((sum, node) => sum + node.cost, 0) + upgrades.CITADEL_RESEARCH_COST;
  assert.equal(coreResearchCost, 47_590);
  assert.equal(upgrades.playerAutoAttackIntervalMs(1), 5_200);
  assert.equal(upgrades.playerAutoAttackIntervalMs(5), 2_600);
  assert.ok(1_000 / upgrades.playerAutoAttackIntervalMs(5) < 0.4);
  assert.equal(upgrades.guildAttackMultiplier(5), 1.9);
  assert.equal(upgrades.raidGoldMultiplier(5), 1.6);
  assert.equal(upgrades.shockwaveAttackInterval(5), 4);
  assert.equal(upgrades.shockwaveDamageMultiplier(5), 2.05);
  assert.equal(upgrades.GUILD_UPGRADE_DEFINITIONS.critical.levelDescription(3), "플레이어 치명타 확률 +15%");
  assert.equal(upgrades.GUILD_UPGRADE_DEFINITIONS.guild.levelDescription(5), "길드원 공격력 +90%");
});

test("삭제 연구는 구매 골드를 정확히 환급하고 완성 조건은 새 계통만 사용한다", () => {
  const removedIds = Object.keys(upgrades.LEGACY_REMOVED_NODE_REFUNDS);
  const expected = Object.values(upgrades.LEGACY_REMOVED_NODE_REFUNDS).reduce((sum, cost) => sum + cost, 0);
  assert.equal(upgrades.legacyResearchRefund(removedIds), expected);
  assert.equal(upgrades.legacyResearchRefund(["foundation", "range-1", "special-lightning-2"]), 0);
  assert.deepEqual(upgrades.CITADEL_PREREQUISITES.slice(-3), ["special-lightning-2", "special-tornado-3", "special-meteor-4"]);
  for (const removedFamily of ["combo", "execute", "momentum", "scout", "loot"]) {
    assert.equal(upgrades.CITADEL_PREREQUISITES.some((id) => id.startsWith(`${removedFamily}-`)), false);
  }
});
