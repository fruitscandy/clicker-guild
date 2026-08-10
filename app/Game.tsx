"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  playCombatProcSound,
  playExpeditionFailSound,
  playExpeditionStartSound,
  playGuildMemberHireSound,
  playLootCollectSound,
  playLootCompleteSound,
  playLootDropSound,
  playMenuTabSound,
  playMonsterHitSound,
  playProgressionSound,
  playRareRewardSound,
  playStageClearSound,
  unlockBattleAudio,
} from "./battle-audio";
import {
  createBattleLootPlan,
  GOLD_LOOT_TRAVEL_MS,
  goldLootStaggerMs,
  goldLootSweepDuration,
  revealedLootDrops,
  type BattleLootDrop,
} from "./battle-loot";
import { fieldAssetForRegion } from "./field-assets";
import { BOSS_BATTLE_SECONDS, NORMAL_BATTLE_SECONDS } from "./economy-balance";
import { BulletHellFinale } from "./bullet-hell/BulletHellFinale";
import type { FinaleLoadout } from "./bullet-hell/engine";
import { BASE_ATTACK_RANGE, BASE_CLICK_DAMAGE, failureSalvageFor, MEMBER_ASSIST_FACTOR, PLAYER_WEAPON_BALANCE } from "./game-balance";
import { combatTraitFor, compactNumber, getStage, MEMBERS, RANK_ORDER, STAGE_COUNT, STAGES_PER_REGION, type CombatStyle, type MemberDefinition } from "./game-data";
import { maximumUpgradeLevels, UPGRADE_CAPS, UPGRADE_KEYS, type UpgradeKey, type UpgradeLevels } from "./developer-upgrades";
import { DeveloperResourcePanel } from "./guild-hub/DeveloperResourcePanel";
import { DeveloperUpgradePanel } from "./guild-hub/DeveloperUpgradePanel";
import { ForgeWorkshop } from "./guild-hub/ForgeWorkshop";
import { GuildBuildingHub } from "./guild-hub/GuildBuildingHub";
import { TerritoryHuntingGround } from "./guild-hub/HuntingGround";
import { ResearchMap, type ResearchNodeView } from "./guild-hub/ResearchMap";
import { SpecialResearchPanel } from "./guild-hub/SpecialResearchPanel";
import { TavernHall } from "./guild-hub/TavernHall";
import { GUILD_HALL_STAGES, guildHallStage, inferHallLevelFromNodes, requiredHallLevelForNode, type GuildFacility } from "./guild-hub/guild-progression";
import { WeaponCursor } from "./guild-hub/WeaponArt";
import { monsterAssetForStage } from "./monster-assets";
import { MaterialInventory } from "./MaterialInventory";
import { SpecialAttackLayer, specialMonsterClassName } from "./SpecialAttackLayer";
import { WeaponAttackEffect } from "./WeaponAttackEffect";
import { useSpecialAttackController } from "./special-attack-controller";
import { SPECIAL_RESEARCH_NODES } from "./special-attacks";
import { StageMap } from "./stage-map";
import { canAffordWeaponRecipe, consumeWeaponRecipe, materialIconVars, migrateMaterialInventory, stageMaterialById, stageMaterialFor, weaponMaterialRecipe } from "./stage-materials";
import { formatRecruitRate, highRankRecruitChance, MEMBER_SALE_PRICES, RECRUIT_COSTS, rollRecruitMembers, settleRecruitment, type RecruitResult } from "./tavern-gacha";
import { UPGRADE_ICON_BY_KEY } from "./upgrade-icons";

type LootPhase = "idle" | "fighting" | "collecting" | "complete";
type MemberProgress = { level: number; xp: number; gear: number };
type CombatProcKey = "range" | "critical" | "combo" | "execution" | "shockwave" | "momentum";
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
  critical: boolean;
  combo: boolean;
  shockwave: boolean;
  momentum: number;
  executionCount: number;
  executionTargets: string[];
  hitCount: number;
  targets: string[];
  x: number;
  y: number;
  radius: number;
};

const MAX_SIMULTANEOUS_CLICK_FX = 48;

type MemberWeaponFx = {
  id: number;
  memberId: string;
  style: CombatStyle;
  glyph: string;
  color: string;
  x: number;
  y: number;
  skill: boolean;
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
  autoAdvance: boolean;
  finaleCleared: boolean;
};

const SAVE_KEY = "guildmaster-clicker-save-v1";
const DEV_BATTLE_SECONDS = 300;
const DEV_GEAR_LEVEL = 99;
const DEV_POWER_MULTIPLIER = 500;

const CLICK_ATTACK_PATTERNS: ClickAttackPattern[] = [
  { key: "training-strike", weaponName: "훈련용 장검", title: "견습 타격", subtitle: "묵직한 기본 일격", glyph: "검", tier: 0, visualHits: 1, variants: 1, duration: 620, ...PLAYER_WEAPON_BALANCE[0] },
  { key: "crescent-slash", weaponName: "초승달 도", title: "반월참", subtitle: "검기를 실은 넓은 베기", glyph: "◒", tier: 1, visualHits: 1, variants: 2, duration: 720, ...PLAYER_WEAPON_BALANCE[1] },
  { key: "cross-cut", weaponName: "쌍날검", title: "교차참", subtitle: "엇갈리는 2연속 참격", glyph: "×", tier: 2, visualHits: 2, variants: 2, duration: 820, ...PLAYER_WEAPON_BALANCE[2] },
  { key: "weakpoint-break", weaponName: "룬 파쇄검", title: "약점 파쇄", subtitle: "표식을 꿰뚫는 3단 베기", glyph: "◎", tier: 3, visualHits: 3, variants: 3, duration: 980, ...PLAYER_WEAPON_BALANCE[3] },
  { key: "sky-sword-array", weaponName: "천공검", title: "천공검진", subtitle: "길드마스터의 5연속 오의", glyph: "劍", tier: 4, visualHits: 5, variants: 4, duration: 1180, ...PLAYER_WEAPON_BALANCE[4] },
  { key: "nebula-dance", weaponName: "성운도", title: "성운 난무", subtitle: "별빛 잔상을 남기는 7연참", glyph: "星", tier: 5, visualHits: 7, variants: 4, duration: 1320, ...PLAYER_WEAPON_BALANCE[5] },
  { key: "dragon-vein-break", weaponName: "용맥검", title: "용맥 붕괴", subtitle: "번개와 검풍으로 전장을 가르는 9연격", glyph: "龍", tier: 6, visualHits: 9, variants: 4, duration: 1480, ...PLAYER_WEAPON_BALANCE[6] },
  { key: "celestial-ruin", weaponName: "천상검", title: "천상 종언", subtitle: "천공의 룬과 낙검이 겹치는 12연 오의", glyph: "天", tier: 7, visualHits: 12, variants: 4, duration: 1680, ...PLAYER_WEAPON_BALANCE[7] },
  { key: "blood-moon-eclipse", weaponName: "혈월도", title: "붉은 월식", subtitle: "핏빛 초승달이 겹쳐지는 13연참", glyph: "月", tier: 8, visualHits: 13, variants: 4, duration: 1740, ...PLAYER_WEAPON_BALANCE[8] },
  { key: "storm-twin-dance", weaponName: "폭풍쌍검", title: "뇌광 연무", subtitle: "번개 궤적을 남기는 쌍검 난무", glyph: "雷", tier: 9, visualHits: 15, variants: 4, duration: 1800, ...PLAYER_WEAPON_BALANCE[9] },
  { key: "radiant-judgment", weaponName: "성휘 대검", title: "성광 심판", subtitle: "빛의 기둥과 대검이 함께 낙하", glyph: "光", tier: 10, visualHits: 16, variants: 4, duration: 1880, ...PLAYER_WEAPON_BALANCE[10] },
  { key: "abyss-sever", weaponName: "심연검", title: "공허 절단", subtitle: "전장을 가르는 검은 균열의 일격", glyph: "闇", tier: 11, visualHits: 18, variants: 4, duration: 1940, ...PLAYER_WEAPON_BALANCE[11] },
  { key: "time-collapse", weaponName: "시간절단검", title: "찰나 붕괴", subtitle: "멈춘 시간 위로 모든 참격이 겹침", glyph: "時", tier: 12, visualHits: 20, variants: 4, duration: 2020, ...PLAYER_WEAPON_BALANCE[12] },
  { key: "world-tree-wave", weaponName: "세계수 성검", title: "생명의 파동", subtitle: "거대한 생명 룬이 전장을 휩씀", glyph: "樹", tier: 13, visualHits: 22, variants: 4, duration: 2100, ...PLAYER_WEAPON_BALANCE[13] },
  { key: "myriad-blades-one", weaponName: "길드마스터 신검", title: "만검귀일", subtitle: "수천 검광이 하나의 종언으로 수렴", glyph: "神", tier: 14, visualHits: 25, variants: 4, duration: 2200, ...PLAYER_WEAPON_BALANCE[14] },
];

