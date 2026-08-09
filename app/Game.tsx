"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playLootCollectSound, playLootCompleteSound, playLootDropSound, unlockBattleAudio } from "./battle-audio";
import {
  createBattleLootPlan,
  GOLD_LOOT_TRAVEL_MS,
  goldLootStaggerMs,
  goldLootSweepDuration,
  revealedLootDrops,
  type BattleLootDrop,
} from "./battle-loot";
import { fieldAssetForRegion } from "./field-assets";
import { compactNumber, getStage, MEMBERS, RANK_ORDER, type MemberDefinition } from "./game-data";
import { ForgeWorkshop } from "./guild-hub/ForgeWorkshop";
import { GuildBuildingHub } from "./guild-hub/GuildBuildingHub";
import { ResearchMap, type ResearchNodeView } from "./guild-hub/ResearchMap";
import { TavernHall } from "./guild-hub/TavernHall";
import { GUILD_HALL_STAGES, guildHallStage, inferHallLevelFromNodes, requiredHallLevelForNode, type GuildFacility } from "./guild-hub/guild-progression";
import { WeaponCursor } from "./guild-hub/WeaponArt";
import { memberAnimationSource, type MemberMotion } from "./member-animations";
import { monsterAssetForStage } from "./monster-assets";
import { StageMap } from "./stage-map";
import { canAffordWeaponRecipe, consumeWeaponRecipe, materialIconVars, stageMaterialById, stageMaterialFor, weaponMaterialRecipe } from "./stage-materials";

type Tab = "guild" | "field";
type LootPhase = "idle" | "fighting" | "collecting" | "complete";
type MemberProgress = { level: number; xp: number; gear: number };
type UpgradeKey = "range" | "critical" | "combo" | "execution" | "shockwave" | "momentum" | "time" | "scout" | "guild" | "gold" | "tavern" | "loot";
type SpecialKey = "double" | "command" | "auto";
type ClickAttackPattern = {
  key: string;
  weaponName: string;
  title: string;
  subtitle: string;
  glyph: string;
  tier: number;
  visualHits: number;
  variants: number;
  duration: number;
  cost: number;
  damageScale: number;
};
type ClickAttackFx = {
  id: number;
  tier: number;
  variant: number;
  damage: number;
  automatic: boolean;
  doubled: boolean;
  critical: boolean;
  combo: boolean;
  shockwave: boolean;
  momentum: number;
  hitCount: number;
  targets: string[];
  x: number;
  y: number;
  radius: number;
};

type FieldMonster = {
  id: string;
  x: number;
  y: number;
  scale: number;
  hp: number;
  maxHp: number;
  hitId: number;
  lastHitAt: number;
  lastHitTier: number;
  defeatedAt: number | null;
  kind: "swarm" | "brute" | "mystic" | "leader";
};

type SaveState = {
  gold: number;
  materials: Record<string, number>;
  bossTokens: number;
  selectedStage: number;
  unlockedStage: number;
  cleared: number[];
  owned: string[];
  party: string[];
  progress: Record<string, MemberProgress>;
  guildHallLevel: number;
  weaponLevel: number;
  upgrades: Record<UpgradeKey, number>;
  nodes: string[];
  specials: Record<SpecialKey, boolean>;
  candidates: string[];
  autoAdvance: boolean;
};

const SAVE_KEY = "guildmaster-clicker-save-v1";
const NORMAL_BATTLE_SECONDS = 45;
const BOSS_BATTLE_SECONDS = 60;
const DEV_BATTLE_SECONDS = 300;
const DEV_GEAR_LEVEL = 99;
const DEV_POWER_MULTIPLIER = 500;
const MEMBER_ASSIST_FACTOR = .24;
const AUTO_ATTACK_FACTOR = .35;

const CLICK_ATTACK_PATTERNS: ClickAttackPattern[] = [
  { key: "training-strike", weaponName: "훈련용 장검", title: "견습 타격", subtitle: "묵직한 기본 일격", glyph: "검", tier: 0, visualHits: 1, variants: 1, duration: 620, cost: 0, damageScale: 1 },
  { key: "crescent-slash", weaponName: "초승달 도", title: "반월참", subtitle: "검기를 실은 넓은 베기", glyph: "◒", tier: 1, visualHits: 1, variants: 2, duration: 720, cost: 90, damageScale: 1.28 },
  { key: "cross-cut", weaponName: "쌍날검", title: "교차참", subtitle: "엇갈리는 2연속 참격", glyph: "×", tier: 2, visualHits: 2, variants: 2, duration: 820, cost: 220, damageScale: 1.68 },
  { key: "weakpoint-break", weaponName: "룬 파쇄검", title: "약점 파쇄", subtitle: "표식을 꿰뚫는 3단 베기", glyph: "◎", tier: 3, visualHits: 3, variants: 3, duration: 980, cost: 520, damageScale: 2.18 },
  { key: "sky-sword-array", weaponName: "천공검", title: "천공검진", subtitle: "길드마스터의 5연속 오의", glyph: "劍", tier: 4, visualHits: 5, variants: 4, duration: 1180, cost: 1100, damageScale: 2.85 },
  { key: "nebula-dance", weaponName: "성운도", title: "성운 난무", subtitle: "별빛 잔상을 남기는 7연참", glyph: "星", tier: 5, visualHits: 7, variants: 4, duration: 1320, cost: 2200, damageScale: 3.72 },
  { key: "dragon-vein-break", weaponName: "용맥검", title: "용맥 붕괴", subtitle: "번개와 검풍으로 전장을 가르는 9연격", glyph: "龍", tier: 6, visualHits: 9, variants: 4, duration: 1480, cost: 4200, damageScale: 4.88 },
  { key: "celestial-ruin", weaponName: "천상검", title: "천상 종언", subtitle: "천공의 룬과 낙검이 겹치는 12연 오의", glyph: "天", tier: 7, visualHits: 12, variants: 4, duration: 1680, cost: 7800, damageScale: 6.5 },
  { key: "blood-moon-eclipse", weaponName: "혈월도", title: "붉은 월식", subtitle: "핏빛 초승달이 겹쳐지는 13연참", glyph: "月", tier: 8, visualHits: 13, variants: 4, duration: 1740, cost: 14000, damageScale: 8.6 },
  { key: "storm-twin-dance", weaponName: "폭풍쌍검", title: "뇌광 연무", subtitle: "번개 궤적을 남기는 쌍검 난무", glyph: "雷", tier: 9, visualHits: 15, variants: 4, duration: 1800, cost: 24000, damageScale: 11.4 },
  { key: "radiant-judgment", weaponName: "성휘 대검", title: "성광 심판", subtitle: "빛의 기둥과 대검이 함께 낙하", glyph: "光", tier: 10, visualHits: 16, variants: 4, duration: 1880, cost: 40000, damageScale: 15.1 },
  { key: "abyss-sever", weaponName: "심연검", title: "공허 절단", subtitle: "전장을 가르는 검은 균열의 일격", glyph: "闇", tier: 11, visualHits: 18, variants: 4, duration: 1940, cost: 65000, damageScale: 20 },
  { key: "time-collapse", weaponName: "시간절단검", title: "찰나 붕괴", subtitle: "멈춘 시간 위로 모든 참격이 겹침", glyph: "時", tier: 12, visualHits: 20, variants: 4, duration: 2020, cost: 105000, damageScale: 26.5 },
  { key: "world-tree-wave", weaponName: "세계수 성검", title: "생명의 파동", subtitle: "거대한 생명 룬이 전장을 휩씀", glyph: "樹", tier: 13, visualHits: 22, variants: 4, duration: 2100, cost: 170000, damageScale: 35 },
  { key: "myriad-blades-one", weaponName: "길드마스터 신검", title: "만검귀일", subtitle: "수천 검광이 하나의 종언으로 수렴", glyph: "神", tier: 14, visualHits: 25, variants: 4, duration: 2200, cost: 280000, damageScale: 46.5 },
];

const CLICK_EFFECT_SPARKS = Array.from({ length: 12 }, (_, index) => index);
const CLICK_EFFECT_PARTICLES = Array.from({ length: 10 }, (_, index) => index);
const CLICK_EFFECT_BLADES = Array.from({ length: 9 }, (_, index) => index);
const WEAPON_MAX_LEVEL = CLICK_ATTACK_PATTERNS.length - 1;

function clickAttackPattern(level: number) {
  return CLICK_ATTACK_PATTERNS[Math.min(CLICK_ATTACK_PATTERNS.length - 1, Math.max(0, level))];
}

const initialState: SaveState = {
  gold: 160,
  materials: {},
  bossTokens: 0,
  selectedStage: 1,
  unlockedStage: 1,
  cleared: [],
  owned: ["roan"],
  party: ["roan"],
  progress: { roan: { level: 1, xp: 0, gear: 0 } },
  guildHallLevel: 1,
  weaponLevel: 0,
  upgrades: { range: 0, critical: 0, combo: 0, execution: 0, shockwave: 0, momentum: 0, time: 0, scout: 0, guild: 0, gold: 0, tavern: 0, loot: 0 },
  nodes: ["foundation"],
  specials: { double: false, command: false, auto: false },
  candidates: ["mia", "finn", "lulu"],
  autoAdvance: true,
};

const upgradeInfo: Record<UpgradeKey, { title: string; description: string; base: number; accent: string }> = {
  range: { title: "참격 범위", description: "클릭 공격 반경 +2.75", base: 110, accent: "원" },
  critical: { title: "치명타", description: "치명타 확률 +5%", base: 170, accent: "치" },
  combo: { title: "연격 리듬", description: "5번째 클릭 강화", base: 210, accent: "련" },
  execution: { title: "처형술", description: "빈사 몬스터 즉시 처치", base: 280, accent: "참" },
  shockwave: { title: "충격파", description: "일정 클릭마다 광역 파동", base: 320, accent: "파" },
  momentum: { title: "전투 몰입", description: "빠른 연속 클릭 피해 증가", base: 360, accent: "속" },
  time: { title: "원정 보급", description: "전투 제한 시간 +5초", base: 150, accent: "시" },
  scout: { title: "전장 정찰", description: "잔존 세력 추정 정밀화", base: 135, accent: "눈" },
  guild: { title: "길드 전술", description: "길드원 공격력 +15%", base: 140, accent: "기" },
  gold: { title: "행운의 금고", description: "토벌 골드 +10%", base: 180, accent: "금" },
  tavern: { title: "여관 증축", description: "상위 등급 후보 해금", base: 300, accent: "관" },
  loot: { title: "전리품 감정", description: "장비 획득 확률 +3%", base: 260, accent: "보" },
};

const UPGRADE_CAPS: Record<UpgradeKey, number> = { range: 7, critical: 4, combo: 4, execution: 3, shockwave: 3, momentum: 3, time: 4, scout: 3, guild: 5, gold: 4, tavern: 3, loot: 3 };

type UpgradeNode = {
  id: string;
  title: string;
  description: string;
  glyph: string;
  target?: UpgradeKey;
  cost: number;
  prerequisites: string[];
  x: number;
  y: number;
};

