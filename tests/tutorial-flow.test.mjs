import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("guides a new guild from the first hunt through the first weapon craft", async () => {
  const [game, opening, tutorial, tutorialState, styles, stageMap, hub, tavern, forge] = await Promise.all([
    readFile(new URL("app/Game.tsx", root), "utf8"),
    readFile(new URL("app/opening/OpeningGate.tsx", root), "utf8"),
    readFile(new URL("app/tutorial/GameTutorial.tsx", root), "utf8"),
    readFile(new URL("app/tutorial/tutorial-state.ts", root), "utf8"),
    readFile(new URL("app/tutorial/GameTutorial.module.css", root), "utf8"),
    readFile(new URL("app/stage-map/StageMap.tsx", root), "utf8"),
    readFile(new URL("app/guild-hub/GuildBuildingHub.tsx", root), "utf8"),
    readFile(new URL("app/guild-hub/TavernHall.tsx", root), "utf8"),
    readFile(new URL("app/guild-hub/ForgeWorkshop.tsx", root), "utf8"),
  ]);

  for (const step of ["hunt", "stage", "battle", "return", "tavern", "recruit", "recruitResult", "forge", "upgrade", "complete", "done"]) {
    assert.match(tutorialState, new RegExp(`"${step}"`));
  }

  assert.match(opening, /TUTORIAL_START_EVENT/);
  assert.match(opening, /dispatchEvent/);
  assert.match(game, /tutorialStep: "hunt"/);
  assert.match(game, /owned: \[\]/);
  assert.match(game, /party: \[\]/);
  assert.match(game, /progress: \{\}/);
  assert.match(game, /loadedTutorialStep[\s\S]*?"done"/);
  assert.match(game, /recoverTutorialStep/);
  assert.match(tutorialState, /step === "stage" \|\| step === "battle" \|\| step === "retry"/);
  assert.doesNotMatch(game, /출전할 길드원이 없습니다/);
  assert.match(game, /tutorialFirstBattle \? 90/);
  assert.match(game, /tutorialFreeTen \? 0/);
  assert.match(game, /party: tutorialFreeTen \? settlement\.newMemberIds\.slice\(0, 4\)/);
  assert.match(game, /tutorialStep: tutorialFreeTen \? "recruitResult"/);
  assert.match(game, /current\.tutorialStep === "upgrade" \? "complete"/);
  assert.match(game, /<GameTutorial/);

  assert.match(tutorial, /사냥터로 이동하세요/);
  assert.match(tutorial, /스테이지 1-1을 선택하세요/);
  assert.match(tutorial, /전장을 눌러 몬스터를 공격하세요/);
  assert.match(tutorial, /step === "battle"[\s\S]*?BATTLE_GUIDE_LIFT/);
  assert.match(tutorial, /무료 10연 영입을 진행하세요/);
  assert.match(tutorial, /첫 무기를 제작하세요/);
  assert.match(tutorial, /pointerdown/);
  assert.match(tutorial, /stopImmediatePropagation/);
  assert.match(tutorial, /ResizeObserver/);
  assert.match(tutorial, /MutationObserver/);

  assert.match(stageMap, /data-tutorial=\{stageNumber === 1 \? "stage-1"/);
  assert.match(hub, /facility-tavern/);
  assert.match(hub, /facility-forge/);
  assert.match(tavern, /data-tutorial="recruit-ten"/);
  assert.match(tavern, /튜토리얼 최초 1회 · 0 G/);
  assert.match(tavern, /data-tutorial="recruit-results"/);
  assert.match(forge, /data-tutorial="forge-upgrade"/);

  assert.match(styles, /\.blocker/);
  assert.match(styles, /pointer-events: auto/);
  assert.match(styles, /rgba\(3, 5, 5, \.82\)/);
  assert.match(styles, /spotlightPulse/);
  assert.match(styles, /prefers-reduced-motion/);
});