const WEAPON_MAX_LEVEL = CLICK_ATTACK_PATTERNS.length - 1;

function clickAttackPattern(level: number) {
  return CLICK_ATTACK_PATTERNS[Math.min(CLICK_ATTACK_PATTERNS.length - 1, Math.max(0, level))];
}

const COMBAT_STYLE_LABELS: Record<CombatStyle, { name: string; glyph: string; effect: string }> = {
  vanguard: { name: "선봉", glyph: "盾", effect: "근거리 자동 검격" },
  marksman: { name: "사격", glyph: "➶", effect: "원거리 자동 투사체" },
  assassin: { name: "암살", glyph: "刃", effect: "빠른 자동 연타" },
  arcane: { name: "비전", glyph: "✦", effect: "주기적 광역 스킬" },
  support: { name: "지원", glyph: "+", effect: "길드원 공격 주기 단축" },
  breaker: { name: "돌파", glyph: "拳", effect: "묵직한 자동 강타" },
};

const initialState: SaveState = {
  gold: 160,
  materials: {},
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
  autoAdvance: true,
  finaleCleared: false,
};

function cloneSaveState(state: SaveState): SaveState {
  return {
    ...state,
    materials: { ...state.materials },
    cleared: [...state.cleared],
    owned: [...state.owned],
    party: [...state.party],
    progress: Object.fromEntries(Object.entries(state.progress).map(([id, progress]) => [id, { ...progress }])),
    upgrades: { ...state.upgrades },
    nodes: [...state.nodes],
  };
}

const upgradeInfo: Record<UpgradeKey, { title: string; description: string; base: number; accent: string }> = {
  range: { title: "참격 범위", description: "플레이어 클릭 공격 반경 +2.75", base: 110, accent: "원" },
  critical: { title: "치명타", description: "플레이어 무기 치명타 +5%", base: 170, accent: "치" },
  combo: { title: "연격 리듬", description: "5번째 플레이어 클릭 강화", base: 210, accent: "련" },
  execution: { title: "처형술", description: "클릭 공격으로 빈사 몬스터 즉시 처치", base: 280, accent: "참" },
  shockwave: { title: "충격파", description: "일정 클릭마다 플레이어 광역 파동", base: 320, accent: "파" },
  momentum: { title: "전투 몰입", description: "빠른 연속 클릭 피해 증가", base: 360, accent: "속" },
  time: { title: "원정 보급", description: "전투 제한 시간 +5초", base: 150, accent: "시" },
  scout: { title: "전장 정찰", description: "잔존 세력 추정 정밀화", base: 135, accent: "눈" },
  guild: { title: "길드 전술", description: "길드원 공격력 +15%", base: 140, accent: "기" },
  gold: { title: "행운의 금고", description: "토벌 골드 +10%", base: 180, accent: "금" },
  tavern: { title: "여관 증축", description: "상위 등급 영입 확률 증가", base: 300, accent: "관" },
  loot: { title: "전리품 감정", description: "장비 획득 확률 +3%", base: 260, accent: "보" },
};

const UPGRADE_LABELS = UPGRADE_KEYS.reduce((labels, key) => {
  labels[key] = upgradeInfo[key].title;
  return labels;
}, {} as Record<UpgradeKey, string>);

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

  { id: "tavern-1", title: "여관 증축 I", description: "상위 등급 영입 확률 증가", glyph: "관", target: "tavern", cost: 300, prerequisites: ["foundation"], x: 35, y: 1370 },
  { id: "tavern-2", title: "여관 증축 II", description: "상위 등급 영입 확률 증가", glyph: "잔", target: "tavern", cost: 820, prerequisites: ["tavern-1"], x: 59, y: 1370 },
  { id: "tavern-3", title: "영웅의 주점", description: "최상급 계약 확률 증가", glyph: "杯", target: "tavern", cost: 1800, prerequisites: ["tavern-2"], x: 83, y: 1370 },

  { id: "momentum-1", title: "전투 호흡", description: "빠른 연속 클릭으로 최대 13% 피해 증가", glyph: "속", target: "momentum", cost: 360, prerequisites: ["foundation"], x: 35, y: 1500 },
  { id: "momentum-2", title: "무아지경", description: "몰입 중 최대 35% 피해 증가", glyph: "無", target: "momentum", cost: 940, prerequisites: ["momentum-1"], x: 59, y: 1500 },
  { id: "momentum-3", title: "찰나의 극의", description: "몰입 중 최대 68% 피해 증가", glyph: "極", target: "momentum", cost: 2150, prerequisites: ["momentum-2"], x: 83, y: 1500 },

  ...SPECIAL_RESEARCH_NODES,

  { id: "citadel", title: "전설의 길드 성채", description: "모든 성장 계통과 특수 비술을 완성한 증표", glyph: "♛", cost: 6200, prerequisites: ["shockwave-3", "range-7", "crit-4", "combo-4", "execute-3", "time-4", "scout-3", "guild-5", "gold-4", "loot-3", "tavern-3", "momentum-3", "special-lightning-2", "special-tornado-3", "special-meteor-4"], x: 94, y: 720 },
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

function memberById(id: string) {
  return MEMBERS.find((member) => member.id === id)!;
}

function attackFor(member: MemberDefinition, progress: MemberProgress | undefined) {
  const state = progress ?? { level: 1, xp: 0, gear: 0 };
  return member.attack + member.growth * (state.level - 1) + state.gear * (4 + RANK_ORDER.indexOf(member.rank) * 5);
}

function combatStyleCounts(members: MemberDefinition[]) {
  return members.reduce<Record<CombatStyle, number>>((counts, member) => {
    const style = combatTraitFor(member).style;
    counts[style] += 1;
    return counts;
  }, { vanguard: 0, marksman: 0, assassin: 0, arcane: 0, support: 0, breaker: 0 });
}

