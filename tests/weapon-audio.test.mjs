import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/weapon-audio.ts", import.meta.url), "utf8");
const component = await readFile(new URL("../app/WeaponAttackAudio.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("15개 무기에 각각 고유한 사운드 프로필이 있다", () => {
  const profileSection = source.slice(source.indexOf("WEAPON_SOUND_PROFILES"), source.indexOf("] as const satisfies"));
  const tiers = [...profileSection.matchAll(/tier: (\d+)/g)].map((match) => Number(match[1]));
  const signatures = [...profileSection.matchAll(/signature: "([^"]+)"/g)].map((match) => match[1]);
  const expectedWeapons = [
    "훈련용 장검", "초승달 도", "쌍날검", "룬 파쇄검", "천공검",
    "성운도", "용맥검", "천상검", "혈월도", "폭풍쌍검",
    "성휘 대검", "심연검", "시간절단검", "세계수 성검", "길드마스터 신검",
  ];

  assert.deepEqual(tiers, Array.from({ length: 15 }, (_, index) => index));
  assert.equal(new Set(signatures).size, 15);
  expectedWeapons.forEach((weapon) => assert.match(profileSection, new RegExp(`weaponName: "${weapon}"`)));
});

test("상위 단계일수록 충격, 광택, 공간 레이어가 풍부해진다", () => {
  const profileSection = source.slice(source.indexOf("WEAPON_SOUND_PROFILES"), source.indexOf("] as const satisfies"));
  const rows = [...profileSection.matchAll(/tier: (\d+).*?impact: ([\d.]+).*?brilliance: ([\d.]+), space: ([\d.]+)/g)]
    .map((match) => ({ tier: Number(match[1]), impact: Number(match[2]), brilliance: Number(match[3]), space: Number(match[4]) }));

  assert.equal(rows.length, 15);
  for (let index = 1; index < rows.length; index += 1) {
    assert.ok(rows[index].impact > rows[index - 1].impact, `tier ${index} impact`);
    assert.ok(rows[index].brilliance > rows[index - 1].brilliance, `tier ${index} brilliance`);
    assert.ok(rows[index].space > rows[index - 1].space, `tier ${index} space`);
  }
  assert.match(source, /profile\.tier >= 4/);
  assert.match(source, /profile\.tier >= 7/);
  assert.match(source, /profile\.tier >= 10/);
  assert.match(source, /profile\.tier >= 13/);
  assert.match(source, /createDynamicsCompressor/);
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
