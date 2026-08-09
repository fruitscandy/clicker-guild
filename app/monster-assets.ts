export type MonsterMotion = "idle" | "hit" | "death";

type MonsterAsset = {
  id: string;
  name: string;
  source: string;
  scale?: number;
};

const BEGINNERS_FOREST_MONSTERS: MonsterAsset[] = [
  { id: "small-green-slime", name: "작은 초록 슬라임", source: "/assets/monsters/stage-01/stage-01-01-small-green-slime.png", scale: 0.88 },
  { id: "horned-rabbit", name: "뿔토끼", source: "/assets/monsters/stage-01/stage-01-02-horned-rabbit.png", scale: 0.9 },
  { id: "forest-rat", name: "숲쥐", source: "/assets/monsters/stage-01/stage-01-03-forest-rat.png", scale: 0.92 },
  { id: "young-goblin", name: "어린 고블린", source: "/assets/monsters/stage-01/stage-01-04-young-goblin.png" },
  { id: "stinger-bee", name: "독침벌", source: "/assets/monsters/stage-01/stage-01-05-stinger-bee.png", scale: 0.92 },
  { id: "vine-monster", name: "덩굴 괴물", source: "/assets/monsters/stage-01/stage-01-06-vine-monster.png", scale: 0.96 },
  { id: "goblin-thrower", name: "고블린 투척병", source: "/assets/monsters/stage-01/stage-01-07-goblin-thrower.png" },
  { id: "gray-wolf", name: "회색늑대", source: "/assets/monsters/stage-01/stage-01-08-gray-wolf.png", scale: 0.95 },
  { id: "forest-ogre", name: "숲 오우거", source: "/assets/monsters/stage-01/stage-01-09-forest-ogre.png", scale: 1.04 },
  { id: "goblin-chieftain-grukan", name: "고블린 족장 그루칸", source: "/assets/monsters/stage-01/stage-01-10-goblin-chieftain-grukan.png", scale: 1.08 },
];

const REGION_MONSTERS: Array<{ normal: MonsterAsset; boss: MonsterAsset }> = [
  {
    normal: { id: "horned-sand-lizard", name: "뿔 모래도마뱀", source: "/assets/monsters/region-02/region-02-normal-horned-sand-lizard.png", scale: 0.94 },
    boss: { id: "desert-tyrant", name: "사막의 폭군", source: "/assets/monsters/region-02/region-02-boss-desert-tyrant.png", scale: 1.08 },
  },
  {
    normal: { id: "poison-mushroom-beast", name: "독버섯 괴수", source: "/assets/monsters/region-03/region-03-normal-poison-mushroom-beast.png", scale: 0.93 },
    boss: { id: "swamp-witch", name: "늪의 마녀", source: "/assets/monsters/region-03/region-03-boss-swamp-witch.png", scale: 1.08 },
  },
  {
    normal: { id: "crystal-rock-crab", name: "수정 바위게", source: "/assets/monsters/region-04/region-04-normal-crystal-rock-crab.png", scale: 0.94 },
    boss: { id: "ironclad-excavator", name: "철갑 굴착수", source: "/assets/monsters/region-04/region-04-boss-ironclad-excavator.png", scale: 1.08 },
  },
  {
    normal: { id: "frost-yeti", name: "서리 설인", source: "/assets/monsters/region-05/region-05-normal-frost-yeti.png", scale: 0.95 },
    boss: { id: "icewall-giant", name: "빙벽 거인", source: "/assets/monsters/region-05/region-05-boss-icewall-giant.png", scale: 1.08 },
  },
  {
    normal: { id: "lava-hound", name: "용암 사냥개", source: "/assets/monsters/region-06/region-06-normal-lava-hound.png", scale: 0.94 },
    boss: { id: "heart-of-volcano", name: "화산의 심장", source: "/assets/monsters/region-06/region-06-boss-heart-of-volcano.png", scale: 1.08 },
  },
  {
    normal: { id: "skeleton-sentinel", name: "해골 파수꾼", source: "/assets/monsters/region-07/region-07-normal-skeleton-sentinel.png", scale: 0.94 },
    boss: { id: "graveyard-lord", name: "묘지의 군주", source: "/assets/monsters/region-07/region-07-boss-graveyard-lord.png", scale: 1.08 },
  },
  {
    normal: { id: "mana-devourer", name: "마력 포식자", source: "/assets/monsters/region-08/region-08-normal-mana-devourer.png", scale: 0.94 },
    boss: { id: "storm-spirit-king", name: "폭풍 정령왕", source: "/assets/monsters/region-08/region-08-boss-storm-spirit-king.png", scale: 1.08 },
  },
  {
    normal: { id: "black-iron-gatekeeper", name: "흑철 수문장", source: "/assets/monsters/region-09/region-09-normal-black-iron-gatekeeper.png", scale: 0.94 },
    boss: { id: "demon-army-commander", name: "마왕군 사령관", source: "/assets/monsters/region-09/region-09-boss-demon-army-commander.png", scale: 1.08 },
  },
  {
    normal: { id: "dragonblood-guardian", name: "용혈 수호자", source: "/assets/monsters/region-10/region-10-normal-dragonblood-guardian.png", scale: 0.96 },
    boss: { id: "ancient-sky-dragon", name: "태고의 천공룡", source: "/assets/monsters/region-10/region-10-boss-ancient-sky-dragon.png", scale: 1.12 },
  },
];

export function monsterAssetForStage(stage: number) {
  if (stage < 1 || stage > 100) return null;
  if (stage <= 10) return BEGINNERS_FOREST_MONSTERS[stage - 1];

  const regionIndex = Math.floor((stage - 1) / 10) - 1;
  const localStage = ((stage - 1) % 10) + 1;
  const region = REGION_MONSTERS[regionIndex];
  return localStage === 10 ? region.boss : region.normal;
}

export function beginnerForestMonsterName(localStage: number) {
  return BEGINNERS_FOREST_MONSTERS[Math.max(0, Math.min(9, localStage - 1))].name;
}
