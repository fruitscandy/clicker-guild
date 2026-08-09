import { beginnerForestMonsterName } from "./monster-assets";

export type Rank = "F" | "E" | "D" | "C" | "B" | "A" | "S";

export type MemberDefinition = {
  id: string;
  name: string;
  rank: Rank;
  job: string;
  attack: number;
  growth: number;
  interval: number;
  skill: string;
  skillMultiplier: number;
  skillCooldown: number;
  maxLevel: number;
  cost: number;
  glyph: string;
  hue: string;
  description: string;
};

export const RANK_ORDER: Rank[] = ["F", "E", "D", "C", "B", "A", "S"];

export const RANK_COLORS: Record<Rank, string> = {
  F: "#7c8b84",
  E: "#3f8a5f",
  D: "#3f78b8",
  C: "#7459b8",
  B: "#c77a2d",
  A: "#db4f55",
  S: "#d8a92d",
};

export const MEMBERS: MemberDefinition[] = [
  { id: "roan", name: "견습 전사 로안", rank: "F", job: "전사", attack: 9, growth: 3, interval: 1.5, skill: "강타", skillMultiplier: 3.2, skillCooldown: 8, maxLevel: 18, cost: 80, glyph: "검", hue: "#e66b5d", description: "검과 용기로 버티는 균형형 전사" },
  { id: "mia", name: "떠돌이 궁수 미아", rank: "F", job: "궁수", attack: 7, growth: 2.5, interval: 1.05, skill: "연속 사격", skillMultiplier: 2.6, skillCooldown: 6.5, maxLevel: 17, cost: 110, glyph: "활", hue: "#f0b84a", description: "빠른 화살로 빈틈을 노리는 궁수" },
  { id: "finn", name: "골목 도적 핀", rank: "F", job: "도적", attack: 5, growth: 2.2, interval: 0.68, skill: "급소 찌르기", skillMultiplier: 4.1, skillCooldown: 7.2, maxLevel: 15, cost: 135, glyph: "단", hue: "#4aaa78", description: "눈 깜짝할 사이에 파고드는 도적" },
  { id: "lulu", name: "수습 마법사 루루", rank: "F", job: "마법사", attack: 13, growth: 3.8, interval: 2.15, skill: "마력탄", skillMultiplier: 3.8, skillCooldown: 8.5, maxLevel: 20, cost: 165, glyph: "별", hue: "#a66ed0", description: "느리지만 묵직한 마력탄을 쏘는 마법사" },
  { id: "ellie", name: "신입 사제 엘리", rank: "F", job: "사제", attack: 6, growth: 2.1, interval: 1.55, skill: "축복의 빛", skillMultiplier: 2.4, skillCooldown: 6, maxLevel: 19, cost: 190, glyph: "빛", hue: "#75b8d8", description: "동료의 사기를 북돋는 빛의 사제" },
  { id: "garon", name: "방패병 가론", rank: "E", job: "기사", attack: 18, growth: 4.5, interval: 1.8, skill: "방패 강타", skillMultiplier: 4, skillCooldown: 9, maxLevel: 28, cost: 320, glyph: "방", hue: "#64819b", description: "흔들림 없이 전열을 지키는 기사" },
  { id: "reina", name: "사냥꾼 레이나", rank: "E", job: "궁수", attack: 15, growth: 4, interval: 1.15, skill: "정조준", skillMultiplier: 5.2, skillCooldown: 9.5, maxLevel: 26, cost: 390, glyph: "표", hue: "#d79f3c", description: "한 발에 승부를 거는 명사수" },
  { id: "bruno", name: "싸움꾼 브루노", rank: "E", job: "무투가", attack: 11, growth: 3.5, interval: 0.72, skill: "삼연격", skillMultiplier: 4.5, skillCooldown: 7, maxLevel: 25, cost: 450, glyph: "권", hue: "#d76545", description: "주먹으로 리듬을 만드는 거리의 투사" },
  { id: "sera", name: "불꽃술사 세라", rank: "E", job: "화염술사", attack: 22, growth: 5.2, interval: 2.2, skill: "화염 폭발", skillMultiplier: 5, skillCooldown: 10, maxLevel: 30, cost: 540, glyph: "화", hue: "#e35c3f", description: "타오르는 주문으로 전장을 밝힌다" },
  { id: "popo", name: "연금술사 포포", rank: "E", job: "연금술사", attack: 13, growth: 3.8, interval: 1.45, skill: "부식 물약", skillMultiplier: 4.2, skillCooldown: 8, maxLevel: 27, cost: 620, glyph: "약", hue: "#58a270", description: "약점을 녹여내는 기묘한 연구가" },
  { id: "kyle", name: "창기사 카일", rank: "D", job: "창술사", attack: 35, growth: 7.2, interval: 1.65, skill: "관통 돌진", skillMultiplier: 5.8, skillCooldown: 9, maxLevel: 38, cost: 1100, glyph: "창", hue: "#547fb7", description: "긴 창으로 적의 중심을 꿰뚫는다" },
  { id: "nera", name: "암살자 네라", rank: "D", job: "암살자", attack: 28, growth: 6.4, interval: 0.92, skill: "그림자 일격", skillMultiplier: 7.2, skillCooldown: 11, maxLevel: 35, cost: 1350, glyph: "영", hue: "#6b5a8f", description: "그림자 속에서 치명상을 남긴다" },
  { id: "iris", name: "냉기술사 이리스", rank: "D", job: "냉기술사", attack: 40, growth: 8, interval: 2.05, skill: "얼음 파편", skillMultiplier: 5.5, skillCooldown: 8, maxLevel: 40, cost: 1600, glyph: "빙", hue: "#5ea8c8", description: "얼음 결정으로 움직임을 봉쇄한다" },
  { id: "rio", name: "음유시인 리오", rank: "D", job: "음유시인", attack: 24, growth: 5.5, interval: 1.3, skill: "전투의 노래", skillMultiplier: 6.2, skillCooldown: 10, maxLevel: 36, cost: 1850, glyph: "음", hue: "#b36fa0", description: "전장의 박자를 지배하는 악사" },
  { id: "jade", name: "총잡이 제이드", rank: "D", job: "총잡이", attack: 30, growth: 6.2, interval: 0.78, skill: "속사", skillMultiplier: 6, skillCooldown: 8.5, maxLevel: 34, cost: 2100, glyph: "총", hue: "#70836e", description: "정확하고 빠른 연사로 압박한다" },
  { id: "ur", name: "광전사 우르", rank: "C", job: "광전사", attack: 75, growth: 12, interval: 2.35, skill: "분노의 도끼", skillMultiplier: 8, skillCooldown: 12, maxLevel: 48, cost: 4200, glyph: "도", hue: "#b95643", description: "느리지만 산도 가르는 일격의 광전사" },
  { id: "adel", name: "성기사 아델", rank: "C", job: "성기사", attack: 54, growth: 10, interval: 1.55, skill: "신성한 심판", skillMultiplier: 7, skillCooldown: 9.5, maxLevel: 50, cost: 5000, glyph: "성", hue: "#d7a84b", description: "빛의 맹세로 동료를 이끄는 기사" },
  { id: "theo", name: "번개술사 테오", rank: "C", job: "번개술사", attack: 49, growth: 9.5, interval: 1.15, skill: "연쇄 번개", skillMultiplier: 7.4, skillCooldown: 8, maxLevel: 46, cost: 5800, glyph: "뢰", hue: "#6d74c9", description: "번개를 이어 추가 타격을 만든다" },
  { id: "nabi", name: "정령사 나비", rank: "C", job: "정령사", attack: 45, growth: 9, interval: 1.05, skill: "바람 정령", skillMultiplier: 6.8, skillCooldown: 7, maxLevel: 47, cost: 6500, glyph: "풍", hue: "#56a98f", description: "바람의 정령과 함께 다단 공격한다" },
  { id: "ren", name: "사무라이 렌", rank: "B", job: "사무라이", attack: 115, growth: 17, interval: 1.7, skill: "발도술", skillMultiplier: 10, skillCooldown: 13, maxLevel: 60, cost: 12000, glyph: "참", hue: "#c34e52", description: "찰나의 발도로 승부를 끝낸다" },
  { id: "gray", name: "포병 그레이", rank: "B", job: "포병", attack: 145, growth: 20, interval: 2.8, skill: "마력 포격", skillMultiplier: 12, skillCooldown: 15, maxLevel: 58, cost: 14500, glyph: "포", hue: "#697988", description: "긴 준비 끝에 전장을 뒤흔드는 포병" },
  { id: "mor", name: "사령술사 모르", rank: "B", job: "사령술사", attack: 92, growth: 15, interval: 1.4, skill: "망자의 손", skillMultiplier: 9, skillCooldown: 10, maxLevel: 62, cost: 17000, glyph: "혼", hue: "#6b6aa1", description: "쓰러진 적의 기운을 다음 전투로 잇는다" },
  { id: "aila", name: "마검사 에일라", rank: "A", job: "마검사", attack: 230, growth: 29, interval: 1.15, skill: "마력 참격", skillMultiplier: 12, skillCooldown: 9, maxLevel: 78, cost: 36000, glyph: "마", hue: "#a34c91", description: "검술과 마법을 끊김 없이 엮는다" },
  { id: "drake", name: "용기사 드라크", rank: "A", job: "용기사", attack: 310, growth: 36, interval: 2, skill: "용의 돌진", skillMultiplier: 14, skillCooldown: 13, maxLevel: 80, cost: 44000, glyph: "용", hue: "#b4473d", description: "용의 힘을 빌려 전장을 관통한다" },
  { id: "zello", name: "슬라임 왕자 젤로", rank: "S", job: "몬스터", attack: 540, growth: 52, interval: 1, skill: "왕가의 분열", skillMultiplier: 18, skillCooldown: 10, maxLevel: 100, cost: 100000, glyph: "왕", hue: "#4daea0", description: "예측할 수 없는 왕가의 분열 공격" },
];

