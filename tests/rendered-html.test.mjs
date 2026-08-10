import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Guildmaster game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>모험가 길드 \| 길드마스터 클리커 RPG<\/title>/i);
  assert.match(html, /길드 영지/);
  assert.match(html, /사냥터/);
  assert.match(html, /초보자의 숲/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships region-specific monsters with hit and death actions", async () => {
  const [forestAssets, regionEntries, monsterConfig, game, css] = await Promise.all([
    readdir(new URL("../public/assets/monsters/stage-01/", import.meta.url)),
    readdir(new URL("../public/assets/monsters/", import.meta.url), { withFileTypes: true }),
    readFile(new URL("../app/monster-assets.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  const regionDirectories = regionEntries.filter((entry) => entry.isDirectory() && /^region-\d{2}$/.test(entry.name));
  const regionAssets = await Promise.all(
    regionDirectories.map((entry) => readdir(new URL(`../public/assets/monsters/${entry.name}/`, import.meta.url))),
  );

  assert.equal(forestAssets.filter((file) => file.endsWith(".png")).length, 10);
  assert.equal(regionDirectories.length, 9);
  assert.equal(regionAssets.flat().filter((file) => file.endsWith(".png")).length, 18);
  assert.match(monsterConfig, /작은 초록 슬라임/);
  assert.match(monsterConfig, /고블린 족장 그루칸/);
  assert.match(monsterConfig, /뿔 모래도마뱀/);
  assert.match(monsterConfig, /태고의 천공룡/);
  assert.match(monsterConfig, /stage > 30/);
  assert.match(game, /Math\.min\(88, 68 \+ stage\.regionIndex \* 2\)/);
  assert.match(game, /mass-swarm/);
  assert.match(game, /className="pack-monster-art"/);
  assert.match(game, /is-struck click-recoil-tier/);
  assert.match(game, /window\.setTimeout\(awardVictory, 900\)/);
  assert.match(css, /@keyframes packMonsterArtHit/);
  assert.match(css, /@keyframes packMonsterArtDefeat/);
  assert.match(css, /@keyframes packMonsterSoul/);
});

test("distinguishes direct attacks from triggered guild upgrade effects", async () => {
  const [game, css, weaponEffect, weaponEffectCss] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/WeaponAttackEffect.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/WeaponAttackEffect.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /activeCombatProcs/);
  assert.match(game, /attackUpgradeStatuses/);
  assert.match(game, /shockwaveClicksRemaining/);
  assert.match(game, /playerAutoAttackIntervalMs/);
  assert.match(game, /lastPlayerAutoAttackAt/);
  assert.match(game, /<WeaponAttackEffect/);
  assert.match(weaponEffect, /shockwavePulse/);
  assert.match(weaponEffect, /criticalNotch/);
  assert.match(weaponEffect, /data-effect-motif/);
  assert.doesNotMatch(weaponEffect, /executionCut|comboDamage|momentumMark/);
  assert.match(weaponEffectCss, /motifCrosscut/);
  assert.match(weaponEffectCss, /motifAbyss/);
  assert.match(weaponEffectCss, /motifMyriad/);
  assert.doesNotMatch(weaponEffect, /tier\s*>=/);
  assert.doesNotMatch(game, /fx-pattern-label/);
  assert.doesNotMatch(game, /combat-proc-popover/);
  assert.match(game, /UPGRADE_ICON_BY_KEY\[upgrade\.key\]/);
  for (const key of ["range", "critical", "shockwave", "autoAttack"]) {
    assert.match(game, new RegExp(`key: "${key}"`));
  }
  assert.match(game, /일반 직접 공격/);
  assert.match(css, /\.shockwave-screen-impact/);
  assert.match(css, /\.shockwave-activation-emblem/);
  assert.match(css, /\.field-click-fx\.is-critical \.fx-damage/);
  assert.match(css, /@keyframes criticalDamageSlam/);
  assert.match(css, /\.attack-upgrade-monitor > span\.triggered/);
});

test("routes guild management through buildings and gates four-way research", async () => {
  const [game, progression, hub, researchMap, iconConfig, iconAssets] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/guild-progression.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/upgrade-icons.ts", import.meta.url), "utf8"),
    readdir(new URL("../public/assets/upgrades/", import.meta.url)),
  ]);

  assert.match(game, /guildHallLevel/);
  assert.match(game, /purchaseGuildHallUpgrade/);
  assert.match(game, /requiredHallLevelForNode/);
  assert.match(game, /activeFacility === "tavern"/);
  assert.match(game, /activeFacility === "research"/);
  assert.match(game, /activeFacility === "forge"/);
  assert.doesNotMatch(game, /activeFacility === "training"/);
  assert.doesNotMatch(progression, /"training"/);
  assert.match(progression, /researchDepth: 4/);
  assert.match(progression, /inferHallLevelFromNodes/);
  assert.match(hub, /길드 건물 선택/);
  assert.match(hub, /forgeBuildingArt/);
  assert.match(researchMap, /플레이어 공격/);
  assert.match(researchMap, /토벌 지원/);
  assert.match(researchMap, /길드 성장/);
  assert.match(researchMap, /본관 Lv\.\$\{requiredHallLevel\} 필요/);
  assert.match(researchMap, /upgradeIconForNode/);
  assert.match(game, /UPGRADE_ICON_BY_KEY/);
  assert.ok(iconAssets.filter((file) => file.endsWith(".webp")).length >= 8);
  for (const key of ["range", "critical", "shockwave", "time", "guild", "gold", "tavern"]) assert.match(iconConfig, new RegExp(`${key}: "/assets/upgrades/${key}\\.webp"`));
  assert.match(iconConfig, /autoAttack: "\/assets\/upgrades\/momentum\.webp"/);
});