const UPGRADE_NODES: UpgradeNode[] = [
  { id: "foundation", title: "길드의 기반", description: "모든 성장 계통을 개방", glyph: "G", cost: 0, prerequisites: [], x: 7, y: 720 },

  { id: "shockwave-1", title: "검압 방출", description: "8번째 클릭마다 145% 광역 공격", glyph: "파", target: "shockwave", cost: 320, prerequisites: ["foundation"], x: 35, y: 70 },
  { id: "shockwave-2", title: "파동 증폭", description: "7번째 클릭마다 160% 광역 공격", glyph: "波", target: "shockwave", cost: 840, prerequisites: ["shockwave-1"], x: 59, y: 70 },
  { id: "shockwave-3", title: "천지 진동", description: "6번째 클릭마다 175% 광역 공격", glyph: "震", target: "shockwave", cost: 1900, prerequisites: ["shockwave-2"], x: 83, y: 70 },

  { id: "range-1", title: "긴 칼날 I", description: "공격 반경 +2.75", glyph: "원", target: "range", cost: 110, prerequisites: ["foundation"], x: 20, y: 200 },
  { id: "range-2", title: "긴 칼날 II", description: "공격 반경 +2.75", glyph: "◌", target: "range", cost: 210, prerequisites: ["range-1"], x: 31, y: 200 },
  { id: "range-3", title: "검풍 I", description: "공격 반경 +2.75", glyph: "풍", target: "range", cost: 390, prerequisites: ["range-2"], x: 42, y: 200 },
  { id: "range-4", title: "검풍 II", description: "공격 반경 +2.75", glyph: "환", target: "range", cost: 690, prerequisites: ["range-3"], x: 53, y: 200 },
  { id: "range-5", title: "대회전 베기", description: "공격 반경 +2.75", glyph: "旋", target: "range", cost: 1120, prerequisites: ["range-4"], x: 64, y: 200 },
  { id: "range-6", title: "폭풍의 검역", description: "공격 반경 +2.75", glyph: "嵐", target: "range", cost: 1780, prerequisites: ["range-5"], x: 75, y: 200 },
  { id: "range-7", title: "무한 검계", description: "공격 반경 +2.75", glyph: "界", target: "range", cost: 2800, prerequisites: ["range-6"], x: 86, y: 200 },

  { id: "crit-1", title: "약점 관찰 I", description: "치명타 확률 +5%", glyph: "치", target: "critical", cost: 170, prerequisites: ["foundation"], x: 29, y: 330 },
  { id: "crit-2", title: "약점 관찰 II", description: "치명타 확률 +5%", glyph: "점", target: "critical", cost: 380, prerequisites: ["crit-1"], x: 47, y: 330 },
  { id: "crit-3", title: "살기 감지", description: "치명타 확률 +5%", glyph: "살", target: "critical", cost: 820, prerequisites: ["crit-2"], x: 65, y: 330 },
  { id: "crit-4", title: "필중의 눈", description: "치명타 확률 +5%", glyph: "眼", target: "critical", cost: 1650, prerequisites: ["crit-3"], x: 83, y: 330 },

  { id: "combo-1", title: "호흡 맞추기", description: "5번째 클릭 피해 강화", glyph: "련", target: "combo", cost: 210, prerequisites: ["foundation"], x: 29, y: 460 },
  { id: "combo-2", title: "연격 박자", description: "연격 추가 피해 +10%", glyph: "연", target: "combo", cost: 470, prerequisites: ["combo-1"], x: 47, y: 460 },
  { id: "combo-3", title: "끊김 없는 검", description: "연격 추가 피해 +10%", glyph: "속", target: "combo", cost: 980, prerequisites: ["combo-2"], x: 65, y: 460 },
  { id: "combo-4", title: "폭풍 연무", description: "연격 추가 피해 +10%", glyph: "舞", target: "combo", cost: 1900, prerequisites: ["combo-3"], x: 83, y: 460 },

  { id: "execute-1", title: "빈틈 포착", description: "체력 7% 이하 즉시 처형", glyph: "참", target: "execution", cost: 280, prerequisites: ["foundation"], x: 35, y: 590 },
  { id: "execute-2", title: "사형 선고", description: "처형 기준 +2%", glyph: "断", target: "execution", cost: 760, prerequisites: ["execute-1"], x: 59, y: 590 },
  { id: "execute-3", title: "죽음의 문턱", description: "처형 기준 +2%", glyph: "滅", target: "execution", cost: 1750, prerequisites: ["execute-2"], x: 83, y: 590 },

  { id: "time-1", title: "휴대 식량", description: "전투 제한 시간 +5초", glyph: "시", target: "time", cost: 150, prerequisites: ["foundation"], x: 29, y: 720 },
  { id: "time-2", title: "원정 천막", description: "전투 제한 시간 +5초", glyph: "막", target: "time", cost: 390, prerequisites: ["time-1"], x: 47, y: 720 },
  { id: "time-3", title: "보급 마차", description: "전투 제한 시간 +5초", glyph: "차", target: "time", cost: 860, prerequisites: ["time-2"], x: 65, y: 720 },
  { id: "time-4", title: "왕실 보급로", description: "전투 제한 시간 +5초", glyph: "路", target: "time", cost: 1820, prerequisites: ["time-3"], x: 83, y: 720 },

  { id: "scout-1", title: "흔적 읽기", description: "전황 추정 1단계", glyph: "눈", target: "scout", cost: 135, prerequisites: ["foundation"], x: 35, y: 850 },
  { id: "scout-2", title: "정찰조", description: "전황 추정 2단계", glyph: "척", target: "scout", cost: 430, prerequisites: ["scout-1"], x: 59, y: 850 },
  { id: "scout-3", title: "매의 시야", description: "전황 추정 3단계", glyph: "鷹", target: "scout", cost: 1180, prerequisites: ["scout-2"], x: 83, y: 850 },

  { id: "guild-1", title: "전투 대형 I", description: "길드원 공격력 +15%", glyph: "진", target: "guild", cost: 140, prerequisites: ["foundation"], x: 23, y: 980 },
  { id: "guild-2", title: "전투 대형 II", description: "길드원 공격력 +15%", glyph: "旗", target: "guild", cost: 340, prerequisites: ["guild-1"], x: 38, y: 980 },
  { id: "guild-3", title: "합동 훈련", description: "길드원 공격력 +15%", glyph: "합", target: "guild", cost: 720, prerequisites: ["guild-2"], x: 53, y: 980 },
  { id: "guild-4", title: "정예 토벌대", description: "길드원 공격력 +15%", glyph: "★", target: "guild", cost: 1450, prerequisites: ["guild-3"], x: 68, y: 980 },
  { id: "guild-5", title: "영웅의 군세", description: "길드원 공격력 +15%", glyph: "軍", target: "guild", cost: 2700, prerequisites: ["guild-4"], x: 83, y: 980 },

  { id: "gold-1", title: "보급 계약 I", description: "토벌 골드 +10%", glyph: "금", target: "gold", cost: 180, prerequisites: ["foundation"], x: 29, y: 1110 },
  { id: "gold-2", title: "보급 계약 II", description: "토벌 골드 +10%", glyph: "◇", target: "gold", cost: 420, prerequisites: ["gold-1"], x: 47, y: 1110 },
  { id: "gold-3", title: "상단 교역로", description: "토벌 골드 +10%", glyph: "상", target: "gold", cost: 920, prerequisites: ["gold-2"], x: 65, y: 1110 },
  { id: "gold-4", title: "황금 길드", description: "토벌 골드 +10%", glyph: "財", target: "gold", cost: 1880, prerequisites: ["gold-3"], x: 83, y: 1110 },

  { id: "loot-1", title: "전리품 감정 I", description: "장비 획득 확률 +3%", glyph: "보", target: "loot", cost: 260, prerequisites: ["foundation"], x: 35, y: 1240 },
  { id: "loot-2", title: "전리품 감정 II", description: "장비 획득 확률 +3%", glyph: "♣", target: "loot", cost: 680, prerequisites: ["loot-1"], x: 59, y: 1240 },
  { id: "loot-3", title: "보물 사냥단", description: "장비 획득 확률 +3%", glyph: "寶", target: "loot", cost: 1520, prerequisites: ["loot-2"], x: 83, y: 1240 },

  { id: "tavern-1", title: "여관 증축 I", description: "고용 가능 등급 상승", glyph: "관", target: "tavern", cost: 300, prerequisites: ["foundation"], x: 35, y: 1370 },
  { id: "tavern-2", title: "여관 증축 II", description: "고용 가능 등급 상승", glyph: "잔", target: "tavern", cost: 820, prerequisites: ["tavern-1"], x: 59, y: 1370 },
  { id: "tavern-3", title: "영웅의 주점", description: "고용 가능 등급 상승", glyph: "杯", target: "tavern", cost: 1800, prerequisites: ["tavern-2"], x: 83, y: 1370 },

  { id: "momentum-1", title: "전투 호흡", description: "빠른 연속 클릭으로 최대 13% 피해 증가", glyph: "속", target: "momentum", cost: 360, prerequisites: ["foundation"], x: 35, y: 1500 },
  { id: "momentum-2", title: "무아지경", description: "몰입 중 최대 35% 피해 증가", glyph: "無", target: "momentum", cost: 940, prerequisites: ["momentum-1"], x: 59, y: 1500 },
  { id: "momentum-3", title: "찰나의 극의", description: "몰입 중 최대 68% 피해 증가", glyph: "極", target: "momentum", cost: 2150, prerequisites: ["momentum-2"], x: 83, y: 1500 },

  { id: "citadel", title: "전설의 길드 성채", description: "모든 성장 계통을 완성한 증표", glyph: "♛", cost: 6200, prerequisites: ["shockwave-3", "range-7", "crit-4", "combo-4", "execute-3", "time-4", "scout-3", "guild-5", "gold-4", "loot-3", "tavern-3", "momentum-3"], x: 94, y: 720 },
];

const BIOME_DETAILS: Record<string, { label: string; description: string }> = {
  forest: { label: "이끼 숲길", description: "수풀과 고목 사이로 햇살이 드는 초록 전장" },
  desert: { label: "붉은 모래벌", description: "선인장과 바위가 흩어진 뜨거운 황야" },
  swamp: { label: "독안개 수렁", description: "버섯과 웅덩이에서 보랏빛 안개가 피어나는 늪" },
  mine: { label: "수정 채굴장", description: "광차와 광맥이 남은 어두운 갱도" },
  ice: { label: "서리 빙판", description: "눈 덮인 침엽수와 얼음 결정이 빛나는 협곡" },
  volcano: { label: "용암 분지", description: "갈라진 지면 사이로 불꽃과 용암이 솟는 산맥" },
  grave: { label: "망자의 묘역", description: "비석과 마른 나무 너머로 안개가 흐르는 묘지" },
  storm: { label: "마력 폭풍핵", description: "룬과 마력 수정이 공중에 떠오르는 불안정 지대" },
  fort: { label: "마왕군 전초선", description: "부서진 성벽과 보급 상자가 남은 요새 앞마당" },
  dragon: { label: "고룡의 제단", description: "용의 뼈와 고대 수정이 잠든 성역" },
};

const specialInfo: Record<SpecialKey, { title: string; description: string }> = {
  double: { title: "쌍격", description: "직접 공격이 항상 두 번 적중합니다." },
  command: { title: "지휘관의 명령", description: "10회 클릭마다 전원이 즉시 공격합니다." },
  auto: { title: "자동 지휘", description: "2초마다 직접 공격이 자동 발동합니다." },
};

function memberById(id: string) {
  return MEMBERS.find((member) => member.id === id)!;
}

function attackFor(member: MemberDefinition, progress: MemberProgress | undefined) {
  const state = progress ?? { level: 1, xp: 0, gear: 0 };
  return member.attack + member.growth * (state.level - 1) + state.gear * (4 + RANK_ORDER.indexOf(member.rank) * 5);
}

