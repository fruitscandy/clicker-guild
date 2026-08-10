import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/weapon-audio.ts", import.meta.url), "utf8");
const component = await readFile(new URL("../app/WeaponAttackAudio.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const license = await readFile(new URL("../public/assets/audio/weapons/LICENSE.md", import.meta.url), "utf8");

test("15단계가 하나의 검 타격 언어로 점진적으로 성장한다", () => {
  const profileSection = source.slice(source.indexOf("WEAPON_SOUND_PROFILES"), source.indexOf("] as const satisfies"));
  const tiers = [...profileSection.matchAll(/tier: (\d+)/g)].map((match) => Number(match[1]));
  const impactWeights = [...profileSection.matchAll(/impactWeight: "([^"]+)"/g)].map((match) => match[1]);
  const expectedWeapons = [
    "훈련용 장검", "초승달 도", "쌍날검", "룬 파쇄검", "천공검",
    "성운도", "용맥검", "천상검", "혈월도", "폭풍쌍검",
    "성휘 대검", "심연검", "시간절단검", "세계수 성검", "길드마스터 신검",
  ];

  assert.deepEqual(tiers, Array.from({ length: 15 }, (_, index) => index));
  assert.deepEqual([...new Set(impactWeights)], ["light", "medium", "heavy"]);
  expectedWeapons.forEach((weapon) => assert.match(profileSection, new RegExp(`weaponName: "${weapon}"`)));
  assert.doesNotMatch(source, /WeaponSoundSignature|case "nebula"|case "dragon"|case "abyss"/);
});

test("모든 단계에서 실제 칼날·충격 레이어의 무게와 폭이 증가한다", () => {
  const profileSection = source.slice(source.indexOf("WEAPON_SOUND_PROFILES"), source.indexOf("] as const satisfies"));
  const rows = [...profileSection.matchAll(/tier: (\d+).*?swingGain: ([\d.]+), impactGain: ([\d.]+), bodyGain: ([\d.]+), ringGain: ([\d.]+), subGain: ([\d.]+), width: ([\d.]+), tail: ([\d.]+)/g)]
    .map((match) => ({ tier: Number(match[1]), values: match.slice(2).map(Number) }));

  assert.equal(rows.length, 15);
  for (let index = 1; index < rows.length; index += 1) {
    rows[index].values.forEach((value, field) => {
      assert.ok(value > rows[index - 1].values[field], `tier ${index}, progressive field ${field}`);
    });
  }
  assert.match(source, /profile\.tier >= 9/);
  assert.match(source, /profile\.tier >= 12/);
  assert.match(source, /profile\.tier >= 14/);
  assert.match(source, /createDynamicsCompressor/);
  assert.match(source, /activeBursts/);
});

test("CC0 실녹음 원음 15개를 칼날·금속·중량·울림으로 레이어링한다", async () => {
  const assetPaths = [...source.matchAll(/"(\/assets\/audio\/weapons\/[^/"]+\.ogg)"/g)].map((match) => match[1]);
  assert.equal(assetPaths.length, 15);
  assert.equal(new Set(assetPaths).size, 15);
  for (const assetPath of assetPaths) {
    const url = new URL(`../public${assetPath}`, import.meta.url);
    await access(url);
    assert.ok((await stat(url)).size > 5000, assetPath);
  }
  assert.match(source, /decodeAudioData/);
  assert.match(source, /bank\.swings/);
  assert.match(source, /bank\.bodies/);
  assert.match(source, /bank\.rings/);
  assert.match(license, /Creative Commons Zero|CC0/);
  assert.match(license, /kenney\.nl\/assets\/rpg-audio/);
  assert.match(license, /kenney\.nl\/assets\/impact-sounds/);
});

test("실험 모드에서 OpenGameArt CC0 샘플 15개를 무기 단계에 일대일 대응한다", async () => {
  const auditionSection = source.slice(source.indexOf("WEAPON_AUDITION_ASSETS"), source.indexOf("] as const;", source.indexOf("WEAPON_AUDITION_ASSETS")));
  const auditionPaths = [...auditionSection.matchAll(/"(\/assets\/audio\/weapons\/audition\/[^\"]+\.(?:wav|ogg))"/g)].map((match) => match[1]);

  assert.equal(auditionPaths.length, 15);
  assert.equal(new Set(auditionPaths).size, 15);
  assert.match(source, /WEAPON_AUDITION_MODE = true/);
  assert.match(source, /bank\.audition\[profile\.tier\]/);
  for (const assetPath of auditionPaths) {
    const url = new URL(`../public${assetPath}`, import.meta.url);
    await access(url);
    assert.ok((await stat(url)).size > 5000, assetPath);
  }
  assert.match(license, /Temporary OpenGameArt audition set/);
  assert.match(license, /opengameart\.org\/content\/rpg-sound-pack/);
  assert.match(license, /Creative Commons Zero|CC0/);
});

test("전투 중 전장 클릭과 수동 공격 버튼만 사운드를 발생시킨다", () => {
  assert.match(source, /\.hack-arena/);
  assert.match(source, /\.attack-button/);
  assert.match(source, /attackButton\.disabled/);
  assert.match(source, /click-style-\(\\d\+\)/);
  assert.match(source, /addEventListener\("pointerdown"/);
  assert.match(source, /guild:weapon-attack-sound/);
});

test("클라이언트 오디오 컨트롤러가 앱 전체에 한 번 마운트된다", () => {
  assert.match(component, /^"use client";/);
  assert.match(component, /useEffect\(\(\) => installWeaponAttackAudio\(\), \[\]\)/);
  assert.match(layout, /<WeaponAttackAudio \/>/);
});

test("무기 공격음이 전역 효과음 음량과 음소거를 실시간으로 따른다", () => {
  assert.match(source, /effectiveSfxVolume/);
  assert.match(source, /readAudioSettings/);
  assert.match(source, /subscribeAudioSettings/);
  assert.match(source, /WEAPON_MIX_GAIN \* effectiveSfxVolume\(readAudioSettings\(\)\)/);
  assert.match(source, /WEAPON_MIX_GAIN \* effectiveSfxVolume\(settings\)/);
  assert.match(source, /bus\.master\.gain\.setTargetAtTime/);
  assert.match(source, /unsubscribeAudioSettings\(\)/);
  assert.doesNotMatch(source, /master\.gain\.value = 0\.82/);
});
