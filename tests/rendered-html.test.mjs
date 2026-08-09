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
  assert.match(html, /길드 관리/);
  assert.match(html, /토벌 출정/);
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

test("routes guild management through buildings and gates four-way research", async () => {
  const [game, progression, hub, researchMap] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/guild-progression.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/ResearchMap.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(game, /guildHallLevel/);
  assert.match(game, /purchaseGuildHallUpgrade/);
  assert.match(game, /requiredHallLevelForNode/);
  assert.match(game, /activeFacility === "tavern"/);
  assert.match(game, /activeFacility === "research"/);
  assert.doesNotMatch(game, /activeFacility === "forge"/);
  assert.doesNotMatch(game, /activeFacility === "training"/);
  assert.doesNotMatch(progression, /"training"/);
  assert.match(progression, /researchDepth: 7/);
  assert.match(progression, /inferHallLevelFromNodes/);
  assert.match(hub, /길드 건물 선택/);
  assert.match(researchMap, /길드 공세/);
  assert.match(researchMap, /연계 전술/);
  assert.match(researchMap, /원정 지원/);
  assert.match(researchMap, /길드 경영/);
  assert.match(researchMap, /본관 Lv\.\$\{requiredHallLevel\} 필요/);
});

test("turns equipped guild members into the weapons without field character bodies", async () => {
  const [game, hub, gameData, css] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/GuildBuildingHub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/game-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(hub, /forgeBuildingArt/);
  assert.doesNotMatch(game, /<ForgeWorkshop/);
  assert.doesNotMatch(game, /weaponLevel/);
  assert.match(gameData, /MEMBER_COMBAT_TRAITS/);
  assert.match(game, /marksmanVolley/);
  assert.match(game, /arcaneBurst/);
  assert.match(game, /combat-trait-grid/);
  assert.match(game, /emitMemberWeaponFx/);
  assert.match(game, /member-weapon-layer/);
  assert.match(game, /equipped-member-weapons/);
  assert.doesNotMatch(game, /<WeaponCursor/);
  assert.doesNotMatch(game, /click-attack-fx/);
  assert.doesNotMatch(game, /className="fighters"/);
  assert.doesNotMatch(game, /memberAnimationSource/);
  assert.match(css, /weapon-style-vanguard/);
  assert.match(css, /weapon-style-marksman/);
  assert.match(css, /weapon-style-arcane/);
});

test("consolidates recruitment and party formation inside the portrait-driven tavern", async () => {
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
  assert.match(tavern, /BUILD YOUR SWARM/);
  assert.match(tavern, /장착 길드원 무기/);
  assert.match(tavern, /필드에는 본체 없이/);
  assert.match(tavern, /보유 길드원 무기/);
  assert.match(tavern, /onToggleParty/);
  assert.match(tavern, /finnCorrection/);
  assert.match(tavern, /-idle-preview\.webp/);
  assert.match(tavernStyles, /\.heroPortrait/);
  assert.match(tavernStyles, /\.candidateRail/);
  assert.match(tavernStyles, /\.partySlots/);
  assert.match(tavernStyles, /\.ownedRoster/);
  assert.match(tavernStyles, /--portrait-scale/);
});