test("separates guild passive weapons from the player's forge click weapon", async () => {
  const [game, hub, gameData, css, forge, weaponArt] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/game-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ForgeWorkshop.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/WeaponArt.tsx", import.meta.url), "utf8"),
  ]);
  const directAttack = game.slice(game.indexOf("const directAttackAt"), game.indexOf("function selectStage"));

  assert.match(hub, /forgeBuildingArt/);
  assert.match(game, /<ForgeWorkshop/);
  assert.match(game, /weaponLevel/);
  assert.match(game, /purchaseWeaponUpgrade/);
  assert.match(gameData, /MEMBER_COMBAT_TRAITS/);
  assert.match(game, /emitMemberWeaponFx/);
  assert.match(game, /member-weapon-layer/);
  assert.match(game, /equipped-member-weapons/);
  assert.doesNotMatch(directAttack, /emitMemberWeaponFx/);
  assert.match(game, /<WeaponCursor/);
  assert.match(game, /<WeaponAttackEffect/);
  assert.doesNotMatch(game, /className="fighters"/);
  assert.doesNotMatch(game, /memberAnimationSource/);
  assert.match(forge, /플레이어의 클릭 무기 공격력/);
  assert.match(weaponArt, /export function WeaponCursor/);
  assert.match(css, /weapon-style-vanguard/);
  assert.match(css, /weapon-style-marksman/);
  assert.match(css, /weapon-style-arcane/);
});

