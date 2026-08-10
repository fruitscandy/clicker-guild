import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadBalanceModule() {
  const source = await readFile(new URL("../app/game-balance.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}#${Date.now()}`);
}

function encounterMultiplier(stage) {
  return stage % 3 === 0 ? 1.7 : 1.42;
}

function simulateFocusedClicks(balance, stage) {
  const count = balance.monsterCountForStage(stage);
  const boss = stage % 3 === 0;
  const tier = balance.expectedWeaponTierForStage(stage);
  const damage = Math.round(balance.BASE_CLICK_DAMAGE * balance.weaponBalanceForTier(tier).damageScale);
  const totalHp = Math.round(balance.stageBaseHpFor(stage) * encounterMultiplier(stage));
  const weights = Array.from({ length: count }, (_, index) => boss && index === 0 ? 5 : index % 7 === 0 ? 1.75 : 0.82 + index % 4 * 0.16);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const monsters = weights.map((weight, index) => ({
    x: 12 + (index * 37 + stage * 13 + Math.floor(index / 9) * 11) % 78,
    y: 14 + (index * 29 + stage * 7 + Math.floor(index / 7) * 13) % 72,
    hp: Math.max(4, Math.round(totalHp * weight / totalWeight)),
  }));

  let clicks = 0;
  while (monsters.some((monster) => monster.hp > 0) && clicks < 2_000) {
    const alive = monsters.filter((monster) => monster.hp > 0);
    const best = alive.reduce((currentBest, candidate) => {
      const targets = alive.filter((monster) => Math.hypot(monster.x - candidate.x, (monster.y - candidate.y) * 0.72) <= balance.BASE_ATTACK_RANGE);
      const usefulDamage = targets.reduce((sum, monster) => sum + Math.min(damage, monster.hp), 0);
      return usefulDamage > currentBest.usefulDamage ? { usefulDamage, targets } : currentBest;
    }, { usefulDamage: -1, targets: [] });
    best.targets.forEach((monster) => { monster.hp = Math.max(0, monster.hp - damage); });
    clicks += 1;
  }

  return clicks;
}

test("the opening pressure wave clears before the timer and the upgrade wave becomes a massacre", async () => {
  const balance = await loadBalanceModule();
  const stageOneSeconds = simulateFocusedClicks(balance, 1) / 4;
  const stageTwoSeconds = simulateFocusedClicks(balance, 2) / 4;
  const firstBossSeconds = simulateFocusedClicks(balance, 3) / 4;

  assert.ok(stageOneSeconds >= 12 && stageOneSeconds <= 22, `stage 1 focused clear: ${stageOneSeconds}s`);
  assert.ok(stageTwoSeconds >= 4 && stageTwoSeconds <= 8, `stage 2 focused clear: ${stageTwoSeconds}s`);
  assert.ok(firstBossSeconds >= 12 && firstBossSeconds <= 20, `stage 3 focused clear: ${firstBossSeconds}s`);
  assert.ok(balance.weaponBalanceForTier(1).damageScale >= 2, "the first craft should at least double click damage");
  assert.equal(balance.monsterCountForStage(1), 42);
  assert.equal(balance.monsterCountForStage(2), 68);
});

test("the full first-clear route needs no guild research and fits the 10-20 minute target", async () => {
  const balance = await loadBalanceModule();
  // This simulation intentionally uses only the expected player weapon tier:
  // no range, critical, shockwave, time, guild, auto, gold, or tavern research.
  const totalClicks = Array.from({ length: 30 }, (_, index) => simulateFocusedClicks(balance, index + 1)).reduce((sum, clicks) => sum + clicks, 0);
  const transitionAndLootSeconds = 30 * 8.5;
  const quickRunMinutes = (totalClicks / 3.25 + transitionAndLootSeconds) / 60;
  const relaxedRunMinutes = (totalClicks / 2.25 + transitionAndLootSeconds) / 60;

  assert.ok(quickRunMinutes >= balance.TARGET_RUN_MINUTES.min && quickRunMinutes <= balance.TARGET_RUN_MINUTES.max, `quick route: ${quickRunMinutes.toFixed(1)}m`);
  assert.ok(relaxedRunMinutes >= balance.TARGET_RUN_MINUTES.min && relaxedRunMinutes <= balance.TARGET_RUN_MINUTES.max, `relaxed route: ${relaxedRunMinutes.toFixed(1)}m`);
});

test("every weapon craft is an obvious power spike", async () => {
  const balance = await loadBalanceModule();
  for (let tier = 1; tier < balance.PLAYER_WEAPON_BALANCE.length; tier += 1) {
    const previous = balance.weaponBalanceForTier(tier - 1).damageScale;
    const current = balance.weaponBalanceForTier(tier).damageScale;
    assert.ok(current / previous >= 1.28, `weapon tier ${tier} lacks a visible power spike`);
  }
  assert.ok(balance.weaponBalanceForTier(14).damageScale >= 150);
});

test("a meaningful failed first attempt salvages the first weapon recipe", async () => {
  const balance = await loadBalanceModule();
  const salvage = balance.failureSalvageFor(1, 150, 3, 17, 42);

  assert.ok(salvage.gold >= 40);
  assert.ok(salvage.material >= 3);
  assert.deepEqual(balance.failureSalvageFor(1, 150, 3, 0, 42), { gold: 0, material: 0 });
});

test("the live combat and forge use the shared dopamine balance", async () => {
  const [game, forge] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(game, /BASE_CLICK_DAMAGE \* activeClickPattern\.damageScale/);
  assert.match(game, /BASE_ATTACK_RANGE \+ effectiveUpgrades\.range/);
  assert.equal((game.match(/\.\.\.PLAYER_WEAPON_BALANCE\[/g) ?? []).length, 15);
  assert.match(game, /failureSalvageFor/);
  assert.match(game, /회수 전리품/);
  assert.match(forge, /BASE_CLICK_DAMAGE \* preview\.damageScale/);
  assert.match(forge, /BASE_CLICK_DAMAGE \* current\.damageScale/);
});