function randomCandidates(state: SaveState, count = 3) {
  const maxRank = Math.min(6, 1 + state.upgrades.tavern);
  const pool = MEMBERS.filter((member) => !state.owned.includes(member.id) && RANK_ORDER.indexOf(member.rank) <= maxRank);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((member) => member.id);
}

function spawnMonsterPack(stage: ReturnType<typeof getStage>): FieldMonster[] {
  const count = Math.min(24, 7 + stage.localStage + Math.floor(stage.stage / 20) * 2 + (stage.boss ? 5 : 0));
  const weights = Array.from({ length: count }, (_, index) => stage.boss && index === 0 ? 5 : index % 7 === 0 ? 1.75 : .82 + index % 4 * .16);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const totalHp = Math.round(stage.hp * (stage.boss ? 1.75 : 1.5));

  return weights.map((weight, index) => {
    const maxHp = Math.max(4, Math.round(totalHp * weight / totalWeight));
    const kind: FieldMonster["kind"] = stage.boss && index === 0 ? "leader" : index % 7 === 0 ? "brute" : index % 5 === 0 ? "mystic" : "swarm";
    return {
      id: `${stage.stage}-monster-${index}`,
      x: 29 + (index * 37 + stage.stage * 13) % 63,
      y: 23 + (index * 29 + stage.stage * 7) % 61,
      scale: kind === "leader" ? 1.28 : kind === "brute" ? 1.05 : .72 + index % 4 * .08,
      hp: maxHp,
      maxHp,
      hitId: 0,
      lastHitAt: 0,
      lastHitTier: 0,
      defeatedAt: null,
      kind,
    };
  });
}

function distanceOnField(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, (a.y - b.y) * .72);
}

function bestAttackPoint(monsters: FieldMonster[], range: number) {
  const alive = monsters.filter((monster) => monster.hp > 0);
  if (!alive.length) return { x: 64, y: 50 };
  return alive.reduce((best, candidate) => {
    const score = alive.filter((monster) => distanceOnField(monster, candidate) <= range).length;
    return score > best.score ? { x: candidate.x, y: candidate.y, score } : best;
  }, { x: alive[0].x, y: alive[0].y, score: 0 });
}

function battlefieldIntel(alive: number, total: number, scoutLevel: number) {
  if (!total || alive <= 0) return "전장의 움직임이 완전히 멎었습니다.";
  const ratio = alive / total;
  if (scoutLevel <= 0) {
    if (ratio > .66) return "곳곳에서 발소리와 포효가 이어집니다.";
    if (ratio > .28) return "적의 소리가 줄었지만 사방에 기척이 남았습니다.";
    return "전장이 고요해졌지만 숨어 있는 기척이 느껴집니다.";
  }
  if (scoutLevel === 1) {
    if (ratio > .75) return "정찰조 판단: 적의 주력이 거의 온전합니다.";
    if (ratio > .45) return "정찰조 판단: 적의 절반가량이 전투 중입니다.";
    if (ratio > .18) return "정찰조 판단: 흩어진 잔당이 남았습니다.";
    return "정찰조 판단: 마지막 저항이 가까워 보입니다.";
  }
  const bands = scoutLevel >= 3 ? ["거의 전부", "약 3/4", "약 절반", "약 1/4", "한 줌"] : ["대부분", "절반 이상", "절반 안팎", "소수", "극소수"];
  const band = ratio > .82 ? bands[0] : ratio > .62 ? bands[1] : ratio > .38 ? bands[2] : ratio > .14 ? bands[3] : bands[4];
  return `정찰 보고: ${band}의 적이 아직 움직이는 것으로 추정됩니다.`;
}

function upgradeEffectText(key: UpgradeKey, level: number) {
  switch (key) {
    case "range": return `현재 공격 반경 ${(10 + level * 2.75).toFixed(1)}`;
    case "critical": return `치명타 ${Math.min(45, level * 5)}% · 피해 2배`;
    case "combo": return level ? `5번째 클릭 피해 +${35 + level * 10}%` : "연격 보너스 잠김";
    case "execution": return level ? `체력 ${5 + level * 2}% 이하 즉시 처형` : "처형 효과 잠김";
    case "shockwave": return level ? `${9 - level}번째 클릭마다 ${130 + level * 15}% 광역 파동` : "충격파 잠김";
    case "momentum": return level ? `빠른 클릭 최대 ${Math.round((3 + level * 2) * level * 2.5)}% 피해 증가` : "전투 몰입 잠김";
    case "time": return `전투 제한 시간 +${level * 5}초`;
    case "scout": return `잔존 세력 추정 정밀도 ${level}/3`;
    case "guild": return `길드원 공격력 +${Math.round((Math.pow(1.15, level) - 1) * 100)}%`;
    case "gold": return `토벌 골드 +${Math.round((Math.pow(1.1, level) - 1) * 100)}%`;
    case "tavern": return `고용 후보 최대 ${RANK_ORDER[Math.min(RANK_ORDER.length - 1, 1 + level)]}등급`;
    case "loot": return `장비 획득 확률 +${level * 3}%`;
  }
}