export const REGIONS = [
  { name: "초보자의 숲", monster: "고대 이끼 골렘", boss: "숲의 수호왕", hue: "forest" },
  { name: "메마른 황야", monster: "뿔 모래도마뱀", boss: "사막의 폭군", hue: "desert" },
  { name: "독안개 늪지", monster: "독버섯 괴수", boss: "늪의 마녀", hue: "swamp" },
  { name: "버려진 광산", monster: "수정 바위게", boss: "철갑 굴착수", hue: "mine" },
  { name: "얼어붙은 협곡", monster: "서리 설인", boss: "빙벽 거인", hue: "ice" },
  { name: "불타는 산맥", monster: "용암 사냥개", boss: "화산의 심장", hue: "volcano" },
  { name: "망자의 묘지", monster: "해골 파수꾼", boss: "묘지의 군주", hue: "grave" },
  { name: "마력 폭풍 지대", monster: "마력 포식자", boss: "폭풍 정령왕", hue: "storm" },
  { name: "마왕군 요새", monster: "흑철 수문장", boss: "마왕군 사령관", hue: "fort" },
  { name: "고대 용의 성역", monster: "용혈 수호자", boss: "태고의 천공룡", hue: "dragon" },
];

export function getStage(stage: number) {
  const safe = Math.max(1, Math.min(100, stage));
  const regionIndex = Math.floor((safe - 1) / 10);
  const localStage = ((safe - 1) % 10) + 1;
  const region = REGIONS[regionIndex];
  const boss = localStage === 10;
  const hp = Math.round(92 * Math.pow(1.175, safe - 1) * (boss ? 3.1 : 1));
  const gold = Math.round(26 * Math.pow(1.115, safe - 1) * (boss ? 2.5 : 1));
  const xp = Math.round(22 * Math.pow(1.09, safe - 1) * (boss ? 2 : 1));
  return {
    stage: safe,
    regionIndex,
    localStage,
    region,
    boss,
    hp,
    gold,
    xp,
    name: regionIndex === 0 ? beginnerForestMonsterName(localStage) : boss ? region.boss : region.monster,
  };
}

export function compactNumber(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toLocaleString("ko-KR");
}
