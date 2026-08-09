"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compactNumber, getStage, MEMBERS, RANK_COLORS, RANK_ORDER, type MemberDefinition } from "./game-data";
import { memberAnimationSource, type MemberMotion } from "./member-animations";

type Tab = "guild" | "field" | "tavern";
type MemberProgress = { level: number; xp: number; gear: number };
type UpgradeKey = "click" | "guild" | "gold" | "tavern" | "loot";
type SpecialKey = "double" | "command" | "auto";

type SaveState = {
  gold: number;
  bossTokens: number;
  selectedStage: number;
  unlockedStage: number;
  cleared: number[];
  owned: string[];
  party: string[];
  progress: Record<string, MemberProgress>;
  upgrades: Record<UpgradeKey, number>;
  nodes: string[];
  specials: Record<SpecialKey, boolean>;
  candidates: string[];
  autoAdvance: boolean;
};

const SAVE_KEY = "guildmaster-clicker-save-v1";
const NORMAL_BATTLE_SECONDS = 45;
const BOSS_BATTLE_SECONDS = 60;
const DEV_GEAR_LEVEL = 99;
const DEV_POWER_MULTIPLIER = 500;

const initialState: SaveState = {
  gold: 160,
  bossTokens: 0,
  selectedStage: 1,
  unlockedStage: 1,
  cleared: [],
  owned: ["roan"],
  party: ["roan"],
  progress: { roan: { level: 1, xp: 0, gear: 0 } },
  upgrades: { click: 0, guild: 0, gold: 0, tavern: 0, loot: 0 },
  nodes: ["foundation"],
  specials: { double: false, command: false, auto: false },
  candidates: ["mia", "finn", "lulu"],
  autoAdvance: true,
};

const upgradeInfo: Record<UpgradeKey, { title: string; description: string; base: number; accent: string }> = {
  click: { title: "검술 훈련", description: "직접 공격 피해 +35%", base: 90, accent: "검" },
  guild: { title: "길드 전술", description: "길드원 공격력 +25%", base: 140, accent: "기" },
  gold: { title: "행운의 금고", description: "토벌 골드 +18%", base: 180, accent: "금" },
  tavern: { title: "여관 증축", description: "상위 등급 후보 해금", base: 300, accent: "관" },
  loot: { title: "전리품 감정", description: "장비 획득 확률 +3%", base: 260, accent: "보" },
};

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
  { id: "foundation", title: "길드의 기반", description: "모든 성장의 출발점", glyph: "G", cost: 0, prerequisites: [], x: 8, y: 228 },
  { id: "sword-1", title: "기초 검술", description: "직접 공격 피해 +35%", glyph: "검", target: "click", cost: 90, prerequisites: ["foundation"], x: 25, y: 72 },
  { id: "guild-1", title: "전투 대형", description: "길드원 공격력 +25%", glyph: "진", target: "guild", cost: 120, prerequisites: ["foundation"], x: 25, y: 228 },
  { id: "gold-1", title: "보급 계약", description: "토벌 골드 +18%", glyph: "금", target: "gold", cost: 130, prerequisites: ["foundation"], x: 25, y: 384 },
  { id: "sword-2", title: "연속 베기", description: "직접 공격 피해 추가 상승", glyph: "⚔", target: "click", cost: 260, prerequisites: ["sword-1"], x: 43, y: 35 },
  { id: "focus", title: "약점 간파", description: "클릭 성장 단계 확장", glyph: "◎", target: "click", cost: 340, prerequisites: ["sword-1"], x: 43, y: 130 },
  { id: "guild-2", title: "합동 훈련", description: "길드원 공격력 추가 상승", glyph: "旗", target: "guild", cost: 390, prerequisites: ["guild-1"], x: 43, y: 228 },
  { id: "skill-lab", title: "기술 연구소", description: "전투 기술 연구 단계", glyph: "✦", target: "guild", cost: 520, prerequisites: ["guild-1"], x: 43, y: 316 },
  { id: "gold-2", title: "상단 교역로", description: "토벌 골드 추가 상승", glyph: "◇", target: "gold", cost: 430, prerequisites: ["gold-1"], x: 43, y: 403 },
  { id: "loot-1", title: "전리품 감정", description: "장비 획득 확률 +3%", glyph: "보", target: "loot", cost: 480, prerequisites: ["gold-1"], x: 43, y: 490 },
  { id: "sword-3", title: "길드마스터의 검", description: "직접 공격 최종 수련", glyph: "劍", target: "click", cost: 920, prerequisites: ["sword-2", "focus"], x: 63, y: 76 },
  { id: "command-room", title: "지휘 본부", description: "길드 전술 고급 단계", glyph: "령", target: "guild", cost: 1050, prerequisites: ["focus", "guild-2"], x: 63, y: 184 },
  { id: "guild-3", title: "정예 토벌대", description: "길드원 최종 수련", glyph: "★", target: "guild", cost: 1280, prerequisites: ["guild-2", "skill-lab"], x: 63, y: 292 },
  { id: "tavern-1", title: "황금 여관", description: "상위 등급 후보 해금", glyph: "관", target: "tavern", cost: 1150, prerequisites: ["gold-2"], x: 63, y: 400 },
  { id: "loot-2", title: "보물 사냥단", description: "장비 확률 추가 상승", glyph: "♣", target: "loot", cost: 1320, prerequisites: ["loot-1"], x: 63, y: 500 },
  { id: "citadel", title: "거대 길드 성채", description: "모든 성장 계통의 종착점", glyph: "♛", target: "guild", cost: 3200, prerequisites: ["sword-3", "command-room", "guild-3", "tavern-1", "loot-2"], x: 86, y: 272 },
];