export default function Game() {
  const [save, setSave] = useState<SaveState>(initialState);
  const [tab, setTab] = useState<Tab>("guild");
  const [activeFacility, setActiveFacility] = useState<GuildFacility>("hall");
  const [hydrated, setHydrated] = useState(false);
  const [battleActive, setBattleActive] = useState(false);
  const [fieldMonsters, setFieldMonsters] = useState<FieldMonster[]>([]);
  const [now, setNow] = useState(0);
  const [stagePicker, setStagePicker] = useState(false);
  const [toast, setToast] = useState("첫 몬스터를 눌러 길드의 모험을 시작하세요!");
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [battleDeadline, setBattleDeadline] = useState<number | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const [developerToolsAvailable, setDeveloperToolsAvailable] = useState(false);
  const [developerStage, setDeveloperStage] = useState<number | null>(null);
  const [developerClickLevel, setDeveloperClickLevel] = useState(CLICK_ATTACK_PATTERNS.length - 1);
  const [clicks, setClicks] = useState(0);
  const [momentumStacks, setMomentumStacks] = useState(0);
  const [hitFx, setHitFx] = useState<ClickAttackFx | null>(null);
  const [memberFx, setMemberFx] = useState<Record<string, number>>({});
  const [memberSkillFx, setMemberSkillFx] = useState<Record<string, number>>({});
  const [skillFx, setSkillFx] = useState<string | null>(null);
  const [lostMembers, setLostMembers] = useState<string[]>([]);
  const [territoryPulse, setTerritoryPulse] = useState(0);
  const [lootDrops, setLootDrops] = useState<BattleLootDrop[]>([]);
  const [lootPhase, setLootPhase] = useState<LootPhase>("idle");
  const [collectedGold, setCollectedGold] = useState(0);
  const [collectedMaterial, setCollectedMaterial] = useState(0);
  const [plannedGold, setPlannedGold] = useState(0);
  const [plannedMaterial, setPlannedMaterial] = useState(0);
  const [weaponCursor, setWeaponCursor] = useState({ x: 50, y: 50, visible: false });
  const lastAttack = useRef<Record<string, number>>({});
  const lastSkill = useRef<Record<string, number>>({});
  const clickFxCounter = useRef(0);
  const clickCount = useRef(0);
  const momentumState = useRef({ lastAt: 0, stacks: 0 });
  const victoryLock = useRef(false);
  const rewardLock = useRef(false);
  const lootPlan = useRef<BattleLootDrop[]>([]);
  const lootDropsRef = useRef<BattleLootDrop[]>([]);
  const revealedLootIds = useRef(new Set<string>());
  const lootTimers = useRef<number[]>([]);

  const stageNumber = developerMode && developerStage ? developerStage : save.selectedStage;
  const stage = useMemo(() => getStage(stageNumber), [stageNumber]);
  const stageMaterial = useMemo(() => stageMaterialFor(stageNumber), [stageNumber]);
  const fieldAsset = useMemo(() => fieldAssetForRegion(stage.region.hue), [stage.region.hue]);
  const monsterAsset = useMemo(() => monsterAssetForStage(stageNumber), [stageNumber]);
  const partyMembers = useMemo(() => developerMode && !save.party.length ? [memberById("roan")] : save.party.map(memberById), [developerMode, save.party]);
  const progressFor = useCallback((member: MemberDefinition) => developerMode ? { level: member.maxLevel, xp: 0, gear: DEV_GEAR_LEVEL } : save.progress[member.id], [developerMode, save.progress]);
  const developerPower = developerMode ? DEV_POWER_MULTIPLIER : 1;
  const clickVisualLevel = developerMode ? developerClickLevel : save.weaponLevel;
  const activeClickPattern = clickAttackPattern(clickVisualLevel);
  const clickDamage = Math.round(12 * activeClickPattern.damageScale * developerPower);
  const attackRange = developerMode ? 31 : 10 + save.upgrades.range * 2.75;
  const criticalChance = developerMode ? .35 : Math.min(.45, save.upgrades.critical * .05);
  const executionThreshold = developerMode ? .13 : save.upgrades.execution ? .05 + save.upgrades.execution * .02 : 0;
  const shockwaveLevel = developerMode ? UPGRADE_CAPS.shockwave : save.upgrades.shockwave;
  const momentumLevel = developerMode ? UPGRADE_CAPS.momentum : save.upgrades.momentum;
  const momentumMaxStacks = momentumLevel ? 3 + momentumLevel * 2 : 0;
  const guildMultiplier = Math.pow(1.15, save.upgrades.guild);
  const goldMultiplier = Math.pow(1.1, save.upgrades.gold);
  const battleSeconds = developerMode ? DEV_BATTLE_SECONDS : (stage.boss ? BOSS_BATTLE_SECONDS : NORMAL_BATTLE_SECONDS) + save.upgrades.time * 5;
  const battleTimeLeft = battleDeadline ? Math.max(0, Math.ceil((battleDeadline - now) / 1000)) : battleSeconds;
  const lootCollecting = lootPhase === "collecting";
  const combatLocked = battleActive || lootCollecting || victory || defeat;
  const aliveMonsters = useMemo(() => fieldMonsters.filter((monster) => monster.hp > 0), [fieldMonsters]);
  const droppedGold = useMemo(() => lootDrops.reduce((sum, drop) => sum + (drop.kind === "gold" ? drop.amount : 0), 0), [lootDrops]);
  const droppedMaterial = useMemo(() => lootDrops.reduce((sum, drop) => sum + (drop.kind === "material" ? drop.amount : 0), 0), [lootDrops]);
  const lootSweepProgress = ((plannedGold ? collectedGold / plannedGold : 1) + (plannedMaterial ? collectedMaterial / plannedMaterial : 1)) / 2 * 100;
  const autoAttackPoint = useMemo(() => bestAttackPoint(aliveMonsters, attackRange), [aliveMonsters, attackRange]);
  const intelReport = battlefieldIntel(aliveMonsters.length, fieldMonsters.length, developerMode ? 3 : save.upgrades.scout);
  const hallStage = guildHallStage(save.guildHallLevel);
  const nextHallStage = GUILD_HALL_STAGES[save.guildHallLevel] ?? null;

  const combatPower = useMemo(() => {
    const partyPower = partyMembers.reduce((sum, member) => sum + attackFor(member, progressFor(member)) * developerPower, 0) * guildMultiplier;
    const playerUtility = 1 + attackRange / 20 + shockwaveLevel * .08 + momentumLevel * .1;
    return Math.round(clickDamage * playerUtility + partyPower * MEMBER_ASSIST_FACTOR);
  }, [partyMembers, progressFor, developerPower, clickDamage, guildMultiplier, attackRange, shockwaveLevel, momentumLevel]);

  /* eslint-disable react-hooks/set-state-in-effect -- Saved progress is intentionally restored after the client mounts. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw) as Partial<SaveState> & { upgrades?: Partial<Record<UpgradeKey, number>> & { click?: number } };
        const migratedUpgrades = (Object.keys(initialState.upgrades) as UpgradeKey[]).reduce((result, key) => ({ ...result, [key]: Math.min(UPGRADE_CAPS[key], loaded.upgrades?.[key] ?? 0) }), { ...initialState.upgrades });
        const migratedWeaponLevel = Math.min(WEAPON_MAX_LEVEL, Math.max(0, loaded.weaponLevel ?? loaded.upgrades?.click ?? 0));
        const knownNodes = (loaded.nodes ?? initialState.nodes).filter((id) => UPGRADE_NODES.some((node) => node.id === id));
        const validNodes = knownNodes.filter((id) => id !== "citadel" || UPGRADE_NODES.find((node) => node.id === "citadel")!.prerequisites.every((required) => knownNodes.includes(required)));
        const migratedNodes = validNodes.length ? validNodes : initialState.nodes;
        const inferredHallLevel = inferHallLevelFromNodes(migratedNodes);
        const migratedHallLevel = Math.min(GUILD_HALL_STAGES.length, Math.max(inferredHallLevel, loaded.guildHallLevel ?? 1));
        const migratedMaterials = Object.fromEntries(Object.entries(loaded.materials ?? {}).filter(([id, amount]) => stageMaterialById(id) && Number.isFinite(amount) && amount >= 0));
        setSave({ ...initialState, ...loaded, materials: migratedMaterials, guildHallLevel: migratedHallLevel, weaponLevel: migratedWeaponLevel, nodes: migratedNodes, upgrades: migratedUpgrades, specials: { ...initialState.specials, ...loaded.specials } });
      }
    } catch {
      setToast("저장 데이터를 불러오지 못해 새 게임으로 시작합니다.");
    }
    setHydrated(true);
    setDeveloperToolsAvailable(["localhost", "127.0.0.1"].includes(window.location.hostname));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save, hydrated]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  const clearLootTimers = useCallback(() => {
    lootTimers.current.forEach((timer) => window.clearTimeout(timer));
    lootTimers.current = [];
  }, []);

  useEffect(() => clearLootTimers, [clearLootTimers]);

  const finalizeVictory = useCallback(() => {
    if (rewardLock.current) return;
    rewardLock.current = true;
    setLootPhase("complete");
    setVictory(true);
    if (developerMode) {
      setToast("개발자 토벌 성공! 보상과 진행도는 저장되지 않습니다.");
      return;
    }
    const firstClear = !save.cleared.includes(stage.stage);
    const earnedGold = Math.round(stage.gold * goldMultiplier);
    const earnedMaterial = stageMaterial.rewardAmount;
    const gotGear = Math.random() < Math.min(0.45, 0.07 + save.upgrades.loot * 0.03);
    const gearTarget = gotGear && save.party.length ? save.party[Math.floor(Math.random() * save.party.length)] : null;

    setSave((current) => {
      const progress = { ...current.progress };
      current.party.forEach((id) => {
        const member = memberById(id);
        const before = progress[id] ?? { level: 1, xp: 0, gear: 0 };
        let level = before.level;
        let xp = before.xp + stage.xp;
        while (level < member.maxLevel && xp >= level * 55) {
          xp -= level * 55;
          level += 1;
        }
        progress[id] = { ...before, level, xp: level >= member.maxLevel ? 0 : xp, gear: before.gear + (gearTarget === id ? 1 : 0) };
      });
      return {
        ...current,
        gold: current.gold + earnedGold,
        materials: { ...current.materials, [stageMaterial.id]: (current.materials[stageMaterial.id] ?? 0) + earnedMaterial },
        bossTokens: current.bossTokens + (stage.boss && firstClear ? 1 : 0),
        cleared: firstClear ? [...current.cleared, stage.stage] : current.cleared,
        unlockedStage: firstClear ? Math.min(100, Math.max(current.unlockedStage, stage.stage + 1)) : current.unlockedStage,
        progress,
      };
    });

    setToast(`토벌 성공! 골드 ${compactNumber(earnedGold)} · ${stageMaterial.name} ${earnedMaterial}개${gearTarget ? ` · ${memberById(gearTarget).name} 장비 획득` : ""}${stage.boss && firstClear ? " · 보스 증표 +1" : ""}`);
  }, [developerMode, save.cleared, save.party, save.upgrades.loot, stage, stageMaterial, goldMultiplier]);

  const beginLootSweep = useCallback((drops: BattleLootDrop[]) => {
    if (victoryLock.current) return;
    victoryLock.current = true;
    clearLootTimers();
    setBattleActive(false);
    setBattleDeadline(null);
    setDefeat(false);
    setCollectedGold(0);
    setCollectedMaterial(0);
    setLootPhase("collecting");
    const sweepGold = drops.reduce((sum, drop) => sum + (drop.kind === "gold" ? drop.amount : 0), 0);
    const sweepMaterial = drops.reduce((sum, drop) => sum + (drop.kind === "material" ? drop.amount : 0), 0);
    setToast(`토벌 완료! 골드 ${compactNumber(sweepGold)}와 ${stageMaterial.name} ${sweepMaterial}개를 회수합니다.`);

    const stagger = goldLootStaggerMs(drops.length);
    drops.forEach((drop, index) => {
      const timer = window.setTimeout(() => {
        if (drop.kind === "gold") setCollectedGold((current) => current + drop.amount);
        else setCollectedMaterial((current) => current + drop.amount);
        playLootCollectSound(drop.soundProfile, index, drops.length);
      }, GOLD_LOOT_TRAVEL_MS + index * stagger);
      lootTimers.current.push(timer);
    });

    const completeTimer = window.setTimeout(() => {
      playLootCompleteSound();
      finalizeVictory();
    }, goldLootSweepDuration(drops.length));
    lootTimers.current.push(completeTimer);
  }, [clearLootTimers, finalizeVictory, stageMaterial.name]);

  const awardVictory = useCallback(() => {
    const revealedById = new Map(lootDropsRef.current.map((drop) => [drop.id, drop]));
    const drops = [
      ...lootDropsRef.current,
      ...lootPlan.current.filter((drop) => !revealedById.has(drop.id)).map((drop) => ({ ...drop, droppedAt: Date.now() })),
    ];
    lootDropsRef.current = drops;
    setLootDrops(drops);
    beginLootSweep(drops);
  }, [beginLootSweep]);

  useEffect(() => {
    if (!fieldMonsters.length || !lootPlan.current.length) return;
    const defeatedAt = new Map(
      fieldMonsters
        .filter((monster) => monster.defeatedAt !== null)
        .map((monster) => [monster.id, monster.defeatedAt!] as const),
    );
    const revealed = revealedLootDrops(lootPlan.current, defeatedAt);
    const newDrops = revealed.filter((drop) => !revealedLootIds.current.has(drop.id));
    if (!newDrops.length) return;

    const firstSoundIndex = revealedLootIds.current.size;
    newDrops.forEach((drop, index) => {
      revealedLootIds.current.add(drop.id);
      const timer = window.setTimeout(() => playLootDropSound(drop.soundProfile, firstSoundIndex + index), index * 28);
      lootTimers.current.push(timer);
    });
    lootDropsRef.current = revealed;
    setLootDrops(revealed);
  }, [fieldMonsters]);

  const failBattle = useCallback(() => {
    if (victoryLock.current) return;
    victoryLock.current = true;
    clearLootTimers();
    setBattleActive(false);
    setBattleDeadline(null);
    setVictory(false);
    setDefeat(true);
    setLootDrops([]);
    setLootPhase("idle");
    setCollectedGold(0);
    setCollectedMaterial(0);
    setPlannedGold(0);
    setPlannedMaterial(0);
    lootPlan.current = [];
    lootDropsRef.current = [];
    revealedLootIds.current.clear();
    const casualties = [...save.party];
    setLostMembers(casualties);
    if (!developerMode) {
      setSave((current) => {
        const lost = new Set(current.party);
        const progress = { ...current.progress };
        lost.forEach((id) => delete progress[id]);
        const next = { ...current, owned: current.owned.filter((id) => !lost.has(id)), party: [], progress, candidates: [] };
        return { ...next, candidates: randomCandidates(next) };
      });
    }
    setToast(developerMode ? "개발자 전투 실패 · 길드원 손실은 저장되지 않습니다." : "원정대가 전멸했습니다. 출전했던 길드원은 길드 명부에서 영구 삭제되었습니다.");
  }, [clearLootTimers, developerMode, save.party]);

  useEffect(() => {
    if (!battleActive || !battleDeadline || !aliveMonsters.length) return;
    const timer = window.setTimeout(failBattle, Math.max(0, battleDeadline - Date.now()));
    return () => window.clearTimeout(timer);
  }, [battleActive, battleDeadline, aliveMonsters.length, failBattle]);

  const damageMonsters = useCallback((targetIds: string[], damage: number, allowExecution = false, impactTier = 0) => {
    if (!targetIds.length) return;
    const targets = new Set(targetIds);
    const hitAt = Date.now();
    setFieldMonsters((current) => {
      const hadLivingTargets = current.some((monster) => monster.hp > 0 && targets.has(monster.id));
      const next = current.map((monster) => {
        if (monster.hp <= 0 || !targets.has(monster.id)) return monster;
        let hp = Math.max(0, monster.hp - Math.max(1, Math.round(damage)));
        if (allowExecution && executionThreshold > 0 && hp / monster.maxHp <= executionThreshold) hp = 0;
        return {
          ...monster,
          hp,
          hitId: monster.hitId + 1,
          lastHitAt: hitAt,
          lastHitTier: impactTier,
          defeatedAt: hp === 0 ? hitAt : monster.defeatedAt,
        };
      });
      if (hadLivingTargets && !next.some((monster) => monster.hp > 0)) window.setTimeout(awardVictory, 900);
      return next;
    });
  }, [awardVictory, executionThreshold]);

  useEffect(() => {
    if (!battleActive || tab !== "field" || !aliveMonsters.length) return;
    partyMembers.forEach((member, index) => {
      const attackMs = member.interval * 1000;
      const skillMs = member.skillCooldown * 1000;
      if (!lastAttack.current[member.id]) lastAttack.current[member.id] = now;
      if (!lastSkill.current[member.id]) lastSkill.current[member.id] = now;
      if (now - lastAttack.current[member.id] >= attackMs) {
        lastAttack.current[member.id] = now;
        const target = aliveMonsters[(index + Math.floor(now / Math.max(1, attackMs))) % aliveMonsters.length];
        damageMonsters([target.id], attackFor(member, progressFor(member)) * guildMultiplier * developerPower * MEMBER_ASSIST_FACTOR);
        setMemberFx((current) => ({ ...current, [member.id]: now }));
      }
      if (now - lastSkill.current[member.id] >= skillMs) {
        lastSkill.current[member.id] = now;
        const skillTargets = aliveMonsters.slice(index % aliveMonsters.length).concat(aliveMonsters).slice(0, Math.min(aliveMonsters.length, 2 + Math.floor(save.upgrades.guild / 2)));
        damageMonsters(skillTargets.map((monster) => monster.id), attackFor(member, progressFor(member)) * guildMultiplier * member.skillMultiplier * developerPower * MEMBER_ASSIST_FACTOR);
        setMemberSkillFx((current) => ({ ...current, [member.id]: now }));
        setSkillFx(member.id);
        window.setTimeout(() => setSkillFx((current) => current === member.id ? null : current), 1100);
      }
    });
  }, [now, battleActive, tab, aliveMonsters, partyMembers, progressFor, developerPower, guildMultiplier, save.upgrades.guild, damageMonsters]);

  const directAttackAt = useCallback((x: number, y: number, automatic = false) => {
    if (!battleActive || !aliveMonsters.length) return;
    const strikes = save.specials.double ? 2 : 1;
    const nextClicks = automatic ? clickCount.current : clickCount.current + 1;
    const combo = !automatic && save.upgrades.combo > 0 && nextClicks % 5 === 0;
    const critical = Math.random() < criticalChance;
    const comboMultiplier = combo ? 1.35 + save.upgrades.combo * .1 : 1;
    const timestamp = Date.now();
    let nextMomentum = 0;
    if (!automatic && momentumLevel > 0) {
      const chained = timestamp - momentumState.current.lastAt <= 1250;
      const maxStacks = 3 + momentumLevel * 2;
      nextMomentum = Math.min(maxStacks, chained ? momentumState.current.stacks + 1 : 1);
      momentumState.current = { lastAt: timestamp, stacks: nextMomentum };
      setMomentumStacks(nextMomentum);
    }
    const shockwave = !automatic && shockwaveLevel > 0 && nextClicks % (9 - shockwaveLevel) === 0;
    const effectiveRange = attackRange * (shockwave ? 1.55 : 1);
    const momentumMultiplier = 1 + nextMomentum * momentumLevel * .025;
    const shockwaveMultiplier = shockwave ? 1.3 + shockwaveLevel * .15 : 1;
    const damage = Math.round(clickDamage * strikes * (critical ? 2 : 1) * comboMultiplier * momentumMultiplier * shockwaveMultiplier * (automatic ? AUTO_ATTACK_FACTOR : 1));
    const targets = aliveMonsters.filter((monster) => distanceOnField(monster, { x, y }) <= effectiveRange);
    const effectId = clickFxCounter.current + 1;
    clickFxCounter.current = effectId;
    setHitFx({
      id: effectId,
      tier: activeClickPattern.tier,
      variant: effectId % activeClickPattern.variants,
      damage,
      automatic,
      doubled: strikes > 1,
      critical,
      combo,
      shockwave,
      momentum: nextMomentum,
      hitCount: targets.length,
      targets: targets.map((monster) => monster.id),
      x,
      y,
      radius: effectiveRange,
    });
    window.setTimeout(() => setHitFx((current) => current?.id === effectId ? null : current), activeClickPattern.duration);
    damageMonsters(targets.map((monster) => monster.id), damage, true, activeClickPattern.tier);
    if (!automatic) {
      clickCount.current = nextClicks;
      setClicks(nextClicks);
      if (save.specials.command && nextClicks % 10 === 0) {
        const commandDamage = partyMembers.reduce((sum, member) => sum + attackFor(member, progressFor(member)) * guildMultiplier * developerPower, 0);
        damageMonsters(aliveMonsters.slice(0, Math.max(1, partyMembers.length)).map((monster) => monster.id), commandDamage);
        setToast("지휘관의 명령! 모든 길드원이 즉시 공격합니다.");
      }
    }
  }, [battleActive, aliveMonsters, save.specials, save.upgrades.combo, clickDamage, activeClickPattern, criticalChance, attackRange, momentumLevel, shockwaveLevel, damageMonsters, partyMembers, progressFor, guildMultiplier, developerPower]);

  useEffect(() => {
    if (!save.specials.auto || !battleActive || tab !== "field") return;
    const timer = window.setInterval(() => directAttackAt(autoAttackPoint.x, autoAttackPoint.y, true), 2000);
    return () => window.clearInterval(timer);
  }, [save.specials.auto, battleActive, tab, directAttackAt, autoAttackPoint]);

  function selectStage(stageNumber: number) {
    const nextStage = getStage(stageNumber);
    if (developerMode) setDeveloperStage(stageNumber);
    else setSave((current) => ({ ...current, selectedStage: stageNumber }));
    setStagePicker(false);
    setTab("guild");
    setToast(`${nextStage.region.name} ${nextStage.localStage}구역을 다음 토벌 목표로 지정했습니다.`);
  }

  function startStage(stageNumber = stage.stage) {
    unlockBattleAudio();
    if (!save.party.length && !developerMode) {
      setToast("출전할 길드원이 없습니다. 여관에서 새 길드원을 고용하고 파티에 편성하세요.");
      setTab("guild");
      return;
    }
    const nextStage = getStage(stageNumber);
    const nextMaterial = stageMaterialFor(stageNumber);
    const durationSeconds = developerMode ? DEV_BATTLE_SECONDS : (nextStage.boss ? BOSS_BATTLE_SECONDS : NORMAL_BATTLE_SECONDS) + save.upgrades.time * 5;
    const monsters = spawnMonsterPack(nextStage);
    const rewardGold = Math.round(nextStage.gold * goldMultiplier);
    clearLootTimers();
    victoryLock.current = false;
    rewardLock.current = false;
    lootPlan.current = createBattleLootPlan(monsters, rewardGold, nextMaterial);
    lootDropsRef.current = [];
    revealedLootIds.current.clear();
    lastAttack.current = {};
    lastSkill.current = {};
    setMemberFx({});
    setMemberSkillFx({});
    setHitFx(null);
    clickCount.current = 0;
    momentumState.current = { lastAt: 0, stacks: 0 };
    setClicks(0);
    setMomentumStacks(0);
    setLostMembers([]);
    setLootDrops([]);
    setLootPhase("fighting");
    setCollectedGold(0);
    setCollectedMaterial(0);
    setPlannedGold(rewardGold);
    setPlannedMaterial(nextMaterial.rewardAmount);
    setVictory(false);
    setDefeat(false);
    setBattleActive(true);
    setBattleDeadline(Date.now() + durationSeconds * 1000);
    setFieldMonsters(monsters);
    if (developerMode) setDeveloperStage(stageNumber);
    else setSave((current) => ({ ...current, selectedStage: stageNumber }));
    setStagePicker(false);
    setTab("field");
    setToast(`${nextStage.region.name} ${nextStage.localStage}구역 진입. 필드를 눌러 범위 안의 몬스터 무리를 베어내세요.`);
  }

  function returnToGuild(message = "파티를 영지로 복귀시켰습니다.") {
    clearLootTimers();
    victoryLock.current = true;
    rewardLock.current = true;
    setBattleActive(false);
    setBattleDeadline(null);
    setVictory(false);
    setDefeat(false);
    setFieldMonsters([]);
    setLootDrops([]);
    setLootPhase("idle");
    setCollectedGold(0);
    setCollectedMaterial(0);
    setPlannedGold(0);
    setPlannedMaterial(0);
    lootPlan.current = [];
    lootDropsRef.current = [];
    revealedLootIds.current.clear();
    setTab("guild");
    setToast(message);
  }

  function retreatBattle() {
    if (!battleActive) return;
    const penalty = Math.min(save.gold, Math.max(10, Math.floor(save.gold * 0.1)));
    if (!developerMode) setSave((current) => ({ ...current, gold: Math.max(0, current.gold - penalty) }));
    returnToGuild(developerMode ? "개발자 토벌에서 후퇴했습니다. 골드 패널티는 저장되지 않습니다." : `토벌에서 후퇴해 골드 ${compactNumber(penalty)}을(를) 잃었습니다.`);
  }

  function toggleDeveloperMode() {
    const next = !developerMode;
    setDeveloperMode(next);
    setDeveloperStage(next ? save.selectedStage : null);
    if (next) setDeveloperClickLevel(CLICK_ATTACK_PATTERNS.length - 1);
    setToast(next ? "개발자 모드 ON · 모든 스테이지와 신화 장비가 임시 해금됩니다. 결과는 저장되지 않습니다." : "개발자 모드 OFF · 원래 저장 진행도로 돌아왔습니다.");
  }

  function previewClickPattern(level: number) {
    const pattern = clickAttackPattern(level);
    setDeveloperClickLevel(level);
    setHitFx(null);
    setToast(`무기 ${pattern.tier + 1}/15 · ${pattern.weaponName} · ${pattern.title} 미리보기로 변경했습니다. 몬스터를 눌러 연출을 확인하세요.`);
  }

  function purchaseWeaponUpgrade() {
    const nextLevel = save.weaponLevel + 1;
    if (nextLevel > WEAPON_MAX_LEVEL) return setToast("모든 무기를 완성했습니다. 길드마스터 신검이 최종 단계입니다!");
    const nextWeapon = clickAttackPattern(nextLevel);
    const recipe = weaponMaterialRecipe(nextLevel);
    if (save.gold < nextWeapon.cost) return setToast(`${nextWeapon.weaponName}을(를) 제작할 골드가 부족합니다.`);
    if (!canAffordWeaponRecipe(save.materials, recipe) && recipe) return setToast(`${nextWeapon.weaponName} 제작에는 ${recipe.material.name} ${recipe.amount}개가 필요합니다. ${recipe.material.stage}구역을 반복 토벌하세요.`);
    setSave((current) => {
      const materials = consumeWeaponRecipe(current.materials, recipe);
      if (!materials || current.gold < nextWeapon.cost) return current;
      return { ...current, gold: current.gold - nextWeapon.cost, materials, weaponLevel: nextLevel };
    });
    setToast(`${nextWeapon.weaponName} 완성! ${recipe?.material.name ?? "재료"}을(를) 제련해 기본 공격력이 ${Math.round(nextWeapon.damageScale * 100)}%로 상승했습니다.`);
  }

  function purchaseGuildHallUpgrade() {
    if (!nextHallStage || hallStage.upgradeCost === null || hallStage.requiredResearch === null) {
      setToast("길드 본관이 이미 전설의 성채 단계에 도달했습니다.");
      return;
    }
    if (save.nodes.length < hallStage.requiredResearch) {
      setToast(`본관 승급을 위해 현재 해금 구간의 연구를 ${hallStage.requiredResearch - save.nodes.length}개 더 완료해야 합니다.`);
      return;
    }
    if (save.gold < hallStage.upgradeCost) {
      setToast(`${nextHallStage.name} 승급에 필요한 골드가 부족합니다.`);
      return;
    }
    setSave((current) => ({ ...current, gold: current.gold - hallStage.upgradeCost!, guildHallLevel: current.guildHallLevel + 1 }));
    setTerritoryPulse((current) => current + 1);
    setToast(`${nextHallStage.name} 완성! 길드 강화 연구가 ${nextHallStage.researchDepth}단계까지 확장되었습니다.`);
  }

  function purchaseNode(node: UpgradeNode) {
    if (save.nodes.includes(node.id)) return;
    const requiredHallLevel = requiredHallLevelForNode(node.id);
    if (save.guildHallLevel < requiredHallLevel) {
      setToast(`${node.title} 연구에는 길드 본관 Lv.${requiredHallLevel}이 필요합니다. 본관을 먼저 승급하세요.`);
      return;
    }
    if (!node.prerequisites.every((id) => save.nodes.includes(id))) return setToast("앞선 성장 노드를 먼저 해금해야 합니다.");
    if (save.gold < node.cost) return setToast("노드를 해금할 골드가 부족합니다. 필드에서 토벌을 반복하세요.");
    setSave((current) => ({
      ...current,
      gold: current.gold - node.cost,
      nodes: [...current.nodes, node.id],
      upgrades: node.target ? { ...current.upgrades, [node.target]: current.upgrades[node.target] + 1 } : current.upgrades,
    }));
    setTerritoryPulse((current) => current + 1);
    setToast(`${node.title} 노드를 해금했습니다. 새로운 성장 경로가 발견됩니다!`);
  }

  function hire(id: string) {
    const member = memberById(id);
    if (save.gold < member.cost) return setToast("고용 골드가 부족합니다.");
    setSave((current) => {
      const owned = [...current.owned, id];
      const next = { ...current, gold: current.gold - member.cost, owned, progress: { ...current.progress, [id]: { level: 1, xp: 0, gear: 0 } } };
      return { ...next, candidates: randomCandidates(next) };
    });
    setToast(`${member.name}이(가) 길드에 합류했습니다!`);
  }

  function refreshCandidates() {
    const cost = Math.max(20, 60 - save.upgrades.tavern * 5);
    if (save.gold < cost) return setToast("여관 후보를 갱신할 골드가 부족합니다.");
    setSave((current) => {
      const next = { ...current, gold: current.gold - cost };
      return { ...next, candidates: randomCandidates(next) };
    });
    setToast("새로운 모험가들이 여관에 도착했습니다.");
  }

  function randomHire() {
    const cost = 260;
    if (save.gold < cost) return setToast("랜덤 고용에 필요한 골드가 부족합니다.");
    const available = MEMBERS.filter((member) => !save.owned.includes(member.id) && RANK_ORDER.indexOf(member.rank) <= Math.min(6, 1 + save.upgrades.tavern));
    if (!available.length) return setToast("현재 등급에서 고용 가능한 길드원을 모두 모았습니다.");
    const roll = available[Math.floor(Math.random() * available.length)];
    setSave((current) => {
      const owned = [...current.owned, roll.id];
      const next = { ...current, gold: current.gold - cost, owned, progress: { ...current.progress, [roll.id]: { level: 1, xp: 0, gear: 0 } } };
      return { ...next, candidates: randomCandidates(next) };
    });
    setToast(`운명의 계약! ${roll.name}을(를) 고용했습니다.`);
  }

  function toggleParty(id: string) {
    setSave((current) => {
      if (current.party.includes(id)) {
        if (current.party.length === 1) {
          setToast("토벌 파티에는 최소 한 명이 필요합니다.");
          return current;
        }
        return { ...current, party: current.party.filter((memberId) => memberId !== id) };
      }
      if (current.party.length >= 4) {
        setToast("현재 파티에는 최대 4명까지 편성할 수 있습니다.");
        return current;
      }
      return { ...current, party: [...current.party, id] };
    });
  }

  function unlockSpecial(key: SpecialKey) {
    if (save.specials[key]) return;
    if (save.bossTokens < 1) return setToast("보스 증표가 필요합니다. 10번째 스테이지 보스를 처치하세요.");
    setSave((current) => ({ ...current, bossTokens: current.bossTokens - 1, specials: { ...current.specials, [key]: true } }));
    setToast(`${specialInfo[key].title} 특수 전술을 해금했습니다!`);
  }

  function resetGame() {
    if (!window.confirm("모든 진행 상황을 지우고 새 게임을 시작할까요?")) return;
    localStorage.removeItem(SAVE_KEY);
    setSave(initialState);
    clearLootTimers();
    victoryLock.current = true;
    rewardLock.current = true;
    setBattleActive(false);
    setBattleDeadline(null);
    setVictory(false);
    setDefeat(false);
    setDeveloperMode(false);
    setDeveloperStage(null);
    setFieldMonsters([]);
    setLootDrops([]);
    setLootPhase("idle");
    setCollectedGold(0);
    setCollectedMaterial(0);
    setPlannedGold(0);
    setPlannedMaterial(0);
    lootPlan.current = [];
    lootDropsRef.current = [];
    revealedLootIds.current.clear();
    setLostMembers([]);
    setTab("guild");
    setActiveFacility("hall");
    setToast("새로운 길드가 창설되었습니다. 파티를 편성하고 첫 토벌을 준비하세요.");
  }

  function attackField(event: React.PointerEvent<HTMLDivElement>) {
    if (!battleActive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
    if (event.pointerType === "mouse") setWeaponCursor({ x, y, visible: true });
    directAttackAt(x, y, false);
  }

  function trackWeaponCursor(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setWeaponCursor({
      x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100)),
      visible: true,
    });
  }

  return (
    <main className={`game-shell ${combatLocked ? "battle-mode" : ""} ${developerMode ? "developer-mode" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">G</span>
          <div><span className="eyebrow">GUILDMASTER CHRONICLE</span><h1>모험가 길드</h1></div>
        </div>
        <div className="resources" aria-label="보유 자원">
          <span><i className="resource-dot gold-dot" />골드 <strong>{compactNumber(save.gold)}</strong></span>
          <span className="current-material-resource" title={stageMaterial.description}><i className="stage-material-icon topbar-material-icon" style={materialIconVars(stageMaterial) as React.CSSProperties} />{stageMaterial.familyName} <strong>{save.materials[stageMaterial.id] ?? 0}</strong></span>
          <span><i className="resource-dot token-dot" />보스 증표 <strong>{save.bossTokens}</strong></span>
          <span><i className="resource-dot power-dot" />전투력 <strong>{compactNumber(combatPower)}</strong></span>
        </div>
        {developerToolsAvailable && <button className={`small-button developer-toggle ${developerMode ? "active" : ""}`} onClick={toggleDeveloperMode}>DEV {developerMode ? "ON" : "OFF"}</button>}
        <button className="small-button reset-button" onClick={resetGame}>새 게임</button>
      </header>

      <section className="guild-rank-strip" aria-label="길드 성장 현황">
        <span className="guild-seal">{RANK_ORDER[Math.min(RANK_ORDER.length - 1, Math.floor(save.unlockedStage / 15))]}</span>
        <div className="guild-rank-copy">
          <span><b>길드 명성</b><em>{save.unlockedStage * 17 + save.nodes.length * 28} / {(Math.floor(save.unlockedStage / 10) + 1) * 400}</em></span>
          <i><b style={{ width: `${Math.min(100, (save.unlockedStage % 10 || 10) * 10)}%` }} /></i>
        </div>
        <div className="current-objective"><small>현재 목표</small><strong>{stage.boss ? `${stage.name} 처치` : `${stage.region.name} ${stage.localStage}구역 돌파`}</strong></div>
      </section>

      <nav className="main-tabs" aria-label="주요 화면">
        <button className={tab === "guild" ? "active" : ""} onClick={() => setTab("guild")}><span>🏰</span> 길드 관리</button>
        <button className={tab === "field" ? "active" : ""} disabled={!battleActive} title="토벌 출정 후 전투 화면이 열립니다"><span>⚔️</span> 필드 상황 <b className="live-dot">LOCKED</b></button>
      </nav>

      <div className="toast" role="status"><span aria-hidden="true">✦</span>{toast}</div>
      {developerMode && <div className="developer-banner" role="status"><strong>개발자 모드</strong><span>스테이지 1–100 임시 해금 · 파티 최대 레벨 · 신화 장비 +{DEV_GEAR_LEVEL} · 무기 15종 비교 · 전투 결과 저장 안 됨</span></div>}

      {tab === "guild" && (
        <section className="screen guild-screen" aria-label="길드 관리">
          <div className="section-heading">
            <div><span className="eyebrow">GUILD TERRITORY</span><h2>길드 관리</h2><p>파티를 편성하고 목표를 지정한 뒤 토벌대를 출정시키세요. 전투가 끝날 때까지 영지로 돌아올 수 없습니다.</p></div>
            <div className="heading-actions expedition-actions"><button className="secondary-button" onClick={() => setStagePicker(true)}>목표 · {stage.region.name} {stage.localStage}구역</button><button className="primary-button" onClick={() => startStage()}>토벌 출정 ⚔</button></div>
          </div>

          <GuildBuildingHub
            activeFacility={activeFacility}
            hallLevel={save.guildHallLevel}
            researchCount={save.nodes.length}
            researchTotal={UPGRADE_NODES.length}
            weaponName={clickAttackPattern(save.weaponLevel).weaponName}
            partyCount={save.party.length}
            candidateCount={save.candidates.length}
            pulse={territoryPulse}
            onSelect={setActiveFacility}
          />

          <div className={`guild-facility-content facility-${activeFacility}`}>
          {activeFacility === "hall" && <div className="guild-layout guild-hall-management">
            <div className="hall-upgrade-panel panel">
              <div className="panel-title"><div><span className="eyebrow">GUILD HALL DEVELOPMENT</span><h3>길드 본관 승급</h3></div><span className="level-chip">본관 Lv.{hallStage.level}/6</span></div>
              <div className="hall-current-stage"><span className="hall-stage-seal">{hallStage.level}</span><div><small>현재 건물</small><strong>{hallStage.name}</strong><p>{hallStage.description}</p></div></div>
              <div className="growth-progress"><i style={{ width: `${(hallStage.level - 1) / (GUILD_HALL_STAGES.length - 1) * 100}%` }} /></div>
              <div className="hall-unlock-summary"><span><b>현재 연구 한계</b><strong>{hallStage.researchDepth}단계</strong></span><span><b>완료 연구</b><strong>{save.nodes.length}/{UPGRADE_NODES.length}</strong></span><span><b>보유 골드</b><strong>{compactNumber(save.gold)} G</strong></span></div>
              {nextHallStage && hallStage.upgradeCost !== null && hallStage.requiredResearch !== null ? <button className="hall-upgrade-button" onClick={purchaseGuildHallUpgrade}>
                <small>NEXT · {nextHallStage.name}</small><strong>{compactNumber(hallStage.upgradeCost)} G로 본관 승급</strong><em>조건: 연구 {hallStage.requiredResearch}개 · {nextHallStage.researchDepth}단계까지 해금</em>
              </button> : <div className="hall-max-stage"><span>♛</span><strong>전설의 길드 성채 완성</strong><small>모든 연구 깊이가 열렸습니다.</small></div>}
            </div>

            <div className="upgrade-panel panel">
              <div className="panel-title"><div><span className="eyebrow">UNLOCK ROADMAP</span><h3>시설 해금 현황</h3></div><span className="level-chip">연구 깊이 {hallStage.researchDepth}</span></div>
              <p className="panel-description">본관을 승급해야 강화 노드가 중심에서 더 멀리 뻗어 나갑니다. 이미 완료한 연구는 저장 호환 과정에서 다시 잠기지 않습니다.</p>
              <div className="hall-level-path">{GUILD_HALL_STAGES.map((stageInfo) => <span key={stageInfo.level} className={`${stageInfo.level <= hallStage.level ? "unlocked" : ""} ${stageInfo.level === hallStage.level ? "current" : ""}`}><b>Lv.{stageInfo.level}</b><strong>{stageInfo.name}</strong><small>연구 {stageInfo.researchDepth}단계</small></span>)}</div>
            </div>
          </div>}

          {activeFacility === "forge" && <ForgeWorkshop
            weapons={CLICK_ATTACK_PATTERNS}
            currentLevel={save.weaponLevel}
            gold={save.gold}
            bossTokens={save.bossTokens}
            materials={save.materials}
            formatNumber={compactNumber}
            onUpgrade={purchaseWeaponUpgrade}
          />}

          {activeFacility === "research" && <>
            <div className="upgrade-panel research-overview panel facility-first-panel">
              <div className="panel-title"><div><span className="eyebrow">GROWTH OVERVIEW</span><h3>길드 강화 현황</h3></div><span className="level-chip">본관 Lv.{hallStage.level} · 깊이 {hallStage.researchDepth}</span></div>
              <div className="growth-progress"><i style={{ width: `${save.nodes.length / UPGRADE_NODES.length * 100}%` }} /></div>
              <div className="growth-stats">
                {(Object.keys(upgradeInfo) as UpgradeKey[]).map((key) => <div key={key}><span className="upgrade-icon">{upgradeInfo[key].accent}</span><span><strong>{upgradeInfo[key].title} · Lv.{save.upgrades[key]}</strong><small>{upgradeEffectText(key, save.upgrades[key])}</small></span></div>)}
              </div>
            </div>
            <div className="upgrade-tree-panel panel">
              <div className="panel-title"><div><span className="eyebrow">GUILD DEVELOPMENT MAP</span><h3>중앙 4방향 발전 노드</h3><p className="panel-description">중앙의 길드 기반에서 직접 공격·전투 리듬·원정 지원·길드 경영 네 방향으로 확장됩니다. 무기 공격력과 연출은 대장간에서만 강화됩니다.</p></div><span className="level-chip">보유 골드 {compactNumber(save.gold)}</span></div>
              <ResearchMap nodes={UPGRADE_NODES} purchasedIds={save.nodes} hallLevel={save.guildHallLevel} formatCost={compactNumber} onPurchase={(node: ResearchNodeView) => { const fullNode = UPGRADE_NODES.find((item) => item.id === node.id); if (fullNode) purchaseNode(fullNode); }} />
            </div>
          </>}

          {activeFacility === "tavern" && <>
          <TavernHall
            candidates={save.candidates.map(memberById)}
            members={MEMBERS}
            ownedIds={save.owned}
            progress={save.progress}
            partyIds={save.party}
            tavernLevel={save.upgrades.tavern}
            gold={save.gold}
            refreshCost={Math.max(20, 60 - save.upgrades.tavern * 5)}
            formatNumber={compactNumber}
            getAttack={(member, progress) => attackFor(member, progress)}
            onRefresh={refreshCandidates}
            onRandomHire={randomHire}
            onHire={hire}
            onToggleParty={toggleParty}
          />
          <div className="special-section panel">
            <div className="panel-title"><div><span className="eyebrow">EXPEDITION TACTICS</span><h3>파티 특수 전술</h3></div><span className="level-chip token-level">증표 {save.bossTokens}</span></div>
            <div className="special-grid">{(Object.keys(specialInfo) as SpecialKey[]).map((key) => <button key={key} className={`special-card ${save.specials[key] ? "unlocked" : ""}`} onClick={() => unlockSpecial(key)}>
              <span>{save.specials[key] ? "✓" : "◆"}</span><strong>{specialInfo[key].title}</strong><small>{specialInfo[key].description}</small><b>{save.specials[key] ? "해금 완료" : "보스 증표 1"}</b>
            </button>)}</div>
          </div>
          </>}
          </div>
        </section>
      )}

      {tab === "field" && (
        <section className={`screen field-screen biome-${stage.region.hue}`} aria-label="필드 전투">
          <div className="field-toolbar">
            <div><span className="eyebrow">CURRENT EXPEDITION · SWARM HUNT</span><h2>{stage.region.name} <b>{stage.localStage}/10</b></h2><small className="permadeath-warning">⚠ 제한 시간 종료 시 출전 길드원 영구 소실</small></div>
            <div className="field-actions battle-controls">
              {lootCollecting
                ? <div className="battle-timer loot-sweep-timer"><span>전리품 회수</span><strong>{compactNumber(collectedGold)} G · {collectedMaterial}/{plannedMaterial} 재료</strong><i><b style={{ width: `${lootSweepProgress}%` }} /></i></div>
                : <div className={`battle-timer ${battleTimeLeft <= 10 ? "urgent" : ""}`}><span>남은 시간</span><strong>{battleTimeLeft}초</strong><i><b style={{ width: `${battleTimeLeft / battleSeconds * 100}%` }} /></i></div>}
              <button className="retreat-button" onClick={retreatBattle} disabled={!battleActive}>안전 후퇴 · 길드원 보존</button>
            </div>
          </div>

          <div className="battle-layout">
            <div className={`arena hack-arena has-forge-cursor panel field-tone-${fieldAsset.tone} click-style-${activeClickPattern.tier} loot-phase-${lootPhase}`} style={{ "--field-art-position": fieldAsset.objectPosition } as React.CSSProperties} onPointerDown={attackField} onPointerMove={trackWeaponCursor} onPointerLeave={() => setWeaponCursor((cursor) => ({ ...cursor, visible: false }))} role="application" aria-label="강화 무기 커서로 클릭한 위치를 중심으로 범위 공격하는 몬스터 전장">
              <Image className="field-background-art" src={fieldAsset.source} alt="" fill sizes="(max-width: 1180px) 100vw, 900px" priority={stage.stage <= 10} unoptimized draggable={false} />
              <div className="environment-tag"><span>{BIOME_DETAILS[stage.region.hue].label}</span><small>{BIOME_DETAILS[stage.region.hue].description}</small></div>
              <div className="battle-banner"><span>{stage.boss ? "BOSS SWARM" : `STAGE ${stage.stage}`}</span><strong>{stage.name} 무리</strong></div>
              <div className={`loot-tally ${lootCollecting ? "is-collecting" : ""}`}>
                <div className="loot-tally-icons"><i className="loot-tally-coin">G</i><i className="stage-material-icon loot-tally-material" style={materialIconVars(stageMaterial) as React.CSSProperties} /></div>
                <span><small>{lootCollecting ? "촤라락 회수 중" : stageMaterial.name}</small><strong>+{compactNumber(lootCollecting ? collectedGold : droppedGold)} G</strong><em>+{lootCollecting ? collectedMaterial : droppedMaterial} 재료</em></span>
              </div>
              <div className="field-click-guide"><b>필드를 직접 누르세요</b><span>원 안의 모든 몬스터가 함께 베입니다</span></div>
              <WeaponCursor weapon={activeClickPattern} point={weaponCursor} />

              <div className="fighters" aria-label="출전 길드원">
                {partyMembers.map((member, index) => {
                  const progress = progressFor(member) ?? { level: 1, xp: 0, gear: 0 };
                  const battleStartedAt = battleDeadline ? battleDeadline - battleSeconds * 1000 : now;
                  const attackElapsed = now - (memberFx[member.id] || now);
                  const skillElapsed = now - (memberSkillFx[member.id] || battleStartedAt);
                  const skillReady = Math.min(1, skillElapsed / (member.skillCooldown * 1000));
                  const motion: MemberMotion = skillFx === member.id
                    ? "skill"
                    : memberFx[member.id] && attackElapsed < 850
                      ? "attack"
                      : "idle";
                  const motionEvent = motion === "skill"
                    ? memberSkillFx[member.id]
                    : motion === "attack"
                      ? memberFx[member.id]
                      : "idle";
                  return <div className={`fighter fighter-${index + 1} ${skillFx === member.id ? "casting" : ""}`} key={member.id} style={{ "--member-hue": member.hue } as React.CSSProperties}>
                    <div className="fighter-name"><strong>{member.name.split(" ").at(-1)}</strong><span>Lv.{progress.level}</span></div>
                    <div className="sprite">
                      <Image
                        key={`${member.id}-${motion}-${motionEvent}`}
                        className="fighter-animation"
                        src={memberAnimationSource(member.id, motion)}
                        alt=""
                        fill
                        sizes="152px"
                        unoptimized
                        draggable={false}
                      />
                    </div>
                    <div className="fighter-shadow" />
                    <div className="skill-meter" title={`${member.skill} 쿨타임`}><i style={{ width: `${skillReady * 100}%` }} /><span>{skillReady >= 1 ? member.skill : `${Math.max(0, member.skillCooldown - skillElapsed / 1000).toFixed(1)}초`}</span></div>
                    {memberFx[member.id] ? <i key={memberFx[member.id]} className="attack-trail" /> : null}
                    {attackElapsed < 260 ? <span className="fighter-burst">✦</span> : null}
                  </div>;
                })}
              </div>

              <div className="monster-pack" aria-hidden="true">
                {fieldMonsters.map((monster, index) => {
                  const hitDuration = monster.lastHitTier >= 4 ? 940 : monster.lastHitTier >= 3 ? 700 : 500;
                  const struck = monster.hp > 0 && monster.lastHitAt > 0 && now - monster.lastHitAt < hitDuration;
                  const artScale = (monsterAsset?.scale ?? 1) * (monster.kind === "leader" ? 1.08 : 1);
                  return <span key={`${monster.id}-${monster.hitId}`} className={`pack-monster monster-${monster.kind} ${monsterAsset ? "has-pack-art" : ""} ${monster.hp <= 0 ? "is-defeated" : ""} ${struck ? `is-struck click-recoil-tier-${monster.lastHitTier}` : ""}`} style={{ left: `${monster.x}%`, top: `${monster.y}%`, "--monster-scale": monster.scale, "--monster-art-scale": artScale, zIndex: Math.round(monster.y) } as React.CSSProperties}>
                    <i className="pack-shadow" />
                    {monsterAsset ? (
                      <span className="pack-monster-art-frame">
                        <Image className="pack-monster-art" src={monsterAsset.source} alt="" fill sizes="128px" priority={stage.stage === 1 && index < 4} unoptimized draggable={false} />
                      </span>
                    ) : (
                      <span className={`monster-sprite ${monster.kind === "leader" ? "boss" : ""}`}><i className="monster-horn left" /><i className="monster-horn right" /><i className="monster-body"><span className="monster-eye left" /><span className="monster-eye right" /><span className="monster-core" /></i><i className="monster-arm left" /><i className="monster-arm right" /><i className="monster-foot left" /><i className="monster-foot right" /></span>
                    )}
                    <i className="pack-monster-soul" aria-hidden="true">✦</i>
                    {monster.kind === "leader" && <b className="leader-mark">♛</b>}
                  </span>;
                })}
              </div>

              <div className="gold-loot-layer" aria-hidden="true">
                {lootDrops.map((drop, index) => {
                  const dropMaterial = drop.kind === "material" ? stageMaterialById(drop.resourceId) : null;
                  return <span
                    className={`loot-drop loot-drop-${drop.kind} loot-variant-${drop.variant}`}
                    key={drop.id}
                    style={{
                      ...(dropMaterial ? materialIconVars(dropMaterial) : {}),
                      "--loot-x": `${drop.x}%`,
                      "--loot-y": `${drop.y}%`,
                      "--loot-delay": `${index * goldLootStaggerMs(lootDrops.length)}ms`,
                    } as React.CSSProperties}
                  >
                    {drop.kind === "gold" ? <><i /><b /></> : dropMaterial ? <i className="stage-material-icon loot-material-icon" /> : null}
                    <em>+{compactNumber(drop.amount)}</em>
                  </span>;
                })}
              </div>
              {lootCollecting && <span className="sr-only" role="status">토벌이 끝나 전장의 골드와 재료를 회수하고 있습니다. 골드 {compactNumber(collectedGold)} / {compactNumber(plannedGold)}, {stageMaterial.name} {collectedMaterial} / {plannedMaterial}</span>}

              {hitFx && <>
                <span key={`range-${hitFx.id}`} className={`attack-range-impact click-tier-${hitFx.tier} ${hitFx.hitCount ? "has-targets" : "missed"} ${hitFx.shockwave ? "is-shockwave" : ""}`} style={{ left: `${hitFx.x}%`, top: `${hitFx.y}%`, width: `${hitFx.radius * 2}%` }} aria-hidden="true"><i /></span>
                <span key={hitFx.id} className={`click-attack-fx field-click-fx click-tier-${hitFx.tier} variant-${hitFx.variant} ${hitFx.doubled ? "is-double" : ""} ${hitFx.automatic ? "is-automatic" : ""} ${hitFx.critical ? "is-critical" : ""} ${hitFx.combo ? "is-combo" : ""} ${hitFx.shockwave ? "is-shockwave" : ""} ${hitFx.momentum ? "has-momentum" : ""}`} style={{ left: `${hitFx.x}%`, top: `${hitFx.y}%` }} aria-hidden="true">
                  <span className="fx-motion-layer">
                    <i className="fx-aim-rune" />
                    <i className="fx-shockwave fx-shockwave-one" />
                    <i className="fx-shockwave fx-shockwave-two" />
                    <i className="fx-master-blade" />
                    <i className="fx-slash fx-slash-one" />
                    <i className="fx-slash fx-slash-two" />
                    <i className="fx-slash fx-slash-three" />
                    <i className="fx-slash fx-slash-four" />
                    <i className="fx-slash fx-slash-five" />
                    <i className="fx-double-echo" />
                    <i className="fx-asset fx-asset-slash" />
                    <i className="fx-asset fx-asset-rune" />
                    <i className="fx-asset fx-asset-light" />
                    <span className="fx-vivid-stage">
                      <i className="fx-vivid fx-vivid-primary" />
                      <i className="fx-vivid fx-vivid-secondary" />
                      <i className="fx-vivid fx-vivid-impact" />
                      <span className="fx-signature-mark"><i /><i /><i /><b>{clickAttackPattern(hitFx.tier).glyph}</b></span>
                      <span className="fx-blade-rain">{CLICK_EFFECT_BLADES.map((index) => <i key={index} style={{ "--blade-x": `${(index - 4) * 42}px`, "--blade-delay": `${index * 45}ms`, "--blade-tilt": `${-18 + index * 5}deg` } as React.CSSProperties} />)}</span>
                      <span className="fx-orbit-motes">{CLICK_EFFECT_SPARKS.map((index) => <i key={index} style={{ "--mote-angle": `${index * 30}deg`, "--mote-distance": `${105 + index % 3 * 34}px`, "--mote-delay": `${index * 32}ms` } as React.CSSProperties} />)}</span>
                    </span>
                    <span className="fx-asset-particles">{CLICK_EFFECT_PARTICLES.map((index) => <i key={index} style={{ "--particle-angle": `${index * 36 + hitFx.variant * 11}deg`, "--particle-distance": `${115 + index % 4 * 30 + hitFx.tier * 5}px`, "--particle-delay": `${index % 5 * 45}ms` } as React.CSSProperties} />)}</span>
                    <span className="fx-sparks">{CLICK_EFFECT_SPARKS.map((index) => <i key={index} className="fx-spark" style={{ "--spark-angle": `${index * 30 + hitFx.variant * 7}deg`, "--spark-distance": `${82 + index % 3 * 18 + hitFx.tier * 9}px`, "--spark-delay": `${index % 4 * 35}ms` } as React.CSSProperties} />)}</span>
                  </span>
                  <span className="fx-pattern-label">{hitFx.automatic ? "자동 · " : ""}{hitFx.shockwave ? "충격파 · " : ""}{hitFx.combo ? "연격 · " : ""}{clickAttackPattern(hitFx.tier).title}</span>
                  <strong className="fx-damage">{hitFx.hitCount ? <>−{compactNumber(hitFx.damage)}<small>{hitFx.critical ? "치명타" : `${hitFx.hitCount}체 타격`}</small></> : <>빗나감</>}</strong>
                </span>
              </>}

              {hitFx && !hitFx.automatic && <span className="sr-only" role="status">{clickAttackPattern(hitFx.tier).title}, 범위 안의 몬스터 {hitFx.hitCount}체 타격</span>}

              {skillFx && <div className="skill-flash" key={`${skillFx}-${now}`}><span>{memberById(skillFx).skill}!</span></div>}
            </div>

            <aside className="battle-sidebar">
              <div className="monster-status intel-panel panel">
                <div className="monster-title"><span className={`enemy-rank ${stage.boss ? "boss-rank" : ""}`}>{stage.boss ? "군주" : "무리"}</span><div><h3>전황 판단</h3><p>{stage.region.name} · 체력 정보 비공개</p></div></div>
                <div className="intel-report"><span>정찰 보고</span><strong>{intelReport}</strong><small>적의 체력과 정확한 잔여 수는 알 수 없습니다. 화면의 움직임을 보고 후퇴를 결정하세요.</small></div>
                <div className="reward-preview"><span>예상 보상</span><strong>골드 {compactNumber(stage.gold * goldMultiplier)}</strong><strong className="material-reward-preview"><i className="stage-material-icon reward-material-icon" style={materialIconVars(stageMaterial) as React.CSSProperties} />{stageMaterial.name} {stageMaterial.rewardAmount}</strong><strong>경험치 {compactNumber(stage.xp)}</strong>{stage.boss && <strong>증표 1</strong>}</div>
              </div>
              <div className="party-status panel"><div className="panel-title"><h3>보조 전투원</h3><span className="level-chip">{partyMembers.length}/4</span></div>{partyMembers.map((member) => <div className="party-row" key={member.id}><span className="mini-portrait" style={{ "--member-hue": member.hue } as React.CSSProperties}>{member.glyph}</span><span><strong>{member.name}</strong><small>{member.job} · 보조 타격 {compactNumber(attackFor(member, progressFor(member)) * guildMultiplier * developerPower * MEMBER_ASSIST_FACTOR)}</small></span><b>{developerMode ? `신화 +${DEV_GEAR_LEVEL}` : member.skill}</b></div>)}</div>
              <div className={`click-power panel click-power-tier-${activeClickPattern.tier}`}>
                <span>길드마스터 직접 공격</span>
                {developerMode && <div className="developer-pattern-picker">
                  <strong>무기 업그레이드 비교</strong>
                  <div role="group" aria-label="무기 업그레이드 공격 미리보기">
                    {CLICK_ATTACK_PATTERNS.map((pattern) => <button key={pattern.key} className={pattern.tier === activeClickPattern.tier ? "active" : ""} onClick={() => previewClickPattern(pattern.tier)} aria-pressed={pattern.tier === activeClickPattern.tier} aria-label={`무기 ${pattern.tier + 1}단계 ${pattern.weaponName} ${pattern.title}`} title={`${pattern.weaponName} · ${pattern.title} · ${pattern.subtitle}`}><b>{pattern.glyph}</b><small>{pattern.tier + 1} · {pattern.weaponName}</small></button>)}
                  </div>
                  <small>단계를 고른 뒤 몬스터를 눌러 비교하세요.</small>
                </div>}
                <div className="click-pattern-card"><b>{activeClickPattern.glyph}</b><span><strong>{activeClickPattern.weaponName} · {activeClickPattern.title}</strong><small>무기 {activeClickPattern.tier + 1}/15 · {activeClickPattern.subtitle}</small></span><em>{activeClickPattern.visualHits} HIT</em></div>
                <strong>{compactNumber(clickDamage)} 피해</strong>
                <div className="click-combat-stats"><span><b>공격 반경</b><em>{attackRange.toFixed(1)}</em></span><span><b>치명타</b><em>{Math.round(criticalChance * 100)}%</em></span><span><b>처형선</b><em>{executionThreshold ? `${Math.round(executionThreshold * 100)}%` : "없음"}</em></span></div>
                <div className="combat-proc-strip"><span><b>충격파</b><em>{shockwaveLevel ? `${9 - shockwaveLevel}타마다` : "잠김"}</em></span><span className={momentumStacks ? "active" : ""}><b>전투 몰입</b><em>{momentumLevel ? `${momentumStacks}/${momentumMaxStacks}` : "잠김"}</em></span><span><b>전투 클릭</b><em>{clicks}회</em></span></div>
                <small>{save.specials.double ? "쌍격 적용 · 범위 내 모든 적에게 2배" : "클릭 위치와 공격 반경이 손맛을 결정합니다"}</small>
                <button className="attack-button" onClick={() => directAttackAt(autoAttackPoint.x, autoAttackPoint.y, false)} disabled={!battleActive}>{activeClickPattern.glyph} 가장 밀집한 곳 베기</button>
              </div>
            </aside>
          </div>

          {victory && <div className="victory-overlay"><div className="victory-card"><span className="victory-star">★</span><p>STAGE CLEAR</p><h2>토벌 성공!</h2><div className="outcome-rewards"><span>{developerMode ? "개발자 결과 · 저장 안 됨" : <>골드 <b>+{compactNumber(stage.gold * goldMultiplier)}</b></>}</span>{!developerMode && <span className="material-victory-reward"><i className="stage-material-icon reward-material-icon" style={materialIconVars(stageMaterial) as React.CSSProperties} />{stageMaterial.name} <b>+{stageMaterial.rewardAmount}</b></span>}{!developerMode && <span>경험치 <b>+{compactNumber(stage.xp)}</b></span>}{stage.boss && <span>보스 토벌 완료</span>}</div><div className="outcome-actions">{stage.stage < (developerMode ? 100 : save.unlockedStage) && <button className="primary-button" onClick={() => startStage(Math.min(100, stage.stage + 1))}>다음 구역 출정</button>}<button className="secondary-button" onClick={() => startStage(stage.stage)}>반복 토벌</button><button className="text-button" onClick={() => returnToGuild("토벌을 마치고 영지로 복귀했습니다.")}>영지로 복귀</button></div></div></div>}
          {defeat && <div className="victory-overlay defeat-overlay"><div className="victory-card defeat-card"><span className="victory-star">☠</span><p>EXPEDITION FAILED</p><h2>원정대 전멸</h2><div className="defeat-copy"><strong>{developerMode ? "개발자 모드에서는 손실이 저장되지 않습니다." : "출전 길드원이 명부에서 영구 삭제되었습니다."}</strong>{lostMembers.map((id) => <span key={id}>† {memberById(id).name}</span>)}<span>시간이 부족하다고 판단되면 전멸 전에 안전 후퇴해야 합니다.</span></div><button className="primary-button" onClick={() => returnToGuild(developerMode ? "개발자 전투에서 복귀했습니다." : "전사자 기록을 남기고 영지로 복귀했습니다. 여관에서 새 원정대를 모집하세요.")}>영지로 귀환</button></div></div>}
        </section>
      )}

      {stagePicker && (
        <StageMap
          currentStage={stage.stage}
          unlockedStage={save.unlockedStage}
          clearedStages={save.cleared}
          developerMode={developerMode}
          onSelectStage={selectStage}
          onClose={() => setStagePicker(false)}
        />
      )}
      <footer className="game-footer"><span>GUILDMASTER CHRONICLE · LOCAL BUILD</span><span>작은 길드가 전설이 되는 곳</span></footer>
    </main>
  );
}