function spawnMonsterPack(stage: ReturnType<typeof getStage>): FieldMonster[] {
  const count = stage.localStage === 1
    ? Math.min(64, 42 + stage.regionIndex * 2)
    : stage.localStage === 2
      ? Math.min(88, 68 + stage.regionIndex * 2)
      : Math.min(84, 54 + stage.regionIndex * 3);
  const weights = Array.from({ length: count }, (_, index) => stage.boss && index === 0 ? 5 : index % 7 === 0 ? 1.75 : .82 + index % 4 * .16);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const totalHp = Math.round(stage.hp * (stage.boss ? 1.7 : 1.42));

  return weights.map((weight, index) => {
    const maxHp = Math.max(4, Math.round(totalHp * weight / totalWeight));
    const kind: FieldMonster["kind"] = stage.boss && index === 0 ? "leader" : index % 7 === 0 ? "brute" : index % 5 === 0 ? "mystic" : "swarm";
    return {
      id: `${stage.stage}-monster-${index}`,
      x: 12 + (index * 37 + stage.stage * 13 + Math.floor(index / 9) * 11) % 78,
      y: 14 + (index * 29 + stage.stage * 7 + Math.floor(index / 7) * 13) % 72,
      scale: kind === "leader" ? 1.28 : kind === "brute" ? 1.02 : .62 + index % 4 * .07,
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
    case "tavern": return `B 이상 영입 확률 ${formatRecruitRate(highRankRecruitChance(level))}`;
    case "loot": return `장비 획득 확률 +${level * 3}%`;
  }
}

export default function Game() {
  const [save, setSave] = useState<SaveState>(initialState);
  const [activeFacility, setActiveFacility] = useState<GuildFacility>("hall");
  const [hydrated, setHydrated] = useState(false);
  const [battleActive, setBattleActive] = useState(false);
  const [fieldMonsters, setFieldMonsters] = useState<FieldMonster[]>([]);
  const [now, setNow] = useState(0);
  const [stagePicker, setStagePicker] = useState(false);
  const [toast, setToast] = useState("");
  const [recruitResults, setRecruitResults] = useState<RecruitResult[]>([]);
  const [recruitSequence, setRecruitSequence] = useState(0);
  const [pendingSaleId, setPendingSaleId] = useState<string | null>(null);
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [battleDeadline, setBattleDeadline] = useState<number | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const [developerToolsAvailable, setDeveloperToolsAvailable] = useState(false);
  const [developerStage, setDeveloperStage] = useState<number | null>(null);
  const [developerClickLevel, setDeveloperClickLevel] = useState(CLICK_ATTACK_PATTERNS.length - 1);
  const [developerUpgrades, setDeveloperUpgrades] = useState<UpgradeLevels>(() => maximumUpgradeLevels());
  const [finaleMode, setFinaleMode] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [momentumStacks, setMomentumStacks] = useState(0);
  const [hitFx, setHitFx] = useState<ClickAttackFx | null>(null);
  const [activeHitFxs, setActiveHitFxs] = useState<ClickAttackFx[]>([]);
  const [memberWeaponFx, setMemberWeaponFx] = useState<MemberWeaponFx[]>([]);
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
  const memberWeaponFxCounter = useRef(0);
  const clickCount = useRef(0);
  const momentumState = useRef({ lastAt: 0, stacks: 0 });
  const victoryLock = useRef(false);
  const rewardLock = useRef(false);
  const lootPlan = useRef<BattleLootDrop[]>([]);
  const lootDropsRef = useRef<BattleLootDrop[]>([]);
  const revealedLootIds = useRef(new Set<string>());
  const lootTimers = useRef<number[]>([]);
  const developerEntrySave = useRef<SaveState | null>(null);

  const stageNumber = developerMode && developerStage ? developerStage : save.selectedStage;
  const effectiveUpgrades = developerMode ? developerUpgrades : save.upgrades;
  const stage = useMemo(() => getStage(stageNumber), [stageNumber]);
  const stageMaterial = useMemo(() => stageMaterialFor(stageNumber), [stageNumber]);
  const fieldAsset = useMemo(() => fieldAssetForRegion(stage.region.hue), [stage.region.hue]);
  const monsterAsset = useMemo(() => monsterAssetForStage(stageNumber), [stageNumber]);
  const partyMembers = useMemo(() => developerMode && !save.party.length ? [memberById("roan")] : save.party.map(memberById), [developerMode, save.party]);
  const progressFor = useCallback((member: MemberDefinition) => developerMode ? { level: member.maxLevel, xp: 0, gear: DEV_GEAR_LEVEL } : save.progress[member.id], [developerMode, save.progress]);
  const developerPower = developerMode ? DEV_POWER_MULTIPLIER : 1;
  const traitCounts = useMemo(() => combatStyleCounts(partyMembers), [partyMembers]);
  const clickVisualLevel = developerMode ? developerClickLevel : save.weaponLevel;
  const activeClickPattern = clickAttackPattern(clickVisualLevel);
  const clickDamage = Math.round(BASE_CLICK_DAMAGE * activeClickPattern.damageScale * developerPower);
  const attackRange = BASE_ATTACK_RANGE + effectiveUpgrades.range * 2.75;
  const criticalChance = Math.min(.45, effectiveUpgrades.critical * .05);
  const executionThreshold = effectiveUpgrades.execution ? .05 + effectiveUpgrades.execution * .02 : 0;
  const comboLevel = effectiveUpgrades.combo;
  const shockwaveLevel = effectiveUpgrades.shockwave;
  const momentumLevel = effectiveUpgrades.momentum;
  const momentumMaxStacks = momentumLevel ? 3 + momentumLevel * 2 : 0;
  const guildMultiplier = Math.pow(1.15, effectiveUpgrades.guild);
  const assistMultiplier = 1 + traitCounts.support * .12 + traitCounts.vanguard * .08;
  const goldMultiplier = Math.pow(1.1, effectiveUpgrades.gold);
  const battleSeconds = (developerMode ? DEV_BATTLE_SECONDS : stage.boss ? BOSS_BATTLE_SECONDS : NORMAL_BATTLE_SECONDS) + effectiveUpgrades.time * 5 + traitCounts.support * 3;
  const battleTimeLeft = battleDeadline ? Math.max(0, Math.ceil((battleDeadline - now) / 1000)) : battleSeconds;
  const finaleLoadout = useMemo<FinaleLoadout>(() => ({
    hallLevel: developerMode ? GUILD_HALL_STAGES.length : save.guildHallLevel,
  }), [developerMode, save.guildHallLevel]);
  const lootCollecting = lootPhase === "collecting";
  const combatLocked = battleActive || lootCollecting || victory || defeat;
  const aliveMonsters = useMemo(() => fieldMonsters.filter((monster) => monster.hp > 0), [fieldMonsters]);
  const defeatedMonsters = fieldMonsters.length - aliveMonsters.length;
  const defeatSalvage = useMemo(() => developerMode ? { gold: 0, material: 0 } : failureSalvageFor(stage.stage, Math.round(stage.gold * goldMultiplier), stageMaterial.rewardAmount, defeatedMonsters, fieldMonsters.length), [developerMode, stage.stage, stage.gold, goldMultiplier, stageMaterial.rewardAmount, defeatedMonsters, fieldMonsters.length]);
  const droppedGold = useMemo(() => lootDrops.reduce((sum, drop) => sum + (drop.kind === "gold" ? drop.amount : 0), 0), [lootDrops]);
  const droppedMaterial = useMemo(() => lootDrops.reduce((sum, drop) => sum + (drop.kind === "material" ? drop.amount : 0), 0), [lootDrops]);
  const lootSweepProgress = ((plannedGold ? collectedGold / plannedGold : 1) + (plannedMaterial ? collectedMaterial / plannedMaterial : 1)) / 2 * 100;
  const autoAttackPoint = useMemo(() => bestAttackPoint(aliveMonsters, attackRange), [aliveMonsters, attackRange]);
  const intelReport = battlefieldIntel(aliveMonsters.length, fieldMonsters.length, effectiveUpgrades.scout);
  const shockwaveInterval = shockwaveLevel ? 9 - shockwaveLevel : 0;
  const shockwaveClicksRemaining = shockwaveInterval ? shockwaveInterval - clicks % shockwaveInterval : 0;
  const shockwaveCharge = shockwaveInterval ? clicks % shockwaveInterval / shockwaveInterval * 100 : 0;
  const comboClicksRemaining = comboLevel ? 5 - clicks % 5 : 0;
  const comboCharge = comboLevel ? clicks % 5 / 5 * 100 : 0;
  const combatUpgradeLevel = (key: CombatProcKey) => effectiveUpgrades[key];
  const activeCombatProcs: Array<{ key: CombatProcKey; title: string; level: number; detail: string }> = [];
  if (hitFx) {
    if (combatUpgradeLevel("range")) activeCombatProcs.push({ key: "range", title: "공격 범위", level: combatUpgradeLevel("range"), detail: `직접 공격 반경 ${attackRange.toFixed(1)}` });
    if (hitFx.shockwave) activeCombatProcs.push({ key: "shockwave", title: "충격파", level: shockwaveLevel, detail: `반경 ×1.55 · 피해 ×${(1.3 + shockwaveLevel * .15).toFixed(2)}` });
    if (hitFx.executionCount) activeCombatProcs.push({ key: "execution", title: "약점 처형", level: combatUpgradeLevel("execution"), detail: `${hitFx.executionCount}체 즉시 처치` });
    if (hitFx.critical) activeCombatProcs.push({ key: "critical", title: "치명타", level: combatUpgradeLevel("critical"), detail: "직접 공격 피해 ×2.00" });
    if (hitFx.combo) activeCombatProcs.push({ key: "combo", title: "연격", level: combatUpgradeLevel("combo"), detail: `5번째 공격 · 피해 ×${(1.35 + combatUpgradeLevel("combo") * .1).toFixed(2)}` });
    if (hitFx.momentum) activeCombatProcs.push({ key: "momentum", title: "전투 몰입", level: momentumLevel, detail: `${hitFx.momentum}/${momentumMaxStacks}중첩 · 피해 +${Math.round(hitFx.momentum * momentumLevel * 2.5)}%` });
  }
  const attackUpgradeStatuses: Array<{ key: CombatProcKey; title: string; level: number; status: string; charge: number; active: boolean; ready: boolean }> = [
    { key: "range", title: "공격 범위", level: combatUpgradeLevel("range"), status: combatUpgradeLevel("range") ? `반경 ${attackRange.toFixed(1)}` : "잠김", charge: combatUpgradeLevel("range") / UPGRADE_CAPS.range * 100, active: Boolean(hitFx && combatUpgradeLevel("range")), ready: false },
    { key: "critical", title: "치명타", level: combatUpgradeLevel("critical"), status: combatUpgradeLevel("critical") ? `확률 ${Math.round(criticalChance * 100)}%` : "잠김", charge: combatUpgradeLevel("critical") / UPGRADE_CAPS.critical * 100, active: Boolean(hitFx?.critical), ready: false },
    { key: "shockwave", title: "충격파", level: shockwaveLevel, status: shockwaveLevel ? hitFx?.shockwave ? "지금 발동!" : shockwaveClicksRemaining === 1 ? "다음 타격 발동" : `${shockwaveClicksRemaining}타 후 발동` : "잠김", charge: shockwaveCharge, active: Boolean(hitFx?.shockwave), ready: Boolean(shockwaveLevel && shockwaveClicksRemaining === 1) },
    { key: "combo", title: "연격", level: comboLevel, status: comboLevel ? hitFx?.combo ? "지금 발동!" : comboClicksRemaining === 1 ? "다음 타격 발동" : `${comboClicksRemaining}타 후 발동` : "잠김", charge: comboCharge, active: Boolean(hitFx?.combo), ready: Boolean(comboLevel && comboClicksRemaining === 1) },
    { key: "execution", title: "약점 처형", level: combatUpgradeLevel("execution"), status: combatUpgradeLevel("execution") ? hitFx?.executionCount ? `${hitFx.executionCount}체 처형!` : `체력 ${Math.round(executionThreshold * 100)}%` : "잠김", charge: combatUpgradeLevel("execution") / UPGRADE_CAPS.execution * 100, active: Boolean(hitFx?.executionCount), ready: false },
    { key: "momentum", title: "전투 몰입", level: momentumLevel, status: momentumLevel ? `${momentumStacks}/${momentumMaxStacks}중첩` : "잠김", charge: momentumMaxStacks ? momentumStacks / momentumMaxStacks * 100 : 0, active: Boolean(hitFx?.momentum), ready: Boolean(momentumLevel && momentumStacks === momentumMaxStacks) },
  ];
  const hallStage = guildHallStage(save.guildHallLevel);
  const nextHallStage = GUILD_HALL_STAGES[save.guildHallLevel] ?? null;

  /* eslint-disable react-hooks/set-state-in-effect -- Saved progress is intentionally restored after the client mounts. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw) as Partial<SaveState> & { upgrades?: Partial<Record<UpgradeKey, number>> & { click?: number }; bossTokens?: unknown; specials?: unknown };
        delete loaded.bossTokens;
        delete loaded.specials;
        const migratedUpgrades = (Object.keys(initialState.upgrades) as UpgradeKey[]).reduce((result, key) => ({ ...result, [key]: Math.min(UPGRADE_CAPS[key], loaded.upgrades?.[key] ?? 0) }), { ...initialState.upgrades });
        const migratedWeaponLevel = Math.min(WEAPON_MAX_LEVEL, Math.max(0, loaded.weaponLevel ?? loaded.upgrades?.click ?? 0));
        const knownNodes = (loaded.nodes ?? initialState.nodes).filter((id) => UPGRADE_NODES.some((node) => node.id === id));
        const validNodes = knownNodes.filter((id) => id !== "citadel" || UPGRADE_NODES.find((node) => node.id === "citadel")!.prerequisites.every((required) => knownNodes.includes(required)));
        const migratedNodes = validNodes.length ? validNodes : initialState.nodes;
        const inferredHallLevel = inferHallLevelFromNodes(migratedNodes);
        const migratedHallLevel = Math.min(GUILD_HALL_STAGES.length, Math.max(inferredHallLevel, loaded.guildHallLevel ?? 1));
        const migratedMaterials = migrateMaterialInventory(loaded.materials ?? {});
        const migratedSelectedStage = Math.min(STAGE_COUNT, Math.max(1, loaded.selectedStage ?? 1));
        const migratedUnlockedStage = Math.min(STAGE_COUNT, Math.max(1, loaded.unlockedStage ?? 1));
        const migratedCleared = (loaded.cleared ?? []).filter((stageNumber) => stageNumber >= 1 && stageNumber <= STAGE_COUNT);
        setSave({ ...initialState, ...loaded, selectedStage: migratedSelectedStage, unlockedStage: migratedUnlockedStage, cleared: migratedCleared, materials: migratedMaterials, guildHallLevel: migratedHallLevel, weaponLevel: migratedWeaponLevel, nodes: migratedNodes, upgrades: migratedUpgrades });
      }
    } catch {
      setToast("저장 데이터를 불러오지 못해 새 게임으로 시작합니다.");
    }
    setHydrated(true);
    setDeveloperToolsAvailable(["localhost", "127.0.0.1"].includes(window.location.hostname));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated || developerMode) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save, hydrated, developerMode]);

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
    playStageClearSound(stage.boss);
    if (developerMode) {
      if (stage.stage === STAGE_COUNT) setFinaleMode(true);
      setToast("개발자 토벌 성공! 보상과 진행도는 저장되지 않습니다.");
      return;
    }
    if (stage.stage === STAGE_COUNT) setFinaleMode(true);
    const firstClear = !save.cleared.includes(stage.stage);
    const earnedGold = Math.round(stage.gold * goldMultiplier);
    const earnedMaterial = stageMaterial.rewardAmount;
    const gotGear = Math.random() < Math.min(0.45, 0.07 + effectiveUpgrades.loot * 0.03);
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
        cleared: firstClear ? [...current.cleared, stage.stage] : current.cleared,
        unlockedStage: firstClear ? Math.min(STAGE_COUNT, Math.max(current.unlockedStage, stage.stage + 1)) : current.unlockedStage,
        progress,
      };
    });

    const rareReward = gearTarget
        ? "gear"
        : firstClear
          ? "first-clear"
          : null;
    if (rareReward) playRareRewardSound(rareReward);
    setToast(`토벌 성공! 골드 ${compactNumber(earnedGold)} · ${stageMaterial.name} ${earnedMaterial}개${gearTarget ? ` · ${memberById(gearTarget).name} 장비 획득` : ""}`);
  }, [developerMode, save.cleared, save.party, effectiveUpgrades.loot, stage, stageMaterial, goldMultiplier]);

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
    playExpeditionFailSound();
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
    if (!developerMode && (defeatSalvage.gold || defeatSalvage.material)) {
      setSave((current) => ({
        ...current,
        gold: current.gold + defeatSalvage.gold,
        materials: { ...current.materials, [stageMaterial.id]: (current.materials[stageMaterial.id] ?? 0) + defeatSalvage.material },
      }));
    }
    lootPlan.current = [];
    lootDropsRef.current = [];
    revealedLootIds.current.clear();
    setLostMembers([...save.party]);
    setToast(developerMode ? "개발자 전투 실패 · 진행도는 저장되지 않습니다." : `원정 실패 · 쓰러뜨린 적의 전리품에서 골드 ${compactNumber(defeatSalvage.gold)} · ${stageMaterial.name} ${defeatSalvage.material}개를 회수했습니다.`);
  }, [clearLootTimers, developerMode, save.party, defeatSalvage, stageMaterial.id, stageMaterial.name]);

  useEffect(() => {
    if (!battleActive || !battleDeadline || !aliveMonsters.length) return;
    const timer = window.setTimeout(failBattle, Math.max(0, battleDeadline - Date.now()));
    return () => window.clearTimeout(timer);
  }, [battleActive, battleDeadline, aliveMonsters.length, failBattle]);

  const damageMonsters = useCallback((targetIds: string[], damage: number, allowExecution = false, impactTier = 0) => {
    if (!targetIds.length) return;
    playMonsterHitSound(impactTier, targetIds.length);
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

  const {
    activeKinds: activeSpecialAttacks,
    effects: specialAttackEffects,
    lastCastAt: specialLastCastAt,
  } = useSpecialAttackController({
    battleActive,
    now,
    nodeIds: save.nodes,
    unlockAll: developerMode,
    monsters: fieldMonsters,
    playerDamage: clickDamage,
    weaponTier: activeClickPattern.tier,
    damageMonsters,
    setMonsters: setFieldMonsters,
  });

  const emitMemberWeaponFx = useCallback((member: MemberDefinition, point: { x: number; y: number }, skill = false, slot = 0) => {
    const id = memberWeaponFxCounter.current + 1;
    memberWeaponFxCounter.current = id;
    const angle = slot * Math.PI / 2 - Math.PI / 4;
    const fx: MemberWeaponFx = {
      id,
      memberId: member.id,
      style: combatTraitFor(member).style,
      glyph: member.glyph,
      color: member.hue,
      x: Math.max(5, Math.min(95, point.x + Math.cos(angle) * (skill ? 4 : 2))),
      y: Math.max(8, Math.min(92, point.y + Math.sin(angle) * (skill ? 4 : 2))),
      skill,
    };
    setMemberWeaponFx((current) => [...current.slice(-18), fx]);
    window.setTimeout(() => setMemberWeaponFx((current) => current.filter((effect) => effect.id !== id)), skill ? 1050 : 720);
  }, []);

  useEffect(() => {
    if (!battleActive || !aliveMonsters.length) return;
    partyMembers.forEach((member, index) => {
      const attackMs = member.interval * 1000 / (1 + traitCounts.support * .08);
      const skillMs = member.skillCooldown * 1000 / (1 + traitCounts.support * .06);
      if (!lastAttack.current[member.id]) lastAttack.current[member.id] = now;
      if (!lastSkill.current[member.id]) lastSkill.current[member.id] = now;
      if (now - lastAttack.current[member.id] >= attackMs) {
        lastAttack.current[member.id] = now;
        const target = aliveMonsters[(index + Math.floor(now / Math.max(1, attackMs))) % aliveMonsters.length];
        damageMonsters([target.id], attackFor(member, progressFor(member)) * guildMultiplier * developerPower * MEMBER_ASSIST_FACTOR * assistMultiplier);
        emitMemberWeaponFx(member, target, false, index);
      }
      if (now - lastSkill.current[member.id] >= skillMs) {
        lastSkill.current[member.id] = now;
        const skillTargets = aliveMonsters.slice(index % aliveMonsters.length).concat(aliveMonsters).slice(0, Math.min(aliveMonsters.length, 2 + Math.floor(effectiveUpgrades.guild / 2)));
        damageMonsters(skillTargets.map((monster) => monster.id), attackFor(member, progressFor(member)) * guildMultiplier * member.skillMultiplier * developerPower * MEMBER_ASSIST_FACTOR * assistMultiplier);
        emitMemberWeaponFx(member, bestAttackPoint(skillTargets, attackRange), true, index);
      }
    });
  }, [now, battleActive, aliveMonsters, partyMembers, progressFor, developerPower, guildMultiplier, effectiveUpgrades.guild, damageMonsters, traitCounts.support, assistMultiplier, emitMemberWeaponFx, attackRange]);

  const directAttackAt = useCallback((x: number, y: number) => {
    if (!battleActive || !aliveMonsters.length) return;
    const nextClicks = clickCount.current + 1;
    const combo = comboLevel > 0 && nextClicks % 5 === 0;
    const critical = Math.random() < criticalChance;
    const comboMultiplier = combo ? 1.35 + comboLevel * .1 : 1;
    const timestamp = Date.now();
    let nextMomentum = 0;
    let momentumMaxed = false;
    if (momentumLevel > 0) {
      const chained = timestamp - momentumState.current.lastAt <= 1250;
      const maxStacks = 3 + momentumLevel * 2;
      nextMomentum = Math.min(maxStacks, chained ? momentumState.current.stacks + 1 : 1);
      momentumMaxed = nextMomentum === maxStacks && momentumState.current.stacks < maxStacks;
      momentumState.current = { lastAt: timestamp, stacks: nextMomentum };
      setMomentumStacks(nextMomentum);
    }
    const shockwave = shockwaveLevel > 0 && nextClicks % (9 - shockwaveLevel) === 0;
    const effectiveRange = attackRange * (shockwave ? 1.55 : 1);
    const momentumMultiplier = 1 + nextMomentum * momentumLevel * .025;
    const shockwaveMultiplier = shockwave ? 1.3 + shockwaveLevel * .15 : 1;
    const damage = Math.round(clickDamage * (critical ? 2 : 1) * comboMultiplier * momentumMultiplier * shockwaveMultiplier);
    const targets = aliveMonsters.filter((monster) => distanceOnField(monster, { x, y }) <= effectiveRange);
    const roundedDamage = Math.max(1, Math.round(damage));
    const executionTargets = executionThreshold > 0
      ? targets.filter((monster) => {
        const remainingHp = Math.max(0, monster.hp - roundedDamage);
        return remainingHp > 0 && remainingHp / monster.maxHp <= executionThreshold;
      }).map((monster) => monster.id)
      : [];
    const executionCount = executionTargets.length;
    const effectId = clickFxCounter.current + 1;
    clickFxCounter.current = effectId;
    const nextHitFx: ClickAttackFx = {
      id: effectId,
      tier: activeClickPattern.tier,
      variant: effectId % activeClickPattern.variants,
      damage,
      critical,
      combo,
      shockwave,
      momentum: nextMomentum,
      executionCount,
      executionTargets,
      hitCount: targets.length,
      targets: targets.map((monster) => monster.id),
      x,
      y,
      radius: effectiveRange,
    };
    setHitFx(nextHitFx);
    setActiveHitFxs((current) => [...current.slice(-(MAX_SIMULTANEOUS_CLICK_FX - 1)), nextHitFx]);
    const feedbackDuration = shockwave ? 1750 : executionCount || critical || combo || nextMomentum ? 1250 : activeClickPattern.duration;
    window.setTimeout(() => {
      setHitFx((current) => current?.id === effectId ? null : current);
      setActiveHitFxs((current) => current.filter((effect) => effect.id !== effectId));
    }, Math.max(activeClickPattern.duration, feedbackDuration));
    if (targets.length) playCombatProcSound({ critical, combo, shockwave, execution: executionCount > 0, momentumMaxed });
    damageMonsters(targets.map((monster) => monster.id), damage, true, activeClickPattern.tier);
    clickCount.current = nextClicks;
    setClicks(nextClicks);
  }, [battleActive, aliveMonsters, comboLevel, clickDamage, activeClickPattern, criticalChance, executionThreshold, attackRange, momentumLevel, shockwaveLevel, damageMonsters]);

  function startStage(stageNumber = stage.stage) {
    unlockBattleAudio();
    if (!save.party.length && !developerMode) {
      setToast("출전할 길드원이 없습니다. 여관에서 새 길드원을 고용하고 파티에 편성하세요.");
      return;
    }
    const nextStage = getStage(stageNumber);
    playExpeditionStartSound(nextStage.boss);
    const nextMaterial = stageMaterialFor(stageNumber);
    const durationSeconds = (developerMode ? DEV_BATTLE_SECONDS : nextStage.boss ? BOSS_BATTLE_SECONDS : NORMAL_BATTLE_SECONDS) + effectiveUpgrades.time * 5 + traitCounts.support * 3;
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
    setMemberWeaponFx([]);
    setHitFx(null);
    setActiveHitFxs([]);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    setToast(`${nextStage.region.name} ${nextStage.localStage}웨이브 진입 · 몬스터 ${monsters.length}마리가 몰려옵니다! 길드 조합으로 전장을 쓸어내세요.`);
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
    setMemberWeaponFx([]);
    setActiveHitFxs([]);
    setWeaponCursor((cursor) => ({ ...cursor, visible: false }));
    setLootDrops([]);
    setLootPhase("idle");
    setCollectedGold(0);
    setCollectedMaterial(0);
    setPlannedGold(0);
    setPlannedMaterial(0);
    lootPlan.current = [];
    lootDropsRef.current = [];
    revealedLootIds.current.clear();
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
    if (next) {
      developerEntrySave.current = cloneSaveState(save);
    } else if (developerEntrySave.current) {
      setSave(cloneSaveState(developerEntrySave.current));
      developerEntrySave.current = null;
    }
    setDeveloperMode(next);
    setDeveloperStage(next ? save.selectedStage : null);
    if (next) setDeveloperClickLevel(CLICK_ATTACK_PATTERNS.length - 1);
    setToast(next ? "개발자 모드 ON · 자원·구매·업그레이드 시험값과 전체 웨이브가 임시 해금됩니다. 결과는 저장되지 않습니다." : "개발자 모드 OFF · 진입 전 저장 진행도로 돌아왔습니다.");
  }

  function previewClickPattern(level: number) {
    const pattern = clickAttackPattern(level);
    setDeveloperClickLevel(level);
    setHitFx(null);
    setActiveHitFxs([]);
    setToast(`플레이어 무기 ${pattern.tier + 1}/15 · ${pattern.weaponName} · ${pattern.title} 미리보기입니다.`);
  }

  function purchaseWeaponUpgrade() {
    const nextLevel = save.weaponLevel + 1;
    if (nextLevel > WEAPON_MAX_LEVEL) return setToast("모든 플레이어 무기를 완성했습니다. 길드마스터 신검이 최종 단계입니다!");
    const nextWeapon = clickAttackPattern(nextLevel);
    const recipe = weaponMaterialRecipe(nextLevel);
    if (save.gold < nextWeapon.cost) return setToast(`${nextWeapon.weaponName}을(를) 제작할 골드가 부족합니다.`);
    if (!canAffordWeaponRecipe(save.materials, recipe) && recipe) {
      const shortages = recipe.ingredients
        .filter(({ material, amount }) => (save.materials[material.id] ?? 0) < amount)
        .map(({ material, amount }) => `${material.name} ${amount - (save.materials[material.id] ?? 0)}개`)
        .join(" · ");
      return setToast(`${nextWeapon.weaponName} 제작 재료가 부족합니다: ${shortages}. 다음 지역 원정을 진행하세요.`);
    }
    setSave((current) => {
      const materials = consumeWeaponRecipe(current.materials, recipe);
      if (!materials || current.gold < nextWeapon.cost) return current;
      return { ...current, gold: current.gold - nextWeapon.cost, materials, weaponLevel: nextLevel };
    });
    setTerritoryPulse((current) => current + 1);
    playProgressionSound("weapon-craft", nextLevel);
    setToast(`${nextWeapon.weaponName} 완성! 플레이어 클릭 공격력이 ${Math.round(nextWeapon.damageScale * 100)}%로 상승했습니다.`);
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
    playProgressionSound("guild-hall", nextHallStage.level);
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
    playProgressionSound("research-unlock", node.target ? save.upgrades[node.target] + 1 : save.nodes.length + 1);
    setToast(`${node.title} 노드를 해금했습니다. 새로운 성장 경로가 발견됩니다!`);
  }

  function recruitGuildMembers(count: 1 | 10) {
    const cost = count === 1 ? RECRUIT_COSTS.single : RECRUIT_COSTS.ten;
    if (save.gold < cost) return setToast(`${count}명 영입에 필요한 골드가 부족합니다.`);

    const rolls = rollRecruitMembers(MEMBERS, count, effectiveUpgrades.tavern);
    const settlement = settleRecruitment(save.owned, rolls);
    setRecruitResults(settlement.results);
    setRecruitSequence((current) => current + 1);
    setSave((current) => {
      const progress = { ...current.progress };
      settlement.newMemberIds.forEach((id) => {
        progress[id] = { level: 1, xp: 0, gear: 0 };
      });
      return {
        ...current,
        gold: current.gold - cost + settlement.refund,
        owned: [...current.owned, ...settlement.newMemberIds],
        progress,
      };
    });
    playGuildMemberHireSound(count);

    const bestRoll = rolls.reduce((best, member) => RANK_ORDER.indexOf(member.rank) > RANK_ORDER.indexOf(best.rank) ? member : best);
    const rareCallout = RANK_ORDER.indexOf(bestRoll.rank) >= RANK_ORDER.indexOf("B") ? `${bestRoll.rank}등급 ${bestRoll.name}! ` : "";
    const refundCallout = settlement.refund > 0 ? ` · 중복 정산 +${compactNumber(settlement.refund)} G` : "";
    setToast(`${rareCallout}${count}명 영입 완료 · 신규 ${settlement.newMemberIds.length}명${refundCallout}`);
  }

  function requestMemberSale(id: string) {
    const member = memberById(id);
    if (save.party.includes(id)) return setToast("편성 중인 길드원은 파티에서 해제한 뒤 판매할 수 있습니다.");
    if (save.owned.length <= 1) return setToast("길드를 지킬 마지막 길드원은 판매할 수 없습니다.");
    setPendingSaleId(member.id);
  }

  function confirmMemberSale() {
    if (!pendingSaleId) return;
    const member = memberById(pendingSaleId);
    if (save.party.includes(member.id) || save.owned.length <= 1 || !save.owned.includes(member.id)) {
      setPendingSaleId(null);
      return setToast("현재 상태에서는 이 길드원을 판매할 수 없습니다.");
    }
    const salePrice = MEMBER_SALE_PRICES[member.rank];

    setSave((current) => {
      const nextProgress = { ...current.progress };
      delete nextProgress[member.id];
      return {
        ...current,
        gold: current.gold + salePrice,
        owned: current.owned.filter((memberId) => memberId !== member.id),
        progress: nextProgress,
      };
    });
    setPendingSaleId(null);
    setToast(`${member.name} 계약 해지 · ${compactNumber(salePrice)} G를 돌려받았습니다.`);
  }

  function selectGuildFacility(facility: GuildFacility) {
    setPendingSaleId(null);
    playMenuTabSound();
    setActiveFacility(facility);
  }

  function openHuntingGround() {
    playMenuTabSound();
    setStagePicker(true);
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

  function resetGame() {
    if (!window.confirm("모든 진행 상황을 지우고 새 게임을 시작할까요?")) return;
    localStorage.removeItem(SAVE_KEY);
    developerEntrySave.current = null;
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
    setDeveloperClickLevel(CLICK_ATTACK_PATTERNS.length - 1);
    setFinaleMode(false);
    setFieldMonsters([]);
    setHitFx(null);
    setActiveHitFxs([]);
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
    setActiveFacility("hall");
    setToast("새로운 길드가 창설되었습니다. 파티를 편성하고 첫 토벌을 준비하세요.");
  }

  function attackField(event: React.PointerEvent<HTMLDivElement>) {
    if (!battleActive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
    const y = Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100));
    if (event.pointerType === "mouse") setWeaponCursor({ x, y, visible: true });
    directAttackAt(x, y);
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

  function leaveFinale() {
    setFinaleMode(false);
    returnToGuild(developerMode
      ? "개발자 글리치 탄막 시험을 종료했습니다. 저장 진행도는 바뀌지 않습니다."
      : "글리치 코어에서 이탈해 길드 영지로 귀환했습니다.");
  }

  function completeFinale() {
    if (!developerMode) setSave((current) => ({ ...current, finaleCleared: true }));
    setFinaleMode(false);
    returnToGuild(developerMode
      ? "개발자 글리치 보스 격파 완료! 시험 결과는 저장되지 않습니다."
      : "기록 말소자를 격파했습니다. 길드의 마지막 기록이 새로 쓰였습니다.");
  }

  if (finaleMode) {
    return <BulletHellFinale
      loadout={finaleLoadout}
      mode={developerMode ? "preview" : "campaign"}
      onExit={leaveFinale}
      onVictory={completeFinale}
    />;
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
          <MaterialInventory materials={save.materials} unlockedStage={save.unlockedStage} weaponLevel={save.weaponLevel} />
        </div>
        {developerToolsAvailable && <button className={`small-button developer-toggle ${developerMode ? "active" : ""}`} onClick={toggleDeveloperMode}>DEV {developerMode ? "ON" : "OFF"}</button>}
        {developerToolsAvailable && developerMode && <button className="small-button" onClick={() => setFinaleMode(true)}>엔딩 TEST</button>}
        {!developerMode && save.cleared.includes(STAGE_COUNT) && !save.finaleCleared && <button className="small-button" onClick={() => setFinaleMode(true)}>엔딩 재개</button>}
        <button className="small-button reset-button" onClick={resetGame}>새 게임</button>
      </header>

      <section className="guild-rank-strip" aria-label="길드 성장 현황">
        <span className="guild-seal">{RANK_ORDER[Math.min(RANK_ORDER.length - 1, Math.floor((save.unlockedStage - 1) / 5))]}</span>
        <div className="guild-rank-copy">
          <span><b>15분 원정 진척</b><em>{save.unlockedStage}/{STAGE_COUNT} 웨이브</em></span>
          <i><b style={{ width: `${save.unlockedStage / STAGE_COUNT * 100}%` }} /></i>
        </div>
        <div className="current-objective"><small>현재 목표</small><strong>{stage.boss ? `${stage.name} 군주전` : `${stage.region.name} ${stage.localStage}웨이브 돌파`}</strong></div>
      </section>

      {toast && <div className="toast" role="status"><span aria-hidden="true">✦</span>{toast}</div>}
      {developerMode && <div className="developer-banner" role="status"><strong>개발자 모드</strong><span>자원·구매 진행 임시 조정 · 30개 웨이브 해금 · 업그레이드·무기 비교 · DEV 종료 시 원상 복귀</span></div>}

      {!combatLocked && (
        <section className="screen guild-screen" aria-label="길드 영지">
          <TerritoryHuntingGround
            active={stagePicker}
            stageLabel={`${stage.region.name} ${stage.localStage}웨이브`}
            onOpen={openHuntingGround}
          >
            <GuildBuildingHub
              activeFacility={activeFacility}
              hallLevel={save.guildHallLevel}
              researchCount={save.nodes.length}
              researchTotal={UPGRADE_NODES.length}
              weaponName={clickAttackPattern(save.weaponLevel).weaponName}
              partyCount={save.party.length}
              candidateCount={MEMBERS.length}
              pulse={territoryPulse}
              onSelect={selectGuildFacility}
            />
          </TerritoryHuntingGround>

          {developerMode && <DeveloperResourcePanel
            resources={{ gold: save.gold, materials: save.materials }}
            onChange={(resources) => setSave((current) => ({ ...current, ...resources }))}
          />}

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
            materials={save.materials}
            formatNumber={compactNumber}
            onUpgrade={purchaseWeaponUpgrade}
          />}

          {activeFacility === "research" && <>
            {developerMode && <DeveloperUpgradePanel
              levels={developerUpgrades}
              savedLevels={save.upgrades}
              labels={UPGRADE_LABELS}
              effectText={upgradeEffectText}
              onChange={setDeveloperUpgrades}
            />}
            <div className="upgrade-panel research-overview panel facility-first-panel">
              <div className="panel-title"><div><span className="eyebrow">GROWTH OVERVIEW</span><h3>길드 강화 현황</h3></div><span className="level-chip">본관 Lv.{hallStage.level} · 깊이 {hallStage.researchDepth}</span></div>
              <div className="growth-progress"><i style={{ width: `${save.nodes.length / UPGRADE_NODES.length * 100}%` }} /></div>
              <div className="growth-stats">
                {UPGRADE_KEYS.map((key) => <div key={key}><span className="upgrade-icon"><Image src={UPGRADE_ICON_BY_KEY[key]} alt="" width={48} height={48} aria-hidden="true" /></span><span><strong>{upgradeInfo[key].title} · Lv.{effectiveUpgrades[key]}</strong><small>{upgradeEffectText(key, effectiveUpgrades[key])}</small></span></div>)}
              </div>
            </div>
            <div className="upgrade-tree-panel panel">
              <div className="panel-title"><div><span className="eyebrow">GUILD DEVELOPMENT MAP</span><h3>플레이어·길드 발전 노드</h3><p className="panel-description">플레이어의 클릭 전투와 길드원 패시브 화력을 각각 성장시킵니다. 무기 공격력과 외형은 불꽃 대장간에서 강화됩니다.</p></div><span className="level-chip">보유 골드 {compactNumber(save.gold)}</span></div>
              <ResearchMap nodes={UPGRADE_NODES} purchasedIds={save.nodes} hallLevel={save.guildHallLevel} formatCost={compactNumber} onPurchase={(node: ResearchNodeView) => { const fullNode = UPGRADE_NODES.find((item) => item.id === node.id); if (fullNode) purchaseNode(fullNode); }} />
            </div>
            <SpecialResearchPanel
              purchasedIds={save.nodes}
              hallLevel={save.guildHallLevel}
              gold={save.gold}
              formatCost={compactNumber}
              developerMode={developerMode}
              onPurchase={purchaseNode}
            />
          </>}

          {activeFacility === "tavern" && <>
          <TavernHall
            members={MEMBERS}
            ownedIds={save.owned}
            progress={save.progress}
            partyIds={save.party}
            tavernLevel={effectiveUpgrades.tavern}
            gold={save.gold}
            recruitResults={recruitResults}
            recruitSequence={recruitSequence}
            pendingSaleId={pendingSaleId}
            formatNumber={compactNumber}
            getAttack={(member, progress) => attackFor(member, progress)}
            onRecruit={recruitGuildMembers}
            onToggleParty={toggleParty}
            onRequestSale={requestMemberSale}
            onCancelSale={() => setPendingSaleId(null)}
            onConfirmSale={confirmMemberSale}
          />
          </>}
          </div>
        </section>
      )}

      {combatLocked && (
        <section className={`screen field-screen biome-${stage.region.hue}`} aria-label="필드 전투">
          <div className="field-toolbar">
            <div><span className="eyebrow">CURRENT EXPEDITION · GUILD SURVIVOR</span><h2>{stage.region.name} <b>{stage.localStage}/{STAGES_PER_REGION}</b></h2><small className="permadeath-warning">시간 내에 군세를 쓸어내세요 · 실패해도 길드원은 보존됩니다</small></div>
            <div className="field-actions battle-controls">
              {lootCollecting
                ? <div className="battle-timer loot-sweep-timer"><span>전리품 회수</span><strong>{compactNumber(collectedGold)} G · {collectedMaterial}/{plannedMaterial} 재료</strong><i><b style={{ width: `${lootSweepProgress}%` }} /></i></div>
                : <div className={`battle-timer ${battleTimeLeft <= 10 ? "urgent" : ""}`}><span>남은 시간</span><strong>{battleTimeLeft}초</strong><i><b style={{ width: `${battleTimeLeft / battleSeconds * 100}%` }} /></i></div>}
              <button className="retreat-button" onClick={retreatBattle} disabled={!battleActive}>안전 후퇴 · 길드원 보존</button>
            </div>
          </div>

          <div className="battle-layout">
            <div className={`arena hack-arena mass-swarm has-forge-cursor panel field-tone-${fieldAsset.tone} click-style-${activeClickPattern.tier} loot-phase-${lootPhase}`} style={{ "--field-art-position": fieldAsset.objectPosition } as React.CSSProperties} onPointerDown={attackField} onPointerMove={trackWeaponCursor} onPointerLeave={() => setWeaponCursor((cursor) => ({ ...cursor, visible: false }))} role="application" aria-label="플레이어의 강화 무기로 클릭한 위치를 공격하고 길드원은 자동 공격하는 몬스터 전장">
              <Image className="field-background-art" src={fieldAsset.source} alt="" fill sizes="(max-width: 1180px) 100vw, 900px" priority={stage.stage <= 10} unoptimized draggable={false} />
              <div className="environment-tag"><span>{BIOME_DETAILS[stage.region.hue].label}</span><small>{BIOME_DETAILS[stage.region.hue].description}</small></div>
              <div className="battle-banner"><span>{stage.boss ? "BOSS SWARM" : `STAGE ${stage.stage}`}</span><strong>{stage.name} 무리</strong></div>
              <div className="swarm-hud" aria-label={`몬스터 ${defeatedMonsters}체 처치, ${aliveMonsters.length}체 생존`}>
                <span><small>KILL RUSH</small><strong>{defeatedMonsters}<em> / {fieldMonsters.length}</em></strong></span>
                <i><b style={{ width: `${fieldMonsters.length ? defeatedMonsters / fieldMonsters.length * 100 : 0}%` }} /></i>
              </div>
              <div className={`loot-tally ${lootCollecting ? "is-collecting" : ""}`}>
                <div className="loot-tally-icons"><i className="loot-tally-coin">G</i><i className="stage-material-icon loot-tally-material" style={materialIconVars(stageMaterial) as React.CSSProperties} /></div>
                <span><small>{lootCollecting ? "촤라락 회수 중" : stageMaterial.name}</small><strong>+{compactNumber(lootCollecting ? collectedGold : droppedGold)} G</strong><em>+{lootCollecting ? collectedMaterial : droppedMaterial} 재료</em></span>
              </div>
              <div className="field-click-guide"><b>필드를 직접 눌러 플레이어 무기로 베세요</b><span>길드원 무기는 각자의 주기에 따라 자동으로 적을 공격합니다</span></div>
              <WeaponCursor weapon={activeClickPattern} point={weaponCursor} />

              <div className="monster-pack" aria-hidden="true">
                {fieldMonsters.map((monster, index) => {
                  const hitDuration = monster.lastHitTier >= 4 ? 940 : monster.lastHitTier >= 3 ? 700 : 500;
                  const struck = monster.hp > 0 && monster.lastHitAt > 0 && now - monster.lastHitAt < hitDuration;
                  const executed = Boolean(hitFx?.executionTargets.includes(monster.id));
                  const specialClassName = specialMonsterClassName(monster.id, specialAttackEffects, now);
                  const artScale = (monsterAsset?.scale ?? 1) * (monster.kind === "leader" ? 1.08 : 1);
                  return <span key={`${monster.id}-${monster.hitId}`} className={`pack-monster monster-${monster.kind} ${monsterAsset ? "has-pack-art" : ""} ${monster.hp <= 0 ? "is-defeated" : ""} ${executed ? "is-executed" : ""} ${struck ? `is-struck click-recoil-tier-${monster.lastHitTier}` : ""} ${specialClassName}`} style={{ left: `${monster.x}%`, top: `${monster.y}%`, "--monster-scale": monster.scale, "--monster-art-scale": artScale, zIndex: Math.round(monster.y) } as React.CSSProperties}>
                    <i className="pack-shadow" />
                    {monsterAsset ? (
                      <span className="pack-monster-art-frame">
                        <Image className="pack-monster-art" src={monsterAsset.source} alt="" fill sizes="128px" priority={stage.stage === 1 && index < 4} unoptimized draggable={false} />
                      </span>
                    ) : (
                      <span className={`monster-sprite ${monster.kind === "leader" ? "boss" : ""}`}><i className="monster-horn left" /><i className="monster-horn right" /><i className="monster-body"><span className="monster-eye left" /><span className="monster-eye right" /><span className="monster-core" /></i><i className="monster-arm left" /><i className="monster-arm right" /><i className="monster-foot left" /><i className="monster-foot right" /></span>
                    )}
                    <i className="pack-monster-soul" aria-hidden="true">✦</i>
                    {executed && <span className="execution-finisher" aria-hidden="true"><i /><i /><i /></span>}
                    {monster.kind === "leader" && <b className="leader-mark">♛</b>}
                  </span>;
                })}
              </div>

              <SpecialAttackLayer
                effects={specialAttackEffects}
                activeKinds={battleActive ? activeSpecialAttacks : []}
                lastCastAt={specialLastCastAt}
                now={now}
              />

              <div className="member-weapon-layer" aria-hidden="true">
                {memberWeaponFx.map((effect) => <span
                  className={`member-weapon-fx weapon-style-${effect.style} ${effect.skill ? "is-skill" : ""}`}
                  key={effect.id}
                  style={{ left: `${effect.x}%`, top: `${effect.y}%`, "--weapon-color": effect.color } as React.CSSProperties}
                >
                  <i className="member-projectile primary" />
                  <i className="member-projectile secondary" />
                  <i className="member-weapon-impact" />
                  <b>{effect.glyph}</b>
                  <small>{memberById(effect.memberId).name.split(" ").at(-1)} · {effect.skill ? memberById(effect.memberId).skill : COMBAT_STYLE_LABELS[effect.style].name}</small>
                </span>)}
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

              {activeHitFxs.map((effect) => <WeaponAttackEffect
                key={effect.id}
                effect={effect}
                glyph={clickAttackPattern(effect.tier).glyph}
                formatNumber={compactNumber}
              />)}

              {hitFx && <span className="sr-only" role="status">{activeCombatProcs.length ? `${activeCombatProcs.map((proc) => `${proc.title} 레벨 ${proc.level}`).join(", ")} 발동. ` : "일반 직접 공격. "}플레이어의 {clickAttackPattern(hitFx.tier).title}, 범위 안의 몬스터 {hitFx.hitCount}체 타격</span>}
            </div>

            <aside className="battle-sidebar">
              <div className="monster-status intel-panel panel">
                <div className="monster-title"><span className={`enemy-rank ${stage.boss ? "boss-rank" : ""}`}>{stage.boss ? "군주" : "무리"}</span><div><h3>전황 판단</h3><p>{stage.region.name} · 체력 정보 비공개</p></div></div>
                <div className="intel-report"><span>정찰 보고</span><strong>{intelReport}</strong><small>적의 체력과 정확한 잔여 수는 알 수 없습니다. 화면의 움직임을 보고 후퇴를 결정하세요.</small></div>
                <div className="reward-preview"><span>예상 보상</span><strong>골드 {compactNumber(stage.gold * goldMultiplier)}</strong><strong className="material-reward-preview"><i className="stage-material-icon reward-material-icon" style={materialIconVars(stageMaterial) as React.CSSProperties} />{stageMaterial.name} {stageMaterial.rewardAmount}</strong><strong>경험치 {compactNumber(stage.xp)}</strong></div>
              </div>
              <div className="party-status panel guild-arsenal-panel">
                <div className="panel-title"><h3>길드원 패시브 무기</h3><span className="level-chip">{partyMembers.length}/4</span></div>
                <div className="equipped-member-weapons" aria-label="자동 공격하는 길드원 패시브 무기">
                  {partyMembers.map((member) => { const trait = combatTraitFor(member); return <span className={`equipped-member-weapon weapon-slot-${trait.style}`} key={member.id} style={{ "--weapon-color": member.hue } as React.CSSProperties}><b>{member.glyph}</b><small>{member.interval}초</small><strong>{member.skill}</strong></span>; })}
                </div>
                {partyMembers.map((member) => { const trait = combatTraitFor(member); return <div className="party-row" key={member.id}><span className="mini-portrait" style={{ "--member-hue": member.hue } as React.CSSProperties}>{member.glyph}</span><span><strong>{member.name}</strong><small>{member.job} · {member.interval}초마다 독립 자동 공격</small></span><b>{trait.title}</b></div>; })}
                <small>플레이어가 클릭하지 않아도 각 길드원이 자신의 무기와 스킬을 자동 발동합니다.</small>
              </div>
              <div className={`click-power panel click-power-tier-${activeClickPattern.tier}`}>
                <span>길드마스터 직접 공격 · 대장간 무기</span>
                {developerMode && <div className="developer-pattern-picker">
                  <strong>플레이어 무기 15종 비교</strong>
                  <div role="group" aria-label="플레이어 무기 업그레이드 공격 미리보기">
                    {CLICK_ATTACK_PATTERNS.map((pattern) => <button key={pattern.key} className={pattern.tier === activeClickPattern.tier ? "active" : ""} onClick={() => previewClickPattern(pattern.tier)} aria-pressed={pattern.tier === activeClickPattern.tier} aria-label={`무기 ${pattern.tier + 1}단계 ${pattern.weaponName} ${pattern.title}`} title={`${pattern.weaponName} · ${pattern.title} · ${pattern.subtitle}`}><b>{pattern.glyph}</b><small>{pattern.tier + 1} · {pattern.weaponName}</small></button>)}
                  </div>
                  <small>단계를 고른 뒤 필드를 눌러 연출을 비교하세요.</small>
                </div>}
                <div className="click-pattern-card"><b>{activeClickPattern.glyph}</b><span><strong>{activeClickPattern.weaponName} · {activeClickPattern.title}</strong><small>무기 {activeClickPattern.tier + 1}/15 · {activeClickPattern.subtitle}</small></span><em>{activeClickPattern.visualHits} HIT</em></div>
                <strong>{compactNumber(clickDamage)} 플레이어 피해</strong>
                <div className="click-combat-stats"><span><b>공격 반경</b><em>{attackRange.toFixed(1)}</em></span><span><b>치명타</b><em>{Math.round(criticalChance * 100)}%</em></span><span><b>처형선</b><em>{executionThreshold ? `${Math.round(executionThreshold * 100)}%` : "없음"}</em></span></div>
                <div className="attack-upgrade-monitor" aria-label="직접 공격 강화 현황">
                  {attackUpgradeStatuses.map((upgrade) => <span key={upgrade.key} className={`${upgrade.level ? "unlocked" : "locked"} ${upgrade.ready ? "ready" : ""} ${upgrade.active ? "triggered" : ""}`}>
                    <Image src={UPGRADE_ICON_BY_KEY[upgrade.key]} alt="" width={30} height={30} aria-hidden="true" />
                    <b>{upgrade.title}<small>{upgrade.level ? `Lv.${upgrade.level}` : "LOCK"}</small></b>
                    <em>{upgrade.status}</em>
                    {upgrade.level > 0 && <i aria-hidden="true"><u style={{ width: `${upgrade.charge}%` }} /></i>}
                  </span>)}
                </div>
                <small className="battle-click-count">직접 공격 {clicks}회 · 아이콘이 빛나면 해당 길드 강화가 발동한 공격입니다.</small>
                <small>클릭 위치와 공격 반경은 플레이어 무기에만 적용됩니다</small>
                <button className="attack-button" onClick={() => directAttackAt(autoAttackPoint.x, autoAttackPoint.y)} disabled={!battleActive}>{activeClickPattern.glyph} 가장 밀집한 곳 베기</button>
              </div>
            </aside>
          </div>

          {victory && <div className="victory-overlay" role="dialog" aria-modal="true" aria-labelledby="victory-title"><div className="victory-card"><div className="victory-crest" aria-hidden="true"><span>★</span></div><div className="victory-heading"><p>EXPEDITION COMPLETE</p><span className="victory-divider" aria-hidden="true"><i>◆</i></span><h2 id="victory-title">{fieldMonsters.length}마리 처치 완료!</h2><small>{stage.region.name}의 위협을 몰아냈습니다</small></div><div className="outcome-rewards" aria-label="획득 보상"><span>{developerMode ? <><i className="reward-glyph">◇</i><small>전투 기록</small><b>저장 안 됨</b></> : <><i className="reward-glyph">●</i><small>골드</small><b>+{compactNumber(stage.gold * goldMultiplier)}</b></>}</span>{!developerMode && <span className="material-victory-reward"><i className="stage-material-icon reward-material-icon" style={materialIconVars(stageMaterial) as React.CSSProperties} /><small>{stageMaterial.name}</small><b>+{stageMaterial.rewardAmount}</b></span>}{!developerMode && <span><i className="reward-glyph reward-xp">✦</i><small>경험치</small><b>+{compactNumber(stage.xp)}</b></span>}{stage.boss && <span className="boss-clear-reward"><i className="reward-glyph">♜</i><small>군주 토벌</small><b>완료</b></span>}</div><div className="outcome-actions">{stage.stage < (developerMode ? STAGE_COUNT : save.unlockedStage) && <button className="primary-button" onClick={() => startStage(Math.min(STAGE_COUNT, stage.stage + 1))}><small>모험 계속하기</small><span>다음 지역</span><b aria-hidden="true">›</b></button>}<button className="secondary-button" onClick={() => startStage(stage.stage)}><small>같은 지역</small><span>재전투</span></button><button className="text-button" onClick={() => returnToGuild("토벌을 마치고 영지로 복귀했습니다.")}>영지로 복귀</button></div></div></div>}
          {defeat && <div className="victory-overlay defeat-overlay"><div className="victory-card defeat-card"><span className="victory-star">⚑</span><p>EXPEDITION FAILED</p><h2>공세 실패</h2><div className="defeat-copy"><strong>{developerMode ? "개발자 모드 전투가 종료되었습니다." : "길드원은 모두 부상만 입고 여관으로 복귀합니다."}</strong>{lostMembers.map((id) => <span key={id}>＋ {memberById(id).name} · 회복 완료</span>)}{!developerMode && <span>회수 전리품 · 골드 +{compactNumber(defeatSalvage.gold)} · {stageMaterial.name} +{defeatSalvage.material}</span>}<span>이번 전리품으로 바로 강화하거나 같은 웨이브를 재도전하세요.</span></div><button className="primary-button" onClick={() => returnToGuild(developerMode ? "개발자 전투에서 복귀했습니다." : "길드원과 함께 영지로 복귀했습니다. 회수한 전리품으로 강화한 뒤 다시 출정하세요.")}>길드원과 귀환</button></div></div>}
        </section>
      )}

      {stagePicker && (
        <StageMap
          currentStage={stage.stage}
          unlockedStage={save.unlockedStage}
          clearedStages={save.cleared}
          developerMode={developerMode}
          onSelectStage={startStage}
          onClose={() => setStagePicker(false)}
          title="사냥터 지도 · 토벌 목표 선택"
        />
      )}
      <footer className="game-footer"><span>GUILDMASTER CHRONICLE · LOCAL BUILD</span><span>작은 길드가 전설이 되는 곳</span></footer>
    </main>
  );
}
