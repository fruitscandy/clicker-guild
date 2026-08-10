import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const sourceUrl = new URL("../app/special-attacks.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const special = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`);

const monsters = Array.from({ length: 14 }, (_, index) => ({
  id: `monster-${index}`,
  x: 42 + index % 5 * 3,
  y: 40 + Math.floor(index / 5) * 4,
  hp: 100,
}));

test("특수 연구는 본관 2·3·4단계에서 독립 해금되는 세 비술이다", () => {
  assert.deepEqual(special.SPECIAL_ATTACK_ORDER, ["lightning", "tornado", "meteor"]);
  assert.deepEqual(special.SPECIAL_RESEARCH_NODES.map((node) => node.id), [
    "special-lightning-2",
    "special-tornado-3",
    "special-meteor-4",
  ]);
  assert.deepEqual(Object.values(special.SPECIAL_ATTACKS).map((attack) => attack.hallLevel), [2, 3, 4]);
  assert.deepEqual(special.unlockedSpecialAttacks(["foundation", "special-tornado-3"]), ["tornado"]);
  assert.deepEqual(Object.values(special.SPECIAL_ATTACKS).map((attack) => attack.cooldownMs), [2_000, 4_000, 6_000]);
  assert.deepEqual(Object.values(special.SPECIAL_ATTACKS).map((attack) => attack.cost), [1_300, 3_600, 8_400]);
  assert.equal(Object.values(special.SPECIAL_ATTACKS).every((attack) => !/[\u3400-\u9fff]/u.test(attack.glyph)), true);
});

test("번개는 밀집 지점을 선택하고 최대 7체만 연쇄 감전시킨다", () => {
  const center = special.selectSpecialAttackCenter(monsters, "lightning");
  const targets = special.targetsForSpecialAttack(monsters, "lightning", center);
  assert.ok(center.x >= 42 && center.x <= 54);
  assert.ok(center.y >= 40 && center.y <= 48);
  assert.equal(targets.length, 7);
  assert.equal(new Set(targets).size, 7);
  assert.equal(special.specialAttackDamage("lightning", 100), 215);
});

test("토네이도는 몬스터를 회전시키며 중심 쪽으로 세 차례 끌어당긴다", () => {
  const center = { x: 50, y: 46 };
  const before = monsters.find((monster) => monster.id === "monster-0");
  let current = before;
  const pulseDistances = [0, 1, 2].map((pulse) => {
    const field = monsters.map((monster) => monster.id === current.id ? current : monster);
    current = { ...current, ...special.displacedSpecialTargets(field, "tornado", center, pulse)[current.id] };
    return special.fieldDistance(current, center);
  });
  assert.ok(pulseDistances[0] < special.fieldDistance(before, center));
  assert.ok(pulseDistances[1] < pulseDistances[0]);
  assert.ok(pulseDistances[2] < pulseDistances[1]);
  const pulseDamage = [0, 1, 2].map((pulse) => special.specialAttackDamage("tornado", 100, pulse));
  assert.deepEqual(pulseDamage, [51, 64, 80]);
  assert.equal(pulseDamage.reduce((sum, damage) => sum + damage, 0), 195);
});

test("운석 넉백은 충돌점 바깥으로 밀되 전장 경계를 절대 넘지 않는다", () => {
  const center = { x: 50, y: 50 };
  const close = { id: "close", x: 54, y: 50, hp: 100 };
  const knocked = special.displacedSpecialTargets([close], "meteor", center)[close.id];
  assert.ok(special.fieldDistance(knocked, center) > special.fieldDistance(close, center) + 14);
  const edgeMonsters = [
    { id: "left", x: 7.2, y: 50, hp: 100 },
    { id: "right", x: 92.8, y: 50, hp: 100 },
    { id: "top", x: 50, y: 11.2, hp: 100 },
    { id: "bottom", x: 50, y: 88.8, hp: 100 },
  ];
  for (const monster of edgeMonsters) {
    const moved = special.displacedSpecialTargets([monster], "meteor", { x: monster.x, y: monster.y })[monster.id];
    assert.ok(moved.x >= 7 && moved.x <= 93, `${monster.id} x=${moved.x}`);
    assert.ok(moved.y >= 11 && moved.y <= 89, `${monster.id} y=${moved.y}`);
  }
  assert.equal(special.specialAttackDamage("meteor", 100), 465);
});

test("새 특수공격 원화만으로 전장 연출을 구성하고 기존 합성 레이어는 제거한다", async () => {
  const [layer, layerStyles, canvas, panel, panelStyles, audio] = await Promise.all([
    readFile(new URL("../app/SpecialAttackLayer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SpecialAttackLayer.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/SpecialAttackCanvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guild-hub/SpecialResearchPanel.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/special-attack-audio.ts", import.meta.url), "utf8"),
  ]);
  assert.match(layer, /LightningEffect/);
  assert.match(layer, /TornadoEffect/);
  assert.match(layer, /MeteorEffect/);
  assert.match(layer, /SpecialAttackCanvas/);
  assert.match(layer, /kind="lightning"/);
  assert.match(layer, /kind="tornado"/);
  assert.match(layer, /kind="meteor"/);
  assert.match(layer, /specialMonsterEffectStyle/);
  assert.doesNotMatch(layer, /effectTitle|--spell-art|attack\.art/);
  assert.doesNotMatch(panel, /--spell-art|attack\.art/);
  assert.doesNotMatch(`${layer}\n${layerStyles}`, /special-(?:lightning|tornado|meteor)-v2|(?:tornado-twirl|meteor-explosion|lightning-arc)\.png/);
  assert.doesNotMatch(layer, /<img|special-(?:lightning-impact|tornado-funnel|meteor-impact)-v3-alpha\.webp/);
  assert.match(layerStyles, /\.lightningCanvas/);
  assert.match(layerStyles, /\.tornadoCanvas/);
  assert.match(layerStyles, /\.meteorCanvas/);
  assert.match(canvas, /requestAnimationFrame/);
  assert.match(canvas, /createLightningModel/);
  assert.match(canvas, /groundBranches/);
  assert.match(canvas, /createTornadoModel/);
  assert.match(canvas, /particle\.angle \+ seconds \* particle\.speed/);
  assert.match(canvas, /drawMeteorFlight/);
  assert.match(canvas, /drawMeteorImpact/);
  assert.match(canvas, /globalCompositeOperation = "lighter"/);
  assert.match(canvas, /MAX_CANVAS_RATIO = 1\.25/);
  assert.match(canvas, /createEffectSprite/);
  assert.match(canvas, /drawImage\(assets\.trail/);
  assert.match(canvas, /drawImage\(assets\.smoke/);
  assert.doesNotMatch(canvas, /context\.filter = "blur/);
  assert.doesNotMatch(layerStyles, /\.meteorStage::after/);
  assert.doesNotMatch(layerStyles, /\.tornadoCanvas\s*\{[^}]*filter:/s);
  assert.match(layerStyles, /monsterElectricCage/);
  assert.match(layerStyles, /monsterTornadoPull/);
  assert.match(layerStyles, /monsterMeteorKnockback/);
  assert.match(layer, /specialMonsterClassName/);
  assert.match(panel, /특수 공격/);
  assert.match(panel, /previewArtwork/);
  assert.match(panel, /special-lightning-v3\.webp/);
  assert.match(panel, /special-tornado-v3\.webp/);
  assert.match(panel, /special-meteor-v3\.webp/);
  assert.match(panelStyles, /\.previewArtwork/);
  assert.match(panelStyles, /@keyframes previewSheen/);
  for (const kind of ["lightning", "tornado", "meteor"]) {
    const artwork = await readFile(new URL(`../public/assets/vfx/special/special-${kind}-v3.webp`, import.meta.url));
    assert.ok(artwork.byteLength > 50_000, `${kind} node art`);
  }
  assert.doesNotMatch(panel, /연결선 없는 독립 노드|detailGlyph/);
  assert.match(audio, /playLightning/);
  assert.match(audio, /playTornado/);
  assert.match(audio, /playMeteor/);
  assert.match(audio, /getSharedNoiseBuffer/);
  assert.match(audio, /source\.loop = true/);
});

test("길드 연구와 전투 화면이 특수 비술 모듈을 실제로 사용한다", async () => {
  const [game, controller, globalStyles] = await Promise.all([
    readFile(new URL("../app/Game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/special-attack-controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(game, /SPECIAL_RESEARCH_NODES/);
  assert.match(game, /<SpecialResearchPanel/);
  assert.match(game, /<SpecialAttackLayer/);
  assert.match(game, /specialMonsterClassName/);
  assert.match(game, /specialMonsterEffectStyle/);
  assert.match(controller, /displacedSpecialTargets/);
  assert.match(controller, /moveTargets\(kind, center, targetIds, pulse\);\s+damageMonsters/);
  assert.match(controller, /playSpecialAttackSound/);
  assert.match(controller, /FIRST_CAST_DELAY/);
  assert.match(controller, /attack\.delayMs \+ 620 \+ pulse \* 520/);
  assert.match(game, /key=\{monster\.id\}/);
  assert.match(game, /hit-cycle-/);
  assert.doesNotMatch(game, /key=\{`\$\{monster\.id\}-\$\{monster\.hitId\}`\}/);
  assert.match(globalStyles, /packMonsterHeavyHitAlternate/);
});