const TERRAIN_POSITIONS = [
  [8, 22, .8], [18, 68, .7], [29, 18, .65], [40, 78, .82], [54, 14, .72], [66, 68, .68], [79, 22, .8], [90, 65, .72],
  [13, 44, .55], [34, 54, .5], [58, 46, .6], [73, 83, .58], [87, 40, .52], [24, 87, .55], [48, 91, .48], [96, 31, .5],
] as const;

const BIOME_DETAILS: Record<string, { label: string; description: string; objects: string[] }> = {
  forest: { label: "이끼 숲길", description: "수풀과 고목 사이로 햇살이 드는 초록 전장", objects: ["tree", "bush", "rock", "flower"] },
  desert: { label: "붉은 모래벌", description: "선인장과 바위가 흩어진 뜨거운 황야", objects: ["cactus", "dune", "rock", "bone"] },
  swamp: { label: "독안개 수렁", description: "버섯과 웅덩이에서 보랏빛 안개가 피어나는 늪", objects: ["mushroom", "pool", "reed", "stump"] },
  mine: { label: "수정 채굴장", description: "광차와 광맥이 남은 어두운 갱도", objects: ["ore", "rail", "rock", "torch"] },
  ice: { label: "서리 빙판", description: "눈 덮인 침엽수와 얼음 결정이 빛나는 협곡", objects: ["ice", "pine", "snow", "crystal"] },
  volcano: { label: "용암 분지", description: "갈라진 지면 사이로 불꽃과 용암이 솟는 산맥", objects: ["lava", "basalt", "ember", "rock"] },
  grave: { label: "망자의 묘역", description: "비석과 마른 나무 너머로 안개가 흐르는 묘지", objects: ["tomb", "bone", "dead-tree", "fog"] },
  storm: { label: "마력 폭풍핵", description: "룬과 마력 수정이 공중에 떠오르는 불안정 지대", objects: ["crystal", "rune", "storm-cloud", "rock"] },
  fort: { label: "마왕군 전초선", description: "부서진 성벽과 보급 상자가 남은 요새 앞마당", objects: ["wall", "banner", "crate", "spike"] },
  dragon: { label: "고룡의 제단", description: "용의 뼈와 고대 수정이 잠든 성역", objects: ["dragon-bone", "crystal", "ruin", "ember"] },
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

export default function Game() {
  const [save, setSave] = useState<SaveState>(initialState);
  const [tab, setTab] = useState<Tab>("guild");
  const [hydrated, setHydrated] = useState(false);
  const [battleActive, setBattleActive] = useState(false);
  const [monsterHp, setMonsterHp] = useState(getStage(1).hp);
  const [now, setNow] = useState(0);
  const [stagePicker, setStagePicker] = useState(false);
  const [toast, setToast] = useState("첫 몬스터를 눌러 길드의 모험을 시작하세요!");
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [battleDeadline, setBattleDeadline] = useState<number | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);
  const [developerToolsAvailable, setDeveloperToolsAvailable] = useState(false);
  const [developerStage, setDeveloperStage] = useState<number | null>(null);
  const [clicks, setClicks] = useState(0);
  const [hitFx, setHitFx] = useState(0);
  const [memberFx, setMemberFx] = useState<Record<string, number>>({});
  const [memberSkillFx, setMemberSkillFx] = useState<Record<string, number>>({});
  const [skillFx, setSkillFx] = useState<string | null>(null);
  const lastAttack = useRef<Record<string, number>>({});
  const lastSkill = useRef<Record<string, number>>({});
  const victoryLock = useRef(false);

  const stageNumber = developerMode && developerStage ? developerStage : save.selectedStage;
  const stage = useMemo(() => getStage(stageNumber), [stageNumber]);
  const partyMembers = useMemo(() => save.party.map(memberById), [save.party]);
  const progressFor = useCallback((member: MemberDefinition) => developerMode ? { level: member.maxLevel, xp: 0, gear: DEV_GEAR_LEVEL } : save.progress[member.id], [developerMode, save.progress]);
  const developerPower = developerMode ? DEV_POWER_MULTIPLIER : 1;
  const clickDamage = Math.round(12 * Math.pow(1.35, save.upgrades.click) * developerPower);
  const guildMultiplier = Math.pow(1.25, save.upgrades.guild);
  const goldMultiplier = Math.pow(1.18, save.upgrades.gold);
  const battleSeconds = stage.boss ? BOSS_BATTLE_SECONDS : NORMAL_BATTLE_SECONDS;
  const battleTimeLeft = battleDeadline ? Math.max(0, Math.ceil((battleDeadline - now) / 1000)) : battleSeconds;
  const combatLocked = battleActive || victory || defeat;

  const combatPower = useMemo(() => {
    const partyPower = partyMembers.reduce((sum, member) => sum + attackFor(member, progressFor(member)) * developerPower, 0) * guildMultiplier;
    return Math.round(clickDamage * 2.2 + partyPower);
  }, [partyMembers, progressFor, developerPower, clickDamage, guildMultiplier]);

  /* eslint-disable react-hooks/set-state-in-effect -- Saved progress is intentionally restored after the client mounts. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw) as SaveState;
        setSave({ ...initialState, ...loaded, nodes: loaded.nodes ?? initialState.nodes, upgrades: { ...initialState.upgrades, ...loaded.upgrades }, specials: { ...initialState.specials, ...loaded.specials } });
        setMonsterHp(getStage(loaded.selectedStage || 1).hp);
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

  const awardVictory = useCallback(() => {
    if (victoryLock.current) return;
    victoryLock.current = true;
    setBattleActive(false);
    setBattleDeadline(null);
    setDefeat(false);
    setVictory(true);
    if (developerMode) {
      setToast("개발자 토벌 성공! 보상과 진행도는 저장되지 않습니다.");
      return;
    }
    const firstClear = !save.cleared.includes(stage.stage);
    const earnedGold = Math.round(stage.gold * goldMultiplier);
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
        bossTokens: current.bossTokens + (stage.boss && firstClear ? 1 : 0),
        cleared: firstClear ? [...current.cleared, stage.stage] : current.cleared,
        unlockedStage: firstClear ? Math.min(100, Math.max(current.unlockedStage, stage.stage + 1)) : current.unlockedStage,
        progress,
      };
    });

    setToast(`토벌 성공! 골드 ${compactNumber(earnedGold)}${gearTarget ? ` · ${memberById(gearTarget).name} 장비 획득` : ""}${stage.boss && firstClear ? " · 보스 증표 +1" : ""}`);
  }, [developerMode, save.cleared, save.party, save.upgrades.loot, stage, goldMultiplier]);

  const failBattle = useCallback(() => {
    if (victoryLock.current) return;
    victoryLock.current = true;
    setBattleActive(false);
    setBattleDeadline(null);
    setVictory(false);
    setDefeat(true);
    setToast("제한 시간이 끝나 파티원 전원이 사망했습니다. 영지에서 다시 파티를 정비하세요.");
  }, []);

  useEffect(() => {
    if (!battleActive || !battleDeadline || monsterHp <= 0) return;
    if (now >= battleDeadline) failBattle();
  }, [now, battleActive, battleDeadline, monsterHp, failBattle]);

  const damageMonster = useCallback((damage: number) => {
    setMonsterHp((hp) => {
      const next = Math.max(0, hp - Math.max(1, Math.round(damage)));
      if (next === 0) window.setTimeout(awardVictory, 0);
      return next;
    });
  }, [awardVictory]);

  useEffect(() => {
    if (!battleActive || tab !== "field" || monsterHp <= 0) return;
    partyMembers.forEach((member) => {
      const attackMs = member.interval * 1000;
      const skillMs = member.skillCooldown * 1000;
      if (!lastAttack.current[member.id]) lastAttack.current[member.id] = now;
      if (!lastSkill.current[member.id]) lastSkill.current[member.id] = now;
      if (now - lastAttack.current[member.id] >= attackMs) {
        lastAttack.current[member.id] = now;
        damageMonster(attackFor(member, progressFor(member)) * guildMultiplier * developerPower);
        setMemberFx((current) => ({ ...current, [member.id]: now }));
      }
      if (now - lastSkill.current[member.id] >= skillMs) {
        lastSkill.current[member.id] = now;
        damageMonster(attackFor(member, progressFor(member)) * guildMultiplier * member.skillMultiplier * developerPower);
        setMemberSkillFx((current) => ({ ...current, [member.id]: now }));
        setSkillFx(member.id);
        window.setTimeout(() => setSkillFx((current) => current === member.id ? null : current), 1100);
      }
    });
  }, [now, battleActive, tab, monsterHp, partyMembers, progressFor, developerPower, guildMultiplier, damageMonster]);

  const directAttack = useCallback((automatic = false) => {
    if (!battleActive || monsterHp <= 0) return;
    const strikes = save.specials.double ? 2 : 1;
    damageMonster(clickDamage * strikes);
    setHitFx((value) => value + 1);
    if (!automatic) {
      const nextClicks = clicks + 1;
      setClicks(nextClicks);
      if (save.specials.command && nextClicks % 10 === 0) {
        partyMembers.forEach((member) => damageMonster(attackFor(member, progressFor(member)) * guildMultiplier * developerPower));
        setToast("지휘관의 명령! 모든 길드원이 즉시 공격합니다.");
      }
    }
  }, [battleActive, monsterHp, save.specials, clickDamage, clicks, partyMembers, progressFor, developerPower, guildMultiplier, damageMonster]);

  useEffect(() => {
    if (!save.specials.auto || !battleActive || tab !== "field") return;
    const timer = window.setInterval(() => directAttack(true), 2000);
    return () => window.clearInterval(timer);
  }, [save.specials.auto, battleActive, tab, directAttack]);

  function selectStage(stageNumber: number) {
    const nextStage = getStage(stageNumber);
    if (developerMode) setDeveloperStage(stageNumber);
    else setSave((current) => ({ ...current, selectedStage: stageNumber }));
    setStagePicker(false);
    setTab("guild");
    setToast(`${nextStage.region.name} ${nextStage.localStage}구역을 다음 토벌 목표로 지정했습니다.`);
  }

  function startStage(stageNumber = stage.stage) {
    const nextStage = getStage(stageNumber);
    victoryLock.current = false;
    lastAttack.current = {};
    lastSkill.current = {};
    setMemberFx({});
    setMemberSkillFx({});
    setVictory(false);
    setDefeat(false);
    setBattleActive(true);
    setBattleDeadline(Date.now() + (nextStage.boss ? BOSS_BATTLE_SECONDS : NORMAL_BATTLE_SECONDS) * 1000);
    setMonsterHp(nextStage.hp);
    if (developerMode) setDeveloperStage(stageNumber);
    else setSave((current) => ({ ...current, selectedStage: stageNumber }));
    setStagePicker(false);
    setTab("field");
    setToast(`${nextStage.region.name} ${nextStage.localStage}구역 토벌을 시작합니다. 제한 시간 안에 적을 쓰러뜨리세요!`);
  }

  function returnToGuild(message = "파티를 영지로 복귀시켰습니다.") {
    victoryLock.current = true;
    setBattleActive(false);
    setBattleDeadline(null);
    setVictory(false);
    setDefeat(false);
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
    setToast(next ? "개발자 모드 ON · 모든 스테이지와 신화 장비가 임시 해금됩니다. 결과는 저장되지 않습니다." : "개발자 모드 OFF · 원래 저장 진행도로 돌아왔습니다.");
  }

  function purchaseNode(node: UpgradeNode) {
    if (save.nodes.includes(node.id)) return;
    if (!node.prerequisites.every((id) => save.nodes.includes(id))) return setToast("앞선 성장 노드를 먼저 해금해야 합니다.");
    if (save.gold < node.cost) return setToast("노드를 해금할 골드가 부족합니다. 필드에서 토벌을 반복하세요.");
    setSave((current) => ({
      ...current,
      gold: current.gold - node.cost,
      nodes: [...current.nodes, node.id],
      upgrades: node.target ? { ...current.upgrades, [node.target]: current.upgrades[node.target] + 1 } : current.upgrades,
    }));
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
    victoryLock.current = true;
    setBattleActive(false);
    setBattleDeadline(null);
    setVictory(false);
    setDefeat(false);
    setDeveloperMode(false);
    setDeveloperStage(null);
    setMonsterHp(getStage(1).hp);
    setTab("guild");
    setToast("새로운 길드가 창설되었습니다. 파티를 편성하고 첫 토벌을 준비하세요.");
  }

  const hpPercent = Math.max(0, Math.min(100, (monsterHp / stage.hp) * 100));

  return (
    <main className={`game-shell ${combatLocked ? "battle-mode" : ""} ${developerMode ? "developer-mode" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">G</span>
          <div><span className="eyebrow">GUILDMASTER CHRONICLE</span><h1>모험가 길드</h1></div>
        </div>
        <div className="resources" aria-label="보유 자원">
          <span><i className="resource-dot gold-dot" />골드 <strong>{compactNumber(save.gold)}</strong></span>
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
        <button className={tab === "tavern" ? "active" : ""} onClick={() => setTab("tavern")}><span>🍺</span> 여관</button>
      </nav>

      <div className="toast" role="status"><span aria-hidden="true">✦</span>{toast}</div>
      {developerMode && <div className="developer-banner" role="status"><strong>개발자 모드</strong><span>스테이지 1–100 임시 해금 · 파티 최대 레벨 · 신화 장비 +{DEV_GEAR_LEVEL} · 전투 결과 저장 안 됨</span></div>}

      {tab === "guild" && (
        <section className="screen guild-screen" aria-label="길드 관리">
          <div className="section-heading">
            <div><span className="eyebrow">GUILD TERRITORY</span><h2>길드 관리</h2><p>파티를 편성하고 목표를 지정한 뒤 토벌대를 출정시키세요. 전투가 끝날 때까지 영지로 돌아올 수 없습니다.</p></div>
            <div className="heading-actions expedition-actions"><button className="secondary-button" onClick={() => setStagePicker(true)}>목표 · {stage.region.name} {stage.localStage}구역</button><button className="primary-button" onClick={() => startStage()}>토벌 출정 ⚔</button></div>
          </div>

          <div className="guild-layout">
            <div className={`territory territory-level-${Math.min(5, Math.floor((save.upgrades.click + save.upgrades.guild + save.upgrades.gold) / 3))}`}>
              <div className="sun" /><div className="cloud cloud-one" /><div className="cloud cloud-two" />
              <div className="building guild-hall"><span>길드 회관</span><i /></div>
              <div className="building tavern-building"><span>여관</span><i /></div>
              <div className="building training-building"><span>훈련장</span><i /></div>
              <div className="flag">G</div>
              <div className="territory-caption"><strong>새싹 길드 영지</strong><span>업그레이드할수록 영지가 발전합니다.</span></div>
            </div>

            <div className="upgrade-panel panel">
              <div className="panel-title"><div><span className="eyebrow">GROWTH OVERVIEW</span><h3>영지 성장 현황</h3></div><span className="level-chip">노드 {save.nodes.length}/{UPGRADE_NODES.length}</span></div>
              <div className="growth-progress"><i style={{ width: `${save.nodes.length / UPGRADE_NODES.length * 100}%` }} /></div>
              <div className="growth-stats">
                {(Object.keys(upgradeInfo) as UpgradeKey[]).map((key) => <div key={key}><span className="upgrade-icon">{upgradeInfo[key].accent}</span><span><strong>{upgradeInfo[key].title}</strong><small>성장 단계 {save.upgrades[key]}</small></span></div>)}
              </div>
              <div className="next-research"><span className="eyebrow">NEXT RESEARCH</span>{UPGRADE_NODES.filter((node) => !save.nodes.includes(node.id) && node.prerequisites.every((id) => save.nodes.includes(id))).slice(0, 2).map((node) => <span key={node.id}><b>{node.title}</b><small>{compactNumber(node.cost)} 골드</small></span>)}</div>
            </div>
          </div>

          <div className="upgrade-tree-panel panel">
            <div className="panel-title"><div><span className="eyebrow">GUILD DEVELOPMENT MAP</span><h3>길드 발전 노드</h3><p className="panel-description">연결된 노드를 골드로 해금하면 새로운 연구 경로가 단계적으로 확장됩니다.</p></div><span className="level-chip">보유 골드 {compactNumber(save.gold)}</span></div>
            <div className="tech-tree-scroll">
              <div className="tech-tree" aria-label="길드 발전 노드 지도">
                {UPGRADE_NODES.flatMap((node) => node.prerequisites.map((parentId) => {
                  const parent = UPGRADE_NODES.find((item) => item.id === parentId)!;
                  const nodeVisible = save.nodes.includes(node.id) || node.prerequisites.some((id) => save.nodes.includes(id));
                  const parentVisible = save.nodes.includes(parent.id) || parent.prerequisites.some((id) => save.nodes.includes(id)) || parent.id === "foundation";
                  const dx = (node.x - parent.x) * 10.5;
                  const dy = node.y - parent.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                  return <i key={`${parentId}-${node.id}`} className={`node-connector ${save.nodes.includes(parentId) ? "reachable" : ""} ${save.nodes.includes(node.id) ? "completed" : ""} ${nodeVisible && parentVisible ? "visible" : ""}`} style={{ left: `${parent.x}%`, top: `${parent.y}px`, width: `${length}px`, transform: `rotate(${angle}deg)` }} />;
                }))}
                {UPGRADE_NODES.map((node) => {
                  const purchased = save.nodes.includes(node.id);
                  const available = node.prerequisites.every((id) => save.nodes.includes(id));
                  const visible = node.id === "foundation" || purchased || available || node.prerequisites.some((id) => save.nodes.includes(id));
                  return <button key={node.id} className={`tech-node ${purchased ? "purchased" : ""} ${available && !purchased ? "available" : ""} ${visible ? "visible" : "concealed"}`} style={{ left: `${node.x}%`, top: `${node.y}px` }} onClick={() => purchaseNode(node)} disabled={purchased || !available} aria-label={visible ? `${node.title}: ${node.description}` : "아직 발견되지 않은 연구 노드"}>
                    <span className="node-glyph">{visible ? node.glyph : "?"}</span><strong>{visible ? node.title : "미발견 연구"}</strong><small>{purchased ? "해금 완료" : available ? `${compactNumber(node.cost)} G` : visible ? "선행 노드 필요" : "경로를 확장하세요"}</small>
                  </button>;
                })}
              </div>
            </div>
          </div>

          <div className="roster-section panel">
            <div className="panel-title"><div><span className="eyebrow">MEMBER ROSTER</span><h3>길드원 편성</h3></div><span className="level-chip">출전 {save.party.length}/4</span></div>
            <p className="panel-description">카드를 눌러 토벌 파티에 넣거나 뺄 수 있습니다. 출전한 길드원만 경험치를 얻습니다.</p>
            <div className="roster-grid">
              {save.owned.map((id) => {
                const member = memberById(id); const progress = progressFor(member); const selected = save.party.includes(id); const xpNeed = progress.level * 55;
                return <button key={id} className={`member-card ${selected ? "selected" : ""}`} onClick={() => toggleParty(id)}>
                  <span className="rank-badge" style={{ background: RANK_COLORS[member.rank] }}>{member.rank}</span>
                  <span className="portrait" style={{ "--member-hue": member.hue } as React.CSSProperties}><i>{member.glyph}</i></span>
                  <span className="member-copy"><strong>{member.name}</strong><small>{member.job} · Lv.{progress.level}/{member.maxLevel}</small><span className="xp-bar"><i style={{ width: `${Math.min(100, progress.xp / xpNeed * 100)}%` }} /></span><em>공격 {compactNumber(attackFor(member, progress))} · 장비 +{progress.gear}</em></span>
                  <span className="party-check">{selected ? "출전 중" : "편성"}</span>
                </button>;
              })}
              <button className="member-card recruit-card" onClick={() => setTab("tavern")}><span className="recruit-plus">＋</span><strong>새 길드원 고용</strong><small>여관에서 동료를 만나보세요</small></button>
            </div>
          </div>

          <div className="special-section panel">
            <div className="panel-title"><div><span className="eyebrow">BOSS TACTICS</span><h3>특수 전술</h3></div><span className="level-chip token-level">증표 {save.bossTokens}</span></div>
            <div className="special-grid">{(Object.keys(specialInfo) as SpecialKey[]).map((key) => <button key={key} className={`special-card ${save.specials[key] ? "unlocked" : ""}`} onClick={() => unlockSpecial(key)}>
              <span>{save.specials[key] ? "✓" : "◆"}</span><strong>{specialInfo[key].title}</strong><small>{specialInfo[key].description}</small><b>{save.specials[key] ? "해금 완료" : "보스 증표 1"}</b>
            </button>)}</div>
          </div>
        </section>
      )}

      {tab === "field" && (
        <section className={`screen field-screen biome-${stage.region.hue}`} aria-label="필드 전투">
          <div className="field-toolbar">
            <div><span className="eyebrow">CURRENT EXPEDITION</span><h2>{stage.region.name} <b>{stage.localStage}/10</b></h2></div>
            <div className="field-actions battle-controls"><div className={`battle-timer ${battleTimeLeft <= 10 ? "urgent" : ""}`}><span>남은 시간</span><strong>{battleTimeLeft}초</strong><i><b style={{ width: `${battleTimeLeft / battleSeconds * 100}%` }} /></i></div><button className="retreat-button" onClick={retreatBattle}>후퇴 · 골드 10% 손실</button></div>
          </div>

          <div className="battle-layout">
            <div className="arena panel">
              <div className={`board-ground board-${stage.region.hue}`} aria-hidden="true" />
              <div className="terrain-layer" aria-hidden="true">
                {TERRAIN_POSITIONS.slice(0, Math.min(TERRAIN_POSITIONS.length, 10 + Math.floor(stage.localStage / 2) + (stage.boss ? 3 : 0))).map(([x, y, scale], index) => {
                  const details = BIOME_DETAILS[stage.region.hue];
                  const type = details.objects[index % details.objects.length];
                  return <i key={`${stage.stage}-${index}`} className={`terrain-object terrain-${type}`} style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) scale(${scale})` }}><span /></i>;
                })}
              </div>
              <div className="environment-tag"><span>{BIOME_DETAILS[stage.region.hue].label}</span><small>{BIOME_DETAILS[stage.region.hue].description}</small></div>
              <div className="battle-banner"><span>{stage.boss ? "BOSS BATTLE" : `STAGE ${stage.stage}`}</span><strong>{stage.name}</strong></div>

              <div className="fighters" aria-label="출전 길드원">
                {partyMembers.map((member, index) => {
                  const progress = save.progress[member.id];
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

              <button className={`monster-target ${stage.boss ? "boss" : ""}`} onClick={() => directAttack(false)} disabled={!battleActive} aria-label={`${stage.name} 직접 공격`}>
                <div className="monster-shadow" />
                <div className="monster-sprite"><i className="monster-horn left" /><i className="monster-horn right" /><i className="monster-body"><span className="monster-eye left" /><span className="monster-eye right" /><span className="monster-core" /></i><i className="monster-arm left" /><i className="monster-arm right" /><i className="monster-foot left" /><i className="monster-foot right" /></div>
                <span className="click-callout">눌러서 직접 공격!</span>
                {hitFx > 0 && <span key={hitFx} className="hit-effect">-{compactNumber(clickDamage * (save.specials.double ? 2 : 1))}</span>}
              </button>

              {skillFx && <div className="skill-flash" key={`${skillFx}-${now}`}><span>{memberById(skillFx).skill}!</span></div>}
            </div>

            <aside className="battle-sidebar">
              <div className="monster-status panel">
                <div className="monster-title"><span className={`enemy-rank ${stage.boss ? "boss-rank" : ""}`}>{stage.boss ? "BOSS" : "ELITE"}</span><div><h3>{stage.name}</h3><p>{stage.region.name} · {stage.localStage}구역</p></div></div>
                <div className="hp-label"><span>HP</span><strong>{compactNumber(monsterHp)} / {compactNumber(stage.hp)}</strong></div>
                <div className="hp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={stage.hp} aria-valuenow={monsterHp}><i style={{ width: `${hpPercent}%` }} /></div>
                <div className="reward-preview"><span>예상 보상</span><strong>골드 {compactNumber(stage.gold * goldMultiplier)}</strong><strong>경험치 {compactNumber(stage.xp)}</strong>{stage.boss && <strong>증표 1</strong>}</div>
              </div>
              <div className="party-status panel"><div className="panel-title"><h3>출전 전투원</h3><span className="level-chip">{partyMembers.length}/4</span></div>{partyMembers.map((member) => <div className="party-row" key={member.id}><span className="mini-portrait" style={{ "--member-hue": member.hue } as React.CSSProperties}>{member.glyph}</span><span><strong>{member.name}</strong><small>{member.job} · 공격 {compactNumber(attackFor(member, progressFor(member)) * guildMultiplier * developerPower)}</small></span><b>{developerMode ? `신화 +${DEV_GEAR_LEVEL}` : member.skill}</b></div>)}</div>
              <div className="click-power panel"><span>길드마스터 직접 공격</span><strong>{compactNumber(clickDamage)} 피해</strong><small>{save.specials.double ? "쌍격 적용 · 2회 타격" : "몬스터 또는 아래 버튼을 누르세요"}</small><button className="attack-button" onClick={() => directAttack(false)} disabled={!battleActive}>직접 공격 ⚔</button></div>
            </aside>
          </div>

          {victory && <div className="victory-overlay"><div className="victory-card"><span className="victory-star">★</span><p>STAGE CLEAR</p><h2>토벌 성공!</h2><div className="outcome-rewards"><span>{developerMode ? "개발자 결과 · 저장 안 됨" : <>골드 <b>+{compactNumber(stage.gold * goldMultiplier)}</b></>}</span>{!developerMode && <span>경험치 <b>+{compactNumber(stage.xp)}</b></span>}{stage.boss && <span>보스 토벌 완료</span>}</div><div className="outcome-actions">{stage.stage < (developerMode ? 100 : save.unlockedStage) && <button className="primary-button" onClick={() => startStage(Math.min(100, stage.stage + 1))}>다음 구역 출정</button>}<button className="secondary-button" onClick={() => startStage(stage.stage)}>반복 토벌</button><button className="text-button" onClick={() => returnToGuild("토벌을 마치고 영지로 복귀했습니다.")}>영지로 복귀</button></div></div></div>}
          {defeat && <div className="victory-overlay defeat-overlay"><div className="victory-card defeat-card"><span className="victory-star">☠</span><p>EXPEDITION FAILED</p><h2>파티 전멸</h2><div className="defeat-copy"><strong>제한 시간 안에 적을 처치하지 못했습니다.</strong><span>파티원 전원이 사망했으며 영지 귀환 후 부활합니다. 이번 토벌의 보상은 없습니다.</span></div><button className="primary-button" onClick={() => returnToGuild("구조대가 전멸한 파티를 회수했습니다. 파티원을 다시 정비하세요.")}>영지로 귀환</button></div></div>}
        </section>
      )}

      {tab === "tavern" && (
        <section className="screen tavern-screen" aria-label="여관">
          <div className="section-heading"><div><span className="eyebrow">THE WANDERING MUG</span><h2>방랑자의 잔 여관</h2><p>새로운 길드원을 만나 토벌대를 완성하세요. 중복 길드원은 등장하지 않습니다.</p></div><div className="heading-actions"><button className="secondary-button" onClick={refreshCandidates}>후보 갱신 · {Math.max(20, 60 - save.upgrades.tavern * 5)} G</button><button className="primary-button" onClick={randomHire}>운명의 계약 · 260 G</button></div></div>
          <div className="tavern-room"><div className="tavern-light one" /><div className="tavern-light two" /><div className="shelf"><i /><i /><i /><i /><i /></div><div className="counter" /><span className="innkeeper">오늘도 좋은 인연이 기다리고 있어요!</span></div>
          <div className="candidate-grid">
            {save.candidates.length ? save.candidates.map((id) => { const member = memberById(id); return <article className="candidate-card panel" key={id}>
              <div className="candidate-portrait" style={{ "--member-hue": member.hue } as React.CSSProperties}><span>{member.glyph}</span><i /></div>
              <span className="large-rank" style={{ background: RANK_COLORS[member.rank] }}>{member.rank} RANK</span><h3>{member.name}</h3><p>{member.description}</p><dl><div><dt>직업</dt><dd>{member.job}</dd></div><div><dt>공격력</dt><dd>{member.attack}</dd></div><div><dt>공격 주기</dt><dd>{member.interval}초</dd></div><div><dt>고유 스킬</dt><dd>{member.skill}</dd></div></dl><button className="hire-button" onClick={() => hire(id)} disabled={save.gold < member.cost}>{compactNumber(member.cost)} 골드로 고용</button>
            </article>; }) : <div className="empty-tavern panel"><span>🏆</span><h3>현재 해금된 모든 길드원을 고용했습니다!</h3><p>여관 증축 업그레이드로 더 높은 등급을 해금하세요.</p></div>}
          </div>
          <div className="collection-strip panel"><div><span className="eyebrow">COLLECTION</span><h3>길드원 도감</h3></div><div className="rank-progress">{RANK_ORDER.map((rank) => { const total = MEMBERS.filter((m) => m.rank === rank).length; const owned = MEMBERS.filter((m) => m.rank === rank && save.owned.includes(m.id)).length; return <span key={rank}><b style={{ background: RANK_COLORS[rank] }}>{rank}</b><i><em style={{ width: `${owned / total * 100}%` }} /></i><small>{owned}/{total}</small></span>; })}</div></div>
        </section>
      )}

      {stagePicker && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setStagePicker(false); }}><div className="stage-modal" role="dialog" aria-modal="true" aria-labelledby="stage-title"><div className="modal-heading"><div><span className="eyebrow">WORLD MAP</span><h2 id="stage-title">토벌 목표 선택</h2></div><button className="close-button" onClick={() => setStagePicker(false)} aria-label="닫기">×</button></div><div className="region-list">{Array.from({ length: 10 }, (_, regionIndex) => <section key={regionIndex}><div className="region-heading"><strong>{regionIndex + 1}단계 · {getStage(regionIndex * 10 + 1).region.name}</strong><span>{developerMode ? 10 : Math.max(0, Math.min(10, save.unlockedStage - regionIndex * 10))}/10 해금</span></div><div className="stage-grid">{Array.from({ length: 10 }, (_, localIndex) => { const number = regionIndex * 10 + localIndex + 1; const locked = !developerMode && number > save.unlockedStage; const cleared = save.cleared.includes(number); return <button key={number} disabled={locked} className={`${number === stage.stage ? "current" : ""} ${cleared ? "cleared" : ""} ${developerMode ? "developer-unlocked" : ""} ${localIndex === 9 ? "boss-stage" : ""}`} onClick={() => selectStage(number)}><span>{localIndex === 9 ? "♛" : number}</span><small>{locked ? "잠김" : developerMode ? "DEV" : cleared ? "반복 가능" : "첫 도전"}</small></button>; })}</div></section>)}</div></div></div>}
      <footer className="game-footer"><span>GUILDMASTER CHRONICLE · LOCAL BUILD</span><span>작은 길드가 전설이 되는 곳</span></footer>
    </main>
  );
}