test("runs portrait-driven gacha recruitment, party formation, and member sales inside the tavern", async () => {
  const [memberEntries, tavernAssets, game, progression, hub, tavern, tavernStyles] = await Promise.all([
    readdir(new URL("../public/assets/guild-members/", import.meta.url), { withFileTypes: true }),
    readdir(new URL("../public/assets/guild/tavern/", import.meta.url)),
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/guild-progression.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/TavernHall.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/TavernHall.module.css", import.meta.url), "utf8"),
  ]);
  const memberDirectories = memberEntries.filter((entry) => entry.isDirectory());
  const portraitFiles = await Promise.all(memberDirectories.map((entry) => readdir(new URL(`../public/assets/guild-members/${entry.name}/`, import.meta.url))));

  assert.equal(memberDirectories.length, 25);
  assert.equal(portraitFiles.filter((files) => files.some((file) => file.endsWith("-idle-preview.webp"))).length, 25);
  assert.ok(tavernAssets.includes("wandering-mug-tavern-v1.png"));
  assert.match(game, /<TavernHall/);
  assert.doesNotMatch(game, /<TrainingGround/);
  assert.doesNotMatch(game, /function trainMember/);
  assert.doesNotMatch(progression, /"training"/);
  assert.match(hub, /tavernBuildingArt/);
  assert.match(tavern, /THE WANDERING MUG/);
  assert.doesNotMatch(tavern, /RANDOM CONTRACTS|계약 종/);
  assert.match(tavern, /영입 결과/);
  assert.match(tavern, /길드원 편성/);
  assert.match(tavern, /보유 길드원/);
  assert.match(tavern, /onRecruit/);
  assert.match(tavern, /onToggleParty/);
  assert.match(tavern, /onRequestSale/);
  assert.match(tavern, /RecruitReveal/);
  assert.match(tavern, /정말 판매하시겠습니까/);
  assert.doesNotMatch(tavern, /여관주인 마르타|innkeeperBar/);
  assert.match(tavern, /finnCorrection/);
  assert.match(tavern, /finn-portrait\.webp/);
  assert.match(tavern, /-idle-preview\.webp/);
  assert.match(tavernStyles, /\.recruitCounter/);
  assert.match(tavernStyles, /\.resultGrid/);
  assert.match(tavernStyles, /\.rareResult/);
  assert.match(tavernStyles, /\.revealSlash/);
  assert.match(tavernStyles, /\.saleDialog/);
  assert.match(tavernStyles, /\.rateBoardTitle/);
  assert.doesNotMatch(tavernStyles, /\.rateBoardHeader|\.contractSeal|\.emptyResult/);
  assert.match(tavernStyles, /\.partySlots/);
  assert.match(tavernStyles, /\.ownedRoster/);
  assert.match(tavernStyles, /\.sellButton/);
  assert.match(tavernStyles, /--portrait-scale/);
});

