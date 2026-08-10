import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/guild-upgrades.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const upgrades = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);

test("짧은 플레이용 길드 강화는 핵심 8종을 한 번씩만 제공한다", () => {
  assert.deepEqual(upgrades.UPGRADE_KEYS, ["range", "critical", "shockwave", "time", "tavern", "gold", "guild", "autoAttack"]);
  assert.equal(upgrades.CORE_UPGRADE_NODES.length, 8);
  for (const key of upgrades.UPGRADE_KEYS) {
    assert.equal(upgrades.UPGRADE_CAPS[key], 1);
    assert.equal(upgrades.GUILD_UPGRADE_DEFINITIONS[key].costs.length, 1);
  }
});

test("한 번의 선택 보너스는 체감되지만 플레이어 수동 공격을 대체하지 않는다", () => {
  const coreResearchCost = upgrades.CORE_UPGRADE_NODES.reduce((sum, node) => sum + node.cost, 0) + upgrades.CITADEL_RESEARCH_COST;
  assert.equal(coreResearchCost, 21_100);
  assert.equal(upgrades.ATTACK_RANGE_PER_LEVEL, 6);
  assert.equal(upgrades.CRITICAL_CHANCE_PER_LEVEL, 0.12);
  assert.equal(upgrades.BATTLE_TIME_PER_LEVEL, 8);
  assert.equal(upgrades.playerAutoAttackIntervalMs(1), 4_500);
  assert.ok(1_000 / upgrades.playerAutoAttackIntervalMs(1) < 0.25);
  assert.equal(upgrades.guildAttackMultiplier(1), 1.35);
  assert.equal(upgrades.raidGoldMultiplier(1), 1.2);
  assert.equal(upgrades.shockwaveAttackInterval(1), 6);
  assert.equal(upgrades.shockwaveDamageMultiplier(1), 1.65);
  assert.equal(upgrades.GUILD_UPGRADE_DEFINITIONS.critical.levelDescription(1), "플레이어 치명타 확률 +12%");
  assert.equal(upgrades.GUILD_UPGRADE_DEFINITIONS.guild.levelDescription(1), "길드원 공격력 +35%");
});

test("삭제 연구는 구매 골드를 정확히 환급하고 완성 조건은 새 계통만 사용한다", () => {
  const removedIds = Object.keys(upgrades.LEGACY_REMOVED_NODE_REFUNDS);
  const expected = Object.values(upgrades.LEGACY_REMOVED_NODE_REFUNDS).reduce((sum, cost) => sum + cost, 0);
  assert.equal(upgrades.legacyResearchRefund(removedIds), expected);
  assert.equal(upgrades.legacyResearchRefund(["foundation", "range-1", "special-lightning-2"]), 0);
  assert.equal(upgrades.legacyResearchRefund(["range-2", "crit-5", "auto-5"]), 6_980);
  assert.deepEqual(upgrades.CITADEL_PREREQUISITES.slice(-3), ["special-lightning-2", "special-tornado-3", "special-meteor-4"]);
  assert.deepEqual(upgrades.CITADEL_PREREQUISITES.slice(0, 8), ["range-1", "crit-1", "shockwave-1", "time-1", "tavern-1", "gold-1", "guild-1", "auto-1"]);
  for (const removedFamily of ["combo", "execute", "momentum", "scout", "loot"]) {
    assert.equal(upgrades.CITADEL_PREREQUISITES.some((id) => id.startsWith(`${removedFamily}-`)), false);
  }
});