test("lays research branches out from one core in four directions", async () => {
  const [researchMap, researchStyles] = await Promise.all([
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ResearchMap.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(researchMap, /DIRECTION_BRANCHES/);
  for (const direction of ["north", "east", "south", "west"]) {
    assert.match(researchMap, new RegExp(`direction: "${direction}"`));
  }
  assert.match(researchMap, /className=\{styles\.familyTrack\}/);
  assert.match(researchMap, /className=\{styles\.coreDock\}/);
  assert.match(researchMap, /data-node-id=\{node\.id\}/);
  assert.doesNotMatch(researchMap, /nodePoint|<svg|className=\{styles\.connectors\}/);
  assert.match(researchStyles, /\.crossCanvas\s*\{/);
  assert.match(researchStyles, /\.familyTrack\s*\{/);
  assert.match(researchStyles, /\.axisNorth/);
  assert.match(researchStyles, /position:\s*absolute/);
  assert.match(researchStyles, /overflow-x:\s*auto/);
  assert.match(researchStyles, /@media \(max-width: 820px\)/);
  assert.match(researchStyles, /\.north\s*\{/);
  assert.match(researchStyles, /\.east\s*\{/);
  assert.match(researchStyles, /\.south\s*\{/);
  assert.match(researchStyles, /\.west\s*\{/);
});

test("keeps developer upgrade experiments temporary and independent from gold", async () => {
  const [game, upgradeState, developerPanel] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/developer-upgrades.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/DeveloperUpgradePanel.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(game, /const effectiveUpgrades = developerMode \? developerUpgrades : save\.upgrades/);
  assert.doesNotMatch(game, /readOnly=\{developerMode\}/);
  assert.match(game, /<DeveloperUpgradePanel/);
  assert.doesNotMatch(developerPanel, /setSave|localStorage|gold\s*[<>=]/);
  assert.match(developerPanel, /저장 영향 없음/);
  assert.match(developerPanel, /모두 0/);
  assert.match(developerPanel, /모두 최대/);
  assert.match(upgradeState, /UPGRADE_CAPS, UPGRADE_KEYS/);
  assert.match(upgradeState, /maximumUpgradeLevels/);
  assert.match(upgradeState, /clampUpgradeLevel/);
});

test("keeps developer resource purchases isolated from the saved game", async () => {
  const [game, resourceState, resourcePanel, resourceStyles] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/developer-resources.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/DeveloperResourcePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/DeveloperResourcePanel.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /const developerEntrySave = useRef<SaveState \| null>\(null\)/);
  assert.match(game, /developerEntrySave\.current = cloneSaveState\(save\)/);
  assert.match(game, /setSave\(cloneSaveState\(developerEntrySave\.current\)\)/);
  assert.match(game, /if \(!hydrated \|\| developerMode\) return/);
  assert.match(game, /<DeveloperResourcePanel/);
  assert.match(game, /onChange=\{\(resources\) => setSave/);
  assert.match(resourcePanel, /DEV RESOURCE LAB/);
  assert.match(resourcePanel, /MATERIAL_GROUPS/);
  assert.match(resourcePanel, /type="number"/);
  assert.match(resourcePanel, /모두 0/);
  assert.match(resourcePanel, /구매 가능/);
  assert.match(resourcePanel, /대량 보유/);
  assert.match(resourceState, /DEVELOPER_RESOURCE_LIMIT/);
  assert.match(resourceState, /clampDeveloperResourceAmount/);
  assert.match(resourceState, /developerResourcePreset/);
  assert.match(resourceStyles, /\.materialGrid/);
  assert.match(resourceStyles, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(resourcePanel, /localStorage|SAVE_KEY/);
  assert.match(resourcePanel, /지역 강화 소재 10종/);
  assert.match(resourcePanel, /allStageMaterials/);
});

test("shows one complete material inventory and removes the combat power chip", async () => {
  const [game, inventory, economy] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/MaterialInventory.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/economy-balance.ts", import.meta.url), "utf8"),
  ]);

  assert.match(game, /<MaterialInventory materials=\{save\.materials\}/);
  assert.match(game, /migrateMaterialInventory\(loaded\.materials \?\? \{\}\)/);
  assert.doesNotMatch(game, /전투력|combatPower/);
  assert.doesNotMatch(game, /current-material-resource/);
  assert.match(inventory, /강화 소재 보관함/);
  assert.match(inventory, /획득 가능한 강화 소재 10종/);
  assert.doesNotMatch(inventory, /발견|총 보유|플레이 구조|10개 지역을 한 번씩/);
  assert.match(inventory, /STAGE \{material\.firstStage\}–\{material\.lastStage\}/);
  assert.match(economy, /NORMAL_BATTLE_SECONDS = 26/);
  assert.match(economy, /BOSS_BATTLE_SECONDS = 36/);
});

test("uses expedition state instead of locked navigation tabs", async () => {
  const [game, globalStyles] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /\{!combatLocked && \(/);
  assert.match(game, /\{combatLocked && \(/);
  assert.doesNotMatch(game, /type Tab|setTab|main-tabs|LOCKED/);
  assert.doesNotMatch(game, /tab !== "field"|tab === "field"/);
  assert.doesNotMatch(globalStyles, /main-tabs|live-dot|livePulse/);
});

test("launches expeditions from the hunting ground inside the guild territory", async () => {
  const [game, huntingGround, huntingStyles, huntingAssets] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/HuntingGround.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/HuntingGround.module.css", import.meta.url), "utf8"),
    readdir(new URL("../public/assets/guild/hunting/", import.meta.url)),
  ]);

  assert.doesNotMatch(game, /GUILD TERRITORY|<h2>길드 관리<\/h2>|expedition-actions/);
  assert.match(game, /aria-label="길드 영지"/);
  assert.match(game, /<TerritoryHuntingGround/);
  assert.doesNotMatch(game, /<HuntingGroundPanel|huntingGroundOpen/);
  assert.match(game, /function openHuntingGround\(\) \{[\s\S]*?setStagePicker\(true\)/);
  assert.match(game, /onSelectStage=\{startStage\}/);
  assert.match(game, /title="사냥터 지도 · 토벌 목표 선택"/);
  assert.match(huntingGround, /토벌 지도 열기/);
  assert.match(huntingGround, /이 웨이브 출정/);
  assert.match(huntingGround, /hunting-ground-outpost-v2\.png/);
  assert.match(huntingStyles, /\.territoryCanvas/);
  assert.match(huntingStyles, /\.fieldPreview/);
  assert.ok(huntingAssets.includes("hunting-ground-outpost-v2.png"));
});
